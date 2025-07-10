-- =====================================================
-- TABLE: gdpr_consents (Consentements RGPD)
-- =====================================================
CREATE TABLE IF NOT EXISTS gdpr_consents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    accepted BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version VARCHAR(10) NOT NULL,
    data_processing JSONB NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user_id ON gdpr_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_timestamp ON gdpr_consents(timestamp);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_version ON gdpr_consents(version);

-- Politique RLS
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut lire" ON gdpr_consents FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut insérer" ON gdpr_consents FOR INSERT WITH CHECK (true);
CREATE POLICY "Tout le monde peut mettre à jour" ON gdpr_consents FOR UPDATE USING (true);
CREATE POLICY "Tout le monde peut supprimer" ON gdpr_consents FOR DELETE USING (true);

-- Commentaire
COMMENT ON TABLE gdpr_consents IS 'Table des consentements RGPD des utilisateurs';
COMMENT ON COLUMN gdpr_consents.data_processing IS 'Détail des consentements par catégorie de traitement'; 