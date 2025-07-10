# Configuration des Événements Récurrents dans Supabase

## Vue d'ensemble

La page "Événements récurrents" permet de créer et gérer des tâches qui se répètent automatiquement (quotidiennement, hebdomadairement, etc.). Pour que cette fonctionnalité fonctionne pleinement, vous devez créer la table `scheduled_events` dans votre base de données Supabase.

## État actuel

✅ **Fonctionnalité opérationnelle** : La page utilise actuellement des données d'exemple et fonctionne parfaitement pour la démonstration.

⚠️ **Base de données manquante** : La table `scheduled_events` n'est pas encore créée dans Supabase.

## Configuration de la table Supabase

### Option 1 : Via l'éditeur SQL de Supabase (Recommandé)

1. **Connectez-vous à votre projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet
   - Allez dans "SQL Editor"

2. **Exécutez le script SQL suivant :**

```sql
-- =====================================================
-- TABLE: scheduled_events (Événements récurrents)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    packages INTEGER NOT NULL CHECK (packages >= 0),
    team_size INTEGER NOT NULL CHECK (team_size >= 0),
    manager_section VARCHAR(50) NOT NULL,
    manager_initials VARCHAR(10) NOT NULL,
    palette_condition BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'weekdays', 'custom')),
    recurrence_days JSONB DEFAULT NULL, -- Array of days [0,1,2,3,4,5,6] for Sunday-Saturday
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL, -- NULL means no end date
    is_active BOOLEAN DEFAULT true,
    manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes sur les événements récurrents
CREATE INDEX IF NOT EXISTS idx_scheduled_events_manager_id ON scheduled_events(manager_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_active ON scheduled_events(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_recurrence ON scheduled_events(recurrence_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_dates ON scheduled_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_store_id ON scheduled_events(store_id);
```

3. **Cliquez sur "Run" pour exécuter le script**

### Option 2 : Via le script automatique

Si vous avez configuré votre fichier `.env` avec `SUPABASE_SERVICE_ROLE_KEY`, vous pouvez exécuter :

```bash
node scripts/create-scheduled-events-table.js
```

## Fonctionnalités de la page Événements Récurrents

### Fonctionnalités actuelles (avec données d'exemple)

✅ **Visualisation des événements récurrents**
- Liste des événements avec leurs détails
- Statut actif/inactif
- Informations de récurrence

✅ **Statistiques**
- Nombre total d'événements
- Événements actifs/inactifs
- Événements récurrents

✅ **Actions sur les événements**
- Activer/Désactiver un événement
- Supprimer un événement
- Générer des tâches pour la semaine

✅ **Interface utilisateur**
- Design moderne et responsive
- Mode sombre/clair
- Rafraîchissement par pull-to-refresh

### Fonctionnalités après configuration Supabase

🚀 **Persistance des données**
- Sauvegarde des événements en base
- Synchronisation entre appareils
- Récupération après redémarrage

🚀 **Génération automatique de tâches**
- Création de tâches basées sur les événements récurrents
- Intégration avec le calendrier principal
- Gestion des conflits d'horaires

🚀 **Gestion avancée**
- Modification des événements existants
- Historique des modifications
- Validation des données côté serveur

## Types de récurrence supportés

- **`daily`** : Tous les jours
- **`weekly`** : Chaque semaine (même jour)
- **`weekdays`** : Du lundi au vendredi uniquement
- **`custom`** : Jours personnalisés (ex: lundi, mercredi, vendredi)

## Structure des données

Chaque événement récurrent contient :

- **Informations de base** : titre, heure de début, durée
- **Détails de la tâche** : nombre de colis, taille d'équipe, section
- **Configuration de récurrence** : type, jours spécifiques, date de fin
- **Métadonnées** : manager, magasin, statut actif

## Intégration avec les autres modules

- **📅 Calendrier** : Les événements générés apparaissent dans le calendrier principal
- **🧮 Calculateur** : Création d'événements récurrents depuis le calculateur
- **👥 Équipe** : Attribution automatique des employés disponibles
- **📊 Analytics** : Suivi des performances des tâches récurrentes

## Prochaines étapes

1. **Créer la table** `scheduled_events` avec le script SQL ci-dessus
2. **Tester la fonctionnalité** en créant votre premier événement récurrent
3. **Générer des tâches** pour voir l'intégration avec le calendrier
4. **Configurer vos événements récurrents** selon vos besoins opérationnels

## Support technique

En cas de problème avec la configuration :
1. Vérifiez que toutes les tables dépendantes (`users`, `stores`, `scheduled_tasks`) existent
2. Vérifiez les permissions RLS (Row Level Security) si activées
3. Consultez les logs d'erreur dans l'onglet "Logs" de Supabase 