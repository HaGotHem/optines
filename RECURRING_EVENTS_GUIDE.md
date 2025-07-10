# 🔄 Guide des Événements Récurrents

## Vue d'ensemble

Le système d'événements récurrents permet de créer des tâches qui se répètent automatiquement selon différents motifs (quotidien, hebdomadaire, jours ouvrables, ou personnalisé). Par défaut, **aucune tâche n'est récurrente** - tout doit être configuré explicitement.

## 🏗️ Architecture

### Tables de base de données

#### `scheduled_events` - Événements récurrents
```sql
- id (UUID) : Identifiant unique
- title (VARCHAR) : Titre de l'événement
- description (TEXT) : Description détaillée
- start_time (TIME) : Heure de début
- duration_minutes (INTEGER) : Durée en minutes
- packages (INTEGER) : Nombre de colis à traiter
- team_size (INTEGER) : Taille de l'équipe
- manager_section (VARCHAR) : Section du manager
- manager_initials (VARCHAR) : Initiales du manager
- palette_condition (BOOLEAN) : État des palettes
- team_members (JSONB) : IDs des membres d'équipe
- recurrence_type (VARCHAR) : Type de récurrence
- recurrence_days (JSONB) : Jours de la semaine
- start_date (DATE) : Date de début
- end_date (DATE) : Date de fin (optionnelle)
- is_active (BOOLEAN) : Statut actif/inactif
- manager_id (TEXT) : ID du manager créateur
- store_id (BIGINT) : ID du magasin
```

#### `generated_tasks` - Liaison événements → tâches
```sql
- id (BIGSERIAL) : Identifiant auto-incrémenté
- scheduled_event_id (UUID) : Référence vers l'événement
- scheduled_task_id (UUID) : Référence vers la tâche générée
- generated_for_date (DATE) : Date pour laquelle la tâche est générée
```

### Types de récurrence

| Type | Description | Jours configurés |
|------|-------------|------------------|
| `none` | Événement unique | N/A |
| `daily` | Tous les jours | [1,2,3,4,5,6,7] |
| `weekly` | Même jour chaque semaine | [jour_sélectionné] |
| `weekdays` | Jours ouvrables seulement | [1,2,3,4,5] |
| `custom` | Jours personnalisés | Sélection manuelle |

**Codage des jours** : 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 7=Dimanche

## 🚀 Installation et Configuration

### 1. Appliquer le schéma SQL

Exécutez le contenu de `supabase/recurring-events-schema.sql` dans votre interface Supabase :
🔗 https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new

### 2. Vérifier l'installation

```bash
node scripts/setup-recurring-events.js
```

### 3. Tester le système

```bash
# Test complet du système
node scripts/test-recurring-events.js

# Nettoyer les données de test
node scripts/test-recurring-events.js --cleanup
```

## 📱 Utilisation dans l'application

### Interface utilisateur (Calculateur)

1. **Remplir les informations de base** :
   - Nombre de colis
   - État des palettes
   - Sélection de l'équipe
   - Heure de début

2. **Configurer la récurrence** :
   - Cliquer sur "▼ Afficher" dans la section "Options de récurrence"
   - Choisir le type de récurrence
   - Sélectionner les jours (pour type personnalisé)
   - Définir une date de fin (optionnelle)

3. **Créer l'événement récurrent** :
   - Cliquer sur "🔄 Créer événement récurrent"
   - Choisir de générer les tâches immédiatement ou plus tard

### Hook React : `useSupabaseEvents`

```typescript
import { useSupabaseEvents } from '../hooks/useSupabaseEvents';

const {
  events,                    // Liste des événements
  isLoading,                // État de chargement
  createEvent,              // Créer un nouvel événement
  generateTasksForDate,     // Générer pour une date
  generateTasksForRange,    // Générer pour une période
  getRecurrenceDescription  // Description lisible
} = useSupabaseEvents({
  managerId: 'manager-id'
});
```

## 🔧 Génération automatique des tâches

### Génération quotidienne

```bash
# Générer les tâches pour aujourd'hui
node scripts/daily-task-generator.js

# Avec nettoyage des anciennes tâches
node scripts/daily-task-generator.js --cleanup-old

# Afficher le statut des événements
node scripts/daily-task-generator.js --status
```

### Génération pour une période

```bash
# Générer pour une semaine
node scripts/daily-task-generator.js --period 2024-01-01 2024-01-07
```

### Configuration Cron (recommandée)

Ajoutez cette ligne à votre crontab pour une génération automatique quotidienne à 6h :

```bash
0 6 * * * cd /path/to/optines-main && node scripts/daily-task-generator.js
```

## 📋 Fonctions PostgreSQL

### `generate_tasks_for_date(target_date DATE)`

Génère toutes les tâches récurrentes pour une date donnée.

```sql
SELECT generate_tasks_for_date('2024-01-15');
-- Retourne le nombre de tâches générées
```

### `calculate_end_time(start_time TIME, duration_minutes INTEGER)`

Calcule l'heure de fin basée sur l'heure de début et la durée.

```sql
SELECT calculate_end_time('09:00:00', 120); -- Retourne '11:00:00'
```

### `matches_recurrence_day(target_date DATE, recurrence_days JSONB)`

Vérifie si une date correspond aux jours de récurrence configurés.

```sql
SELECT matches_recurrence_day('2024-01-15', '[1,2,3,4,5]'); -- true si c'est un jour ouvrable
```

## 🎯 Exemples d'utilisation

### Exemple 1 : Mise en rayon quotidienne

```javascript
const evenementQuotidien = {
  title: "Mise en rayon matinale",
  description: "Mise en rayon des produits frais",
  start_time: "06:00:00",
  duration_minutes: 120,
  packages: 100,
  team_size: 2,
  recurrence_type: "daily",
  recurrence_days: [1,2,3,4,5,6,7],
  start_date: "2024-01-01",
  end_date: null // Récurrence infinie
};
```

### Exemple 2 : Réception hebdomadaire

```javascript
const receptionHebdo = {
  title: "Réception marchandises",
  description: "Réception du lundi matin",
  start_time: "08:00:00",
  duration_minutes: 180,
  packages: 300,
  team_size: 4,
  recurrence_type: "weekly",
  recurrence_days: [1], // Lundi seulement
  start_date: "2024-01-01",
  end_date: "2024-12-31"
};
```

### Exemple 3 : Tâches personnalisées

```javascript
const tachePersonnalisee = {
  title: "Inventaire partiel",
  description: "Inventaire mardi/jeudi/samedi",
  start_time: "14:00:00",
  duration_minutes: 90,
  packages: 50,
  team_size: 1,
  recurrence_type: "custom",
  recurrence_days: [2, 4, 6], // Mar, Jeu, Sam
  start_date: "2024-01-01",
  end_date: "2024-06-30"
};
```

## 🔍 Surveillance et maintenance

### Vérifier les événements actifs

```sql
SELECT 
  title,
  recurrence_type,
  start_date,
  end_date,
  is_active
FROM scheduled_events 
WHERE is_active = true
ORDER BY created_at DESC;
```

### Voir les tâches générées aujourd'hui

```sql
SELECT 
  se.title as event_title,
  st.title as task_title,
  st.start_time,
  st.packages,
  gt.generated_for_date
FROM generated_tasks gt
JOIN scheduled_events se ON se.id = gt.scheduled_event_id
JOIN scheduled_tasks st ON st.id = gt.scheduled_task_id
WHERE gt.generated_for_date = CURRENT_DATE
ORDER BY st.start_time;
```

### Statistiques par type de récurrence

```sql
SELECT 
  recurrence_type,
  COUNT(*) as total,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as actifs
FROM scheduled_events
GROUP BY recurrence_type
ORDER BY total DESC;
```

## ⚠️ Points importants

### Comportement par défaut
- **Aucune tâche n'est récurrente par défaut**
- Les événements doivent être configurés explicitement
- La génération doit être déclenchée manuellement ou via cron

### Prévention des doublons
- Une seule tâche par événement par date
- Contraint par `UNIQUE(scheduled_event_id, generated_for_date)`
- Re-exécuter la génération est sûr (pas de doublons)

### Gestion des erreurs
- Les événements inactifs ne génèrent pas de tâches
- Les événements expirés sont ignorés
- Les jours non correspondants sont sautés

### Performance
- Index optimisés pour les requêtes fréquentes
- Fonction PostgreSQL native pour la génération
- Possibilité de nettoyage automatique des anciennes données

## 🛠️ Dépannage

### Problème : Aucune tâche générée

1. Vérifier que les tables existent :
   ```bash
   node scripts/setup-recurring-events.js
   ```

2. Vérifier les événements actifs :
   ```bash
   node scripts/daily-task-generator.js --status
   ```

3. Tester la génération manuelle :
   ```bash
   node scripts/daily-task-generator.js
   ```

### Problème : Fonctions PostgreSQL manquantes

Réappliquer le schéma SQL complet depuis `supabase/recurring-events-schema.sql`

### Problème : Interface ne fonctionne pas

Vérifier que le hook `useSupabaseEvents` est correctement importé et que les composants utilisent les bonnes props.

## 📚 Ressources supplémentaires

- **Schéma SQL** : `supabase/recurring-events-schema.sql`
- **Hook React** : `hooks/useSupabaseEvents.ts`
- **Interface** : Ajouté au calculateur (`app/(manager-tabs)/calculator.tsx`)
- **Scripts** : 
  - `scripts/setup-recurring-events.js`
  - `scripts/test-recurring-events.js`
  - `scripts/daily-task-generator.js` 