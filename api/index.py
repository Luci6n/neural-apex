"""Vercel ASGI entrypoint for the existing Neural Apex FastAPI app."""

from backend.main import app

__all__ = ["app"]
