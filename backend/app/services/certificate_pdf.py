import io
import os
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Line


class NumberedCanvas(canvas.Canvas):
    """Canvas customizado para moldura ornamental do certificado."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_certificate_frame()
            super().showPage()
        super().save()

    def draw_certificate_frame(self):
        width, height = landscape(A4)
        self.saveState()

        # Fundo do certificado
        self.setFillColor(colors.HexColor("#f8fafc"))
        self.rect(0, 0, width, height, fill=True, stroke=False)

        # Moldura externa azul escuro
        self.setStrokeColor(colors.HexColor("#0f172a"))
        self.setLineWidth(4)
        self.rect(20, 20, width - 40, height - 40, fill=False, stroke=True)

        # Moldura interna dourada
        self.setStrokeColor(colors.HexColor("#d97706"))
        self.setLineWidth(1.5)
        self.rect(26, 26, width - 52, height - 52, fill=False, stroke=True)

        # Detalhes geométricos nos 4 cantos
        corner_size = 18
        for x, y, dx, dy in [
            (26, 26, 1, 1),
            (width - 26, 26, -1, 1),
            (26, height - 26, 1, -1),
            (width - 26, height - 26, -1, -1),
        ]:
            self.setFillColor(colors.HexColor("#d97706"))
            p = self.beginPath()
            p.moveTo(x, y)
            p.lineTo(x + (corner_size * dx), y)
            p.lineTo(x, y + (corner_size * dy))
            p.close()
            self.drawPath(p, fill=True, stroke=False)

        self.restoreState()


MESES_PT_BR = {
    1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril",
    5: "maio", 6: "junho", 7: "julho", 8: "agosto",
    9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"
}


def generate_qr_code_image_bytes(validation_url: str) -> io.BytesIO:
    """Gera o QR Code de validação em memória."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(validation_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def generate_certificate_pdf_bytes(
    student_name: str,
    course_title: str,
    workload_hours: int,
    certificate_code: str,
    issued_at: datetime,
    instructor_name: str = None,
    validation_base_url: str = "http://localhost:3010",
) -> bytes:
    """
    Gera o PDF vetorial em paisagem (Landscape A4) do Certificado Oficial de Conclusão.
    """
    buffer = io.BytesIO()
    page_width, page_height = landscape(A4)

    # Margens internas respeitando a moldura ornamental
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=50,
        rightMargin=50,
        topMargin=46,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#0f172a"),
        alignment=1,  # Centralizado
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "CertSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#d97706"),
        alignment=1,
        spaceAfter=18,
    )

    intro_style = ParagraphStyle(
        "CertIntro",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#475569"),
        alignment=1,
        spaceAfter=10,
    )

    student_name_style = ParagraphStyle(
        "CertStudent",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#1e3a8a"),
        alignment=1,
        spaceAfter=12,
    )

    course_title_style = ParagraphStyle(
        "CertCourse",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=1,
        spaceAfter=14,
    )

    body_style = ParagraphStyle(
        "CertBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=colors.HexColor("#334155"),
        alignment=1,
        spaceAfter=20,
    )

    story = []

    # Cabeçalho do Certificado
    story.append(Paragraph("CERTIFICADO DE CONCLUSÃO", title_style))
    story.append(Paragraph("ÁREA DE MEMBROS • PLATAFORMA OFICIAL DE ENSINO", subtitle_style))
    story.append(Spacer(1, 4))

    # Corpo
    story.append(Paragraph("Certificamos para os devidos fins que o(a) aluno(a)", intro_style))
    story.append(Paragraph(student_name.strip(), student_name_style))
    story.append(Paragraph(f"concluiu integralmente todos os módulos e requisitos do curso", intro_style))
    story.append(Paragraph(f"“{course_title.strip()}”", course_title_style))

    hours = workload_hours or 10
    body_text = (
        f"com carga horária total estimada de <b>{hours} horas</b>, demonstrando dedicação e "
        f"aproveitamento em todas as etapas, projetos e aulas práticas ministradas."
    )
    story.append(Paragraph(body_text, body_style))
    story.append(Spacer(1, 10))

    # Data por extenso
    dia = issued_at.day
    mes = MESES_PT_BR.get(issued_at.month, "janeiro")
    ano = issued_at.year
    data_extenso = f"Emitido em {dia} de {mes} de {ano}"

    # QR Code e link de validação
    validation_url = f"{validation_base_url.rstrip('/')}/validar-certificado/{certificate_code}"
    qr_buffer = generate_qr_code_image_bytes(validation_url)
    qr_img = RLImage(qr_buffer, width=64, height=64)

    # Tabela de Rodapé: Assinatura (Esquerda) | Autenticidade (Centro) | QR Code (Direita)
    instrutor_final = (instructor_name or "Coordenação Acadêmica").strip()

    col_left = [
        Spacer(1, 16),
        Paragraph(f"<b>{instrutor_final}</b>", ParagraphStyle("Instrutor", alignment=0, fontName="Helvetica-Bold", fontSize=11, textColor=colors.HexColor("#0f172a"))),
        Paragraph("Instrutor / Responsável Acadêmico", ParagraphStyle("Cargo", alignment=0, fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#64748b"))),
        Spacer(1, 4),
        Paragraph(data_extenso, ParagraphStyle("DataExtenso", alignment=0, fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#64748b"))),
    ]

    col_center = [
        Spacer(1, 16),
        Paragraph("<b>CÓDIGO DE AUTENTICIDADE</b>", ParagraphStyle("CodeLabel", alignment=1, fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#64748b"))),
        Paragraph(f"<b>{certificate_code}</b>", ParagraphStyle("CodeValue", alignment=1, fontName="Courier-Bold", fontSize=12, textColor=colors.HexColor("#0f172a"))),
        Paragraph("Documento emitido digitalmente", ParagraphStyle("DocSign", alignment=1, fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#94a3b8"))),
    ]

    col_right = [
        qr_img,
        Paragraph("Aponte a câmera para validar", ParagraphStyle("QRText", alignment=1, fontName="Helvetica", fontSize=7.5, textColor=colors.HexColor("#64748b"))),
    ]

    table_data = [[col_left, col_center, col_right]]
    footer_table = Table(table_data, colWidths=[290, 290, 140])
    footer_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("ALIGN", (2, 0), (2, 0), "CENTER"),
    ]))

    story.append(footer_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
