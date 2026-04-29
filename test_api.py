import requests
import sys

try:
    with open("test_upload.pdf", "wb") as f:
        f.write(b"%PDF-1.4\n%EOF\n")

    files = {'file': ('test_upload.pdf', open('test_upload.pdf', 'rb'), 'application/pdf')}
    data = {'job_description': 'Software Engineer with Python skills'}
    
    print("Sending request to http://127.0.0.1:8000/rank-resumes")
    response = requests.post("http://127.0.0.1:8000/rank-resumes", files=files, data=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"Test failed: {e}")
