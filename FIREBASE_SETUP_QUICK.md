# Firebase Setup Guide

## Quick Fix for API Key Error

The error `auth/api-key-not-valid` means you need to set up your Firebase project and update your environment variables.

## Step-by-Step Setup

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Project name: `ecom-warehouse`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Click **Email/Password**
5. Enable **Email/Password**
6. Click **Save**

### 3. Create Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode**
4. Select your preferred location
5. Click **Done**

### 4. Get Web App Configuration
1. In Project Settings (gear icon), go to **General** tab
2. Scroll to **Your apps** section
3. Click the **Web** icon (`</>`)
4. App nickname: `ecom-warehouse-frontend`
5. Click **Register app**
6. **COPY THE CONFIG OBJECT** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC_your_actual_api_key_here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

### 5. Update Your .env.local File

Replace the values in `frontend/.env.local` with your actual Firebase config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC_your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

### 6. Restart Development Server

After updating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 7. Test Registration

1. Go to http://localhost:3001/register
2. Fill out the registration form
3. Submit - should work without API key error
4. Check Firebase Console > Authentication > Users to see registered user
5. Check Firestore Database > users collection for user data

## Troubleshooting

### If you still get API key errors:
1. **Double-check** that you copied the EXACT API key from Firebase Console
2. **Restart** the development server after changing .env.local
3. **Clear browser cache** and try again
4. **Check** that your Firebase project has Authentication enabled

### If Firestore errors occur:
1. Make sure Firestore is created and in "test mode"
2. Check that the project ID matches in your config

### If authentication doesn't work:
1. Verify Email/Password provider is enabled in Firebase Console
2. Check browser console for detailed error messages

## Security Note

- **Never commit** your actual Firebase keys to GitHub
- The `.env.local` file is already in `.gitignore`
- For production, use environment variables in your hosting platform

## What Happens After Setup

Once configured correctly:
1. ✅ Registration will save users to Firebase Auth
2. ✅ User data will be stored in Firestore database
3. ✅ Login/logout will work properly
4. ✅ Dashboard will show user information from database
5. ✅ Users page will display all registered users

## Current File Status

Your `.env.local` file now has placeholder values that look more realistic, but you still need to replace them with your actual Firebase project credentials.
