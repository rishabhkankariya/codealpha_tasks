import os
from typing import Optional
import base64
import logging
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger(__name__)


def generate_receipt_pdf(
    filename: str,
    title: str,
    payment_id: str,
    email: str,
    amount: float,
    description: str,
    details: dict,
    qr_base64: Optional[str] = None
) -> str:
    """
    Generate a high-quality PDF receipt for tickets/passes.
    Saves it to the filesystem and returns the file path.
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    # Document Setup
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    story = []
    
    # Color Palette
    primary_color = colors.HexColor("#2e5bff")  # Premium Blue
    text_color = colors.HexColor("#2D3748")     # Dark Slate text
    light_bg = colors.HexColor("#F7FAFC")       # Soft light gray/blue background
    border_color = colors.HexColor("#E2E8F0")   # Border lines
    success_color = colors.HexColor("#48BB78")  # Success Green
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'ReceiptTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=primary_color,
        spaceAfter=6,
        alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'ReceiptSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor("#718096"),
        spaceAfter=15,
        alignment=1
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=text_color,
        spaceAfter=8,
        spaceBefore=12
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=text_color
    )
    
    value_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#4A5568")
    )
    
    amount_paid_title_style = ParagraphStyle(
        'AmountPaidTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor("#718096")
    )
    
    amount_paid_value_style = ParagraphStyle(
        'AmountPaidValue',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color
    )

    signature_title_style = ParagraphStyle(
        'SigTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=text_color,
        alignment=2
    )
    
    signature_text_style = ParagraphStyle(
        'SigText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=14,
        textColor=colors.HexColor("#2e5bff"),
        alignment=2
    )
    
    # 1. Header block
    story.append(Paragraph(title.upper(), title_style))
    story.append(Paragraph("PUNE MAHANAGAR PARIVAHAN MAHAMANDAL LTD. (PMPML)", subtitle_style))
    story.append(Spacer(1, 10))
    
    # 2. Main Details Table
    main_details_data = [
        [Paragraph("Payment ID:", label_style), Paragraph(payment_id, value_style)],
        [Paragraph("User Email:", label_style), Paragraph(email, value_style)],
        [Paragraph("Description:", label_style), Paragraph(description, value_style)],
        [Paragraph("Payment Status:", label_style), Paragraph("SUCCESS / CAPTURED", ParagraphStyle('SuccessText', parent=value_style, fontName='Helvetica-Bold', textColor=success_color))],
    ]
    
    main_table = Table(main_details_data, colWidths=[130, 370])
    main_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.white),
    ]))
    story.append(main_table)
    story.append(Spacer(1, 15))
    
    # 3. Item Details Section
    story.append(Paragraph("Journey / Pass Information", section_title_style))
    item_details_data = []
    for k, v in details.items():
        item_details_data.append([Paragraph(f"{k}:", label_style), Paragraph(str(v), value_style)])
        
    item_table = Table(item_details_data, colWidths=[130, 370])
    item_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, border_color),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 20))
    
    # 4. QR Code & Amount Side-by-Side Table
    # Build the QR Code Flowable
    qr_flowable = None
    if qr_base64:
        try:
            if "," in qr_base64:
                _, encoded = qr_base64.split(",", 1)
            else:
                encoded = qr_base64
            qr_bytes = base64.b64decode(encoded)
            qr_flowable = Image(BytesIO(qr_bytes), width=100, height=100)
        except Exception as e:
            logger.error(f"Failed to load QR code for PDF: {e}")
            
    if not qr_flowable:
        # Placeholder
        qr_flowable = Paragraph("QR Code Verification Needed", label_style)
        
    amount_data = [
        [Paragraph("TOTAL AMOUNT PAID", amount_paid_title_style)],
        [Paragraph(f"INR {amount:.2f}", amount_paid_value_style)],
        [Spacer(1, 10)],
        [Paragraph("Inclusive of all taxes and service charges.", ParagraphStyle('Tiny', parent=value_style, fontSize=8, textColor=colors.HexColor("#718096")))]
    ]
    amount_table = Table(amount_data, colWidths=[230])
    amount_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ]))
    
    # Side-by-side table
    sbs_data = [
        [qr_flowable, amount_table]
    ]
    sbs_table = Table(sbs_data, colWidths=[150, 350])
    sbs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EDF2F7")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(sbs_table)
    story.append(Spacer(1, 30))
    
    # 5. Signatures & Disclaimers
    sig_data = [
        ["", Paragraph("Authorized Sign:", signature_title_style)],
        ["", Paragraph("PMPML Transit Authority", signature_text_style)],
        ["", Paragraph("_________________", signature_title_style)]
    ]
    sig_table = Table(sig_data, colWidths=[350, 150])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(sig_table)
    
    # Build Document
    doc.build(story)
    return filename
