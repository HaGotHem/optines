# Guide de Résolution des Problèmes - Page Développeur

## Problème : "Failed to fetch" lors de la création d'utilisateur

### Cause
Le serveur API n'est pas démarré ou la base de données n'est pas configurée correctement.

### Solution

#### 1. Démarrer le serveur API
```bash
node server.js
```

#### 2. Configurer la base de données Supabase

**Étape 1 : Accéder à Supabase**
1. Allez sur https://supabase.com
2. Connectez-vous à votre projet
3. Allez dans "SQL Editor"

**Étape 2 : Exécuter le script SQL**
1. Copiez le contenu du fichier `setup_database.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur "Run" pour exécuter le script

**Étape 3 : Vérifier la configuration**
```bash
node test_stores.js
```

### 3. Améliorations apportées

#### Interface utilisateur améliorée
- ✅ Boutons radio pour choisir entre "Manager" et "Directeur"
- ✅ Indicateurs de chargement pendant les opérations
- ✅ Meilleure gestion des erreurs
- ✅ Messages d'erreur plus clairs

#### Fonctionnalités ajoutées
- ✅ Routes API complètes pour les magasins (CRUD)
- ✅ Hook `useSupabaseStores` pour gérer les magasins
- ✅ Validation des données côté serveur
- ✅ Protection contre la suppression de magasins avec des utilisateurs

### 4. Utilisation de la page développeur

#### Créer un magasin
1. Allez sur `/developer`
2. Onglet "Magasins"
3. Remplissez les champs obligatoires (nom et ville)
4. Cliquez sur "Créer le magasin"

#### Créer un utilisateur
1. Onglet "Utilisateurs"
2. Remplir tous les champs obligatoires
3. **Choisir le rôle** : Manager ou Directeur (boutons radio)
4. Sélectionner un magasin
5. Cliquer sur "Créer l'utilisateur"

#### Modifier un utilisateur
1. Onglet "Utilisateurs"
2. Cliquer sur le bouton **"Modifier"** sur l'utilisateur souhaité
3. Modifier les champs nécessaires :
   - Nom d'utilisateur
   - Email
   - Nom complet
   - Rôle (Manager/Directeur)
   - Section
   - Magasin
   - **Nouveau mot de passe** (optionnel - laisser vide pour conserver l'ancien)
4. Cliquer sur "Sauvegarder les modifications"
5. Ou cliquer sur "Annuler" pour abandonner les modifications

### 5. Rôles disponibles
- **Manager** : Accès aux fonctionnalités de gestion d'équipe
- **Directeur** : Accès complet à toutes les fonctionnalités
- **Admin** : Accès administrateur (réservé)

### 6. Vérification du bon fonctionnement

#### Test du serveur
```bash
curl http://localhost:3001/api/health
```
Réponse attendue : `{"status":"ok","message":"API de gestion d'utilisateurs opérationnelle"}`

#### Test de création de magasin
```bash
curl -X POST http://localhost:3001/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","city":"Paris"}'
```

#### Test de création d'utilisateur
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123","full_name":"Test User","role":"manager","store_id":1}'
```

### 7. Dépannage

#### Le serveur ne démarre pas
- Vérifiez que Node.js est installé
- Vérifiez que les dépendances sont installées : `npm install`
- Vérifiez les variables d'environnement

#### Erreur de base de données
- Exécutez le script SQL dans Supabase
- Vérifiez les clés d'API dans `server.js`
- Vérifiez les permissions RLS

#### Erreur "Failed to fetch"
- Vérifiez que le serveur est démarré sur le port 3001
- Vérifiez la connexion réseau
- Vérifiez les logs du serveur

### 8. Structure de la base de données

#### Table `stores`
- `id` : Identifiant unique
- `name` : Nom du magasin
- `city` : Ville
- `address` : Adresse (optionnel)
- `phone` : Téléphone (optionnel)
- `is_active` : Statut actif/inactif

#### Table `users`
- `id` : Identifiant unique (UUID)
- `username` : Nom d'utilisateur unique
- `email` : Email unique
- `full_name` : Nom complet
- `role` : Rôle (manager/director/admin)
- `section` : Section (optionnel)
- `store_id` : Référence au magasin
- `is_active` : Statut actif/inactif

### 9. Sécurité
- Authentification Supabase Auth
- Row Level Security (RLS) activé
- Validation des données côté serveur
- Protection contre les injections SQL

### 10. Support
Si vous rencontrez des problèmes :
1. Vérifiez les logs du serveur
2. Vérifiez la console du navigateur
3. Testez les endpoints API individuellement
4. Consultez la documentation Supabase 