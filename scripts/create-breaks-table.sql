-- Création de la table breaks pour la gestion des pauses des employés
CREATE TABLE IF NOT EXISTS public.breaks (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date DATE NOT NULL,
    break_type VARCHAR(50) NOT NULL DEFAULT 'pause' CHECK (break_type IN ('pause', 'dejeuner', 'formation', 'reunion', 'autre')),
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_days INTEGER[] DEFAULT '{}',
    recurrence_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_breaks_employee_id ON public.breaks(employee_id);
CREATE INDEX IF NOT EXISTS idx_breaks_date ON public.breaks(date);
CREATE INDEX IF NOT EXISTS idx_breaks_employee_date ON public.breaks(employee_id, date);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_breaks_updated_at 
    BEFORE UPDATE ON public.breaks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur la table
COMMENT ON TABLE public.breaks IS 'Table pour gérer les pauses des employés avec support de répétition';
COMMENT ON COLUMN public.breaks.employee_id IS 'ID de l''employé';
COMMENT ON COLUMN public.breaks.start_time IS 'Heure de début de la pause';
COMMENT ON COLUMN public.breaks.end_time IS 'Heure de fin de la pause';
COMMENT ON COLUMN public.breaks.date IS 'Date de la pause';
COMMENT ON COLUMN public.breaks.break_type IS 'Type de pause (pause, dejeuner, formation, reunion, autre)';
COMMENT ON COLUMN public.breaks.description IS 'Description optionnelle de la pause';
COMMENT ON COLUMN public.breaks.is_recurring IS 'Indique si la pause se répète';
COMMENT ON COLUMN public.breaks.recurrence_days IS 'Jours de la semaine où la pause se répète (0=Dimanche, 1=Lundi, etc.)';
COMMENT ON COLUMN public.breaks.recurrence_end_date IS 'Date de fin de la répétition (optionnel)'; 