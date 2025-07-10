import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { AlertTriangle, ExternalLink, Settings } from 'lucide-react-native';

interface TempWarningProps {
  onSetup?: () => void;
}

export const TempWarning: React.FC<TempWarningProps> = ({ onSetup }) => {
  const openSupabase = () => {
    Linking.openURL('https://supabase.com');
  };

  const showSetupInstructions = () => {
    if (onSetup) {
      onSetup();
    } else {
      console.log('📋 Instructions de configuration :');
      console.log('1. Créez un projet sur https://supabase.com');
      console.log('2. Créez un fichier .env avec vos clés');
      console.log('3. Exécutez : npm run setup-supabase');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.warningBox}>
        <AlertTriangle size={24} color="#f59e0b" style={styles.icon} />
        <View style={styles.content}>
          <Text style={styles.title}>Configuration Supabase requise</Text>
          <Text style={styles.message}>
            L'application fonctionne en mode temporaire. Pour utiliser toutes les fonctionnalités, configurez Supabase.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={openSupabase}>
              <ExternalLink size={16} color="#fff" />
              <Text style={styles.buttonText}>Créer projet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={showSetupInstructions}>
              <Settings size={16} color="#3b82f6" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Instructions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
}); 