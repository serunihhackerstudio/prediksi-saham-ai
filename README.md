<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Version-1.0.0-orange.svg?style=for-the-badge" alt="Version" />
  
  <br>
  
  <h1>📈 AI Stock Predictor (IHSG)</h1>
  <p><b>Prediksi Saham Berbasis Artificial Intelligence dengan Deep Learning & Real-time WebSockets</b></p>
</div>

<hr>

## ✨ Fitur Utama

- 🧠 **Deep Learning AI:** Menggunakan arsitektur jaringan saraf 1D-CNN dan MinMaxScaler untuk memprediksi harga saham 7 hari ke depan.
- ⚡ **Real-Time Websockets:** Tidak perlu refresh! Progress training AI (Loss & Val Loss) dikirimkan secara _real-time_ ke layar Anda.
- 💎 **Modern UI / Glassmorphism:** Antarmuka elegan, bersih, profesional, dan interaktif bergaya _glassmorphism_.
- 🔍 **Smart Autocomplete:** Pencarian cerdas dan auto-pelengkapan untuk semua emiten di Bursa Efek Indonesia (IHSG). Tidak perlu repot mengetik `.JK`.
- 📊 **Interactive Dashboard:** Menampilkan perbandingan pergerakan saham aktual (biru) vs prediksi (ungu) yang dioptimasi untuk analisis teknikal.

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan arsitektur modern yang dipisahkan antara *Frontend* dan *Backend*, siap untuk *scale*.

**Frontend:**
- ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) **React.js** dengan Vite
- ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) *(Custom CSS + Glassmorphism)*
- ![Recharts](https://img.shields.io/badge/Recharts-%23111827.svg?style=for-the-badge&logo=react&logoColor=white) 

**Backend:**
- ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) **Python 3.10**
- ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi) 
- ![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white) 
- **yfinance** (Data Provider)

**Deployment / DevOps:**
- ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) 
- ![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)
- **Vercel** & **Render** Ready (`render.yaml` included).

---

## 🚀 Instalasi Lokal (Developer)

Ingin mencoba aplikasi ini secara lokal di komputer Anda? 

### Prasyarat:
1. Python 3.9 / 3.10+
2. Node.js 18+

### Menjalankan dengan *Single-Click* (Windows):
Cukup jalankan file `run.bat`. File ini akan otomatis membuat Virtual Environment, menginstal dependensi Python dan Node.js, serta menjalankan kedua server secara simultan.

### Menjalankan Manual (Terminal):
1. **Jalankan Backend:**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
2. **Jalankan Frontend (Di terminal baru):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🌐 Deployment (Production)

Proyek ini telah dikonfigurasi untuk siap rilis ke server produksi kelas enterprise:

1. **Menggunakan Docker (VPS Sendiri):**
   ```bash
   docker-compose up -d --build
   ```
   
2. **Menggunakan Vercel + Render (Gratis/Hybrid):**
   - Import folder `backend` ke **Render.com** (Otomatis menggunakan konfigurasi dari file `render.yaml`).
   - Import folder `frontend` ke **Vercel.com**.
   - Tambahkan *Environment Variables* `VITE_WS_URL=wss://<url-backend-render>/api/predict-stream` di menu setting Vercel Anda.

---

<div align="center">
  <i>Dibuat dengan ❤️ oleh Serunih Hacker Studio</i>
</div>
