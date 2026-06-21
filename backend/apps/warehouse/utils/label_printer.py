import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .qr_generator import generate_batch_qr_data, generate_bin_qr_data, generate_qr_code


def generate_bin_label_pdf(bin_obj):
    """Generate a printable PDF label for a WarehouseBin with QR code."""
    buf = io.BytesIO()

    qr_data = generate_bin_qr_data(bin_obj)
    qr_img = generate_qr_code(qr_data)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)

    doc = SimpleDocTemplate(buf, pagesize=(100*mm, 70*mm),
                            rightMargin=5*mm, leftMargin=5*mm,
                            topMargin=5*mm, bottomMargin=5*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Normal'],
                                 fontSize=10, alignment=1, spaceAfter=4)
    code_style = ParagraphStyle('Code', parent=styles['Normal'],
                                fontSize=8, alignment=1)
    small_style = ParagraphStyle('Small', parent=styles['Normal'],
                                 fontSize=6, alignment=1)

    elements = []

    elements.append(Paragraph(f'<b>{bin_obj.code}</b>', title_style))
    elements.append(Spacer(1, 2*mm))

    qr_image = Image(qr_buffer, width=40*mm, height=40*mm)
    elements.append(qr_image)
    elements.append(Spacer(1, 2*mm))

    zone_name = bin_obj.shelf.rack.zone.name if bin_obj.shelf and bin_obj.shelf.rack and bin_obj.shelf.rack.zone else ''
    rack_code = bin_obj.shelf.rack.code if bin_obj.shelf and bin_obj.shelf.rack else ''
    shelf_code = bin_obj.shelf.code if bin_obj.shelf else ''

    elements.append(Paragraph(f'{zone_name} / {rack_code} / {shelf_code}', code_style))
    elements.append(Paragraph(f'ID: {bin_obj.id}', small_style))

    doc.build(elements)
    buf.seek(0)
    return buf


def generate_batch_label_pdf(batch_obj):
    """Generate a printable PDF label for a MedicineBatch with QR code."""
    buf = io.BytesIO()

    qr_data = generate_batch_qr_data(batch_obj)
    qr_img = generate_qr_code(qr_data)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)

    doc = SimpleDocTemplate(buf, pagesize=(70*mm, 50*mm),
                            rightMargin=3*mm, leftMargin=3*mm,
                            topMargin=3*mm, bottomMargin=3*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Normal'],
                                 fontSize=8, alignment=1, spaceAfter=2)
    info_style = ParagraphStyle('Info', parent=styles['Normal'],
                                fontSize=6, alignment=1)

    elements = []

    elements.append(Paragraph(f'<b>{batch_obj.medicine.name}</b>', title_style))
    elements.append(Spacer(1, 1*mm))

    qr_image = Image(qr_buffer, width=25*mm, height=25*mm)
    elements.append(qr_image)
    elements.append(Spacer(1, 1*mm))

    batch_no = batch_obj.batch_number or batch_obj.series_number or '-'
    elements.append(Paragraph(f'Batch: {batch_no}', info_style))
    elements.append(Paragraph(f'Yaroqli: {batch_obj.expiry_date}', info_style))

    doc.build(elements)
    buf.seek(0)
    return buf


def generate_sheet_label_pdf(bins_or_batches, label_type='bin'):
    """Generate A4 sheet with multiple labels."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=10*mm, leftMargin=10*mm,
                            topMargin=10*mm, bottomMargin=10*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Normal'],
                                 fontSize=6, alignment=1, spaceAfter=1)
    code_style = ParagraphStyle('Code', parent=styles['Normal'],
                                fontSize=5, alignment=1)

    elements = []
    row_data = []
    col_count = 3

    for i, obj in enumerate(bins_or_batches):
        if label_type == 'bin':
            qr_data = generate_bin_qr_data(obj)
            title_text = f'<b>{obj.code}</b>'
        else:
            qr_data = generate_batch_qr_data(obj)
            title_text = f'<b>{obj.medicine.name}</b>'

        qr_img = generate_qr_code(qr_data)
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)

        cell_elements = []
        cell_elements.append(Paragraph(title_text, title_style))
        cell_elements.append(Image(qr_buffer, width=30*mm, height=30*mm))

        cell_table = Table([[e] for e in cell_elements])
        cell_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))

        row_data.append(cell_table)

        if (i + 1) % col_count == 0 or i == len(bins_or_batches) - 1:
            if row_data:
                table = Table([row_data], colWidths=[60*mm]*len(row_data))
                table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                elements.append(table)
                elements.append(Spacer(1, 5*mm))
                row_data = []

    doc.build(elements)
    buf.seek(0)
    return buf
