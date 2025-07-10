# 🔧 Configuration Supabase

## 📋 **Étapes pour configurer Supabase**

### 1. **Créer un projet Supabase**
- Allez sur [https://supabase.com](https://supabase.com)
- Créez un nouveau projet ou sélectionnez un projet existant
- Notez l'URL du projet et la clé anon

### 2. **Configurer les variables d'environnement**
Créez un fichier `.env` à la racine du projet :

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. **Exécuter le script SQL**
- Allez dans l'éditeur SQL de Supabase
- Copiez et exécutez le contenu de `supabase-setup.sql`

### 4. **Tester la connexion**
```bash
npm run test-supabase
```

### 5. **Lancer l'application**
```bash
npm run dev
```

## 🔑 **Identifiants de test**

Une fois Supabase configuré, vous pouvez utiliser :

**Manager :**
- Username: `manager`
- Password: `password123`

**Directeur :**
- Username: `director`
- Password: `password123`

## ⚠️ **Important**

- Ne commitez jamais le fichier `.env` dans Git
- Ajoutez `.env` à votre `.gitignore`
- Utilisez des clés d'environnement sécurisées en production 