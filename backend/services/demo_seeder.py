import os
import json
import asyncio
from backend.services.supabase_service import db_service
from backend.services.ai_processor import AIProcessor

DEMO_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "demo doc"))

async def ensure_demo_documents_seeded(user_id: str = "usr_demo"):
    """
    Checks if the demo user has documents. If empty, automatically processes
    and seeds all 10 sample files from 'demo doc/' into the user's vault.
    """
    existing_docs = db_service.list_documents(user_id=user_id, limit=5)
    if existing_docs and existing_docs.get("total", 0) > 0:
        print(f"[DemoSeeder] User '{user_id}' already has {existing_docs['total']} documents.")
        return

    if not os.path.exists(DEMO_DIR):
        print(f"[DemoSeeder] Demo documents directory not found at '{DEMO_DIR}'. Skipping seed.")
        return

    demo_files = sorted([f for f in os.listdir(DEMO_DIR) if os.path.isfile(os.path.join(DEMO_DIR, f))])
    print(f"[DemoSeeder] Auto-seeding {len(demo_files)} demo files for user '{user_id}'...")

    for fname in demo_files:
        fpath = os.path.join(DEMO_DIR, fname)
        try:
            with open(fpath, "rb") as f:
                content = f.read()

            fn_lower = fname.lower()
            mime = "image/jpeg" if fn_lower.endswith(('.jpg', '.jpeg')) else "image/png" if fn_lower.endswith('.png') else "application/pdf"

            res = await AIProcessor.process_document(fname, content, mime)

            doc = db_service.create_document({
                "user_id": user_id,
                "original_filename": fname,
                "generated_filename": res.get("generated_filename", fname),
                "suggested_filename": res.get("suggested_filename", fname),
                "category": res["category"],
                "vendor_or_issuer": res.get("vendor_or_issuer", "Demo Issuer"),
                "summary": res["summary"],
                "extracted_metadata": res.get("extracted_metadata", {}),
                "expiry_date": res.get("expiry_date"),
                "tags": res.get("tags", []),
                "status": "done"
            })

            db_service.save_file_content(doc["id"], content)
            if "embedding" in res and res["embedding"]:
                db_service.save_embedding(doc["id"], res["embedding"])

            print(f"[DemoSeeder] Seeded document '{doc['suggested_filename']}' ({doc['category']}).")
        except Exception as e:
            print(f"[DemoSeeder] Error seeding demo file '{fname}': {e}")


def seed_demo_sync(user_id: str = "usr_demo"):
    """Synchronous wrapper for demo seeding."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(ensure_demo_documents_seeded(user_id))
        else:
            loop.run_until_complete(ensure_demo_documents_seeded(user_id))
    except Exception:
        asyncio.run(ensure_demo_documents_seeded(user_id))
