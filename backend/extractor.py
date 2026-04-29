import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file. Raises an exception on failure instead of returning an error string."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        page_text = page.get_text()
        if page_text:
            text += page_text
    doc.close()
    return text.strip()


if __name__ == "__main__":
    content = extract_text_from_pdf("test_resume.pdf")
    print(content[:500])