# Guide du Système de Release Automatique

## 🎯 Objectif

Ce système automatise la création de releases GitHub toutes les **20 modifications** de fichiers, avec :
- Incrémentation automatique de la version
- Génération d'un changelog détaillé
- Commit et push automatique sur la branche main
- Création de tags GitHub

## 📋 Scripts Disponibles

### 1. Vérification des modifications
```bash
npm run check-modifications
```
**Fonction :** Affiche le nombre de modifications actuelles et combien il en reste avant la prochaine release.

### 2. Scripts Batch Windows
```batch
start.bat          # Démarrage avec option de release
release.bat        # Gestion complète des releases
```

**Fonction :** Scripts Windows pour faciliter la gestion des releases avec interface utilisateur.

**Exemple de sortie :**
```
🔍 Vérification des modifications...

📊 Modifications actuelles: 15
🎯 Seuil pour release: 20
⏳ 5 modification(s) restante(s) avant la prochaine release

📁 Détails des modifications:
- Ajoutés: 3
- Modifiés: 12
- Supprimés: 0
- Renommés: 0
```

### 2. Release automatique
```bash
npm run auto-release
# ou
npm run release
```
**Fonction :** Crée automatiquement une release si le seuil de 20 modifications est atteint.

### 3. Release forcée
```bash
npm run force-release
```
**Fonction :** Force la création d'une release même si le seuil n'est pas atteint.

## 🔧 Configuration

### Seuil de modifications
Le seuil est configuré dans `scripts/auto-release.js` :
```javascript
const MODIFICATIONS_THRESHOLD = 20; // Modifier cette valeur si nécessaire
```

### Types de versioning
Le système utilise le **Semantic Versioning** :
- **MAJOR** (1.0.0) : Changements incompatibles
- **MINOR** (1.1.0) : Nouvelles fonctionnalités compatibles
- **PATCH** (1.0.1) : Corrections de bugs (par défaut)

## 📝 Processus de Release

### 1. Vérification automatique
Le script vérifie :
- Nombre de fichiers modifiés
- Statut Git (ajoutés, modifiés, supprimés, renommés)
- Version actuelle dans `package.json`

### 2. Génération du changelog
Le changelog inclut :
- **Résumé des modifications** avec compteurs
- **Derniers commits** (10 maximum)
- **Liste des fichiers modifiés** par extension
- **Date de release**

### 3. Mise à jour automatique
- Version incrémentée dans `package.json`
- Changelog mis à jour dans `CHANGELOG.md`
- Commit avec message de version
- Push sur la branche main

### 4. Création du tag GitHub
- Tag Git créé automatiquement
- Instructions affichées pour la release GitHub

## 🚀 Utilisation

### Workflow quotidien
1. **Développement normal** - Modifiez vos fichiers
2. **Vérification** - `npm run check-modifications`
3. **Release automatique** - `npm run auto-release` (quand prêt)

### Exemple de workflow
```bash
# Après avoir fait des modifications
npm run check-modifications

# Si le seuil est atteint
npm run auto-release

# Suivre les instructions pour créer la release GitHub
```

### Workflow avec scripts Windows
```batch
# Option 1: Démarrage avec vérification de release
start.bat

# Option 2: Gestion complète des releases
release.bat
```

**Avantages des scripts batch :**
- Interface utilisateur intuitive
- Vérification automatique des dépendances
- Options multiples (vérifier, créer, forcer)
- Gestion d'erreurs intégrée
- Confirmation flexible (oui, o, y, yes, 1)

## 📊 Exemple de Changelog Généré

```markdown
## [1.0.1] - 2024-12-19

### 📊 Résumé des modifications
- **Total des modifications:** 25
- **Fichiers ajoutés:** 3
- **Fichiers modifiés:** 22

### 🔄 Derniers commits
- `a1b2c3d` Ajout du système de notifications
- `e4f5g6h` Correction du bug de connexion
- `i7j8k9l` Amélioration de l'interface utilisateur

### 📁 Fichiers modifiés

**TSX:**
- ✏️ `app/index.tsx`
- ✏️ `components/Header.tsx`

**JS:**
- ✏️ `server.js`
- ➕ `scripts/auto-release.js`

**JSON:**
- ✏️ `package.json`
```

## ⚠️ Points d'Attention

### 1. Branche main
- Le script fait un push automatique sur `origin main` (branche par défaut GitHub)
- Fonctionne même si vous êtes sur la branche `master` en local
- Gestion automatique des conflits d'historique avec push forcé si nécessaire

### 2. Permissions Git
- Le script nécessite les permissions pour :
  - Lire le statut Git
  - Faire des commits
  - Pousser sur GitHub
  - Créer des tags

### 3. Release GitHub manuelle
Le script crée automatiquement le tag, mais vous devez :
1. Aller sur GitHub
2. Créer la release manuellement
3. Utiliser le contenu du changelog généré

## 🔄 Personnalisation

### Modifier le seuil
```javascript
// Dans scripts/auto-release.js
const MODIFICATIONS_THRESHOLD = 30; // Au lieu de 20
```

### Changer le type de version
```javascript
// Dans la fonction main()
const newVersion = incrementVersion(currentVersion, 'minor'); // Au lieu de 'patch'
```

### Ajouter des exclusions
```javascript
// Dans getGitStatus()
const excludedFiles = ['.gitignore', 'node_modules', '.env'];
```

## 🆘 Dépannage

### Erreur "Git non initialisé"
```bash
git init
git remote add origin <votre-repo-github>
```

### Erreur de permissions
```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
```

### Erreur de push
Vérifiez que vous avez les droits d'écriture sur le repository GitHub.

## 📞 Support

En cas de problème :
1. Vérifiez les logs d'erreur
2. Assurez-vous que Git est configuré correctement
3. Vérifiez les permissions GitHub
4. Consultez ce guide pour la configuration 