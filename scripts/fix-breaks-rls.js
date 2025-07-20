const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase directe
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBreaksRLS() {
  console.log('🔧 Correction des politiques RLS pour la table breaks...');

  try {
    // Désactiver RLS temporairement pour permettre l'accès
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Désactiver RLS sur la table breaks
        ALTER TABLE public.breaks DISABLE ROW LEVEL SECURITY;
        
        -- Supprimer toutes les politiques existantes
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.breaks;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.breaks;
        DROP POLICY IF EXISTS "Enable update for users based on employee_id" ON public.breaks;
        DROP POLICY IF EXISTS "Enable delete for users based on employee_id" ON public.breaks;
        
        -- Créer une politique simple pour permettre l'accès complet
        CREATE POLICY "Enable all access for authenticated users" ON public.breaks
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
        
        -- Réactiver RLS
        ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;
      `
    });

    if (disableError) {
      console.error('❌ Erreur lors de la correction des politiques RLS:', disableError);
      console.log('\n💡 Solution alternative:');
      console.log('📋 Allez sur: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
      console.log('📋 Exécutez manuellement:');
      console.log(`
        ALTER TABLE public.breaks DISABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.breaks;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.breaks;
        DROP POLICY IF EXISTS "Enable update for users based on employee_id" ON public.breaks;
        DROP POLICY IF EXISTS "Enable delete for users based on employee_id" ON public.breaks;
        
        CREATE POLICY "Enable all access for authenticated users" ON public.breaks
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
        
        ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;
      `);
      return;
    }

    console.log('✅ Politiques RLS corrigées avec succès !');
    
    // Tester l'accès à la table
    const { data: testData, error: testError } = await supabase
      .from('breaks')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Erreur lors du test d\'accès:', testError);
    } else {
      console.log('✅ Test d\'accès réussi - la table breaks est maintenant accessible');
      console.log('📊 Nombre de pauses trouvées:', testData.length);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction des politiques RLS:', error);
  }
}

// Exécuter le script
fixBreaksRLS(); 