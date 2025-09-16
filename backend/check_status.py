#!/usr/bin/env python
import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiz_backend.settings')
django.setup()

from quizzes.models import Quiz

print("\nCurrent Quiz Database Status:")
print("=" * 50)

quizzes = Quiz.objects.all().order_by('title')
total_questions = 0

for quiz in quizzes:
    question_count = quiz.questions.count()
    total_questions += question_count
    print(f"{quiz.title:<40} - {question_count:>4} questions")

print("=" * 50)
print(f"{'TOTAL QUESTIONS:':<40} - {total_questions:>4}")
print("=" * 50)

# Identify categories with fewer than 500 questions
print("\nCategories needing expansion (< 500 questions):")
print("-" * 50)
low_question_categories = []

for quiz in quizzes:
    question_count = quiz.questions.count()
    if question_count < 500:
        low_question_categories.append((quiz.title, question_count))
        print(f"{quiz.title:<40} - {question_count:>4} questions")

print(f"\nCategories under 500 questions: {len(low_question_categories)}")