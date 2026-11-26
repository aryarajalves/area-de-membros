import builtins
import sys
from pathlib import Path
from types import SimpleNamespace

from app.core.system_limits import DEFAULT_MIN_NOFILE_LIMIT, ensure_min_nofile_limit

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent


def _make_fake_resource(soft_limit: int, hard_limit: int, set_calls: list, fail_over_hard: bool = False):
    def getrlimit(res_id):
        assert res_id == 7
        return (soft_limit, hard_limit)

    def setrlimit(res_id, limits):
        assert res_id == 7
        new_soft, new_hard = limits
        if fail_over_hard and (new_soft > hard_limit or new_hard > hard_limit):
            raise PermissionError("not allowed to raise hard limit")
        set_calls.append((new_soft, new_hard))

    return SimpleNamespace(RLIMIT_NOFILE=7, getrlimit=getrlimit, setrlimit=setrlimit)


def test_ensure_min_nofile_raises_when_soft_below_target(monkeypatch):
    """Eleva o soft limit para 100.000 quando está abaixo do alvo (ex.: 1024)."""
    set_calls = []
    fake_res = _make_fake_resource(1024, 1048576, set_calls)
    monkeypatch.setitem(sys.modules, "resource", fake_res)

    result = ensure_min_nofile_limit(DEFAULT_MIN_NOFILE_LIMIT)
    assert result["supported"] is True
    assert result["changed"] is True
    assert result["previous_soft"] == 1024
    assert result["soft"] == 100000
    assert set_calls == [(100000, 1048576)]


def test_ensure_min_nofile_preserves_higher_soft_limit(monkeypatch):
    """Não reduz o soft limit quando o container já possui mais que 100.000."""
    set_calls = []
    fake_res = _make_fake_resource(1048576, 1048576, set_calls)
    monkeypatch.setitem(sys.modules, "resource", fake_res)

    result = ensure_min_nofile_limit(DEFAULT_MIN_NOFILE_LIMIT)
    assert result["supported"] is True
    assert result["changed"] is False
    assert result["soft"] == 1048576
    assert set_calls == []


def test_ensure_min_nofile_clamps_to_hard_limit_when_unprivileged(monkeypatch):
    """Faz fallback seguro para o hard limit disponível quando sem CAP_SYS_RESOURCE."""
    set_calls = []
    fake_res = _make_fake_resource(1024, 65535, set_calls, fail_over_hard=True)
    monkeypatch.setitem(sys.modules, "resource", fake_res)

    result = ensure_min_nofile_limit(DEFAULT_MIN_NOFILE_LIMIT)
    assert result["supported"] is True
    assert result["changed"] is True
    assert result["soft"] == 65535
    assert result["hard"] == 65535
    assert set_calls == [(65535, 65535)]


def test_ensure_min_nofile_graceful_when_resource_unavailable(monkeypatch):
    """Retorna supported=False sem falhar em sistemas sem módulo resource (Windows)."""
    monkeypatch.delitem(sys.modules, "resource", raising=False)
    real_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "resource":
            raise ImportError("No module named 'resource'")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)
    result = ensure_min_nofile_limit(DEFAULT_MIN_NOFILE_LIMIT)
    assert result["supported"] is False
    assert result["changed"] is False


def test_dockerfile_and_nginx_limits_configured():
    """Valida limites de 100.000 conexões e configurações de Nginx/Docker."""
    backend_dockerfile = (BACKEND_DIR / "Dockerfile").read_text(encoding="utf-8")
    assert "100000" in backend_dockerfile
    assert "--backlog 4096" in backend_dockerfile

    nginx_main_path = REPO_ROOT / "frontend" / "nginx-main.conf"
    if nginx_main_path.exists():
        nginx_main = nginx_main_path.read_text(encoding="utf-8")
        assert "worker_rlimit_nofile 100000;" in nginx_main
        assert "worker_connections  16384;" in nginx_main
        assert "gzip              on;" in nginx_main

    frontend_dockerfile_path = REPO_ROOT / "frontend" / "Dockerfile"
    if frontend_dockerfile_path.exists():
        frontend_df = frontend_dockerfile_path.read_text(encoding="utf-8")
        assert "COPY nginx-main.conf /etc/nginx/nginx.conf" in frontend_df

    compose_path = REPO_ROOT / "docker" / "docker-compose.yml"
    if compose_path.exists():
        compose_text = compose_path.read_text(encoding="utf-8")
        assert compose_text.count("soft: 100000") >= 3
        assert compose_text.count("hard: 100000") >= 3
        assert "nginx-main.conf:/etc/nginx/nginx.conf:ro" in compose_text
