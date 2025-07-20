const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupWorkingHoursSimple() {
  console.log('🔧 Configuration simple des horaires de magasin');
  console.log('===============================================');

  try {
    // 1. Vérifier que la table stores existe et récupérer les magasins
    console.log('\n1. Vérification des magasins existants...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('is_active', true);

    if (storesError) {
      console.error('❌ Erreur lors de la récupération des magasins:', storesError);
      console.log('💡 Vous devez d\'abord créer la table stores et insérer des magasins');
      console.log('   Exécutez le script SQL dans Supabase Dashboard:');
      console.log('   - Allez dans Supabase Dashboard → SQL Editor');
      console.log('   - Exécutez le contenu de supabase/create-working-hours-table.sql');
      return;
    }

    console.log(`✅ ${stores.length} magasin(s) trouvé(s):`);
    stores.forEach(store => {
      console.log(`   - ${store.name} (ID: ${store.id})`);
    });

    // 2. Vérifier si la table working_hours existe
    console.log('\n2. Vérification de la table working_hours...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('working_hours')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table working_hours non trouvée:', tableError.message);
      console.log('\n💡 Pour créer la table working_hours:');
      console.log('   1. Allez dans Supabase Dashboard → SQL Editor');
      console.log('   2. Exécutez le contenu de supabase/create-working-hours-table.sql');
      console.log('   3. Relancez ce script');
      return;
    }

    console.log('✅ Table working_hours accessible');

    // 3. Vérifier les horaires existants
    console.log('\n3. Vérification des horaires existants...');
    const { data: existingHours, error: hoursError } = await supabase
      .from('working_hours')
      .select(`
        *,
        stores (name)
      `)
      .eq('is_active', true);

    if (hoursError) {
      console.error('❌ Erreur lors de la récupération des horaires:', hoursError);
      return;
    }

    console.log(`✅ ${existingHours.length} horaire(s) existant(s):`);
    existingHours.forEach(hours => {
      console.log(`   - ${hours.stores.name}: ${hours.start_time} - ${hours.end_time}`);
    });

    // 4. Créer des horaires pour les magasins qui n'en ont pas
    console.log('\n4. Création des horaires manquants...');
    const storesWithHours = existingHours.map(h => h.store_id);
    const storesWithoutHours = stores.filter(store => !storesWithHours.includes(store.id));

    if (storesWithoutHours.length === 0) {
      console.log('✅ Tous les magasins ont déjà des horaires configurés');
    } else {
      console.log(`${storesWithoutHours.length} magasin(s) sans horaires:`);
      storesWithoutHours.forEach(store => {
        console.log(`   - ${store.name} (ID: ${store.id})`);
      });

      // Créer les horaires par défaut
      const defaultHours = storesWithoutHours.map(store => ({
        store_id: store.id,
        start_time: '06:00',
        end_time: '21:00',
        is_active: true
      }));

      const { data: newHours, error: insertError } = await supabase
        .from('working_hours')
        .insert(defaultHours)
        .select(`
          *,
          stores (name)
        `);

      if (insertError) {
        console.error('❌ Erreur lors de la création des horaires:', insertError);
        return;
      }

      console.log(`✅ ${newHours.length} horaire(s) créé(s):`);
      newHours.forEach(hours => {
        console.log(`   - ${hours.stores.name}: ${hours.start_time} - ${hours.end_time}`);
      });
    }

    // 5. Test de mise à jour d'horaires
    console.log('\n5. Test de mise à jour d\'horaires...');
    const testStore = stores[0];
    if (testStore) {
      const updatedHours = {
        store_id: testStore.id,
        start_time: '07:00',
        end_time: '22:00',
        is_active: true
      };

      const { data: updatedData, error: updateError } = await supabase
        .from('working_hours')
        .upsert(updatedHours)
        .select(`
          *,
          stores (name)
        `)
        .single();

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour des horaires:', updateError);
      } else {
        console.log('✅ Test de mise à jour réussi:', {
          store: updatedData.stores.name,
          start_time: updatedData.start_time,
          end_time: updatedData.end_time
        });
      }
    }

    // 6. Vérification finale
    console.log('\n6. Vérification finale...');
    const { data: finalHours, error: finalError } = await supabase
      .from('working_hours')
      .select(`
        *,
        stores (name)
      `)
      .eq('is_active', true);

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError);
      return;
    }

    console.log('\n🎉 Configuration terminée avec succès !');
    console.log('\n📊 Résumé final:');
    console.log(`   - ${stores.length} magasin(s) configuré(s)`);
    console.log(`   - ${finalHours.length} horaire(s) actif(s)`);
    
    finalHours.forEach(hours => {
      console.log(`   - ${hours.stores.name}: ${hours.start_time} - ${hours.end_time}`);
    });

    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Exécuter: npm run test-working-hours');
    console.log('   2. Tester la synchronisation dans l\'application');
    console.log('   3. Configurer les horaires via l\'interface directeur');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

// Exécuter la configuration
setupWorkingHoursSimple(); 