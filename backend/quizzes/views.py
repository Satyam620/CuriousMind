from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
import random
from .models import Quiz, Question, Choice, QuizAttempt, Answer, UserProfile
from .serializers import (
    QuizListSerializer, QuizDetailSerializer, QuizAttemptSerializer,
    QuizSubmissionSerializer, LeaderboardEntrySerializer, UserProfileSerializer,
    QuizLeaderboardSerializer
)

class QuizListView(generics.ListAPIView):
    queryset = Quiz.objects.filter(is_active=True)
    serializer_class = QuizListSerializer
    permission_classes = [AllowAny]

class QuizDetailView(generics.RetrieveAPIView):
    queryset = Quiz.objects.filter(is_active=True)
    serializer_class = QuizDetailSerializer
    permission_classes = [AllowAny]

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_quiz(request):
    serializer = QuizSubmissionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    quiz_id = serializer.validated_data['quiz_id']
    answers_data = serializer.validated_data['answers']
    time_taken_seconds = serializer.validated_data.get('time_taken_seconds')
    
    try:
        quiz = Quiz.objects.get(id=quiz_id, is_active=True)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

    # Don't allow submissions for AI-generated quizzes
    if quiz.is_ai_generated:
        return Response({'error': 'Cannot submit AI-generated quizzes'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create or get user (for demo purposes, creating anonymous users)
    user_id = request.data.get('user_id', 1)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        user = User.objects.create_user(username=f'user_{user_id}', password='password')
    
    # Create quiz attempt
    attempt, created = QuizAttempt.objects.get_or_create(
        user=user,
        quiz=quiz,
        defaults={'total_points': sum(q.points for q in quiz.questions.all())}
    )
    
    if attempt.is_completed:
        return Response({'error': 'Quiz already completed'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Process answers
    score = 0
    for answer_data in answers_data:
        question_id = answer_data.get('question_id')
        selected_choice_id = answer_data.get('selected_choice_id')
        text_answer = answer_data.get('text_answer', '')
        
        try:
            question = Question.objects.get(id=question_id, quiz=quiz)
        except Question.DoesNotExist:
            continue
        
        is_correct = False
        selected_choice = None
        
        if selected_choice_id:
            try:
                selected_choice = Choice.objects.get(id=selected_choice_id, question=question)
                is_correct = selected_choice.is_correct
            except Choice.DoesNotExist:
                pass
        
        if is_correct:
            score += question.points
        
        Answer.objects.create(
            attempt=attempt,
            question=question,
            selected_choice=selected_choice,
            text_answer=text_answer,
            is_correct=is_correct
        )
    
    # Update attempt
    attempt.score = score
    attempt.completed_at = timezone.now()
    attempt.is_completed = True
    if time_taken_seconds:
        attempt.time_taken_seconds = time_taken_seconds
    attempt.save()
    
    # Update or create user profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.update_stats()
    
    # Update all user ranks
    UserProfile.update_all_ranks()
    
    return Response({
        'score': score,
        'total_points': attempt.total_points,
        'percentage': (score / attempt.total_points * 100) if attempt.total_points > 0 else 0,
        'attempt_id': attempt.id,
        'rank': profile.rank
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_attempts(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    attempts = QuizAttempt.objects.filter(user=user).order_by('-started_at')
    serializer = QuizAttemptSerializer(attempts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def global_leaderboard(request):
    """Get global leaderboard with top users"""
    limit = int(request.GET.get('limit', 50))
    
    # Get top users by rank
    profiles = UserProfile.objects.filter(
        total_quizzes_completed__gt=0
    ).order_by('rank')[:limit]
    
    serializer = LeaderboardEntrySerializer(profiles, many=True)
    
    return Response({
        'leaderboard': serializer.data,
        'total_users': UserProfile.objects.filter(total_quizzes_completed__gt=0).count()
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def quiz_leaderboard(request, quiz_id):
    """Get leaderboard for a specific quiz"""
    try:
        quiz = Quiz.objects.get(id=quiz_id, is_active=True, is_ai_generated=False)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or is AI-generated'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get top attempts for this quiz
    attempts = QuizAttempt.objects.filter(
        quiz=quiz, 
        is_completed=True
    ).select_related('user').order_by('-score', 'completed_at')[:50]
    
    leaderboard_data = []
    for rank, attempt in enumerate(attempts, 1):
        user = attempt.user
        display_name = user.first_name if user.first_name else user.username
        
        leaderboard_data.append({
            'rank': rank,
            'username': user.username,
            'display_name': display_name,
            'score': attempt.score,
            'total_points': attempt.total_points,
            'percentage': attempt.percentage,
            'completed_at': attempt.completed_at,
            'time_taken': attempt.time_taken_formatted
        })
    
    return Response({
        'quiz_id': quiz.id,
        'quiz_title': quiz.title,
        'leaderboard': leaderboard_data
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile(request, user_id):
    """Get user profile and stats"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    profile, created = UserProfile.objects.get_or_create(user=user)
    if created:
        profile.update_stats()
    
    serializer = UserProfileSerializer(profile)
    
    # Get recent attempts (including AI-generated quizzes for history display)
    recent_attempts = QuizAttempt.objects.filter(
        user=user,
        is_completed=True
    ).select_related('quiz').order_by('-completed_at')[:10]
    
    attempts_data = []
    for attempt in recent_attempts:
        # Use stored time_taken_seconds if available, otherwise calculate from timestamps
        if attempt.time_taken_seconds and attempt.time_taken_seconds > 0:
            time_taken_seconds = attempt.time_taken_seconds
            mins = time_taken_seconds // 60
            secs = time_taken_seconds % 60
            time_taken_formatted = f"{mins}:{secs:02d}"
        elif attempt.completed_at and attempt.started_at:
            time_diff = attempt.completed_at - attempt.started_at
            time_taken_seconds = int(time_diff.total_seconds())
            mins = time_taken_seconds // 60
            secs = time_taken_seconds % 60
            time_taken_formatted = f"{mins}:{secs:02d}"
        else:
            time_taken_formatted = "0:00"

        attempts_data.append({
            'quiz_title': attempt.quiz.title,
            'score': attempt.score,
            'total_points': attempt.total_points,
            'percentage': attempt.percentage,
            'completed_at': attempt.completed_at,
            'time_taken': time_taken_formatted,
            'time_taken_seconds': attempt.time_taken_seconds,  # Include the raw seconds for debugging
            'is_ai_generated': attempt.quiz.is_ai_generated
        })
    
    return Response({
        'profile': serializer.data,
        'recent_attempts': attempts_data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_custom_quiz(request):
    """Generate a custom quiz based on category, difficulty, and question count"""
    category = request.data.get('category')
    difficulty = request.data.get('difficulty')  # 'easy', 'medium', 'hard', or None for any
    question_count = int(request.data.get('question_count', 10))

    if not category:
        return Response({'error': 'Category is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get all questions from quizzes that match the category
    quiz_filter = Q(quiz__title__icontains=category) & Q(quiz__is_active=True)

    if difficulty:
        quiz_filter &= Q(difficulty=difficulty)

    # Get all matching questions
    all_questions = list(Question.objects.filter(quiz_filter).select_related('quiz'))

    if not all_questions:
        return Response({
            'error': f'No questions found for category "{category}"' +
                    (f' with difficulty "{difficulty}"' if difficulty else '')
        }, status=status.HTTP_404_NOT_FOUND)

    # Randomly select questions up to the requested count
    selected_questions = random.sample(
        all_questions,
        min(question_count, len(all_questions))
    )

    # Build quiz data structure
    quiz_data = {
        'id': f'custom_{category.lower().replace(" ", "_")}_{len(selected_questions)}',
        'title': f'{category}{f" - {difficulty.title()} Level" if difficulty else " - Mixed Level"}',
        'description': f'Custom quiz with {len(selected_questions)} questions from {category}' +
                      (f' ({difficulty} difficulty)' if difficulty else ''),
        'total_points': sum(q.points for q in selected_questions),
        'is_ai_generated': False,
        'questions': []
    }

    # Add questions with choices
    for i, question in enumerate(selected_questions):
        choices = list(question.choices.all())

        question_data = {
            'id': question.id,
            'question_text': question.question_text,
            'question_type': question.question_type,
            'difficulty': question.difficulty,
            'points': question.points,
            'order': i + 1,
            'choices': [
                {
                    'id': choice.id,
                    'choice_text': choice.choice_text,
                    'is_correct': choice.is_correct  # This will be removed in production
                } for choice in choices
            ]
        }

        quiz_data['questions'].append(question_data)

    return Response(quiz_data)

@api_view(['POST'])
@permission_classes([AllowAny])  # In production, you should restrict this to admin users
def cleanup_quiz_data(request):
    """Clean up quiz data prior to a specified date"""
    cutoff_date_str = request.data.get('cutoff_date')

    if not cutoff_date_str:
        return Response({'error': 'cutoff_date is required (YYYY-MM-DD format)'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Parse the cutoff date
        cutoff_date = datetime.strptime(cutoff_date_str, '%Y-%m-%d').date()
        cutoff_datetime = timezone.make_aware(datetime.combine(cutoff_date, datetime.min.time()))
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    # Count what will be deleted
    quiz_attempts_to_delete = QuizAttempt.objects.filter(started_at__lt=cutoff_datetime)
    answers_to_delete = Answer.objects.filter(attempt__started_at__lt=cutoff_datetime)

    attempts_count = quiz_attempts_to_delete.count()
    answers_count = answers_to_delete.count()

    # Perform the deletion
    deleted_answers = answers_to_delete.delete()
    deleted_attempts = quiz_attempts_to_delete.delete()

    # Update user profiles after deletion
    profiles = UserProfile.objects.all()
    for profile in profiles:
        profile.update_stats()

    # Update all user ranks after cleanup
    UserProfile.update_all_ranks()

    return Response({
        'message': f'Successfully cleaned up quiz data prior to {cutoff_date_str}',
        'deleted_attempts': deleted_attempts[0],
        'deleted_answers': deleted_answers[0],
        'profiles_updated': profiles.count()
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def save_custom_quiz_result(request):
    """Save the result of a custom/AI-generated quiz for history tracking"""
    user_id = request.data.get('user_id', 1)
    quiz_title = request.data.get('quiz_title', 'Custom Quiz')
    score = request.data.get('score', 0)
    total_points = request.data.get('total_points', 0)
    time_taken_seconds = request.data.get('time_taken_seconds', 0)
    is_ai_generated = request.data.get('is_ai_generated', True)  # Default to True for backward compatibility

    # Validate data
    if not all([quiz_title, isinstance(score, int), isinstance(total_points, int)]):
        return Response({'error': 'Invalid quiz result data'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get or create user
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Create a unique quiz record for each attempt to avoid constraint violations
    import uuid
    # For display purposes, keep the original clean title, but use UUID for uniqueness internally
    unique_quiz_title = f"{quiz_title} - {uuid.uuid4().hex[:8]}"

    quiz_description = 'AI-generated custom quiz for history tracking' if is_ai_generated else 'Custom quiz from database questions for history tracking'

    quiz = Quiz.objects.create(
        title=unique_quiz_title,
        description=quiz_description,
        is_ai_generated=is_ai_generated,
        is_active=False  # Not active for public use
    )

    # Create quiz attempt for history
    attempt = QuizAttempt.objects.create(
        user=user,
        quiz=quiz,
        score=score,
        total_points=total_points,
        is_completed=True,
        completed_at=timezone.now(),
        time_taken_seconds=time_taken_seconds
    )

    return Response({
        'message': 'Custom quiz result saved successfully',
        'attempt_id': attempt.id,
        'percentage': attempt.percentage
    })

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def scheduler_status(request):
    """Get or manage scheduler status"""
    from .scheduler import get_scheduler_status, start_scheduler, stop_scheduler

    if request.method == 'GET':
        return Response(get_scheduler_status())

    elif request.method == 'POST':
        action = request.data.get('action')

        if action == 'start':
            try:
                start_scheduler()
                return Response({'message': 'Scheduler started successfully'})
            except Exception as e:
                return Response({'error': f'Failed to start scheduler: {str(e)}'},
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif action == 'stop':
            try:
                stop_scheduler()
                return Response({'message': 'Scheduler stopped successfully'})
            except Exception as e:
                return Response({'error': f'Failed to stop scheduler: {str(e)}'},
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        else:
            return Response({'error': 'Invalid action. Use "start" or "stop"'},
                          status=status.HTTP_400_BAD_REQUEST)
