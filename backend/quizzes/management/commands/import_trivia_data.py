from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, IntegrityError
from django.conf import settings
from quizzes.models import Quiz, Question, Choice
import json
import os
from pathlib import Path
from django.utils import timezone

class Command(BaseCommand):
    help = 'Import trivia quiz data from processed JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--data-dir',
            type=str,
            default=None,
            help='Directory containing processed quiz JSON files'
        )
        parser.add_argument(
            '--file',
            type=str,
            help='Import a specific JSON file'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually importing data'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip duplicate checks and force import'
        )

    def handle(self, *args, **options):
        # Check if data ingestion is enabled
        if not getattr(settings, 'ENABLE_DATA_INGESTION', True):
            raise CommandError('Data ingestion is disabled. Set ENABLE_DATA_INGESTION=True in settings to enable.')

        self.stdout.write(self.style.SUCCESS('Starting trivia data import...'))
        
        # Determine data directory
        data_dir = self._get_data_directory(options.get('data_dir'))
        
        if options.get('file'):
            # Import single file
            files_to_import = [Path(options['file'])]
        else:
            # Import all files from directory
            files_to_import = list(data_dir.glob('quiz_*.json'))
        
        if not files_to_import:
            raise CommandError(f'No quiz files found in {data_dir}')
        
        self.stdout.write(f'Found {len(files_to_import)} files to import')
        
        success_count = 0
        error_count = 0
        
        for file_path in files_to_import:
            try:
                if self._import_quiz_file(file_path, options):
                    success_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully imported: {file_path.name}')
                    )
                else:
                    error_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Skipped (duplicate): {file_path.name}')
                    )
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Failed to import {file_path.name}: {str(e)}')
                )
        
        # Summary
        self.stdout.write(self.style.SUCCESS(f'\nImport Summary:'))
        self.stdout.write(f'  - Successfully imported: {success_count}')
        self.stdout.write(f'  - Errors/Skipped: {error_count}')
        self.stdout.write(f'  - Total quizzes in database: {Quiz.objects.count()}')

    def _get_data_directory(self, data_dir_arg):
        """Get the processed data directory path"""
        if data_dir_arg:
            return Path(data_dir_arg)
        
        # Default to processed_data directory relative to project root
        current_dir = Path(__file__).resolve()
        project_root = current_dir.parent.parent.parent.parent.parent  # Navigate up to project root
        processed_data_dir = project_root / 'data_ingestion' / 'processed_data'
        
        if not processed_data_dir.exists():
            raise CommandError(f'Processed data directory not found: {processed_data_dir}')
        
        return processed_data_dir

    def _import_quiz_file(self, file_path, options):
        """Import a single quiz file"""
        dry_run = options.get('dry_run', False)
        force = options.get('force', False)
        
        self.stdout.write(f'Processing: {file_path.name}')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            quiz_data = json.load(f)
        
        quiz_info = quiz_data['quiz']
        questions_data = quiz_data['questions']
        
        # Check for duplicates unless force is enabled
        if not force:
            existing_quiz = Quiz.objects.filter(title=quiz_info['title']).first()
            if existing_quiz:
                self.stdout.write(f'  Quiz already exists: {quiz_info["title"]}')
                return False
        
        if dry_run:
            self.stdout.write(f'  [DRY RUN] Would import quiz: {quiz_info["title"]}')
            self.stdout.write(f'  [DRY RUN] Questions: {len(questions_data)}')
            return True
        
        # Import quiz with transaction
        try:
            with transaction.atomic():
                # Create quiz
                quiz = Quiz.objects.create(
                    title=quiz_info['title'],
                    description=quiz_info['description'],
                    is_active=quiz_info.get('is_active', True)
                )
                
                # Create questions and choices
                for q_data in questions_data:
                    # Determine points based on difficulty if not explicitly provided
                    difficulty = q_data.get('difficulty', 'medium')
                    if 'points' in q_data:
                        points = q_data['points']
                    else:
                        # Use difficulty-based scoring
                        if difficulty == 'easy':
                            points = 1
                        elif difficulty == 'medium':
                            points = 2
                        elif difficulty == 'hard':
                            points = 4
                        else:
                            points = 2  # Default to medium

                    question = Question.objects.create(
                        quiz=quiz,
                        question_text=q_data['question_text'],
                        question_type=q_data.get('question_type', 'multiple_choice'),
                        difficulty=difficulty,
                        points=points,
                        order=q_data.get('order', 0)
                    )
                    
                    # Create choices
                    for choice_data in q_data['choices']:
                        Choice.objects.create(
                            question=question,
                            choice_text=choice_data['choice_text'],
                            is_correct=choice_data['is_correct']
                        )
                
                self.stdout.write(f'  Created quiz: {quiz.title}')
                self.stdout.write(f'  Questions: {len(questions_data)}')
                self.stdout.write(f'  Total points: {quiz_info.get("total_points", "N/A")}')
                
                return True
                
        except IntegrityError as e:
            self.stdout.write(self.style.ERROR(f'  Database error: {str(e)}'))
            return False