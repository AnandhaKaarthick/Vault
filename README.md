# Intelligent Catch-All Document Vault (DocVault)

DocVault is an AI-powered document vault built with **React.js (Vite)** on the frontend and **Python (FastAPI)** on the backend. It leverages **NVIDIA Developer Platform NIM APIs** (`meta/llama-3.2-11b-vision-instruct` + `google/gemma-2-9b-it`) for OCR, auto-categorization, metadata extraction, auto-renaming, and vector embeddings, backed by **Supabase** (PostgreSQL + `pgvector`).

---

## 🚀 Quick Start Guide

### 1. Backend Setup (Python FastAPI)

1. Open terminal and navigate to the root directory:
   ```bash
   cd mobdocsto
   ```

2. Create a Python virtual environment (optional but recommended):
   ```bash
   python -m venv venv`
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   *The backend API will run at `http://localhost:8000` (Docs available at `http://localhost:8000/docs`).*

---

### 2. Frontend Setup (React.js + Vite)

1. Open a second terminal window and navigate to the `frontend/` directory:
   ```bash
   cd mobdocsto/frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The React app will open at `http://localhost:5173`.*

---

## 🔑 Environment Configuration (Optional)

Create a `.env` file in the root workspace or in `backend/`:

```env
# NVIDIA Developer Platform Key (https://build.nvidia.com)
NVIDIA_API_KEY=nvapi-your-key-here

# Supabase Credentials (optional - app automatically uses local in-memory fallback if omitted)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
```

*Note: If no API key is provided, DocVault runs seamlessly using its built-in offline smart extraction engine for local development testing!*

---

## 🛡️ Key Features Implemented

- **Drag-and-Drop Batch Upload:** Responsive upload zone with instant `{ job_id }` response.
- **Server-Side SHA-256 Deduplication:** Computes file hashes server-side to detect duplicates even if client is bypassed.
- **NVIDIA NIM Multimodal AI:** Performs vision OCR, JSON schema categorization into `Tax`, `Medical`, `Utility`, `Travel`, `Receipts`, `Identity`, and `General`, auto-renaming, and 2-sentence summarization.
- **Plain-English Semantic Search:** Vector similarity search over document embeddings.
- **Step-Up Security PIN:** 4-digit PIN modal protection for sensitive `Identity` and `Financial` categories (Default PIN: `1234`).
- **Expiration Alerts:** Dashboard banner notifications & "Expiring Soon" filter chip.
