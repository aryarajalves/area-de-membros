import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_verification_email(to_email: str, to_name: str, code: str) -> bool:
    """
    Envia e-mail com código OTP de verificação utilizando a API REST do Brevo.
    Se a chave da API não estiver preenchida (ambiente dev/teste), registra no log sem quebrar.
    """
    if not settings.BREVO_API_KEY or not settings.BREVO_SENDER_EMAIL:
        logger.warning(
            f"[BREVO EMAIL DEV] Chave BREVO_API_KEY ou BREVO_SENDER_EMAIL não configurada. "
            f"Código de verificação para {to_email}: {code}"
        )
        return True

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }}
        .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .code-box {{ background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e293b; margin: 24px 0; }}
        .footer {{ font-size: 13px; color: #64748b; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: #0f172a; margin: 0;">Confirmação de Cadastro</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 8px;">{settings.PROJECT_NAME}</p>
        </div>
        <p>Olá, <strong>{to_name}</strong>!</p>
        <p>Recebemos uma solicitação de cadastro para o seu e-mail. Para validar sua conta e confirmar o acesso, utilize o código de 6 dígitos abaixo:</p>
        
        <div class="code-box">{code}</div>
        
        <p style="font-size: 14px; color: #475569;">Este código expira em <strong>15 minutos</strong>. Se você não solicitou este cadastro, desconsidere esta mensagem.</p>
        
        <div class="footer">
          &copy; {settings.PROJECT_NAME} - Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
    """

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [
            {
                "email": to_email,
                "name": to_name,
            }
        ],
        "subject": f"{code} é o seu código de verificação - {settings.PROJECT_NAME}",
        "htmlContent": html_content,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code in [200, 201, 202]:
                logger.info(f"[BREVO EMAIL] E-mail de verificação enviado com sucesso para {to_email}")
                return True
            else:
                logger.error(
                    f"[BREVO EMAIL ERROR] Falha ao enviar para {to_email}: "
                    f"Status {response.status_code} - {response.text}"
                )
                return False
    except Exception as e:
        logger.error(f"[BREVO EMAIL EXCEPTION] Erro ao conectar com API Brevo: {str(e)}")
        return False
