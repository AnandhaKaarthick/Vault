import os
import json
import uuid
import datetime
import math
from typing import Dict, Any, List, Optional
from backend.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_STORAGE_BUCKET

try:
    from supabase import create_client, Client
    HAS_SUPABASE_SDK = True
except ImportError:
    HAS_SUPABASE_SDK = False

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)
DB_JSON_PATH = os.path.join(STORAGE_DIR, "db.json")


class SupabaseService:
    """
    Data & Storage Management Layer with Multi-User Data Isolation:
    Persists document records to local disk (`backend/storage/db.json`) and binary files to `backend/storage/{id}.bin`.
    Filters documents strictly by user_id.
    """
    def __init__(self):
        self.is_connected = False
        self.client: Optional[Any] = None

        if HAS_SUPABASE_SDK and SUPABASE_URL and SUPABASE_KEY and "supabase.co" in SUPABASE_URL:
            try:
                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                self.is_connected = True
                print("[SupabaseService] Successfully connected to live Supabase backend.")
            except Exception as e:
                print(f"[SupabaseService] Could not initialize Supabase client: {e}. Falling back to local store.")
        else:
            print("[SupabaseService] Supabase URL/Key unconfigured. Running with local store.")

        # In-memory stores
        self._memory_documents: Dict[str, Dict[str, Any]] = {}
        self._memory_embeddings: Dict[str, List[float]] = {}
        self._memory_jobs: Dict[str, Dict[str, Any]] = {}
        self._memory_files: Dict[str, bytes] = {}

        # Load persisted JSON DB on startup
        self._load_local_db()

    def _load_local_db(self):
        """Loads persisted documents and jobs from backend/storage/db.json."""
        if os.path.exists(DB_JSON_PATH):
            try:
                with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._memory_documents = data.get("documents", {})
                    self._memory_jobs = data.get("jobs", {})
                    self._memory_embeddings = data.get("embeddings", {})
                print(f"[SupabaseService] Loaded {len(self._memory_documents)} documents from local disk DB.")
            except Exception as e:
                print(f"[SupabaseService] Error loading local DB: {e}")

    def _save_local_db(self):
        """Persists documents and jobs to backend/storage/db.json."""
        try:
            with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump({
                    "documents": self._memory_documents,
                    "jobs": self._memory_jobs,
                    "embeddings": self._memory_embeddings
                }, f, indent=2)
        except Exception as e:
            print(f"[SupabaseService] Error saving local DB: {e}")

    def get_document_by_hash(self, file_hash: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Queries for existing document matching server-computed SHA-256 hash for a specific user."""
        if self.is_connected and self.client:
            try:
                q = self.client.table("documents").select("*").eq("file_hash", file_hash)
                if user_id:
                    q = q.eq("user_id", user_id)
                res = q.execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception:
                pass

        for doc in self._memory_documents.values():
            if doc.get("file_hash") == file_hash:
                if not user_id or doc.get("user_id") == user_id:
                    return doc
        return None

    def create_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a document record."""
        doc_id = doc_data.get("id") or str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        record = {
            "id": doc_id,
            "user_id": doc_data.get("user_id", "usr_anandha"),
            "storage_path": doc_data.get("storage_path", f"documents/{doc_id}.bin"),
            "original_filename": doc_data.get("original_filename", "unnamed"),
            "generated_filename": doc_data.get("generated_filename", doc_data.get("original_filename", "unnamed")),
            "suggested_filename": doc_data.get("suggested_filename", doc_data.get("original_filename", "unnamed")),
            "category": doc_data.get("category", "Other / Unsorted"),
            "vendor_or_issuer": doc_data.get("vendor_or_issuer"),
            "summary": doc_data.get("summary"),
            "extracted_metadata": doc_data.get("extracted_metadata", {}),
            "expiry_date": doc_data.get("expiry_date"),
            "is_starred": doc_data.get("is_starred", False),
            "status": doc_data.get("status", "pending"),
            "file_hash": doc_data.get("file_hash"),
            "tags": doc_data.get("tags", []),
            "created_at": now,
            "updated_at": now
        }

        if self.is_connected and self.client:
            try:
                res = self.client.table("documents").insert(record).execute()
                if res.data:
                    record = res.data[0]
            except Exception as e:
                print(f"[SupabaseService] Error inserting document record into Supabase: {e}")

        self._memory_documents[doc_id] = record
        self._save_local_db()
        return record

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves document detail by ID."""
        if self.is_connected and self.client:
            try:
                res = self.client.table("documents").select("*").eq("id", doc_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception:
                pass
        return self._memory_documents.get(doc_id)

    def list_documents(
        self,
        category: Optional[str] = None,
        starred: Optional[bool] = None,
        expiring_soon: Optional[bool] = None,
        user_id: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Lists paginated documents filtered strictly by user_id."""
        if self.is_connected and self.client:
            try:
                query = self.client.table("documents").select("*", count="exact")
                if user_id:
                    query = query.eq("user_id", user_id)
                if category and category != "All":
                    query = query.eq("category", category)
                if starred is True:
                    query = query.eq("is_starred", True)
                if expiring_soon:
                    today = datetime.date.today().isoformat()
                    future = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
                    query = query.gte("expiry_date", today).lte("expiry_date", future)

                start = (page - 1) * limit
                end = start + limit - 1
                res = query.order("created_at", desc=True).range(start, end).execute()
                return {
                    "documents": res.data or [],
                    "total": res.count or len(res.data or []),
                    "page": page,
                    "limit": limit
                }
            except Exception:
                pass

        all_docs = list(self._memory_documents.values())
        filtered = []

        today = datetime.date.today()
        future_30 = today + datetime.timedelta(days=30)

        for d in all_docs:
            if user_id and d.get("user_id") and d.get("user_id") != user_id:
                continue
            if category and category != "All" and d.get("category") != category:
                continue
            if starred is True and not d.get("is_starred"):
                continue
            if expiring_soon:
                exp = d.get("expiry_date")
                if not exp:
                    continue
                try:
                    exp_dt = datetime.datetime.strptime(exp[:10], "%Y-%m-%d").date()
                    if not (today <= exp_dt <= future_30):
                        continue
                except ValueError:
                    continue
            filtered.append(d)

        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        start = (page - 1) * limit
        end = start + limit

        return {
            "documents": filtered[start:end],
            "total": len(filtered),
            "page": page,
            "limit": limit
        }

    def delete_document(self, doc_id: str) -> bool:
        """Deletes document record."""
        if self.is_connected and self.client:
            try:
                self.client.table("documents").delete().eq("id", doc_id).execute()
                self.client.table("document_embeddings").delete().eq("document_id", doc_id).execute()
            except Exception:
                pass

        self._memory_documents.pop(doc_id, None)
        self._memory_embeddings.pop(doc_id, None)
        self._memory_files.pop(doc_id, None)
        self._save_local_db()

        local_path = os.path.join(STORAGE_DIR, f"{doc_id}.bin")
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass

        return True

    def create_job(self, doc_id: str) -> Dict[str, Any]:
        """Creates async job tracking record."""
        job_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        job = {
            "id": job_id,
            "document_id": doc_id,
            "status": "pending",
            "error": None,
            "created_at": now,
            "updated_at": now
        }
        self._memory_jobs[job_id] = job
        self._save_local_db()
        return job

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self._memory_jobs.get(job_id)

    def update_job(self, job_id: str, status: str, error: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if job_id in self._memory_jobs:
            self._memory_jobs[job_id]["status"] = status
            self._memory_jobs[job_id]["error"] = error
            self._memory_jobs[job_id]["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self._save_local_db()
            return self._memory_jobs[job_id]
        return None

    def update_document(self, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if doc_id in self._memory_documents:
            doc = self._memory_documents[doc_id]
            doc.update(updates)
            doc["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

            if self.is_connected and self.client:
                try:
                    self.client.table("documents").update(doc).eq("id", doc_id).execute()
                except Exception:
                    pass

            self._save_local_db()
            return doc
        return None

    def save_file_content(self, doc_id: str, file_bytes: bytes):
        """Saves binary file payload to disk under backend/storage/{doc_id}.bin."""
        self._memory_files[doc_id] = file_bytes
        local_path = os.path.join(STORAGE_DIR, f"{doc_id}.bin")
        try:
            with open(local_path, "wb") as f:
                f.write(file_bytes)
        except Exception as e:
            print(f"[SupabaseService] Error saving file to local disk: {e}")

    def get_file_content(self, doc_id: str) -> Optional[bytes]:
        """Reads binary file payload from in-memory cache or local disk storage."""
        if doc_id in self._memory_files and self._memory_files[doc_id]:
            return self._memory_files[doc_id]

        local_path = os.path.join(STORAGE_DIR, f"{doc_id}.bin")
        if os.path.exists(local_path):
            try:
                with open(local_path, "rb") as f:
                    content = f.read()
                    self._memory_files[doc_id] = content
                    return content
            except Exception as e:
                print(f"[SupabaseService] Error reading file payload from disk: {e}")
        return None

    def save_embedding(self, doc_id: str, embedding: List[float]):
        """Saves 1024-dim embedding vector."""
        self._memory_embeddings[doc_id] = embedding
        self._save_local_db()

    def get_all_embeddings(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns document embeddings for vector similarity search."""
        results = []
        for doc_id, emb in self._memory_embeddings.items():
            doc = self.get_document(doc_id)
            if doc:
                if user_id and doc.get("user_id") and doc.get("user_id") != user_id:
                    continue
                results.append({
                    "document_id": doc_id,
                    "embedding": emb,
                    "document": doc
                })
        return results


db_service = SupabaseService()
