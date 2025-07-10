# Guide de Test - Affichage des Données Utilisateur Réelles

## 🎯 **Objectif**
Vérifier que l'application affiche maintenant le nom d'utilisateur réel et la section (rayon) de l'utilisateur connecté au lieu des données hardcodées.

---

## 🔧 **Modifications apportées**

### **1. Nouveau hook `useUserProfile`**
- ✅ Récupère les données complètes de l'utilisateur depuis la base de données
- ✅ Utilise la vue `users_with_store` pour avoir toutes les informations
- ✅ Gestion du chargement et des erreurs

### **2. Page Calculateur mise à jour**
- ✅ Remplacement des données hardcodées ("Marie Dubois", "Fruits & Légumes")
- ✅ Affichage du vrai nom d'utilisateur (`profile.full_name`)
- ✅ Affichage de la vraie section (`profile.section`)
- ✅ Génération automatique des initiales

---

## 🧪 **Comment tester**

### **Étape 1 : Créer un utilisateur de test**
1. Aller sur `/developer`
2. Créer un magasin si pas déjà fait
3. Créer un utilisateur avec :
   - **Username** : `testuser`
   - **Email** : `testuser@test.com`
   - **Mot de passe** : `password123`
   - **Nom complet** : `Test User`
   - **Rôle** : Manager
   - **Section** : `test`
   - **Magasin** : Sélectionner un magasin

### **Étape 2 : Se connecter avec le nouvel utilisateur**
1. Aller sur `/login`
2. Se connecter avec :
   - **Identifiant** : `testuser` (ou `testuser@test.com`)
   - **Mot de passe** : `password123`

### **Étape 3 : Vérifier l'affichage**
1. Aller sur la page **Calculateur d'Équipe**
2. Dans l'en-tête, vérifier que s'affiche :
   - **Manager** : `Test User` (au lieu de "Marie Dubois")
   - **Rayon** : `test` (au lieu de "Fruits & Légumes")

---

## ✅ **Résultats attendus**

### **Avant (données hardcodées)**
```
Manager: Marie Dubois
Rayon: Fruits & Légumes
```

### **Après (données réelles)**
```
Manager: Test User
Rayon: test
```

---

## 🔍 **Dépannage**

### **Si "Chargement du profil utilisateur..." s'affiche indéfiniment**
- Vérifier que la vue `users_with_store` existe dans Supabase
- Vérifier que l'utilisateur existe dans la table `users`
- Vérifier les logs de la console pour les erreurs

### **Si les anciennes données s'affichent encore**
- Vider le cache de l'application
- Redémarrer l'application
- Vérifier que l'utilisateur est bien connecté

### **Si "Section inconnue" s'affiche**
- Vérifier que le champ `section` est bien rempli dans la base de données
- Vérifier que la vue `users_with_store` retourne bien le champ `section`

---

## 🎉 **Fonctionnalités**

### **Données dynamiques**
- ✅ **Nom complet** de l'utilisateur connecté
- ✅ **Section/Rayon** de l'utilisateur
- ✅ **Initiales** générées automatiquement
- ✅ **Gestion des cas d'erreur** (données manquantes)

### **Compatibilité**
- ✅ Fonctionne avec tous les utilisateurs créés via la page développeur
- ✅ Support des connexions par username ou email
- ✅ Gestion du chargement et des états d'erreur

---

## 📝 **Notes techniques**

- Le hook `useUserProfile` utilise la vue `users_with_store` pour récupérer toutes les données
- Les initiales sont générées en prenant la première lettre de chaque mot du nom complet
- Si le profil n'est pas trouvé, des valeurs par défaut sont affichées
- Le chargement est géré avec un écran de chargement dédié 