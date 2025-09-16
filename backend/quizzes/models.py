from django.db import models
from django.contrib.auth.models import User
from django.db.models import Sum, Avg, Count

class Quiz(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_ai_generated = models.BooleanField(default=False)
    
    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='multiple_choice')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    points = models.IntegerField(default=1)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.quiz.title} - {self.question_text[:50]}"

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    choice_text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return self.choice_text

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    time_taken_seconds = models.IntegerField(null=True, blank=True)  # Time taken to complete quiz
    
    class Meta:
        unique_together = ['user', 'quiz']
    
    @property
    def percentage(self):
        if self.total_points > 0:
            return round((self.score / self.total_points) * 100, 2)
        return 0
    
    @property 
    def time_taken_formatted(self):
        if self.time_taken_seconds:
            minutes = self.time_taken_seconds // 60
            seconds = self.time_taken_seconds % 60
            return f"{minutes:02d}:{seconds:02d}"
        return "00:00"
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title}"

class Answer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, related_name='answers', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, null=True, blank=True, on_delete=models.CASCADE)
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.attempt.user.username} - {self.question.question_text[:30]}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    total_score = models.IntegerField(default=0)
    total_quizzes_completed = models.IntegerField(default=0)
    average_score_percentage = models.FloatField(default=0.0)
    rank = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def update_stats(self):
        """Update user statistics based on completed attempts (excluding AI-generated quizzes)"""
        completed_attempts = QuizAttempt.objects.filter(
            user=self.user,
            is_completed=True,
            quiz__is_ai_generated=False
        )
        
        self.total_quizzes_completed = completed_attempts.count()
        self.total_score = completed_attempts.aggregate(
            total=Sum('score')
        )['total'] or 0
        
        if self.total_quizzes_completed > 0:
            avg_percentage = completed_attempts.aggregate(
                avg=Avg('score') * 100.0 / Avg('total_points')
            )['avg'] or 0
            self.average_score_percentage = round(avg_percentage, 2)
        else:
            self.average_score_percentage = 0.0
            
        self.save()
    
    @classmethod
    def update_all_ranks(cls):
        """Update ranks for all users based on total score (excluding AI quizzes)"""
        # Only rank users who have completed non-AI quizzes
        profiles = cls.objects.filter(
            total_quizzes_completed__gt=0
        ).order_by('-total_score', '-average_score_percentage')

        # Reset all ranks to 0 first
        cls.objects.all().update(rank=0)

        # Assign ranks only to qualifying users
        for index, profile in enumerate(profiles, 1):
            profile.rank = index
            profile.save(update_fields=['rank'])
    
    def __str__(self):
        return f"{self.user.username} - Rank #{self.rank}"
    
    class Meta:
        ordering = ['rank']
