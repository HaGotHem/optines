const { getGitStatus } = require('./auto-release');

const MODIFICATIONS_THRESHOLD = 20;

function checkModifications() {
  console.log('🔍 Vérification des modifications...\n');
  
  const gitStatus = getGitStatus();
  const remaining = MODIFICATIONS_THRESHOLD - gitStatus.modifications.total;
  
  console.log(`📊 Modifications actuelles: ${gitStatus.modifications.total}`);
  console.log(`🎯 Seuil pour release: ${MODIFICATIONS_THRESHOLD}`);
  
  if (gitStatus.modifications.total >= MODIFICATIONS_THRESHOLD) {
    console.log('✅ Prêt pour une release!');
    console.log('💡 Exécutez: node scripts/auto-release.js');
  } else {
    console.log(`⏳ ${remaining} modification(s) restante(s) avant la prochaine release`);
  }
  
  // Afficher les détails si des modifications existent
  if (gitStatus.modifications.total > 0) {
    console.log('\n📁 Détails des modifications:');
    console.log(`- Ajoutés: ${gitStatus.modifications.added}`);
    console.log(`- Modifiés: ${gitStatus.modifications.modified}`);
    console.log(`- Supprimés: ${gitStatus.modifications.deleted}`);
    console.log(`- Renommés: ${gitStatus.modifications.renamed}`);
  }
}

checkModifications(); 