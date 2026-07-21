import json
from pathlib import Path

from api.index import app


ROOT = Path(__file__).resolve().parents[2]


def test_vercel_entrypoint_exports_neural_apex_fastapi_app():
    assert app.title == "Neural Apex API"
    assert any(route.path == "/api/health" for route in app.routes)


def test_vercel_routes_api_before_spa_fallback():
    config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    assert config["framework"] == "vite"
    assert config["outputDirectory"] == "dist"
    assert config["rewrites"][0] == {
        "source": "/api/(.*)",
        "destination": "/api/index",
    }
    assert config["rewrites"][-1]["destination"] == "/index.html"
