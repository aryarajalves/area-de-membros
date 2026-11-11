#!/usr/bin/env python3
"""
Esteira de Validação, Versionamento e Build de Imagens Docker.

Executa a sequência de integridade:
1. Verificação de Tabelas e Colunas no SQL de auto-migração (scripts/check_db_schema.py)
2. Scanner de Segredos e Vazamento de Credenciais (scripts/check_secrets.py)
3. Sincronia de Variáveis de Ambiente (scripts/check_env_sync.py)
4. Verificação de Limites de Código / Clean Code (scripts/check_limits.py)
5. Auditoria de Segurança de Dependências (scripts/audit_security.py)
6. Bateria de Testes Unitários do Backend (pytest)
7. Bateria de Testes Unitários do Frontend (vitest)
8. Build de Produção do Frontend (npm run build)
9. Atualização de versão (frontend/package.json, docker-compose, README)
10. Geração das Imagens Docker:
    - aryalvesfernandes/area-de-membrosbackend-<versao>
    - aryalvesfernandes/area-de-membrosfrontend-<versao>
    (NADA DE VERSÃO LATEST)
"""

import os
import sys
import re
import json
import argparse
import subprocess
import io

# Garante suporte a UTF-8 no Windows Console
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
PACKAGE_JSON_PATH = os.path.join(FRONTEND_DIR, "package.json")
COMPOSE_PROD_PATH = os.path.join(BASE_DIR, "docker", "docker-compose-producao.yml")
ENV_PROD_EXAMPLE_PATH = os.path.join(BASE_DIR, "docker", ".env.producao.example")
README_PATH = os.path.join(BASE_DIR, "README.md")

def get_current_version() -> str:
    """Lê a versão atual do frontend/package.json (ou fallback para 1.2.7)."""
    if os.path.exists(PACKAGE_JSON_PATH):
        try:
            with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("version", "1.2.7")
        except Exception:
            pass
    return "1.2.7"

def calculate_next_version(current_version: str) -> str:
    """
    Calcula a próxima versão segundo a regra decimal:
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

def update_version_files(new_version: str):
    """Atualiza a versão nos arquivos do projeto."""
    print(f"\n📝 Atualizando versão para {new_version} nos arquivos do projeto...")

    # 1. frontend/package.json
    if os.path.exists(PACKAGE_JSON_PATH):
        with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["version"] = new_version
        with open(PACKAGE_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"   [OK] {os.path.relpath(PACKAGE_JSON_PATH, BASE_DIR)}")

    # 2. docker/.env.producao.example
    if os.path.exists(ENV_PROD_EXAMPLE_PATH):
        with open(ENV_PROD_EXAMPLE_PATH, "r", encoding="utf-8") as f:
            env_content = f.read()
        env_content = re.sub(
            r'BACKEND_IMAGE=aryalvesfernandes/[^:\n]+:backend-[0-9.]+',
            f'BACKEND_IMAGE=aryalvesfernandes/area-de-membrosbackend-{new_version}',
            env_content
        )
        env_content = re.sub(
            r'FRONTEND_IMAGE=aryalvesfernandes/[^:\n]+:frontend-[0-9.]+',
            f'FRONTEND_IMAGE=aryalvesfernandes/area-de-membrosfrontend-{new_version}',
            env_content
        )
        with open(ENV_PROD_EXAMPLE_PATH, "w", encoding="utf-8") as f:
            f.write(env_content)
        print(f"   [OK] {os.path.relpath(ENV_PROD_EXAMPLE_PATH, BASE_DIR)}")

    # 3. docker/docker-compose-producao.yml
    if os.path.exists(COMPOSE_PROD_PATH):
        with open(COMPOSE_PROD_PATH, "r", encoding="utf-8") as f:
            compose_content = f.read()
        compose_content = re.sub(
            r'BACKEND_IMAGE:-aryalvesfernandes/[^:\n}]+:[^}\n]+',
            f'BACKEND_IMAGE:-aryalvesfernandes/area-de-membrosbackend-{new_version}',
            compose_content
        )
        compose_content = re.sub(
            r'FRONTEND_IMAGE:-aryalvesfernandes/[^:\n}]+:[^}\n]+',
            f'FRONTEND_IMAGE:-aryalvesfernandes/area-de-membrosfrontend-{new_version}',
            compose_content
        )
        with open(COMPOSE_PROD_PATH, "w", encoding="utf-8") as f:
            f.write(compose_content)
        print(f"   [OK] {os.path.relpath(COMPOSE_PROD_PATH, BASE_DIR)}")

def run_step(name: str, cmd: list, cwd: str = BASE_DIR, check: bool = True) -> bool:
    print("\n" + "=" * 70)
    print(f"🚀 [ETAPA] {name}")
    print(f"   Comando: {' '.join(cmd)}")
    print("=" * 70)

    use_shell = sys.platform == "win32" or isinstance(cmd, str)
    res = subprocess.run(cmd, cwd=cwd, shell=use_shell)
    if res.returncode != 0:
        print(f"\n❌ [FALHA] Etapa '{name}' falhou com código de saída {res.returncode}.")
        if check:
            print("⛔ Esteira interrompida. Corrija o erro acima para continuar.")
            sys.exit(res.returncode)
        return False
    print(f"\n✅ [SUCESSO] Etapa '{name}' concluída com sucesso.")
    return True

def main():
    parser = argparse.ArgumentParser(description="Esteira completa de validação, testes e build Docker")
    parser.add_argument("--version", type=str, help="Forçar uma versão específica (ex: 1.2.8)")
    parser.add_argument("--dry-run", action="store_true", help="Executa testes e validações sem gerar imagens Docker")
    parser.add_argument("--skip-tests", action="store_true", help="Pula execução da suíte de testes unitários")
    parser.add_argument("--push", action="store_true", default=True, help="Faz push das imagens para o Docker Hub (padrão: True)")
    parser.add_argument("--no-push", dest="push", action="store_false", help="Não faz push das imagens para o Docker Hub")
    args = parser.parse_args()

    curr_version = get_current_version()
    if args.version:
        target_version = args.version.strip()
    else:
        target_version = calculate_next_version(curr_version)

    print("\n" + "#" * 70)
    print("🎯 [ESTEIRA DE PRODUÇÃO - ÁREA DE MEMBROS]")
    print(f"📌 Versão Atual:   {curr_version}")
    print(f"✨ Próxima Versão:  {target_version}")
    print(f"🏷️  Imagem Backend:  aryalvesfernandes/area-de-membrosbackend-{target_version}")
    print(f"🏷️  Imagem Frontend: aryalvesfernandes/area-de-membrosfrontend-{target_version}")
    print("🚫 Regra de Tag:    NADA DE LATEST")
    print("#" * 70 + "\n")

    # 1. Verificação de Esquema de Banco (main.py vs SQLAlchemy Models)
    run_step(
        "1/10 - Validação de Integridade de Tabelas e Colunas",
        [sys.executable, os.path.join(BASE_DIR, "scripts", "check_db_schema.py")]
    )

    # 2. Scanner de Vazamento de Segredos
    run_step(
        "2/10 - Scanner de Vazamento de Segredos e Chaves",
        [sys.executable, os.path.join(BASE_DIR, "scripts", "check_secrets.py")]
    )

    # 3. Sincronia de .env.example
    run_step(
        "3/10 - Sincronia de Variáveis de Ambiente (.env.example)",
        [sys.executable, os.path.join(BASE_DIR, "scripts", "check_env_sync.py")]
    )

    # 4. Limites de Linhas de Código (Clean Code)
    run_step(
        "4/10 - Verificação de Limites de Linhas de Código",
        [sys.executable, os.path.join(BASE_DIR, "scripts", "check_limits.py")]
    )

    # 5. Auditoria de Segurança de Dependências (pip-audit & npm audit)
    run_step(
        "5/10 - Auditoria de Segurança de Dependências (pip + npm)",
        [sys.executable, os.path.join(BASE_DIR, "scripts", "audit_security.py")]
    )

    # 6. Auditoria de Endpoints (Documentação, Autorização e Rate Limiting)
    run_step(
        "6/10 - Auditoria de Endpoints (Documentação, Autorização e Rate Limiting)",
        [sys.executable, os.path.join(BASE_DIR, "scripts", "audit_endpoints.py")]
    )

    # 7. Testes Unitários do Backend e Frontend
    if not args.skip_tests:
        run_step(
            "7/10 - Testes Unitários do Backend (Pytest)",
            ["docker", "exec", "area_de_membros_backend", "pytest", "-q", "--tb=short", "tests/"]
        )

        run_step(
            "8/10 - Testes Unitários do Frontend (Vitest)",
            ["npm", "test", "--", "--run", "--no-file-parallelism"],
            cwd=FRONTEND_DIR
        )
    else:
        print("\n⏩ Testes unitários ignorados (--skip-tests ativado).")

    # 9. Build do Frontend (Vite)
    run_step(
        "9/10 - Build de Produção do Frontend (Vite)",
        ["npm", "run", "build"],
        cwd=FRONTEND_DIR
    )

    # Atualiza versão nos arquivos
    update_version_files(target_version)

    # 10. Build das Imagens Docker
    if args.dry_run:
        print("\n" + "=" * 70)
        print("🔍 [DRY RUN] Simulação concluída com sucesso!")
        print(f"   As imagens que seriam geradas:")
        print(f"   - aryalvesfernandes/area-de-membrosbackend-{target_version}")
        print(f"   - aryalvesfernandes/area-de-membrosfrontend-{target_version}")
        print("=" * 70 + "\n")
        return

    backend_tag_hub = f"aryalvesfernandes/area-de-membros:backend-{target_version}"
    backend_tag_direct = f"aryalvesfernandes/area-de-membrosbackend:{target_version}"
    frontend_tag_hub = f"aryalvesfernandes/area-de-membros:frontend-{target_version}"
    frontend_tag_direct = f"aryalvesfernandes/area-de-membrosfrontend:{target_version}"

    print("\n" + "=" * 70)
    print("🐳 [DOCKER BUILD] Gerando imagens de produção (SEM TAG LATEST)...")
    print("=" * 70)

    # Build Backend com as duas tags sem latest
    run_step(
        f"Docker Build Backend: {backend_tag_hub}",
        ["docker", "build", "-t", backend_tag_hub, "-t", backend_tag_direct, "."],
        cwd=BACKEND_DIR
    )

    # Build Frontend com as duas tags sem latest
    run_step(
        f"Docker Build Frontend: {frontend_tag_hub}",
        ["docker", "build", "-t", frontend_tag_hub, "-t", frontend_tag_direct, "."],
        cwd=FRONTEND_DIR
    )

    # Push para Docker Hub
    if args.push:
        print("\n" + "=" * 70)
        print("🚀 [DOCKER PUSH] Enviando imagens para o Docker Hub...")
        print("=" * 70)
        run_step(f"Push Backend: {backend_tag_hub}", ["docker", "push", backend_tag_hub])
        run_step(f"Push Backend: {backend_tag_direct}", ["docker", "push", backend_tag_direct])
        run_step(f"Push Frontend: {frontend_tag_hub}", ["docker", "push", frontend_tag_hub])
        run_step(f"Push Frontend: {frontend_tag_direct}", ["docker", "push", frontend_tag_direct])

    print("\n" + "#" * 70)
    print("🎉 [SUCESSO TOTAL] Esteira concluída e imagens Docker geradas!")
    print(f"📦 Versão Oficial: {target_version}")
    print(f"🐳 Backend Tags:  {backend_tag_hub} e {backend_tag_direct}")
    print(f"🐳 Frontend Tags: {frontend_tag_hub} e {frontend_tag_direct}")
    print("🚫 Nenhuma tag 'latest' foi criada, respeitando a regra estrita.")
    print("#" * 70 + "\n")

if __name__ == "__main__":
    main()
