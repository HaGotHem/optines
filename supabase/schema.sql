-- =====================================================
-- SCHEMA SUPABASE POUR L'APPLICATION OPTINES
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: stores (Magasins)
-- =====================================================
CREATE TABLE IF NOT EXISTS stores (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- =====================================================
-- TABLE: users (Utilisateurs - Managers et Directeurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'director', 'admin')),
    section VARCHAR(50),
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_section ON users(section);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);

-- =====================================================
-- TABLE: team_members (Membres d'équipe)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline', 'break')),
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    location VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar_url TEXT,
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('matin', 'après-midi', 'soir')),
    performance INTEGER DEFAULT 0 CHECK (performance >= 0 AND performance <= 100),
    tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
    manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_team_members_manager_id ON team_members(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_shift ON team_members(shift);
CREATE INDEX IF NOT EXISTS idx_team_members_performance ON team_members(performance);
CREATE INDEX IF NOT EXISTS idx_team_members_store_id ON team_members(store_id);

-- =====================================================
-- TABLE: scheduled_tasks (Tâches planifiées)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    packages INTEGER NOT NULL CHECK (packages >= 0),
    team_size INTEGER NOT NULL CHECK (team_size >= 0),
    manager_section VARCHAR(50) NOT NULL,
    manager_initials VARCHAR(10) NOT NULL,
    palette_condition BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_manager_id ON scheduled_tasks(manager_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_date ON scheduled_tasks(date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_completed ON scheduled_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_pinned ON scheduled_tasks(is_pinned);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_section ON scheduled_tasks(manager_section);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_store_id ON scheduled_tasks(store_id);

-- =====================================================
-- TABLE: task_assignments (Assignations de tâches)
-- =====================================================
CREATE TABLE IF NOT EXISTS task_assignments (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
    team_member_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, team_member_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_team_member_id ON task_assignments(team_member_id);

-- =====================================================
-- TABLE: user_preferences (Préférences utilisateur)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications_enabled BOOLEAN DEFAULT true,
    reminder_time INTEGER DEFAULT 15 CHECK (reminder_time >= 0 AND reminder_time <= 60),
    language VARCHAR(10) DEFAULT 'fr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_tasks_updated_at BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Insérer des magasins de test
INSERT INTO stores (name, address, phone, email, manager_count, is_active) VALUES
('Magasin Paris Centre', '123 Rue de Rivoli, 75001 Paris', '01.42.60.30.30', 'paris@magasin.fr', 0, true),
('Magasin Lyon Part-Dieu', '456 Cours Lafayette, 69003 Lyon', '04.78.63.40.40', 'lyon@magasin.fr', 0, true),
('Magasin Marseille Vieux-Port', '789 Quai du Port, 13002 Marseille', '04.91.54.70.70', 'marseille@magasin.fr', 0, true)
ON CONFLICT DO NOTHING;

-- Insérer des utilisateurs de test
INSERT INTO users (username, password_hash, full_name, role, section, store_id, is_active) VALUES
('manager1', 'hashed_password_1', 'Jean Dupont', 'manager', 'Section A', 1, true),
('manager2', 'hashed_password_2', 'Marie Martin', 'manager', 'Section B', 1, true),
('directeur1', 'hashed_password_3', 'Pierre Durand', 'director', NULL, 1, true),
('admin', 'hashed_password_admin', 'Administrateur Système', 'admin', NULL, 1, true),
('manager_lyon1', 'hashed_password_4', 'Sophie Bernard', 'manager', 'Section A', 2, true),
('directeur_lyon1', 'hashed_password_5', 'Thomas Leroy', 'director', NULL, 2, true)
ON CONFLICT (username) DO NOTHING;

-- Insérer des membres d'équipe de test
INSERT INTO team_members (name, role, status, rating, location, phone, email, shift, performance, tasks_completed, manager_id, store_id) VALUES
('Marie Dubois', 'Opérateur', 'online', 4, 'Zone 1', '0123456789', 'marie@example.com', 'matin', 85, 12, 1, 1),
('Pierre Martin', 'Superviseur', 'busy', 5, 'Zone 2', '0987654321', 'pierre@example.com', 'après-midi', 92, 18, 1, 1),
('Sophie Bernard', 'Opérateur', 'offline', 3, 'Zone 3', '0555666777', 'sophie@example.com', 'soir', 78, 8, 2, 1),
('Thomas Leroy', 'Superviseur', 'online', 4, 'Zone 4', '0444333222', 'thomas@example.com', 'matin', 88, 15, 2, 1),
('Claire Moreau', 'Opérateur', 'online', 4, 'Zone 1', '0666777888', 'claire@example.com', 'matin', 82, 10, 5, 2),
('Antoine Rousseau', 'Superviseur', 'busy', 5, 'Zone 2', '0777888999', 'antoine@example.com', 'après-midi', 90, 16, 5, 2)
ON CONFLICT DO NOTHING;

-- Insérer des tâches de test
INSERT INTO scheduled_tasks (title, start_time, end_time, duration, date, packages, team_size, manager_section, manager_initials, palette_condition, manager_id, store_id) VALUES
('Livraison Express', '08:00:00', '10:00:00', '2h', CURRENT_DATE, 150, 3, 'Section A', 'JD', false, 1, 1),
('Tri Matinal', '06:00:00', '08:00:00', '2h', CURRENT_DATE, 200, 2, 'Section A', 'JD', true, 1, 1),
('Préparation Commandes', '14:00:00', '16:00:00', '2h', CURRENT_DATE, 120, 4, 'Section B', 'MM', false, 2, 1),
('Livraison Lyon', '09:00:00', '11:00:00', '2h', CURRENT_DATE, 180, 2, 'Section A', 'SB', false, 5, 2)
ON CONFLICT DO NOTHING;

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques pour les magasins (accès complet pour les admins)
-- CREATE POLICY "Admins can manage all stores" ON stores
--     FOR ALL USING (auth.uid()::bigint IN (SELECT id FROM users WHERE role = 'admin'));

-- CREATE POLICY "Users can view their own store" ON stores
--     FOR SELECT USING (id IN (SELECT store_id FROM users WHERE id = auth.uid()::bigint));

-- Politiques pour les utilisateurs (isolation par magasin)
-- CREATE POLICY "Users can view users from same store" ON users
--     FOR SELECT USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()::bigint));

-- CREATE POLICY "Admins can manage all users" ON users
--     FOR ALL USING (auth.uid()::bigint IN (SELECT id FROM users WHERE role = 'admin'));

-- Politiques pour les membres d'équipe (isolation par magasin)
-- CREATE POLICY "Managers can view team members from same store" ON team_members
--     FOR SELECT USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()::bigint));

-- CREATE POLICY "Managers can manage their team members" ON team_members
--     FOR ALL USING (manager_id = auth.uid()::bigint);

-- Politiques pour les tâches (isolation par magasin)
-- CREATE POLICY "Users can view tasks from same store" ON scheduled_tasks
--     FOR SELECT USING (store_id IN (SELECT store_id FROM users WHERE id = auth.uid()::bigint));

-- CREATE POLICY "Managers can manage their tasks" ON scheduled_tasks
--     FOR ALL USING (manager_id = auth.uid()::bigint);

-- Politiques pour les assignations
-- CREATE POLICY "Managers can view task assignments" ON task_assignments
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM scheduled_tasks 
--             WHERE scheduled_tasks.id = task_assignments.task_id 
--             AND scheduled_tasks.manager_id = auth.uid()::bigint
--         )
--     );

-- CREATE POLICY "Managers can manage task assignments" ON task_assignments
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM scheduled_tasks 
--             WHERE scheduled_tasks.id = task_assignments.task_id 
--             AND scheduled_tasks.manager_id = auth.uid()::bigint
--         )
--     );

-- Politiques pour les préférences
-- CREATE POLICY "Users can view their preferences" ON user_preferences
--     FOR SELECT USING (user_id = auth.uid()::bigint);

-- CREATE POLICY "Users can manage their preferences" ON user_preferences
--     FOR ALL USING (user_id = auth.uid()::bigint);

-- Politiques ouvertes pour le développement (à restreindre en prod)
CREATE POLICY "Tout le monde peut lire" ON stores FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut lire" ON users FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut lire" ON team_members FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut lire" ON scheduled_tasks FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut lire" ON task_assignments FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut lire" ON user_preferences FOR SELECT USING (true);

CREATE POLICY "Tout le monde peut insérer" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Tout le monde peut insérer" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Tout le monde peut insérer" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Tout le monde peut insérer" ON scheduled_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Tout le monde peut insérer" ON task_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Tout le monde peut insérer" ON user_preferences FOR INSERT WITH CHECK (true);

CREATE POLICY "Tout le monde peut mettre à jour" ON stores FOR UPDATE USING (true);
CREATE POLICY "Tout le monde peut mettre à jour" ON users FOR UPDATE USING (true);
CREATE POLICY "Tout le monde peut mettre à jour" ON team_members FOR UPDATE USING (true);
CREATE POLICY "Tout le monde peut mettre à jour" ON scheduled_tasks FOR UPDATE USING (true);
CREATE POLICY "Tout le monde peut mettre à jour" ON task_assignments FOR UPDATE USING (true);
CREATE POLICY "Tout le monde peut mettre à jour" ON user_preferences FOR UPDATE USING (true);

CREATE POLICY "Tout le monde peut supprimer" ON stores FOR DELETE USING (true);
CREATE POLICY "Tout le monde peut supprimer" ON users FOR DELETE USING (true);
CREATE POLICY "Tout le monde peut supprimer" ON team_members FOR DELETE USING (true);
CREATE POLICY "Tout le monde peut supprimer" ON scheduled_tasks FOR DELETE USING (true);
CREATE POLICY "Tout le monde peut supprimer" ON task_assignments FOR DELETE USING (true);
CREATE POLICY "Tout le monde peut supprimer" ON user_preferences FOR DELETE USING (true);

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les statistiques par magasin
CREATE OR REPLACE VIEW store_stats AS
SELECT 
    s.id,
    s.name as store_name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.role = 'manager' THEN u.id END) as managers_count,
    COUNT(DISTINCT CASE WHEN u.role = 'director' THEN u.id END) as directors_count,
    COUNT(DISTINCT tm.id) as team_members_count,
    COUNT(DISTINCT st.id) as tasks_count,
    s.is_active
FROM stores s
LEFT JOIN users u ON s.id = u.store_id
LEFT JOIN team_members tm ON s.id = tm.store_id
LEFT JOIN scheduled_tasks st ON s.id = st.store_id
GROUP BY s.id, s.name, s.is_active;

-- Vue pour les utilisateurs avec informations de magasin
CREATE OR REPLACE VIEW users_with_store AS
SELECT 
    u.*,
    s.name as store_name,
    s.address as store_address
FROM users u
JOIN stores s ON u.store_id = s.id;

-- Vue pour les tâches avec assignations
CREATE OR REPLACE VIEW tasks_with_assignments AS
SELECT 
    st.*,
    s.name as store_name,
    u.full_name as manager_name,
    COUNT(ta.team_member_id) as assigned_members
FROM scheduled_tasks st
JOIN stores s ON st.store_id = s.id
JOIN users u ON st.manager_id = u.id
LEFT JOIN task_assignments ta ON st.id = ta.task_id
GROUP BY st.id, s.name, u.full_name;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE stores IS 'Table des magasins';
COMMENT ON TABLE users IS 'Table des utilisateurs (managers et directeurs)';
COMMENT ON TABLE team_members IS 'Table des membres d''équipe gérés par les managers';
COMMENT ON TABLE scheduled_tasks IS 'Table des tâches planifiées';
COMMENT ON TABLE task_assignments IS 'Table de liaison entre tâches et membres d''équipe';
COMMENT ON TABLE user_preferences IS 'Table des préférences utilisateur';

COMMENT ON COLUMN stores.manager_count IS 'Nombre de managers assignés au magasin';
COMMENT ON COLUMN users.password_hash IS 'Mot de passe haché avec SHA256 + salt';
COMMENT ON COLUMN team_members.status IS 'Statut en temps réel du membre (online, busy, offline, break)';
COMMENT ON COLUMN scheduled_tasks.palette_condition IS 'Condition de la palette (true = bonne condition)';
COMMENT ON COLUMN scheduled_tasks.is_pinned IS 'Tâche épinglée pour priorité'; 