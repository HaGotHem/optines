-- Script de vérification de la base de données Supabase
-- À exécuter dans le SQL Editor de Supabase

-- 1. Vérifier les tables existantes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Vérifier les utilisateurs
SELECT 
    id,
    username,
    email,
    role,
    created_at
FROM users
ORDER BY created_at DESC;

-- 3. Vérifier les membres d'équipe
SELECT 
    id,
    name,
    role,
    status,
    manager_id,
    created_at
FROM team_members
ORDER BY created_at DESC;

-- 4. Vérifier les tâches
SELECT 
    id,
    title,
    date,
    start_time,
    end_time,
    is_completed,
    is_pinned,
    manager_id,
    created_at
FROM tasks
ORDER BY created_at DESC;

-- 5. Vérifier les assignations
SELECT 
    ta.id,
    ta.task_id,
    ta.team_member_id,
    t.title as task_title,
    tm.name as member_name,
    ta.assigned_at
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
JOIN team_members tm ON ta.team_member_id = tm.id
ORDER BY ta.assigned_at DESC;

-- 6. Vérifier les préférences utilisateur
SELECT 
    id,
    user_id,
    theme,
    notifications_enabled,
    created_at
FROM user_preferences
ORDER BY created_at DESC;

-- 7. Vérifier la vue tasks_with_assignments
SELECT 
    id,
    title,
    date,
    assigned_members,
    is_completed,
    is_pinned
FROM tasks_with_assignments
ORDER BY created_at DESC;

-- 8. Compter les enregistrements par table
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'team_members' as table_name,
    COUNT(*) as record_count
FROM team_members
UNION ALL
SELECT 
    'tasks' as table_name,
    COUNT(*) as record_count
FROM tasks
UNION ALL
SELECT 
    'task_assignments' as table_name,
    COUNT(*) as record_count
FROM task_assignments
UNION ALL
SELECT 
    'user_preferences' as table_name,
    COUNT(*) as record_count
FROM user_preferences; 