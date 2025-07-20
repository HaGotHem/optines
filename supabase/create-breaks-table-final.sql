-- Script final pour créer la table breaks
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Créer la table breaks (sans supprimer si elle existe)
CREATE TABLE IF NOT EXISTS public.breaks (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    break_type VARCHAR(50) NOT NULL DEFAULT 'pause' CHECK (break_type IN ('pause', 'dejeuner', 'cafe')),
    description TEXT,
    repeat_days INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index (s'ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_breaks_employee_id ON public.breaks(employee_id);
CREATE INDEX IF NOT EXISTS idx_breaks_date ON public.breaks(date);
CREATE INDEX IF NOT EXISTS idx_breaks_employee_date ON public.breaks(employee_id, date);

-- Créer le trigger (s'il n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_breaks_updated_at') THEN
        CREATE TRIGGER update_breaks_updated_at 
            BEFORE UPDATE ON public.breaks 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Activer RLS
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.breaks;

-- Créer la politique RLS
CREATE POLICY "Enable all access for authenticated users" ON public.breaks
    FOR ALL USING (auth.role() = 'authenticated');

-- Message de confirmation
SELECT 'Table breaks créée ou mise à jour avec succès!' as message; 