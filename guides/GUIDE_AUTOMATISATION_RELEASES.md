# Guide de l'Automatisation des Releases

## 🎯 Objectif

Ce système automatise complètement la création de releases GitHub en surveillant les modifications en continu et en créant des releases automatiquement quand le seuil de 20 modifications est atteint.

## 🤖 Fonctionnalités

### Surveillance automatique
- **Vérification périodique** : Toutes les 5 minutes
- **Seuil configurable** : 20 modifications par défaut
- **Logs détaillés** : Toutes les actions sont enregistrées
- **Mode daemon** : Fonctionnement en arrière-plan

### Modes de fonctionnement
1. **Mode interactif** : Surveillance en temps réel avec affichage
2. **Mode daemon** : Fonctionnement en arrière-plan
3. **Vérification unique** : Contrôle ponctuel

## 📋 Scripts Disponibles

### Scripts npm
```bash
# Surveillance automatique
npm run auto-watcher              # Mode interactif
npm run auto-watcher-start        # Démarrer le daemon
npm run auto-watcher-stop         # Arrêter le daemon
npm run auto-watcher-status       # Afficher le statut
npm run auto-watcher-logs         # Afficher les logs
npm run auto-watcher-check        # Vérification unique
```

### Scripts batch
```batch
auto-release.bat                  # Interface de gestion complète
start.bat                         # Démarrage avec option d'automatisation
```

## 🚀 Utilisation

### 1. Démarrage rapide
```bash
# Démarrer la surveillance automatique
npm run auto-watcher-start

# Vérifier le statut
npm run auto-watcher-status

# Voir les logs
npm run auto-watcher-logs
```

### 2. Interface graphique
```batch
# Ouvrir l'interface de gestion
auto-release.bat

# Ou via le démarrage principal
start.bat
# Puis choisir option 4 ou 5
```

### 3. Surveillance manuelle
```bash
# Vérification unique
npm run auto-watcher-check

# Mode interactif (Ctrl+C pour arrêter)
npm run auto-watcher
```

## ⚙️ Configuration

### Intervalle de vérification
Modifiez dans `scripts/auto-release-watcher.js` :
```javascript
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
```

### Seuil de modifications
Modifiez dans `scripts/auto-release-watcher.js` :
```javascript
const MODIFICATIONS_THRESHOLD = 20;
```

### Fichier de logs
```javascript
const LOG_FILE = path.join(__dirname, '..', 'auto-release.log');
```

## 📊 Monitoring

### Statut en temps réel
```bash
npm run auto-watcher-status
```

**Exemple de sortie :**
```
==================================================
📊 STATUT DU SYSTÈME DE RELEASE AUTOMATIQUE
==================================================
📦 Version actuelle: 1.0.11
📊 Modifications actuelles: 5
🎯 Seuil pour release: 20
⏳ 15 modification(s) restante(s) avant la prochaine release
👻 Daemon actif avec PID: 12345
==================================================
```

### Logs détaillés
```bash
npm run auto-watcher-logs
```

**Exemple de logs :**
```
[2025-07-20T04:17:52.012Z] 🔍 Vérification automatique des modifications...
[2025-07-20T04:17:52.055Z] 📊 Modifications détectées: 5
[2025-07-20T04:17:52.056Z] 📦 Version actuelle: 1.0.11
[2025-07-20T04:17:52.056Z] ⏳ 15 modification(s) restante(s) avant la prochaine release automatique
```

## 🔧 Gestion du Daemon

### Démarrer le daemon
```bash
npm run auto-watcher-start
```
- Le processus fonctionne en arrière-plan
- PID sauvegardé dans `.auto-release-pid`
- Logs écrits dans `auto-release.log`

### Arrêter le daemon
```bash
npm run auto-watcher-stop
```
- Arrête le processus daemon
- Supprime le fichier PID
- Nettoyage automatique

### Vérifier si le daemon est actif
```bash
npm run auto-watcher-status
```
- Affiche le PID si actif
- Indique "Aucun daemon actif" sinon

## 📝 Workflow Automatique

### 1. Surveillance continue
- Le daemon vérifie les modifications toutes les 5 minutes
- Compte les fichiers ajoutés, modifiés, supprimés
- Compare avec le seuil configuré

### 2. Déclenchement automatique
- Quand le seuil est atteint (20 modifications)
- Création automatique de la release
- Incrémentation de la version
- Génération du changelog
- Commit et push sur GitHub
- Création du tag

### 3. Logs et monitoring
- Toutes les actions sont enregistrées
- Horodatage précis
- Statut détaillé disponible

## 🎛️ Options Avancées

### Mode interactif
```bash
npm run auto-watcher
```
- Affichage en temps réel
- Arrêt avec Ctrl+C
- Logs visibles immédiatement

### Vérification unique
```bash
npm run auto-watcher-check
```
- Contrôle ponctuel
- Pas de surveillance continue
- Idéal pour les tests

### Interface complète
```batch
auto-release.bat
```
- Menu interactif
- Toutes les options disponibles
- Gestion facile du daemon

## ⚠️ Points d'Attention

### 1. Branche de travail
- Le système fonctionne sur la branche `master`
- Les releases sont poussées sur `main` (GitHub)
- Assurez-vous d'être sur `master` en local

### 2. Permissions Git
- Le daemon nécessite les permissions Git
- Configuration utilisateur requise
- Accès au repository GitHub

### 3. Conflits de merge
- Le système gère automatiquement les conflits
- Push forcé si nécessaire
- Logs détaillés en cas d'erreur

### 4. Ressources système
- Le daemon utilise peu de ressources
- Vérification toutes les 5 minutes
- Logs limités en taille

## 🆘 Dépannage

### Daemon ne démarre pas
```bash
# Vérifier les logs
npm run auto-watcher-logs

# Redémarrer le daemon
npm run auto-watcher-stop
npm run auto-watcher-start
```

### Erreurs de push
```bash
# Vérifier le statut Git
git status

# Vérifier les permissions
git config --list
```

### Logs vides
```bash
# Vérifier le fichier de log
cat auto-release.log

# Redémarrer avec mode interactif
npm run auto-watcher
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `npm run auto-watcher-logs`
2. Contrôlez le statut : `npm run auto-watcher-status`
3. Testez manuellement : `npm run auto-watcher-check`
4. Redémarrez le daemon si nécessaire
5. Consultez ce guide pour la configuration 