import os
import io
import json
import base64
import re
import math
import hashlib
import datetime
from typing import Dict, Any, List, Optional
import httpx
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from backend.config import (
    NVIDIA_API_KEY,
    NVIDIA_API_BASE,
    NVIDIA_VISION_MODEL,
    NVIDIA_TEXT_MODEL
)

try:
    import pypdf
except ImportError:
    pypdf = None

CATEGORIES = [
    "Academic & Marksheets",
    "Certificates & Courses",
    "Tax",
    "Financial & Bank",
    "Identity & Official",
    "Utility & Bills",
    "Travel & Tickets",
    "Medical & Health",
    "Receipts & Invoices",
    "Other / Unsorted"
]

# Smart Fuzzy Category Mapping
CATEGORY_MAP = {
    # Academic & Marksheets
    "academic & marksheets": "Academic & Marksheets",
    "academic": "Academic & Marksheets",
    "marksheet": "Academic & Marksheets",
    "mark sheet": "Academic & Marksheets",
    "grade card": "Academic & Marksheets",
    "grade sheet": "Academic & Marksheets",
    "transcript": "Academic & Marksheets",
    "diploma": "Academic & Marksheets",
    "degree": "Academic & Marksheets",
    "scorecard": "Academic & Marksheets",
    "score card": "Academic & Marksheets",
    "markcard": "Academic & Marksheets",
    "hall ticket": "Academic & Marksheets",
    "admit card": "Academic & Marksheets",
    "fee receipt": "Academic & Marksheets",
    "tuition fee": "Academic & Marksheets",
    "bonafide": "Academic & Marksheets",
    "semester": "Academic & Marksheets",
    "examination": "Academic & Marksheets",
    "university": "Academic & Marksheets",
    "board": "Academic & Marksheets",
    "school": "Academic & Marksheets",
    "college": "Academic & Marksheets",
    "cgpa": "Academic & Marksheets",
    "percentage": "Academic & Marksheets",
    "cbse": "Academic & Marksheets",
    "sslc": "Academic & Marksheets",
    "hsc": "Academic & Marksheets",
    "neet": "Academic & Marksheets",
    "jee": "Academic & Marksheets",
    "gate": "Academic & Marksheets",
    "notes": "Academic & Marksheets",
    "lecture": "Academic & Marksheets",

    # Certificates & Courses
    "certificates & courses": "Certificates & Courses",
    "certificates": "Certificates & Courses",
    "courses": "Certificates & Courses",
    "internship": "Certificates & Courses",
    "coursera": "Certificates & Courses",
    "nptel": "Certificates & Courses",
    "udemy": "Certificates & Courses",
    "edx": "Certificates & Courses",
    "hackathon": "Certificates & Courses",
    "workshop": "Certificates & Courses",
    "certification": "Certificates & Courses",
    "course certificate": "Certificates & Courses",
    "achievement": "Certificates & Courses",
    "completion certificate": "Certificates & Courses",
    "extracurricular": "Certificates & Courses",
    "award": "Certificates & Courses",
    "contest": "Certificates & Courses",
    "webinar": "Certificates & Courses",

    # Tax
    "tax": "Tax",
    "itr": "Tax",
    "income tax": "Tax",
    "form 16": "Tax",
    "form16": "Tax",
    "challan": "Tax",
    "assessment": "Tax",

    # Financial & Bank
    "financial & bank": "Financial & Bank",
    "financial": "Financial & Bank",
    "bank": "Financial & Bank",
    "statement": "Financial & Bank",
    "bank statement": "Financial & Bank",
    "credit card": "Financial & Bank",
    "debit card": "Financial & Bank",
    "account": "Financial & Bank",
    "salary": "Financial & Bank",
    "pay stub": "Financial & Bank",

    # Identity & Official
    "identity & official": "Identity & Official",
    "identity": "Identity & Official",
    "official": "Identity & Official",
    "photo": "Identity & Official",
    "passport photo": "Identity & Official",
    "portrait": "Identity & Official",
    "profile photo": "Identity & Official",
    "picture": "Identity & Official",
    "face": "Identity & Official",
    "signature": "Identity & Official",
    "sign": "Identity & Official",
    "autograph": "Identity & Official",
    "specimen signature": "Identity & Official",
    "aadhaar": "Identity & Official",
    "pan": "Identity & Official",
    "passport": "Identity & Official",
    "license": "Identity & Official",
    "licence": "Identity & Official",
    "driving": "Identity & Official",
    "voter": "Identity & Official",
    "id card": "Identity & Official",

    # Utility & Bills
    "utility & bills": "Utility & Bills",
    "utility": "Utility & Bills",
    "bills": "Utility & Bills",
    "bill": "Utility & Bills",
    "electricity": "Utility & Bills",
    "water": "Utility & Bills",
    "broadband": "Utility & Bills",
    "wifi": "Utility & Bills",
    "gas": "Utility & Bills",
    "power": "Utility & Bills",
    "mobile bill": "Utility & Bills",

    # Travel & Tickets
    "travel & tickets": "Travel & Tickets",
    "travel": "Travel & Tickets",
    "tickets": "Travel & Tickets",
    "ticket": "Travel & Tickets",
    "flight": "Travel & Tickets",
    "boarding": "Travel & Tickets",
    "boarding pass": "Travel & Tickets",
    "train": "Travel & Tickets",
    "irctc": "Travel & Tickets",
    "hotel": "Travel & Tickets",
    "pnr": "Travel & Tickets",

    # Medical & Health
    "medical & health": "Medical & Health",
    "medical": "Medical & Health",
    "health": "Medical & Health",
    "hospital": "Medical & Health",
    "prescription": "Medical & Health",
    "lab report": "Medical & Health",
    "blood test": "Medical & Health",
    "diagnosis": "Medical & Health",
    "doctor": "Medical & Health",

    # Receipts & Invoices
    "receipts & invoices": "Receipts & Invoices",
    "receipts": "Receipts & Invoices",
    "invoices": "Receipts & Invoices",
    "receipt": "Receipts & Invoices",
    "invoice": "Receipts & Invoices",
    "amazon": "Receipts & Invoices",
    "flipkart": "Receipts & Invoices",
    "purchase": "Receipts & Invoices",
    "store": "Receipts & Invoices",
    "retail": "Receipts & Invoices"
}


class AIProcessor:
    """
    Multimodal AI Processing Engine using NVIDIA NIM APIs:
    - Vision Model: meta/llama-3.2-11b-vision-instruct (OCR + Vision + Lecture Notes + Marksheets)
    - Text Model: google/gemma-2-2b-it (Document & Student Asset Structuring + Subject Sub-Tagging)
    - Embeddings: nvidia/llama-3.2-nv-embedqa-1b-v2
    """

    @classmethod
    def preprocess_blurry_image(cls, file_bytes: bytes) -> bytes:
        """
        Applies multi-stage image restoration for documents, marksheets, notes, photos, and signatures:
        1. Auto-contrast histogram expansion.
        2. Adaptive Contrast Enhancement (1.75x).
        3. Unsharp Masking (radius=2, percent=175, threshold=2).
        4. Sharpness Enhancement (2.0x).
        """
        try:
            img = Image.open(io.BytesIO(file_bytes))
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")

            img = ImageOps.autocontrast(img, cutoff=1)
            contrast_enhancer = ImageEnhance.Contrast(img)
            img = contrast_enhancer.enhance(1.75)
            img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=175, threshold=2))
            sharpness_enhancer = ImageEnhance.Sharpness(img)
            img = sharpness_enhancer.enhance(2.0)

            out_buffer = io.BytesIO()
            img.save(out_buffer, format="JPEG", quality=95)
            print(f"[AIProcessor] Blur restoration preprocessed image ({len(file_bytes)} -> {out_buffer.tell()} bytes).")
            return out_buffer.getvalue()
        except Exception as e:
            print(f"[AIProcessor] Image preprocessing note: {e}")
            return file_bytes

    @staticmethod
    def _normalize_category(category: str, filename: str = "", text: str = "") -> str:
        """Normalizes extracted LLM category string into one of 10 master categories."""
        if not category:
            cat_candidate = "Other / Unsorted"
        else:
            cat_candidate = category.strip()

        if cat_candidate in CATEGORIES:
            return cat_candidate

        combined_text = (filename + " " + text + " " + cat_candidate).lower()

        # Word boundary exact mapping
        for key, target in CATEGORY_MAP.items():
            if re.search(r'\b' + re.escape(key) + r'\b', combined_text):
                return target

        return "Other / Unsorted"

    @classmethod
    def _extract_text_from_pdf_or_bytes(cls, filename: str, file_bytes: bytes) -> str:
        """Extracts clean text stream from PDF pages using PyPDF or plain byte decoding."""
        extracted_pages = []

        if pypdf and (filename.lower().endswith('.pdf') or file_bytes.startswith(b'%PDF')):
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    txt = page.extract_text()
                    if txt and txt.strip():
                        extracted_pages.append(txt.strip())
            except Exception as e:
                print(f"[AIProcessor] PyPDF extraction error: {e}")

        if extracted_pages:
            return "\n\n".join(extracted_pages)

        try:
            raw_text = file_bytes.decode('utf-8', errors='ignore')
            cleaned = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', raw_text)
            words = [w for w in cleaned.split() if len(w) > 2 and not w.startswith('/')]
            return " ".join(words[:300])
        except Exception:
            return ""

    @classmethod
    def _apply_deterministic_regex_fallback(cls, filename: str, extracted_text: str) -> Dict[str, Any]:
        """Offline deterministic rule engine for documents, lecture notes, marksheets, certificates, and photos."""
        fn_lower = filename.lower()
        text_lower = extracted_text.lower()
        combined = fn_lower + " " + text_lower

        category = cls._normalize_category("", filename=filename, text=extracted_text)

        # Entity Extraction Fallbacks
        vendor = "Vault_Archive"
        doc_type = "Record"
        due_date = None
        period = datetime.date.today().strftime("%Y")
        amount = None
        currency = "INR" if ("inr" in combined or "₹" in combined or "rs" in combined) else "USD"
        account_no = None
        doc_date = datetime.date.today().isoformat()
        tags = ["Archival", "Record"]
        summary = "Document record processed and stored securely in vault."

        # Detect Subject for Notes & Academic Files
        subject_tag = None
        if any(k in combined for k in ["computer science", "data structures", "algorithm", "python", "java", "coding", "software"]):
            subject_tag = "ComputerScience"
        elif any(k in combined for k in ["math", "mathematics", "calculus", "algebra", "trigonometry"]):
            subject_tag = "Mathematics"
        elif any(k in combined for k in ["physics", "quantum", "mechanics", "optics", "thermodynamics"]):
            subject_tag = "Physics"
        elif any(k in combined for k in ["chemistry", "organic", "inorganic", "chemical"]):
            subject_tag = "Chemistry"
        elif any(k in combined for k in ["biology", "botany", "zoology", "anatomy"]):
            subject_tag = "Biology"
        elif any(k in combined for k in ["electrical", "circuit", "electronics"]):
            subject_tag = "ElectricalEng"
        elif any(k in combined for k in ["mechanical", "fluid", "dynamics"]):
            subject_tag = "MechanicalEng"

        # 1. Notes & Lecture Study Guides Check
        if any(k in combined for k in ["note", "notes", "lecture", "study", "workbook", "lab manual", "chapter"]):
            category = "Academic & Marksheets"
            doc_type = f"{subject_tag or 'Lecture'}_Notes"
            vendor = "Academic_Classroom"
            summary = f"Executive study notes summary covering {subject_tag or 'academic'} lecture concepts, formulas, and key chapters."
            tags = ["Academic", "StudyNotes"]
            if subject_tag:
                tags.append(subject_tag)

        # 2. Academic Marksheets & Transcripts Check
        elif any(k in combined for k in ["marksheet", "mark sheet", "transcript", "grade sheet", "cgpa", "scorecard", "degree", "diploma", "cbse", "sslc", "hsc", "hall ticket", "admit card", "fee receipt", "bonafide"]):
            category = "Academic & Marksheets"
            doc_type = "Marksheet" if "marksheet" in combined else "HallTicket" if "ticket" in combined else "Transcript"
            vendor = "State_Board_or_University"
            summary = "Official academic marksheet, transcript, or exam document detailing student credentials."
            tags = ["Academic", "Marksheet", "Official"]
            if subject_tag:
                tags.append(subject_tag)

        # 3. Certificates & Courses Check
        elif any(k in combined for k in ["internship", "coursera", "nptel", "udemy", "hackathon", "workshop", "certificate", "certification", "achievement"]):
            category = "Certificates & Courses"
            doc_type = "Internship_Certificate" if "internship" in combined else "Online_Course_Certificate" if any(x in combined for x in ["coursera", "nptel", "udemy"]) else "Achievement_Certificate"
            vendor = "Course_Platform_or_Organization"
            summary = "Verified course completion, internship experience, or achievement certification."
            tags = ["Certificate", "Course", "Skills"]
            if subject_tag:
                tags.append(subject_tag)

        # 4. User Photo / Passport Picture Check
        elif any(k in combined for k in ["photo", "portrait", "passport photo", "profile", "picture", "face"]):
            category = "Identity & Official"
            doc_type = "Passport_Photo_Record"
            vendor = "User_Identity_Media"
            summary = "Official passport-size portrait photo or user identity photograph record."
            tags = ["Photo", "Identity", "Portrait"]

        # 5. Specimen Signature Check
        elif any(k in combined for k in ["signature", "sign", "autograph", "specimen"]):
            category = "Identity & Official"
            doc_type = "Specimen_Signature"
            vendor = "User_Identity_Media"
            summary = "Digitized specimen signature asset used for official verification and authentication."
            tags = ["Signature", "Authentication", "Official"]

        elif category == "Tax":
            doc_type = "Tax_Document"
            vendor = "Income_Tax_Dept"
            summary = "Official tax assessment record or return filing document."
            tags = ["Tax", "ITR", "Official"]

        elif category == "Utility & Bills":
            doc_type = "Utility_Bill"
            vendor = "BESCOM" if "bescom" in combined else "Citygas_Metro" if "gas" in combined else "Utility_Provider"
            summary = "Monthly utility billing invoice detailing consumption and payment due date."
            tags = ["Utility", "Bill", "Monthly"]

        elif category == "Financial & Bank":
            doc_type = "Bank_Statement"
            vendor = "HDFC_Bank" if "hdfc" in combined else "ICICI_Bank" if "icici" in combined else "Financial_Institution"
            summary = "Financial statement showing account transaction history and ledger totals."
            tags = ["Finance", "Bank", "Statement"]

        elif category == "Identity & Official":
            doc_type = "Identity_Proof"
            vendor = "Govt_Authority"
            summary = "Official government-issued identity proof requiring step-up PIN verification."
            tags = ["Identity", "Official", "Government"]

        # ISO Dates Regex
        dates_found = re.findall(r'\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b', extracted_text)
        if dates_found:
            due_date = dates_found[0].replace('/', '-')
            period = due_date[:4]

        # Roll Number / Account Regex
        roll_match = re.search(r'\b(?:roll|reg|registration|account|consumer|pnr|id|no)[\s\:\#]*([A-Z0-9\-]{5,15})\b', extracted_text, re.IGNORECASE)
        if roll_match:
            account_no = roll_match.group(1)

        # GUARANTEE 100% UNTOUCHED ORIGINAL FILE EXTENSION
        orig_ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'pdf'
        suggested_fn = f"{vendor}_{doc_type}_{period}.{orig_ext}"

        return {
            "category": category,
            "vendor_or_issuer": vendor,
            "suggested_filename": suggested_fn,
            "generated_filename": suggested_fn,
            "summary": summary,
            "expiry_date": due_date,
            "extracted_metadata": {
                "vendor_or_issuer": vendor,
                "total_amount": amount,
                "currency": currency,
                "document_date": doc_date,
                "expiration_or_due_date": due_date,
                "account_number": account_no
            },
            "tags": tags
        }

    @classmethod
    async def process_document(cls, filename: str, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Executes multimodal analysis for Student Documents, Class Notes, Marksheets, Certificates, Photos, and Signatures:
        1. Preprocesses image bytes for blur restoration and edge sharpening.
        2. Calls NVIDIA Vision NIM (meta/llama-3.2-11b-vision-instruct).
        3. Calls Gemma 2B (google/gemma-2-2b-it) for JSON structuring, subject sub-tagging, and 2-sentence study summaries.
        """
        extracted_text = ""
        is_image = mime_type.startswith("image/") or filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))

        if not NVIDIA_API_KEY or len(NVIDIA_API_KEY.strip()) < 10:
            print(f"[AIProcessor] Unconfigured API key. Using smart fallback for '{filename}'.")
            extracted_text = cls._extract_text_from_pdf_or_bytes(filename, file_bytes)
            analysis = cls._apply_deterministic_regex_fallback(filename, extracted_text)
            full_text = f"{analysis['suggested_filename']} {analysis['category']} {analysis['summary']} {json.dumps(analysis['extracted_metadata'])}"
            analysis["embedding"] = cls._generate_fallback_embedding(full_text)
            return analysis

        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        # Step 1: Multimodal Vision Model OCR & Asset Visual Inspection
        if is_image:
            print(f"[AIProcessor] Preprocessing student asset '{filename}' for blur restoration & edge sharpening...")
            enhanced_bytes = cls.preprocess_blurry_image(file_bytes)
            
            b64_file = base64.b64encode(enhanced_bytes).decode('utf-8')
            data_url = f"data:image/jpeg;base64,{b64_file}"

            ocr_prompt = (
                "Examine this image upload thoroughly. "
                "1. If it is Lecture/Class Notes, Study Guides, or Lab Notebooks, transcribe all handwritten or typed text, chapter titles, subject headers, formulas, equations, and main study topics. "
                "2. If it is an Academic Marksheet, Grade Card, Transcript, Hall Ticket, Admit Card, or Fee Receipt, transcribe all candidate/student names, roll numbers, subject marks, CGPA, percentage, board/university names, and issue dates. "
                "3. If it is an Internship Certificate, Online Course Certificate (Coursera, NPTEL, Udemy), Hackathon Award, or Workshop Certificate, transcribe issuing organization, course/event title, candidate name, and completion date. "
                "4. If it is a User Passport Photo or Portrait, identify it as 'User Passport/Portrait Photograph' under 'Identity & Official'. "
                "5. For general documents, bills, receipts, or certificates, transcribe all visible text, dates, monetary amounts, and reference numbers accurately."
            )

            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    vision_payload = {
                        "model": NVIDIA_VISION_MODEL,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": ocr_prompt},
                                    {"type": "image_url", "image_url": {"url": data_url}}
                                ]
                            }
                        ],
                        "temperature": 0.1,
                        "top_p": 1,
                        "max_tokens": 900,
                        "stream": False
                    }
                    res = await client.post(f"{NVIDIA_API_BASE}/chat/completions", headers=headers, json=vision_payload)
                    if res.status_code == 200:
                        res_json = res.json()
                        extracted_text = res_json["choices"][0]["message"]["content"]
                        print(f"[AIProcessor] Vision Model success! Extracted {len(extracted_text)} chars from image.")
            except Exception as e:
                print(f"[AIProcessor] Vision NIM exception: {e}")

        # Extract PyPDF text for PDFs
        if not extracted_text:
            extracted_text = cls._extract_text_from_pdf_or_bytes(filename, file_bytes)

        # Step 2: Gemma 2B Structuring & Targeted Entity Parsing
        print(f"[AIProcessor] Invoking NVIDIA Text NIM ({NVIDIA_TEXT_MODEL}) for Gemma 2B student asset structuring...")
        struct_prompt = f"""
Analyze the following extracted text/description thoroughly and respond strictly with a valid JSON object matching the schema below. Strip any markdown codeblock tags.

Filename: {filename}
Extracted Vision Analysis:
{extracted_text[:3500]}

Categories available:
["Academic & Marksheets", "Certificates & Courses", "Tax", "Financial & Bank", "Identity & Official", "Utility & Bills", "Travel & Tickets", "Medical & Health", "Receipts & Invoices", "Other / Unsorted"]

Category & Subject Sub-Tag Rules:
- Class Notes, Lecture Slides, Study Guides, Marksheets, Transcripts, Hall Tickets, Fee Receipts belong under "Academic & Marksheets".
  Identify the academic subject and attach subject sub-tags: ["ComputerScience"], ["Mathematics"], ["Physics"], ["Chemistry"], ["DataStructures"], ["AI"], ["ElectricalEng"], ["Biology"], ["Economics"], ["History"], or ["StudyNotes"].
- Internship Certificates, Online Course Certificates (NPTEL, Coursera, Udemy), Hackathons belong under "Certificates & Courses".
  Attach tags: ["Internship"], ["OnlineCourse"], ["Hackathon"], ["Workshop"], or ["Achievement"].

JSON Schema required:
{{
  "category": "<one of the categories above>",
  "vendor_or_issuer": "<issuing authority, university, board, subject, or organization>",
  "suggested_filename": "<standardized_base_name>",
  "summary": "<exactly 2 sentences executive study summary detailing main chapters, formulas, subject concepts, and academic purpose>",
  "metadata": {{
     "total_amount": <number or null>,
     "currency": "<INR/USD/EUR>",
     "document_date": "<YYYY-MM-DD or null>",
     "expiration_or_due_date": "<YYYY-MM-DD or null>",
     "account_number": "<roll number, registration number, ID, or null>"
  }},
  "tags": ["<subject_tag1>", "<tag2>", "<tag3>"]
}}
"""
        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                text_payload = {
                    "model": NVIDIA_TEXT_MODEL,
                    "messages": [{"role": "user", "content": struct_prompt}],
                    "temperature": 0.1,
                    "top_p": 1,
                    "max_tokens": 800,
                    "stream": False
                }
                res = await client.post(f"{NVIDIA_API_BASE}/chat/completions", headers=headers, json=text_payload)
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"].strip()
                    if content.startswith("```"):
                        content = re.sub(r'^```(?:json)?\n?', '', content)
                        content = re.sub(r'\n?```$', '', content)
                    
                    parsed = json.loads(content)
                    
                    raw_cat = parsed.get("category", "")
                    category = cls._normalize_category(raw_cat, filename=filename, text=extracted_text)

                    raw_suggested = parsed.get("suggested_filename", filename)
                    
                    # GUARANTEE 100% UNTOUCHED ORIGINAL FILE EXTENSION
                    orig_ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
                    if orig_ext:
                        base_name = raw_suggested.rsplit('.', 1)[0]
                        suggested_fn = f"{base_name}.{orig_ext}"
                    else:
                        suggested_fn = raw_suggested

                    meta = parsed.get("metadata", {})
                    exp_date = meta.get("expiration_or_due_date")
                    
                    full_text = f"{suggested_fn} {category} {parsed.get('summary', '')} {' '.join(parsed.get('tags', []))}"
                    embedding = await cls.generate_embedding(full_text)

                    return {
                        "category": category,
                        "vendor_or_issuer": parsed.get("vendor_or_issuer", "Unknown"),
                        "suggested_filename": suggested_fn,
                        "generated_filename": suggested_fn,
                        "summary": parsed.get("summary", "Upload processed and stored in vault."),
                        "extracted_metadata": meta,
                        "expiry_date": exp_date,
                        "tags": parsed.get("tags", []),
                        "embedding": embedding
                    }
        except Exception as e:
            print(f"[AIProcessor] Text NIM exception: {e}")

        fallback_analysis = cls._apply_deterministic_regex_fallback(filename, extracted_text)
        full_text = f"{fallback_analysis['suggested_filename']} {fallback_analysis['category']} {fallback_analysis['summary']}"
        fallback_analysis["embedding"] = cls._generate_fallback_embedding(full_text)
        return fallback_analysis

    @classmethod
    async def generate_embedding(cls, text: str) -> List[float]:
        """Generates 1024-dim vector embedding using nvidia/llama-3.2-nv-embedqa-1b-v2."""
        if not NVIDIA_API_KEY:
            return cls._generate_fallback_embedding(text)

        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "nvidia/llama-3.2-nv-embedqa-1b-v2",
            "input": [text[:512]],
            "input_type": "passage"
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(f"{NVIDIA_API_BASE}/embeddings", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["data"][0]["embedding"]
        except Exception as e:
            print(f"[AIProcessor] Embedding error: {e}")

        return cls._generate_fallback_embedding(text)

    @staticmethod
    def _generate_fallback_embedding(text: str) -> List[float]:
        """Generates deterministic 128-dim vector embedding locally."""
        words = text.lower().split()
        vector = [0.0] * 128
        for w in words:
            h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
            idx = h % 128
            vector[idx] += 1.0

        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            vector = [x / norm for x in vector]
        return vector
