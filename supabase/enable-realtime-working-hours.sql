-- =====================================================
-- ACTIVATION DES SUBSCRIPTIONS EN TEMPS RÉEL
-- POUR LA SYNCHRONISATION DES HORAIRES DE MAGASIN
-- =====================================================

-- Activer les subscriptions en temps réel pour la table working_hours
ALTER PUBLICATION supabase_realtime ADD TABLE working_hours;

-- Vérifier que la publication est active
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'working_hours';

-- Créer un trigger pour notifier les changements
CREATE OR REPLACE FUNCTION notify_working_hours_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notifier les changements via pg_notify
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify(
            'working_hours_changes',
            json_build_object(
                'event', 'INSERT',
                'store_id', NEW.store_id,
                'start_time', NEW.start_time,
                'end_time', NEW.end_time
            )::text
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify(
            'working_hours_changes',
            json_build_object(
                'event', 'UPDATE',
                'store_id', NEW.store_id,
                'start_time', NEW.start_time,
                'end_time', NEW.end_time
            )::text
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM pg_notify(
            'working_hours_changes',
            json_build_object(
                'event', 'DELETE',
                'store_id', OLD.store_id
            )::text
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table working_hours
DROP TRIGGER IF EXISTS working_hours_notify_trigger ON working_hours;
CREATE TRIGGER working_hours_notify_trigger
    AFTER INSERT OR UPDATE OR DELETE ON working_hours
    FOR EACH ROW EXECUTE FUNCTION notify_working_hours_change();

-- Vérifier que le trigger est créé
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'working_hours_notify_trigger';

-- Message de confirmation
SELECT '✅ Subscriptions en temps réel activées pour working_hours' as status; 