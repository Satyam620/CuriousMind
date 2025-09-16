from django.core.management.base import BaseCommand
from quizzes.models import Question

class Command(BaseCommand):
    help = 'Updates the points for questions based on their difficulty.'

    def handle(self, *args, **options):
        hard_questions = Question.objects.filter(difficulty='hard')
        medium_questions = Question.objects.filter(difficulty='medium')
        easy_questions = Question.objects.filter(difficulty='easy')

        hard_questions.update(points=4)
        medium_questions.update(points=2)
        easy_questions.update(points=1)

        self.stdout.write(self.style.SUCCESS('Successfully updated points for questions.'))
