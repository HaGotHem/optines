# 🔐 Guide - Gestion des Utilisateurs et Sécurité

## 🎯 Modifications apportées

### ✅ Restriction pour les Directeurs

**Problème résolu :** Les directeurs avaient accès au bouton de suppression d'utilisateurs, ce qui représentait un risque de sécurité.

**Solution :** Le bouton "Supprimer" a été **masqué** pour les directeurs dans la page de gestion des utilisateurs.

### ✅ Fonctionnalité Développeur

**Amélioration :** La suppression d'utilisateurs reste **entièrement fonctionnelle** sur la page développeur (`/developer`).

## 🎭 Rôles et Permissions

### 👨‍💼 Directeurs (`role: 'director'`)

**Peut faire :**
- ✅ Voir les utilisateurs de son magasin
- ✅ Modifier les utilisateurs existants
- ✅ Créer de nouveaux utilisateurs

**Ne peut PAS faire :**
- ❌ Supprimer des utilisateurs
- ❌ Voir les utilisateurs d'autres magasins

**Message affiché :**
> ⚠️ Les suppressions d'utilisateurs sont réservées aux développeurs pour des raisons de sécurité

### 👨‍💻 Développeurs (`page: /developer`)

**Peut TOUT faire :**
- ✅ Voir tous les utilisateurs
- ✅ Créer des utilisateurs
- ✅ Modifier des utilisateurs  
- ✅ Supprimer des utilisateurs
- ✅ Réinitialiser les mots de passe
- ✅ Activer/Désactiver des comptes

## 📱 Interface Utilisateur

### Page Gestion Utilisateurs (`/user-management`)

```
┌─────────────────────────────────────┐
│ [Nom] - user@example.com            │
│ @username • Store Name              │
│ Directeur • Section                 │
│ ✅ Actif                           │
│                                     │
│ [Modifier] [Supprimer] ← MASQUÉ     │ 
│           pour directeurs           │
└─────────────────────────────────────┘
```

### Page Développeur (`/developer`)

```
┌─────────────────────────────────────┐
│ [Nom] - user@example.com            │
│ Username: username                  │ 
│ Rôle: director                      │
│ Magasin: Store Name                 │
│ ✅ Actif                           │
│                                     │
│ [Modifier] [Reset MDP] [Activer]    │
│ [Supprimer] ← FONCTIONNEL           │
└─────────────────────────────────────┘
```

## 🔧 Accès aux Fonctionnalités

### Pour les Directeurs
1. Connectez-vous avec votre compte directeur
2. Allez dans **"Gestion des utilisateurs"**
3. Le bouton "Supprimer" ne s'affiche plus
4. Toutes les autres fonctions restent disponibles

### Pour les Développeurs
1. Allez sur la page **"/developer"**
2. Onglet **"Utilisateurs"**  
3. Tous les boutons sont fonctionnels, y compris "Supprimer"

## 🚨 Sécurité

### Principe de Moindre Privilège
- Les directeurs ne peuvent supprimer que les données opérationnelles (employés)
- Les comptes utilisateurs (authentification) restent sous contrôle développeur
- Séparation claire entre gestion opérationnelle et administrative

### Traçabilité  
- Toutes les suppressions passent par l'API centralisée
- Les logs sont conservés côté serveur
- Confirmation obligatoire avant suppression

## 💡 Conseils d'Utilisation

### Pour les Directeurs
- Utilisez "Modifier" pour changer les informations d'un utilisateur
- Contactez un développeur si vous devez vraiment supprimer un compte

### Pour les Développeurs
- Soyez prudents avec les suppressions (irréversibles)
- Préférez "Désactiver" plutôt que supprimer quand possible
- Vérifiez toujours avant de confirmer une suppression

## 🔄 Tests Recommandés

1. **Test Directeur :**
   - Connectez-vous en tant que directeur
   - Vérifiez que le bouton "Supprimer" n'apparaît pas
   - Testez que "Modifier" fonctionne toujours

2. **Test Développeur :**
   - Allez sur `/developer`
   - Vérifiez que "Supprimer" fonctionne
   - Testez la confirmation de suppression

3. **Test API :**
   ```bash
   npm run check-health
   ```

## 📞 Support

En cas de problème :
1. Vérifiez que l'API fonctionne : `npm run check-health`
2. Redémarrez l'application : `npm run restart`
3. Consultez les logs dans la console développeur 