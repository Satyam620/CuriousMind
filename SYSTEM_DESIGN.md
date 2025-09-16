# CuriousMind System Design Documentation

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Architecture Patterns](#architecture-patterns)
- [Component Design](#component-design)
- [Data Flow Architecture](#data-flow-architecture)
- [Security Architecture](#security-architecture)
- [Performance & Scalability](#performance--scalability)
- [Deployment Architecture](#deployment-architecture)
- [Monitoring & Analytics](#monitoring--analytics)

## 🎯 System Overview

### Project Description
CuriousMind is a comprehensive quiz application that combines traditional trivia questions with AI-generated content, providing users with personalized learning experiences across multiple platforms.

### Core Objectives
- **Educational**: Provide engaging quiz experiences for learning
- **Accessibility**: Multi-platform support (Web, iOS, Android)
- **Intelligence**: AI-powered quiz generation with Gemini integration
- **Social**: Competitive leaderboards and user rankings
- **Performance**: Real-time quiz functionality with accurate timer tracking

### System Characteristics
- **Type**: Multi-tier web and mobile application
- **Scale**: Medium-scale application supporting hundreds of concurrent users
- **Availability**: 99.9% uptime target with graceful degradation
- **Consistency**: Eventually consistent with real-time user experience
- **Partition Tolerance**: Offline-capable with sync mechanisms

## 🏗️ Architecture Patterns

### Overall Architecture Pattern: **3-Tier Architecture**
```
┌─────────────────────────────────────┐
│         Presentation Tier           │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │   Web   │ │   iOS   │ │Android │ │
│  │ (React) │ │(Native) │ │(Native)│ │
│  └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────┘
                  │
                  │ HTTP/HTTPS
                  │ REST API
                  ▼
┌─────────────────────────────────────┐
│         Application Tier            │
│  ┌─────────────────────────────────┐ │
│  │      Django REST Framework     │ │
│  │  ┌─────────┐ ┌──────────────┐  │ │
│  │  │Business │ │  AI Service  │  │ │
│  │  │  Logic  │ │   (Gemini)   │  │ │
│  │  └─────────┘ └──────────────┘  │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
                  │
                  │ SQL
                  ▼
┌─────────────────────────────────────┐
│            Data Tier                │
│  ┌─────────────────────────────────┐ │
│  │        PostgreSQL              │ │
│  │  ┌───────┐ ┌────────┐ ┌──────┐  │ │
│  │  │ Users │ │ Quizzes│ │Stats │  │ │
│  │  └───────┘ └────────┘ └──────┘  │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Frontend Architecture Pattern: **Component-Based Architecture with Context Pattern**
```
App Root
├── AuthProvider (Context)
├── ThemeProvider (Context)
├── FontProvider (Context)
├── NavigationContainer
    ├── Stack Navigator (Auth Flow)
    │   ├── IntroScreen
    │   ├── LoginScreen
    │   └── SignupScreen
    └── Stack Navigator (App Flow)
        ├── Tab Navigator
        │   ├── CategoryScreen
        │   ├── QuizGenerateScreen
        │   ├── LeaderboardScreen
        │   └── ProfileScreen
        └── Modal Screens
            ├── QuizConfigScreen
            ├── QuizScreen
            ├── ResultScreen
            └── SettingsScreen
```

### Backend Architecture Pattern: **Layered Architecture (Django MVT)**
```
┌─────────────────────────────────┐
│         Views Layer             │
│  ┌─────────────────────────────┐ │
│  │  API Views & ViewSets       │ │
│  │  - Authentication          │ │
│  │  - Quiz Management         │ │
│  │  - User Statistics         │ │
│  │  - Leaderboards            │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│      Serializers Layer         │
│  ┌─────────────────────────────┐ │
│  │  Data Transformation        │ │
│  │  - Request Validation       │ │
│  │  - Response Formatting      │ │
│  │  - Type Safety             │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│         Models Layer            │
│  ┌─────────────────────────────┐ │
│  │  Business Logic & ORM       │ │
│  │  - Data Models             │ │
│  │  - Relationships           │ │
│  │  - Business Rules          │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## 🔧 Component Design

### Frontend Component Hierarchy
```
App
├── Providers/
│   ├── AuthProvider
│   ├── ThemeProvider
│   └── FontProvider
├── Navigation/
│   ├── RootNavigator
│   ├── AuthNavigator
│   ├── AppNavigator
│   └── TabNavigator
├── Screens/
│   ├── Auth/
│   │   ├── IntroScreen
│   │   ├── LoginScreen
│   │   └── SignupScreen
│   ├── Main/
│   │   ├── CategoryScreen
│   │   ├── QuizGenerateScreen
│   │   ├── LeaderboardScreen
│   │   └── ProfileScreen
│   └── Modal/
│       ├── QuizConfigScreen
│       ├── QuizScreen
│       ├── ResultScreen
│       └── SettingsScreen
├── Services/
│   ├── ApiService
│   ├── GeminiService
│   └── LeaderboardService
└── Utils/
    ├── Formatting
    ├── Validation
    └── Constants
```

### Backend Component Architecture
```
Django Project (quiz_backend)
├── Settings Module
│   ├── Base Settings
│   ├── Development Settings
│   └── Production Settings
├── Main App (quizzes)
│   ├── Models
│   │   ├── Quiz
│   │   ├── Question
│   │   ├── Choice
│   │   ├── QuizAttempt
│   │   ├── Answer
│   │   └── UserProfile
│   ├── Views
│   │   ├── QuizViewSet
│   │   ├── AuthViews
│   │   ├── LeaderboardViews
│   │   └── StatisticsViews
│   ├── Serializers
│   │   ├── QuizSerializer
│   │   ├── UserSerializer
│   │   └── ResultSerializer
│   └── Services
│       ├── QuizGenerationService
│       ├── ScoringService
│       └── StatisticsService
└── Management Commands
    ├── DataImport
    ├── UserManagement
    └── Maintenance
```

## 🔄 Data Flow Architecture

### User Authentication Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Backend   │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ POST /auth/login │                  │
       ├─────────────────►│                  │
       │                  │ Validate User    │
       │                  ├─────────────────►│
       │                  │ User Data        │
       │                  │◄─────────────────┤
       │                  │ Generate JWT     │
       │                  │                  │
       │ JWT + User Data  │                  │
       │◄─────────────────┤                  │
       │                  │                  │
       │ Store JWT Token  │                  │
       │                  │                  │
```

### Quiz Taking Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Backend   │    │  Database   │    │  AI Service │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Request Quiz  │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │ 2. Check Type    │                  │
       │                  │                  │                  │
       │                  │ 3a. DB Quiz      │                  │
       │                  ├─────────────────►│                  │
       │                  │ 3b. AI Quiz      │                  │
       │                  ├──────────────────────────────────►│
       │                  │                  │                  │
       │                  │ Quiz Data        │                  │
       │                  │◄─────────────────┤                  │
       │                  │ Generated Quiz   │                  │
       │                  │◄──────────────────────────────────┤
       │                  │                  │                  │
       │ 4. Quiz Data     │                  │                  │
       │◄─────────────────┤                  │                  │
       │                  │                  │                  │
       │ 5. Submit Answers│                  │                  │
       ├─────────────────►│                  │                  │
       │                  │ 6. Save Results  │                  │
       │                  ├─────────────────►│                  │
       │                  │ 7. Update Stats  │                  │
       │                  ├─────────────────►│                  │
       │                  │                  │                  │
       │ 8. Quiz Results  │                  │                  │
       │◄─────────────────┤                  │                  │
       │                  │                  │                  │
```

### Real-time Timer Tracking Flow
```
Client Side Timer                Backend Processing
┌─────────────────┐            ┌─────────────────┐
│                 │            │                 │
│ 1. Quiz Start   │            │                 │
│    startTime =  │            │                 │
│    Date.now()   │            │                 │
│                 │            │                 │
│ 2. User answers │            │                 │
│    questions    │            │                 │
│    ...          │            │                 │
│                 │            │                 │
│ 3. Quiz Submit  │            │ 4. Receive      │
│    timeElapsed =│───────────►│    submission   │
│    Date.now() - │            │                 │
│    startTime    │            │ 5. Store time   │
│                 │            │    in database  │
│                 │            │                 │
│ 6. Display      │◄───────────│ 7. Return       │
│    results with │            │    results      │
│    time taken   │            │                 │
└─────────────────┘            └─────────────────┘
```

## 🔐 Security Architecture

### Authentication & Authorization
```
┌─────────────────────────────────────────────────────────┐
│                JWT Security Flow                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Client Request                                         │
│  ┌─────────────┐  Include JWT   ┌─────────────────────┐ │
│  │   Client    │ ───────────────► │   API Endpoint     │ │
│  └─────────────┘                 └─────────┬───────────┘ │
│                                            │             │
│                                            ▼             │
│                                  ┌─────────────────────┐ │
│                                  │  JWT Middleware     │ │
│                                  │  - Verify Signature │ │
│                                  │  - Check Expiry     │ │
│                                  │  - Extract User     │ │
│                                  └─────────┬───────────┘ │
│                                            │             │
│                                            ▼             │
│                                  ┌─────────────────────┐ │
│                                  │  Permission Check   │ │
│                                  │  - User Permissions │ │
│                                  │  - Resource Access  │ │
│                                  └─────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Data Security Layers
1. **Transport Layer**: HTTPS/TLS encryption
2. **Application Layer**: JWT token validation
3. **Data Layer**: SQL injection prevention via ORM
4. **Input Validation**: Request data sanitization
5. **CORS Policy**: Controlled cross-origin access

### Security Measures
- **Authentication**: JWT-based with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Django ORM parameterized queries
- **XSS Protection**: Input sanitization and CSP headers
- **CSRF Protection**: Django's built-in CSRF middleware
- **Rate Limiting**: API rate limiting for abuse prevention

## ⚡ Performance & Scalability

### Frontend Performance Optimizations
```
┌─────────────────────────────────────────┐
│          Frontend Optimizations        │
├─────────────────────────────────────────┤
│                                         │
│  React Native Optimizations            │
│  ├── Component Memoization             │
│  ├── Lazy Loading for Screens          │
│  ├── Image Optimization                │
│  ├── FlatList for Large Data Sets      │
│  └── Bundle Splitting                  │
│                                         │
│  State Management                       │
│  ├── Context API for Global State      │
│  ├── Local State for UI Components     │
│  ├── AsyncStorage for Persistence      │
│  └── Efficient Re-renders              │
│                                         │
│  Network Optimization                   │
│  ├── Request Caching                   │
│  ├── Optimistic Updates                │
│  ├── Retry Logic                       │
│  └── Offline Capability                │
│                                         │
└─────────────────────────────────────────┘
```

### Backend Performance Optimizations
```
┌─────────────────────────────────────────┐
│          Backend Optimizations          │
├─────────────────────────────────────────┤
│                                         │
│  Database Optimizations                 │
│  ├── Indexes on Frequent Queries       │
│  ├── select_related() for ForeignKeys  │
│  ├── prefetch_related() for M2M        │
│  ├── Connection Pooling                │
│  └── Query Optimization                │
│                                         │
│  Caching Strategy                       │
│  ├── Django Cache Framework            │
│  ├── Redis for Session Storage         │
│  ├── Quiz Data Caching                 │
│  └── API Response Caching              │
│                                         │
│  Application Optimizations              │
│  ├── Async Views for I/O Operations    │
│  ├── Background Tasks for Heavy Ops    │
│  ├── API Response Compression          │
│  └── Static File Serving               │
│                                         │
└─────────────────────────────────────────┘
```

### Scalability Architecture
```
┌────────────────────────────────────────────────────────────┐
│                    Horizontal Scaling                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Load Balancer (Nginx/AWS ALB)                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │ Instance │  │ Instance │  │ Instance │    ...    │ │
│  │  │    1     │  │    2     │  │    3     │           │ │
│  │  └──────────┘  └──────────┘  └──────────┘           │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Database Scaling                                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐                 │ │
│  │  │   Master    │    │  Read       │                 │ │
│  │  │  Database   │───▶│ Replicas    │                 │ │
│  │  │             │    │             │                 │ │
│  │  └─────────────┘    └─────────────┘                 │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Caching Layer                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐                 │ │
│  │  │    Redis    │    │   CDN for   │                 │ │
│  │  │   Cluster   │    │ Static Assets│                 │ │
│  │  └─────────────┘    └─────────────┘                 │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────────────────────────────────┐
│         Development Setup               │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (Local)                       │
│  ├── Expo Development Server           │
│  ├── Hot Reload                        │
│  ├── Web Browser/Simulator             │
│  └── Port: 8081 (default)              │
│                                         │
│  Backend (Local)                        │
│  ├── Django Development Server         │
│  ├── SQLite/PostgreSQL                 │
│  ├── Debug Mode                        │
│  └── Port: 8000                        │
│                                         │
│  External Services                      │
│  ├── Gemini API (Google)               │
│  └── Development Webhooks              │
│                                         │
└─────────────────────────────────────────┘
```

### Production Environment
```
┌─────────────────────────────────────────────────────────────┐
│                Production Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CDN Layer (CloudFront/Cloudflare)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Static Assets & Mobile App Distribution               │ │
│  │  ├── App Store (iOS)                                   │ │
│  │  ├── Google Play (Android)                             │ │
│  │  └── Web App (Static Hosting)                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Application Layer                                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Load Balancer                                          │ │
│  │  ├── SSL Termination                                    │ │
│  │  ├── Health Checks                                      │ │
│  │  └── Request Routing                                    │ │
│  │                                                         │ │
│  │  Application Servers (Auto Scaling)                    │ │
│  │  ├── Django + Gunicorn                                 │ │
│  │  ├── Environment Variables                             │ │
│  │  ├── Logging & Monitoring                              │ │
│  │  └── Health Endpoints                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Data Layer                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Primary Database (PostgreSQL)                         │ │
│  │  ├── Master-Slave Replication                          │ │
│  │  ├── Automated Backups                                 │ │
│  │  ├── Point-in-Time Recovery                            │ │
│  │  └── Connection Pooling                                │ │
│  │                                                         │ │
│  │  Caching Layer (Redis)                                 │ │
│  │  ├── Session Management                                │ │
│  │  ├── API Response Caching                              │ │
│  │  └── Rate Limiting                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  External Services                                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ├── Google Gemini API                                 │ │
│  │  ├── Email Service (SendGrid/SES)                      │ │
│  │  ├── Analytics (Google Analytics)                      │ │
│  │  └── Error Tracking (Sentry)                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Container Deployment (Docker)
```
┌─────────────────────────────────────────────────────────────┐
│                Docker Architecture                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Docker Compose Services                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │   Frontend   │  │   Backend    │  │   Database    │  │ │
│  │  │   (Nginx)    │  │   (Django)   │  │ (PostgreSQL)  │  │ │
│  │  │              │  │              │  │               │  │ │
│  │  │ - Serve Web  │  │ - API Server │  │ - Data Store  │  │ │
│  │  │ - Port: 80   │  │ - Port: 8000 │  │ - Port: 5432  │  │ │
│  │  └──────────────┘  └──────────────┘  └───────────────┘  │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐                    │ │
│  │  │    Redis     │  │   Workers    │                    │ │
│  │  │   (Cache)    │  │  (Celery)    │                    │ │
│  │  │              │  │              │                    │ │
│  │  │ - Sessions   │  │ - Background │                    │ │
│  │  │ - Port: 6379 │  │   Tasks      │                    │ │
│  │  └──────────────┘  └──────────────┘                    │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Monitoring & Analytics

### Application Monitoring
```
┌─────────────────────────────────────────────────────────────┐
│                 Monitoring Stack                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend Monitoring                                        │
│  ├── React Native Performance Monitoring                   │
│  ├── Crash Reporting (Bugsnag/Sentry)                      │
│  ├── User Analytics (Google Analytics)                     │
│  ├── App Store Analytics                                   │
│  └── Performance Metrics                                   │
│                                                             │
│  Backend Monitoring                                         │
│  ├── Application Performance Monitoring (APM)              │
│  ├── Error Tracking & Alerting                             │
│  ├── Database Performance Monitoring                       │
│  ├── API Response Time Monitoring                          │
│  └── Resource Usage Monitoring                             │
│                                                             │
│  Infrastructure Monitoring                                  │
│  ├── Server Health Monitoring                              │
│  ├── Database Connection Monitoring                        │
│  ├── Load Balancer Health Checks                           │
│  ├── SSL Certificate Monitoring                            │
│  └── Security Monitoring                                   │
│                                                             │
│  Business Metrics                                           │
│  ├── User Engagement Analytics                             │
│  ├── Quiz Completion Rates                                 │
│  ├── AI Quiz Generation Usage                              │
│  ├── User Retention Metrics                                │
│  └── Performance Benchmarking                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Performance Indicators (KPIs)
- **User Engagement**: Daily/Monthly Active Users, Session Duration
- **Quiz Metrics**: Completion Rate, Average Score, Time per Quiz
- **Technical Performance**: API Response Time, Error Rates, Uptime
- **AI Integration**: Generation Success Rate, Processing Time
- **Platform Distribution**: Web vs Mobile Usage, Platform Performance

### Logging Strategy
```python
# Structured Logging Format
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO",
    "service": "quiz-api",
    "module": "quiz.views",
    "user_id": 123,
    "request_id": "req_abc123",
    "message": "Quiz submitted successfully",
    "metadata": {
        "quiz_id": 456,
        "score": 8,
        "total_points": 10,
        "time_taken": 120
    }
}
```

## 🔄 System Integration Points

### External Service Integrations
1. **Google Gemini API**: AI quiz generation
2. **Authentication Providers**: JWT-based auth
3. **Analytics Services**: Google Analytics, Custom Events
4. **Error Tracking**: Sentry for error monitoring
5. **Email Services**: Password reset, notifications

### API Integration Pattern
```typescript
// Service Layer Pattern for External APIs
class ExternalServiceClient {
    private baseURL: string;
    private apiKey: string;
    private retryConfig: RetryConfig;

    async callExternalAPI(endpoint: string, data: any): Promise<ApiResponse> {
        // Retry logic
        // Error handling
        // Response transformation
        // Logging
    }
}
```

## 📈 Future Scalability Considerations

### Horizontal Scaling Plans
1. **Microservices Architecture**: Break down monolithic backend
2. **Database Sharding**: Distribute data across multiple databases
3. **CDN Implementation**: Global content delivery network
4. **Caching Strategy**: Multi-layer caching implementation
5. **Message Queues**: Async processing for heavy operations

### Feature Expansion Architecture
1. **Plugin System**: Extensible quiz types and formats
2. **Multi-language Support**: Internationalization framework
3. **Real-time Features**: WebSocket integration for live quizzes
4. **Advanced Analytics**: ML-powered insights and recommendations
5. **Social Features**: Team quizzes, challenges, and competitions

This system design provides a comprehensive foundation for the CuriousMind application while maintaining flexibility for future enhancements and scalability requirements.