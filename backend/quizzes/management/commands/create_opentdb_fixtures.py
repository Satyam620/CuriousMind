from django.core.management.base import BaseCommand, CommandError
from django.core import serializers
from django.conf import settings
import requests
import time
import html
import json
import os
import uuid
from datetime import datetime
from django.utils import timezone


class Command(BaseCommand):
    help = 'Create quiz fixtures from OpenTDB (Open Trivia Database) without importing to database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--category-id',
            type=int,
            help='Create fixtures from specific category ID'
        )
        parser.add_argument(
            '--amount',
            type=int,
            default=10,
            help='Number of questions per category (default: 10)'
        )
        parser.add_argument(
            '--difficulty',
            choices=['easy', 'medium', 'hard'],
            help='Question difficulty filter'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Create fixtures from all categories'
        )
        parser.add_argument(
            '--list-categories',
            action='store_true',
            help='List all available categories'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='fixtures',
            help='Directory to save fixture files (default: fixtures)'
        )
        parser.add_argument(
            '--split-files',
            action='store_true',
            help='Create separate files per category'
        )

    def handle(self, *args, **options):
        if options['list_categories']:
            self.list_categories()
        elif options['all']:
            self.create_all_category_fixtures(
                options['amount'],
                options['output_dir'],
                options['split_files']
            )
        elif options['category_id']:
            self.create_category_fixtures(
                options['category_id'],
                options['amount'],
                options['difficulty'],
                options['output_dir']
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

    def create_category_fixtures(self, category_id, amount, difficulty, output_dir):
        """Create fixtures for a specific category"""
        # Get category name
        categories = self.get_categories()
        category_name = next(
            (cat['name'] for cat in categories if cat['id'] == category_id),
            f"Category {category_id}"
        )

        self.stdout.write(f"Creating fixtures for {amount} questions from '{category_name}'...")

        # Fetch questions
        questions_data = self.fetch_questions(category_id, amount, difficulty)
        if not questions_data:
            self.stdout.write(
                self.style.WARNING(f"No questions found for category {category_id}")
            )
            return

        # Create fixtures
        fixtures = self.create_quiz_fixtures(category_name, questions_data)

        # Save to file
        self.save_fixtures(fixtures, output_dir, f"{self.sanitize_filename(category_name)}_fixtures.json")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created fixtures for {len(questions_data)} questions"
            )
        )

    def create_all_category_fixtures(self, amount_per_category, output_dir, split_files):
        """Create fixtures from all categories"""
        categories = self.get_categories()
        self.stdout.write(f"Creating fixtures: {amount_per_category} questions per category...")

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        all_fixtures = []
        total_questions = 0
        successful_categories = 0

        for i, category in enumerate(categories, 1):
            self.stdout.write(f"[{i}/{len(categories)}] Processing: {category['name']}")

            try:
                questions_data = self.fetch_questions(category['id'], amount_per_category)
                if questions_data:
                    fixtures = self.create_quiz_fixtures(category['name'], questions_data)

                    if split_files:
                        # Save individual category file
                        filename = f"{self.sanitize_filename(category['name'])}_fixtures.json"
                        self.save_fixtures(fixtures, output_dir, filename)
                        self.stdout.write(f"  Saved: {filename}")
                    else:
                        # Add to combined fixtures
                        all_fixtures.extend(fixtures)

                    total_questions += len(questions_data)
                    successful_categories += 1

                # Rate limiting
                time.sleep(1)

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Failed to process {category['name']}: {e}")
                )

        # Save combined file if not splitting
        if not split_files and all_fixtures:
            self.save_fixtures(all_fixtures, output_dir, "opentdb_all_fixtures.json")
            self.stdout.write(f"Saved combined file: opentdb_all_fixtures.json")

        self.stdout.write(
            self.style.SUCCESS(
                f"Fixture creation completed! "
                f"Categories: {successful_categories}/{len(categories)}, "
                f"Questions: {total_questions}"
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

    def create_quiz_fixtures(self, category_name, questions_data):
        """Create fixture objects for quiz and questions"""
        fixtures = []

        # Generate unique IDs
        quiz_id = self.generate_fixture_id()
        quiz_title = f"{category_name} - Quiz"
        quiz_description = f"Quiz containing {len(questions_data)} questions from {category_name}"

        # Create quiz fixture
        quiz_fixture = {
            "model": "quizzes.quiz",
            "pk": quiz_id,
            "fields": {
                "title": quiz_title,
                "description": quiz_description,
                "created_at": timezone.now().isoformat(),
                "updated_at": timezone.now().isoformat(),
                "is_active": True,
                "is_ai_generated": False
            }
        }
        fixtures.append(quiz_fixture)

        # Create question and choice fixtures
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

                # Create question fixture
                question_id = self.generate_fixture_id()
                question_fixture = {
                    "model": "quizzes.question",
                    "pk": question_id,
                    "fields": {
                        "quiz": quiz_id,
                        "question_text": html.unescape(q_data['question']),
                        "question_type": "multiple_choice",
                        "difficulty": difficulty,
                        "points": points,
                        "order": i + 1
                    }
                }
                fixtures.append(question_fixture)

                # Create choice fixtures
                all_answers = [q_data['correct_answer']] + q_data['incorrect_answers']

                # Shuffle answers for randomization
                import random
                random.shuffle(all_answers)

                for answer in all_answers:
                    choice_fixture = {
                        "model": "quizzes.choice",
                        "pk": self.generate_fixture_id(),
                        "fields": {
                            "question": question_id,
                            "choice_text": html.unescape(answer),
                            "is_correct": (answer == q_data['correct_answer'])
                        }
                    }
                    fixtures.append(choice_fixture)

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Error processing question {i + 1}: {e}")
                )

        return fixtures

    def save_fixtures(self, fixtures, output_dir, filename):
        """Save fixtures to JSON file"""
        os.makedirs(output_dir, exist_ok=True)

        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(fixtures, f, indent=2, ensure_ascii=False)

        file_size = os.path.getsize(filepath)
        self.stdout.write(f"Created fixture file: {filepath} ({file_size:,} bytes)")

    def generate_fixture_id(self):
        """Generate unique ID for fixture objects"""
        return int(str(uuid.uuid4().int)[:8])

    def sanitize_filename(self, filename):
        """Sanitize filename for safe file creation"""
        import re
        # Replace spaces and special characters with underscores
        safe_name = re.sub(r'[^\w\-_]', '_', filename)
        # Remove multiple consecutive underscores
        safe_name = re.sub(r'_+', '_', safe_name)
        # Remove leading/trailing underscores
        return safe_name.strip('_').lower()