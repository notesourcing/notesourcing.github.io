#!/bin/bash

echo "Setting up Firebase deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "Please follow these steps to deploy your Firebase rules:"
echo ""
echo "1. Login to Firebase:"
echo "   firebase login"
echo ""
echo "2. Initialize Firebase in this project:"
echo "   firebase init firestore"
echo "   - Select your existing project: notesourcinggithub"
echo "   - Use the existing FIREBASE_RULES.txt as your rules file"
echo ""
echo "3. Deploy the rules:"
echo "   firebase deploy --only firestore:rules"
echo ""
echo "The rules file is already prepared in FIREBASE_RULES.txt"
