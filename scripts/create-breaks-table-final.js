const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase avec les bonnes clés
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY non définie dans les variables d\'environnement');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBreaksTable() {
  try {
    console.log('🔧 Création de la table breaks...');

    // SQL pour créer la table breaks
    const createTableSQL = `
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
    `;

    // Exécuter le SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ Erreur lors de la création de la table:', error);
      return;
    }

    console.log('✅ Table breaks créée avec succès!');

    // Vérifier que la table existe
    const { data: tableCheck, error: checkError } = await supabase
      .from('breaks')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Erreur lors de la vérification de la table:', checkError);
      return;
    }

    console.log('✅ Vérification réussie: la table breaks est accessible');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le script
createBreaksTable(); 