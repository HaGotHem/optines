import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Users, Calendar, Calculator, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Package, Target, Bell, X, Check, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';

const { width } = Dimensions.get('window');

export default function ManagerHomeTab() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  // Plus besoin de la fausse liste notifications
  // const [notifications] = useState([
  //   {
  //     id: 1,
  //     title: 'Livraison en retard',
  //     message: 'La livraison de fruits & légumes a 30 minutes de retard',
  //     time: '10 min',
  //     type: 'warning'
  //   },
  //   {
  //     id: 2,
  //     title: 'Objectif atteint',
  //     message: 'Votre équipe a traité 120% de l\'objectif quotidien',
  //     time: '1h',
  //     type: 'success'
  //   },
  //   {
  //     id: 3,
  //     title: 'Pause équipe',
  //     message: 'Pause de 15 minutes dans 5 minutes',
  //     time: '2h',
  //     type: 'info'
  //   }
  // ]);

  // Hooks Supabase
  const { user } = useSupabaseAuth();
  const today = new Date().toISOString().split('T')[0];
  const { 
    tasks, 
    isLoading: tasksLoading, 
    getLocalStats, 
    getTasksByDate,
    completeTask 
  } = useSupabaseTasks({ 
    date: today,
    managerId: user?.id 
  });

  // --- Stats dynamiques avec Supabase ---
  const [stats, setStats] = useState({
    treatedPackages: 0,
    activeTeamMembers: 0,
    remainingTime: '0h00',
    performance: 0,
    treatedTasks: 0,
    totalTasks: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Calculer les statistiques depuis Supabase
  useEffect(() => {
    const calculateStats = () => {
      setLoadingStats(true);
      try {
        const todayTasks = getTasksByDate(today);
        const completedTasks = todayTasks.filter(t => t.is_completed);
        const pendingTasks = todayTasks.filter(t => !t.is_completed);
        
        // Calculer les colis traités
        const treatedPackages = completedTasks.reduce((sum, t) => sum + (t.packages || 0), 0);
        
        // Calculer les membres d'équipe actifs
        const activeTeamMembers = pendingTasks.reduce((sum, t) => sum + (t.team_size || 0), 0);
        
        // Calculer le temps restant
        let totalMinutes = 0;
        const now = new Date();
        todayTasks.forEach((t) => {
          const start = new Date(`${t.date}T${t.start_time}`);
          const end = new Date(`${t.date}T${t.end_time}`);
          if (now < start) {
            totalMinutes += Math.max(0, (end.getTime() - start.getTime()) / 60000);
          } else if (now >= start && now < end) {
            totalMinutes += Math.max(0, (end.getTime() - now.getTime()) / 60000);
          }
        });
        
        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60);
        const remainingTime = `${hours}h${mins.toString().padStart(2, '0')}`;
        
        const totalTasks = todayTasks.length;
        const performance = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
        
        setStats({
          treatedPackages,
          activeTeamMembers,
          remainingTime,
          performance,
          treatedTasks: completedTasks.length,
          totalTasks,
        });
      } catch (e) {
        console.error('Erreur calcul stats:', e);
        setStats({
          treatedPackages: 0,
          activeTeamMembers: 0,
          remainingTime: '0h00',
          performance: 0,
          treatedTasks: 0,
          totalTasks: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (!tasksLoading) {
      calculateStats();
    }
  }, []);

  const todayTasks = [
    {
      id: 1,
      title: 'Mise en rayon matinale',
      progress: 100,
      status: 'completed',
      time: '05:00 - 07:30'
    },
    {
      id: 2,
      title: 'Réapprovisionnement',
      progress: 75,
      status: 'in-progress',
      time: '08:00 - 11:00'
    },
    {
      id: 3,
      title: 'Contrôle qualité',
      progress: 0,
      status: 'pending',
      time: '14:00 - 15:30'
    }
  ];

  const navigateToCalculator = () => {
    router.push('/(manager-tabs)/calculator');
  };

  const navigateToCalendar = () => {
    router.push('/(manager-tabs)/calendar');
  };

  const navigateToEfficiency = () => {
    router.push('/(manager-tabs)/efficiency');
  };

  const navigateToTeam = () => {
    router.push('/(manager-tabs)/team');
  };

  const navigateToSettings = () => {
    router.push('/(manager-tabs)/settings');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const markNotificationRead = (notificationId: number) => {
    // Logique pour marquer une notification comme lue
    console.log('Notification marquée comme lue:', notificationId);
  };

  const markTaskAsCompleted = async (taskId: string) => {
    try {
      const result = await completeTask(taskId);
      if (result.success) {
        Alert.alert('Succès', 'Tâche marquée comme terminée');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour de la tâche');
    }
  };

  const { isDark } = useTheme();
  const {
    notificationsHistory,
    markNotificationRead: markNotificationReadHistory,
    clearNotificationsHistory,
  } = useNotifications();

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsButton} onPress={navigateToSettings}>
            <Settings color={isDark ? "#60a5fa" : "#3b82f6"} size={28} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.greeting, isDark && styles.greetingDark]}>Bonjour,</Text>
            <Text style={[styles.userName, isDark && styles.userNameDark]}>Manager Rayon</Text>
            <Text style={[styles.date, isDark && styles.dateDark]}>Aujourd'hui - {new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.notificationButton, isDark && styles.notificationButtonDark]}
            onPress={() => setShowNotificationModal(true)}
          >
            <Bell color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
            {notificationsHistory.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationsHistory.filter(n => !n.read).length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats dynamiques */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}> <Package color="#3b82f6" size={20} strokeWidth={2} /> </View>
            <Text style={styles.statValue}>{loadingStats ? '...' : stats.treatedPackages || 0}</Text>
            <Text style={styles.statLabel}>Colis traités</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: stats.totalTasks > 0 ? `${Math.round((stats.treatedTasks / stats.totalTasks) * 100)}%` : '0%', backgroundColor: '#3b82f6' }]} />
              </View>
              <Text style={styles.progressText}>{stats.totalTasks > 0 ? Math.round((stats.treatedTasks / stats.totalTasks) * 100) : 0}%</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}> <Users color="#10b981" size={20} strokeWidth={2} /> </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>{loadingStats ? '...' : stats.activeTeamMembers || 0}</Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Équipiers actifs</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: stats.totalTasks > 0 ? `${Math.round((stats.activeTeamMembers / (stats.totalTasks * 2)) * 100)}%` : '0%', backgroundColor: '#10b981' }]} />
              </View>
              <Text style={styles.progressText}>{stats.totalTasks > 0 ? Math.round((stats.activeTeamMembers / (stats.totalTasks * 2)) * 100) : 0}%</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}> <Clock color="#f59e0b" size={20} strokeWidth={2} /> </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>{loadingStats ? '...' : stats.remainingTime || '0h00'}</Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Temps restant</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: stats.totalTasks > 0 ? `${100 - stats.performance}%` : '0%', backgroundColor: '#f59e0b' }]} />
              </View>
              <Text style={styles.progressText}>{stats.totalTasks > 0 ? 100 - stats.performance : 0}%</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: '#8b5cf620' }]}> <Target color="#8b5cf6" size={20} strokeWidth={2} /> </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>{loadingStats ? '...' : `${stats.performance || 0}%`}</Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Performance</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${stats.performance || 0}%`, backgroundColor: '#8b5cf6' }]} />
              </View>
              <Text style={styles.progressText}>{stats.performance || 0}%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Tasks dynamiques */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Tâches du jour</Text>
          {tasksLoading || tasks.length === 0 ? (
            <Text style={[{ color: '#6b7280', textAlign: 'center', marginVertical: 16 }, isDark && { color: '#a1a1aa' }]}>Chargement des tâches...</Text>
          ) : (
            tasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, isDark && styles.taskCardDark]}>
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, isDark && styles.taskTitleDark]}>{task.title}</Text>
                <View style={styles.taskStatus}>
                    {task.is_completed ? <CheckCircle color="#10b981" size={20} strokeWidth={2} /> : <Clock color="#6b7280" size={20} strokeWidth={2} />}
                  </View>
                </View>
                <Text style={[styles.taskTime, isDark && styles.taskTimeDark]}>{task.start_time} - {task.end_time}</Text>
              <View style={styles.taskProgressContainer}>
                <View style={styles.taskProgressBar}>
                    <View style={[styles.taskProgressFill, { width: `${task.progress || 0}%`, backgroundColor: task.is_completed ? '#10b981' : '#e5e7eb' }]} />
                </View>
                <Text style={[styles.taskProgressText, isDark && styles.taskProgressTextDark]}>{task.progress || 0}%</Text>
              </View>
              <TouchableOpacity style={styles.finishButton} onPress={() => markTaskAsCompleted(task.id)}>
                <Check color="#fff" size={18} />
                <Text style={styles.finishButtonText}>Marquer comme fini</Text>
              </TouchableOpacity>
            </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Actions rapides</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToCalculator}>
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Calculator color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Calculateur d'Équipe</Text>
                <Text style={styles.actionSubtitle}>Planifier les tâches et horaires</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToCalendar}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Calendar color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Planning Rayon</Text>
                <Text style={styles.actionSubtitle}>Organiser et visualiser</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToTeam}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Users color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Équipe Rayon</Text>
                <Text style={styles.actionSubtitle}>Gérer votre équipe</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToEfficiency}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TrendingUp color="#ffffff" size={24} strokeWidth={2} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Performance</Text>
                <Text style={styles.actionSubtitle}>Analyser l'efficacité</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Alertes importantes</Text>
          
          <TouchableOpacity style={[styles.alertCard, isDark && styles.alertCardDark]}>
            <View style={styles.alertIcon}>
              <AlertTriangle color="#ef4444" size={20} strokeWidth={2} />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, isDark && styles.alertTitleDark]}>Stock faible</Text>
              <Text style={[styles.alertText, isDark && styles.alertTextDark]}>Pommes de terre - Réapprovisionner avant 16h</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.alertCard, isDark && styles.alertCardDark]}>
            <View style={styles.alertIcon}>
              <Clock color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, isDark && styles.alertTitleDark]}>Pause équipe</Text>
              <Text style={[styles.alertText, isDark && styles.alertTextDark]}>Pause de 15 minutes dans 10 minutes</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <X color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notificationsList}>
              {notificationsHistory.length === 0 && (
                <Text style={{ color: isDark ? '#a1a1aa' : '#6b7280', textAlign: 'center', marginTop: 24 }}>Aucune notification</Text>
              )}
              {notificationsHistory.map((notification) => (
                <TouchableOpacity 
                  key={notification.id} 
                  style={[
                    styles.notificationItem,
                    isDark && styles.notificationItemDark,
                    notification.read && { opacity: 0.5 }
                  ]}
                  onPress={() => markNotificationReadHistory(notification.id)}
                >
                  <Text style={styles.notificationIcon}>
                    {getNotificationIcon(notification.data?.type || 'general')}
                  </Text>
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationTitle,
                      isDark && styles.notificationTitleDark
                    ]}>{notification.title}</Text>
                    <Text style={[
                      styles.notificationMessage,
                      isDark && styles.notificationMessageDark
                    ]}>{notification.body}</Text>
                    <Text style={[
                      styles.notificationTime,
                      isDark && styles.notificationTimeDark
                    ]}>{new Date(notification.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
                  </View>
                  {!notification.read && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6', marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.markAllReadButton, isDark && styles.markAllReadButtonDark]}
              onPress={clearNotificationsHistory}
            >
              <Text style={[styles.markAllReadText, isDark && styles.markAllReadTextDark]}>Vider l'historique</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 80,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
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
    marginBottom: 8,
  },
  userNameDark: {
    color: '#ffffff',
  },
  date: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  dateDark: {
    color: '#71717a',
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
    position: 'relative',
  },
  notificationButtonDark: {
    backgroundColor: '#27272a',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardDark: {
    backgroundColor: '#27272a',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statValueDark: {
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statLabelDark: {
    color: '#a1a1aa',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskCardDark: {
    backgroundColor: '#27272a',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  taskTitleDark: {
    color: '#ffffff',
  },
  taskStatus: {
    marginLeft: 12,
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  taskTimeDark: {
    color: '#a1a1aa',
  },
  taskProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 12,
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  taskProgressText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  taskProgressTextDark: {
    color: '#ffffff',
  },
  actionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertCardDark: {
    backgroundColor: '#27272a',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  alertTitleDark: {
    color: '#ffffff',
  },
  alertText: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertTextDark: {
    color: '#a1a1aa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    minWidth: 300,
    maxWidth: 400,
    maxHeight: '80%',
    alignSelf: 'center',
  },
  modalContentDark: {
    backgroundColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalTitleDark: {
    color: '#ffffff',
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'flex-start',
  },
  notificationItemDark: {
    borderBottomColor: '#3f3f46',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationTitleDark: {
    color: '#ffffff',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  notificationMessageDark: {
    color: '#a1a1aa',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notificationTimeDark: {
    color: '#71717a',
  },
  markAllReadButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  markAllReadButtonDark: {
    backgroundColor: '#2563eb',
  },
  markAllReadText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  markAllReadTextDark: {
    color: '#ffffff',
  },
  finishButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, alignSelf: 'flex-end' },
  finishButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
});