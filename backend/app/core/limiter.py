from slowapi import Limiter
from slowapi.util import get_remote_address

# Instância compartilhada do Limiter para controle de taxa (Rate Limiting)
# headers_enabled=False permite retornar modelos Pydantic e dicionários diretamente dos endpoints
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    headers_enabled=False,
)
