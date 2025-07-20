-- =====================================================
-- CRÉATION DE LA TABLE WORKING_HOURS
-- POUR LA SYNCHRONISATION DES HORAIRES DE MAGASIN
-- =====================================================

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

-- Vérifier que la table a été créée correctement
SELECT 
  '✅ Table working_hours créée avec succès' as status,
  COUNT(*) as total_horaires,
  COUNT(DISTINCT store_id) as magasins_avec_horaires
FROM working_hours 
WHERE is_active = true;

-- Afficher les horaires créés
SELECT 
  wh.id,
  wh.store_id,
  s.name as store_name,
  wh.start_time,
  wh.end_time,
  wh.is_active,
  wh.created_at
FROM working_hours wh
JOIN stores s ON wh.store_id = s.id
WHERE wh.is_active = true
ORDER BY wh.store_id; 