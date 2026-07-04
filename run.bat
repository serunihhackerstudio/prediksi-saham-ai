@echo off
echo Memulai Backend dan Frontend...

:: Menjalankan Backend di jendela baru (mengaktifkan venv dan menjalankan uvicorn)
start "Backend API" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn main:app --reload"

:: Menjalankan Frontend di jendela baru (npm run dev)
start "Frontend React" cmd /k "cd frontend && npm run dev"

echo Kedua layanan sedang dimulai...
