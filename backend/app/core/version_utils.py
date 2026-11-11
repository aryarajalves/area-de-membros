"""
Utilitários de versionamento semântico e segurança para a esteira de deploy.
"""

def calculate_next_version(current_version: str) -> str:
    """
    Calcula a próxima versão segundo a regra decimal estrita:
    X.Y.Z
    - Incrementa Z em 1.
    - Se Z > 9: Z = 0 e Y = Y + 1.
    - Se Y > 9: Y = 0 e X = X + 1.
    Exemplos:
      1.2.7 -> 1.2.8
      1.2.8 -> 1.2.9
      1.2.9 -> 1.3.0
      1.9.9 -> 2.0.0
    """
    parts = current_version.strip().split(".")
    if len(parts) != 3:
        raise ValueError(f"Formato de versão inválido: '{current_version}'. Esperado: X.Y.Z")
    try:
        x, y, z = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        raise ValueError(f"Versão contém partes não numéricas: '{current_version}'")

    z += 1
    if z > 9:
        z = 0
        y += 1
    if y > 9:
        y = 0
        x += 1

    return f"{x}.{y}.{z}"


def mask_secret(secret_str: str) -> str:
    """Mascara strings sensíveis para exibição segura em logs."""
    if not secret_str:
        return "****"
    if len(secret_str) <= 10:
        return "****"
    return secret_str[:4] + "****" + secret_str[-4:]
