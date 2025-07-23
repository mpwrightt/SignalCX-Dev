# Firebase Setup Guide

This comprehensive guide will walk you through setting up Firebase for your SignalCX project from scratch. Firebase provides authentication, database, hosting, and serverless functions for your application.

## Prerequisites

Before you begin, ensure you have:

- **Google Account** - Required for Firebase Console access
- **Node.js & npm** - Already installed for local development
- **Firebase CLI** - We'll install this during setup
- **Project Running Locally** - Complete the [Local Development Guide](./LOCAL_DEVELOPMENT.md) first

## Overview

SignalCX uses Firebase for:
- **Authentication** - Google Sign-In for users
- **Firestore Database** - User data, organizations, audit logs
- **Cloud Functions** - Server-side AI processing
- **Hosting** - Deploy your application to the web
- **Security Rules** - Role-based access control

---

## Step 1: Create Firebase Project

### 1.1 Access Firebase Console

1. Open your web browser and go to [Firebase Console](https://console.firebase.google.com)
2. Sign in with your Google account
3. You should see a page with "Add project" button

### 1.2 Create New Project

1. Click **"Add project"**
2. **Project name**: Enter `zendesk-analyzer-prod` (or your preferred name)
   - Note: This must match the `projectId` in your `.firebaserc` file
3. **Project ID**: Firebase will auto-generate or you can customize it
   - Make note of this ID - you'll need it later
4. Click **"Continue"**

### 1.3 Configure Google Analytics (Optional)

1. **Enable Google Analytics**: Toggle ON (recommended for production)
2. **Analytics account**: Choose "Default Account for Firebase" or create new
3. Click **"Create project"**
4. Wait for Firebase to set up your project (this takes 1-2 minutes)
5. Click **"Continue"** when setup completes

---

## Step 2: Configure Firebase Services

### 2.1 Enable Authentication

1. In Firebase Console, click **"Authentication"** from the left sidebar
2. Click **"Get started"** button
3. Go to **"Sign-in method"** tab
4. Click on **"Google"** provider
5. Toggle **"Enable"** to ON
6. **Support email**: Select your email from dropdown
7. Click **"Save"**

### 2.2 Set Up Firestore Database

1. Click **"Firestore Database"** from the left sidebar
2. Click **"Create database"**
3. **Security rules**: Select **"Start in production mode"**
   - Don't worry - we'll deploy custom rules later
4. **Location**: Choose a region close to your users (e.g., `us-central1`)
5. Click **"Done"**
6. Wait for database creation to complete

### 2.3 Enable Cloud Functions

1. Click **"Functions"** from the left sidebar
2. Click **"Get started"**
3. Click **"Continue"** to upgrade to Blaze plan
   - Firebase Functions requires pay-as-you-go billing
   - Free tier includes 2M function invocations per month
4. Set up billing if prompted

### 2.4 Enable Hosting

1. Click **"Hosting"** from the left sidebar
2. Click **"Get started"**
3. You'll see setup instructions - we'll handle deployment later
4. Click **"Continue"** through the setup wizard

---

## Step 3: Get Firebase Configuration

### 3.1 Add Web App

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click **"Add app"** and select the **web icon** `</>`
5. **App nickname**: Enter `SignalCX Web App`
6. **Firebase Hosting**: Check this box
7. Click **"Register app"**

### 3.2 Copy Configuration

1. Firebase will show you a configuration object that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
2. **Copy these values** - you'll need them for environment variables
3. Click **"Continue to console"**

---

## Step 4: Configure Environment Variables

### 4.1 Create Firebase Environment File

1. In your project root, create or edit your `.env` file
2. Add the Firebase configuration values from Step 3.2:

```bash
# Existing variables (keep these)
GOOGLE_API_KEY=your-google-ai-key-here
GOOGLE_SEARCH_API_KEY=your-search-key-here  
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Firebase Configuration (add these)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4.2 Verify Configuration

1. Save your `.env` file
2. Restart your development servers:
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2  
   npm run genkit:dev
   ```
3. Check for any environment variable errors in the console

---

## Step 5: Install and Configure Firebase CLI

### 5.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 5.2 Login to Firebase

```bash
firebase login
```

This will:
1. Open your browser for Google authentication
2. Sign in with the same Google account used for Firebase Console
3. Grant Firebase CLI access to your projects

### 5.3 Verify Project Configuration

```bash
firebase projects:list
```

You should see your project listed. If not, check your project ID.

### 5.4 Set Active Project

```bash
firebase use your-project-id
```

Replace `your-project-id` with your actual Firebase project ID.

---

## Step 6: Deploy Firebase Configuration

### 6.1 Deploy Firestore Security Rules

Your project includes comprehensive security rules. Deploy them:

```bash
firebase deploy --only firestore:rules
```

**Expected output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
```

### 6.2 Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### 6.3 Deploy Cloud Functions (Optional)

If you're using the functions directory:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## Step 7: Configure Authentication Domains

### 7.1 Add Development Domain

1. In Firebase Console, go to **"Authentication"** > **"Settings"** tab
2. Scroll to **"Authorized domains"**
3. Add these domains:
   - `localhost` (for local development)
   - `127.0.0.1` (alternative localhost)
   - Your production domain (when ready)

### 7.2 Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **"APIs & Services"** > **"OAuth consent screen"**
4. **User Type**: Select "External" for public apps
5. Fill in required fields:
   - **App name**: SignalCX
   - **User support email**: Your email
   - **Developer contact information**: Your email
6. Click **"Save and Continue"**
7. **Scopes**: Click "Save and Continue" (default scopes are fine)
8. **Test users**: Add your email for testing
9. Click **"Save and Continue"**

---

## Step 8: Initialize Firestore Data Structure

### 8.1 Required Collections

Your app expects these Firestore collections:

- **`users`** - User profiles with roles and organizations
- **`organizations`** - Company/tenant data
- **`invitations`** - User invitation system  
- **`audit_logs`** - Activity logging (append-only)
- **`settings`** - Application configuration
- **`tickets`** - Zendesk ticket data
- **`analytics`** - Analysis results

### 8.2 Create Initial Organization

1. In Firebase Console, go to **"Firestore Database"**
2. Click **"Start collection"**
3. **Collection ID**: `organizations`
4. **Document ID**: Click "Auto-ID"
5. Add fields:
   ```
   name: "Default Organization"
   domain: "example.com"  
   isActive: true
   createdAt: [current timestamp]
   settings: {
     maxUsers: 100,
     features: ["analytics", "coaching", "social_intelligence"]
   }
   ```
6. Click **"Save"**
7. **Copy the generated document ID** - you'll need it for creating users

### 8.3 Create Initial User

1. **Collection ID**: `users`
2. **Document ID**: Your Google account UID (you'll get this after first login)
3. For now, you can create a placeholder and update it after first login

---

## Step 9: Test Firebase Integration

### 9.1 Test Authentication

1. Ensure both development servers are running
2. Open your app at `http://localhost:9002`
3. Try signing in with Google
4. Check Firebase Console > Authentication > Users to see your account

### 9.2 Test Firestore Connection

1. In your app, perform any action that should write to Firestore
2. Check Firebase Console > Firestore Database to see if data appears
3. Check browser console for any Firebase errors

### 9.3 Monitor Usage

1. Firebase Console > **"Usage"** tab shows:
   - Authentication usage
   - Firestore reads/writes
   - Function invocations
   - Hosting bandwidth

---

## Step 10: Deploy to Production (Optional)

### 10.1 Build Production App

```bash
npm run build
```

### 10.2 Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### 10.3 Deploy Everything

```bash
firebase deploy
```

This deploys:
- Hosting
- Firestore rules and indexes  
- Cloud Functions
- Any other configured services

---

## Troubleshooting

### Common Issues

**Authentication not working:**
- Check that your domain is in authorized domains
- Verify environment variables are correct
- Ensure OAuth consent screen is configured

**Firestore permission errors:**
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check that user has proper role in Firestore

**Functions deployment fails:**
- Check Node.js version compatibility
- Ensure billing is enabled for Cloud Functions
- Verify functions have proper permissions

**Environment variables not loading:**
- Restart development servers after changing `.env`
- Check for typos in variable names
- Ensure `.env` is in project root directory

### Useful Commands

```bash
# Check Firebase project status
firebase projects:list

# View Firestore security rules
firebase firestore:rules get

# View current deployment status  
firebase deploy --dry-run

# Check Firebase CLI version
firebase --version

# Debug authentication issues
firebase auth:export users.json --project your-project-id
```

### Getting Help

- **Firebase Documentation**: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **Firebase Support**: [https://firebase.google.com/support](https://firebase.google.com/support)  
- **Stack Overflow**: Use tags `firebase`, `firestore`, `firebase-authentication`

---

## Next Steps

After completing Firebase setup:

1. **Review Security Rules**: Understand the role-based access control in `firestore.rules`
2. **Set Up Monitoring**: Configure alerts for usage and errors
3. **Backup Strategy**: Set up Firestore exports for data backup
4. **Performance**: Monitor and optimize Firestore queries
5. **Scaling**: Plan for user growth and billing implications

Your Firebase setup is now complete! You can now use authentication, store data securely, and deploy your application to production.