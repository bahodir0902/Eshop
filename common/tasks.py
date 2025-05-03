# common/tasks.py
from celery import shared_task
import subprocess
import os
from django.conf import settings
import datetime
import shutil


@shared_task
def backup_postgresql_database():
    """Create a PostgreSQL database backup"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    os.makedirs(backup_dir, exist_ok=True)

    backup_file = os.path.join(backup_dir, f'backup_{timestamp}.sql')

    # Get database settings from Django
    db_settings = settings.DATABASES['default']
    db_name = db_settings['NAME']
    db_user = db_settings['USER']
    db_password = db_settings.get('PASSWORD', '')
    db_host = db_settings.get('HOST', 'localhost')
    db_port = db_settings.get('PORT', '5432')

    # Set environment variable for password
    env = os.environ.copy()
    if db_password:
        env['PGPASSWORD'] = db_password

    # Execute pg_dump
    cmd = [
        'pg_dump',
        f'--dbname={db_name}',
        f'--username={db_user}',
        f'--host={db_host}',
        f'--port={db_port}',
        '--format=custom',
        f'--file={backup_file}'
    ]

    result = subprocess.run(cmd, env=env, capture_output=True, text=True)

    # Cleanup old backups (keep only last 7 days)
    backup_files = [os.path.join(backup_dir, f) for f in os.listdir(backup_dir)]
    backup_files.sort()
    if len(backup_files) > 7:
        for old_file in backup_files[:-7]:
            os.remove(old_file)

    if result.returncode != 0:
        raise Exception(f"Database backup failed: {result.stderr}")

    return f"PostgreSQL backup created at {backup_file}"


@shared_task
def backup_sqlite_database():
    """Create a SQLite database backup"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    os.makedirs(backup_dir, exist_ok=True)

    db_path = settings.DATABASES['default']['NAME']
    backup_path = os.path.join(backup_dir, f'db_backup_{timestamp}.sqlite3')

    # Simple file copy for SQLite
    shutil.copy2(db_path, backup_path)

    # Cleanup old backups (keep only last 7 days)
    backup_files = [os.path.join(backup_dir, f) for f in os.listdir(backup_dir) if f.endswith('.sqlite3')]
    backup_files.sort()
    if len(backup_files) > 7:
        for old_file in backup_files[:-7]:
            os.remove(old_file)

    return f"SQLite backup created at {backup_path}"