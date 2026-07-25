# 🛡️ DocVault AI — Smart Document Vault & Student Academic Hub

**DocVault AI** is a full-stack, AI-powered document intake, auto-organization, vector search, and academic asset management system. It leverages **NVIDIA NIM Multimodal Vision & Text Models** (`meta/llama-3.2-11b-vision-instruct` + `google/gemma-2-2b-it`) and **1024-dimensional Vector Embeddings** (`nvidia/llama-3.2-nv-embedqa-1b-v2`) backed by **Supabase PostgreSQL (`pgvector`)** and an **Offline Deterministic Fallback Engine**.

---

## 🔥 Key Technical Highlights

- **🧠 Multimodal AI Vision OCR:** Multi-stage image restoration (auto-contrast histogram expansion, unsharp masking, edge sharpening) prior to vision OCR.
- **🎓 Student Academic Hub:** Differentiates Hall Tickets / Admit Cards vs Marksheets / Transcripts, attaches subject sub-tagging (`#ComputerScience`, `#Physics`, `#Mathematics`), and generates 2-sentence executive study summaries.
- **🏷️ Smart Relative Auto-Renaming & Format Lock:** Auto-converts opaque codes (*e.g., `NOC26CS84S385800358.pdf` ➔ `NPTEL_ComputerScience_HallTicket_2026.pdf`*) while strictly preserving 100% original file extensions & binary streams.
- **⚡ Plain-English Vector RAG Search:** 1024-dim cosine similarity vector search over document content, summaries, and tags.
- **🔐 Step-Up Security PIN Auth:** PBKDF2-HMAC-SHA256 (100,000 iterations) with constant-time digest comparison (`hmac.compare_digest`) for sensitive financial, tax, and identity documents.
- **⚙️ Offline Fallback Engine:** Fully operational without API keys using deterministic regex classification and local vector similarity.

---

## 🏗️ Master Category Hierarchy (10 Categories)

1. `Academic & Marksheets` (Hall Tickets, Marksheets, Lecture Notes)
2. `Certificates & Courses` (Internship Certificates, Coursera/NPTEL, Achievements)
3. `Tax` (ITR, Form 16, Assessment Records)
4. `Financial & Bank` (Bank Statements, Pay Stubs, Credit Ledger)
5. `Identity & Official` (Aadhaar, Passport Photos, Specimen Signatures)
6. `Utility & Bills` (Electricity, Broadband, Water)
7. `Travel & Tickets` (Flight Bookings, Train Tickets, PNR Records)
8. `Medical & Health` (Lab Reports, Doctor Prescriptions)
9. `Receipts & Invoices` (Retail Store Receipts, Amazon/Flipkart Invoices)
10. `Other / Unsorted`

---

## 🚀 Quick Start Guide

### 1. Backend Setup (Python FastAPI)

1. Open terminal and navigate to the project directory:
   ```bash
   cd mobdocsto
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   *Backend API runs at `http://localhost:8000` (Interactive Swagger Docs at `http://localhost:8000/docs`).*

---

### 2. Frontend Setup (React.js + Vite)

1. Open a second terminal window and navigate to `frontend/`:
   ```bash
   cd mobdocsto/frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   *React Web App opens at `http://localhost:5173`.*

---

## 🔑 Environment Configuration

Create a `.env` file in `backend/` or workspace root:

```env
# NVIDIA NIM APIs
NVIDIA_API_KEY=your_nvidia_nim_api_key

# Supabase PostgreSQL + pgvector
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_role_key
```

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React.js, Modern Responsive Glassmorphism Design System, Lucide Icons, Canvas PDF Renderer
- **Backend:** Python 3.10+, FastAPI, PyPDF, Pillow (PIL), HTTPX
- **Database:** Supabase PostgreSQL + `pgvector` (Vector Dimension: 1024)
- **AI Infrastructure:** NVIDIA Developer Platform NIM APIs
- **Cryptography:** PBKDF2-HMAC-SHA256 (100,000 iterations)
