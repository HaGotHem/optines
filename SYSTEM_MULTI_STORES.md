# Système Multi-Magasins avec Authentification Complète

## 🎯 Ce qui a été implémenté

### ✅ Authentification réelle
- **Vrais comptes utilisateurs** : Création dans Supabase Auth + table `users`
- **Connexion fonctionnelle** : Les utilisateurs créés peuvent se connecter à l'app
- **Gestion complète** : Création, modification, suppression, réinitialisation de mot de passe

### ✅ Séparation par magasins
- **Isolation complète** : Chaque magasin ne voit que ses propres données
- **store_id** dans toutes les tables : `users`, `team_members`, `scheduled_tasks`
- **Vues database** : `users_with_store`, `store_stats`, `tasks_with_assignments`

### ✅ Panel développeur complet
- **Interface moderne** : Dark mode, navigation par onglets
- **Gestion magasins** : Création, modification, activation/désactivation
- **Gestion utilisateurs** : Interface complète avec tous les champs
- **Validation** : Vérifications côté client et serveur

## 🏗️ Architecture mise en place

### Base de données
```sql
-- Table des magasins
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  city VARCHAR NOT NULL, 
  address TEXT,
  phone VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table utilisateurs (liée à auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('manager', 'director', 'admin')),
  section VARCHAR,
  store_id INTEGER REFERENCES stores(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modifications des tables existantes
ALTER TABLE team_members ADD COLUMN store_id INTEGER REFERENCES stores(id);
ALTER TABLE scheduled_tasks ADD COLUMN store_id INTEGER REFERENCES stores(id);
```

### API REST (server.js)
- **POST /api/users** : Création complète (Auth + DB)
- **GET /api/users** : Liste avec informations magasin
- **PUT /api/users/:id** : Modification complète
- **DELETE /api/users/:id** : Suppression complète (Auth + DB)
- **POST /api/users/:id/reset-password** : Réinitialisation mot de passe

### Hooks React
- **useSupabaseUsers()** : Gestion utilisateurs via API
- **useSupabaseStores()** : Gestion magasins
- **useSupabaseTeam()** : Employés filtrés par store_id
- **useSupabaseTasks()** : Tâches filtrées par store_id

## 🚀 Comment utiliser

### 1. Démarrer le système
```bash
# Terminal 1 : API Backend
npm start

# Terminal 2 : App React Native
npm run dev
```

### 2. Accéder au panel développeur
- Via l'app : Page d'accueil → "Panel Développeur"
- Direct : http://localhost:19006/developer
- Script : `npm run dev-panel`

### 3. Créer un magasin
1. Onglet "Magasins"
2. Remplir : Nom*, Ville*, Adresse, Téléphone
3. "Créer le magasin"

### 4. Créer un utilisateur
1. Onglet "Utilisateurs"
2. Remplir tous les champs obligatoires :
   - Username* (unique)
   - Email* (unique) 
   - Mot de passe*
   - Nom complet*
   - Rôle (manager/director/admin)
   - Magasin*
3. "Créer l'utilisateur"

### 5. Tester la connexion
1. Noter les identifiants créés
2. Aller sur `/login`
3. Se connecter avec username/email + mot de passe

## 🔧 Données d'exemple incluses

### Magasins
1. **Magasin Paris Centre** (Paris)
2. **Magasin Lyon Part-Dieu** (Lyon)  
3. **Magasin Marseille Vieux-Port** (Marseille)

### Utilisateurs (exemples via l'API)
- **admin@paris.com** / admin123 (Admin, Paris)
- **manager@lyon.com** / manager123 (Manager, Lyon)
- **director@marseille.com** / director123 (Director, Marseille)

## 🔐 Sécurité et isolation

### Règles d'accès
- **Managers** : Voient uniquement leur magasin + leur section
- **Directors** : Voient uniquement leur magasin complet
- **Admins** : Voient tous les magasins (via panel développeur)

### Filtrage automatique
```javascript
// Exemple dans useSupabaseTeam
const { data } = await supabase
  .from('team_members')
  .select('*')
  .eq('store_id', userStoreId) // Filtrage automatique
  .eq('manager_id', managerId);
```

## 🛠️ Maintenance et dépannage

### Vérifications de base
```bash
# API fonctionne ?
npm run test-api

# Port libre ?
netstat -an | findstr 3001

# Base données connectée ?
node scripts/update-schema.js
```

### Problèmes courants

**"store_id manquant"**
- Exécuter : `npm run update-schema`
- Vérifier que tous les utilisateurs ont un store_id

**"Utilisateur créé mais connexion impossible"**
- Vérifier dans Supabase Dashboard → Auth → Users
- L'utilisateur doit avoir `email_confirmed: true`

**"Magasin non trouvé"**
- Vérifier que le magasin existe et `is_active = true`
- Utiliser `SELECT * FROM stores;` pour lister

### Commandes utiles
```bash
# Redémarrer tout le système
npm start & npm run dev

# Mettre à jour le schéma
npm run update-schema

# Voir les logs détaillés
# Dans l'app : Ouvrir les DevTools → Console
```

## 📱 Intégration dans l'app existante

### Pages modifiées
- **app/index.tsx** : Bouton "Panel Développeur"
- **app/login.tsx** : Support username ET email
- **app/developer.tsx** : Interface complète de gestion

### Hooks modifiés
- **useSupabaseAuth** : Authentification multi-store
- **useSupabaseTeam** : Filtrage par store_id
- **useSupabaseTasks** : Filtrage par store_id

### Nouveau système
- **server.js** : API complète avec Supabase Auth
- **useSupabaseUsers** : Gestion via API
- **useSupabaseStores** : Gestion des magasins

## 🚀 Prochaines étapes possibles

### Améliorations suggérées
1. **Audit logs** : Tracer toutes les opérations de gestion
2. **Permissions fines** : Rôles plus granulaires par section
3. **Interface mobile** : Version responsive du panel
4. **Sauvegarde** : Export/import des données par magasin
5. **Analytics** : Statistiques par magasin dans le panel

### Production
1. **Variables d'environnement** : Externaliser les clés Supabase
2. **Sécurité réseau** : Restreindre l'accès au panel
3. **Monitoring** : Logs centralisés et alertes
4. **Tests automatisés** : Suite de tests pour l'API

---

## ✅ Validation complète

Le système est maintenant **100% fonctionnel** avec :
- ✅ Vrais comptes utilisateurs (Auth Supabase)
- ✅ Séparation complète par magasins  
- ✅ Interface de gestion moderne
- ✅ API robuste avec validation
- ✅ Documentation complète
- ✅ Scripts d'automatisation

**Les utilisateurs créés dans le panel développeur sont de vrais identifiants qui peuvent se connecter à l'application !** 🎉 