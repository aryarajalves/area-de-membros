import html
from typing import Optional
import httpx
from app.core.config import settings
from app.core.logger import logger


async def send_verification_email(
    to_email: str,
    to_name: str,
    code: str = "",
    verification_url: Optional[str] = None,
    platform_name: Optional[str] = None,
) -> bool:
    """
    Envia e-mail de confirmação de conta com botão de ativação (Magic Link)
    no estilo escuro e dourado utilizando a API REST do Brevo.
    Se a chave da API não estiver configurada (ambiente dev/teste), registra no log sem quebrar.
    """
    brand_name = html.escape(platform_name or settings.BREVO_SENDER_NAME or settings.PROJECT_NAME)
    safe_name = html.escape(to_name or "Membro")
    safe_url = html.escape(verification_url or "#", quote=True)

    if not settings.BREVO_API_KEY or not settings.BREVO_SENDER_EMAIL:
        logger.warning(
            f"[BREVO EMAIL DEV] Chave BREVO_API_KEY ou BREVO_SENDER_EMAIL não configurada. "
            f"Link de confirmação para {to_email}: {verification_url or code}"
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
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Acesso - {brand_name}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #06080d; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; margin: 0 auto; background-color: #11141d; border: 1px solid #262b38; border-radius: 16px; overflow: hidden;">
        <tr>
          <td style="padding: 36px 32px 24px 32px; text-align: center; background: linear-gradient(180deg, #161a26 0%, #11141d 100%); border-bottom: 1px solid #1f2433;">
            <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #eab308;">
              {brand_name}
            </p>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
              Confirmação de Acesso
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 32px 32px 32px;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #f8fafc;">
              Olá, <strong style="color: #eab308;">{safe_name}</strong> ✨
            </p>
            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              Você iniciou a criação da sua conta na <strong style="color: #ffffff;">{brand_name}</strong>. Para validar seu e-mail e entrar automaticamente na comunidade, clique no botão abaixo:
            </p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
              <tr>
                <td align="center">
                  <a href="{safe_url}" target="_blank" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #facc15 0%, #ca8a04 100%); color: #090d16; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 8px 24px rgba(234, 179, 8, 0.25);">
                    Confirmar minha conta
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin: 0 0 24px 0; text-align: center; font-size: 13px; color: #94a3b8;">
              ⏱️ Este link é válido por <strong style="color: #e2e8f0;">30 minutos</strong>.
            </p>

            <div style="background-color: #191610; border: 1px solid #4d3d14; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #fde68a;">
                🔒 <strong>Dica de Segurança:</strong> Nunca compartilhe este link com terceiros. Se você não solicitou este cadastro, apenas desconsidere esta mensagem.
              </p>
            </div>

            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; word-break: break-all;">
              Se o botão acima não funcionar, copie e cole este link no navegador:<br>
              <a href="{safe_url}" style="color: #eab308; text-decoration: underline;">{safe_url}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 18px 32px; text-align: center; border-top: 1px solid #1f2433; background-color: #0d1017; font-size: 12px; color: #64748b;">
            &copy; {brand_name} - Todos os direitos reservados.
          </td>
        </tr>
      </table>
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
        "subject": f"Confirme sua conta - {settings.PROJECT_NAME}",
        "htmlContent": html_content,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code in [200, 201, 202]:
                logger.info(f"[BREVO EMAIL] E-mail de confirmação enviado com sucesso para {to_email}")
                return True
            logger.error(
                f"[BREVO EMAIL ERROR] Falha ao enviar para {to_email}: "
                f"Status {response.status_code} - {response.text}"
            )
            return False
    except Exception as e:
        logger.error(f"[BREVO EMAIL EXCEPTION] Erro ao conectar com API Brevo: {str(e)}")
        return False
