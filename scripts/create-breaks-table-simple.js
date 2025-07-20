const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase avec la clé anonyme (pour les opérations de lecture)
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndCreateBreaksTable() {
  try {
    console.log('🔍 Vérification de l\'existence de la table breaks...');

    // Essayer d'accéder à la table breaks
    const { data, error } = await supabase
      .from('breaks')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️ La table breaks n\'existe pas encore');
        console.log('📝 Pour créer la table breaks, vous devez:');
        console.log('1. Aller sur https://supabase.com/dashboard/project/vqwgnvrhcaosnjczuwth');
        console.log('2. Cliquer sur "SQL Editor" dans le menu de gauche');
        console.log('3. Exécuter le script SQL suivant:');
        console.log('');
        console.log('-- Créer la table breaks');
        console.log('CREATE TABLE IF NOT EXISTS public.breaks (');
        console.log('    id SERIAL PRIMARY KEY,');
        console.log('    employee_id INTEGER NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,');
        console.log('    start_time TIME NOT NULL,');
        console.log('    end_time TIME NOT NULL,');
        console.log('    date DATE NOT NULL,');
        console.log('    break_type VARCHAR(50) NOT NULL DEFAULT \'pause\' CHECK (break_type IN (\'pause\', \'dejeuner\', \'cafe\')),');
        console.log('    description TEXT,');
        console.log('    repeat_days INTEGER[] DEFAULT \'{}\',');
        console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('-- Créer les index');
        console.log('CREATE INDEX IF NOT EXISTS idx_breaks_employee_id ON public.breaks(employee_id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_breaks_date ON public.breaks(date);');
        console.log('CREATE INDEX IF NOT EXISTS idx_breaks_employee_date ON public.breaks(employee_id, date);');
        console.log('');
        console.log('-- Activer RLS');
        console.log('ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('-- Créer la politique RLS');
        console.log('CREATE POLICY "Enable all access for authenticated users" ON public.breaks');
        console.log('    FOR ALL USING (auth.role() = \'authenticated\');');
        console.log('');
        console.log('✅ Après avoir exécuté ce script, l\'erreur 404 devrait disparaître');
        return;
      } else {
        console.error('❌ Erreur lors de la vérification:', error);
        return;
      }
    }

    console.log('✅ La table breaks existe déjà et est accessible!');
    console.log('📊 Nombre d\'enregistrements dans la table:', data ? data.length : 0);

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le script
checkAndCreateBreaksTable(); 