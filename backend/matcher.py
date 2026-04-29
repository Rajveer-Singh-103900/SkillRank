from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def get_match_score(job_desc, resume_text):
    # Convert text into numbers (vectors)
    try:
        vectors = TfidfVectorizer().fit_transform([job_desc, resume_text])
        # Calculate how similar the two vectors are
        score = cosine_similarity(vectors[0:1], vectors[1:2])
        # Return as a percentage
        return round(score[0][0] * 100, 2)
    except ValueError:
        # Handle cases where the text is empty or only contains stop words
        return 0.0

if __name__ == "__main__":
    job = "Software Engineer with Python and FastAPI skills."
    resume = "Experienced Python developer familiar with FastAPI and web apps."
    
    print(f"Match Score: {get_match_score(job, resume)}%")