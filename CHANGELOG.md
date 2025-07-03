# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.2.0] - 2024-12-19

### 🚀 Nouvelles fonctionnalités
- **Calendrier interactif pour la sélection de dates** : Remplacement des listes déroulantes par un calendrier visuel et intuitif
- **Extension de la planification** : Possibilité de planifier des tâches jusqu'à 12 semaines à l'avance (au lieu de 4)
- **Navigation rapide dans le calendrier** : Boutons pour naviguer rapidement entre les semaines
- **Composant DatePickerCalendar réutilisable** : Calendrier moderne avec navigation par mois et sélection visuelle des jours
- **Catégorie "Tâches à venir"** : Nouvelle section sur la page principale avec calendrier dynamique
- **Vues multiples du calendrier** : Possibilité de basculer entre vues mois, semaine et jour

### 🔧 Améliorations
- **Gestion des employés améliorée** : 
  - Statut "occupé" pour les employés assignés à des tâches
  - Statut "libre" pour les employés disponibles
  - Prévention de l'assignation multiple d'un même employé
- **Interface utilisateur** :
  - Suppression des employés sélectionnés par défaut dans le calculateur
  - Interface plus propre et intuitive
  - Meilleure expérience utilisateur pour la sélection d'équipe
- **Navigation du calendrier** :
  - Correction de la logique de navigation entre les mois
  - Gestion correcte des limites de dates
  - Amélioration de la stabilité de la navigation

### 🐛 Corrections
- **Correction des erreurs JSX** : Fermeture correcte des balises dans le calendrier
- **Variables non définies** : Ajout des états manquants pour les sélecteurs d'heure
- **Navigation du calendrier** : Correction du problème de navigation en arrière (juillet depuis août)
- **Logique d'assignation** : Correction pour éviter les conflits d'assignation d'employés

### 🔄 Compatibilité
- **Compatibilité ascendante** : Les anciennes tâches sans liste d'employés explicite restent compatibles
- **Migration transparente** : Pas de perte de données lors de la mise à jour

### 📁 Nouveaux fichiers
- `components/DatePickerCalendar.tsx` - Composant de calendrier réutilisable
- `components/FutureTasksCalendar.tsx` - Calendrier pour les tâches à venir

### 📝 Fichiers modifiés
- `app/(manager-tabs)/calculator.tsx` - Amélioration de la gestion des employés
- `app/(manager-tabs)/calendar.tsx` - Intégration du nouveau calendrier
- `app/(tabs)/index.tsx` - Ajout de la section "Tâches à venir"
- `app/(tabs)/settings.tsx` - Améliorations de l'interface
- `services/NotificationService.ts` - Optimisations

### 🎯 Impact utilisateur
- **Gestion d'équipe plus efficace** : Assignation claire des employés (occupé/libre)
- **Planification plus flexible** : Possibilité de planifier sur 12 semaines
- **Interface plus intuitive** : Calendrier visuel au lieu de listes déroulantes
- **Expérience utilisateur améliorée** : Navigation plus fluide et logique

---

## [1.1.0] - Version précédente
- Fonctionnalités de base du calculateur d'équipe
- Gestion des tâches planifiées
- Interface de calendrier basique

---

*Ce fichier suit le format [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).* 