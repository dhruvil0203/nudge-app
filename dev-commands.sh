#!/bin/bash
# Quick commands for development

# Start development server
start-dev() {
    npx expo start
}

# Run on iOS
run-ios() {
    npx expo start --ios
}

# Run on Android
run-android() {
    npx expo start --android
}

# Run on Web
run-web() {
    npx expo start --web
}

# Install dependencies
install() {
    npm install
}

# Clean build
clean() {
    rm -rf node_modules
    rm -rf .expo
    rm -rf dist
    npm install
}

# Build APK for Android
build-android() {
    eas build --platform android
}

# Build IPA for iOS
build-ios() {
    eas build --platform ios
}

# Export to static files
export-static() {
    npx expo export
}

echo "Available commands:"
echo "  start-dev       - Start development server"
echo "  run-ios         - Run on iOS Simulator"
echo "  run-android     - Run on Android Emulator"
echo "  run-web         - Run on Web Browser"
echo "  install         - Install dependencies"
echo "  clean           - Clean and reinstall"
echo "  build-android   - Build APK (requires EAS CLI)"
echo "  build-ios       - Build IPA (requires EAS CLI)"
echo "  export-static   - Export to static files"
