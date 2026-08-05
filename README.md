# Synapse

An AI-powered research workspace that helps you upload, understand, organize, and interact with research papers.

## Features

- 📄 **PDF Upload & Reader** — drag-and-drop upload with background processing & browser PDF streaming
- 🔍 **Semantic Vector Search** — real-time embedding similarity search across all paper chunks
- 🤖 **RAG AI Q&A Assistant** — interactive chat with exact page numbers & citation snippets
- 🧠 **Executive Summaries** — auto-extracted methodologies, key findings, and research takeaways
- 📝 **Paper Annotations & Notes** — user notes management with page tagging
- 🧠 **Page-Aware Chunking** — preserves exact page locations using PyMuPDF
- 🔐 **JWT Auth** — access + refresh token flow
- 📚 **Paper Library** — search, filter, sort, and manage your paper collection

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
| `GET`  | `/api/v1/papers` | List papers (supports filtering, sorting & pagination) |
| `GET`  | `/api/v1/papers/{id}` | Get paper detail + chunk count |
| `GET`  | `/api/v1/papers/{id}/pdf` | Stream original PDF file |
| `POST` | `/api/v1/papers/search` | Semantic vector search across paper library |
| `POST` | `/api/v1/papers/chat` | RAG AI Q&A with verified page citations |
| `GET`  | `/api/v1/papers/{id}/summary` | Auto-generated paper summary & key findings |
| `GET`  | `/api/v1/papers/{id}/notes` | List paper annotations & user notes |
| `POST` | `/api/v1/papers/{id}/notes` | Create paper annotation with page tag |
| `DELETE` | `/api/v1/notes/{id}` | Delete a paper note |
| `DELETE` | `/api/v1/papers/{id}` | Delete a paper |
| `GET`  | `/health` | DB connectivity health check |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).