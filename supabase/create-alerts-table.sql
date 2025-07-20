-- =====================================================
-- TABLE: alerts (Alertes de retard)
-- =====================================================

-- Activer l'extension uuid si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_alerts_task_id ON alerts(task_id);
CREATE INDEX IF NOT EXISTS idx_alerts_manager_id ON alerts(manager_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

-- RLS (Row Level Security)
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux directeurs de voir toutes les alertes de leur magasin
DROP POLICY IF EXISTS "Directeurs peuvent voir les alertes de leur magasin" ON alerts;
CREATE POLICY "Directeurs peuvent voir les alertes de leur magasin" ON alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()
            AND u.role = 'director'
            AND u.store_id = (
                SELECT u2.store_id FROM users u2
                WHERE u2.id::text = alerts.manager_id::text
            )
        )
    );

-- Politique pour permettre aux managers de créer des alertes
DROP POLICY IF EXISTS "Managers peuvent créer des alertes" ON alerts;
CREATE POLICY "Managers peuvent créer des alertes" ON alerts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()
            AND u.role = 'manager'
            AND u.id::text = alerts.manager_id::text
        )
    );

-- Politique pour permettre aux directeurs de marquer les alertes comme lues
DROP POLICY IF EXISTS "Directeurs peuvent marquer les alertes comme lues" ON alerts;
CREATE POLICY "Directeurs peuvent marquer les alertes comme lues" ON alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()
            AND u.role = 'director'
            AND u.store_id = (
                SELECT u2.store_id FROM users u2
                WHERE u2.id::text = alerts.manager_id::text
            )
        )
    );

-- Politique pour permettre aux directeurs de supprimer les alertes
DROP POLICY IF EXISTS "Directeurs peuvent supprimer les alertes" ON alerts;
CREATE POLICY "Directeurs peuvent supprimer les alertes" ON alerts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()
            AND u.role = 'director'
            AND u.store_id = (
                SELECT u2.store_id FROM users u2
                WHERE u2.id::text = alerts.manager_id::text
            )
        )
    ); 