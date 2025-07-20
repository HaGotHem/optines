# Guide d'ajout des champs directeur

## 🎯 Objectif
Ajouter les champs `assigned_by_director` et `director_id` à la table `scheduled_tasks` pour distinguer les tâches assignées par les directeurs.

## 📋 Étapes à suivre

### 1. Accéder à Supabase Dashboard
- Aller sur https://supabase.com/dashboard
- Sélectionner le projet `vqwgnvrhcaosnjczuwth`
- Aller dans l'onglet "Table Editor"

### 2. Modifier la table `scheduled_tasks`

#### Ajouter le champ `assigned_by_director`
1. Cliquer sur la table `scheduled_tasks`
2. Cliquer sur "Edit table"
3. Cliquer sur "Add column"
4. Remplir les informations :
   - **Name**: `assigned_by_director`
   - **Type**: `boolean`
   - **Default value**: `false`
   - **Is nullable**: ✅ (cocher)
5. Cliquer sur "Save"

#### Ajouter le champ `director_id`
1. Cliquer sur "Add column"
2. Remplir les informations :
   - **Name**: `director_id`
   - **Type**: `uuid`
   - **Is nullable**: ✅ (cocher)
   - **Foreign key**: 
     - **Table**: `users`
     - **Column**: `id`
3. Cliquer sur "Save"

### 3. Vérifier l'ajout
1. Aller dans l'onglet "SQL Editor"
2. Exécuter la requête :
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'scheduled_tasks'
AND column_name IN ('assigned_by_director', 'director_id')
ORDER BY column_name;
```

### 4. Tester l'insertion
Exécuter cette requête de test :
```sql
INSERT INTO scheduled_tasks (
  title, description, start_time, end_time, duration, date,
  packages, team_size, manager_section, manager_initials,
  palette_condition, is_pinned, is_completed, team_members,
  manager_id, store_id, assigned_by_director, director_id
) VALUES (
  'Test Tâche Directeur',
  'Test des nouveaux champs',
  '10:00:00', '11:00:00', '1h00', '2025-07-20',
  0, 2, 'Test Section', 'TT',
  false, false, false, '[]',
  'd9a9d751-9905-4aab-9098-193b905a65d9', 1, true, 'd9a9d751-9905-4aab-9098-193b905a65d9'
);
```

## ✅ Vérification finale

Après avoir ajouté les champs, exécuter le script de test :
```bash
node scripts/fix-director-fields.js
```

Le script devrait maintenant réussir l'insertion et le filtrage.

## 🔧 Activation du code

Une fois les champs ajoutés, décommenter le code dans :

1. **`app/directeur.tsx`** :
```typescript
assigned_by_director: true, // Marquer comme assignée par un directeur
director_id: user?.id // ID du directeur actuel
```

2. **`app/(manager-tabs)/index.tsx`** :
```typescript
// Filtrer les tâches : exclure celles assignées par les directeurs des statistiques
const todayTasks = tasks.filter(t => t.date === today && !t.assigned_by_director);

// Dans markTaskAsCompleted
const isAssignedByDirector = task?.assigned_by_director;
const directorId = task?.director_id;

if (isAssignedByDirector && directorId) {
  await notificationService.notifyDirectorTaskCompleted(task, user?.full_name || 'Manager');
}

// Dans l'affichage
{task.assigned_by_director && (
  <Text style={{ color: '#f59e0b', fontSize: 12, marginLeft: 8 }}>  • Assignée par directeur</Text>
)}
```

## 🎉 Résultat attendu

- ✅ Les tâches assignées par les directeurs seront marquées visuellement
- ✅ Les statistiques des managers n'incluront que leurs propres tâches
- ✅ Les directeurs recevront des notifications quand leurs tâches sont terminées
- ✅ Séparation claire entre tâches managers et tâches directeurs 