#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiz_backend.settings')
django.setup()

from quizzes.models import Quiz, Question, Choice

# Check sports quizzes
sports_quizzes = Quiz.objects.filter(title__icontains='Sports')
print(f'Sports quizzes found: {sports_quizzes.count()}')

for quiz in sports_quizzes:
    questions_count = Question.objects.filter(quiz=quiz).count()
    choices_count = Choice.objects.filter(question__quiz=quiz).count()
    print(f'  - Quiz ID {quiz.id}: "{quiz.title}" ({questions_count} questions, {choices_count} choices)')

# Check the specific quiz from our fixture
fixture_quiz = Quiz.objects.filter(pk=12374534).first()
if fixture_quiz:
    questions_count = Question.objects.filter(quiz=fixture_quiz).count()
    choices_count = Choice.objects.filter(question__quiz=fixture_quiz).count()
    print(f'\nFixture quiz (ID 12374534): "{fixture_quiz.title}" ({questions_count} questions, {choices_count} choices)')
else:
    print(f'\nFixture quiz (ID 12374534): Not found')

# Check mythology quizzes
mythology_quizzes = Quiz.objects.filter(title__icontains='Mythology')
print(f'\nMythology quizzes found: {mythology_quizzes.count()}')
for quiz in mythology_quizzes:
    questions_count = Question.objects.filter(quiz=quiz).count()
    choices_count = Choice.objects.filter(question__quiz=quiz).count()
    print(f'  - Quiz ID {quiz.id}: "{quiz.title}" ({questions_count} questions, {choices_count} choices)')

# Check total counts
print(f'\nTotal in database:')
print(f'  Quizzes: {Quiz.objects.count()}')
print(f'  Questions: {Question.objects.count()}')
print(f'  Choices: {Choice.objects.count()}')