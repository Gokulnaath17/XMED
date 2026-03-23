# XMED

AI-XMED is a FastAPI + React application for medical image analysis. It runs a DenseNet classifier, Grad-CAM heatmaps, and U-Net segmentation to produce explainable results from chest X-rays.

## What It Does
- Classifies chest X-ray images across multiple pathologies
- Generates Grad-CAM heatmaps for explainability
- Produces anatomical segmentation overlays
- Returns composite images and probability distributions
- you can also add custom models and weights as long as its a densenet121

## Tech Stack
- Backend: FastAPI + PyTorch + TorchXRayVision
- Frontend: React + Vite + Motion + Tailwind

## Quick Start

### 1) Backend
```powershell
cd "Backend"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py
```
Backend runs on `http://localhost:8000`.

### 2) Frontend
```powershell
cd "frontend"
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

## API Endpoints (Common)
- `GET /healthz` liveness probe
- `GET /api/v1/health` system status
- `GET /api/v1/models` model registry
- `POST /api/v1/models/{model_id}/initialize` warm up model (downloads weights if needed)
- `GET /api/v1/analysis/steps` pipeline steps for the UI loader
- `POST /api/v1/analyze` run inference (multipart form with `image` + `model_id`)
- 'POST/api/v1/debug/echo-image' just for debugging

## Notes
- First-time model initialization can take a while because weights may download from the internet.
- If the frontend shows a proxy error for `/api`, confirm the backend is running on port `8000` or update `frontend/vite.config.ts`.

## Project Structure
```
Backend/   FastAPI + ML pipeline
frontend/  React UI
```


