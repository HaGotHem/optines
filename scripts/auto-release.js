const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MODIFICATIONS_THRESHOLD = 20; // Nombre de modifications avant release
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  return packageJson.version;
}

function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function updatePackageVersion(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
  log(`✅ Version mise à jour: ${newVersion}`, 'green');
}

function getGitStatus() {
  try {
    // Obtenir les fichiers modifiés
    const modifiedFiles = execSync('git status --porcelain', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        return { status, file };
      });

    // Compter les modifications
    const modifications = {
      added: modifiedFiles.filter(f => f.status.includes('A')).length,
      modified: modifiedFiles.filter(f => f.status.includes('M')).length,
      deleted: modifiedFiles.filter(f => f.status.includes('D')).length,
      renamed: modifiedFiles.filter(f => f.status.includes('R')).length,
      total: modifiedFiles.length
    };

    return { modifications, files: modifiedFiles };
  } catch (error) {
    log('❌ Erreur lors de la vérification du statut Git', 'red');
    return { modifications: { total: 0 }, files: [] };
  }
}

function getRecentCommits(since = 'HEAD~10') {
  try {
    const commits = execSync(`git log --oneline --since="${since}"`, { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return {
          hash: hash.substring(0, 7),
          message: messageParts.join(' ')
        };
      });
    return commits;
  } catch (error) {
    return [];
  }
}

function createChangelogEntry(version, modifications, commits) {
  const date = new Date().toISOString().split('T')[0];
  
  let changelog = `## [${version}] - ${date}\n\n`;
  
  // Résumé des modifications
  changelog += `### 📊 Résumé des modifications\n`;
  changelog += `- **Total des modifications:** ${modifications.total}\n`;
  if (modifications.added > 0) changelog += `- **Fichiers ajoutés:** ${modifications.added}\n`;
  if (modifications.modified > 0) changelog += `- **Fichiers modifiés:** ${modifications.modified}\n`;
  if (modifications.deleted > 0) changelog += `- **Fichiers supprimés:** ${modifications.deleted}\n`;
  if (modifications.renamed > 0) changelog += `- **Fichiers renommés:** ${modifications.renamed}\n`;
  changelog += '\n';

  // Derniers commits
  if (commits.length > 0) {
    changelog += `### 🔄 Derniers commits\n`;
    commits.slice(0, 10).forEach(commit => {
      changelog += `- \`${commit.hash}\` ${commit.message}\n`;
    });
    changelog += '\n';
  }

  // Fichiers modifiés
  if (modifications.files && modifications.files.length > 0) {
    changelog += `### 📁 Fichiers modifiés\n`;
    const fileGroups = {};
    
    modifications.files.forEach(file => {
      const ext = path.extname(file.file) || 'autre';
      if (!fileGroups[ext]) fileGroups[ext] = [];
      fileGroups[ext].push(file);
    });

    Object.entries(fileGroups).forEach(([ext, files]) => {
      changelog += `\n**${ext.toUpperCase()}:**\n`;
      files.forEach(file => {
        const status = file.status.includes('A') ? '➕' : 
                      file.status.includes('M') ? '✏️' : 
                      file.status.includes('D') ? '🗑️' : '🔄';
        changelog += `- ${status} \`${file.file}\`\n`;
      });
    });
  }

  return changelog;
}

function updateChangelog(newEntry) {
  let changelog = '';
  
  if (fs.existsSync(CHANGELOG_PATH)) {
    changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  } else {
    changelog = `# Changelog\n\nToutes les modifications notables de ce projet seront documentées dans ce fichier.\n\n`;
  }

  // Insérer la nouvelle entrée après le titre
  const lines = changelog.split('\n');
  const titleIndex = lines.findIndex(line => line.startsWith('# Changelog'));
  
  if (titleIndex !== -1) {
    lines.splice(titleIndex + 2, 0, newEntry);
  } else {
    lines.push(newEntry);
  }

  fs.writeFileSync(CHANGELOG_PATH, lines.join('\n'));
  log('✅ Changelog mis à jour', 'green');
}

function commitAndPush(version) {
  try {
    // Ajouter tous les fichiers
    execSync('git add .', { stdio: 'inherit' });
    
    // Commit avec message de version
    const commitMessage = `🚀 Release v${version} - Mise à jour automatique`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // Push directement sur la branche main distante depuis master
    execSync('git push origin master:main', { stdio: 'inherit' });
    
    log('✅ Commit et push effectués sur main', 'green');
    return true;
  } catch (error) {
    log('❌ Erreur lors du commit/push', 'red');
    return false;
  }
}

function createGitHubRelease(version, changelogEntry) {
  try {
    // Créer un tag
    execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
    execSync(`git push origin v${version}`, { stdio: 'inherit' });
    
    log('✅ Tag GitHub créé', 'green');
    log(`📋 Release disponible sur GitHub: v${version}`, 'cyan');
    log('💡 Pour créer la release complète, allez sur GitHub et utilisez le tag créé', 'yellow');
    
    // Afficher les instructions pour la release manuelle
    console.log('\n' + '='.repeat(60));
    log('📝 INSTRUCTIONS POUR LA RELEASE GITHUB:', 'bright');
    console.log('='.repeat(60));
    log('1. Allez sur votre repository GitHub', 'cyan');
    log('2. Cliquez sur "Releases" dans le menu de droite', 'cyan');
    log('3. Cliquez sur "Create a new release"', 'cyan');
    log('4. Sélectionnez le tag v' + version, 'cyan');
    log('5. Copiez le contenu du changelog ci-dessous:', 'cyan');
    console.log('\n' + '-'.repeat(40));
    console.log(changelogEntry);
    console.log('-'.repeat(40));
    
  } catch (error) {
    log('❌ Erreur lors de la création du tag GitHub', 'red');
  }
}

function createRelease(force = false) {
  log('🚀 Démarrage du système de release automatique...', 'bright');
  
  // Vérifier le statut Git
  const gitStatus = getGitStatus();
  const currentVersion = getCurrentVersion();
  
  log(`📊 Modifications détectées: ${gitStatus.modifications.total}`, 'blue');
  log(`📦 Version actuelle: ${currentVersion}`, 'blue');
  
  // Vérifier si on doit faire une release
  if (force || gitStatus.modifications.total >= MODIFICATIONS_THRESHOLD) {
    if (force) {
      log(`🎯 Release forcée! Création d'une release...`, 'yellow');
    } else {
      log(`🎯 Seuil atteint (${MODIFICATIONS_THRESHOLD} modifications)! Création d'une release...`, 'yellow');
    }
    
    // Incrémenter la version
    const newVersion = incrementVersion(currentVersion, 'patch');
    
    // Obtenir les commits récents
    const recentCommits = getRecentCommits();
    
    // Créer l'entrée du changelog
    const changelogEntry = createChangelogEntry(newVersion, gitStatus.modifications, recentCommits);
    
    // Mettre à jour les fichiers
    updatePackageVersion(newVersion);
    updateChangelog(changelogEntry);
    
    // Commit et push
    if (commitAndPush(newVersion)) {
      createGitHubRelease(newVersion, changelogEntry);
      log('🎉 Release v' + newVersion + ' créée avec succès!', 'green');
      return true;
    }
    
  } else {
    const remaining = MODIFICATIONS_THRESHOLD - gitStatus.modifications.total;
    log(`⏳ ${remaining} modification(s) restante(s) avant la prochaine release`, 'yellow');
    return false;
  }
}

function main() {
  // Vérifier les arguments de ligne de commande
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  
  return createRelease(force);
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, getGitStatus, incrementVersion }; 