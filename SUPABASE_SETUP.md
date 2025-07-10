# 🚀 Guide de Configuration Supabase pour Optines

## 📋 **Étapes de Configuration**

### **1. Créer un Projet Supabase**

1. **Aller sur [supabase.com](https://supabase.com)**
2. **Cliquer sur "Start your project"**
3. **Se connecter avec GitHub ou créer un compte**
4. **Cliquer sur "New Project"**
5. **Choisir l'organisation**
6. **Remplir les informations :**
   - **Name :** `optines-app`
   - **Database Password :** `VotreMotDePasseSecurise123!`
   - **Region :** `West Europe (Paris)` (recommandé pour la France)
7. **Cliquer sur "Create new project"**

### **2. Récupérer les Clés d'API**

1. **Dans le dashboard Supabase, aller dans "Settings" → "API"**
2. **Copier les informations suivantes :**
   - **Project URL :** `https://your-project-id.supabase.co`
   - **anon public :** `your-anon-key`

### **3. Configurer la Base de Données**

1. **Aller dans "SQL Editor"**
2. **Créer un nouveau script**
3. **Copier le contenu du fichier `supabase/schema.sql`**
4. **Exécuter le script**

### **4. Mettre à Jour la Configuration**

1. **Ouvrir le fichier `lib/supabase.ts`**
2. **Remplacer les valeurs par défaut :**

```typescript
const supabaseUrl = 'https://your-project-id.supabase.co'; // Votre Project URL
const supabaseAnonKey = 'your-anon-key'; // Votre clé anon
```

### **5. Créer les Utilisateurs de Test**

1. **Aller dans "SQL Editor"**
2. **Exécuter ce script pour créer des utilisateurs de test :**

```sql
-- Créer des utilisateurs de test avec des mots de passe hachés
INSERT INTO users (username, password_hash, full_name, role, section, is_active) VALUES
('manager1', 'hashed_password_1', 'Jean Dupont', 'manager', 'Section A', true),
('manager2', 'hashed_password_2', 'Marie Martin', 'manager', 'Section B', true),
('directeur1', 'hashed_password_3', 'Pierre Durand', 'director', NULL, true)
ON CONFLICT (username) DO NOTHING;
```

### **6. Tester la Connexion**

1. **Lancer l'application :**
```bash
npm start
```

2. **Tester la connexion avec :**
   - **Username :** `manager1`
   - **Password :** `password123`
   - **Role :** `manager`

## 🔧 **Configuration Avancée**

### **Variables d'Environnement (Recommandé)**

1. **Créer un fichier `.env` :**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. **Mettre à jour `lib/supabase.ts` :**
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

### **Sécurité**

1. **Activer l'authentification Supabase (optionnel) :**
   - Aller dans "Authentication" → "Settings"
   - Configurer les providers souhaités

2. **Configurer les politiques RLS :**
   - Les politiques sont déjà incluses dans le schema.sql
   - Vérifier qu'elles sont actives dans "Authentication" → "Policies"

### **Backup et Restauration**

1. **Exporter les données :**
   - Aller dans "Settings" → "Database"
   - Cliquer sur "Backup" pour télécharger un dump

2. **Importer des données :**
   - Utiliser "SQL Editor" pour exécuter des scripts

## 📊 **Monitoring et Analytics**

### **Dashboard Supabase**

1. **Tableau de bord :**
   - Voir les statistiques d'utilisation
   - Monitorer les performances

2. **Logs :**
   - Aller dans "Logs" pour voir les requêtes
   - Debugger les problèmes

### **Métriques Importantes**

- **Requêtes par minute**
- **Temps de réponse moyen**
- **Espace de stockage utilisé**
- **Nombre d'utilisateurs actifs**

## 🚨 **Dépannage**

### **Problèmes Courants**

1. **Erreur de connexion :**
   - Vérifier les clés d'API
   - Vérifier l'URL du projet
   - Vérifier la connectivité réseau

2. **Erreur d'authentification :**
   - Vérifier les politiques RLS
   - Vérifier les permissions utilisateur

3. **Erreur de requête :**
   - Vérifier la structure des tables
   - Vérifier les contraintes

### **Logs de Debug**

```typescript
// Ajouter dans le code pour debugger
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey);
```

## 📈 **Plan Gratuit Supabase**

### **Limites du Plan Gratuit**

- **500 MB de base de données**
- **2 GB de bande passante**
- **50,000 requêtes par mois**
- **1 projet actif**

### **Optimisations**

1. **Indexer les colonnes fréquemment utilisées**
2. **Utiliser des requêtes optimisées**
3. **Limiter les données retournées**
4. **Mettre en cache les données statiques**

## 🔄 **Migration depuis AsyncStorage**

### **Script de Migration**

```typescript
// Dans SupabaseService.ts
async migrateFromAsyncStorage(): Promise<void> {
  try {
    // Récupérer les données AsyncStorage
    const teamMembers = await AsyncStorage.getItem('teamMembers');
    const scheduledTasks = await AsyncStorage.getItem('scheduledTasks');
    
    if (teamMembers) {
      const members = JSON.parse(teamMembers);
      for (const member of members) {
        await this.createTeamMember(member);
      }
    }
    
    if (scheduledTasks) {
      const tasks = JSON.parse(scheduledTasks);
      for (const task of tasks) {
        await this.createTask(task);
      }
    }
    
    console.log('✅ Migration terminée');
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}
```

## 📞 **Support**

### **Ressources Utiles**

- **[Documentation Supabase](https://supabase.com/docs)**
- **[Discord Supabase](https://discord.supabase.com)**
- **[GitHub Supabase](https://github.com/supabase/supabase)**

### **Contact**

Pour toute question sur la configuration :
- **Email :** support@optines.com
- **Discord :** Optines Community

---

## ✅ **Checklist de Configuration**

- [ ] Projet Supabase créé
- [ ] Clés d'API récupérées
- [ ] Schema de base de données exécuté
- [ ] Configuration mise à jour dans le code
- [ ] Utilisateurs de test créés
- [ ] Connexion testée
- [ ] Variables d'environnement configurées (optionnel)
- [ ] Politiques RLS vérifiées
- [ ] Migration des données effectuée (si nécessaire)

**🎉 Félicitations ! Votre application Optines est maintenant connectée à Supabase !** 