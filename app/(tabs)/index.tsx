import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Bell,
  ChevronRight,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react-native';
import FutureTasksCalendar from '../../components/FutureTasksCalendar';
import { useTaskStats } from '../../hooks/useTaskStats';
import { useTheme } from '../../contexts/ThemeContext';

export default function HomeTab() {
  const { stats, loading, refreshStats } = useTaskStats();
  const { isDark } = useTheme();

  // Rafraîchir les stats quand la page devient active
  useEffect(() => {
    const unsubscribe = () => {
      refreshStats();
    };
    
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, isDark && styles.greetingDark]}>Bonjour,</Text>
            <Text style={[styles.userName, isDark && styles.userNameDark]}>Directeur</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.refreshButton, isDark && styles.refreshButtonDark]}
              onPress={refreshStats}
            >
              <Clock color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.notificationButton, isDark && styles.notificationButtonDark]}>
              <Bell color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards - 4 cases fonctionnelles */}
        <View style={styles.statsContainer}>
          {/* Case 1: Colis traités */}
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Package color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                stats.totalPackages.toLocaleString()
              )}
            </Text>
            <Text style={styles.statLabel}>Colis traités</Text>
            <Text style={styles.statSubtitle}>
              {stats.packagesPerHour}/h en moyenne
            </Text>
          </LinearGradient>

          {/* Case 2: Tâches planifiées */}
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Calendar color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                stats.totalTasks
              )}
            </Text>
            <Text style={styles.statLabel}>Tâches planifiées</Text>
            <Text style={styles.statSubtitle}>
              {stats.completedTasks} terminées
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.statsContainer}>
          {/* Case 3: Équipes mobilisées */}
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Users color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                stats.totalTeamMembers
              )}
            </Text>
            <Text style={styles.statLabel}>Équipes mobilisées</Text>
            <Text style={styles.statSubtitle}>
              {stats.averageTeamSize} pers/tâche
            </Text>
          </LinearGradient>

          {/* Case 4: Taux de réussite */}
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <CheckCircle color="#ffffff" size={28} strokeWidth={2} />
            <Text style={styles.statValue}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                `${stats.completionRate}%`
              )}
            </Text>
            <Text style={styles.statLabel}>Taux de réussite</Text>
            <Text style={styles.statSubtitle}>
              Tâches terminées
            </Text>
          </LinearGradient>
        </View>



        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Actions rapides</Text>
          
          <TouchableOpacity style={[styles.actionCard, isDark && styles.actionCardDark]}>
            <View style={styles.actionContent}>
              <View style={[styles.actionIcon, isDark && styles.actionIconDark]}>
                <Calendar color="#3b82f6" size={20} strokeWidth={2} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>Planifier une réunion</Text>
                <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>Organiser avec l'équipe</Text>
              </View>
            </View>
            <ChevronRight color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, isDark && styles.actionCardDark]}>
            <View style={styles.actionContent}>
              <View style={[styles.actionIcon, isDark && styles.actionIconDark]}>
                <Users color="#10b981" size={20} strokeWidth={2} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>Gérer l'équipe</Text>
                <Text style={[styles.actionSubtitle, isDark && styles.actionSubtitleDark]}>Voir les performances</Text>
              </View>
            </View>
            <ChevronRight color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Tâches à venir */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Tâches à venir</Text>
          <Text style={[styles.sectionSubtitle, isDark && styles.sectionSubtitleDark]}>Planifiez vos tâches pour les semaines et mois à venir</Text>
          <View style={[styles.calendarContainer, isDark && styles.calendarContainerDark]}>
            <FutureTasksCalendar />
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  greetingDark: {
    color: '#a1a1aa',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  userNameDark: {
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonDark: {
    backgroundColor: '#27272a',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationButtonDark: {
    backgroundColor: '#27272a',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%', // Pour créer une grille 2x2
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 120,
    marginBottom: 16, // Espacement vertical entre les lignes
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '600',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },

  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  sectionSubtitleDark: {
    color: '#a1a1aa',
  },
  calendarContainer: {
    height: 500,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  calendarContainerDark: {
    backgroundColor: '#27272a',
  },
  actionCard: {
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
  actionCardDark: {
    backgroundColor: '#27272a',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconDark: {
    backgroundColor: '#3f3f46',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionTitleDark: {
    color: '#ffffff',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
  actionSubtitleDark: {
    color: '#a1a1aa',
  },
});