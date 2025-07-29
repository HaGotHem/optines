const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configuration des alias de chemins
config.resolver.alias = {
  '@': path.resolve(__dirname),
};

// Configuration pour le support TypeScript
config.resolver.sourceExts.push('ts', 'tsx');

// Configuration pour éviter les conflits
config.server = {
  ...config.server,
  port: 8084,
};

module.exports = config; 