# 🚨 Guide du Système dAlertes de Retard

## 📋 Vue d'ensemble

Le système d'alertes permet aux managers de signaler des retards sur leurs tâches, ce qui génère automatiquement des notifications pour les directeurs.

## 🗄️ Structure de la base de données

### Table `alerts`
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
    manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULTwarning' CHECK (severity IN (info', 'warning',critical')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Installation

###1er la table alerts
Exécuter le script SQL dans Supabase :
```sql
-- Copier le contenu de supabase/create-alerts-table.sql
-- et l'exécuter dans l'éditeur SQL de Supabase
```

### 2. Vérifier l'installation
```bash
# Vérifier que la table existe
SELECT * FROM alerts LIMIT 1
## 📱 Utilisation

### Pour les Managers

#### 1. Signaler un retard depuis le calendrier
- Ouvrir le calendrier manager
- Cliquer sur le bouton ⚠️ (triangle d'alerte) sur une tâche
- Entrer le nombre de minutes de retard
- Confirmer

#### 2. Signaler un retard lors de l'édition
- Éditer une tâche
- Remplir le champ "Retard (minutes)"
- Sauvegarder

### Pour les Directeurs

####1. Voir les alertes
- Aller sur la page directeur
- Section "🚨 Alertes" en haut
- Les alertes sont triées par gravité (critical > warning > info)

#### 2 Marquer comme lue
- Cliquer sur une alerte
- Elle est automatiquement marquée comme lue

## 🎯 Niveaux de gravité

| Retard | Gravité | Couleur | Action recommandée |
|--------|---------|---------|-------------------|
|1-15min | `info` | Bleu | Surveillance |
| 16-30 min | `warning` | Orange | Intervention |
| 31+ min | `critical` | Rouge | Intervention immédiate |

## 🔔 Notifications

### Types de notifications1*Notification push** : Envoyée immédiatement sur le téléphone2 **Notification in-app** : Affichée dans la section Alertes
3. **Email** : Optionnel (à configurer)

### Contenu des notifications
```
⚠️ Retard signalé
Retard de 25inutes signalé sur la tâcheTraitement Charcuterie" -400 colis
```

## 🛠️ Configuration

### Variables denvironnement
```javascript
// Dans app.config.js
extra: {
  supabaseUrl:https://vqwgnvrhcaosnjczuwth.supabase.co",
  supabaseAnonKey:your-anon-key,
}
```

### Permissions RLS
- **Managers** : Peuvent créer des alertes
- **Directeurs** : Peuvent voir, marquer comme lues, et supprimer les alertes de leur magasin

## 🔍 Dépannage

### Problèmes courants

#### 1Erreur lors de la création de l'alerte"
- Vérifier la connexion Supabase
- Vérifier les permissions RLS
- Vérifier que l'utilisateur est bien un manager

####2Les alertes n'apparaissent pas
- Vérifier que l'utilisateur est bien un directeur
- Vérifier que le directeur et le manager sont dans le même magasin
- Vérifier les politiques RLS

####3Notifications push ne fonctionnent pas"
- Vérifier les permissions de notification
- Vérifier la configuration Expo Notifications
- Vérifier le token de lappareil

### Logs de débogage
```javascript
// Dans la console
console.log('✅ Alerte de retard créée avec succès');
console.error('❌ Erreur lors de la création de l\'alerte:,error);
```

## 📊 Statistiques

### Requêtes utiles
```sql
-- Nombre dalertes par jour
SELECT DATE(created_at) as date, COUNT(*) as count
FROM alerts
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Alertes par gravité
SELECT severity, COUNT(*) as count
FROM alerts
GROUP BY severity;

-- Alertes non lues
SELECT COUNT(*) as unread_count
FROM alerts
WHERE is_read = false;
```

## 🔄 Maintenance

### Nettoyage automatique
```sql
-- Supprimer les alertes de plus de 30 jours
DELETE FROM alerts 
WHERE created_at < NOW() - INTERVAL '30ays;
```

### Sauvegarde
```sql
-- Exporter les alertes
SELECT * FROM alerts 
WHERE created_at >= NOW() - INTERVAL7 days
ORDER BY created_at DESC;
```

## 📞 Support

En cas de problème :
1. Vérifier les logs dans la console
2. Vérifier la base de données Supabase3ter avec un utilisateur de test
4Contacter l'équipe de développement

---

**Version** : 1.0  
**Dernière mise à jour** : Décembre224 
**Auteur** : Équipe Optines 