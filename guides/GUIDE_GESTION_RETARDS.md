# 🚨 Guide de Gestion des Retards

Ce guide explique comment utiliser la nouvelle fonctionnalité de signalement des retards avec cause et notifications automatiques.

## 📋 **Fonctionnalités Ajoutées**

### ✅ **Signalement de retard avec cause**
- **Précision du retard** : Nombre de minutes de retard
- **Cause du retard** : Description détaillée de la raison
- **Validation** : Champs obligatoires avec vérification
- **Interface intuitive** : Modal dédié avec formulaires

### ✅ **Notifications automatiques**
- **Alerte au directeur** : Création automatique d'une alerte critique
- **Notification push** : Envoi immédiat sur le téléphone du directeur
- **Informations détaillées** : Tâche, retard, cause, manager, section

### ✅ **Affichage sur le dashboard directeur**
- **Section alertes critiques** : Affichage en temps réel
- **Détails complets** : Message formaté avec toutes les informations
- **Horodatage** : Heure exacte du signalement

## 🎯 **Comment utiliser la fonctionnalité**

### 1️⃣ **Accéder au planning rayon**
1. Connectez-vous en tant que manager
2. Allez dans le planning rayon
3. Cliquez sur une tâche pour ouvrir le modal de détails

### 2️⃣ **Signaler un retard**
1. Dans le modal de détails de la tâche
2. Cliquez sur le bouton **"Retard"** (rouge)
3. Remplissez le formulaire :
   - **Retard (minutes)** : Nombre de minutes de retard
   - **Cause du retard** : Description détaillée
4. Cliquez sur **"Signaler"**

### 3️⃣ **Confirmation et notification**
1. **Message de confirmation** : Retard signalé avec succès
2. **Alerte créée** : Automatiquement visible sur le dashboard directeur
3. **Notification push** : Envoyée immédiatement au directeur

## 📱 **Interface utilisateur**

### **Modal de retard**
```
┌─────────────────────────────────┐
│  Signaler un retard        ✕    │
├─────────────────────────────────┤
│ Tâche                          │
│ Réception colis matin          │
│                                │
│ Retard (minutes) *             │
│ [15]                           │
│                                │
│ Cause du retard *              │
│ [Camion en retard, équipe      │
│  incomplète...]                │
│                                │
│ [Annuler]    [Signaler]        │
└─────────────────────────────────┘
```

### **Message d'alerte généré**
```
⚠️ RETARD: La tâche "Réception colis matin" 
est en retard de 15 minutes.

📋 Cause: Camion en retard, équipe incomplète
👤 Manager: Jean Dupont
🏪 Section: Agroalimentaire
```

## 🔧 **Configuration technique**

### **Base de données**
- **Table `alerts`** : Stockage des alertes de retard
- **Champs** : `task_id`, `manager_id`, `message`, `severity`
- **Sévérité** : `critical` pour les retards

### **Notifications**
- **Service** : `NotificationService.getInstance()`
- **Type** : `task_delay`
- **Données** : `taskId`, `managerId`, `delayMinutes`, `delayReason`

### **Dashboard directeur**
- **Section** : Alertes critiques
- **Filtrage** : `severity === 'critical'`
- **Affichage** : Message formaté avec horodatage

## 🚨 **Types de retards supportés**

### **Retards courants**
- **Camion en retard** : Livraison tardive
- **Équipe incomplète** : Absences, maladies
- **Problème technique** : Équipement défaillant
- **Conditions météo** : Intempéries
- **Problème logistique** : Erreur de planification

### **Exemples de causes**
```
✅ Bonnes causes :
- "Camion livraison en retard de 30 minutes"
- "Équipe incomplète : 2 employés absents"
- "Problème technique : Chariot élévateur en panne"
- "Conditions météo : Pluie forte, accès difficile"

❌ Causes à éviter :
- "Retard"
- "Problème"
- "Pas le temps"
```

## 📊 **Suivi et statistiques**

### **Dashboard directeur**
- **Nombre d'alertes** : Compteur en temps réel
- **Détails** : Cliquer sur une alerte pour voir les détails
- **Historique** : Toutes les alertes de la journée

### **Données collectées**
- **Tâche concernée** : Titre et ID
- **Manager responsable** : Nom et section
- **Durée du retard** : Minutes précises
- **Cause détaillée** : Description complète
- **Horodatage** : Heure exacte du signalement

## 🔄 **Workflow complet**

### **1. Détection du retard**
```
Manager constate un retard → 
Ouvre le planning rayon → 
Clique sur la tâche concernée
```

### **2. Signalement**
```
Modal de détails → 
Bouton "Retard" → 
Formulaire de retard → 
Validation et envoi
```

### **3. Notification**
```
Alerte créée en base → 
Notification push envoyée → 
Dashboard directeur mis à jour
```

### **4. Suivi**
```
Directeur reçoit notification → 
Consulte le dashboard → 
Prend les mesures nécessaires
```

## ⚠️ **Points d'attention**

### **Validation des données**
- **Minutes** : Doit être un nombre positif
- **Cause** : Doit être renseignée et détaillée
- **Tâche** : Seules les tâches peuvent être en retard

### **Notifications**
- **Connexion requise** : Internet nécessaire pour les notifications
- **Permissions** : Notifications push activées sur le téléphone
- **Délai** : Quelques secondes pour l'envoi

### **Base de données**
- **Table alerts** : Doit exister avec les bons champs
- **Permissions** : RLS configuré pour les managers
- **Connexion** : Supabase accessible

## 🧪 **Test de la fonctionnalité**

### **Script de test**
```bash
node scripts/test-delay-alerts.js
```

### **Vérifications**
1. **Table alerts** : Accessible et fonctionnelle
2. **Création d'alertes** : Insertion réussie
3. **Récupération** : Données lisibles
4. **Suppression** : Nettoyage possible

## 📞 **Support et dépannage**

### **Problèmes courants**
- **Modal ne s'ouvre pas** : Vérifier que c'est une tâche
- **Validation échoue** : Remplir tous les champs obligatoires
- **Notification non reçue** : Vérifier la connexion et les permissions
- **Alerte non visible** : Actualiser le dashboard directeur

### **Logs utiles**
- **Console navigateur** : Erreurs JavaScript
- **Logs Supabase** : Erreurs de base de données
- **Notifications** : État des envois

---

**📅 Dernière mise à jour** : Décembre 2024  
**🔄 Version** : 1.0 