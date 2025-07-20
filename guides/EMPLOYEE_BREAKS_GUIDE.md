# 🕐 Guide de Gestion des Pauses des Employés

## 📋 Vue d'ensemble

Le système de gestion des pauses permet aux managers de créer, modifier et supprimer des pauses pour leurs employés. Ces pauses impactent automatiquement le calcul du temps estimé pour réaliser une tâche.

## 🚀 Installation

### 1. Créer la table dans Supabase

Exécutez le script de configuration :

```bash
node scripts/setup-employee-breaks.js
```

### 2. Démarrer le serveur API

```bash
node server.js
```

Le serveur doit être en cours d'exécution sur `http://localhost:3001`.

## 🎯 Fonctionnalités

### ✅ Gestion des pauses par employé
- **Création** : Ajouter des pauses avec type, horaires et description
- **Modification** : Modifier les pauses existantes
- **Suppression** : Supprimer des pauses
- **Types de pauses** : Pause, Déjeuner, Formation, Réunion, Autre

### ✅ Impact sur le calcul des tâches
- **Calcul automatique** : Les pauses qui chevauchent une tâche sont automatiquement ajoutées au temps estimé
- **Affichage détaillé** : L'impact des pauses est visible dans le détail du calcul
- **Précision** : Chaque employé peut avoir des pauses différentes

### ✅ Interface intuitive
- **Bouton pause** : Icône café dans la gestion des employés
- **Modal dédié** : Interface complète pour gérer les pauses
- **Validation** : Vérification des horaires et des conflits

## 📱 Utilisation

### 1. Accéder à la gestion des pauses

1. Allez dans **Gestion des employés**
2. Trouvez l'employé concerné
3. Cliquez sur l'icône **☕** (café) à côté de l'employé

### 2. Créer une pause

1. Dans le modal des pauses, cliquez sur **+** (ajouter)
2. Sélectionnez le **type de pause** :
   - ☕ **Pause** : Pause courte
   - 🍽️ **Déjeuner** : Pause déjeuner
   - 📚 **Formation** : Formation ou apprentissage
   - 👥 **Réunion** : Réunion d'équipe
   - ⋯ **Autre** : Autre type de pause

3. Définissez les **horaires** :
   - **Début** : Heure de début (ex: 12:00)
   - **Fin** : Heure de fin (ex: 12:30)

4. Ajoutez une **description** (optionnel)

5. Cliquez sur **Enregistrer**

### 3. Modifier une pause

1. Dans la liste des pauses, cliquez sur l'icône **✏️** (modifier)
2. Modifiez les champs souhaités
3. Cliquez sur **Enregistrer**

### 4. Supprimer une pause

1. Dans la liste des pauses, cliquez sur l'icône **🗑️** (supprimer)
2. Confirmez la suppression

## ⏱️ Impact sur les calculs

### Calcul automatique

Quand vous créez une tâche dans le **Calculateur** :

1. Le système récupère toutes les pauses des employés assignés
2. Il calcule les pauses qui chevauchent la période de la tâche
3. Il ajoute automatiquement le temps des pauses au temps estimé

### Exemple

**Sans pauses :**
- 150 colis = 100 minutes
- 2 employés = -30 minutes bonus
- **Total : 70 minutes**

**Avec pauses :**
- 150 colis = 100 minutes
- 2 employés = -30 minutes bonus
- Pause déjeuner (12:00-12:30) = +30 minutes
- **Total : 100 minutes**

### Affichage dans le calculateur

Le détail du calcul affiche maintenant :
```
Temps de base: 100 min
Bonus équipe (1 membres): -30 min
Impact des pauses: +30 min
```

## 🔧 API Endpoints

### Créer une pause
```http
POST /api/employees/:id/breaks
```

### Lister les pauses d'un employé
```http
GET /api/employees/:id/breaks?date=2024-01-15
```

### Modifier une pause
```http
PUT /api/breaks/:breakId
```

### Supprimer une pause
```http
DELETE /api/breaks/:breakId
```

### Récupérer toutes les pauses pour une date
```http
GET /api/breaks/date/2024-01-15?manager_id=123&section=fruits
```

## 📊 Structure de la base de données

### Table `employee_breaks`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | BIGSERIAL | Identifiant unique |
| `employee_id` | BIGINT | Référence vers team_members |
| `start_time` | TIME | Heure de début |
| `end_time` | TIME | Heure de fin |
| `date` | DATE | Date de la pause |
| `break_type` | VARCHAR(50) | Type de pause |
| `description` | TEXT | Description optionnelle |
| `is_recurring` | BOOLEAN | Pause récurrente |
| `recurrence_pattern` | JSONB | Pattern de récurrence |
| `is_active` | BOOLEAN | Pause active |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de modification |

### Vue `employee_breaks_with_duration`

Vue enrichie avec :
- `duration_minutes` : Durée calculée en minutes
- `employee_name` : Nom de l'employé
- `employee_section` : Section de l'employé

## 🎨 Interface utilisateur

### Composant `BreakManager`

- **Modal plein écran** pour la gestion des pauses
- **Liste des pauses** avec icônes par type
- **Formulaire d'ajout/modification** avec validation
- **Actions** : Modifier, supprimer
- **Affichage de la durée** calculée automatiquement

### Intégration dans `EmployeeManagement`

- **Bouton pause** : Icône café dans la liste des employés
- **Ouverture du modal** : Gestion des pauses par employé
- **Date par défaut** : Date du jour

### Intégration dans `Calculator`

- **Calcul automatique** : Impact des pauses sur le temps estimé
- **Affichage détaillé** : Ligne "Impact des pauses" dans le détail
- **Recalcul en temps réel** : Quand l'équipe change

## 🔍 Dépannage

### Problème : Les pauses ne s'affichent pas

1. Vérifiez que le serveur API est démarré
2. Vérifiez la connexion à Supabase
3. Vérifiez que la table `employee_breaks` existe

### Problème : Le calcul ne prend pas en compte les pauses

1. Vérifiez que les employés ont des pauses pour la date sélectionnée
2. Vérifiez que les pauses chevauchent la période de la tâche
3. Vérifiez que les pauses sont actives (`is_active = true`)

### Problème : Erreur lors de la création d'une pause

1. Vérifiez que l'heure de fin est après l'heure de début
2. Vérifiez que l'employé existe
3. Vérifiez les permissions Supabase

## 📈 Fonctionnalités futures

- [ ] **Pauses récurrentes** : Pauses qui se répètent (quotidiennes, hebdomadaires)
- [ ] **Pauses par équipe** : Pauses communes à toute l'équipe
- [ ] **Notifications** : Rappels avant les pauses
- [ ] **Statistiques** : Temps de pause par employé
- [ ] **Import/Export** : Import de planning de pauses

## 🎯 Bonnes pratiques

1. **Planifier à l'avance** : Créez les pauses en avance pour un calcul précis
2. **Types appropriés** : Utilisez le bon type de pause pour les statistiques
3. **Descriptions claires** : Ajoutez des descriptions pour la traçabilité
4. **Vérification** : Vérifiez l'impact des pauses dans le calculateur
5. **Communication** : Informez l'équipe des pauses planifiées

---

**💡 Conseil** : Utilisez ce système pour optimiser la planification des tâches en tenant compte des contraintes réelles de vos employés ! 