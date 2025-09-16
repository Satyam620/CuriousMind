# CuriousMind

A comprehensive quiz application built with React Native (Expo) frontend and Django REST API backend. Features AI-generated quizzes, user authentication, leaderboards, and customizable themes and fonts.

## 🚀 Features

- **AI-Powered Quiz Generation**: Generate custom quizzes using Google's Gemini AI
- **Multi-Source Quiz Data**: Import quizzes from Open Trivia Database
- **User Authentication**: Secure JWT-based authentication with user profiles
- **Real-time Leaderboards**: Global scoring and ranking system
- **Cross-Platform**: Runs on iOS, Android, and Web
- **Customizable UI**: Dark/light themes and multiple font options
- **Timer Tracking**: Accurate quiz completion time tracking
- **Difficulty-Based Scoring**: Dynamic points based on question difficulty

## 📱 Tech Stack

### Frontend
- **React Native** with Expo CLI
- **TypeScript** for type safety
- **React Navigation** for navigation
- **AsyncStorage** for local data persistence
- **Expo Vector Icons** for icons
- **Context API** for state management

### Backend
- **Django 4.2.7** with Django REST Framework
- **PostgreSQL** database
- **JWT Authentication** via SimpleJWT
- **CORS** handling for cross-origin requests
- **Python Decouple** for environment management

### AI Integration
- **Google Gemini AI** for quiz generation
- **Custom prompts** for educational content creation

## 🏗️ Project Structure

```
CuriousMind/
├── frontend/               # React Native Expo app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API and external services
│   │   └── config/         # Configuration files
│   └── assets/            # Static assets
├── backend/               # Django REST API
│   ├── quiz_backend/      # Django project settings
│   ├── quizzes/          # Main app with models/views
│   └── requirements.txt   # Python dependencies
├── fixtures/             # Quiz data fixtures for deployment
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL 12+
- Expo CLI (`npm install -g @expo/cli`)

### Backend Setup

1. **Clone and navigate to backend**
   ```bash
   git clone <repository-url>
   cd CuriousMind/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

5. **Database setup**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create a `.env` file in the `frontend` directory:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **⚠️ Security Note**:
   - Replace `localhost` with your server's IP address for network access
   - Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Never commit the `.env` file to version control

4. **Start development server**
   ```bash
   # For web
   npm run web

   # For mobile (iOS/Android)
   npx expo start
   ```

## 📊 Data Management

### Create Quiz Fixtures from External Sources

Instead of directly importing to the database, create fixtures that can be deployed across environments:

**Create Fixtures from Open Trivia Database**
```bash
# List available categories
python manage.py create_opentdb_fixtures --list-categories

# Create fixtures for specific category
python manage.py create_opentdb_fixtures --category-id 17 --amount 10 --output-dir fixtures/opentdb

# Create fixtures for all categories (separate files)
python manage.py create_opentdb_fixtures --all --amount 5 --split-files --output-dir fixtures/opentdb

# Create fixtures with difficulty filter
python manage.py create_opentdb_fixtures --category-id 9 --difficulty easy --amount 15
```

**Legacy Database Import (Direct)**
```bash
python manage.py import_opentdb --list-categories
python manage.py import_opentdb --category-id 9 --amount 20
python manage.py import_opentdb --all  # Import from all categories
```

### 🏗️ Fixture Management for Deployment

The application includes a comprehensive fixture system for deploying quiz data across environments:

#### Export Quiz Data to Fixtures

Create fixture files from your existing database:

```bash
# Export all quiz data to fixtures
python manage.py export_quiz_fixtures --output-dir fixtures

# Export specific category only
python manage.py export_quiz_fixtures --category science --output-dir fixtures

# Split into separate files by category
python manage.py export_quiz_fixtures --split-files --output-dir fixtures

# Exclude AI-generated quizzes from export
python manage.py export_quiz_fixtures --exclude-ai --output-dir fixtures

# Limit number of quizzes per category
python manage.py export_quiz_fixtures --max-quizzes 10 --output-dir fixtures
```

**Export Options:**
- `--output-dir`: Directory to save fixture files (default: `fixtures`)
- `--category`: Export specific category only (filters by title content)
- `--exclude-ai`: Skip AI-generated quizzes
- `--max-quizzes`: Limit number of quizzes to export
- `--split-files`: Create separate files per category

#### Load Fixtures for Deployment

Load fixture data into a new deployment:

```bash
# Load all fixtures from fixtures directory
python manage.py load_quiz_fixtures

# Load from custom directory
python manage.py load_quiz_fixtures --fixtures-dir my_fixtures

# Load specific category only
python manage.py load_quiz_fixtures --category science

# Clear existing data before loading (CAUTION: Deletes all quiz data)
python manage.py load_quiz_fixtures --clear-existing

# Preview what would be loaded (dry run)
python manage.py load_quiz_fixtures --dry-run

# Skip confirmation prompts
python manage.py load_quiz_fixtures --force
```

**Load Options:**
- `--fixtures-dir`: Directory containing fixture files (default: `fixtures`)
- `--category`: Load specific category only
- `--clear-existing`: ⚠️ **DANGER**: Deletes ALL existing quiz data first
- `--dry-run`: Preview what would be loaded without making changes
- `--force`: Skip confirmation prompts

#### Fixture File Structure

Fixture files are generated in Django's standard JSON format:
```
fixtures/
├── science_fixtures.json           # Science category quizzes
├── history_fixtures.json           # History category quizzes
├── entertainment_fixtures.json     # Entertainment quizzes
├── general_knowledge_fixtures.json # General knowledge quizzes
└── ... (additional categories)
```

Each fixture file contains:
- Quiz objects with metadata
- Question objects with difficulty levels
- Choice objects with correct answers

#### Deployment Workflow

**Recommended: Create Fixtures from External Sources**
1. Create fixtures directly from OpenTDB:
   ```bash
   python manage.py create_opentdb_fixtures --all --amount 10 --split-files --output-dir fixtures
   ```

2. Deploy fixtures to any environment:
   ```bash
   python manage.py load_quiz_fixtures --fixtures-dir fixtures --force
   ```

**Alternative: Export from Existing Database**
1. Export fixtures from development database:
   ```bash
   python manage.py export_quiz_fixtures --exclude-ai --split-files
   ```

2. Transfer fixture files to production server

3. Load fixtures in production:
   ```bash
   python manage.py load_quiz_fixtures --force
   ```

**For Environment Sync:**
```bash
# Development → Staging
python manage.py export_quiz_fixtures --category science --max-quizzes 5
python manage.py load_quiz_fixtures --category science --dry-run
python manage.py load_quiz_fixtures --category science
```

### Environment Controls

Data ingestion can be controlled via environment variables:
```env
ENABLE_DATA_INGESTION=true
ALLOW_BULK_DATA_IMPORT=false
MAX_IMPORT_BATCH_SIZE=1000
```

## 🎯 Key Features

### AI Quiz Generation
- Powered by Google Gemini AI
- Supports multiple difficulty levels (easy=1pt, medium=2pts, hard=4pts)
- Customizable topics and question counts
- Educational content optimization

### User Management
- Secure JWT authentication
- User profiles with statistics
- Quiz history tracking
- Performance analytics

### Cross-Platform Compatibility
- React Native Web support
- Platform-specific optimizations
- Consistent UI/UX across devices
- Responsive design patterns

## 📱 Available Scripts

### Frontend
```bash
npm start          # Start Expo development server
npm run web        # Run on web browser
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
```

### Backend
```bash
python manage.py runserver           # Start Django server
python manage.py shell              # Django shell
python manage.py test               # Run tests
python manage.py collectstatic      # Collect static files
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
SECRET_KEY=your-secret-key
DEBUG=true
DB_NAME=quiz_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
ENABLE_DATA_INGESTION=true
GEMINI_API_KEY=your-gemini-key  # Optional for AI features
```

**Frontend (.env)**
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**📱 Network Configuration for Mobile Development**:
- **Local Development**: Use `http://localhost:8000`
- **LAN Testing**: Replace `localhost` with your computer's IP address (e.g., `http://192.168.1.100:8000`)
- **Production**: Use your deployed backend URL

## 📚 API Documentation

The Django backend provides a comprehensive REST API:

- `GET /api/quizzes/` - List all quizzes
- `GET /api/quizzes/{id}/` - Get specific quiz details
- `POST /api/quiz/generate/` - Generate custom quiz
- `POST /api/submit/` - Submit quiz answers and get results
- `GET /api/leaderboard/` - Get global rankings
- `POST /api/save-custom-result/` - Save AI-generated quiz results
- `POST /auth/users/` - User registration
- `POST /auth/jwt/create/` - User login

For detailed API documentation, see [backend/README.md](backend/README.md).

## 🏛️ Architecture

The application follows a modern client-server architecture with:

- **Frontend**: React Native with Context API for state management
- **Backend**: Django REST API with PostgreSQL database
- **Authentication**: JWT tokens for secure communication
- **Data Flow**: RESTful API communication with proper error handling

For detailed system design, see [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Open Trivia Database](https://opentdb.com/) for quiz data
- [Google Gemini AI](https://ai.google.dev/) for AI-powered quiz generation
- [Expo](https://expo.dev/) for React Native development tools
- [Django REST Framework](https://www.django-rest-framework.org/) for API development

## 🔒 Security & Privacy

### Data Security
- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: Passwords are hashed using Django's built-in security
- **API Rate Limiting**: Prevents abuse with request rate limiting
- **Input Validation**: All user inputs are validated and sanitized

### Privacy Considerations
- **Minimal Data Collection**: Only essential user data is collected
- **No Personal Tracking**: No invasive analytics or tracking
- **Local Preferences**: Theme and font preferences stored locally
- **Open Source**: Full transparency with open source code

### Environment Security
- **Environment Variables**: Sensitive data stored in `.env` files
- **Git Ignore**: `.env` files automatically excluded from version control
- **API Key Management**: Secure API key handling and rotation

## 🌟 Features in Detail

### 🎯 Quiz System
- **15+ Categories**: Science, History, Entertainment, Sports, and more
- **3 Difficulty Levels**: Easy (1pt), Medium (2pts), Hard (4pts)
- **Dynamic Scoring**: Points based on difficulty and time taken
- **Progress Tracking**: Real-time progress indicators
- **Timer System**: Accurate completion time tracking

### 🤖 AI-Powered Quizzes
- **Custom Topics**: Generate quizzes on any topic
- **Adaptive Difficulty**: AI adjusts questions based on preferences
- **Educational Focus**: Content optimized for learning
- **Instant Generation**: Quick quiz creation with Gemini AI

### 👥 User Experience
- **Responsive Design**: Works seamlessly on all devices
- **Theme System**: Beautiful dark and light themes
- **Font Customization**: Choose from multiple font families
- **Offline Support**: Basic functionality without internet
- **Cross-Platform**: Consistent experience across Web, iOS, Android

### 📊 Analytics & Leaderboards
- **Performance Tracking**: Detailed statistics and progress
- **Global Rankings**: Compete with users worldwide
- **Category Leaderboards**: Specialized rankings per category
- **Personal Best**: Track your improvement over time

## 🛠️ Development

### Code Quality
- **TypeScript**: Type-safe development across the stack
- **ESLint & Prettier**: Consistent code formatting
- **Component Architecture**: Reusable, maintainable components
- **Error Boundaries**: Graceful error handling

### Testing
- **Unit Tests**: Comprehensive test coverage
- **Integration Tests**: API endpoint testing
- **E2E Testing**: End-to-end user flow testing
- **Manual Testing**: Cross-platform compatibility testing

### Performance
- **Lazy Loading**: Optimized component loading
- **Image Optimization**: Efficient asset management
- **Bundle Splitting**: Reduced initial load times
- **Memory Management**: Proper cleanup and optimization

## 🚀 Deployment Options

### Frontend Deployment
- **Vercel**: Optimal for React Native Web
- **Netlify**: Simple static site deployment
- **AWS S3 + CloudFront**: Scalable cloud deployment
- **GitHub Pages**: Free hosting for open source

### Backend Deployment
- **Heroku**: Simple PaaS deployment
- **DigitalOcean**: VPS with Docker support
- **AWS EC2**: Scalable cloud infrastructure
- **Railway**: Modern deployment platform

### Mobile App Distribution
- **Expo Updates**: Over-the-air updates
- **App Store**: iOS app distribution
- **Google Play**: Android app distribution
- **Expo Go**: Development and testing

## 📊 System Requirements

### Development Environment
- **Node.js**: v18.0.0 or higher
- **Python**: v3.9.0 or higher
- **PostgreSQL**: v12.0 or higher
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space

### Production Environment
- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum for backend
- **Database**: PostgreSQL with sufficient storage
- **Bandwidth**: Adequate for user base
- **SSL Certificate**: Required for HTTPS

## 🔧 Troubleshooting

### Common Issues

#### Frontend Issues
- **Metro bundler crashes**: Run `npx expo start --clear`
- **Environment variables not loading**: Check `.env` file format
- **Network connection failed**: Verify backend URL and network connectivity
- **Build failures**: Update dependencies and clear cache

#### Backend Issues
- **Database connection errors**: Check PostgreSQL service and credentials
- **Migration failures**: Reset migrations in development environment
- **CORS errors**: Verify frontend URL in allowed origins
- **API timeout**: Check server resources and database performance

#### Mobile Development
- **iOS simulator issues**: Reset simulator and reinstall app
- **Android emulator problems**: Check AVD configuration and resources
- **Device connection**: Ensure proper USB debugging setup
- **Build errors**: Update Expo CLI and dependencies

## 📚 Learning Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tutorials
- [React Native Tutorial](https://reactnative.dev/docs/tutorial)
- [Django Tutorial](https://docs.djangoproject.com/en/stable/intro/tutorial01/)
- [JWT Authentication Guide](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Expo Development Guide](https://docs.expo.dev/guides/)

## 📞 Support & Community

### Getting Help
- **Documentation**: Check this README and linked resources
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Community**: Join our community forums

### Contributing
- **Bug Reports**: Help improve the project by reporting issues
- **Feature Requests**: Suggest new features and improvements
- **Code Contributions**: Submit pull requests with improvements
- **Documentation**: Help improve documentation and guides

### Contact
- **GitHub Issues**: Primary support channel
- **Email**: For security-related issues only
- **Community Forum**: For general discussions and help
