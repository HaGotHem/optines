# Guide de configuration Supabase

## Problème identifié
Votre projet Supabase `igykcyyqkcdnqbzgvvdanz.supabase.co` n'existe pas ou a été supprimé.

## Solution : Créer un nouveau projet

### 1. Accéder à Supabase
- Allez sur https://supabase.com
- Connectez-vous à votre compte

### 2. Créer un nouveau projet
- Cliquez sur "New Project"
- Choisissez votre organisation
- Donnez un nom au projet (ex: "optines-app")
- Créez un mot de passe pour la base de données
- Choisissez une région proche de vous
- Cliquez sur "Create new project"

### 3. Récupérer les informations de connexion
Une fois le projet créé :
- Allez dans "Settings" > "API"
- Copiez l'URL du projet (format: `https://[project-id].supabase.co`)
- Copiez la clé "anon public"

### 4. Créer le fichier .env
Créez un fichier `.env` à la racine de votre projet avec :

```
EXPO_PUBLIC_SUPABASE_URL=https://[votre-nouveau-project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[votre-nouvelle-clé-anon]
```

### 5. Créer les tables dans Supabase
Allez dans "SQL Editor" et exécutez ce script :

```sql
-- Créer la table users
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table teams
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table team_members
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Créer la table tasks
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  assigned_to UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (à adapter selon vos besoins)
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Team members can view team data" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = tasks.team_id AND user_id = auth.uid()
    )
  );
```

### 6. Tester la connexion
Après avoir créé le fichier `.env`, redémarrez Expo :

```bash
npx expo start --clear
```

### 7. Vérifier la connexion
L'application devrait maintenant se connecter à Supabase sans erreur. 