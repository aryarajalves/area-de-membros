"""
Serviço de Armazenamento S3 (Backblaze B2 / AWS S3) para Backups do PostgreSQL.
"""
import io
import os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.logger import logger

def get_s3_client():
    """Retorna o cliente S3 configurado para o Backblaze B2."""
    endpoint = settings.EFFECTIVE_B2_ENDPOINT_URL
    if not endpoint or not settings.B2_KEY_ID or not settings.B2_APPLICATION_KEY:
        logger.warning(
            f"[B2 Storage] Credenciais incompletas: endpoint={bool(endpoint)}, "
            f"key_id={bool(settings.B2_KEY_ID)}, app_key={bool(settings.B2_APPLICATION_KEY)}"
        )
        return None
    try:
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.B2_KEY_ID,
            aws_secret_access_key=settings.B2_APPLICATION_KEY,
            config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
        )
    except Exception as e:
        logger.error(f"[B2 Storage] Erro ao inicializar cliente S3/B2: {e}")
        return None

def check_b2_connection() -> dict:
    """Verifica se as credenciais do Backblaze B2 estão configuradas e se o bucket está acessível."""
    endpoint = settings.EFFECTIVE_B2_ENDPOINT_URL
    if not endpoint or not settings.B2_KEY_ID or not settings.B2_APPLICATION_KEY or not settings.B2_BUCKET_NAME:
        return {
            "connected": False,
            "status": "Não Configurado",
            "message": "Credenciais do Backblaze B2 não foram preenchidas no .env",
            "bucket": settings.B2_BUCKET_NAME or "—"
        }
    
    s3 = get_s3_client()
    if not s3:
        return {
            "connected": False,
            "status": "Erro de Cliente",
            "message": "Falha ao instanciar cliente S3",
            "bucket": settings.B2_BUCKET_NAME
        }

    try:
        s3.head_bucket(Bucket=settings.B2_BUCKET_NAME)
        return {
            "connected": True,
            "status": "Conectado",
            "message": "Sincronização em nuvem ativa",
            "bucket": settings.B2_BUCKET_NAME
        }
    except ClientError as e:
        logger.error(f"Erro ao conectar ao bucket {settings.B2_BUCKET_NAME}: {e}")
        return {
            "connected": False,
            "status": "Erro de Conexão",
            "message": str(e),
            "bucket": settings.B2_BUCKET_NAME
        }
    except Exception as e:
        logger.error(f"Erro inesperado no check_b2_connection: {e}")
        return {
            "connected": False,
            "status": "Desconectado",
            "message": str(e),
            "bucket": settings.B2_BUCKET_NAME
        }

def upload_backup_file(file_bytes: bytes, filename: str, folder: str = None) -> str:
    """Faz upload do arquivo compactado de backup para o bucket S3/B2."""
    s3 = get_s3_client()
    target_folder = folder or settings.B2_FOLDER
    if not target_folder.endswith("/"):
        target_folder += "/"
    s3_key = f"{target_folder}{filename}"

    if s3 and settings.B2_BUCKET_NAME:
        try:
            s3.put_object(
                Bucket=settings.B2_BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType="application/gzip"
            )
            logger.info(f"Backup {filename} enviado com sucesso para o bucket {settings.B2_BUCKET_NAME} chave {s3_key}")
            return s3_key
        except Exception as e:
            logger.error(f"Erro ao enviar backup para S3/B2: {e}")
            # Se falhar no upload remoto, salva localmente em /app/backups_local/
            pass

    # Fallback local se S3 não estiver configurado
    local_dir = "/app/backups_local"
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join(local_dir, filename)
    with open(local_path, "wb") as f:
        f.write(file_bytes)
    logger.info(f"Backup {filename} salvo localmente em {local_path} (S3 não configurado ou offline)")
    return s3_key

def download_backup_file(s3_key: str, filename: str) -> bytes:
    """Baixa o arquivo de backup do S3 ou do fallback local."""
    s3 = get_s3_client()
    if s3 and settings.B2_BUCKET_NAME:
        try:
            response = s3.get_object(Bucket=settings.B2_BUCKET_NAME, Key=s3_key)
            return response["Body"].read()
        except Exception as e:
            logger.error(f"Erro ao baixar {s3_key} do S3/B2: {e}")

    # Fallback local
    local_path = os.path.join("/app/backups_local", filename)
    if os.path.exists(local_path):
        with open(local_path, "rb") as f:
            return f.read()
    raise FileNotFoundError(f"Arquivo de backup {filename} não foi encontrado no S3 nem no armazenamento local.")

def delete_backup_file(s3_key: str, filename: str) -> bool:
    """Exclui o arquivo de backup do bucket S3 e do armazenamento local."""
    s3 = get_s3_client()
    if s3 and settings.B2_BUCKET_NAME:
        try:
            s3.delete_object(Bucket=settings.B2_BUCKET_NAME, Key=s3_key)
            logger.info(f"Arquivo {s3_key} deletado do S3/B2 com sucesso")
        except Exception as e:
            logger.error(f"Erro ao deletar {s3_key} do S3/B2: {e}")

    local_path = os.path.join("/app/backups_local", filename)
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception:
            pass
    return True

def rename_backup_file(old_s3_key: str, old_filename: str, new_filename: str, folder: str = None) -> str:
    """Renomeia um arquivo no bucket S3 (copy + delete) e no armazenamento local."""
    target_folder = folder or settings.B2_FOLDER
    if not target_folder.endswith("/"):
        target_folder += "/"
    new_s3_key = f"{target_folder}{new_filename}"

    s3 = get_s3_client()
    if s3 and settings.B2_BUCKET_NAME:
        try:
            # No S3 a renomeação é realizada copiando para a nova chave e excluindo a antiga
            copy_source = {"Bucket": settings.B2_BUCKET_NAME, "Key": old_s3_key}
            s3.copy_object(CopySource=copy_source, Bucket=settings.B2_BUCKET_NAME, Key=new_s3_key)
            s3.delete_object(Bucket=settings.B2_BUCKET_NAME, Key=old_s3_key)
            logger.info(f"Arquivo renomeado no S3 de {old_s3_key} para {new_s3_key}")
        except Exception as e:
            logger.error(f"Erro ao renomear arquivo no S3: {e}")

    # Fallback local
    old_local = os.path.join("/app/backups_local", old_filename)
    new_local = os.path.join("/app/backups_local", new_filename)
    if os.path.exists(old_local):
        try:
            os.rename(old_local, new_local)
        except Exception as e:
            logger.error(f"Erro ao renomear arquivo local: {e}")

    return new_s3_key


def upload_media_file(file_bytes: bytes, filename: str, content_type: str, folder: str = "AreaDeMembros/videos/") -> str:
    """
    Faz upload de arquivo de mídia (vídeo de aula ou thumbnail de curso) para o Backblaze B2.
    Retorna a URL pública/direta do arquivo no Backblaze B2, ou None se falhar.
    """
    s3 = get_s3_client()
    target_folder = folder
    if not target_folder.endswith("/"):
        target_folder += "/"
    s3_key = f"{target_folder}{filename}"

    if s3 and settings.B2_BUCKET_NAME:
        try:
            s3.put_object(
                Bucket=settings.B2_BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type
            )
            # URL de acesso direto ao Backblaze B2
            if settings.BACKBLAZE_CDN_URL:
                base_url = settings.BACKBLAZE_CDN_URL.rstrip("/")
                if settings.B2_BUCKET_NAME not in base_url:
                    media_url = f"{base_url}/{settings.B2_BUCKET_NAME}/{s3_key}"
                else:
                    media_url = f"{base_url}/{s3_key}"
            else:
                endpoint = (settings.EFFECTIVE_B2_ENDPOINT_URL or "").rstrip("/")
                media_url = f"{endpoint}/{settings.B2_BUCKET_NAME}/{s3_key}"

            logger.info(f"Mídia {filename} enviada para Backblaze B2 com sucesso: {media_url}")
            return media_url
        except Exception as e:
            logger.error(f"Erro ao enviar mídia {filename} para Backblaze B2: {e}")

    return None


def delete_media_file(media_url: str) -> bool:
    """Exclui um arquivo de mídia do Backblaze B2 caso esteja armazenado lá."""
    if not media_url:
        return False
    s3 = get_s3_client()
    if not s3 or not settings.B2_BUCKET_NAME:
        return False

    try:
        # Se for uma URL do Backblaze B2 contendo a chave
        if settings.B2_BUCKET_NAME in media_url and "AreaDeMembros/" in media_url:
            s3_key = media_url.split(f"{settings.B2_BUCKET_NAME}/")[-1]
            s3.delete_object(Bucket=settings.B2_BUCKET_NAME, Key=s3_key)
            logger.info(f"Mídia {s3_key} deletada do Backblaze B2 com sucesso.")
            return True
    except Exception as e:
        logger.error(f"Erro ao excluir mídia {media_url} do Backblaze B2: {e}")

    return False


def configure_b2_cors():
    """Configura regras de CORS no bucket Backblaze B2 para permitir uploads diretos do navegador."""
    s3 = get_s3_client()
    if not s3 or not settings.B2_BUCKET_NAME:
        return
    try:
        cors_config = {
            'CORSRules': [{
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'PUT', 'POST', 'HEAD'],
                'AllowedOrigins': ['*'],
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3600
            }]
        }
        s3.put_bucket_cors(Bucket=settings.B2_BUCKET_NAME, CORSConfiguration=cors_config)
        logger.info(f"[B2] Regras de CORS configuradas com sucesso no bucket {settings.B2_BUCKET_NAME}.")
    except Exception as e:
        logger.warning(f"[B2] Não foi possível configurar CORS automaticamente no bucket: {e}")


def generate_presigned_upload_url(filename: str, content_type: str, folder: str = "AreaDeMembros/videos/", expires_in: int = 7200) -> dict:
    """
    Gera uma URL pré-assinada temporária para upload direto do navegador ao Backblaze B2 (S3 API).
    Evita que o vídeo passe pelo Nginx/FastAPI na VPS, eliminando timeouts e economizando recursos.
    """
    s3 = get_s3_client()
    if not s3 or not settings.B2_BUCKET_NAME:
        logger.warning(
            f"[B2 Storage] Não foi possível gerar Presigned URL. "
            f"s3_client_ativo={bool(s3)}, bucket_name='{settings.B2_BUCKET_NAME or ''}'. "
            f"Verifique se as credenciais do Backblaze B2 estão configuradas."
        )
        return None

    target_folder = folder
    if not target_folder.endswith("/"):
        target_folder += "/"
    s3_key = f"{target_folder}{filename}"

    try:
        # Garante configuração de CORS no bucket
        try:
            configure_b2_cors()
        except Exception:
            pass

        presigned_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.B2_BUCKET_NAME,
                "Key": s3_key,
                "ContentType": content_type
            },
            ExpiresIn=expires_in
        )

        if settings.BACKBLAZE_CDN_URL:
            base_url = settings.BACKBLAZE_CDN_URL.rstrip("/")
            if settings.B2_BUCKET_NAME not in base_url:
                media_url = f"{base_url}/{settings.B2_BUCKET_NAME}/{s3_key}"
            else:
                media_url = f"{base_url}/{s3_key}"
        else:
            endpoint = (settings.EFFECTIVE_B2_ENDPOINT_URL or "").rstrip("/")
            media_url = f"{endpoint}/{settings.B2_BUCKET_NAME}/{s3_key}"

        logger.info(f"[B2 Storage] Presigned URL gerada com sucesso para {s3_key}")
        return {
            "upload_url": presigned_url,
            "video_url": media_url,
            "s3_key": s3_key,
            "method": "PUT"
        }
    except Exception as e:
        logger.error(f"[B2 Storage] Erro ao gerar presigned URL do Backblaze B2 para {filename}: {e}")
        return None
