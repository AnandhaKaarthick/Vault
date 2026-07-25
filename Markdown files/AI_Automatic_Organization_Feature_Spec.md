# Feature Specification: AI & Automatic Organization

**Project:** Intelligent Catch-All Document Vault (100% On-Device AI Execution)

---

## 1. Architectural Overview

The **AI & Automatic Organization Module** is designed specifically for an On-Device Local Execution Architecture (Option A). This module converts raw, unstructured document scans into clean, structured, and searchable data locally on the user's phone without transmitting data to an external cloud server.

> **Core Value Proposition:** By processing OCR and text parsing entirely on-device, the system achieves zero ongoing server operating costs, absolute user data privacy, instant offline availability, and robust operation even in airplane mode.

---

## 2. On-Device Execution Pipeline

The complete end-to-end local processing lifecycle follows a 5-step event-driven workflow:

| Step | Name | Description |
|---|---|---|
| 1 | **File Ingestion** | Receives incoming file payloads from native share sheet intents or direct image capture. |
| 2 | **On-Device OCR Processing** | Leverages Google ML Kit Text Recognition to extract line blocks via hardware acceleration. |
| 3 | **Text Normalization & Sanitization** | Strips visual noise, duplicate spacing, and unnecessary headers to prepare clean prompt payloads. |
| 4 | **Local SLM Inference** | Executes local inference using MediaPipe + Quantized Gemma 2B model to parse key entities into strict JSON structures. |
| 5 | **Database Commit** | Validates output schema, applies regex fallbacks if necessary, and writes to local SQLite / WatermelonDB. |

---

## 3. Core Sub-Feature Specifications

### 3.1 On-Device OCR Text Extraction

- **Technology Stack:** Powered by Google ML Kit Text Recognition API running natively via hardware acceleration on iOS and Android.
- **Execution Mode:** Extracts raw text coordinates and block structures directly on the device's GPU/Neural Processing Unit (NPU).
- **Layout Preservation:** Preserves physical line breaks and basic spatial relationships, critical for multi-column documents like utility bills or receipts.

### 3.2 Zero-Setup Auto-Categorization

Documents are automatically categorized into one of 8 pre-defined master categories without requiring user-configured folder rules:

1. **Tax** — Returns, Form 16, payment challans, tax investment proofs.
2. **Financial & Bank** — Account statements, credit card bills, bank deposit receipts.
3. **Identity & Official** — Aadhaar, PAN card, passport, driving license, voter ID.
4. **Utility & Bills** — Electricity, water, broadband, gas, mobile bills.
5. **Travel & Tickets** — Flight bookings, train tickets, boarding passes, hotel reservations.
6. **Medical & Health** — Lab reports, doctor prescriptions, health insurance policies.
7. **Receipts & Invoices** — Retail purchases, online shopping invoices, warranty cards.
8. **Other / Unsorted** — Fallback category for non-standard or generic text assets.

### 3.3 Smart Auto-Renaming Engine

Replaces non-descriptive system filenames (e.g., `IMG_9482.pdf`, `Scan_2026.pdf`) with standardized naming conventions:

**Standard Pattern:**
```
[Vendor_or_Issuer]_[Document_Type]_[Period/Date].[ext]
```

| Original Filename | Renamed To |
|---|---|
| `IMG_0029.pdf` | `TNEB_Electricity_Bill_May2026.pdf` |
| `Download.pdf` | `HDFC_Bank_Statement_Q1_2026.pdf` |
| `Doc_8392.jpg` | `IndiGo_BoardingPass_DEL_MAA.pdf` |

### 3.4 Targeted Entity Extraction (Metadata Schema)

The small language model executes targeted key-value extraction based on document category:

| Category | Extracted Fields |
|---|---|
| **Receipts & Invoices** | Merchant/Vendor Name, Total Transaction Amount, Currency, Payment Method, Invoice ID |
| **Utility & Recurring Bills** | Provider Name, Bill Due Date (YYYY-MM-DD), Amount Due, Account/Consumer Number |
| **Travel & Tickets** | Transit Type (Flight/Train/Bus), Passenger Name, Departure Date & Time, PNR Code, Gate/Seat |

### 3.5 Local AI Summarization & Fallback Handling

- **2-Sentence Synopsis:** Generates a short 2-sentence synopsis stored directly in the local database for rapid preview cards.
- **Schema Validation:** Strips markdown formatting tags and verifies JSON syntax before local database insertion.
- **Deterministic Regex Fallback:** If the local AI output fails syntax checks, the pipeline automatically falls back to regex pattern matching for dates, currency values, and keyword identifiers to prevent lost files.

---

## 4. Structured JSON Payload Example

Below is the exact structured payload format produced by the local AI engine and written to the SQLite database:

```json
{
  "category": "Utility",
  "vendor_or_issuer": "TNEB",
  "suggested_filename": "TNEB_Electricity_Bill_June2026.pdf",
  "metadata": {
    "total_amount": 1840.00,
    "currency": "INR",
    "document_date": "2026-06-15",
    "expiration_or_due_date": "2026-07-02",
    "account_number": "04-128-092-11"
  },
  "summary": "Monthly TNEB electricity bill for June 2026. Total payable amount is ₹1,840 due on July 02, 2026.",
  "tags": ["Electricity", "Utility", "Bill", "June2026"]
}
```

---

## 5. Implementation Checklist

- [ ] Set up native share-sheet intent and image-capture ingestion handlers (Step 1)
- [ ] Integrate Google ML Kit Text Recognition for on-device OCR (Step 2)
- [ ] Build text normalization/sanitization utility to strip noise before prompting (Step 3)
- [ ] Set up MediaPipe + Quantized Gemma 2B for local SLM inference (Step 4)
- [ ] Define strict JSON schema for the 8 master categories and their metadata fields (Section 3.2, 3.4)
- [ ] Implement Smart Auto-Renaming Engine using the `[Vendor_or_Issuer]_[Document_Type]_[Period/Date].[ext]` pattern (Section 3.3)
- [ ] Implement JSON schema validation + markdown-stripping pass before DB insertion (Section 3.5)
- [ ] Implement deterministic regex fallback (dates, currency, keywords) for failed AI parses (Section 3.5)
- [ ] Wire schema-validated output to SQLite / WatermelonDB commit (Step 5)
- [ ] Test end-to-end pipeline in airplane mode / fully offline
