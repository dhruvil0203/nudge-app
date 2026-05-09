#!/bin/bash
# Setup script for LinkStash development environment

echo "🚀 Setting up LinkStash..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if expo-cli is installed
if ! command -v expo &> /dev/null; then
    echo "⚠️  Expo CLI is not installed globally. Installing..."
    npm install -g expo-cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npx expo start"
echo ""
echo "Then:"
echo "  - Press 'i' for iOS Simulator"
echo "  - Press 'a' for Android Emulator"
echo "  - Press 'w' for Web Browser"
