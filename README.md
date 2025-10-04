# 🧪 Chemistry Academic Assistance RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot for **undergraduate chemistry** students.  
It combines **BM25 + dense retrieval** with a **LoRA adapter** on **LLaMA-3.1-8B-Instruct** to provide concise, faithful answers.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-teal)
![Transformers](https://img.shields.io/badge/Transformers-4.45.x-yellow)
![PEFT](https://img.shields.io/badge/PEFT-0.14.0-orange)
![RAG](https://img.shields.io/badge/RAG-BM25%20%2B%20Dense-purple)

---
<img width="813" height="512" alt="main_page" src="https://github.com/user-attachments/assets/88742a14-2d22-4309-b7b7-f69facba5752" />


## ✨ Highlights

- **Base model**: `meta-llama/Llama-3.1-8B-Instruct`
- **LoRA adapter**: `matilda1415926/chemistry-lora-8b` (Hugging Face)
- **Hybrid retrieval**: BM25 (sparse) + Sentence-Transformers (`all-mpnet-base-v2`) with weighted fusion
- **Keyword & course-code boosting** (e.g., `CHEMxxxx`, `G1Txxx`)
- **FastAPI** backend with two endpoints (`/api/health`, `/api/ask`)
- **Pinned environment** via `requirements.lock` for reproducibility

---

## 🎥 Demo Video

▶️ [Watch the demo video here](https://github.com/Matilda56/chemistry-academic-assistance-rag-chatbot/raw/refs/heads/main/ccb%20demo.mp4)

## 🗂 Project Layout

chemistry-academic-assistance-rag-chatbot/
├─ configs/ # optional configs you maintain for paths/IDs
├─ src/
│ ├─ rag_pipeline.py # FastAPI app: retrieval → prompt → generation
│ └─ retriever.py # Hybrid retriever (BM25 + Dense + boosting)
├─ ui/ # lightweight front-end calling /api/ask
├─ vector_store/ # Chroma persistent dir (create or mount)
├─ models/ # optional local base model if not using HF
├─ checkpoints/ # optional local LoRA if not using HF
└─ requirements.lock # 🔒 pinned dependencies****


---

## ⚙️ Installation (Pinned)

> All Python deps are **pinned** in `requirements.lock`.  
> Keep your existing Torch that matches your system; then install the lock.

```bash
# 1) Create & activate venv
python -m venv venv
source venv/bin/activate    # Windows: .\\venv\\Scripts\\activate

# 2) (Optional) If you need Torch, install the build matching your CUDA/CPU
# Example (CPU only):
# pip install --no-cache-dir torch==2.3.1 torchvision==0.18.1 torchaudio==2.3.1

# 3) Install pinned dependencies
pip install --no-cache-dir -r requirements.lock
```

---

## 📥 Models & Weights

> Base model (official)
Use the instruction-tuned model:
- **meta-llama/Llama-3.1-8B-Instruct** (Hugging Face).
https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct

Accept the license on HF, then either:
- Option A · Use HF Hub at runtime (recommended): no download step.

- Option B · Download locally:
```
huggingface-cli download meta-llama/Llama-3.1-8B-Instruct \
  --local-dir ./models/llama-3.1-8b-instruct
```

> LoRA adapter (HF)

- **matilda1415926/chemistry-lora-8b**
  https://huggingface.co/matilda1415926/chemistry-lora-8b

Optional local download:
```
huggingface-cli download matilda1415926/chemistry-lora-8b \
  --local-dir ./checkpoints/lora/sft
```


## 🔧 Minimal Configuration (set paths/IDs)

There are **two source files** where paths/IDs matter:

1.src/rag_pipeline.py — base model & LoRA
```
# near the top of the file
BASE_MODEL = "meta-llama/Llama-3.1-8B-Instruct"     # or ./models/llama-3.1-8b-instruct
LORA_PATH  = "matilda1415926/chemistry-lora-8b"     # or ./checkpoints/lora/sft
```

2.src/retriever.py — Chroma persistent directory
```
# top of the file
CHROMA_DIR = "./vector_store/chroma_v2"             # point to your built store
COLLECTION_NAME = "chemistry"
EMBED_MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"
```
> If your current code still uses absolute paths like /workspace/...,
> either create symlinks to those names or change them to the relative paths above.

## ▶️ Run (Backend + Frontend)
> Prereqs
> - Dependencies installed from requirements.lock
> - Base model & LoRA configured in code (see “Models & Weights” / “Minimal Configuration”)
> - Virtual env is activated (source venv/bin/activate)
> - Optional: huggingface-cli login if you load from HF Hub at runtime

**1. Start the backend (FastAPI)**
Run the FastAPI app defined in src/rag_pipeline.py:
```
# from the repository root
uvicorn src.rag_pipeline:app --host 0.0.0.0 --port 8000 --reload
```
>✨Quick checks
>```
># Health
>curl http://localhost:8000/api/health
>```

>```
># Ask
> curl -X POST http://localhost:8000/api/ask \
>  -H "Content-Type: application/json" \
>  -d '{"instruction":"How many hours of preparation and reading are expected for the Computational Chemistry?"}'
>```


**2. Frontend setup**

> Before running the frontend, you need to configure the backend URL.
Copy the example environment file:
```
cd ui
cp .env.example .env.local
```

Edit .env.local to match your setup:
```
BACKEND_URL=http://127.0.0.1:8000     # local backend
NEXT_PUBLIC_BASE_PATH=                # leave empty
```
> 💡If you’re running with Docker Compose, set:
> ```
> BACKEND_URL=http://backend:8000
> ```

Run:
```
npm install
npm run dev
```
The app will be available at http://localhost:3000/chat


## 💬 User Guide

### 🏠 Main Page

1.Click “Student Login” to enter the chatbot interface.

2.Click “Admin Login” to access the admin file management system (requires credentials).

<img width="813" height="512" alt="main_page" src="https://github.com/user-attachments/assets/eb718be8-bf5e-42c3-9721-00d14c9dc327" />

### 👩‍🎓 Student Chat Interface

1.After clicking Student Login, you’ll be redirected to the chat interface.

2.Type your chemistry question in the input box at the bottom.

3.When the arrow icon turns colored, press Enter to send your question.

4.Wait a few seconds for a response — ⏳ the first startup may take longer due to model initialization.

5.Click “Back to Home” at the top right to return to the main page.

<img width="988" height="702" alt="chat_page" src="https://github.com/user-attachments/assets/c4e1e2bd-4972-4987-bb48-7616a20611c8" />


### 👨‍💼 Admin Login

1.Click Admin Login on the home page.

2.Enter credentials to log in:
  >Username: 1234
>
  >Password: 4321

3.Click Login to access the file upload dashboard.

<img width="939" height="656" alt="login_page" src="https://github.com/user-attachments/assets/50783534-96bd-4cec-a69f-b47c42646cc9" />


### 📁 File Upload & Management

1.Once logged in as admin, you’ll see the upload panel.

2.Drag and drop or click to upload course files.

<img width="951" height="577" alt="upload_page" src="https://github.com/user-attachments/assets/31d9c699-0295-4f6b-a48a-fbfc56e6fccf" />

### ✅ Notes

>Make sure the backend server (FastAPI) is running before launching the frontend.
>
>The first message may take longer because the model and retriever are initializing.
>
>You can return to the homepage anytime via Back to Home.
