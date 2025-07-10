const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODc0MjQsImV4cCI6MjA2NzU2MzQyNH0.3R5XkNZGMLmLUI1A5iExLnhsIyiwIyz0Azu7eInQHq4';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Générateur automatique de tâches quotidiennes
 * Ce script doit être exécuté chaque jour (via cron ou autre)
 * pour générer les tâches basées sur les événements récurrents
 */
async function generateDailyTasks() {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  console.log(`📅 Génération des tâches pour le ${todayString}`);
  console.log(`🕐 Heure d'exécution: ${today.toLocaleString('fr-FR')}`);
  
  try {
    // Vérifier que les tables existent
    const { data: tablesCheck, error: tablesError } = await supabase
      .from('scheduled_events')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.log('❌ Erreur: Tables non trouvées. Le schéma SQL n\'a pas été appliqué.');
      console.log('🔗 Exécutez le schéma SQL depuis: https://vqwgnvrhcaosnjczuwth.supabase.co/project/vqwgnvrhcaosnjczuwth/sql/new');
      process.exit(1);
    }
    
    // Générer les tâches pour aujourd'hui
    console.log('🔄 Génération des tâches...');
    
    const { data: generatedCount, error: generateError } = await supabase
      .rpc('generate_tasks_for_date', {
        target_date: todayString
      });
    
    if (generateError) {
      console.error('❌ Erreur lors de la génération:', generateError.message);
      throw generateError;
    }
    
    const tasksGenerated = generatedCount || 0;
    console.log(`✅ ${tasksGenerated} tâche(s) générée(s) pour aujourd'hui`);
    
    if (tasksGenerated > 0) {
      // Récupérer les détails des tâches générées
      const { data: todayTasks, error: tasksError } = await supabase
        .from('generated_tasks')
        .select(`
          *,
          scheduled_events (
            title,
            manager_section,
            recurrence_type
          ),
          scheduled_tasks (
            id,
            title,
            start_time,
            end_time,
            packages,
            team_size
          )
        `)
        .eq('generated_for_date', todayString)
        .order('scheduled_tasks(start_time)', { ascending: true });
      
      if (tasksError) {
        console.log('⚠️  Tâches générées mais erreur lors de la récupération des détails:', tasksError.message);
      } else {
        console.log('\n📋 Détail des tâches générées:');
        todayTasks.forEach((gt, index) => {
          const task = gt.scheduled_tasks;
          const event = gt.scheduled_events;
          console.log(`   ${index + 1}. ${task.title}`);
          console.log(`      ⏰ ${task.start_time} - ${task.end_time}`);
          console.log(`      📦 ${task.packages} colis, 👥 ${task.team_size} équipier(s)`);
          console.log(`      🔄 Source: ${event.title} (${event.recurrence_type})`);
          console.log('');
        });
      }
    }
    
    // Statistiques des événements actifs
    const { data: activeEvents, error: eventsError } = await supabase
      .from('scheduled_events')
      .select('id, title, recurrence_type, start_date, end_date')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (eventsError) {
      console.log('⚠️  Erreur lors de la récupération des événements actifs:', eventsError.message);
    } else {
      console.log(`\n📊 ${activeEvents.length} événement(s) récurrent(s) actif(s):`);
      
      const eventsByType = activeEvents.reduce((acc, event) => {
        acc[event.recurrence_type] = (acc[event.recurrence_type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(eventsByType).forEach(([type, count]) => {
        const typeNames = {
          'daily': 'Quotidienne',
          'weekly': 'Hebdomadaire', 
          'weekdays': 'Jours ouvrables',
          'custom': 'Personnalisée',
          'none': 'Aucune'
        };
        console.log(`   - ${typeNames[type] || type}: ${count}`);
      });
      
      // Vérifier les événements qui vont expirer bientôt
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);
      const in7DaysString = in7Days.toISOString().split('T')[0];
      
      const expiringSoon = activeEvents.filter(event => 
        event.end_date && event.end_date <= in7DaysString
      );
      
      if (expiringSoon.length > 0) {
        console.log(`\n⚠️  ${expiringSoon.length} événement(s) expire(nt) dans les 7 prochains jours:`);
        expiringSoon.forEach(event => {
          console.log(`   - ${event.title}: expire le ${event.end_date}`);
        });
      }
    }
    
    // Nettoyage des anciennes tâches générées (optionnel)
    const shouldCleanup = process.argv.includes('--cleanup-old');
    if (shouldCleanup) {
      console.log('\n🧹 Nettoyage des anciennes tâches...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const { data: deletedTasks, error: deleteError } = await supabase
        .from('scheduled_tasks')
        .delete()
        .lt('date', cutoffDate)
        .eq('is_completed', true);
      
      if (deleteError) {
        console.log('⚠️  Erreur lors du nettoyage:', deleteError.message);
      } else {
        console.log(`✅ Tâches terminées de plus de 30 jours supprimées`);
      }
    }
    
    console.log(`\n🎉 Génération quotidienne terminée avec succès !`);
    console.log(`📈 Résumé: ${tasksGenerated} nouvelle(s) tâche(s) générée(s)`);
    
    // Log pour monitoring/alertes
    if (tasksGenerated === 0) {
      console.log('ℹ️  Note: Aucune tâche générée - vérifiez si c\'est normal pour ce jour');
    }
    
  } catch (error) {
    console.error('❌ Erreur critique lors de la génération quotidienne:', error);
    process.exit(1);
  }
}

/**
 * Générer les tâches pour une période donnée
 * Utile pour rattraper des jours manqués ou préparer à l'avance
 */
async function generateTasksForPeriod(startDate, endDate) {
  console.log(`📅 Génération pour la période: ${startDate} → ${endDate}`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalGenerated = 0;
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toISOString().split('T')[0];
    
    const { data: count, error } = await supabase
      .rpc('generate_tasks_for_date', { target_date: dateString });
    
    if (error) {
      console.log(`❌ ${dateString}: Erreur - ${error.message}`);
    } else {
      const generated = count || 0;
      totalGenerated += generated;
      if (generated > 0) {
        console.log(`✅ ${dateString}: ${generated} tâche(s) générée(s)`);
      } else {
        console.log(`   ${dateString}: Aucune tâche`);
      }
    }
  }
  
  console.log(`\n📊 Total: ${totalGenerated} tâche(s) générée(s) pour la période`);
}

/**
 * Afficher le statut des événements récurrents
 */
async function showRecurringEventsStatus() {
  console.log('📋 État des événements récurrents...\n');
  
  try {
    const { data: events, error } = await supabase
      .from('scheduled_events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }
    
    if (events.length === 0) {
      console.log('ℹ️  Aucun événement récurrent configuré');
      return;
    }
    
    console.log(`📊 ${events.length} événement(s) récurrent(s) trouvé(s):\n`);
    
    events.forEach((event, index) => {
      const status = event.is_active ? '🟢 Actif' : '🔴 Inactif';
      const typeNames = {
        'daily': 'Quotidienne 🔄',
        'weekly': 'Hebdomadaire 📆', 
        'weekdays': 'Jours ouvrables 💼',
        'custom': 'Personnalisée ⚙️',
        'none': 'Aucune 📅'
      };
      
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   ${status} | ${typeNames[event.recurrence_type] || event.recurrence_type}`);
      console.log(`   📦 ${event.packages} colis | 👥 ${event.team_size} équipier(s)`);
      console.log(`   ⏰ ${event.start_time} (${event.duration_minutes}min)`);
      console.log(`   📅 Du ${event.start_date}${event.end_date ? ` au ${event.end_date}` : ' (illimité)'}`);
      
      if (event.recurrence_type === 'custom' && event.recurrence_days.length > 0) {
        const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const days = event.recurrence_days.map(d => dayNames[d - 1]).join(', ');
        console.log(`   📅 Jours: ${days}`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Interface en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📋 Générateur automatique de tâches récurrentes

Usage:
  node daily-task-generator.js                    Générer les tâches pour aujourd'hui
  node daily-task-generator.js --status           Afficher le statut des événements
  node daily-task-generator.js --period DEBUT FIN Générer pour une période
  node daily-task-generator.js --cleanup-old      Inclure le nettoyage des anciennes tâches
  node daily-task-generator.js --help             Afficher cette aide

Exemples:
  node daily-task-generator.js --period 2024-01-01 2024-01-07
  node daily-task-generator.js --cleanup-old
  node daily-task-generator.js --status

Options:
  --status        Afficher uniquement le statut des événements récurrents
  --period        Générer pour une période spécifique (format: YYYY-MM-DD)
  --cleanup-old   Nettoyer les tâches terminées de plus de 30 jours
  --help, -h      Afficher cette aide
`);
  } else if (args.includes('--status')) {
    showRecurringEventsStatus();
  } else if (args.includes('--period')) {
    const periodIndex = args.indexOf('--period');
    const startDate = args[periodIndex + 1];
    const endDate = args[periodIndex + 2];
    
    if (!startDate || !endDate) {
      console.error('❌ Erreur: --period nécessite deux dates (début et fin)');
      console.log('Exemple: node daily-task-generator.js --period 2024-01-01 2024-01-07');
      process.exit(1);
    }
    
    generateTasksForPeriod(startDate, endDate);
  } else {
    // Génération quotidienne normale
    generateDailyTasks();
  }
} 