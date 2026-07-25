# Project Brief: Intelligent Catch-All Document Vault

## One-liner
A web app that lets users dump any downloaded document (invoices, medical records, tickets, bills, ID proofs) into a single inbox, auto-OCRs and categorizes it with AI, and makes it findable later through natural-language search — instead of a folder hierarchy the user has to maintain.

## Problem it solves
Users download important files from browsers/email/messaging and never organize them. Result: lost documents, forgotten renewal/expiry dates, and no way to find "that electricity bill from March" without manually opening files one by one.

## Scope for this build (v1 / MVP)
This brief targets **Phase 1: the web app only** (Next.js + Supabase). Mobile (React Native/Expo), the OS share-sheet integration, and the inbound email bridge are explicitly **out of scope for v1** — the backend should be built so they can be added later without rework, but do not build them now.

---

## Core user flow
1. User signs up / logs in.
2. User drags a file (or batch of files) onto the dashboard, or picks them via a file selector.
3. File uploads immediately; UI shows it as "Processing" and returns instantly (no blocking on OCR/AI).
4. In the background: OCR extracts text → LLM categorizes + extracts structured metadata + writes a 2-sentence summary → an embedding is generated and stored.
5. Once processing finishes, the document card updates in place (no page reload) showing: auto-generated title, category badge, summary, and key extracted fields.
6. User can search in plain English ("how much was my electricity bill last month") and get relevant documents ranked by semantic similarity, or use filter chips (PDFs / Images / Expiring Soon / Added This Week / Starred).
7. If a document has a detected expiry/due date, the system tracks it and can alert the user before it lapses.
8. Documents in the Identity or Financial categories require a step-up re-authentication before they can be opened.

---

## Feature list (v1)

### Intake
- Drag-and-drop upload zone + batch file picker, responsive for mobile browsers.
- Upload endpoint returns a `job_id` instantly; processing happens async in a background worker/queue.

### AI extraction (all server-side, behind the API layer — never called directly from the frontend)
- OCR: converts PDFs/images to clean text.
- Auto-categorization into: Tax, Medical, Utility, Travel, Receipts, Identity — enforced via structured/JSON-mode LLM output, not free-text parsing.
- Auto-renaming: `IMG_0098.pdf` → `ICICI_Bank_Statement_Jan2026.pdf`.
- Type-specific metadata extraction:
  - Receipts/Invoices → vendor, total amount, transaction date, tax category
  - Utility bills → due date, account number, minimum payable, billing period
  - Tickets/travel → flight/train time, gate, confirmation code, PNR
- 2-sentence auto-summary for preview without opening the file.

### Search & retrieval
- Semantic vector search over document summaries (pgvector), natural-language queries.
- Filter chips: PDFs, Images, Expiring Soon, Added This Week, Starred.
- (Stretch, if time allows) simple chat-style Q&A over stored document metadata.

### Utilities & security
- Expiration/deadline tracking with email alerts before due dates.
- Deduplication: client computes a SHA-256 hash for a fast pre-check, but the **server re-verifies the hash against the stored object** before treating anything as a duplicate — never trust the client hash alone.
- Step-up re-authentication (password re-entry or WebAuthn) gating the Identity and Financial categories — there is no Face ID/Fingerprint on web, so don't attempt to fake one.
- Malware/content-safety scan on every upload before OCR touches the file.

---

## Fixed technical decisions (don't leave these open-ended)
- **Frontend:** Next.js (App Router) + Tailwind CSS.
- **Backend:** Next.js API routes only — pages must never query Supabase directly; all DB/AI/storage access goes through `/api/*` routes so this stays swappable for a future mobile client.
- **Database/Auth/Storage:** Supabase (PostgreSQL + pgvector + Row Level Security + Supabase Storage).
- **AI provider:** pick one (OpenAI or Gemini) and use it for OCR-assist, categorization, summarization, AND embeddings — don't mix providers, since re-processing the whole library later is expensive.
- **Embedding model:** must be named explicitly once chosen (e.g. `text-embedding-3-small`, 1536 dims) — this is a schema decision, not a runtime config.
- **Auth:** Supabase Auth, JWT bearer tokens, HTTP-only cookies on web.
- **Pagination:** all list endpoints use cursor/offset pagination (`?page=1&limit=20`) from day one, even before it's needed at scale.

## Minimum API surface
```
POST   /api/documents/upload      -> { job_id }
GET    /api/documents/jobs/:id    -> job status (pending/processing/done/failed)
GET    /api/documents             -> paginated list, supports filter params
GET    /api/documents/:id         -> single document + metadata
POST   /api/search                -> { query } -> ranked semantic results
DELETE /api/documents/:id
```

## Data model (minimum tables)
- `documents` — id, user_id, storage_path, original_filename, generated_filename, category, summary, extracted_metadata (jsonb), file_hash, status, expiry_date, created_at
- `document_embeddings` — document_id, embedding (vector), model_name
- `processing_jobs` — id, document_id, status, error, created_at, completed_at
- All tables use Supabase RLS scoped to `user_id = auth.uid()`.

## Explicit non-goals for v1
- No mobile app / React Native build yet.
- No inbound email bridge.
- No multi-user/shared vaults — one vault per user account only.
- No "chat with your vault" full conversational agent required for MVP (nice-to-have if time permits).

## Definition of done for v1
- A user can sign up, drop a file, see it get auto-categorized and summarized without manual input, search for it in plain English, and get an expiry alert if it has a due date — and a duplicate upload is caught by server-side hash check even if the client is bypassed.
