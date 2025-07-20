-- Créer la table breaks
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

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_breaks_employee_id ON public.breaks(employee_id);
CREATE INDEX IF NOT EXISTS idx_breaks_date ON public.breaks(date);
CREATE INDEX IF NOT EXISTS idx_breaks_employee_date ON public.breaks(employee_id, date);

-- Activer RLS
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;

-- Créer la politique RLS
CREATE POLICY "Enable all access for authenticated users" ON public.breaks
    FOR ALL USING (auth.role() = 'authenticated');

-- Message de confirmation
SELECT 'Table breaks créée avec succès!' as message; 