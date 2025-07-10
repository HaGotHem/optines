#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
console.log('🔧 Configuration Supabase pour Optines');
console.log('=====================================\n');

// Vérifier si le fichier .env existe
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

console.log('📋 Étapes de configuration :\n');

console.log('1. 🌐 Créez un projet Supabase :');
console.log('   - Allez sur https://supabase.com');
console.log('   - Créez un nouveau projet');
console.log('   - Notez l\'URL et la clé anon\n');

console.log('2. 📝 Créez un fichier .env à la racine du projet :');
console.log('   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=\n');

console.log('3. 🗄️ Exécutez le script SQL dans Supabase :');
console.log('   - Allez dans l\'éditeur SQL de votre projet');
console.log('   - Copiez le contenu de supabase-setup.sql');
console.log('   - Exécutez le script\n');

console.log('4. 🚀 Lancez l\'application :');
console.log('   npm run dev\n');

console.log('5. 🔑 Identifiants de test :');
console.log('   Manager: manager / password123');
console.log('   Directeur: director / password123\n');

// Vérifier si les fichiers .env existent
if (fs.existsSync(envPath)) {
  console.log('✅ Fichier .env trouvé');
} else if (fs.existsSync(envLocalPath)) {
  console.log('✅ Fichier .env.local trouvé');
} else {
  console.log('❌ Aucun fichier .env trouvé');
  console.log('   Créez un fichier .env avec vos clés Supabase');
}

console.log('\n📚 Documentation complète : SUPABASE_CONFIG.md'); 