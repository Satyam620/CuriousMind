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
import json
import time
from decouple import config
import google.generativeai as genai
from .models import Quiz, Question, Choice, QuizAttempt, Answer, UserProfile
from .serializers import (
    QuizListSerializer, QuizDetailSerializer, QuizAttemptSerializer,
    QuizSubmissionSerializer, LeaderboardEntrySerializer, UserProfileSerializer,
    QuizLeaderboardSerializer
)

# Initialize Gemini AI
GEMINI_API_KEY = config('GEMINI_API_KEY', default=None)
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

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


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_ai_quiz(request):
    """Generate an AI-powered quiz using Google Gemini"""

    # Check if Gemini is configured
    if not GEMINI_API_KEY:
        return Response({
            'error': 'Gemini API key is not configured. Please add your API key to the .env file.'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    # Get request parameters
    difficulty = request.data.get('difficulty', 'any')
    question_count = int(request.data.get('question_count', 10))
    topic = request.data.get('topic', '').strip()

    # Validate parameters
    if difficulty not in ['easy', 'medium', 'hard', 'any']:
        return Response({'error': 'Invalid difficulty level'}, status=status.HTTP_400_BAD_REQUEST)

    if question_count < 1 or question_count > 50:
        return Response({'error': 'Question count must be between 1 and 50'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate quiz with retry logic
    max_retries = 3
    base_delay = 2

    for attempt in range(max_retries):
        try:
            # Create the prompt
            topic_text = f"about {topic}" if topic else "on general knowledge topics"
            difficulty_text = (
                "mixed difficulty levels (include a variety of easy, medium, and hard questions)"
                if difficulty == 'any' else f"{difficulty} difficulty level"
            )

            prompt = f"""Generate a quiz {topic_text} with the following specifications:

Difficulty: {difficulty_text}
Number of questions: {question_count}

Requirements:
- Each question should have exactly 4 multiple choice options (A, B, C, D)
- Only one option should be correct
- Questions should be appropriate for {difficulty_text}
- Include a mix of topics if no specific topic is provided
- Make questions engaging and educational

Please respond with ONLY a valid JSON object in this exact format:
{{
  "title": "Generated Quiz Title",
  "description": "Brief description of the quiz",
  "questions": [
    {{
      "question": "What is the question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "difficulty": "{difficulty if difficulty != 'any' else 'easy" (or "medium" or "hard" for each question individually)'}",
      "type": "multiple_choice"
    }}
  ]
}}

{f'IMPORTANT: For mixed difficulty, assign each question a specific difficulty level ("easy", "medium", or "hard") based on its complexity. Make sure to include a good mix of all three difficulty levels.' if difficulty == 'any' else ''}

Generate exactly {question_count} questions. Do not include any text before or after the JSON object."""

            # Call Gemini API
            model = genai.GenerativeModel('gemini-2.0-flash')
            result = model.generate_content(prompt)
            response_text = result.text.strip()

            # Clean up response - remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '', 1).replace('```', '', 1).strip()
            elif response_text.startswith('```'):
                response_text = response_text.replace('```', '', 1).replace('```', '', 1).strip()

            # Parse JSON response
            quiz_data = json.loads(response_text)

            # Validate response structure
            if not quiz_data or not isinstance(quiz_data, dict):
                raise ValueError('Invalid quiz data format')

            if not isinstance(quiz_data.get('questions'), list) or len(quiz_data['questions']) != question_count:
                raise ValueError(f'Expected {question_count} questions, got {len(quiz_data.get("questions", []))}')

            # Validate each question
            for q in quiz_data['questions']:
                if not q.get('question') or not isinstance(q.get('options'), list) or len(q['options']) != 4:
                    raise ValueError('Invalid question format')
                if not q.get('correct_answer') or q['correct_answer'] not in q['options']:
                    raise ValueError('Invalid correct answer')

            # Transform to QuizDetail format
            def get_points_for_difficulty(q_difficulty):
                return {'easy': 1, 'medium': 2, 'hard': 4}.get(q_difficulty.lower(), 2)

            transformed_questions = []
            for i, gemini_question in enumerate(quiz_data['questions']):
                choices = [
                    {
                        'id': j + 1,
                        'choice_text': option,
                        'is_correct': option == gemini_question['correct_answer']
                    }
                    for j, option in enumerate(gemini_question['options'])
                ]

                question_points = get_points_for_difficulty(gemini_question.get('difficulty', difficulty))

                transformed_questions.append({
                    'id': i + 1,
                    'question_text': gemini_question['question'],
                    'question_type': 'multiple_choice',
                    'points': question_points,
                    'order': i + 1,
                    'choices': choices
                })

            total_points = sum(q['points'] for q in transformed_questions)

            response_data = {
                'id': int(time.time() * 1000),  # Unique ID based on timestamp
                'title': quiz_data.get('title', f'{difficulty.title()} Quiz'),
                'description': quiz_data.get('description', f'A {difficulty} difficulty quiz with {question_count} questions'),
                'created_at': timezone.now().isoformat(),
                'questions': transformed_questions,
                'total_points': total_points
            }

            return Response(response_data)

        except json.JSONDecodeError as e:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                time.sleep(delay)
                continue
            return Response({
                'error': 'Failed to parse AI response. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            error_message = str(e).lower()

            # Check if retryable error
            is_retryable = any(keyword in error_message for keyword in [
                'overloaded', '503', '502', '504', 'timeout', 'network', 'fetch'
            ])

            if is_retryable and attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                time.sleep(delay)
                continue

            # Return specific error messages
            if 'api_key' in error_message or 'api key' in error_message:
                return Response({
                    'error': 'Invalid API key. Please check your Gemini API key configuration.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            if 'overloaded' in error_message or '503' in error_message:
                return Response({
                    'error': 'AI service is currently overloaded. Please wait a moment and try again.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            if 'quota' in error_message or 'limit' in error_message:
                return Response({
                    'error': 'API quota exceeded. Please try again later or check your API usage limits.'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            if 'timeout' in error_message:
                return Response({
                    'error': 'Request timed out. Please check your internet connection and try again.'
                }, status=status.HTTP_504_GATEWAY_TIMEOUT)

            # Generic error
            return Response({
                'error': 'Failed to generate quiz. The AI service may be temporarily unavailable. Please try again in a few moments.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # If all retries exhausted
    return Response({
        'error': 'Failed to generate quiz after multiple attempts. Please try again later.'
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
