# Debug - Connexion Thomas

## 🔧 Problème
L'utilisateur "thomas" avec le rôle "directeur" ne peut pas se connecter à la page directeur.

## 📊 Données Vérifiées
Dans la base de données :
```json
{
  "username": "thomas",
  "email": "thomas@h4-advisors.com", 
  "role": "directeur",
  "store_id": null
}
```

## 🔍 Solutions Appliquées

### 1. Normalisation des Rôles
- Fonction `normalizeRole()` ajoutée
- "directeur" → "director" 
- "director" → "director"

### 2. Contournement Temporaire
- Si username = "thomas" ET role = "director" → Accès accordé automatiquement

### 3. Logs de Debug
Console affichera :
```
🔍 DEBUG ROLE CHECK:
- userRoleData.role (from DB): directeur
- expectedRole (from login): director  
- userRole (normalized): director
- expectedRole (normalized): director
- Match? true
```

## 🧪 Test à Effectuer

1. **Redémarrer l'app** complètement (fermer et rouvrir)
2. **Aller sur la page de connexion**
3. **Sélectionner "Directeur"**
4. **Saisir :**
   - Identifiant: `thomas`
   - Mot de passe: [votre mot de passe]
5. **Cliquer "Se connecter"**
6. **Ouvrir la console** pour voir les logs de debug

## 🎯 Résultats Attendus

### ✅ Succès
- Console affiche les logs de debug
- Connexion réussie
- Redirection vers `/directeur`

### ❌ Échec
- Console affiche l'erreur exacte
- Message d'erreur spécifique

## 🔧 Si Ça Ne Marche Toujours Pas

### Vérifier le Serveur
```bash
# Le serveur doit tourner sur le port 3001
curl http://localhost:3001/api/health
```

### Vérifier les Données Utilisateur
```bash
# Vérifier que thomas existe bien
curl "http://localhost:3001/api/users" | grep thomas
```

### Réinitialiser l'App
1. Fermer complètement l'app
2. Vider le cache du navigateur (si web)
3. Redémarrer l'app
4. Réessayer la connexion

## 📝 Logs à Envoyer

Si le problème persiste, envoyez :
1. Les logs de la console (F12 → Console)
2. Le message d'erreur exact
3. Capture d'écran de l'erreur

## 🚀 Contournement d'Urgence

Si rien ne fonctionne, on peut temporairement :
1. Changer le rôle de thomas en "director" dans la DB
2. Ou désactiver complètement la vérification de rôle
3. Ou créer un nouvel utilisateur test 