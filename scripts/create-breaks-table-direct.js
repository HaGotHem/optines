const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase directe
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBreaksTable() {
  console.log('🚀 Création de la table breaks...');

  try {
    // Vérifier si la table existe déjà
    const { data: existingTable, error: checkError } = await supabase
      .from('breaks')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('relation "breaks" does not exist')) {
      console.log('📋 La table breaks n\'existe pas, création en cours...');
      
      // Créer la table via l'API SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
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

          -- Index pour améliorer les performances
          CREATE INDEX IF NOT EXISTS idx_breaks_employee_id ON public.breaks(employee_id);
          CREATE INDEX IF NOT EXISTS idx_breaks_date ON public.breaks(date);
          CREATE INDEX IF NOT EXISTS idx_breaks_start_time ON public.breaks(start_time);
          CREATE INDEX IF NOT EXISTS idx_breaks_break_type ON public.breaks(break_type);

          -- Trigger pour mettre à jour automatiquement updated_at
          CREATE OR REPLACE FUNCTION update_breaks_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ language 'plpgsql';

          DROP TRIGGER IF EXISTS update_breaks_updated_at_trigger ON public.breaks;
          CREATE TRIGGER update_breaks_updated_at_trigger
            BEFORE UPDATE ON public.breaks
            FOR EACH ROW
            EXECUTE FUNCTION update_breaks_updated_at();
        `
      });

      if (error) {
        console.error('❌ Erreur lors de la création de la table breaks:', error);
        console.log('\n💡 Solution alternative:');
        console.log('📋 Allez sur: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
        console.log('📋 Copiez et collez le contenu du fichier: supabase/create-breaks-table-simple.sql');
        return;
      }

      console.log('✅ Table breaks créée avec succès !');
      
      // Vérifier que la table a été créée
      const { data: verifyData, error: verifyError } = await supabase
        .from('breaks')
        .select('id')
        .limit(1);

      if (verifyError) {
        console.error('❌ Erreur lors de la vérification:', verifyError);
      } else {
        console.log('✅ Vérification réussie - la table breaks est maintenant accessible');
      }

    } else {
      console.log('✅ La table breaks existe déjà');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de la table breaks:', error);
    console.log('\n💡 Solution alternative:');
    console.log('📋 Allez sur: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
    console.log('📋 Copiez et collez le contenu du fichier: supabase/create-breaks-table-simple.sql');
  }
}

// Exécuter le script
createBreaksTable(); 