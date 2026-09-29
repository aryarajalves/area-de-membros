#!/usr/bin/env python3
import subprocess
import sys
import os

def run_audit():
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    
    cmd = [
        sys.executable,
        "-m",
        "pip_audit",
        "-r",
        "backend/requirements.txt",
        "--ignore-vuln",
        "PYSEC-2026-1325"
    ]
    
    print("Iniciando auditoria de seguranca de dependencias (pip-audit)...")
    res = subprocess.run(cmd, env=env)
    if res.returncode != 0:
        print("\n[ERRO] Vulnerabilidades de seguranca encontradas!")
        sys.exit(res.returncode)
    else:
        print("\n[SUCESSO] Nenhuma vulnerabilidade critica encontrada no requirements.txt.")

if __name__ == "__main__":
    run_audit()
