from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.conf import settings
import os
import glob
import json
from quizzes.models import Quiz, Question, Choice


class Command(BaseCommand):
    help = 'Load quiz fixtures for deployment initialization'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fixtures-dir',
            type=str,
            default='fixtures',
            help='Directory containing fixture files (default: fixtures)'
        )
        parser.add_argument(
            '--category',
            type=str,
            help='Load fixtures for specific category only'
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing quiz data before loading fixtures'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be loaded without actually loading'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip confirmation prompts'
        )

    def handle(self, *args, **options):
        fixtures_dir = options['fixtures_dir']
        category_filter = options['category']
        clear_existing = options['clear_existing']
        dry_run = options['dry_run']
        force = options['force']

        # Check if fixtures directory exists
        if not os.path.exists(fixtures_dir):
            self.stdout.write(
                self.style.ERROR(f'Fixtures directory not found: {fixtures_dir}')
            )
            return

        # Find fixture files
        if category_filter:
            pattern = os.path.join(fixtures_dir, f'*{category_filter}*_fixtures.json')
        else:
            pattern = os.path.join(fixtures_dir, '*_fixtures.json')

        fixture_files = glob.glob(pattern)

        if not fixture_files:
            self.stdout.write(
                self.style.WARNING(f'No fixture files found matching pattern: {pattern}')
            )
            return

        self.stdout.write(f"Found {len(fixture_files)} fixture files:")
        for file in fixture_files:
            file_size = os.path.getsize(file)
            self.stdout.write(f"  - {os.path.basename(file)} ({file_size:,} bytes)")

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: No data will be loaded'))
            self._preview_fixtures(fixture_files)
            return

        # Confirmation prompt
        if not force:
            if clear_existing:
                self.stdout.write(
                    self.style.WARNING('WARNING: This will delete ALL existing quiz data!')
                )

            confirm = input(f'Load {len(fixture_files)} fixture files? [y/N]: ')
            if confirm.lower() not in ['y', 'yes']:
                self.stdout.write('Cancelled')
                return

        # Load fixtures
        try:
            with transaction.atomic():
                if clear_existing:
                    self._clear_existing_data()

                self._load_fixtures(fixture_files)

            self.stdout.write(
                self.style.SUCCESS(f'Successfully loaded {len(fixture_files)} fixture files')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading fixtures: {str(e)}')
            )
            raise

    def _clear_existing_data(self):
        """Clear existing quiz data"""
        self.stdout.write('Clearing existing quiz data...')

        # Delete in proper order to respect foreign key constraints
        Choice.objects.all().delete()
        Question.objects.all().delete()
        Quiz.objects.all().delete()

        self.stdout.write('Existing data cleared')

    def _load_fixtures(self, fixture_files):
        """Load fixture files"""
        total_quizzes = 0
        total_questions = 0
        total_choices = 0

        for fixture_file in fixture_files:
            self.stdout.write(f'Loading {os.path.basename(fixture_file)}...')

            # Load fixture data
            with open(fixture_file, 'r', encoding='utf-8') as f:
                fixture_data = json.load(f)

            # Count objects by model
            quizzes = [obj for obj in fixture_data if obj['model'] == 'quizzes.quiz']
            questions = [obj for obj in fixture_data if obj['model'] == 'quizzes.question']
            choices = [obj for obj in fixture_data if obj['model'] == 'quizzes.choice']

            total_quizzes += len(quizzes)
            total_questions += len(questions)
            total_choices += len(choices)

            # Use Django's loaddata command to load the fixture
            call_command('loaddata', fixture_file, verbosity=0)

            self.stdout.write(
                f'  Loaded: {len(quizzes)} quizzes, {len(questions)} questions, {len(choices)} choices'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Total loaded: {total_quizzes} quizzes, {total_questions} questions, {total_choices} choices'
            )
        )

    def _preview_fixtures(self, fixture_files):
        """Preview what would be loaded"""
        total_quizzes = 0
        total_questions = 0
        total_choices = 0

        for fixture_file in fixture_files:
            with open(fixture_file, 'r', encoding='utf-8') as f:
                fixture_data = json.load(f)

            quizzes = [obj for obj in fixture_data if obj['model'] == 'quizzes.quiz']
            questions = [obj for obj in fixture_data if obj['model'] == 'quizzes.question']
            choices = [obj for obj in fixture_data if obj['model'] == 'quizzes.choice']

            total_quizzes += len(quizzes)
            total_questions += len(questions)
            total_choices += len(choices)

            self.stdout.write(
                f'{os.path.basename(fixture_file)}: '
                f'{len(quizzes)} quizzes, {len(questions)} questions, {len(choices)} choices'
            )

            # Show quiz titles
            for quiz_obj in quizzes[:3]:  # Show first 3 quiz titles
                title = quiz_obj['fields']['title']
                self.stdout.write(f'  - {title}')

            if len(quizzes) > 3:
                self.stdout.write(f'  ... and {len(quizzes) - 3} more quizzes')

        self.stdout.write(
            self.style.SUCCESS(
                f'TOTAL PREVIEW: {total_quizzes} quizzes, {total_questions} questions, {total_choices} choices'
            )
        )