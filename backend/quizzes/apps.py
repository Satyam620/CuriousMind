from django.apps import AppConfig
import logging
import os

logger = logging.getLogger(__name__)

class QuizzesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'quizzes'

    def ready(self):
        # Only start scheduler in the main process (not during migrations, etc.)
        if os.environ.get('RUN_MAIN'):
            from .scheduler import start_scheduler
            try:
                start_scheduler()
                logger.info("Leaderboard scheduler started successfully")
            except Exception as e:
                logger.error(f"Failed to start leaderboard scheduler: {str(e)}")
