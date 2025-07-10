import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

export default function ManagerSettings() {
  const { theme, isDark, setTheme: setGlobalTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [showPasswordChanged, setShowPasswordChanged] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hook Supabase Auth
  const { user, updateProfile, changePassword } = useSupabaseAuth();

  useEffect(() => {
    loadProfilePhoto();
  }, []);

  const loadProfilePhoto = async () => {
    try {
      if (user?.avatar_url) {
        setPhoto(user.avatar_url);
      }
    } catch (error) {
      console.log('Erreur lors du chargement de la photo:', error);
    }
  };

  const handleThemeChange = (value: boolean) => {
    setGlobalTheme(value ? 'dark' : 'light');
  };

  const handleAutoTheme = () => {
    setGlobalTheme('auto');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword || newPassword.length < 6) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas ou sont trop courts (minimum 6 caractères)');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(password, newPassword);
      if (result.success) {
        setShowPasswordChanged(true);
        setTimeout(() => setShowPasswordChanged(false), 2000);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Succès', 'Mot de passe modifié avec succès !');
      } else {
        Alert.alert('Erreur', result.error || 'Mot de passe actuel incorrect');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        setPhoto(photoUri);
        
        // Mettre à jour le profil avec Supabase
        const result = await updateProfile({ avatar_url: photoUri });
        if (result.success) {
          Alert.alert('Succès', 'Photo de profil mise à jour !');
        } else {
          Alert.alert('Erreur', result.error || 'Erreur lors de la sauvegarde de la photo');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sélection de la photo');
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.dark : styles.light]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={isDark ? "#ffffff" : "#3b82f6"} size={28} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Paramètres</Text>
      </View>

      {/* Photo de profil */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera color="#6b7280" size={32} strokeWidth={2} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileLabel}>Photo de profil</Text>
        <Text style={styles.profileHint}>Appuyez pour changer</Text>
      </View>

      {/* Thème */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        <View style={styles.themeRow}>
          <Text style={[styles.themeLabel, isDark && styles.darkText]}>Mode sombre</Text>
          <Switch
            value={isDark}
            onValueChange={handleThemeChange}
          />
        </View>
        <TouchableOpacity onPress={handleAutoTheme} style={styles.autoThemeButton}>
          <Text style={[styles.autoThemeText, isDark && styles.darkTextSecondary]}>
            {theme === 'auto' ? '✓ Défaut : suivre la préférence de l\'appareil' : 'Défaut : suivre la préférence de l\'appareil'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Changement de mot de passe */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Mot de passe actuel"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmer le nouveau mot de passe"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={[styles.saveButton, (newPassword !== confirmPassword || newPassword.length < 6 || loading) && styles.saveButtonDisabled]}
          onPress={handleChangePassword}
          disabled={newPassword !== confirmPassword || newPassword.length < 6 || loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Modification...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
        {showPasswordChanged && <Text style={styles.successText}>Mot de passe modifié !</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  dark: { backgroundColor: '#18181b' },
  light: { backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  darkText: { color: '#ffffff' },
  darkTextSecondary: { color: '#a1a1aa' },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  profileLabel: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  profileHint: { fontSize: 12, color: '#6b7280' },
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#3b82f6', marginBottom: 12 },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  themeLabel: { fontSize: 16, color: '#1a1a1a' },
  autoThemeButton: { marginTop: 4 },
  autoThemeText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 16, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb' },
  saveButton: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  saveButtonDisabled: { backgroundColor: '#a5b4fc' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  successText: { color: '#10b981', fontWeight: '600', marginTop: 8, textAlign: 'center' },
}); 