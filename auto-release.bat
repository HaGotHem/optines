@echo off
title Optines - Automatisation des Releases
echo.
echo ========================================
echo    🤖 OPTINES - Automatisation Releases
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
echo 🔍 Vérification du statut actuel...
call npm run auto-watcher-status

echo.
echo ========================================
echo    Options d'Automatisation
echo ========================================
echo.
echo [1] Démarrer la surveillance automatique (interactif)
echo [2] Démarrer le daemon en arrière-plan
echo [3] Arrêter le daemon
echo [4] Vérification unique
echo [5] Afficher les logs
echo [6] Afficher le statut
echo [7] Quitter
echo.
set /p choice="Votre choix (1-7): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Démarrage de la surveillance automatique...
    echo 💡 Appuyez sur Ctrl+C pour arrêter
    echo.
    call npm run auto-watcher
) else if "%choice%"=="2" (
    echo.
    echo 👻 Démarrage du daemon en arrière-plan...
    call npm run auto-watcher-start
    echo.
    echo ✅ Daemon démarré ! Il surveillera automatiquement les modifications.
    echo 📝 Vérifiez les logs avec l'option 5
    echo.
) else if "%choice%"=="3" (
    echo.
    echo 🛑 Arrêt du daemon...
    call npm run auto-watcher-stop
    echo.
) else if "%choice%"=="4" (
    echo.
    echo 🔍 Vérification unique...
    call npm run auto-watcher-check
    echo.
) else if "%choice%"=="5" (
    echo.
    echo 📝 Affichage des logs...
    call npm run auto-watcher-logs
    echo.
) else if "%choice%"=="6" (
    echo.
    echo 📊 Affichage du statut...
    call npm run auto-watcher-status
    echo.
) else if "%choice%"=="7" (
    echo.
    echo 👋 Au revoir !
    exit /b 0
) else (
    echo.
    echo ❌ Choix invalide
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul 