# Guide de Gestion des Pauses - Manager

## 🎯 Objectif

Permettre aux **managers** (pas aux directeurs) de gérer les pauses de leurs employés directement depuis la page **Équipe Rayon**, avec la possibilité de créer des pauses récurrentes sur des jours spécifiques.

## 📋 Prérequis

1. **Serveur Node.js démarré** : `node server.js`
2. **Table breaks créée** dans Supabase
3. **Employés existants** dans la table `team_members`

## 🔧 Installation

### Étape 1 : Créer la table breaks

Exécutez le script de configuration :

```bash
node scripts/setup-breaks-table.js
```

Si le script ne fonctionne pas, créez manuellement la table dans Supabase :

1. Connectez-vous à votre dashboard Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez le contenu du fichier `scripts/create-breaks-table.sql`

### Étape 2 : Vérifier l'installation

Testez que tout fonctionne :

```bash
node scripts/test-break-manager.js
```

## 🚀 Utilisation

### Accès à la gestion des pauses

1. **Connectez-vous en tant que manager**
2. **Allez dans la page "Équipe Rayon"** (onglet équipe)
3. **Cliquez sur le bouton "Pauses"** (icône café) à côté de chaque employé

### Création d'une pause simple

1. Cliquez sur le bouton **"+"** en haut à droite
2. Sélectionnez le **type de pause** (Pause, Déjeuner, Formation, Réunion, Autre)
3. Définissez les **heures de début et fin**
4. Ajoutez une **description** (optionnel)
5. Cliquez sur **"Enregistrer"**

### Création d'une pause récurrente

1. Activez le **toggle "Répétition"**
2. Sélectionnez les **jours de la semaine** où la pause doit se répéter :
   - **Lun-Ven** : Sélectionnez Lundi, Mardi, Mercredi, Jeudi, Vendredi
   - **Week-end** : Sélectionnez Samedi et Dimanche
   - **Personnalisé** : Sélectionnez les jours de votre choix
3. Optionnellement, définissez une **date de fin** de répétition
4. Cliquez sur **"Enregistrer"**

### Gestion des pauses existantes

- **Modifier** : Cliquez sur une pause existante
- **Supprimer** : Utilisez le bouton de suppression dans la liste

## 📊 Fonctionnalités

### Types de pauses disponibles

- ☕ **Pause** : Pause courte (15-30 min)
- 🍽️ **Déjeuner** : Pause déjeuner (1h)
- 📚 **Formation** : Session de formation
- 👥 **Réunion** : Réunion d'équipe
- ⚙️ **Autre** : Autre type de pause

### Répétition intelligente

- **Jours de la semaine** : Sélection multiple (0=Dimanche, 1=Lundi, etc.)
- **Affichage intelligent** : "Lun-Ven", "Week-end", "Tous les jours"
- **Date de fin** : Limitation de la répétition dans le temps

### Interface utilisateur

- **Mode sombre/clair** : Adaptation automatique
- **Validation** : Vérification des heures et dates
- **Feedback** : Messages de confirmation et d'erreur

## 🔄 Intégration avec le système

### Calcul des tâches

Les pauses sont prises en compte dans le calcul du temps des tâches :
- **Impact sur la durée** : Les pauses qui chevauchent une tâche ajoutent du temps
- **Disponibilité des employés** : Les employés en pause ne sont pas disponibles

### Synchronisation

- **Temps réel** : Les modifications sont immédiatement visibles
- **Base de données** : Toutes les données sont sauvegardées dans Supabase
- **API** : Intégration avec le serveur Node.js

## 🛠️ Dépannage

### Problème : "Table breaks n'existe pas"

**Solution** : Exécutez le script de configuration ou créez manuellement la table.

### Problème : "Aucun employé trouvé"

**Solution** : Vérifiez que vous êtes connecté en tant que manager et que vous avez des employés dans votre section.

### Problème : Bouton "Pauses" non visible

**Solution** : Vérifiez que vous êtes dans la page "Équipe Rayon" (pas "Gestion Employés").

### Problème : Erreur de sauvegarde

**Solution** : Vérifiez que le serveur Node.js est démarré (`node server.js`).

## 📝 Notes techniques

### Structure de la base de données

```sql
CREATE TABLE breaks (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES team_members(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    break_type VARCHAR(50) DEFAULT 'pause',
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_days INTEGER[] DEFAULT '{}',
    recurrence_end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Permissions

- **Manager** : Peut gérer les pauses de ses employés
- **Directeur** : Ne peut pas gérer les pauses (fonctionnalité réservée aux managers)
- **Employé** : Peut voir ses propres pauses

### Sécurité

- **Validation** : Vérification des heures et dates côté client et serveur
- **Permissions** : Vérification des droits d'accès
- **Intégrité** : Contraintes de clés étrangères dans la base de données

## 🎉 Résumé

La gestion des pauses est maintenant **exclusivement réservée aux managers** dans la page **Équipe Rayon**, avec un système complet de **répétition par jours** et une interface utilisateur intuitive.

**Fonctionnalités clés** :
- ✅ Gestion par le manager (pas le directeur)
- ✅ Pauses récurrentes avec sélection des jours
- ✅ Interface intuitive avec toggle et grille de jours
- ✅ Intégration complète avec le système de tâches
- ✅ Validation et sécurité 