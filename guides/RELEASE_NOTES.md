# Notes de Release - Version 1.2.0

## 🎉 Nouvelle version disponible !

Cette version apporte des améliorations majeures à la gestion des employés et à l'expérience utilisateur du calendrier.

## 🚀 Principales nouveautés

### Calendrier interactif
- **Sélection de dates visuelle** : Plus besoin de listes déroulantes, utilisez un calendrier moderne
- **Navigation intuitive** : Parcourez les mois et semaines facilement
- **Planification étendue** : Planifiez jusqu'à 12 semaines à l'avance

### Gestion des employés améliorée
- **Statuts clairs** : Employés "occupés" vs "libres"
- **Prévention des conflits** : Un employé ne peut plus être assigné à plusieurs tâches
- **Interface propre** : Aucun employé pré-sélectionné par défaut

## 📋 Instructions d'installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Expo CLI

### Étapes d'installation

1. **Cloner le repository** (si pas déjà fait)
```bash
git clone [URL_DU_REPO]
cd optines-main
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Démarrer l'application**
```bash
npx expo start
```

4. **Tester sur votre appareil**
- Scannez le QR code avec l'app Expo Go
- Ou utilisez un émulateur

## 🔧 Configuration

### Variables d'environnement
Aucune variable d'environnement supplémentaire n'est requise pour cette version.

### Permissions
L'application nécessite les permissions suivantes :
- Accès au calendrier (pour les notifications)
- Stockage local (pour sauvegarder les données)

## 🐛 Corrections importantes

- **Navigation du calendrier** : Correction du problème de navigation en arrière
- **Assignation d'employés** : Prévention des conflits d'assignation
- **Interface utilisateur** : Correction des erreurs JSX et variables manquantes

## 🔄 Migration depuis la version précédente

### Données existantes
- ✅ **Compatibilité totale** : Toutes vos tâches existantes sont préservées
- ✅ **Migration automatique** : Aucune action requise de votre part
- ✅ **Anciennes tâches** : Restent compatibles même sans liste d'employés explicite

### Nouveaux comportements
- Les employés assignés à des tâches apparaissent maintenant comme "occupés"
- Le calculateur ne pré-sélectionne plus d'employés par défaut
- La planification s'étend maintenant à 12 semaines

## 📱 Compatibilité

- **iOS** : 13.0+
- **Android** : 8.0+
- **Expo** : SDK 49+

## 🆘 Support

En cas de problème :
1. Vérifiez que vous avez la dernière version
2. Redémarrez l'application
3. Consultez le CHANGELOG.md pour plus de détails

## 🎯 Prochaines fonctionnalités

- Notifications push pour les rappels de tâches
- Synchronisation cloud des données
- Mode hors ligne amélioré
- Statistiques d'équipe avancées

---

**Version** : 1.2.0  
**Date** : 19 décembre 2024  
**Compatibilité** : iOS 13+, Android 8+ 