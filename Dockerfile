FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install curl and Node.js for building the React frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Copy Python requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files into the container
COPY . .

# Build the React frontend
RUN cd frontend && npm install && npm run build

# Make sure the app directory is writable so SQLite can create the database
RUN chmod -R 777 /app

# Expose port 7860 which is required by Hugging Face Spaces
EXPOSE 7860

# Run the FastAPI server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
