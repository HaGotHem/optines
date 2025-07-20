# Guide du Système de Planning

## 📋 Vue d'ensemble

Le système de planning permet aux managers de :
- **Voir le planning par employé** avec leurs pauses, tâches et événements
- **Gérer les jours de travail** de chaque employé
- **Visualiser le planning du rayon** avec une vue calendrier
- **Planifier des pauses récurrentes** par jours de la semaine

## 🚀 Installation et Configuration

### 1. Vérification de la base de données

Assurez-vous que la table `breaks` existe dans Supabase :

```sql
-- Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'breaks'
);
```

Si la table n'existe pas, exécutez le script de création :

```bash
node scripts/setup-breaks-table.js
```

### 2. Test du système

Exécutez le script de test pour valider le système :

```bash
node scripts/test-planning-system.js
```

Ce script va :
- Vérifier la structure de la base de données
- Créer des données de test
- Valider les fonctionnalités de planning

## 📱 Utilisation des Pages

### Page Planning Employé (`/employee-schedule`)

**Fonctionnalités :**
- Sélection d'un employé spécifique
- Vue calendrier hebdomadaire avec créneaux horaires
- Affichage des pauses, tâches et événements
- Gestion des jours de travail
- Ajout d'événements personnalisés

**Navigation :**
1. Aller dans la page **Équipe**
2. Cliquer sur **"Planning Employés"** dans les actions rapides
3. Sélectionner un employé dans la liste
4. Utiliser le calendrier pour naviguer

**Fonctionnalités avancées :**
- **Jours de travail** : Configurer les jours où l'employé travaille
- **Heures de travail** : Définir les horaires de début et fin
- **Événements** : Ajouter des tâches, pauses ou événements personnalisés

### Page Planning Rayon (`/rayon-planning`)

**Fonctionnalités :**
- Vue calendrier globale du rayon
- Affichage de tous les employés et leurs activités
- Légende colorée pour les différents types d'événements
- Statistiques en temps réel
- Navigation entre les semaines

**Navigation :**
1. Aller dans la page **Équipe**
2. Cliquer sur **"Planning Rayon"** dans les actions rapides
3. Utiliser les flèches pour naviguer entre les semaines

**Légende des couleurs :**
- 🟢 **Vert** : Tâches
- 🔵 **Bleu** : Pauses
- 🟡 **Jaune** : Événements

## ⚙️ Configuration des Jours de Travail

### Pour un employé spécifique :

1. Aller dans **Planning Employé**
2. Sélectionner l'employé
3. Cliquer sur l'icône ⚙️ (paramètres)
4. Configurer les jours de travail :
   - Cocher/décocher les jours (Lun, Mar, Mer, etc.)
   - Définir les heures de début et fin
5. Cliquer sur **"Enregistrer"**

### Jours de travail par défaut :
- **Lundi à Vendredi** : Jours de travail standard
- **Samedi et Dimanche** : Week-end (non travaillés)

## 📅 Gestion des Pauses

### Types de pauses disponibles :
- **Pause** : Pause courte (15-30 min)
- **Déjeuner** : Pause déjeuner (1h)
- **Café** : Pause café (15 min)

### Ajout d'une pause :

1. Dans **Planning Employé** :
   - Sélectionner l'employé
   - Cliquer sur le bouton **"+"**
   - Choisir le type "Pause"
   - Définir l'heure de début et fin
   - Ajouter une description (optionnel)

2. Dans **Planning Rayon** :
   - Les pauses apparaissent automatiquement
   - Affichées avec le nom de l'employé

### Pauses récurrentes :

1. Dans la page **Équipe**
2. Cliquer sur **"Pauses"** pour un employé
3. Utiliser le composant **BreakManager**
4. Configurer les jours de répétition
5. Définir la période de répétition

## 🔧 Fonctionnalités Techniques

### Hook `useSupabaseBreaks`

```typescript
const { 
  breaks, 
  isLoading, 
  error,
  createBreak,
  updateBreak,
  deleteBreak,
  getEmployeeBreaks,
  createRecurringBreaks
} = useSupabaseBreaks({
  employee_id: 123,
  date: '2024-01-15'
});
```

### Structure des données

**Table `breaks` :**
```sql
CREATE TABLE breaks (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  break_type TEXT CHECK (break_type IN ('pause', 'dejeuner', 'cafe')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  repeat_days INTEGER[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 Personnalisation

### Thème sombre/clair

Le système s'adapte automatiquement au thème de l'application :
- **Mode clair** : Fond blanc, texte noir
- **Mode sombre** : Fond gris foncé, texte blanc

### Couleurs des événements

Les couleurs peuvent être personnalisées dans le code :
- **Tâches** : `#10b981` (vert)
- **Pauses** : `#3b82f6` (bleu)
- **Événements** : `#f59e0b` (jaune)

## 🐛 Dépannage

### Problème : "Aucun employé trouvé"

**Solution :**
1. Vérifier que le serveur Node.js est démarré
2. S'assurer que l'utilisateur connecté est un manager
3. Vérifier que le manager a des employés associés

```bash
# Démarrer le serveur
node server.js
```

### Problème : "Erreur de base de données"

**Solution :**
1. Vérifier la connexion Supabase
2. Exécuter le script de test

```bash
node scripts/test-planning-system.js
```

### Problème : "Page non trouvée"

**Solution :**
1. Vérifier que les routes sont bien enregistrées
2. Redémarrer l'application

### Problème : "Données non mises à jour"

**Solution :**
1. Vérifier les permissions Supabase
2. Rafraîchir manuellement les données
3. Vérifier les filtres appliqués

## 📊 Statistiques et Métriques

### Données affichées :
- **Nombre de tâches** par jour
- **Nombre de pauses** par jour
- **Nombre d'employés** dans le rayon
- **Performance moyenne** de l'équipe

### Calculs automatiques :
- **Temps de travail effectif** (hors pauses)
- **Disponibilité des employés**
- **Charge de travail** par créneau

## 🔄 Synchronisation

### Mise à jour automatique :
- **Toutes les 30 secondes** pour les statistiques
- **En temps réel** pour les modifications
- **Cache local** pour les performances

### Conflits de données :
- **Résolution automatique** des conflits
- **Timestamp de modification** pour la cohérence
- **Notifications** en cas de conflit

## 📱 Accessibilité

### Fonctionnalités d'accessibilité :
- **Navigation au clavier** supportée
- **Contraste élevé** pour la lisibilité
- **Tailles de police** adaptatives
- **Descriptions vocales** pour les éléments

### Responsive design :
- **Mobile** : Interface optimisée pour petits écrans
- **Tablette** : Affichage adaptatif
- **Desktop** : Vue complète avec plus de détails

## 🚀 Améliorations futures

### Fonctionnalités prévues :
- **Export PDF** des plannings
- **Notifications push** pour les événements
- **Intégration calendrier** externe
- **Gestion des congés** et absences
- **Planification automatique** des tâches

### Optimisations techniques :
- **Cache intelligent** pour les performances
- **Synchronisation offline** des données
- **API REST** pour les intégrations
- **Webhooks** pour les notifications

---

## 📞 Support

Pour toute question ou problème :
1. Consulter ce guide
2. Exécuter les scripts de test
3. Vérifier les logs de l'application
4. Contacter l'équipe de développement

**Fichiers utiles :**
- `scripts/test-planning-system.js` : Test complet du système
- `hooks/useSupabaseBreaks.ts` : Hook pour les pauses
- `app/(manager-tabs)/employee-schedule.tsx` : Page planning employé
- `app/(manager-tabs)/rayon-planning.tsx` : Page planning rayon 