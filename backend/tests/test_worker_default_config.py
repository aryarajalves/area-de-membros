from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent


def test_dockerfile_default_workers_is_one():
    """Garante que o Dockerfile inicialize o Uvicorn com 1 worker por padrão."""
    dockerfile = (BACKEND_DIR / "Dockerfile").read_text(encoding="utf-8")
    assert "ENV WORKERS=1" in dockerfile
    assert "--workers ${WORKERS:-1}" in dockerfile
    assert "ENV WORKERS=4" not in dockerfile
    assert "${WORKERS:-4}" not in dockerfile


def test_backend_env_example_default_workers_is_one():
    """Garante que o .env.example do backend documente WORKERS=1 como padrão."""
    env_example = (BACKEND_DIR / ".env.example").read_text(encoding="utf-8")
    lines = [line.strip() for line in env_example.splitlines()]
    assert "WORKERS=1" in lines
    assert "WORKERS=4" not in lines


def test_docker_production_compose_and_env_default_workers_is_one():
    """Garante que a stack de produção use WORKERS=1 como fallback padrão."""
    compose_path = REPO_ROOT / "docker" / "docker-compose-producao.yml"
    if compose_path.exists():
        compose_text = compose_path.read_text(encoding="utf-8")
        assert "WORKERS=${WORKERS:-1}" in compose_text
        assert "WORKERS=${WORKERS:-4}" not in compose_text

    env_prod_path = REPO_ROOT / "docker" / ".env.producao.example"
    if env_prod_path.exists():
        env_prod_text = env_prod_path.read_text(encoding="utf-8")
        lines = [line.strip() for line in env_prod_text.splitlines()]
        assert "WORKERS=1" in lines
        assert "WORKERS=4" not in lines
