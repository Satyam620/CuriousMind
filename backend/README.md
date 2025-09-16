# CuriousMind Backend

A robust Django REST API backend for the CuriousMind quiz application, providing comprehensive quiz management, user authentication, and AI integration capabilities.

## 🏗️ Architecture Overview

### Technology Stack
- **Framework**: Django 4.2.7 with Django REST Framework 3.14.0
- **Database**: PostgreSQL with psycopg2-binary
- **Authentication**: JWT with djangorestframework-simplejwt & djoser
- **API**: RESTful API with DRF serializers and viewsets
- **CORS**: django-cors-headers for frontend integration
- **Configuration**: python-decouple for environment management

### Project Structure
```
backend/
├── quiz_backend/           # Django project configuration
│   ├── settings.py            # Main configuration file
│   ├── urls.py               # Root URL configuration
│   ├── wsgi.py              # WSGI application
│   └── asgi.py              # ASGI application (async support)
├── quizzes/               # Main application module
│   ├── models.py             # Database models
│   ├── views.py              # API views and business logic
│   ├── serializers.py        # DRF serializers
│   ├── urls.py               # App URL configuration
│   ├── admin.py              # Django admin configuration
│   └── migrations/           # Database migrations
├── manage.py              # Django management script
└── requirements.txt       # Python dependencies
```

### Database Architecture

#### Core Models

```python
# Quiz Management
class Quiz(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    points = models.IntegerField(default=1)
    order = models.IntegerField(default=0)

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices')
    choice_text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

# User Management
class QuizAttempt(models.Model):
    user = models.ForeignKey(User)
    quiz = models.ForeignKey(Quiz)
    score = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    time_taken_seconds = models.IntegerField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

class Answer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, related_name='answers')
    question = models.ForeignKey(Question)
    selected_choice = models.ForeignKey(Choice, null=True, blank=True)
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)

class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name='profile')
    total_score = models.IntegerField(default=0)
    total_quizzes_completed = models.IntegerField(default=0)
    average_score_percentage = models.FloatField(default=0.0)
    rank = models.IntegerField(default=0)
```

#### Database Relationships
```
User (1) → (*) QuizAttempt (1) → (*) Answer (*) ← (1) Question
User (1) → (1) UserProfile
Quiz (1) → (*) Question (1) → (*) Choice
Quiz (1) → (*) QuizAttempt
```

### API Architecture

#### RESTful Endpoints Structure

**Authentication & Users**
```
POST   /auth/users/                    # User registration
POST   /auth/jwt/create/               # User login
POST   /auth/jwt/refresh/              # Token refresh
POST   /auth/jwt/verify/               # Token verification
GET    /auth/users/me/                 # Current user profile
```

**Quiz Management**
```
GET    /api/quizzes/                   # List all quizzes
GET    /api/quizzes/{id}/              # Get specific quiz
POST   /api/quiz/generate/             # Generate custom quiz
POST   /api/submit/                    # Submit quiz answers
GET    /api/attempts/{user_id}/        # Get user attempts
```

**Leaderboards & Statistics**
```
GET    /api/leaderboard/               # Global leaderboard
GET    /api/leaderboard/quiz/{id}/     # Quiz-specific leaderboard
GET    /api/profile/{user_id}/         # User profile with stats
POST   /api/save-custom-result/        # Save AI quiz results
```

**Data Management**
```
DELETE /api/cleanup/                   # Clean up old quiz data
```

#### API Response Patterns

**Standard Success Response**
```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

**Error Response**
```json
{
  "status": "error",
  "errors": {
    "field_name": ["Error message"]
  },
  "message": "Validation failed"
}
```

### Business Logic Architecture

#### Quiz Generation System
```python
def generate_custom_quiz(category, difficulty=None, question_count=10):
    """
    Generate custom quiz based on parameters
    - Filter questions by category and difficulty
    - Randomize question selection
    - Create temporary quiz instance
    - Return structured quiz data
    """
```

#### Scoring System
```python
def calculate_quiz_score(answers, questions):
    """
    Calculate quiz score with difficulty-based points:
    - Easy: 1 point
    - Medium: 2 points
    - Hard: 4 points
    - Support for AI-generated quiz scoring
    """
```

#### User Statistics System
```python
def update_user_stats(user_profile):
    """
    Update user statistics:
    - Total score aggregation
    - Average percentage calculation
    - Quiz completion count
    - Ranking calculation
    """
```

### Authentication Architecture

#### JWT Token System
- **Access Token**: 15-minute expiry for API access
- **Refresh Token**: 7-day expiry for token renewal
- **Token Validation**: Middleware for protected endpoints
- **User Permissions**: Role-based access control

#### Security Features
- **CORS Configuration**: Controlled cross-origin requests
- **SQL Injection Protection**: Django ORM parameterized queries
- **XSS Protection**: Input validation and sanitization
- **CSRF Protection**: Django's built-in CSRF middleware

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)
- Virtual environment tool (venv/virtualenv)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd CuriousMind/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv

   # Activate virtual environment
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Create `.env` file in the project root:
   ```env
   SECRET_KEY=your-django-secret-key-here
   DEBUG=True
   DB_NAME=curiousmind_db
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **🔐 Security Notes**:
   - Generate a strong Django secret key using: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
   - Use strong database credentials
   - Set `DEBUG=False` in production
   - Update `CORS_ALLOWED_ORIGINS` with your frontend URLs
   - Never commit `.env` files to version control

5. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb curiousmind_db

   # Run migrations
   python manage.py makemigrations
   python manage.py migrate

   # Create superuser (optional)
   python manage.py createsuperuser
   ```

6. **Load Sample Data**
   ```bash
   # Import trivia questions (if available)
   python manage.py import_trivia_data

   # Import OpenTDB questions (if available)
   python manage.py import_opentdb
   ```

7. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

## 📋 Available Commands

### Django Management Commands
```bash
# Development
python manage.py runserver              # Start development server
python manage.py shell                  # Open Django shell
python manage.py dbshell                # Open database shell

# Database
python manage.py makemigrations         # Create new migrations
python manage.py migrate                # Apply migrations
python manage.py showmigrations         # Show migration status

# Data Management
python manage.py import_trivia_data     # Import sample quiz data
python manage.py import_opentdb         # Import OpenTDB questions
python manage.py cleanup_data           # Clean up old quiz attempts

# User Management
python manage.py createsuperuser        # Create admin user
python manage.py changepassword         # Change user password
```

### Custom Management Commands
```bash
# Data Import Commands
python manage.py import_trivia_data --file=data/trivia.json
python manage.py import_opentdb --categories=9,10,11

# Maintenance Commands
python manage.py cleanup_data --days=30
python manage.py update_user_rankings
```

## 🔧 Configuration

### Database Configuration
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}
```

### CORS Configuration
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",    # React development server
    "http://localhost:8081",    # Expo development server
    "http://localhost:19006",   # Alternative Expo port
    # Add your production frontend URLs here
]

# For development, you can also use:
# CORS_ALLOW_ALL_ORIGINS = True  # WARNING: Only for development!
```

### JWT Configuration
```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

## 📊 API Documentation

### Quiz Endpoints

#### Get Quiz List
```http
GET /api/quizzes/
Response: Array of quiz objects with metadata
```

#### Get Quiz Details
```http
GET /api/quizzes/{id}/
Response: Complete quiz with questions and choices
```

#### Generate Custom Quiz
```http
POST /api/quiz/generate/
Body: {
  "category": "Science",
  "difficulty": "medium",
  "question_count": 10
}
Response: Generated quiz object
```

#### Submit Quiz
```http
POST /api/submit/
Body: {
  "quiz_id": 1,
  "answers": [...],
  "time_taken_seconds": 120
}
Response: Quiz results with score
```

### User Endpoints

#### User Registration
```http
POST /auth/users/
Body: {
  "username": "user123",
  "email": "user@example.com",
  "password": "securepassword",
  "re_password": "securepassword"
}
```

#### User Login
```http
POST /auth/jwt/create/
Body: {
  "username": "user123",
  "password": "securepassword"
}
Response: {
  "access": "jwt_token",
  "refresh": "refresh_token"
}
```

## 🔍 Testing

### Unit Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test quizzes

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### API Testing with curl
```bash
# Login
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# Get quizzes (authenticated)
curl -X GET http://localhost:8000/api/quizzes/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Deployment

### Production Settings
```python
# settings/production.py
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']
DATABASES = {
    # Production database configuration
}
```

### Docker Deployment
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "quiz_backend.wsgi:application"]
```

### Environment Variables for Production
```env
SECRET_KEY=production-secret-key
DEBUG=False
DB_NAME=production_db
DB_USER=production_user
DB_PASSWORD=secure_password
DB_HOST=db.example.com
ALLOWED_HOSTS=api.curiousmind.com,www.curiousmind.com
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   pg_ctl status

   # Restart PostgreSQL
   pg_ctl restart
   ```

2. **Migration Problems**
   ```bash
   # Reset migrations (development only)
   python manage.py migrate quizzes zero
   python manage.py migrate
   ```

3. **CORS Issues**
   - Verify frontend URL in CORS_ALLOWED_ORIGINS
   - Check preflight request handling

## 📈 Performance Optimization

### Database Optimization
- Use `select_related()` for foreign key relationships
- Implement database indexing for frequent queries
- Use `prefetch_related()` for many-to-many relationships

### Caching Strategy
```python
# Cache quiz data
from django.core.cache import cache

def get_cached_quiz(quiz_id):
    cache_key = f'quiz_{quiz_id}'
    quiz = cache.get(cache_key)
    if not quiz:
        quiz = Quiz.objects.get(id=quiz_id)
        cache.set(cache_key, quiz, timeout=3600)
    return quiz
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 🔐 Security Best Practices

### Environment Variables
- **Never commit `.env` files** to version control
- **Use strong passwords** for database and admin accounts
- **Rotate API keys** regularly
- **Set DEBUG=False** in production

### Database Security
```python
# Use environment variables for sensitive data
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

### Production Security Settings
```python
# settings/production.py
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# HTTPS settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### API Security
- **Rate limiting** implemented for all endpoints
- **Input validation** on all user inputs
- **SQL injection protection** via Django ORM
- **XSS protection** with proper serialization

## 📊 Monitoring & Logging

### Error Tracking
```python
# Integrate with services like Sentry
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
)
```

### Performance Monitoring
- **Database query optimization** with Django Debug Toolbar
- **API response time tracking**
- **Memory usage monitoring**
- **Error rate tracking**

## 🚀 Scaling Considerations

### Database Optimization
- **Connection pooling** for high traffic
- **Database indexing** for frequent queries
- **Read replicas** for read-heavy workloads
- **Query optimization** and caching

### Application Scaling
- **Load balancing** across multiple instances
- **Redis caching** for session and data caching
- **CDN integration** for static files
- **Background task processing** with Celery

## 📄 License

This project is licensed under the MIT License.
