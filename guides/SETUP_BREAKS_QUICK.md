# 🚀 Installation Rapide - Système de Pauses

## ✅ Étape 1 : Configuration de la base de données

### Option A : Script SQL manuel (Recommandé)

1. **Allez dans votre dashboard Supabase** : https://supabase.com/dashboard/project/vqwgnvrhcaosnjczuwth
2. **SQL Editor** → **New query**
3. **Copiez-collez** le contenu du fichier `supabase/setup-employee-breaks-manual.sql`
4. **Cliquez sur "Run"**

### Option B : Script automatique (Si vous avez la clé service_role)

```bash
node scripts/setup-employee-breaks-direct.js
```

## ✅ Étape 2 : Vérification du serveur API

Le serveur API doit être en cours d'exécution :

```bash
node server.js
```

**Vérification** : Le serveur affiche les nouvelles routes :
- `POST /api/employees/:id/breaks`
- `GET /api/employees/:id/breaks`
- `PUT /api/breaks/:breakId`
- `DELETE /api/breaks/:breakId`
- `GET /api/breaks/date/:date`

## ✅ Étape 3 : Test de l'interface

1. **Démarrez l'application** : `npx expo start`
2. **Connectez-vous** en tant que manager
3. **Allez dans "Gestion des employés"**
4. **Cliquez sur l'icône ☕** à côté d'un employé
5. **Créez une pause** de test

## 🎯 Fonctionnalités disponibles

### ✅ Gestion des pauses
- **Créer** des pauses avec type, horaires, description
- **Modifier** les pauses existantes
- **Supprimer** des pauses
- **5 types** : Pause, Déjeuner, Formation, Réunion, Autre

### ✅ Impact sur les calculs
- **Calcul automatique** de l'impact des pauses sur les tâches
- **Affichage détaillé** dans le calculateur
- **Recalcul en temps réel** quand l'équipe change

### ✅ Interface intuitive
- **Bouton pause** dans la gestion des employés
- **Modal complet** pour gérer les pauses
- **Validation** des horaires et conflits

## 🔧 Dépannage

### Problème : "Invalid API key"
- Utilisez l'**Option A** (script SQL manuel)
- Ou récupérez votre clé service_role dans Supabase

### Problème : Routes API manquantes
- Redémarrez le serveur : `node server.js`
- Vérifiez que le serveur affiche les nouvelles routes

### Problème : Bouton pause ne fonctionne pas
- Vérifiez que vous êtes connecté en tant que manager
- Vérifiez que la table `employee_breaks` existe dans Supabase

## 📱 Utilisation rapide

1. **Gestion des employés** → Icône ☕ → **Ajouter pause**
2. **Calculateur** → Sélectionner employés → **Voir l'impact des pauses**
3. **Planning** → Les pauses sont prises en compte automatiquement

---

**🎉 Votre système de gestion des pauses est prêt !** 