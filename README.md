# Synapse

An AI-powered research workspace that helps you upload, understand, organize, and interact with research papers.

## Features

- 📄 **PDF Upload** — drag-and-drop upload with background processing
- 🔍 **Page-Aware Chunking** — preserves exact page locations using PyMuPDF
- 🧠 **Vector Embeddings** — OpenAI or local SentenceTransformers fallback
- 🔐 **JWT Auth** — access + refresh token flow
- 📚 **Paper Library** — search, filter, and manage your paper collection

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS         |
| Backend   | FastAPI, SQLAlchemy, Alembic                 |
| Database  | PostgreSQL + pgvector                        |
| AI        | OpenAI `text-embedding-3-small` / `all-MiniLM-L6-v2` |
| Auth      | JWT (HS256), bcrypt                          |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000` — Swagger docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:<password>@localhost:5432/synapse
JWT_SECRET_KEY=your_secret_here
JWT_REFRESH_SECRET_KEY=your_refresh_secret_here
OPENAI_API_KEY=sk-...          # optional — local model used if absent
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/signup` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login and receive tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET`  | `/api/v1/auth/me` | Get current user |
| `POST` | `/api/v1/papers/upload` | Upload a PDF |
| `GET`  | `/api/v1/papers` | List papers (supports `?status_filter=ready`) |
| `GET`  | `/api/v1/papers/{id}` | Get paper detail + chunk count |
| `DELETE` | `/api/v1/papers/{id}` | Delete a paper |
| `GET`  | `/health` | DB connectivity health check |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).