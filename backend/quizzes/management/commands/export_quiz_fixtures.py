from django.core.management.base import BaseCommand
from django.core import serializers
from django.conf import settings
from django.utils import timezone
import django
import os
import json
from quizzes.models import Quiz, Question, Choice


class Command(BaseCommand):
    help = 'Export quiz data from database to fixtures for deployment'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='fixtures',
            help='Directory to save fixture files (default: fixtures)'
        )
        parser.add_argument(
            '--exclude-ai',
            action='store_true',
            help='Exclude AI-generated quizzes from export'
        )
        parser.add_argument(
            '--category',
            type=str,
            help='Export quizzes from specific category only'
        )
        parser.add_argument(
            '--max-quizzes',
            type=int,
            help='Maximum number of quizzes to export per category'
        )
        parser.add_argument(
            '--split-files',
            action='store_true',
            help='Split into separate files by category'
        )

    def handle(self, *args, **options):
        output_dir = options['output_dir']
        exclude_ai = options['exclude_ai']
        category_filter = options['category']
        max_quizzes = options['max_quizzes']
        split_files = options['split_files']

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Build queryset for quizzes
        quiz_queryset = Quiz.objects.filter(is_active=True)

        if exclude_ai:
            quiz_queryset = quiz_queryset.filter(is_ai_generated=False)

        if category_filter:
            quiz_queryset = quiz_queryset.filter(title__icontains=category_filter)

        if max_quizzes:
            quiz_queryset = quiz_queryset[:max_quizzes]

        quiz_count = quiz_queryset.count()
        self.stdout.write(f"Found {quiz_count} quizzes to export")

        if quiz_count == 0:
            self.stdout.write(self.style.WARNING('No quizzes found matching criteria'))
            return

        if split_files:
            self._export_split_by_category(quiz_queryset, output_dir)
        else:
            self._export_single_file(quiz_queryset, output_dir)

        self.stdout.write(
            self.style.SUCCESS(f'Successfully exported {quiz_count} quizzes to {output_dir}/')
        )

    def _export_single_file(self, quiz_queryset, output_dir):
        """Export all data to a single fixture file"""
        all_objects = []

        # Export quizzes
        for quiz in quiz_queryset:
            all_objects.append(quiz)

            # Export questions for this quiz
            for question in quiz.questions.all():
                all_objects.append(question)

                # Export choices for this question
                for choice in question.choices.all():
                    all_objects.append(choice)

        # Serialize all objects
        fixture_data = serializers.serialize('json', all_objects, indent=2)

        # Write to file
        output_file = os.path.join(output_dir, 'quiz_fixtures.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixture_data)

        self.stdout.write(f"Exported to: {output_file}")

    def _export_split_by_category(self, quiz_queryset, output_dir):
        """Export data split by category into separate files"""
        categories = {}

        # Group quizzes by category (extracted from title)
        for quiz in quiz_queryset:
            category = self._extract_category(quiz.title)
            if category not in categories:
                categories[category] = []
            categories[category].append(quiz)

        # Export each category to separate file
        for category, quizzes in categories.items():
            category_objects = []

            for quiz in quizzes:
                category_objects.append(quiz)

                # Add questions and choices
                for question in quiz.questions.all():
                    category_objects.append(question)

                    for choice in question.choices.all():
                        category_objects.append(choice)

            # Serialize category data
            fixture_data = serializers.serialize('json', category_objects, indent=2)

            # Write to category-specific file
            safe_category = self._sanitize_filename(category)
            output_file = os.path.join(output_dir, f'{safe_category}_fixtures.json')

            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(fixture_data)

            self.stdout.write(f"Exported {len(quizzes)} quizzes to: {output_file}")

    def _extract_category(self, title):
        """Extract category from quiz title"""
        # Common category patterns
        if 'science' in title.lower():
            return 'Science'
        elif 'history' in title.lower():
            return 'History'
        elif 'geography' in title.lower():
            return 'Geography'
        elif 'sport' in title.lower():
            return 'Sports'
        elif 'entertainment' in title.lower():
            if 'film' in title.lower() or 'movie' in title.lower():
                return 'Entertainment_Film'
            elif 'music' in title.lower():
                return 'Entertainment_Music'
            elif 'book' in title.lower():
                return 'Entertainment_Books'
            elif 'video' in title.lower() or 'game' in title.lower():
                return 'Entertainment_Video_Games'
            else:
                return 'Entertainment'
        elif 'art' in title.lower():
            return 'Art'
        elif 'animal' in title.lower():
            return 'Animals'
        else:
            return 'General_Knowledge'

    def _sanitize_filename(self, filename):
        """Sanitize filename for safe file creation"""
        import re
        # Replace spaces and special characters with underscores
        safe_name = re.sub(r'[^\w\-_]', '_', filename)
        # Remove multiple consecutive underscores
        safe_name = re.sub(r'_+', '_', safe_name)
        # Remove leading/trailing underscores
        return safe_name.strip('_').lower()

    def _create_manifest(self, output_dir, exported_files):
        """Create a manifest file with export information"""
        manifest = {
            'export_timestamp': str(timezone.now()),
            'total_quizzes': sum(info['quiz_count'] for info in exported_files.values()),
            'files': exported_files,
            'django_version': django.get_version(),
            'database': settings.DATABASES['default']['ENGINE']
        }

        manifest_file = os.path.join(output_dir, 'export_manifest.json')
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)

        self.stdout.write(f"Created manifest: {manifest_file}")