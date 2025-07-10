import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  LogOut,
  ChevronRight 
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileTab() {
  const { isDark } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User color="#ffffff" size={32} strokeWidth={2} />
            </View>
          </View>
          <Text style={[styles.name, isDark && styles.nameDark]}>Jean Dupont</Text>
          <Text style={[styles.role, isDark && styles.roleDark]}>Directeur Général</Text>
        </View>

        {/* Profile Options */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.optionCard, isDark && styles.optionCardDark]}>
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <User color="#3b82f6" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.optionTitle, isDark && styles.optionTitleDark]}>Informations personnelles</Text>
            </View>
            <ChevronRight color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionCard, isDark && styles.optionCardDark]}>
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <Settings color="#10b981" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.optionTitle, isDark && styles.optionTitleDark]}>Paramètres</Text>
            </View>
            <ChevronRight color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionCard, isDark && styles.optionCardDark]}>
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <Bell color="#f59e0b" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.optionTitle, isDark && styles.optionTitleDark]}>Notifications</Text>
            </View>
            <ChevronRight color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionCard, isDark && styles.optionCardDark]}>
            <View style={styles.optionContent}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <Shield color="#8b5cf6" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.optionTitle, isDark && styles.optionTitleDark]}>Sécurité</Text>
            </View>
            <ChevronRight color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={[styles.logoutButton, isDark && styles.logoutButtonDark]}>
            <LogOut color="#ef4444" size={20} strokeWidth={2} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  nameDark: {
    color: '#ffffff',
  },
  role: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  roleDark: {
    color: '#a1a1aa',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  optionCardDark: {
    backgroundColor: '#27272a',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconDark: {
    backgroundColor: '#3f3f46',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  optionTitleDark: {
    color: '#ffffff',
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutButtonDark: {
    backgroundColor: '#27272a',
    borderColor: '#7f1d1d',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
});