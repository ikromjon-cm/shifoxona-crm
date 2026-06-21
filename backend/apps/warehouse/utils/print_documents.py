import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_pick_list_pdf(pick_order):
    """Generate a printable pick list PDF for a PickOrder."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=15*mm, leftMargin=15*mm,
                            topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Normal'],
                                 fontSize=16, spaceAfter=6, alignment=1)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
                                    fontSize=10, spaceAfter=4)
    header_style = ParagraphStyle('Header', parent=styles['Normal'],
                                  fontSize=8, spaceAfter=2)
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'],
                                  fontSize=8)

    elements = []

    # Title
    elements.append(Paragraph('<b>KOMPLEKTATSIYA VARAG\'I</b>', title_style))
    elements.append(Paragraph(f'{pick_order.pick_number}', subtitle_style))
    elements.append(Spacer(1, 5*mm))

    # Info
    info_data = [
        [f'Ombor: {pick_order.warehouse.name}', f'Sana: {datetime.now().strftime("%d.%m.%Y %H:%M")}'],
        [f'Buyurtma: {pick_order.order.order_number if pick_order.order else "-"}',
         f'Strategiya: {pick_order.get_strategy_display()}'],
        [f'Komplektator: {pick_order.assigned_to.get_full_name() if pick_order.assigned_to else "-"}', ''],
    ]
    info_table = Table(info_data, colWidths=[90*mm, 90*mm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 5*mm))

    # Items table
    items = pick_order.items.select_related('medicine', 'warehouse_bin', 'batch').all()

    table_data = [
        ['#', 'Mahsulot', 'Barcode', 'Bin', 'Batch', 'Talab', 'Kompl.', 'Holat'],
    ]

    for i, item in enumerate(items, 1):
        status = '✓' if item.is_picked else '☐'
        table_data.append([
            str(i),
            item.medicine.name,
            item.medicine.barcode or '-',
            item.warehouse_bin.code if item.warehouse_bin else '-',
            item.batch.batch_number or '-' if item.batch else '-',
            str(item.requested_quantity),
            str(item.picked_quantity),
            status,
        ])

    col_widths = [8*mm, 50*mm, 20*mm, 20*mm, 25*mm, 15*mm, 15*mm, 15*mm]
    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
    ]))
    elements.append(items_table)

    # Footer
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph(f'Jami: {len(items)} ta mahsulot', normal_style))
    elements.append(Paragraph('Imzo: ___________________', normal_style))

    doc.build(elements)
    buf.seek(0)
    return buf


def generate_invoice_pdf(order):
    """Generate a printable invoice PDF for an Order."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=15*mm, leftMargin=15*mm,
                            topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Normal'],
                                 fontSize=18, spaceAfter=6, alignment=1)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
                                    fontSize=10, spaceAfter=2)
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'],
                                  fontSize=9)
    total_style = ParagraphStyle('Total', parent=styles['Normal'],
                                 fontSize=11, spaceAfter=4)

    elements = []

    # Header
    elements.append(Paragraph('<b>SHIFOXONA CRM</b>', title_style))
    elements.append(Paragraph('<b>SCHYOT-FAKTURA (INVOICE)</b>', subtitle_style))
    elements.append(Spacer(1, 5*mm))

    # Order info
    info_data = [
        ['Schyot raqami:', order.order_number],
        ['Sana:', order.created_at.strftime('%d.%m.%Y %H:%M') if order.created_at else '-'],
        ['Dorixona:', order.pharmacy.name if order.pharmacy else '-'],
        ['Manzil:', order.pharmacy.address if order.pharmacy else '-'],
        ['STIR:', order.pharmacy.stir_or_license or '-'],
        ['Telefon:', order.pharmacy.phone if order.pharmacy else '-'],
    ]
    info_table = Table(info_data, colWidths=[40*mm, 150*mm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 5*mm))

    # Items table
    items = order.items.select_related('medicine').all()

    table_data = [
        ['#', 'Mahsulot nomi', 'Soni', 'Narx', 'Summa'],
    ]

    for i, item in enumerate(items, 1):
        total = item.quantity * float(item.price)
        table_data.append([
            str(i),
            item.medicine.name,
            str(item.quantity),
            f'{float(item.price):,.0f} so\'m',
            f'{total:,.0f} so\'m',
        ])

    # Total row
    grand_total = sum(item.quantity * float(item.price) for item in items)
    table_data.append(['', '', '', 'JAMI:', f'{grand_total:,.0f} so\'m'])

    col_widths = [10*mm, 80*mm, 20*mm, 35*mm, 45*mm]
    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F3F4F6')]),
    ]))
    elements.append(items_table)

    # Footer
    elements.append(Spacer(1, 15*mm))
    elements.append(Paragraph('Yetkazib beruvchi: ___________________', normal_style))
    elements.append(Paragraph('Qabul qiluvchi: ___________________', normal_style))
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph('<i>Ushbu schyot-faktura SHIFOXONA CRM tizimida avtomatik yaratilgan</i>',
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, alignment=1, textColor=colors.grey)))

    doc.build(elements)
    buf.seek(0)
    return buf
