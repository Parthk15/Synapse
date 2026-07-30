# Contributing to Synapse

Thanks for your interest in contributing! Here's how to get started.

## Local Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Make sure PostgreSQL is running and the `DATABASE_URL` in `backend/.env` is correct.

## Branch Naming

| Type       | Pattern                  | Example                        |
|------------|--------------------------|--------------------------------|
| Feature    | `feat/<short-name>`      | `feat/semantic-search`         |
| Bug fix    | `fix/<short-name>`       | `fix/token-refresh-loop`       |
| Docs       | `docs/<short-name>`      | `docs/api-reference`           |
| Chore      | `chore/<short-name>`     | `chore/update-dependencies`    |

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): short description
fix(scope): short description
docs(scope): short description
chore(scope): short description
```

## Pull Requests

- Keep PRs focused — one feature or fix per PR.
- Link any related issues in the PR description.
- Ensure the backend starts without errors (`uvicorn app.main:app --reload`).
- Ensure the frontend builds without errors (`npm run build`).
