# Panel Développeur - Guide d'utilisation

## Vue d'ensemble

Le Panel Développeur permet de gérer tous les magasins et utilisateurs de l'application avec un système de séparation complète des données par magasin. **Les utilisateurs créés sont de vrais comptes d'authentification Supabase qui peuvent se connecter à l'application.**

## Fonctionnalités principales

### 🏪 Gestion des magasins
- **Création** : Ajout de nouveaux magasins avec nom, ville, adresse et téléphone
- **Modification** : Activation/désactivation des magasins
- **Suppression** : Suppression complète (⚠️ Supprime aussi tous les utilisateurs et données associés)

### 👥 Gestion des utilisateurs (Comptes réels)
- **Création** : Création de vrais comptes utilisateurs avec authentification Supabase
- **Modification** : Changement des rôles, statuts et informations
- **Suppression** : Suppression du compte complet (Auth + base de données)
- **Réinitialisation** : Changement des mots de passe

## Accès au Panel

### Via l'application
1. Page d'accueil → Bouton "Panel Développeur"
2. Navigation directe : `/developer`

### Via script npm
```bash
npm run dev-panel
```

## Création d'utilisateurs

### Types d'utilisateurs disponibles
- **Manager** : Accès aux fonctionnalités de base du magasin
- **Director** : Accès étendu avec gestion d'équipe
- **Admin** : Accès complet au système

### Champs obligatoires
- **Nom d'utilisateur** : Identifiant unique pour la connexion
- **Email** : Adresse email (doit être unique)
- **Mot de passe** : Mot de passe pour la connexion
- **Nom complet** : Nom affiché dans l'interface
- **Magasin** : Magasin auquel l'utilisateur est rattaché

### Champs optionnels
- **Section** : Section spécifique dans le magasin
- **Statut** : Actif/Inactif (par défaut actif)

## Test de fonctionnement

### Script de test automatique
```bash
node test_user_creation.js
```

Ce script va :
1. Vérifier que l'API fonctionne
2. Créer un utilisateur de test
3. Vérifier qu'il apparaît dans la liste
4. Fournir les identifiants pour tester la connexion

### Test manuel
1. Créer un utilisateur via le panel
2. Noter les identifiants (username/email + mot de passe)
3. Aller sur la page de connexion (`/login`)
4. Se connecter avec les identifiants créés

## Séparation des données par magasin

### Principe
Chaque magasin est complètement isolé :
- Les managers ne voient que les données de leur magasin
- Les directeurs ont accès uniquement à leur magasin
- Seuls les admins peuvent voir tous les magasins

### Mise en œuvre
- **store_id** : Chaque utilisateur/tâche/employé est lié à un magasin
- **Filtrage automatique** : Les requêtes filtrent par store_id
- **Vues database** : `users_with_store`, `tasks_with_assignments`, etc.

## Architecture technique

### Base de données
```sql
-- Table des magasins
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  address TEXT,
  phone VARCHAR,
  is_active BOOLEAN DEFAULT true
);

-- Table des utilisateurs (liée à Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('manager', 'director', 'admin')),
  section VARCHAR,
  store_id INTEGER REFERENCES stores(id),
  is_active BOOLEAN DEFAULT true
);
```

### API REST
- **POST** `/api/users` : Création d'utilisateur (Auth + DB)
- **PUT** `/api/users/:id` : Modification d'utilisateur
- **DELETE** `/api/users/:id` : Suppression complète
- **GET** `/api/users` : Liste des utilisateurs avec infos magasin
- **POST** `/api/users/:id/reset-password` : Réinitialisation mot de passe

### Hooks React
- `useSupabaseUsers()` : Gestion des utilisateurs via API
- `useSupabaseStores()` : Gestion des magasins
- Gestion automatique des erreurs et rechargement

## Sécurité

### Clé service_role
Le serveur utilise la clé `service_role` de Supabase pour :
- Créer des comptes dans `auth.users`
- Contourner les RLS (Row Level Security) pour la gestion
- Gérer les utilisateurs de tous les magasins

### Recommandations production
1. **Variables d'environnement** : Stocker les clés dans `.env`
2. **Restrictions réseau** : Limiter l'accès au panel développeur
3. **Logs d'audit** : Tracer toutes les opérations de gestion
4. **Validation stricte** : Vérifier tous les inputs côté serveur

## Dépannage

### L'API ne démarre pas
```bash
# Vérifier que le port 3001 est libre
netstat -an | grep 3001

# Redémarrer le serveur
npm start
```

### Erreur de création d'utilisateur
- Vérifier que l'email n'existe pas déjà
- Vérifier que le username est unique
- Vérifier que le magasin sélectionné existe et est actif

### Utilisateur créé mais connexion impossible
- Vérifier dans Supabase Dashboard → Authentication → Users
- L'utilisateur doit apparaître avec `email_confirmed: true`
- Tester la connexion avec email ET mot de passe

### Problème de store_id
```bash
# Vérifier les magasins existants
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);
supabase.from('stores').select('*').then(console.log);
"
```

## Scripts utiles

### Mise à jour du schéma
```bash
npm run update-schema
```

### Nettoyage des données de test
```bash
node -e "
// Script pour supprimer les utilisateurs de test
const fetch = require('node-fetch');
// Implémenter le nettoyage...
"
```

### Sauvegarde des données
```bash
# Export PostgreSQL via Supabase CLI
supabase db dump --db-url="postgresql://..." > backup.sql
```

## Intégration avec l'app existante

### Pages affectées
- `app/login.tsx` : Gestion connexion username/email
- `hooks/useSupabaseAuth.ts` : Authentification multi-store
- Toutes les pages avec données filtrées par store_id

### Migration des données existantes
Si vous avez des données sans store_id :
```sql
-- Assigner un magasin par défaut
UPDATE users SET store_id = 1 WHERE store_id IS NULL;
UPDATE team_members SET store_id = 1 WHERE store_id IS NULL;
UPDATE scheduled_tasks SET store_id = 1 WHERE store_id IS NULL;
```

---

**⚠️ Important** : Ce panel donne accès à tous les magasins et utilisateurs. Utilisez-le uniquement en développement ou avec des permissions administrateur appropriées en production. 