from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import shutil
import os

# Your other imports...
from backend.extractor import extract_text_from_pdf
from backend.cleaner import clean_text
from backend.matcher import get_match_score

# Import database models
from backend.database import SessionLocal, engine, Base, Candidate

# Create the SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS if needed (though not needed if serving from same origin)
from fastapi.middleware.cors import CORSMiddleware
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
    file: UploadFile = File(...), # Changed from List to a single File
    db: Session = Depends(get_db)
):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    raw_text = extract_text_from_pdf(temp_path)
    # Process text...
    score = get_match_score(clean_text(job_description), clean_text(raw_text))
    
    os.remove(temp_path)
    
    # Save candidate to Database
    db_candidate = Candidate(
        filename=file.filename, 
        job_description=job_description, 
        score=score
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    
    return {"id": db_candidate.id, "filename": db_candidate.filename, "score": score}

@app.get("/candidates")
async def get_all_candidates(db: Session = Depends(get_db)):
    # Return all previously ranked candidates so data persists across page refreshes
    return db.query(Candidate).all()

# Serve React Frontend in Production
frontend_dist = os.path.join(os.path.dirname(__dirname__), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    print("Warning: frontend/dist not found. Did you run 'npm run build'?")