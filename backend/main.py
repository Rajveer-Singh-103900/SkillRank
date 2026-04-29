import os
import shutil
import uuid
import traceback

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.extractor import extract_text_from_pdf
from backend.cleaner import clean_text
from backend.matcher import get_match_score
from backend.database import SessionLocal, engine, Base, Candidate

# Create the SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/rank-resumes")
async def rank_resumes(
    job_description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    temp_path = f"temp_{uuid.uuid4().hex}.pdf"
    try:
        # Save the uploaded file to a temp location
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text from PDF
        raw_text = extract_text_from_pdf(temp_path)

        # Validate extraction succeeded
        if not raw_text or not raw_text.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Could not extract any text from '{file.filename}'. The PDF may be image-based or empty.",
            )

        # Clean both texts
        cleaned_jd = clean_text(job_description)
        cleaned_resume = clean_text(raw_text)

        # Compute match score (handles empty-after-cleaning gracefully)
        score = float(get_match_score(cleaned_jd, cleaned_resume))

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backend Error: {repr(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    # Save candidate to Database
    try:
        db_candidate = Candidate(
            filename=file.filename,
            job_description=job_description,
            score=score,
        )
        db.add(db_candidate)
        db.commit()
        db.refresh(db_candidate)
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database Error: {repr(e)}")

    return {"id": db_candidate.id, "filename": db_candidate.filename, "score": score}


@app.get("/candidates")
async def get_all_candidates(db: Session = Depends(get_db)):
    # Return all previously ranked candidates so data persists across page refreshes
    return db.query(Candidate).all()


@app.delete("/candidates")
async def clear_all_candidates(db: Session = Depends(get_db)):
    # Clear all candidates for demo reset purposes
    db.query(Candidate).delete()
    db.commit()
    return {"message": "All candidates cleared successfully"}


# Serve React Frontend in Production
_this_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dist = os.path.join(os.path.dirname(_this_dir), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    print(f"Warning: frontend/dist not found at {frontend_dist}. Did you run 'npm run build'?")