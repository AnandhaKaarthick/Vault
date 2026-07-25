import os
import sys

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# Export handler for Vercel Serverless Function compatibility
handler = app
