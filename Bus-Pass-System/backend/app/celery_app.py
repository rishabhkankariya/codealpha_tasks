"""Celery application configuration"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "smart_bus_pass",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks"]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    "expire-reservations-every-minute": {
        "task": "app.tasks.expire_reservations",
        "schedule": 60.0,  # Every minute
    },
    "expire-passes-daily": {
        "task": "app.tasks.expire_passes",
        "schedule": crontab(hour=0, minute=0),  # Daily at midnight
    },
    "send-pass-expiry-reminders": {
        "task": "app.tasks.send_pass_expiry_reminders",
        "schedule": crontab(hour=9, minute=0),  # Daily at 9 AM
    },
}

if __name__ == "__main__":
    celery_app.start()
