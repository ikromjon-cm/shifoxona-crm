from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.companies.models import Branch, Company
from apps.rbac.models import Permission, Role, UserRole


class Command(BaseCommand):
    help = 'Seed initial system data: permissions, roles, demo company, and superadmin'

    def handle(self, *args, **options):
        self.stdout.write('Seeding system data...')

        self._sync_permissions()
        self._seed_roles()
        self._seed_demo_company()

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))

    def _sync_permissions(self):
        from apps.rbac.models import MODELS_REGISTRY, PERMISSION_ACTIONS

        existing = {(p.model_name, p.action): p for p in Permission.objects.all()}
        new_perms = []

        for model_name, _ in MODELS_REGISTRY:
            for action, _ in PERMISSION_ACTIONS:
                key = (model_name, action)
                if key not in existing:
                    new_perms.append(Permission(
                        model_name=model_name,
                        action=action,
                        codename=f'{action}_{model_name}',
                    ))

        if new_perms:
            Permission.objects.bulk_create(new_perms, batch_size=200)
            self.stdout.write(f'  Created {len(new_perms)} new permissions.')
        else:
            self.stdout.write('  All permissions up to date.')

    def _seed_roles(self):
        if Role.objects.filter(is_system=True).exists():
            self._sync_role_permissions()
            return

        self._create_system_roles()

    def _sync_role_permissions(self):
        all_perms = {p.codename: p for p in Permission.objects.all()}
        roles_config = self._get_roles_config()
        updated = 0

        for code, data in roles_config.items():
            if data['models'] is None:
                role_perms = list(all_perms.values())
            else:
                role_perms = []
                for m in data['models']:
                    for action, _ in Permission._meta.get_field('action').choices:
                        codename = f'{action}_{m}'
                        if codename in all_perms:
                            role_perms.append(all_perms[codename])

            try:
                role = Role.objects.get(code=code, is_system=True)
                current_perms = set(role.permissions.values_list('id', flat=True))
                new_perms = set(p.id for p in role_perms)
                if current_perms != new_perms:
                    role.permissions.set(role_perms)
                    updated += 1
            except Role.DoesNotExist:
                pass

        if updated:
            self.stdout.write(f'  Updated {updated} roles with new permissions.')
        else:
            self.stdout.write('  All roles up to date.')

    def _get_roles_config(self):
        return {
            'superadmin': {
                'name': 'Super Admin',
                'code': 'superadmin',
                'models': None,
            },
            'admin': {
                'name': 'Administrator',
                'code': 'admin',
                'models': [
                    'company', 'branch', 'department', 'position',
                    'user', 'employee', 'role', 'permission',
                    'warehouse_zone', 'warehouse_rack', 'warehouse_shelf', 'warehouse_bin',
                    'inventory', 'medicine', 'category', 'supplier',
                    'batch', 'income', 'expense',
                    'pharmacy', 'order', 'delivery',
                    'report', 'notification', 'attendance', 'task', 'taskcomment', 'taskattachment',
                    'chatroom', 'chatmessage', 'finance',
                    'geofencezone', 'shift', 'attendancerecord', 'attendancesession', 'leaverequest',
                ],
            },
            'operator': {
                'name': 'Operator',
                'code': 'operator',
                'models': ['medicine', 'category', 'supplier', 'batch', 'income', 'expense',
                           'inventory', 'pharmacy', 'order', 'delivery', 'notification',
                           'report', 'task', 'taskcomment', 'chatroom', 'chatmessage',
                           'geofencezone', 'shift', 'attendancerecord', 'attendancesession'],
            },
            'warehouse': {
                'name': 'Omborchi',
                'code': 'warehouse',
                'models': ['warehouse_zone', 'warehouse_rack', 'warehouse_shelf', 'warehouse_bin',
                           'inventory', 'income', 'expense', 'medicine', 'batch', 'supplier',
                           'task', 'taskcomment', 'chatroom', 'chatmessage',
                           'geofencezone', 'shift', 'attendancerecord', 'attendancesession'],
            },
            'driver': {
                'name': 'Haydovchi',
                'code': 'driver',
                'models': ['delivery', 'order', 'notification', 'pharmacy',
                           'task', 'taskcomment', 'chatroom', 'chatmessage',
                           'geofencezone', 'attendancerecord', 'attendancesession'],
            },
            'finance': {
                'name': 'Moliyachi',
                'code': 'finance',
                'models': ['income', 'expense', 'order', 'report',
                           'pharmacy', 'supplier', 'inventory', 'finance',
                           'leaverequest'],
            },
            'pharmacy': {
                'name': 'Dorixona',
                'code': 'pharmacy',
                'models': ['order', 'delivery', 'pharmacy', 'medicine', 'batch',
                           'notification', 'leaverequest'],
            },
        }

    def _create_system_roles(self):
        all_perms = {p.codename: p for p in Permission.objects.all()}

        for code, data in self._get_roles_config().items():
            if data['models'] is None:
                role_perms = list(all_perms.values())
            else:
                role_perms = []
                for m in data['models']:
                    for action, _ in Permission._meta.get_field('action').choices:
                        codename = f'{action}_{m}'
                        if codename in all_perms:
                            role_perms.append(all_perms[codename])

            role = Role.objects.create(
                name=data['name'],
                code=code,
                description=f'{data["name"]} - tizim roli',
                is_system=True,
            )
            role.permissions.set(role_perms)
            self.stdout.write(f'  Created role: {data["name"]} ({len(role_perms)} permissions)')

    def _seed_demo_company(self):
        if Company.objects.filter(inn='123456789').exists():
            self.stdout.write('  Demo company already exists, skipping.')
            return

        company = Company.objects.create(
            name='Shifoxona Demo MCHJ',
            short_name='Shifoxona',
            inn='123456789',
            phone='+998710000000',
            email='info@shifoxona.uz',
            address='Toshkent sh., Yunusobod tumani',
            is_active=True,
        )
        self.stdout.write(f'  Created company: {company.name}')

        branch = Branch.objects.create(
            company=company,
            name='Asosiy filial',
            code='MAIN',
            phone='+998710000001',
            address='Toshkent sh., Yunusobod tumani, 12-uy',
            is_active=True,
        )
        self.stdout.write(f'  Created branch: {branch.name}')

        admin_role = Role.objects.filter(code='superadmin').first()

        try:
            admin_user = User.objects.get(login='shifoxona')
            admin_user.company = company
            admin_user.branch = branch
            admin_user.save()

            if admin_role:
                UserRole.objects.get_or_create(
                    user=admin_user,
                    role=admin_role,
                    company=company,
                    branch=branch,
                )
            self.stdout.write(f'  Linked superadmin to company: {admin_user.login}')
        except User.DoesNotExist:
            self.stdout.write('  Superadmin user not found, skipping link.')
