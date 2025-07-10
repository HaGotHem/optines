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
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Mise en rayon Fruits & Légumes',
      progress: 85,
      status: 'En cours',
      deadline: '2 heures',
      priority: 'high',
      packages: 120,
      teamSize: 3
    },
    {
      id: 2,
      title: 'Réapprovisionnement Épicerie',
      progress: 100,
      status: 'Terminé',
      deadline: 'Terminé',
      priority: 'medium',
      packages: 85,
      teamSize: 2
    },
    {
      id: 3,
      title: 'Contrôle qualité Produits frais',
      progress: 60,
      status: 'En cours',
      deadline: '4 heures',
      priority: 'low',
      packages: 45,
      teamSize: 1
    },
    {
      id: 4,
      title: 'Inventaire Surgelés',
      progress: 30,
      status: 'En cours',
      deadline: '6 heures',
      priority: 'medium',
      packages: 200,
      teamSize: 4
    }
  ]);

  const metrics = [
    {
      title: 'Productivité',
      value: '87%',
      change: '+5%',
      trend: 'up',
      color: '#10b981',
      description: 'Colis traités par heure'
    },
    {
      title: 'Ponctualité',
      value: '92%',
      change: '+2%',
      trend: 'up',
      color: '#3b82f6',
      description: 'Tâches terminées à temps'
    },
    {
      title: 'Qualité',
      value: '94%',
      change: '-1%',
      trend: 'down',
      color: '#f59e0b',
      description: 'Contrôles qualité réussis'
    },
    {
      title: 'Satisfaction',
      value: '4.8/5',
      change: '+0.2',
      trend: 'up',
      color: '#8b5cf6',
      description: 'Note équipe'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const updateTaskProgress = (taskId: number, newProgress: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            progress: newProgress,
            status: newProgress === 100 ? 'Terminé' : 'En cours',
            deadline: newProgress === 100 ? 'Terminé' : task.deadline
          }
        : task
    ));
  };

  const generateReport = () => {
    const completedTasks = tasks.filter(task => task.status === 'Terminé').length;
    const totalPackages = tasks.reduce((sum, task) => sum + task.packages, 0);
    const avgProgress = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length);
    
    Alert.alert(
      'Rapport généré',
      `📊 Résumé de performance:\n\n` +
      `✅ Tâches terminées: ${completedTasks}/${tasks.length}\n` +
      `📦 Total colis traités: ${totalPackages}\n` +
      `📈 Progression moyenne: ${avgProgress}%\n\n` +
      `Le rapport détaillé a été envoyé par email.`
    );
    setShowReportModal(false);
  };

  const markTaskComplete = (taskId: number) => {
    updateTaskProgress(taskId, 100);
    Alert.alert('Tâche terminée', 'La tâche a été marquée comme terminée');
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
                  <Text style={styles.chartStatValue}>450</Text>
                  <Text style={styles.chartStatLabel}>Colis/jour</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatValue}>87%</Text>
                  <Text style={styles.chartStatLabel}>Efficacité</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatValue}>6.2h</Text>
                  <Text style={styles.chartStatLabel}>Temps moy.</Text>
                </View>
              </View>
              <Text style={styles.chartNote}>Données des 7 derniers jours</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tasks Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi des tâches</Text>
          
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskMeta}>
                  <View 
                    style={[
                      styles.priorityBadge, 
                      { backgroundColor: getPriorityColor(task.priority) }
                    ]}
                  />
                  {task.status !== 'Terminé' && (
                    <TouchableOpacity 
                      style={styles.completeButton}
                      onPress={() => markTaskComplete(task.id)}
                    >
                      <CheckCircle color="#10b981" size={16} strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <TouchableOpacity 
                    style={[styles.progressFill, { width: `${task.progress}%` }]}
                    onPress={() => {
                      if (task.status !== 'Terminé') {
                        const newProgress = Math.min(task.progress + 10, 100);
                        updateTaskProgress(task.id, newProgress);
                      }
                    }}
                  />
                </View>
                <Text style={styles.progressText}>{task.progress}%</Text>
              </View>

              <View style={styles.taskDetails}>
                <View style={styles.taskDetailRow}>
                  <Package color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.taskDetailText}>{task.packages} colis</Text>
                </View>
                <View style={styles.taskDetailRow}>
                  <Users color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.taskDetailText}>{task.teamSize} équipiers</Text>
                </View>
              </View>

              <View style={styles.taskFooter}>
                <View style={styles.taskStatus}>
                  {task.status === 'Terminé' ? (
                    <CheckCircle color="#10b981" size={16} strokeWidth={2} />
                  ) : (
                    <Clock color="#f59e0b" size={16} strokeWidth={2} />
                  )}
                  <Text style={styles.statusText}>{task.status}</Text>
                </View>
                <Text style={styles.deadlineText}>{task.deadline}</Text>
              </View>
            </View>
          ))}
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
});