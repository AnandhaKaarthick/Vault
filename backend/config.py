import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "vault-documents")

# NVIDIA Developer Platform API Credentials
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_API_BASE = os.getenv("NVIDIA_API_BASE", "https://integrate.api.nvidia.com/v1")

# Models on NVIDIA Developer Platform
NVIDIA_VISION_MODEL = os.getenv("NVIDIA_VISION_MODEL", "meta/llama-3.2-11b-vision-instruct")
NVIDIA_TEXT_MODEL = os.getenv("NVIDIA_TEXT_MODEL", "meta/llama-3.1-8b-instruct")

# Security Configuration
SECURITY_PIN_HASH = os.getenv("SECURITY_PIN_HASH", "")
