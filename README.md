# 🏪 Optines - Application de Gestion de Magasin

Application React Native avec Expo pour la gestion complète d'un magasin agroalimentaire, incluant la gestion des employés, du planning, des tâches et des performances.

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Démarrage complet (API + App)
npm start

# Ou démarrage séparé
npm run server    # API uniquement
npm run dev       # App Expo uniquement
```

## 📚 Documentation

Toute la documentation est organisée dans le dossier [`guides/`](guides/README.md) :

- **🚀 Démarrage** : [Guide de Démarrage Rapide](guides/GUIDE_DEMARRAGE.md)
- **📅 Planning** : [Système de Planning](guides/GUIDE_PLANNING_SYSTEM.md)
- **☕ Pauses** : [Gestion des Pauses](guides/GUIDE_GESTION_PAUSES.md)
- **🔐 Sécurité** : [Gestion des Utilisateurs](guides/GUIDE_GESTION_UTILISATEURS.md)
- **🚨 Alertes** : [Système d'Alertes](guides/GUIDE_SYSTEME_ALERTES.md)

## 🏗️ Architecture

```
optines-main/
├── app/                    # Pages de l'application (Expo Router)
├── components/             # Composants réutilisables
├── contexts/              # Contextes React (thème, auth, etc.)
├── hooks/                 # Hooks personnalisés
├── services/              # Services métier
├── scripts/               # Scripts de configuration et tests
├── supabase/              # Scripts SQL et schémas
├── guides/                # 📚 Documentation complète
└── server.js              # API Backend Node.js
```

## 🎯 Fonctionnalités Principales

### 👥 Gestion des Employés
- Gestion des équipes par rayon
- Planning individuel et collectif
- Gestion des pauses et horaires
- Calcul de performance

### 📅 Planning et Organisation
- Planning rayon avec vue calendrier
- Événements récurrents
- Gestion des tâches planifiées
- Synchronisation temps réel

### 📊 Analytics et Performance
- Indices de performance par employé
- Graphiques de traitement de colis
- Statistiques en temps réel
- Alertes de retard

### 🔐 Sécurité et Permissions
- Authentification Supabase
- Rôles (Directeur, Manager, Employé)
- Permissions granulaires
- Audit des actions

## 🛠️ Technologies

- **Frontend** : React Native + Expo
- **Backend** : Node.js + Express
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Styling** : NativeWind (Tailwind CSS)
- **Navigation** : Expo Router

## 🔧 Configuration

### Variables d'environnement
```javascript
// app.config.js
extra: {
  supabaseUrl: "https://vqwgnvrhcaosnjczuwth.supabase.co",
  supabaseAnonKey: "your-anon-key",
}
```

### Ports utilisés
- **API Backend** : http://localhost:3001
- **Expo Dev Server** : http://localhost:19000
- **Expo Web** : http://localhost:19006

## 📱 Plateformes Supportées

- ✅ **Android** : `npm run android`
- ✅ **iOS** : `npm run ios`
- ✅ **Web** : `npm run web`

## 🚨 Support et Dépannage

1. **Vérifier la santé du système** : `npm run check-health`
2. **Redémarrer complètement** : `npm run restart`
3. **Consulter la documentation** : [guides/README.md](guides/README.md)
4. **Vérifier les logs** : Console développeur

## 📋 Scripts Disponibles

```bash
npm start              # Démarrage complet
npm run dev-full       # Démarrage avec logs séparés
npm run server         # API uniquement
npm run dev            # App Expo uniquement
npm run android        # Android
npm run ios            # iOS
npm run web            # Web
npm run check-health   # Vérification santé
npm run restart        # Redémarrage complet
npm run stop-server    # Arrêter tous les processus
```

---

**📚 [Voir la documentation complète](guides/README.md) pour plus de détails** 