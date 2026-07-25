import subprocess
import sys
import time
import os
import webbrowser

def main():
    print("=" * 65)
    print("  🚀 Starting DocVault Archival Office (Backend + Frontend)")
    print("=" * 65)

    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    # 1. Start FastAPI Backend (Uvicorn)
    print("\n[1/2] Launching FastAPI Backend on http://localhost:8000...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--reload", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=root_dir)

    # 2. Start Vite Frontend (npm run dev)
    print("[2/2] Launching Vite Frontend on http://localhost:5173...")
    frontend_cmd = "npm run dev"
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir, shell=True)

    time.sleep(3)
    print("\n" + "=" * 65)
    print("  ✅ BOTH SERVERS ARE RUNNING SUCCESSFULLY!")
    print("   👉 Frontend Web App:  http://localhost:5173")
    print("   👉 Backend API Docs:  http://localhost:8000/docs")
    print("=" * 65)
    print("\nPress Ctrl+C at any time to stop both servers.\n")

    try:
        webbrowser.open("http://localhost:5173")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down backend and frontend servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
