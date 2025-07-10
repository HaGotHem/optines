# 🚀 Guide de Configuration Supabase - Base de Données Complète

## 📋 Prérequis

1. **Compte Supabase** : [supabase.com](https://supabase.com)
2. **Projet Supabase** créé avec le plan gratuit
3. **Clés d'API** récupérées depuis le dashboard

## 🔑 Étape 1 : Récupérer vos clés Supabase

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** (format : `https://[project-id].supabase.co`)
   - **anon public** key (commence par `eyJ...`)

## ⚙️ Étape 2 : Configurer l'application

### 2.1 Mettre à jour `services/supabase.ts`

Remplacez les valeurs par défaut par vos vraies clés :

```typescript
const supabaseUrl = 'https://VOTRE-PROJECT-ID.supabase.co';
const supabaseAnonKey = 'VOTRE-VRAIE-CLE-ANON';
```

### 2.2 Créer un fichier `.env` (optionnel)

```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE-PROJECT-ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE-VRAIE-CLE-ANON
```

## 🗄️ Étape 3 : Vérifier la structure de la base

### 3.1 Exécuter le script de vérification

1. Allez dans votre dashboard Supabase
2. Cliquez sur **SQL Editor**
3. Copiez et exécutez le contenu de `check_database.sql`

### 3.2 Vérifier les résultats

Vous devriez voir :
- ✅ 5 tables créées
- ✅ Des données de test présentes
- ✅ La vue `tasks_with_assignments` fonctionnelle

## 🧪 Étape 4 : Tester la connexion

### 4.1 Installer les dépendances de test

```bash
npm install @supabase/supabase-js
```

### 4.2 Configurer le script de test

1. Ouvrez `test_supabase_connection.js`
2. Remplacez les clés par vos vraies clés
3. Exécutez le test :

```bash
node test_supabase_connection.js
```

### 4.3 Résultats attendus

```
✅ Connexion réussie !
✅ Table users: OK
✅ Table team_members: OK
✅ Table tasks: OK
✅ Table task_assignments: OK
✅ Table user_preferences: OK
✅ Authentification réussie !
✅ Création réussie !
```

## 🔐 Étape 5 : Configurer l'authentification

### 5.1 Activer l'authentification par email

1. Dashboard Supabase → **Authentication** → **Settings**
2. Activez **Enable email confirmations** : `OFF`
3. Activez **Enable email change confirmations** : `OFF`

### 5.2 Créer les utilisateurs de test

Exécutez ce script SQL :

```sql
-- Créer les utilisateurs de test
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'manager@optines.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'director@optines.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Insérer dans la table users
INSERT INTO users (id, username, email, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'manager', 'manager@optines.local', 'manager'),
('550e8400-e29b-41d4-a716-446655440002', 'director', 'director@optines.local', 'director');
```

## 🎯 Étape 6 : Tester l'application

### 6.1 Démarrer l'application

```bash
npm run dev
```

### 6.2 Tester l'authentification

1. Ouvrez l'application
2. Allez sur la page de connexion
3. Testez avec :
   - **Manager** : `manager` / `password123`
   - **Directeur** : `director` / `password123`

### 6.3 Tester les fonctionnalités

1. **Gestion d'équipe** : Ajouter/modifier/supprimer des membres
2. **Calendrier** : Créer/modifier des tâches
3. **Statistiques** : Vérifier les calculs en temps réel
4. **Paramètres** : Changer le thème et le mot de passe

## 🔧 Étape 7 : Dépannage

### Problème : "Invalid API key"

**Solution** : Vérifiez que vous avez copié la bonne clé anon (pas la clé service_role)

### Problème : "Table doesn't exist"

**Solution** : Exécutez le script SQL complet de création des tables

### Problème : "Authentication failed"

**Solution** : Vérifiez que les utilisateurs sont créés dans `auth.users` ET `users`

### Problème : "RLS policy violation"

**Solution** : Les politiques RLS sont commentées pour le développement. Activez-les en production.

## 📊 Étape 8 : Monitoring

### 8.1 Vérifier les logs

Dashboard Supabase → **Logs** → **API Logs**

### 8.2 Surveiller l'utilisation

Dashboard Supabase → **Usage** → **Database**

### 8.3 Vérifier les performances

Dashboard Supabase → **Database** → **Performance**

## 🚀 Étape 9 : Production

### 9.1 Activer les politiques RLS

Décommentez les politiques dans le script SQL initial

### 9.2 Configurer les variables d'environnement

```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE-PROJECT-ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE-VRAIE-CLE-ANON
```

### 9.3 Sauvegarder la base

Dashboard Supabase → **Settings** → **Database** → **Backups**

## ✅ Checklist de validation

- [ ] Clés Supabase configurées
- [ ] Tables créées et remplies
- [ ] Authentification fonctionnelle
- [ ] CRUD équipe opérationnel
- [ ] CRUD tâches opérationnel
- [ ] Statistiques en temps réel
- [ ] Thème et paramètres fonctionnels
- [ ] Tests de connexion réussis

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans le dashboard Supabase
2. Testez avec le script de connexion
3. Vérifiez que toutes les tables existent
4. Assurez-vous que les clés sont correctes

---

**🎉 Félicitations ! Votre base de données Supabase est maintenant complètement fonctionnelle !** 