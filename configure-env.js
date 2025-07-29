#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Configuration du fichier .env pour Supabase');
console.log('=============================================\n');

console.log('📋 Instructions :');
console.log('1. Allez sur https://supabase.com');
console.log('2. Sélectionnez votre projet');
console.log('3. Allez dans Settings > API');
console.log('4. Copiez l\'URL du projet et la clé "anon public"\n');

rl.question('🌐 URL du projet Supabase (ex: https://xxx.supabase.co): ', (url) => {
  rl.question('🔑 Clé anon publique: ', (anonKey) => {
    const envContent = `# Configuration Supabase
EXPO_PUBLIC_SUPABASE_URL=${url}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${anonKey}

# Instructions :
# 1. Exécutez le script SQL dans l'éditeur Supabase
# 2. Lancez l'app : npm run dev
# 3. Testez avec : manager/password123 ou director/password123
`;

    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Fichier .env créé avec succès !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Exécutez le script SQL dans Supabase');
    console.log('2. Lancez l\'app : npm run dev');
    console.log('3. Testez la connexion : npm run test-supabase');
    
    rl.close();
  });
}); 