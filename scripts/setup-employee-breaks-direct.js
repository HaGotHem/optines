const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase directe (sans .env)
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

console.log('🔧 Configuration Supabase:');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? '✅ Présente' : '❌ Manquante');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration Supabase manquante');
  console.log('');
  console.log('📋 Pour configurer Supabase :');
  console.log('1. Allez dans votre dashboard Supabase');
  console.log('2. Settings > API > Project API keys');
  console.log('3. Copiez la clé "service_role"');
  console.log('4. Remplacez la valeur de supabaseServiceKey dans ce script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupEmployeeBreaks() {
  console.log('🚀 Configuration de la table employee_breaks...');

  try {
    // 1. Créer la table employee_breaks
    console.log('📋 Création de la table employee_breaks...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS employee_breaks (
          id BIGSERIAL PRIMARY KEY,
          employee_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          date DATE NOT NULL,
          break_type VARCHAR(50) DEFAULT 'pause' CHECK (break_type IN ('pause', 'dejeuner', 'formation', 'reunion', 'autre')),
          description TEXT,
          is_recurring BOOLEAN DEFAULT false,
          recurrence_pattern JSONB DEFAULT '{}'::jsonb,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tableError) {
      console.error('❌ Erreur lors de la création de la table:', tableError);
      return;
    }

    console.log('✅ Table employee_breaks créée avec succès');

    // 2. Créer les index
    console.log('📊 Création des index...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_employee_breaks_employee_id ON employee_breaks(employee_id);',
      'CREATE INDEX IF NOT EXISTS idx_employee_breaks_date ON employee_breaks(date);',
      'CREATE INDEX IF NOT EXISTS idx_employee_breaks_active ON employee_breaks(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_employee_breaks_time_range ON employee_breaks(start_time, end_time);'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.error('❌ Erreur lors de la création de l\'index:', indexError);
      } else {
        console.log('✅ Index créé');
      }
    }

    // 3. Créer la fonction pour mettre à jour updated_at
    console.log('⚙️ Création de la fonction update_updated_at_column...');
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `
    });

    if (functionError) {
      console.error('❌ Erreur lors de la création de la fonction:', functionError);
    } else {
      console.log('✅ Fonction update_updated_at_column créée');
    }

    // 4. Créer le trigger
    console.log('🔗 Création du trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS update_employee_breaks_updated_at ON employee_breaks;
        CREATE TRIGGER update_employee_breaks_updated_at 
          BEFORE UPDATE ON employee_breaks 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (triggerError) {
      console.error('❌ Erreur lors de la création du trigger:', triggerError);
    } else {
      console.log('✅ Trigger créé');
    }

    // 5. Créer la fonction pour calculer la durée
    console.log('🧮 Création de la fonction calculate_break_duration...');
    const { error: durationFunctionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION calculate_break_duration(start_time TIME, end_time TIME)
        RETURNS INTEGER AS $$
        BEGIN
          RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 60;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (durationFunctionError) {
      console.error('❌ Erreur lors de la création de la fonction de durée:', durationFunctionError);
    } else {
      console.log('✅ Fonction calculate_break_duration créée');
    }

    // 6. Créer la vue avec durée calculée
    console.log('👁️ Création de la vue employee_breaks_with_duration...');
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW employee_breaks_with_duration AS
        SELECT 
          eb.*,
          calculate_break_duration(eb.start_time, eb.end_time) as duration_minutes,
          tm.name as employee_name,
          tm.section as employee_section
        FROM employee_breaks eb
        JOIN team_members tm ON eb.employee_id = tm.id
        WHERE eb.is_active = true;
      `
    });

    if (viewError) {
      console.error('❌ Erreur lors de la création de la vue:', viewError);
    } else {
      console.log('✅ Vue employee_breaks_with_duration créée');
    }

    // 7. Insérer quelques données de test
    console.log('🧪 Insertion de données de test...');
    
    // Vérifier s'il y a des employés
    const { data: employees, error: employeesError } = await supabase
      .from('team_members')
      .select('id, name')
      .limit(3);

    if (employeesError) {
      console.error('❌ Erreur lors de la récupération des employés:', employeesError);
    } else if (employees && employees.length > 0) {
      const testBreaks = [
        {
          employee_id: employees[0].id,
          start_time: '12:00',
          end_time: '12:30',
          date: new Date().toISOString().split('T')[0],
          break_type: 'dejeuner',
          description: 'Pause déjeuner'
        },
        {
          employee_id: employees[0].id,
          start_time: '15:00',
          end_time: '15:15',
          date: new Date().toISOString().split('T')[0],
          break_type: 'pause',
          description: 'Pause café'
        }
      ];

      for (const testBreak of testBreaks) {
        const { error: insertError } = await supabase
          .from('employee_breaks')
          .insert([testBreak]);

        if (insertError) {
          console.error('❌ Erreur lors de l\'insertion du test:', insertError);
        } else {
          console.log(`✅ Pause de test créée pour ${employees[0].name}`);
        }
      }
    } else {
      console.log('ℹ️ Aucun employé trouvé pour créer des données de test');
    }

    console.log('');
    console.log('🎉 Configuration de employee_breaks terminée avec succès !');
    console.log('');
    console.log('📋 Résumé :');
    console.log('  ✅ Table employee_breaks créée');
    console.log('  ✅ Index créés');
    console.log('  ✅ Trigger pour updated_at configuré');
    console.log('  ✅ Fonction de calcul de durée créée');
    console.log('  ✅ Vue employee_breaks_with_duration créée');
    console.log('  ✅ Données de test insérées (si des employés existent)');
    console.log('');
    console.log('🚀 Vous pouvez maintenant utiliser le système de gestion des pauses !');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

// Exécuter le script
setupEmployeeBreaks(); 