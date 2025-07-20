# 🚀 Guide de Démarrage Rapide

## Scripts disponibles

### Démarrage complet (recommandé)
```bash
# Lance l'API et l'app Expo en parallèle
npm start
```

### Démarrage détaillé avec logs colorés
```bash
# Lance l'API et l'app avec des logs séparés par couleur
npm run dev-full
```

### Démarrage séparé

#### Serveur API uniquement
```bash
npm run server
```

#### Application Expo uniquement  
```bash
npm run dev
```

### Vérification et maintenance

#### Vérifier que l'API fonctionne
```bash
npm run check-health
```

#### Arrêter tous les processus Node.js
```bash
npm run stop-server
```

#### Redémarrer complètement
```bash
npm run restart
```

## 📱 Plateformes spécifiques

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios  
```

### Web
```bash
npm run web
```

## 🔧 Configuration Supabase

### Premier setup
```bash
npm run setup-supabase
```

### Mise à jour du schéma
```bash
npm run update-schema
```

## ⚡ Démarrage le plus rapide

1. **Première utilisation :**
   ```bash
   npm install
   npm start
   ```

2. **Utilisation quotidienne :**
   ```bash
   npm start
   ```

## 🚨 Résolution de problèmes

### L'API ne répond pas
```bash
npm run check-health
```

### Tout redémarrer proprement
```bash
npm run restart
```

### Ports utilisés
- **API Backend :** http://localhost:3001
- **Expo Dev Server :** http://localhost:19000  
- **Expo Web :** http://localhost:19006

## 💡 Conseils

- Utilisez `npm start` pour un démarrage simple
- Utilisez `npm run dev-full` pour voir les logs séparés
- Gardez toujours l'API en cours d'exécution quand vous utilisez l'app
- Utilisez `npm run check-health` pour vérifier que tout fonctionne

## 🆕 Nouveautés Récentes

### Synchronisation des Rayons 🔄
**NOUVEAU :** Système centralisé de gestion des rayons ! Tous les rayons sont maintenant synchronisés en temps réel entre toutes les pages de l'application.

**Fonctionnalités :**
- 🔗 **Synchronisation temps réel** entre gestion d'employés et d'utilisateurs
- ⚙️ **Gestionnaire central** accessible via boutons "Rayons" 
- 💾 **Persistance** des données avec AsyncStorage
- 🎯 **Assignation cohérente** employés/managers au même rayon

**Voir :** `GUIDE_SYNCHRONISATION_RAYONS.md` pour le guide complet 