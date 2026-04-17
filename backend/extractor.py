import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    content = extract_text_from_pdf("test_resume.pdf")
    print(content[:500])