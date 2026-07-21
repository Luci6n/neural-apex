# Setup and Deployment

## Local Windows

Requirements: Node.js 22+ and Python 3.11+.

1. npm install
2. python -m venv .venv
3. .venv\Scripts\Activate.ps1
4. pip install -r requirements-dev.txt
5. Copy-Item .env.example .env
6. Add OPENAI_API_KEY to .env
7. npm run dev

Vite runs at http://localhost:5173 and proxies /api to FastAPI at http://localhost:8787.

OPENAI_API_KEY is optional for fallback mode. OPENAI_MODEL defaults to gpt-5.6. Never commit .env.

`requirements-dev.txt` includes the production backend requirements plus pytest and its HTTP test client. Production containers continue to install only `requirements.txt`.

## Docker

Run docker compose up --build. The multi-stage image builds Vite, installs Python dependencies, and serves the SPA and API on port 8787.

Readiness: GET http://localhost:8787/api/health. The response reports whether a key is configured without revealing it.

For deployment, expose port 8787 and configure OPENAI_API_KEY as a platform secret.

## Vercel

The Vercel deployment keeps the same application boundary with a platform-specific adapter:

- Vite builds the frontend into `dist/`.
- `api/index.py` exports the existing `backend.main:app` FastAPI instance as one Python Function.
- `vercel.json` sends `/api/*` to FastAPI before applying the SPA fallback to `index.html`.
- Python responses keep NDJSON streaming for live race-engineer and debrief text.

Set `OPENAI_API_KEY` as an encrypted Vercel project environment variable for Production and Preview. Set `OPENAI_MODEL=gpt-5.6` only when overriding the application default. Never put either value in `vercel.json`.

Deploy from the project root with the Vercel integration or `vercel deploy --prod`, then verify `/`, `/setup`, and `/api/health`. Health must return `aiConfigured: true` before the GPT demo is considered ready.
