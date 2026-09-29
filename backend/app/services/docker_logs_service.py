"""
Serviço para leitura e monitoramento de logs dos contêineres Docker do projeto.
Utiliza comunicação direta via socket Unix (/var/run/docker.sock) sem necessidade de bibliotecas externas pesadas.
"""
import os
import socket
from typing import List, Dict, Any
from app.core.logger import logger

DOCKER_SOCKET_PATH = "/var/run/docker.sock"

# Contêineres monitorados do projeto
CONTAINER_SERVICES = {
    "backend": "projeto_base_backend",
    "frontend": "projeto_base_frontend",
    "db": "projeto_base_db",
}

def clean_docker_stream(body: bytes) -> List[str]:
    """Decodifica o formato de multiplexação de stream do Docker (8-byte header por frame)."""
    lines = []
    payload = body

    # Se houver cabeçalhos de chunked transfer-encoding HTTP/1.1, ignora a linha de tamanho inicial
    if b"\r\n" in payload:
        first_line, remainder = payload.split(b"\r\n", 1)
        try:
            int(first_line, 16)
            payload = remainder
        except ValueError:
            pass

    idx = 0
    total_len = len(payload)
    while idx < total_len:
        if idx + 8 > total_len:
            break
        # stream_type: 1 = stdout, 2 = stderr
        stream_type = payload[idx]
        if stream_type not in (1, 2):
            idx += 1
            continue

        size = int.from_bytes(payload[idx+4:idx+8], byteorder="big")
        idx += 8
        if size <= 0 or idx + size > total_len:
            break

        frame_bytes = payload[idx:idx+size]
        idx += size
        text = frame_bytes.decode("utf-8", errors="replace")
        for line in text.splitlines():
            cleaned = line.strip("\r\n")
            if cleaned and cleaned != "0":
                lines.append(cleaned)
    return lines

def fetch_container_logs(service_name: str, tail: int = 100) -> Dict[str, Any]:
    """Obtém as últimas linhas de log do contêiner Docker informado."""
    container_name = CONTAINER_SERVICES.get(service_name)
    if not container_name:
        return {
            "service": service_name,
            "container": "unknown",
            "available": False,
            "logs": [],
            "error": f"Serviço '{service_name}' inválido. Disponíveis: backend, frontend, db."
        }

    if not os.path.exists(DOCKER_SOCKET_PATH):
        return {
            "service": service_name,
            "container": container_name,
            "available": False,
            "logs": [f"[{service_name.upper()}] Socket do Docker ({DOCKER_SOCKET_PATH}) não está acessível no container."],
            "error": "Docker socket indisponível."
        }

    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(5.0)
        sock.connect(DOCKER_SOCKET_PATH)

        request = (
            f"GET /containers/{container_name}/logs?stdout=1&stderr=1&tail={tail}&timestamps=0 HTTP/1.1\r\n"
            f"Host: localhost\r\n"
            f"Connection: close\r\n\r\n"
        )
        sock.sendall(request.encode("utf-8"))

        response = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            response += chunk
        sock.close()

        header_bytes, _, body_bytes = response.partition(b"\r\n\r\n")
        header_text = header_bytes.decode("utf-8", errors="ignore")
        status_line = header_text.splitlines()[0] if header_text else ""

        if "200" not in status_line:
            logger.error(f"Erro ao consultar logs do container {container_name}: {status_line}")
            return {
                "service": service_name,
                "container": container_name,
                "available": False,
                "logs": [f"Erro da API Docker: {status_line}"],
                "error": status_line
            }

        parsed_logs = clean_docker_stream(body_bytes)
        return {
            "service": service_name,
            "container": container_name,
            "available": True,
            "logs": parsed_logs,
            "total_lines": len(parsed_logs),
            "error": None
        }
    except Exception as e:
        logger.error(f"Falha de conexão com Docker socket para logs de {container_name}: {e}")
        return {
            "service": service_name,
            "container": container_name,
            "available": False,
            "logs": [f"Erro ao obter logs: {str(e)}"],
            "error": str(e)
        }
