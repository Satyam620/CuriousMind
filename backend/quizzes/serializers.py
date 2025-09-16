from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Quiz, Question, Choice, QuizAttempt, Answer, UserProfile

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'points', 'order', 'choices']

class QuizListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'created_at', 'question_count']
    
    def get_question_count(self, obj):
        return obj.questions.count()

class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    total_points = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'created_at', 'questions', 'total_points']
    
    def get_total_points(self, obj):
        return sum(question.points for question in obj.questions.all())

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'question', 'selected_choice', 'text_answer']

class QuizAttemptSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    time_taken_formatted = serializers.CharField(read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_title', 'score', 'total_points', 'started_at', 'completed_at', 'is_completed', 'time_taken_seconds', 'time_taken_formatted', 'answers']

class QuizSubmissionSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    time_taken_seconds = serializers.IntegerField(required=False)
    answers = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'username', 'first_name', 'last_name',
            'total_score', 'total_quizzes_completed', 
            'average_score_percentage', 'rank'
        ]

class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'rank', 'username', 'display_name', 'total_score', 
            'total_quizzes_completed', 'average_score_percentage'
        ]
    
    def get_display_name(self, obj):
        user = obj.user
        if user.first_name and user.last_name:
            return f"{user.first_name} {user.last_name}"
        elif user.first_name:
            return user.first_name
        return user.username

class QuizLeaderboardSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    quiz_title = serializers.CharField()
    attempts = serializers.ListSerializer(child=serializers.DictField())