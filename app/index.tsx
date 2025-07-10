import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserCheck, Shield, Settings } from 'lucide-react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const handleDirecteurPress = () => {
    console.log('Directeur selected');
    router.push('/login?userType=director');
  };

  const handleManagerPress = () => {
    console.log('Manager selected');
    router.push('/login?userType=manager');
  };

  const handleDeveloperPress = () => {
    console.log('Developer panel');
    router.push('/developer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>Sélectionnez votre profil</Text>
      </View>

      {/* Role Selection Cards */}
      <View style={styles.cardContainer}>
        {/* Directeur Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={handleDirecteurPress}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.iconContainer, styles.directeurIcon]}>
              <Shield color="#ffffff" size={32} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Directeur</Text>
            <Text style={styles.cardDescription}>
              Dashboard de supervision et analytics
            </Text>
            <View style={[styles.cardAccent, styles.directeurAccent]} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Manager Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={handleManagerPress}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.iconContainer, styles.managerIcon]}>
              <UserCheck color="#ffffff" size={32} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Manager</Text>
            <Text style={styles.cardDescription}>
              Interface mobile de gestion d'équipe
            </Text>
            <View style={[styles.cardAccent, styles.managerAccent]} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Developer Button */}
      <View style={styles.developerContainer}>
        <TouchableOpacity
          style={styles.developerButton}
          onPress={handleDeveloperPress}
          activeOpacity={0.8}
        >
          <Settings color="#6b7280" size={16} />
          <Text style={styles.developerText}>Panel Développeur</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Choisissez votre rôle pour accéder aux fonctionnalités appropriées
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.06,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  cardWrapper: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  directeurIcon: {
    backgroundColor: '#10b981',
  },
  managerIcon: {
    backgroundColor: '#3b82f6',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  directeurAccent: {
    backgroundColor: '#10b981',
  },
  managerAccent: {
    backgroundColor: '#3b82f6',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  developerContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  developerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  developerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});