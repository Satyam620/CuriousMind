from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.conf import settings
import requests
import time
import html
from quizzes.models import Quiz, Question, Choice


class Command(BaseCommand):
    help = 'Import quiz data from OpenTDB (Open Trivia Database)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--category-id',
            type=int,
            help='Import questions from specific category ID'
        )
        parser.add_argument(
            '--amount',
            type=int,
            default=10,
            help='Number of questions to import per category (default: 10)'
        )
        parser.add_argument(
            '--difficulty',
            choices=['easy', 'medium', 'hard'],
            help='Question difficulty filter'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Import questions from all categories'
        )
        parser.add_argument(
            '--list-categories',
            action='store_true',
            help='List all available categories'
        )

    def handle(self, *args, **options):
        # Check if data ingestion is enabled
        if not getattr(settings, 'ENABLE_DATA_INGESTION', True) and not options['list_categories']:
            raise CommandError('Data ingestion is disabled. Set ENABLE_DATA_INGESTION=True in settings to enable.')

        if options['list_categories']:
            self.list_categories()
        elif options['all']:
            self.import_all_categories(options['amount'])
        elif options['category_id']:
            self.import_category(
                options['category_id'],
                options['amount'],
                options['difficulty']
            )
        else:
            raise CommandError('Please specify --list-categories, --category-id, or --all')

    def list_categories(self):
        """List all available categories from OpenTDB"""
        self.stdout.write("Fetching categories from OpenTDB...")

        try:
            response = requests.get("https://opentdb.com/api_category.php")
            response.raise_for_status()
            categories = response.json().get('trivia_categories', [])

            self.stdout.write(f"\nFound {len(categories)} categories:")
            self.stdout.write("-" * 50)
            for category in categories:
                self.stdout.write(f"ID: {category['id']:2d} | {category['name']}")
            self.stdout.write("-" * 50)

        except requests.RequestException as e:
            raise CommandError(f"Error fetching categories: {e}")

    def import_category(self, category_id, amount, difficulty):
        """Import questions for a specific category"""
        # Get category name
        categories = self.get_categories()
        category_name = next(
            (cat['name'] for cat in categories if cat['id'] == category_id),
            f"Category {category_id}"
        )

        self.stdout.write(f"Importing {amount} questions from '{category_name}'...")

        # Fetch questions
        questions_data = self.fetch_questions(category_id, amount, difficulty)
        if not questions_data:
            self.stdout.write(
                self.style.WARNING(f"No questions found for category {category_id}")
            )
            return

        # Import to database
        imported_count = self.create_quiz_and_questions(category_name, questions_data)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully imported {imported_count}/{len(questions_data)} questions"
            )
        )

    def import_all_categories(self, amount_per_category):
        """Import questions from all categories"""
        categories = self.get_categories()
        self.stdout.write(f"Starting bulk import: {amount_per_category} questions per category...")

        total_imported = 0
        successful_categories = 0

        for i, category in enumerate(categories, 1):
            self.stdout.write(f"[{i}/{len(categories)}] Processing: {category['name']}")

            try:
                questions_data = self.fetch_questions(category['id'], amount_per_category)
                if questions_data:
                    imported_count = self.create_quiz_and_questions(
                        category['name'],
                        questions_data
                    )
                    total_imported += imported_count
                    successful_categories += 1

                # Rate limiting
                time.sleep(1)

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Failed to import {category['name']}: {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Bulk import completed! "
                f"Categories: {successful_categories}/{len(categories)}, "
                f"Questions: {total_imported}"
            )
        )

    def get_categories(self):
        """Fetch categories from OpenTDB"""
        try:
            response = requests.get("https://opentdb.com/api_category.php")
            response.raise_for_status()
            return response.json().get('trivia_categories', [])
        except requests.RequestException as e:
            raise CommandError(f"Error fetching categories: {e}")

    def fetch_questions(self, category_id, amount, difficulty=None):
        """Fetch questions for a category"""
        params = {
            'amount': amount,
            'category': category_id,
            'type': 'multiple'
        }

        if difficulty:
            params['difficulty'] = difficulty

        try:
            response = requests.get("https://opentdb.com/api.php", params=params)
            response.raise_for_status()
            data = response.json()

            if data.get('response_code') != 0:
                self.stdout.write(
                    self.style.WARNING(f"OpenTDB API error code: {data.get('response_code')}")
                )
                return []

            return data.get('results', [])

        except requests.RequestException as e:
            self.stdout.write(self.style.WARNING(f"Error fetching questions: {e}"))
            return []

    @transaction.atomic
    def create_quiz_and_questions(self, category_name, questions_data):
        """Create quiz and questions in database"""
        # Create or get quiz
        quiz_title = f"{category_name} - Quiz"
        quiz_description = f"Quiz containing {len(questions_data)} questions from {category_name}"

        quiz, created = Quiz.objects.get_or_create(
            title=quiz_title,
            defaults={'description': quiz_description}
        )

        if created:
            self.stdout.write(f"  Created new quiz: {quiz_title}")
        else:
            self.stdout.write(f"  Using existing quiz: {quiz_title}")

        # Import questions
        imported_count = 0
        for i, q_data in enumerate(questions_data):
            try:
                # Determine points based on difficulty
                difficulty = q_data.get('difficulty', 'medium')
                if difficulty == 'easy':
                    points = 1
                elif difficulty == 'medium':
                    points = 2
                elif difficulty == 'hard':
                    points = 4
                else:
                    points = 2  # Default to medium

                # Create question
                question = Question.objects.create(
                    quiz=quiz,
                    question_text=html.unescape(q_data['question']),
                    question_type='multiple_choice',
                    difficulty=difficulty,
                    points=points,
                    order=i + 1
                )

                # Create choices
                all_answers = [q_data['correct_answer']] + q_data['incorrect_answers']

                # Shuffle answers
                import random
                random.shuffle(all_answers)

                for answer in all_answers:
                    Choice.objects.create(
                        question=question,
                        choice_text=html.unescape(answer),
                        is_correct=(answer == q_data['correct_answer'])
                    )

                imported_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"  Error importing question {i + 1}: {e}")
                )

        return imported_count