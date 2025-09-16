# CuriousMind Frontend

A cross-platform React Native quiz application built with Expo, supporting web, iOS, and Android platforms.

## 📱 Architecture Overview

### Technology Stack
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v6 (Stack & Bottom Tabs)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: Custom React Native components with Expo Vector Icons
- **Styling**: StyleSheet API with theme support
- **AI Integration**: Google Generative AI (Gemini)
- **Storage**: AsyncStorage for persistent settings

### Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state management
│   │   ├── ThemeContext.tsx   # Light/Dark theme management
│   │   └── FontContext.tsx    # Font family management
│   ├── screens/            # Main application screens
│   │   ├── auth/              # Authentication screens
│   │   ├── quiz/              # Quiz-related screens
│   │   └── profile/           # User profile screens
│   └── services/           # API and external service integrations
│       ├── api.ts             # Backend API client
│       ├── geminiService.ts   # AI quiz generation
│       └── leaderboardService.ts
├── App.tsx                 # Root application component
├── index.js               # Application entry point
└── package.json           # Dependencies and scripts
```

### Screen Architecture

#### Authentication Flow
- **IntroScreen**: Welcome screen with app introduction
- **LoginScreen**: User authentication
- **SignupScreen**: New user registration

#### Main Application Flow
- **CategoryScreen**: Browse quiz categories
- **QuizGenerateScreen**: AI-powered quiz generation
- **QuizConfigScreen**: Configure quiz parameters
- **QuizScreen**: Interactive quiz interface
- **ResultScreen**: Quiz results and performance
- **ProfileScreen**: User statistics and history
- **LeaderboardScreen**: Global and quiz-specific rankings

### Context Architecture

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
}
```

#### ThemeContext
```typescript
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ColorScheme;
}
```

#### FontContext
```typescript
interface FontContextType {
  currentFont: FontFamily;
  setFont: (font: FontFamily) => void;
  getFontStyle: () => { fontFamily?: string };
}
```

### Navigation Architecture

#### Stack Navigation
- Root navigator managing authentication flow
- Main app navigation with modal screens
- Platform-specific header styling

#### Tab Navigation
- Bottom tabs for primary navigation (mobile)
- Side navigation for landscape mode
- Conditional rendering based on screen orientation

### State Management Patterns

#### Context + useReducer Pattern
- Centralized state management for auth, theme, and fonts
- Persistent storage integration with AsyncStorage
- Type-safe state updates with TypeScript

#### Local Component State
- Screen-specific state with useState/useEffect
- Form handling and UI interactions
- API loading states and error handling

### API Integration Architecture

#### HTTP Client Configuration
```typescript
// Axios instance with interceptors
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

// Request/Response interceptors for auth and error handling
api.interceptors.request.use(authInterceptor);
api.interceptors.response.use(successHandler, errorHandler);
```

#### Service Layer Pattern
- Abstracted API calls in service modules
- Consistent error handling across the app
- Type-safe request/response interfaces

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- For mobile development: Android Studio/Xcode

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CuriousMind/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **🔐 Security Notes**:
   - Replace `localhost` with your backend server IP for network testing
   - Obtain your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Never commit `.env` files to version control
   - Use different API keys for development and production

4. **Start the development server**
   ```bash
   # Start Expo development server
   npm start

   # Platform-specific commands
   npm run web      # Web development
   npm run android  # Android emulator
   npm run ios      # iOS simulator
   ```

## 📋 Available Scripts

- `npm start`: Start Expo development server
- `npm run web`: Launch web version
- `npm run android`: Run on Android device/emulator
- `npm run ios`: Run on iOS simulator
- `npm run build:web`: Build for web production

## 🏗️ Key Features

### Cross-Platform Support
- **Web**: Full-featured web application with responsive design
- **iOS**: Native iOS app with platform-specific optimizations
- **Android**: Native Android app with Material Design elements

### Quiz System
- **Traditional Quizzes**: Pre-loaded questions from various categories
- **AI-Generated Quizzes**: Dynamic quiz creation using Gemini AI
- **Difficulty Levels**: Easy, Medium, Hard with adaptive scoring
- **Real-time Timer**: Accurate completion time tracking
- **Progress Tracking**: Visual progress indicators and statistics

### User Experience
- **Theme System**: Light/Dark mode with persistent preferences
- **Font Customization**: Multiple font family options
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Accessibility**: Screen reader support and proper contrast ratios
- **Offline Capability**: Basic functionality without network connection

### Performance Features
- **Lazy Loading**: Optimized component loading
- **Image Optimization**: Efficient asset management
- **Memory Management**: Proper cleanup and garbage collection
- **Bundle Splitting**: Reduced initial load times

## 🔧 Configuration

### Theme Customization
```typescript
// Custom theme configuration
const customTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#3B82F6',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    // ... other color definitions
  }
};
```

### Font Configuration
```typescript
// Available font families
type FontFamily = 'roboto' | 'opensans' | 'lato' | 'montserrat' | 'nunito';
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS build errors**
   ```bash
   cd ios && pod install
   ```

3. **Android build issues**
   - Ensure Android SDK is properly configured
   - Check Java version compatibility

4. **Web build issues**
   - Clear browser cache
   - Check for conflicting CSS

### Performance Optimization

- Enable Hermes JavaScript engine for production
- Implement lazy loading for heavy screens
- Use FlatList for large data sets
- Optimize image sizes and formats

## 🚀 Deployment

### Web Deployment
```bash
npx expo build:web
# Deploy build folder to your hosting service
```

### Mobile App Deployment
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.