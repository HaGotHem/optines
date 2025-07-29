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
echo 🔍 Vérification des releases automatiques...
echo.
echo Voulez-vous vérifier et créer une release automatique ?
echo [1] Oui - Vérifier et créer une release si nécessaire
echo [2] Non - Démarrer directement l'application
echo [3] Vérifier seulement (sans créer de release)
echo [4] Démarrer la surveillance automatique
echo [5] Gestion de l'automatisation
echo.
set /p choice="Votre choix (1/2/3/4/5): "

if "%choice%"=="1" (
    echo.
    echo 🔄 Vérification des modifications...
    call npm run check-modifications
    echo.
    echo Créer une release automatique maintenant ?
    set /p auto_release="Oui/Non (o/n): "
    if /i "%auto_release%"=="o" (
        echo.
        echo 🚀 Création de la release automatique...
        call npm run auto-release
        echo.
        echo ✅ Release terminée !
        timeout /t 3 /nobreak >nul
    )
) else if "%choice%"=="3" (
    echo.
    echo 🔍 Vérification des modifications...
    call npm run check-modifications
    echo.
    echo Appuyez sur une touche pour continuer...
    pause >nul
) else if "%choice%"=="4" (
    echo.
    echo 🤖 Démarrage de la surveillance automatique...
    echo 💡 Le système surveillera automatiquement les modifications
    echo    et créera des releases quand le seuil sera atteint.
    echo.
    call auto-release.bat
) else if "%choice%"=="5" (
    echo.
    echo 🔧 Gestion de l'automatisation...
    call auto-release.bat
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