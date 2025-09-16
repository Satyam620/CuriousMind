# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CuriousMind is a comprehensive quiz application with React Native (Expo) frontend and Django REST API backend. It features AI-generated quizzes using Google Gemini, user authentication, leaderboards, and cross-platform support (Web, iOS, Android).

## Development Commands

### Frontend (React Native + Expo)
```bash
# Navigate to frontend directory first
cd frontend

# Development servers
npm start           # Start Expo development server
npm run web         # Launch web version at localhost:8081
npm run android     # Run on Android emulator
npm run ios         # Run on iOS simulator

# Troubleshooting
npx expo start --clear    # Clear Metro bundler cache
npx expo install          # Fix package compatibility issues
```

### Backend (Django)
```bash
# Navigate to backend directory first
cd backend

# Virtual environment (Windows)
venv\Scripts\activate

# Virtual environment (macOS/Linux)
source venv/bin/activate

# Development server
python manage.py runserver    # Start at localhost:8000

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Data import commands
python manage.py import_opentdb --list-categories
python manage.py import_opentdb --category-id 9 --amount 50
python manage.py import_opentdb --all --amount 50
python manage.py import_trivia_data --data-dir ./data_ingestion/processed_data

# Maintenance
python manage.py shell              # Django shell
python manage.py test               # Run tests
python manage.py update_leaderboard # Update user rankings
```

## Architecture Overview

### Frontend Structure
- **Context-based State Management**: Theme, Font, and Auth contexts
- **Navigation**: Stack + Tab navigation with React Navigation
- **Platform-specific Files**: `.web.tsx` files for web optimizations
- **Cross-platform Components**: Shared components with platform adaptations

Key directories:
- `frontend/src/screens/` - All screen components
- `frontend/src/contexts/` - React contexts for global state
- `frontend/src/services/` - API clients and external service integrations
- `frontend/src/utils/` - Helper functions and utilities

### Backend Structure
- **Django MVT Pattern**: Models, Views, Templates (API-focused)
- **DRF Architecture**: ViewSets and Serializers for API endpoints
- **JWT Authentication**: SimpleJWT integration with user profiles
- **Custom Management Commands**: Data import and maintenance utilities

Key directories:
- `backend/quizzes/` - Main app with models, views, serializers
- `backend/quiz_backend/` - Django project settings and configuration
- `backend/quizzes/management/commands/` - Custom management commands

### Data Flow
1. **Authentication**: JWT-based with refresh tokens
2. **Quiz Generation**: Either from database queries or AI (Gemini) generation
3. **Real-time Scoring**: Client-side timer, server-side validation
4. **Leaderboards**: Calculated from QuizAttempt aggregations

## Key Development Patterns

### Frontend
- **Screen Variants**: Use `.web.tsx` for web-specific implementations
- **Responsive Design**: `Platform.OS === 'web'` checks and responsive calculations
- **Context Pattern**: Global state via React Context, local state for UI
- **Error Handling**: Comprehensive try-catch with user-friendly error messages

### Backend
- **Serializer Pattern**: Separate serializers for different data representations
- **ViewSet Pattern**: DRF ViewSets for CRUD operations with custom actions
- **Service Layer**: Business logic separated from views when complex
- **Environment Configuration**: Use `python-decouple` for settings management

## Configuration Files

### Environment Variables
Frontend (`.env` in frontend directory):
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

Backend (`.env` in backend directory):
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=curiousmind_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
ENABLE_DATA_INGESTION=true
GEMINI_API_KEY=your_gemini_key
```

### Important Configuration Notes
- Frontend API URL: Use device IP (not localhost) for mobile device testing
- CORS Settings: Backend configured for localhost:8081 (Expo web) and localhost:3000
- Database: PostgreSQL required for production, SQLite acceptable for development

## Testing & Quality

### Frontend Testing
- Manual testing across web and mobile platforms
- Test responsive layouts with different screen sizes
- Verify platform-specific features work correctly

### Backend Testing
```bash
python manage.py test                # Run all tests
python manage.py test quizzes        # Test specific app
```

### Data Import Testing
```bash
# Test data import commands
python manage.py import_opentdb --category-id 9 --amount 5
```

## Common Issues & Solutions

### Frontend Issues
- **Metro bundler crashes**: Run `npx expo start --clear`
- **Network errors**: Check API URL in environment variables
- **Platform-specific bugs**: Check for `.web.tsx` variants or Platform.OS conditions

### Backend Issues
- **Database connection**: Verify PostgreSQL service and credentials
- **CORS errors**: Check CORS_ALLOWED_ORIGINS includes frontend URL
- **Migration issues**: Run makemigrations before migrate

### Data Import Issues
- **Rate limiting**: Use smaller batch sizes for OpenTDB imports
- **Environment settings**: Ensure ENABLE_DATA_INGESTION=true

## API Structure

### Authentication Endpoints
- `POST /auth/jwt/create/` - Login (returns access + refresh tokens)
- `POST /auth/users/` - User registration
- `POST /auth/jwt/refresh/` - Token refresh

### Quiz Endpoints
- `GET /api/quizzes/` - List available quizzes
- `GET /api/quizzes/{id}/` - Get quiz details with questions
- `POST /api/quiz/generate/` - Generate custom AI quiz
- `POST /api/submit/` - Submit quiz answers and get results

### User Data Endpoints
- `GET /api/leaderboard/` - Global leaderboard
- `GET /api/profile/{user_id}/` - User profile with statistics

## Deployment Notes

### Frontend Deployment
- Web: Static hosting (Vercel, Netlify) with `npm run web`
- Mobile: Expo builds for App Store/Google Play

### Backend Deployment
- Use `DEBUG=False` and proper `ALLOWED_HOSTS` in production
- Configure production database with connection pooling
- Set up proper CORS origins for production frontend URLs

## Development Workflow

1. **Setup**: Start backend server, then frontend development server
2. **Feature Development**: Create platform-specific files when needed
3. **Data Management**: Use management commands for importing quiz data
4. **Testing**: Test on both web and mobile platforms
5. **Database Changes**: Always run makemigrations and migrate

## Architecture Decisions

### Why React Native + Django?
- Cross-platform mobile development with web support
- Robust backend with excellent ecosystem
- Clear separation of concerns between frontend and backend

### Why Context API over Redux?
- Simpler state management for the application size
- Better TypeScript integration
- Reduced boilerplate code

### Why PostgreSQL over SQLite?
- Better support for concurrent users
- Advanced features for leaderboards and analytics
- Production-ready scalability