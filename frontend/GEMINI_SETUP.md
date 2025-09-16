# 🔐 Secure Gemini API Key Setup Guide

This guide shows you how to safely configure your Gemini API key for AI quiz generation.

## 🚨 Security First
**NEVER** commit API keys to version control. This setup uses environment variables to keep your keys secure.

## 📋 Step-by-Step Setup

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables
1. Open the `.env` file in the `frontend` folder:
   ```
   frontend/.env
   ```

2. Replace `your-gemini-api-key-here` with your actual API key:
   ```env
   # Environment Variables for CuriousMind App
   # DO NOT COMMIT THIS FILE TO VERSION CONTROL

   # Gemini AI API Key
   # Get your API key from: https://makersuite.google.com/app/apikey
   EXPO_PUBLIC_GEMINI_API_KEY=your-actual-api-key-here

   # Backend API Configuration
   EXPO_PUBLIC_API_BASE_URL=http://192.168.0.100:8000
   ```

### 3. Restart Your Development Server
After adding the API key, restart your Expo development server:
```bash
cd frontend
npx expo start --clear
```

## ✅ Verify Setup
1. Open the app and go to the "Generate" tab
2. You should see no API key warnings in the console
3. Try generating a quiz with a topic like "Space Exploration"

## 🔧 Troubleshooting

### "API key not configured" Error
- Check that your `.env` file is in the `frontend` folder
- Ensure the variable name is exactly `EXPO_PUBLIC_GEMINI_API_KEY`
- Restart the Expo development server after changes

### "Invalid API key" Error
- Verify your API key is correct (no extra spaces/characters)
- Check that your Google AI Studio API key is active
- Ensure you have quota remaining on your Google AI account

### App Not Loading Environment Variables
- Make sure you're using `EXPO_PUBLIC_` prefix
- Restart the development server with `--clear` flag
- Check the console for environment config logs (in development mode)

## 📁 File Structure
```
frontend/
├── .env                          # Your API keys (NOT in git)
├── src/
│   ├── config/
│   │   └── environment.ts        # Environment configuration
│   └── services/
│       └── geminiService.ts      # Gemini AI service
└── GEMINI_SETUP.md              # This guide
```

## 🔒 Security Best Practices
- ✅ `.env` file is in `.gitignore`
- ✅ API keys are loaded from environment variables
- ✅ Clear error messages for missing configuration
- ✅ Development-only logging for debugging

## 🚀 Ready to Use!
Once configured, you can:
- Generate quizzes on any topic
- Choose difficulty levels (Easy, Medium, Hard)
- Select question counts (5, 10, 15, 20)
- Get AI-powered, educational content

Happy quiz generating! 🎉