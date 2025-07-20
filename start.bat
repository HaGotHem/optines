@echo off
title Optines - Démarrage
echo.
echo ========================================
echo    🚀 OPTINES - Démarrage automatique
echo ========================================
echo.

echo 📦 Vérification des dépendances...
if not exist "node_modules" (
    echo ⏳ Installation des dépendances npm...
    call npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)

echo.
echo 🔍 Vérification de l'API...
timeout /t 2 /nobreak >nul
call npm run check-health 2>nul
if errorlevel 1 (
    echo ⚠️  API non disponible, démarrage en cours...
)

echo.
echo ✅ Démarrage de l'application...
echo.
echo 💡 L'application va s'ouvrir :
echo    - API Backend : http://localhost:3001
echo    - Expo Dev     : http://localhost:19000
echo    - Expo Web     : http://localhost:19006
echo.
echo 🔄 Appuyez sur Ctrl+C pour arrêter
echo.

call npm start

echo.
echo 🛑 Application fermée
pause 