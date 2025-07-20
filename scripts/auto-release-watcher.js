const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getGitStatus, createRelease } = require('./auto-release');

// Configuration
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MODIFICATIONS_THRESHOLD = 20;
const LOG_FILE = path.join(__dirname, '..', 'auto-release.log');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`${colors[color]}${logMessage}${colors.reset}`);
  
  // Écrire dans le fichier de log
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function checkAndRelease() {
  try {
    log('🔍 Vérification automatique des modifications...', 'blue');
    
    const gitStatus = getGitStatus();
    const currentVersion = require('../package.json').version;
    
    log(`📊 Modifications détectées: ${gitStatus.modifications.total}`, 'blue');
    log(`📦 Version actuelle: ${currentVersion}`, 'blue');
    
    if (gitStatus.modifications.total >= MODIFICATIONS_THRESHOLD) {
      log(`🎯 Seuil atteint (${MODIFICATIONS_THRESHOLD} modifications)! Création automatique d'une release...`, 'yellow');
      
      // Créer la release automatiquement
      const success = createRelease(false); // false = pas forcé, automatique
      
      if (success) {
        log('✅ Release automatique créée avec succès!', 'green');
      } else {
        log('❌ Échec de la création de la release automatique', 'red');
      }
    } else {
      const remaining = MODIFICATIONS_THRESHOLD - gitStatus.modifications.total;
      log(`⏳ ${remaining} modification(s) restante(s) avant la prochaine release automatique`, 'cyan');
    }
    
  } catch (error) {
    log(`❌ Erreur lors de la vérification automatique: ${error.message}`, 'red');
  }
}

function startWatcher() {
  log('🚀 Démarrage du système de surveillance automatique des releases...', 'bright');
  log(`⏰ Intervalle de vérification: ${CHECK_INTERVAL / 1000 / 60} minutes`, 'cyan');
  log(`🎯 Seuil de modifications: ${MODIFICATIONS_THRESHOLD}`, 'cyan');
  log(`📝 Logs: ${LOG_FILE}`, 'cyan');
  log('🔄 Surveillance en cours... (Ctrl+C pour arrêter)', 'yellow');
  
  // Première vérification immédiate
  checkAndRelease();
  
  // Vérification périodique
  const interval = setInterval(checkAndRelease, CHECK_INTERVAL);
  
  // Gestion de l'arrêt propre
  process.on('SIGINT', () => {
    log('🛑 Arrêt du système de surveillance...', 'yellow');
    clearInterval(interval);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('🛑 Arrêt du système de surveillance...', 'yellow');
    clearInterval(interval);
    process.exit(0);
  });
}

// Fonction pour démarrer en mode daemon (arrière-plan)
function startDaemon() {
  log('👻 Démarrage en mode daemon...', 'cyan');
  
  // Créer un processus enfant qui continue en arrière-plan
  const child = require('child_process').spawn('node', [__filename, '--daemon'], {
    detached: true,
    stdio: 'ignore'
  });
  
  child.unref();
  log(`✅ Processus daemon démarré avec PID: ${child.pid}`, 'green');
  log('📝 Vérifiez les logs dans: ' + LOG_FILE, 'cyan');
}

// Fonction pour arrêter le daemon
function stopDaemon() {
  try {
    // Lire le PID depuis un fichier temporaire
    const pidFile = path.join(__dirname, '..', '.auto-release-pid');
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      fs.unlinkSync(pidFile);
      log('✅ Processus daemon arrêté', 'green');
    } else {
      log('❌ Aucun processus daemon trouvé', 'red');
    }
  } catch (error) {
    log(`❌ Erreur lors de l'arrêt du daemon: ${error.message}`, 'red');
  }
}

// Fonction pour afficher les logs
function showLogs() {
  if (fs.existsSync(LOG_FILE)) {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    console.log(logs);
  } else {
    log('❌ Aucun fichier de log trouvé', 'red');
  }
}

// Fonction pour afficher le statut
function showStatus() {
  try {
    const gitStatus = getGitStatus();
    const currentVersion = require('../package.json').version;
    
    console.log('\n' + '='.repeat(50));
    log('📊 STATUT DU SYSTÈME DE RELEASE AUTOMATIQUE', 'bright');
    console.log('='.repeat(50));
    log(`📦 Version actuelle: ${currentVersion}`, 'blue');
    log(`📊 Modifications actuelles: ${gitStatus.modifications.total}`, 'blue');
    log(`🎯 Seuil pour release: ${MODIFICATIONS_THRESHOLD}`, 'blue');
    
    const remaining = MODIFICATIONS_THRESHOLD - gitStatus.modifications.total;
    if (remaining > 0) {
      log(`⏳ ${remaining} modification(s) restante(s) avant la prochaine release`, 'cyan');
    } else {
      log('✅ Prêt pour une release automatique!', 'green');
    }
    
    // Vérifier si le daemon est en cours
    const pidFile = path.join(__dirname, '..', '.auto-release-pid');
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      log(`👻 Daemon actif avec PID: ${pid}`, 'green');
    } else {
      log('❌ Aucun daemon actif', 'red');
    }
    
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    log(`❌ Erreur lors de l'affichage du statut: ${error.message}`, 'red');
  }
}

// Gestion des arguments de ligne de commande
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--daemon')) {
    // Mode daemon
    const pidFile = path.join(__dirname, '..', '.auto-release-pid');
    fs.writeFileSync(pidFile, process.pid.toString());
    startWatcher();
  } else if (args.includes('--start')) {
    // Démarrer le daemon
    startDaemon();
  } else if (args.includes('--stop')) {
    // Arrêter le daemon
    stopDaemon();
  } else if (args.includes('--status')) {
    // Afficher le statut
    showStatus();
  } else if (args.includes('--logs')) {
    // Afficher les logs
    showLogs();
  } else if (args.includes('--check')) {
    // Vérification unique
    checkAndRelease();
  } else {
    // Mode interactif par défaut
    console.log('🚀 Système de surveillance automatique des releases');
    console.log('');
    console.log('Options disponibles:');
    console.log('  --start   : Démarrer le daemon en arrière-plan');
    console.log('  --stop    : Arrêter le daemon');
    console.log('  --status  : Afficher le statut actuel');
    console.log('  --logs    : Afficher les logs');
    console.log('  --check   : Vérification unique');
    console.log('  --daemon  : Mode daemon (interne)');
    console.log('');
    console.log('Mode interactif (Ctrl+C pour arrêter):');
    startWatcher();
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { checkAndRelease, startWatcher, startDaemon, stopDaemon }; 