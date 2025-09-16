from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.core.management import call_command
from django.utils import timezone
import logging
import atexit

logger = logging.getLogger(__name__)
scheduler = None

def update_leaderboard_job():
    """Job function to update leaderboard statistics and rankings"""
    try:
        logger.info(f"Starting scheduled leaderboard update at {timezone.now()}")
        call_command('update_leaderboard')
        logger.info(f"Completed scheduled leaderboard update at {timezone.now()}")
    except Exception as e:
        logger.error(f"Error in scheduled leaderboard update: {str(e)}", exc_info=True)

def start_scheduler():
    """Start the APScheduler for periodic leaderboard updates"""
    global scheduler

    if scheduler is not None:
        logger.info("Scheduler already running, skipping start")
        return

    scheduler = BackgroundScheduler()

    # Add job to update leaderboard every 5 minutes
    scheduler.add_job(
        func=update_leaderboard_job,
        trigger=IntervalTrigger(minutes=5),
        id='leaderboard_update_job',
        name='Update Leaderboard Statistics',
        replace_existing=True,
        max_instances=1  # Prevent overlapping jobs
    )

    # Start the scheduler
    scheduler.start()
    logger.info("Leaderboard scheduler started - updating every 5 minutes")

    # Shut down the scheduler when the app terminates
    atexit.register(lambda: scheduler.shutdown() if scheduler else None)

def stop_scheduler():
    """Stop the scheduler"""
    global scheduler
    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("Leaderboard scheduler stopped")

def get_scheduler_status():
    """Get the current status of the scheduler"""
    if scheduler is None:
        return {"status": "stopped", "jobs": []}

    running = scheduler.running
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None
        })

    return {
        "status": "running" if running else "stopped",
        "jobs": jobs
    }