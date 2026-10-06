import os

def check_files():
    frontend_files = []
    backend_files = []
    
    # Checar frontend (< 500 linhas)
    for root, _, files in os.walk(os.path.join("frontend", "src")):
        for f in files:
            if f.endswith((".jsx", ".js", ".css")) and not f.endswith((".test.jsx", ".test.js")):
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8") as file:
                        count = len(file.readlines())
                        if count > 500:
                            frontend_files.append((count, path))
                except Exception:
                    pass

    # Checar backend (< 1000 linhas)
    for root, _, files in os.walk("backend"):
        if "venv" in root or ".pytest_cache" in root or "__pycache__" in root:
            continue
        for f in files:
            if f.endswith(".py"):
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8") as file:
                        count = len(file.readlines())
                        if count > 1000:
                            backend_files.append((count, path))
                except Exception:
                    pass

    print("=== ARQUIVOS FRONTEND ACIMA DE 500 LINHAS ===")
    for count, path in sorted(frontend_files, key=lambda x: x[0], reverse=True):
        print(f"{count:4d} linhas -> {path}")

    print("\n=== ARQUIVOS BACKEND ACIMA DE 1000 LINHAS ===")
    for count, path in sorted(backend_files, key=lambda x: x[0], reverse=True):
        print(f"{count:4d} linhas -> {path}")

if __name__ == "__main__":
    check_files()
