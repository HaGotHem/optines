-- Script ultra-simple pour créer la table team_members SANS contraintes
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer la table si elle existe déjà (pour repartir à zéro)
DROP TABLE IF EXISTS team_members;

-- 2. Créer la table team_members sans contraintes de clés étrangères
CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    rating INTEGER DEFAULT 5,
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    avatar_url TEXT,
    shift VARCHAR(50) NOT NULL,
    performance INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    manager_id TEXT,
    store_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insérer des employés de test
INSERT INTO team_members (name, role, section, status, rating, location, phone, email, shift, performance, tasks_completed, store_id)
VALUES 
    ('Marie Dubois', 'Opérateur', 'Section A', 'offline', 5, 'Zone de réception', '01.23.45.67.89', 'marie.dubois@magasin.fr', 'matin', 85, 127, 1),
    ('Pierre Martin', 'Superviseur', 'Section A', 'offline', 4, 'Zone de préparation', '01.23.45.67.90', 'pierre.martin@magasin.fr', 'après-midi', 92, 156, 1),
    ('Sophie Laurent', 'Opérateur', 'Section B', 'offline', 5, 'Zone d''expédition', '01.23.45.67.91', 'sophie.laurent@magasin.fr', 'matin', 78, 98, 1),
    ('Antoine Moreau', 'Technicien', 'Section B', 'offline', 4, 'Zone de maintenance', '01.23.45.67.92', 'antoine.moreau@magasin.fr', 'soir', 88, 143, 1),
    ('Julie Bernard', 'Opérateur', 'Section A', 'offline', 5, 'Zone de stockage', '01.23.45.67.93', 'julie.bernard@magasin.fr', 'matin', 91, 134, 1);

-- 4. Vérification simple
SELECT 'Table team_members créée avec succès!' as status;
SELECT 'Nombre d''employés ajoutés:' as info, COUNT(*) as count FROM team_members;

-- 5. Afficher les employés créés
SELECT id, name, role, section, location, shift, store_id FROM team_members ORDER BY id; 