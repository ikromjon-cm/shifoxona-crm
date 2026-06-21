import base64
import io

import qrcode
from django.core.files.base import ContentFile


def generate_qr_code(data, model_obj=None, field_name=None):
    """Generate a QR code image and optionally save it to a model field.

    Args:
        data: String data to encode in the QR code
        model_obj: Optional Django model instance to save the QR image to
        field_name: If model_obj is provided, the ImageField/FileField name to save to

    Returns:
        PIL Image object, and if model_obj+field_name provided, saves to model
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    if model_obj and field_name:
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        filename = f'{model_obj.__class__.__name__.lower()}_{model_obj.pk}_qr.png'
        getattr(model_obj, field_name).save(filename, ContentFile(buffer.read()), save=True)

    return img


def generate_bin_qr_data(bin_obj):
    """Generate QR data string for a WarehouseBin."""
    return f'SHIFOXONA:BIN:{bin_obj.code}:{bin_obj.id}'


def generate_batch_qr_data(batch_obj):
    """Generate QR data string for a MedicineBatch."""
    return f'SHIFOXONA:BATCH:{batch_obj.batch_number or batch_obj.series_number}:{batch_obj.id}'


def generate_product_qr_data(product_obj):
    """Generate QR data string for a Medicine/Product."""
    return f'SHIFOXONA:PRODUCT:{product_obj.barcode}:{product_obj.id}'


def generate_qr_base64(data):
    """Generate QR code and return as base64 string."""
    img = generate_qr_code(data)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')
