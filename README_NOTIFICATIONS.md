# 📱 Système de Notifications

## Vue d'ensemble

Le système de notifications d'Optines permet aux managers de recevoir des alertes en temps réel sur leur planning et leurs équipes.

## 🚀 Fonctionnalités

### 1. **Rappels de Tâches**
- Notifications automatiques avant le début des tâches
- Temps de rappel configurable (5, 10, 15, 30, 60 minutes)
- Programmation automatique lors de la création d'une tâche

### 2. **Alertes de Conflit**
- Détection automatique des conflits de planning
- Notifications immédiates lors de la détection
- Informations détaillées sur les conflits

### 3. **Mises à jour d'Équipe**
- Notifications lors des changements d'équipe
- Ajout/suppression d'employés
- Modifications des informations

### 4. **Notifications en Temps Réel**
- Bannière animée dans l'application
- Auto-fermeture après 5 secondes
- Différentes couleurs selon le type de notification

## ⚙️ Configuration

### Paramètres de Notification
- **Rappels de tâches** : Activer/désactiver les rappels
- **Alertes de conflit** : Notifications pour les conflits de planning
- **Mises à jour employés** : Notifications sur les changements d'équipe
- **Temps de rappel** : Minutes avant le début de la tâche

### Accès aux Paramètres
1. Aller dans l'onglet "Paramètres"
2. Section "Notifications"
3. Configurer selon vos préférences
4. Cliquer sur "Sauvegarder les paramètres"

## 🔧 Architecture Technique

### Composants Principaux

#### 1. **Hook useNotifications** (`hooks/useNotifications.ts`)
```typescript
const {
  settings,
  scheduleTaskReminder,
  sendConflictAlert,
  saveNotificationSettings,
  // ... autres méthodes
} = useNotifications();
```

#### 2. **Service NotificationService** (`services/NotificationService.ts`)
- Service centralisé pour la gestion des notifications
- Pattern Singleton pour une instance unique
- Méthodes pour différents types de notifications

#### 3. **Composant NotificationBanner** (`components/NotificationBanner.tsx`)
- Affichage des notifications en temps réel
- Animations fluides
- Auto-fermeture

### Types de Notifications

| Type | Icône | Couleur | Description |
|------|-------|---------|-------------|
| `task_reminder` | 🕐 | Vert | Rappel avant une tâche |
| `conflict_alert` | ⚠️ | Rouge | Conflit de planning |
| `employee_update` | 👥 | Orange | Changement d'équipe |
| `task_overdue` | ⚠️ | Rouge | Tâche en retard |
| `task_completed` | ✅ | Vert | Tâche terminée |

## 📋 Utilisation

### Programmer un Rappel de Tâche
```typescript
// Dans calculator.tsx
await scheduleTaskReminder(task);
```

### Envoyer une Alerte de Conflit
```typescript
// Dans calculator.tsx
await sendConflictAlert({
  title: task.title,
  conflicts: allConflicts,
});
```

### Notifier un Changement d'Équipe
```typescript
// Dans team.tsx
await notificationService.notifyTeamChange('added', employeeName);
```

## 🔔 Permissions

### Android
- Canal de notification configuré avec importance maximale
- Vibration et lumière LED activées
- Permissions demandées automatiquement

### iOS
- Permissions demandées au premier lancement
- Notifications push configurées

## 🛠️ Développement

### Ajouter un Nouveau Type de Notification

1. **Mettre à jour l'interface NotificationData**
```typescript
type: 'task_reminder' | 'conflict_alert' | 'employee_update' | 'new_type';
```

2. **Ajouter la logique dans NotificationBanner**
```typescript
case 'new_type':
  return <NewIcon color="#ffffff" size={20} strokeWidth={2} />;
```

3. **Créer la méthode dans NotificationService**
```typescript
async notifyNewType(data: any) {
  await this.sendImmediateNotification(
    'Titre',
    'Message',
    { type: 'new_type', data }
  );
}
```

### Tests

Pour tester les notifications :

1. **Notifications immédiates** : Utiliser `sendImmediateNotification`
2. **Notifications programmées** : Créer une tâche avec une heure future
3. **Conflits** : Créer des tâches qui se chevauchent

## 🐛 Dépannage

### Problèmes Courants

#### 1. **Notifications ne s'affichent pas**
- Vérifier les permissions dans les paramètres du téléphone
- Redémarrer l'application
- Vérifier que l'appareil n'est pas en mode silencieux

#### 2. **Rappels ne se déclenchent pas**
- Vérifier que l'heure de la tâche est dans le futur
- Contrôler les paramètres de notification dans l'app
- Vérifier que l'app n'est pas fermée (pour les notifications locales)

#### 3. **Notifications en double**
- Utiliser `cancelAllScheduledNotifications()` pour nettoyer
- Vérifier qu'il n'y a pas de programmation multiple

### Logs de Débogage

Les logs sont disponibles dans la console :
```javascript
console.log('Notification programmée:', notificationId);
console.log('Error scheduling notification:', error);
```

## 📱 Interface Utilisateur

### Page Paramètres
- Section dédiée aux notifications
- Switches pour activer/désactiver
- Sélecteur de temps de rappel
- Compteur de notifications programmées
- Bouton pour tout effacer

### Bannière de Notification
- Position : Haut de l'écran
- Animation : Slide down + fade in
- Auto-fermeture : 5 secondes
- Bouton de fermeture manuelle
- Couleurs dynamiques selon le type

## 🔮 Améliorations Futures

### Fonctionnalités Prévues
- [ ] Notifications push (serveur)
- [ ] Sons personnalisés
- [ ] Actions sur les notifications
- [ ] Historique des notifications
- [ ] Notifications par rayon
- [ ] Rappels récurrents

### Optimisations
- [ ] Cache des paramètres
- [ ] Batch des notifications
- [ ] Optimisation des performances
- [ ] Support offline 