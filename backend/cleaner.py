import spacy

#Load the English model
nlp = spacy.load("en_core_web_sm")

def clean_text(raw_text):
    #Processes the text through Nlp pipeline
    doc = nlp(raw_text.lower())

    #Remove stop words and punctuation, and lemmatize the tokens
    clean_tokens = [token.text for token in doc if not token.is_stop and not token.is_punct]

    #Join the tokens back into a single string
    return " ".join(clean_tokens)

if __name__ == "__main__":
    #Example usage
    sample= "I am a software engineer with experience in Python, Java, and C++. I have worked on various projects and have a strong background in machine learning."
    print(f"Original:{sample}")
    print(f"Cleaned:{clean_text(sample)}")