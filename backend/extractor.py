import pdfplumber


def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file using pdfplumber (pure Python, no C compilation needed)."""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


if __name__ == "__main__":
    content = extract_text_from_pdf("test_resume.pdf")
    print(content[:500])