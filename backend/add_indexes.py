"""Add db_index=True to key fields across all models."""
import re
import os

BASE = '/Users/user/Documents/it park/shifoxona/backend/apps'

# (model_file, field_pattern -> replacement)
# Pattern: field_type = models.CharField(...) -> add db_index=True
# We target fields by their names

ADD_INDEX = {
    # accounts/models.py
    'accounts/models.py': {
        'role': r'(role = models\.CharField\([^)]*)(\))',
        'is_active': r'(is_active = models\.BooleanField\([^)]*)(\))',
        'is_blocked': r'(is_blocked = models\.BooleanField\([^)]*)(\))',
        'created_at': r'(created_at = models\.DateTimeField\(auto_now_add=True[^)]*)(\))',
    },
    # notifications/models.py
    'notifications/models.py': {
        'type': r'(type = models\.CharField\([^)]*)(\))',
        'user': r'(user = models\.ForeignKey\([^)]*related_name=.notifications.[^)]*)(\))',
        'is_read': r'(is_read = models\.BooleanField\([^)]*)(\))',
        'is_global': r'(is_global = models\.BooleanField\([^)]*)(\))',
    },
    # orders/models.py
    'orders/models.py': {
        'status': r'(status = models\.CharField\([^)]*)(\))',
        'created_by': r'(created_by = models\.ForeignKey\([^)]*related_name=.orders.[^)]*)(\))',
        'pharmacy': r'(pharmacy = models\.ForeignKey\([^)]*related_name=.orders.[^)]*)(\))',
    },
    # tasks/models.py
    'tasks/models.py': {
        'priority': r'(priority = models\.CharField\([^)]*)(\))',
        'task_type': r'(task_type = models\.CharField\([^)]*)(\))',
    },
    # delivery/models.py
    'delivery/models.py': {
        'status': r'(status = models\.CharField\([^)]*)(\))',
        'courier': r'(courier = models\.ForeignKey\([^)]*related_name=.deliveries.[^)]*)(\))',
    },
    # medicines/models.py
    'medicines/models.py': {
        'is_active': r'(is_active = models\.BooleanField\([^)]*)(\))',
        'supplier': r'(supplier = models\.ForeignKey\([^)]*related_name=.medicines.[^)]*)(\))',
        'barcode': r'(barcode = models\.CharField\([^)]*)(\))',
    },
    # audit_logs/models.py
    'audit_logs/models.py': {
        'action': r'(action = models\.CharField\([^)]*)(\))',
        'model_name': r'(model_name = models\.CharField\([^)]*)(\))',
    },
    # chat/models.py
    'chat/models.py': {
        'is_read': r'(is_read = models\.BooleanField\([^)]*)(\))',
        'sender': r'(sender = models\.ForeignKey\([^)]*related_name=.sent_messages.[^)]*)(\))',
    },
    # attendance/models.py
    'attendance/models.py': {
        'status': r'(status = models\.CharField\([^)]*)(\))',
        'attendance_type': r'(attendance_type = models\.CharField\([^)]*)(\))',
    },
    # warehouse/models.py
    'warehouse/models.py': {
        'barcode': r'(barcode = models\.CharField\([^)]*unique=[^)]*)(\))',
    },
}

def add_db_index(field_type, field_name):
    """Add db_index=True before the closing paren"""
    if 'db_index' in field_type:
        return field_type
    # Insert db_index=True before the closing )
    return field_type.rstrip().rstrip(',') + ', db_index=True)'

for rel_path, fields in ADD_INDEX.items():
    filepath = os.path.join(BASE, rel_path)
    if not os.path.exists(filepath):
        print(f"SKIP {filepath} - not found")
        continue
    
    with open(filepath) as f:
        content = f.read()
    
    original = content
    for field_name, pattern in fields.items():
        def replacer(m):
            full = m.group(0)
            # Check if db_index already present
            if 'db_index' in full:
                return full
            # Replace closing ) with , db_index=True)
            return full.rstrip()[:-1] + ', db_index=True)'
        
        content = re.sub(pattern, replacer, content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"UPDATED {rel_path}")
    else:
        print(f"NO CHANGE {rel_path}")

print("\nDone! Run: python manage.py makemigrations")
