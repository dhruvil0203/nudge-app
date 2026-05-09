@echo off
REM Setup script for LinkStash development environment (Windows)

echo 🚀 Setting up LinkStash...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

echo ✅ Setup complete!
echo.
echo To start the development server, run:
echo   npx expo start
echo.
echo Then:
echo   - Press 'i' for iOS Simulator
echo   - Press 'a' for Android Emulator
echo   - Press 'w' for Web Browser
