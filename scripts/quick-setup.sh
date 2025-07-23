#!/bin/bash

# Quick Firebase Setup Script
# This script automates as much as possible

echo "🚀 SignalCX Firebase Quick Setup"
echo "================================"

# Check if firebase-admin-key.json exists
if [ ! -f "firebase-admin-key.json" ]; then
    echo "❌ firebase-admin-key.json not found!"
    echo ""
    echo "📝 Please complete these manual steps first:"
    echo "1. Go to Firebase Console → Project Settings → Service Accounts"
    echo "2. Click 'Generate new private key'"
    echo "3. Save as 'firebase-admin-key.json' in project root"
    echo "4. Go to Firebase Console → Authentication → Sign-in method → Google → Enable"  
    echo "5. Go to Firebase Console → Firestore Database → Create database → Production mode"
    echo ""
    echo "Then run this script again!"
    exit 1
fi

echo "✅ Service account key found"

# Install firebase-admin if not already installed
if ! npm list firebase-admin &> /dev/null; then
    echo "📦 Installing firebase-admin..."
    npm install firebase-admin
fi

echo "🔧 Running automated Firebase setup..."
node scripts/firebase-setup.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📋 Manual steps remaining:"
    echo "1. Go to Firebase Console → Firestore → Rules"
    echo "2. Copy the rules from firestore.rules file"
    echo "3. Click 'Publish'"
    echo ""
    echo "🚀 Then test your app:"
    echo "1. npm run dev"
    echo "2. Go to Live mode and sign in with Google"
    echo "3. You should see Team Management in the sidebar!"
else
    echo "❌ Setup failed. Check the error messages above."
    exit 1
fi