from django.core.management.base import BaseCommand
from django.utils import timezone
from quizzes.models import UserProfile
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Update leaderboard statistics and rankings'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(f'Starting leaderboard update at {timezone.now()}')
        )

        try:
            # Get all user profiles
            profiles = UserProfile.objects.all()
            profile_count = profiles.count()

            if profile_count == 0:
                self.stdout.write(
                    self.style.WARNING('No user profiles found to update')
                )
                return

            # Update stats for all profiles
            updated_count = 0
            for profile in profiles:
                profile.update_stats()
                updated_count += 1

            self.stdout.write(
                self.style.SUCCESS(f'Updated statistics for {updated_count} user profiles')
            )

            # Update all ranks
            UserProfile.update_all_ranks()

            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated leaderboard rankings at {timezone.now()}')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating leaderboard: {str(e)}')
            )
            logger.error(f'Leaderboard update failed: {str(e)}', exc_info=True)
            raise