# Changelog

## [1.0.4] - 2025-07-20

### 📊 Résumé des modifications
- **Total des modifications:** 0

### 🔄 Derniers commits
- `c3d1383` 🚀 Release v1.0.3 - Mise à jour automatique
- `30fe01d` 🚀 Release v1.0.2 - Mise à jour automatique
- `28906db` 🚀 Release v1.0.1 - Mise à jour automatique
- `9f2d20d` Correction du système de libération automatique des employés
- `0394eba` debug: Amélioration du chargement des employés et tâches dans le calculateur
- `e13ee00` fix: Correction des tâches planifiées - passage complet à Supabase
- `f9a2d53` feat: Ajout système de sélection d'employés et corrections diverses


## [1.0.3] - 2025-07-20

### 📊 Résumé des modifications
- **Total des modifications:** 2
- **Fichiers modifiés:** 2

### 🔄 Derniers commits
- `30fe01d` 🚀 Release v1.0.2 - Mise à jour automatique
- `28906db` 🚀 Release v1.0.1 - Mise à jour automatique
- `9f2d20d` Correction du système de libération automatique des employés
- `0394eba` debug: Amélioration du chargement des employés et tâches dans le calculateur
- `e13ee00` fix: Correction des tâches planifiées - passage complet à Supabase
- `f9a2d53` feat: Ajout système de sélection d'employés et corrections diverses


## [1.0.2] - 2025-07-20

### 📊 Résumé des modifications
- **Total des modifications:** 7
- **Fichiers modifiés:** 6

### 🔄 Derniers commits
- `28906db` 🚀 Release v1.0.1 - Mise à jour automatique
- `9f2d20d` Correction du système de libération automatique des employés
- `0394eba` debug: Amélioration du chargement des employés et tâches dans le calculateur
- `e13ee00` fix: Correction des tâches planifiées - passage complet à Supabase
- `f9a2d53` feat: Ajout système de sélection d'employés et corrections diverses


## [1.0.1] - 2025-07-20

### 📊 Résumé des modifications
- **Total des modifications:** 131
- **Fichiers modifiés:** 38
- **Fichiers supprimés:** 51

### 🔄 Derniers commits
- `9f2d20d` Correction du système de libération automatique des employés
- `0394eba` debug: Amélioration du chargement des employés et tâches dans le calculateur
- `e13ee00` fix: Correction des tâches planifiées - passage complet à Supabase
- `f9a2d53` feat: Ajout système de sélection d'employés et corrections diverses


Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.0] - 2024-12-19

### 🚀 Initial Release
- **Système de release automatique** mis en place
- **Seuil de 20 modifications** avant création automatique d'une release
- **Scripts npm** ajoutés pour faciliter la gestion des releases
- **Changelog automatique** avec détails des modifications
- **Tags GitHub** créés automatiquement

### 📦 Scripts disponibles
- `npm run check-modifications` - Vérifier le nombre de modifications
- `npm run auto-release` - Créer une release automatique
- `npm run release` - Alias pour auto-release

### 🔧 Configuration
- Seuil de modifications : 20 fichiers
- Versioning : Semantic Versioning (MAJOR.MINOR.PATCH)
- Branche cible : main
- Changelog automatique avec emojis et catégorisation

## [1.0.1] - 2024-12-19

### 🚀 Amélioration du système de release
- **Scripts batch Windows** ajoutés pour une meilleure expérience utilisateur
- **start.bat amélioré** avec option de vérification de release au démarrage
- **release.bat** créé pour la gestion complète des releases
- **Interface utilisateur intuitive** avec menus interactifs
- **Gestion d'erreurs améliorée** dans les scripts batch

### 📦 Nouveaux scripts batch
- `start.bat` - Démarrage avec option de release automatique
- `release.bat` - Gestion complète des releases (vérifier, créer, forcer)

### 🔧 Fonctionnalités ajoutées
- Vérification automatique des dépendances
- Options multiples (vérifier seulement, créer automatique, forcer)
- Affichage de l'historique des releases
- Instructions détaillées pour les releases GitHub

## [1.0.2] - 2024-12-19

### 🐛 Correction du système de release
- **Release forcée** maintenant fonctionnelle dans release.bat
- **Script force-release** ajouté pour forcer une release
- **Paramètre --force** ajouté au script auto-release.js
- **Commit et push** fonctionnels même si seuil non atteint
- **Version incrémentée** automatiquement lors des releases forcées

### 📦 Nouveaux scripts
- `npm run force-release` - Force une release même si seuil non atteint
- Support du paramètre `--force` dans auto-release.js

### 🔧 Corrections techniques
- Fonction `createRelease()` ajoutée avec paramètre force
- Gestion des arguments de ligne de commande
- Retour de statut pour indiquer le succès/échec 