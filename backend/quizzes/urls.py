from django.urls import path
from . import views
# Updated for leaderboard functionality

urlpatterns = [
    path('quizzes/', views.QuizListView.as_view(), name='quiz-list'),
    path('quizzes/<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail'),
    path('quiz/generate/', views.generate_custom_quiz, name='generate-custom-quiz'),
    path('quiz/generate-ai/', views.generate_ai_quiz, name='generate-ai-quiz'),
    path('submit/', views.submit_quiz, name='submit-quiz'),
    path('attempts/<int:user_id>/', views.get_user_attempts, name='user-attempts'),

    # Leaderboard endpoints
    path('leaderboard/', views.global_leaderboard, name='global-leaderboard'),
    path('leaderboard/quiz/<int:quiz_id>/', views.quiz_leaderboard, name='quiz-leaderboard'),
    path('profile/<int:user_id>/', views.user_profile, name='user-profile'),

    # Data management endpoints
    path('cleanup/', views.cleanup_quiz_data, name='cleanup-quiz-data'),
    path('save-custom-result/', views.save_custom_quiz_result, name='save-custom-quiz-result'),
    path('scheduler/', views.scheduler_status, name='scheduler-status'),
]