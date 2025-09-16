"""
Utility functions for the quiz application
"""


def get_points_for_difficulty(difficulty: str) -> int:
    """
    Get the correct point value based on question difficulty.

    Args:
        difficulty: The difficulty level ('easy', 'medium', 'hard')

    Returns:
        int: Points for the difficulty level (1 for easy, 2 for medium, 4 for hard)
    """
    difficulty_points = {
        'easy': 1,
        'medium': 2,
        'hard': 4
    }
    return difficulty_points.get(difficulty.lower(), 2)  # Default to medium (2 points)


def calculate_quiz_total_points(quiz) -> int:
    """
    Calculate the total points for a quiz based on all its questions.

    Args:
        quiz: Quiz model instance

    Returns:
        int: Total points for the quiz
    """
    return sum(question.points for question in quiz.questions.all())


def get_difficulty_distribution(quiz) -> dict:
    """
    Get the distribution of question difficulties in a quiz.

    Args:
        quiz: Quiz model instance

    Returns:
        dict: Dictionary with difficulty counts
    """
    questions = quiz.questions.all()
    distribution = {
        'easy': questions.filter(difficulty='easy').count(),
        'medium': questions.filter(difficulty='medium').count(),
        'hard': questions.filter(difficulty='hard').count(),
    }
    distribution['total'] = sum(distribution.values())
    return distribution