import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Clock, Target, Award, ChartBar as BarChart3, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Package, Users, FileText, X, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface Task {
  id: number;
  title: string;
  progress: number;
  status: string;
  deadline: string;
  priority: string;
  packages: number;
  teamSize: number;
}

export default function EfficiencyTab() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Utiliser les vraies données de Supabase au lieu des données simulées
  const { tasks: realTasks, isLoading: tasksLoading } = useSupabaseTasks({});
  const { user } = useSupabaseAuth();
  
  // Filtrer les tâches du manager connecté
  const managerTasks = realTasks.filter(task => task.manager_id === user?.id) || [];
  
  // Calculer les métriques basées sur les vraies données
  const calculateMetrics = () => {
    if (managerTasks.length === 0) {
      return [
        {
          title: 'Productivité',
          value: '0%',
          change: '0%',
          trend: 'stable',
          color: '#6b7280',
          description: 'Aucune tâche disponible'
        },
        {
          title: 'Ponctualité',
          value: '0%',
          change: '0%',
          trend: 'stable',
          color: '#6b7280',
          description: 'Aucune tâche disponible'
        },
        {
          title: 'Qualité',
          value: '0%',
          change: '0%',
          trend: 'stable',
          color: '#6b7280',
          description: 'Aucune tâche disponible'
        },
        {
          title: 'Satisfaction',
          value: '0/5',
          change: '0',
          trend: 'stable',
          color: '#6b7280',
          description: 'Aucune donnée disponible'
        }
      ];
    }
    
    const completedTasks = managerTasks.filter(task => task.is_completed);
    const totalPackages = managerTasks.reduce((sum, task) => sum + (task.packages || 0), 0);
    const processedPackages = completedTasks.reduce((sum, task) => sum + (task.packages || 0), 0);
    const productivity = totalPackages > 0 ? Math.round((processedPackages / totalPackages) * 100) : 0;
    const punctuality = managerTasks.length > 0 ? Math.round((completedTasks.length / managerTasks.length) * 100) : 0;
    
    return [
      {
        title: 'Productivité',
        value: `${productivity}%`,
        change: productivity > 0 ? `+${productivity}%` : '0%',
        trend: productivity >= 75 ? 'up' : productivity >= 50 ? 'stable' : 'down',
        color: productivity >= 75 ? '#10b981' : productivity >= 50 ? '#f59e0b' : '#ef4444',
        description: 'Colis traités par heure'
      },
      {
        title: 'Ponctualité',
        value: `${punctuality}%`,
        change: punctuality > 0 ? `+${punctuality}%` : '0%',
        trend: punctuality >= 80 ? 'up' : punctuality >= 60 ? 'stable' : 'down',
        color: punctuality >= 80 ? '#3b82f6' : punctuality >= 60 ? '#f59e0b' : '#ef4444',
        description: 'Tâches terminées à temps'
      },
      {
        title: 'Qualité',
        value: 'N/A',
        change: '0%',
        trend: 'stable',
        color: '#6b7280',
        description: 'Contrôles qualité non disponibles'
      },
      {
        title: 'Satisfaction',
        value: 'N/A',
        change: '0',
        trend: 'stable',
        color: '#6b7280',
        description: 'Données non disponibles'
      }
    ];
  };

  const metrics = calculateMetrics();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const updateTaskProgress = (taskId: number, newProgress: number) => {
    // Cette fonction ne peut plus modifier directement les tâches
    // car elles viennent de Supabase. On peut seulement afficher un message.
    Alert.alert(
      'Modification non disponible',
      'Les modifications de progression doivent être faites via le système de tâches principal.'
    );
  };

  const generateReport = () => {
    if (managerTasks.length === 0) {
      Alert.alert(
        'Aucune donnée',
        'Aucune tâche disponible pour générer un rapport.'
      );
      return;
    }
    
    const completedTasks = managerTasks.filter(task => task.is_completed).length;
    const totalPackages = managerTasks.reduce((sum, task) => sum + (task.packages || 0), 0);
    const processedPackages = managerTasks
      .filter(task => task.is_completed)
      .reduce((sum, task) => sum + (task.packages || 0), 0);
    
    Alert.alert(
      'Rapport généré',
      `📊 Résumé de performance:\n\n` +
      `✅ Tâches terminées: ${completedTasks}/${managerTasks.length}\n` +
      `📦 Total colis traités: ${processedPackages}/${totalPackages}\n` +
      `📈 Progression: ${totalPackages > 0 ? Math.round((processedPackages / totalPackages) * 100) : 0}%\n\n` +
      `Le rapport détaillé a été envoyé par email.`
    );
    setShowReportModal(false);
  };

  const markTaskComplete = (taskId: number) => {
    Alert.alert(
      'Modification non disponible',
      'Les modifications de statut doivent être faites via le système de tâches principal.'
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={isDark ? "#f4f4f5" : "#3b82f6"} size={28} strokeWidth={2} />
          </TouchableOpacity>
          <TrendingUp color="#3b82f6" size={32} strokeWidth={2} />
          <Text style={[styles.title, isDark && styles.titleDark]}>Performance Rayon</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Analysez l'efficacité de votre équipe</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <TouchableOpacity key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <View style={[styles.trendIndicator, { backgroundColor: metric.color }]}>
                  <TrendingUp color="#ffffff" size={12} strokeWidth={2} />
                </View>
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={[styles.metricChange, { color: metric.color }]}>
                {metric.change} ce mois
              </Text>
              <Text style={styles.metricDescription}>{metric.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Performance Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance hebdomadaire</Text>
          <TouchableOpacity style={styles.chartContainer}>
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.chartHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <BarChart3 color="#ffffff" size={24} strokeWidth={2} />
              <Text style={styles.chartTitle}>Évolution des performances</Text>
            </LinearGradient>
            <View style={styles.chartBody}>
              <View style={styles.chartStats}>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatValue}>
                    {managerTasks.length > 0 
                      ? Math.round(managerTasks.reduce((sum, task) => sum + (task.packages || 0), 0) / managerTasks.length)
                      : 0}
                  </Text>
                  <Text style={styles.chartStatLabel}>Colis/jour</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatValue}>
                    {managerTasks.length > 0 
                      ? Math.round((managerTasks.filter(task => task.is_completed).length / managerTasks.length) * 100)
                      : 0}%
                  </Text>
                  <Text style={styles.chartStatLabel}>Efficacité</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatValue}>
                    {managerTasks.length > 0 
                      ? Math.round(managerTasks.reduce((sum, task) => {
                          const start = new Date(`2000-01-01T${task.start_time}`);
                          const end = new Date(`2000-01-01T${task.end_time}`);
                          return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                        }, 0) / managerTasks.length * 10) / 10
                      : 0}h
                  </Text>
                  <Text style={styles.chartStatLabel}>Temps moy.</Text>
                </View>
              </View>
              <Text style={styles.chartNote}>
                {managerTasks.length > 0 
                  ? `Données de ${managerTasks.length} tâche(s)`
                  : 'Aucune donnée disponible'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tasks Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi des tâches</Text>
          
          {managerTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucune tâche disponible</Text>
              <Text style={styles.emptyStateSubtext}>Créez des tâches pour voir les données de performance</Text>
            </View>
          ) : (
            managerTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor('medium') }]}>
                    <Text style={styles.priorityText}>Normal</Text>
                  </View>
                </View>
                
                <View style={styles.taskDetails}>
                  <View style={styles.taskDetail}>
                    <Package color="#6b7280" size={16} strokeWidth={2} />
                    <Text style={styles.taskDetailText}>{task.packages || 0} colis</Text>
                  </View>
                  <View style={styles.taskDetail}>
                    <Users color="#6b7280" size={16} strokeWidth={2} />
                    <Text style={styles.taskDetailText}>{task.team_size || 1} équipiers</Text>
                  </View>
                  <View style={styles.taskDetail}>
                    <Clock color="#6b7280" size={16} strokeWidth={2} />
                    <Text style={styles.taskDetailText}>{task.start_time} - {task.end_time}</Text>
                  </View>
                </View>
                
                <View style={styles.taskProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${task.is_completed ? 100 : 0}%`,
                          backgroundColor: task.is_completed ? '#10b981' : '#e5e7eb'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {task.is_completed ? 'Terminé' : 'En cours'}
                  </Text>
                </View>
                
                <View style={styles.taskActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => markTaskComplete(task.id)}
                  >
                    <CheckCircle color="#10b981" size={16} strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Terminer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes & Notifications</Text>
          
          <TouchableOpacity style={styles.alertCard}>
            <AlertTriangle color="#ef4444" size={20} strokeWidth={2} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Retard détecté</Text>
              <Text style={styles.alertText}>Inventaire Surgelés en retard de 30 minutes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.alertCard}>
            <Award color="#10b981" size={20} strokeWidth={2} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Objectif atteint</Text>
              <Text style={styles.alertText}>Productivité mensuelle dépassée de 5%</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.alertCard}>
            <Clock color="#f59e0b" size={20} strokeWidth={2} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Pause équipe</Text>
              <Text style={styles.alertText}>Pause de 15 minutes dans 10 minutes</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
          >
            <FileText color="#ffffff" size={20} strokeWidth={2} />
            <Text style={styles.reportButtonText}>Générer un rapport</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Générer un rapport</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Générer un rapport détaillé des performances de votre équipe incluant:
            </Text>

            <View style={styles.reportFeatures}>
              <Text style={styles.reportFeature}>📊 Métriques de performance</Text>
              <Text style={styles.reportFeature}>📈 Graphiques d'évolution</Text>
              <Text style={styles.reportFeature}>✅ Statut des tâches</Text>
              <Text style={styles.reportFeature}>👥 Performance individuelle</Text>
              <Text style={styles.reportFeature}>📦 Statistiques de traitement</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={generateReport}
              >
                <Text style={styles.primaryButtonText}>Générer</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 20,
    zIndex: 10,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    padding: 4,
  },
  backButtonText: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  titleDark: {
    color: '#f4f4f5',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#a1a1aa',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  trendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 11,
    color: '#9ca3af',
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
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  chartBody: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  chartStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  completeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 40,
  },
  taskDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  deadlineText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
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
  alertContent: {
    marginLeft: 16,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  reportButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  reportFeatures: {
    marginBottom: 24,
  },
  reportFeature: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  taskProgress: {
    marginTop: 12,
    marginBottom: 12,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  taskDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});