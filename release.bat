@echo off
title Optines - Gestion des Releases
echo.
echo ========================================
echo    🚀 OPTINES - Gestion des Releases
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
echo 🔍 Vérification des modifications...
call npm run check-modifications

echo.
echo ========================================
echo    Options de Release
echo ========================================
echo.
echo [1] Créer une release automatique (si seuil atteint)
echo [2] Forcer une release (même si seuil non atteint)
echo [3] Vérifier seulement les modifications
echo [4] Voir l'historique des releases
echo [5] Quitter
echo.
set /p choice="Votre choix (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Création de la release automatique...
    call npm run auto-release
    echo.
    echo ✅ Release terminée !
    echo.
    echo 📋 Prochaines étapes :
    echo    1. Allez sur votre repository GitHub
    echo    2. Créez une nouvelle release avec le tag généré
    echo    3. Copiez le contenu du changelog affiché
    echo.
) else if "%choice%"=="2" (
    echo.
    echo ⚠️  ATTENTION : Vous allez forcer une release
    echo    même si le seuil de modifications n'est pas atteint.
    echo.
    set /p confirm="Êtes-vous sûr ? (oui/non): "
    if /i "%confirm%"=="oui" goto do_force_release
    if /i "%confirm%"=="o" goto do_force_release
    if /i "%confirm%"=="y" goto do_force_release
    if /i "%confirm%"=="yes" goto do_force_release
    if /i "%confirm%"=="1" goto do_force_release
    echo ❌ Release annulée
    goto end
) else if "%choice%"=="3" (
    echo.
    echo 🔍 Vérification détaillée des modifications...
    call npm run check-modifications
    echo.
    echo 📊 Informations supplémentaires :
    echo    - Seuil actuel : 20 modifications
    echo    - Version actuelle : voir package.json
    echo    - Branche : master
    echo.
) else if "%choice%"=="4" (
    echo.
    echo 📋 Historique des releases :
    if exist "CHANGELOG.md" (
        type "CHANGELOG.md"
    ) else (
        echo ❌ Aucun historique de release trouvé
    )
    echo.
) else if "%choice%"=="5" (
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

:do_force_release
echo.
echo 🚀 Création de la release forcée...
call npm run force-release
echo.
echo ✅ Release forcée terminée !
echo.
echo 📋 Prochaines étapes :
echo    1. Allez sur votre repository GitHub
echo    2. Créez une nouvelle release avec le tag généré
echo    3. Copiez le contenu du changelog affiché
echo.
goto end

:end 