# Guide Rapide - Configuration des Horaires de Magasin

## 🚀 Configuration en 3 étapes

### Étape 1 : Créer la table working_hours dans Supabase

1. **Allez dans votre dashboard Supabase** :
   - URL : https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new

2. **Exécutez ce script SQL** :
```sql
-- Créer la table working_hours
CREATE TABLE IF NOT EXISTS working_hours (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id)
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_working_hours_store_active ON working_hours(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_working_hours_store_id ON working_hours(store_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_active ON working_hours(is_active);

-- Créer une contrainte pour s'assurer que l'heure de fin est après l'heure de début
ALTER TABLE working_hours ADD CONSTRAINT check_time_order CHECK (end_time > start_time);

-- Insérer des horaires par défaut pour les magasins existants
INSERT INTO working_hours (store_id, start_time, end_time, is_active)
SELECT 
  id as store_id,
  '06:00'::TIME as start_time,
  '21:00'::TIME as end_time,
  true as is_active
FROM stores 
WHERE is_active = true
ON CONFLICT (store_id) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_working_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_working_hours_updated_at
  BEFORE UPDATE ON working_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_working_hours_updated_at();
```

3. **Cliquez sur "Run"** pour exécuter le script

### Étape 2 : Vérifier la configuration

Exécutez cette commande dans votre terminal :
```bash
npm run setup-working-hours
```

Vous devriez voir :
```
✅ Table working_hours accessible
✅ 2 horaire(s) existant(s):
   - magasin test: 06:00 - 21:00
   - test magasin 2: 06:00 - 21:00
```

### Étape 3 : Tester la synchronisation

Exécutez cette commande :
```bash
npm run test-working-hours
```

Vous devriez voir :
```
🎉 Tests de synchronisation terminés avec succès !
📋 Résumé:
   - 2 magasin(s) configuré(s)
   - 2 horaire(s) défini(s)
   - X utilisateur(s) affecté(s)
   - Synchronisation en temps réel prête
```

## 🎯 Utilisation dans l'application

### Pour le Directeur
1. Se connecter en tant que directeur
2. Aller sur la page dashboard (`/directeur`)
3. Cliquer sur l'icône d'horloge
4. Configurer les horaires d'ouverture et de fermeture
5. Sauvegarder

### Pour les Managers
1. Se connecter en tant que manager
2. Les horaires sont automatiquement synchronisés
3. Utiliser les horaires pour planifier des tâches/événements

## 🔧 Dépannage

### Problème : "relation working_hours does not exist"
**Solution** : Exécutez le script SQL de l'étape 1

### Problème : "Invalid API key"
**Solution** : Vérifiez que les clés API sont correctes dans `app.config.js`

### Problème : Aucun magasin trouvé
**Solution** : Créez d'abord des magasins via le panel développeur

## ✅ Vérification finale

Après avoir suivi ces étapes, vous devriez avoir :
- ✅ Table `working_hours` créée
- ✅ Horaires par défaut configurés
- ✅ Synchronisation en temps réel activée
- ✅ Tests qui passent

---

**🎉 La synchronisation des horaires est maintenant prête !** 