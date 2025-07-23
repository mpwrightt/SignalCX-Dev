#!/bin/bash

echo "🧪 Testing Firebase Deployment"
echo "=============================="

# Test rules compilation first
echo "📋 Testing rules compilation..."
firebase firestore:rules:check firestore.rules

if [ $? -eq 0 ]; then
    echo "✅ Rules compiled successfully"
    
    echo ""
    echo "🚀 Deploying Firestore rules..."
    firebase deploy --only firestore:rules
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo ""
        echo "🎉 Your Firebase is ready!"
        echo "📱 You can now test the live app with Google sign-in"
    else
        echo "❌ Deployment failed"
    fi
else
    echo "❌ Rules compilation failed"
fi