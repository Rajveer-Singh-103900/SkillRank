<div align="center">

# SkillRank AI

### Next-Generation Resume Screening & Candidate Ranking Engine

[![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

**SkillRank AI** is a full-stack intelligent resume screening tool that automatically scores and ranks candidates by comparing their PDF resumes against a provided job description using NLP and machine learning techniques.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Data Structures & Algorithms](#data-structures--algorithms)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker](#docker)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Overview

SkillRank AI is designed to help recruiters and hiring managers cut through resume overload. Rather than manually reviewing every application, users paste a job description, upload one or more PDF resumes, and SkillRank's AI pipeline instantly assigns each candidate a **match score (0–100%)** and displays a live-updating ranked leaderboard.

All results are persisted in a local SQLite database, so the leaderboard survives page refreshes and can be built incrementally over multiple sessions.

---

## Features

| Feature | Description |
|---|---|
| 📄 **PDF Resume Parsing** | Extracts raw text from uploaded PDF files using `pdfplumber` |
| 🧹 **NLP Text Cleaning** | Tokenises, lemmatises, and removes stop-words with spaCy |
| 🤖 **AI Match Scoring** | Calculates cosine similarity between TF-IDF vectors of the JD and resume |
| 🏆 **Live Leaderboard** | Candidates ranked in real-time using a Max-Heap algorithm |
| 🔍 **Binary Search** | Instantly locate any candidate by filename on the leaderboard |
| 💾 **Persistent Storage** | Results saved to SQLite — survives page refreshes |
| 🗑️ **Leaderboard Reset** | One-click clear to start a fresh screening session |
| 🎨 **Premium Dark UI** | Smooth animations via Framer Motion on a dark glassmorphism interface |
| 🐳 **Docker Ready** | Single-command containerised build for Hugging Face Spaces (port 7860) |
| ☁️ **Render Deployable** | `render.yaml` for zero-config deployment on Render |

---

## Tech Stack

### Backend
| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.104.1 | REST API framework |
| Uvicorn | 0.24.0 | ASGI web server |
| SQLAlchemy | 2.0.23 | ORM & database abstraction |
| SQLite | built-in | Persistent candidate storage |
| pdfplumber | 0.11.4 | PDF text extraction |
| spaCy | 3.7.2 | NLP pipeline (tokenisation, lemmatisation) |
| en_core_web_sm | 3.7.1 | English spaCy model |
| scikit-learn | 1.3.2 | TF-IDF vectorisation & cosine similarity |
| python-multipart | 0.0.6 | Multipart form / file upload handling |

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 4.4 | Build tool & dev server |
| TailwindCSS | 3.4 | Utility-first styling |
| Framer Motion | 10.16 | Animations and layout transitions |
| Axios | 1.6 | HTTP client |
| react-dropzone | 14.2 | Drag-and-drop file upload |
| lucide-react | 0.292 | Icon library |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ Job Description│  │     Candidate Leaderboard        │  │
│  │  (textarea)  │  │  (Max-Heap sorted, animated)     │  │
│  └──────────────┘  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │        PDF Drag & Drop  /  File Upload           │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │  HTTP (multipart/form-data)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 FastAPI Backend                          │
│                                                         │
│  POST /rank-resumes                                     │
│   1. pdfplumber  →  raw text extraction                 │
│   2. spaCy       →  text cleaning & lemmatisation       │
│   3. TF-IDF + cosine similarity  →  match score (%)    │
│   4. SQLAlchemy  →  save result to SQLite               │
│   5. Return  { id, filename, score }                    │
│                                                         │
│  GET  /candidates   →  load all ranked candidates       │
│  DELETE /candidates →  clear leaderboard                │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  skillrank.db  │
                  │   (SQLite)    │
                  └───────────────┘
```

---

## Project Structure

```
SkillRank/
│
├── backend/                    # Python / FastAPI service
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, routes, static file serving
│   ├── extractor.py            # PDF → raw text (pdfplumber)
│   ├── cleaner.py              # NLP preprocessing (spaCy)
│   ├── matcher.py              # TF-IDF + cosine similarity scoring
│   ├── ranking.py              # Max-heap ranking utility
│   └── database.py             # SQLAlchemy models & session factory
│
├── frontend/                   # React / Vite SPA
│   ├── src/
│   │   ├── App.jsx             # Root component & page layout
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # Global styles / Tailwind directives
│   │   └── components/
│   │       └── Dashboard.jsx   # Core UI: upload, leaderboard, search
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── Dockerfile                  # Production container (Hugging Face Spaces)
├── render.yaml                 # Render.com deployment config
├── build.sh                    # CI/CD build script
├── requirements.txt            # Python dependencies
├── test_api.py                 # Basic API smoke test
└── README.md
```

---

## How It Works

### Step-by-Step Pipeline

```
User uploads resume PDF  +  pastes Job Description
            │
            ▼
  ┌─────────────────────┐
  │  1. PDF Extraction  │  pdfplumber reads every page and returns raw text
  └────────┬────────────┘
           │
           ▼
  ┌─────────────────────┐
  │  2. Text Cleaning   │  spaCy pipeline:
  │                     │   • Lowercase
  │                     │   • Remove stop-words & punctuation
  │                     │   • Lemmatise each token
  └────────┬────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │  3. TF-IDF Vectorisation        │  Both the cleaned JD and cleaned
  │     + Cosine Similarity         │  resume are converted to TF-IDF
  │                                 │  vectors; cosine similarity gives
  │                                 │  a 0–100 % match score
  └────────┬────────────────────────┘
           │
           ▼
  ┌─────────────────────┐
  │  4. Persist to DB   │  Candidate record (filename, JD, score)
  │     (SQLite)        │  saved via SQLAlchemy
  └────────┬────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │  5. Max-Heap Ranking (frontend) │  All candidates are pushed into a
  │                                 │  Max-Heap; popped in order to build
  │                                 │  the ranked leaderboard
  └─────────────────────────────────┘
```

### Match Score Interpretation

| Score Range | Label | Meaning |
|---|---|---|
| **80 – 100%** | 🟢 Strong Match | Resume closely matches the JD — high priority |
| **60 – 79%** | 🟡 Moderate Match | Several relevant skills present — worth reviewing |
| **0 – 59%** | 🔴 Weak Match | Limited overlap with the JD |

---

## Data Structures & Algorithms

SkillRank deliberately showcases classic CS concepts within a real product:

### Max-Heap — Candidate Ranking
Both the Python backend (`backend/ranking.py` using `heapq`) and the React frontend (`Dashboard.jsx`) implement a Max-Heap to extract candidates in descending score order in **O(n log n)** time.

```python
# Python backend (ranking.py)
heapq.heappush(heap, (-score, name))   # negate score for max-heap behaviour
neg_score, name = heapq.heappop(heap)
```

```js
// JavaScript frontend (Dashboard.jsx)
class MaxHeap {
  push(val) { ... bubbleUp ... }
  pop()     { ... sinkDown ... }
}
```

### Binary Search — Candidate Lookup
The leaderboard search bar uses binary search on a name-sorted copy of the candidates array, achieving **O(log n)** lookup for any candidate by filename.

```js
const binarySearchByName = (arr, targetName) => {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid].filename.toLowerCase().includes(target)) return arr[mid];
    arr[mid].filename.toLowerCase() < target ? left = mid + 1 : right = mid - 1;
  }
  return null;
};
```

### TF-IDF + Cosine Similarity — AI Matching
`scikit-learn`'s `TfidfVectorizer` converts the job description and resume into high-dimensional numeric vectors. Cosine similarity between the two vectors produces a score that is independent of document length.

---

## API Reference

Base URL: `http://localhost:7860` (production) · `http://localhost:8000` (local dev)

### `POST /rank-resumes`
Upload a single PDF resume and score it against a job description.

**Request** — `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `job_description` | `string` | The target job description or required skills |
| `file` | `file` (PDF) | The candidate's resume in PDF format |

**Response** — `200 OK`
```json
{
  "id": 1,
  "filename": "john_doe_resume.pdf",
  "score": 78.43
}
```

**Error Responses**
| Code | Reason |
|---|---|
| `400` | PDF is image-based or contains no extractable text |
| `500` | Backend processing error or database failure |

---

### `GET /candidates`
Retrieve all previously ranked candidates.

**Response** — `200 OK`
```json
[
  { "id": 1, "filename": "alice.pdf", "job_description": "...", "score": 91.2 },
  { "id": 2, "filename": "bob.pdf",   "job_description": "...", "score": 65.8 }
]
```

---

### `DELETE /candidates`
Clear all candidates from the database (leaderboard reset).

**Response** — `200 OK`
```json
{ "message": "All candidates cleared successfully" }
```

---

## Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+

---

### Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/Rajveer-Singh-103900/SkillRank.git
cd SkillRank
```

#### 2. Set up the Python backend

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install Python dependencies (includes spaCy model)
pip install -r requirements.txt
```

#### 3. Build the React frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

#### 4. Start the server

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

> **Frontend Hot-Reload (optional)**
> For live frontend development, run the Vite dev server in a separate terminal:
> ```bash
> cd frontend
> npm run dev   # runs on http://localhost:5173 with proxy to :8000
> ```

---

### Docker

Build and run the entire application (backend + frontend) as a single container:

```bash
# Build the image
docker build -t skillrank .

# Run the container
docker run -p 7860:7860 skillrank
```

Open [http://localhost:7860](http://localhost:7860).

---

## Deployment

### Render

The repository includes a `render.yaml` for one-click deployment to [Render](https://render.com):

1. Connect your GitHub repository to Render.
2. Render detects `render.yaml` automatically.
3. The `build.sh` script installs dependencies and builds the frontend.
4. The service starts with `uvicorn backend.main:app`.

### Hugging Face Spaces

The `Dockerfile` is pre-configured for Hugging Face Spaces (exposes port **7860**):

1. Create a new **Docker** Space on Hugging Face.
2. Push this repository to the Space's Git remote.
3. Hugging Face builds and serves the container automatically.

---

## Screenshots

> *UI running in production — dark glassmorphism theme*

| Upload & Job Description | Candidate Leaderboard |
|---|---|
| Paste a job description and drag & drop PDF resumes | Candidates ranked live by AI match score with colour-coded badges |

---

<div align="center">

Built with ❤️ by [Rajveer Singh](https://github.com/Rajveer-Singh-103900)

</div>
