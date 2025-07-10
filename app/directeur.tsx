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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, Users, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Target, Bell, X, Package, Timer, LogOut, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { PerformanceService } from '../services/PerformanceService';
import { useSupabaseTasks } from '../hooks/useSupabaseTasks';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';

const { width } = Dimensions.get('window');

interface Alert {
  id: number;
  managerId: number;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

export default function DirecteurDashboard() {
  const [alertModal, setAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [managersPerformance, setManagersPerformance] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Hooks pour récupérer les données
  const { tasks: allTasks, isLoading: tasksLoading } = useSupabaseTasks({});
  const { users: allUsers, isLoading: usersLoading } = useSupabaseUsers();

  // Charger les données de performance
  useEffect(() => {
    const loadPerformanceData = async () => {
      if (tasksLoading || usersLoading || !allUsers || !allTasks) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Filtrer les managers
        const managers = allUsers.filter(user => user.role === 'manager');
        console.log('📊 Managers trouvés:', managers.length, managers.map(m => ({ name: m.full_name, section: m.section })));
        
        // Calculer les performances seulement pour les managers avec des vraies tâches
        const performanceData = [];
        
        managers.forEach(manager => {
          // Chercher les vraies tâches du manager
          const managerTasks = allTasks.filter(task => {
            console.log(`🔍 Vérification tâche pour manager ${manager.full_name}:`, {
              taskManagerId: task.manager_id,
              userManagerId: manager.app_metadata?.user_id?.toString(),
              match: task.manager_id === manager.app_metadata?.user_id?.toString()
            });
            return task.manager_id === manager.app_metadata?.user_id?.toString();
          });
          
          console.log(`📋 Tâches trouvées pour ${manager.full_name}:`, managerTasks.length);
          
          // N'ajouter que les managers qui ont des tâches réelles
          if (managerTasks.length > 0) {
            const performance = PerformanceService.calculateManagerPerformance(
              manager.app_metadata?.user_id?.toString() || manager.id,
              manager.full_name || manager.username || 'Manager',
              manager.section || 'Section inconnue',
              managerTasks
            );
            
            console.log(`📊 Performance calculée pour ${manager.full_name}:`, performance);
            performanceData.push(performance);
          } else {
            console.log(`⚠️ Manager ${manager.full_name} ignoré (aucune tâche réelle)`);
          }
        });

        console.log('📊 Données de performance générées:', performanceData.length);
        
        // Calculer les statistiques globales
        const stats = PerformanceService.calculateGlobalStats(performanceData);
        
        setManagersPerformance(performanceData);
        setGlobalStats(stats);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données de performance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [allTasks, allUsers, tasksLoading, usersLoading]);

  const alerts = [
    {
      id: 1,
      managerId: 2,
      type: 'performance',
      severity: 'warning',
      message: 'Performance en baisse de 8% cette semaine - Boucherie',
      timestamp: '2 heures'
    },
    {
      id: 2,
      managerId: 4,
      type: 'packages',
      severity: 'critical',
      message: 'Charcuterie très en retard - seulement 187/400 colis traités',
      timestamp: '30 minutes'
    },
    {
      id: 3,
      managerId: 4,
      type: 'delay',
      severity: 'critical',
      message: 'Retard critique sur traitement Charcuterie - 2h53min restantes',
      timestamp: '1 heure'
    },
    {
      id: 4,
      managerId: 8,
      type: 'time',
      severity: 'warning',
      message: 'Surgelés - Temps de traitement serré: 1h04min restantes',
      timestamp: '45 minutes'
    }
  ];

  // Calculate remaining time for each manager
  const calculateRemainingTime = (manager: any) => {
    const remainingPackages = manager.totalPackages - manager.packagesProcessed;
    const baseTimePerPackage = 40; // 40 seconds per package
    
    // Calculate additional time for extra team members (30 min per extra member)
    const extraMembers = manager.teamSize - 1; // First member doesn't count
    const reinforcementPenalty = manager.reinforcementWorker > 0 ? 15 : 0; // 15 min penalty for reinforcement worker
    const additionalMinutes = (extraMembers * 30) + reinforcementPenalty;
    
    // Base time in seconds
    const baseTimeSeconds = remainingPackages * baseTimePerPackage;
    
    // Add additional time in seconds
    const totalTimeSeconds = baseTimeSeconds + (additionalMinutes * 60);
    
    // Convert to hours and minutes
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    
    return { hours, minutes, totalMinutes: Math.floor(totalTimeSeconds / 60) };
  };

  // Calculer les statistiques avec les nouvelles données
  const averagePackages = globalStats.processedPackages || 0;
  const avgRemainingHours = Math.floor((globalStats.averageRemainingTime || 0) / 60);
  const avgRemainingMinutes = Math.floor((globalStats.averageRemainingTime || 0) % 60);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getPackageStatusColor = (packages: number, total: number) => {
    const percentage = (packages / total) * 100;
    if (percentage >= 90) return '#10b981'; // excellent
    if (percentage >= 75) return '#3b82f6'; // good
    if (percentage >= 60) return '#f59e0b'; // warning
    return '#ef4444'; // critical
  };

  const getTimeStatusColor = (totalMinutes: number) => {
    if (totalMinutes <= 60) return '#10b981'; // excellent - less than 1 hour
    if (totalMinutes <= 120) return '#3b82f6'; // good - less than 2 hours
    if (totalMinutes <= 180) return '#f59e0b'; // warning - less than 3 hours
    return '#ef4444'; // critical - more than 3 hours
  };

  const showAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setAlertModal(true);
  };

  const handleLogout = () => {
    router.replace('/');
  };

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      if (criticalAlerts.length > 0 && Math.random() > 0.7) {
        const randomAlert = criticalAlerts[Math.floor(Math.random() * criticalAlerts.length)];
        showAlert(randomAlert);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Dashboard Agroalimentaire</Text>
            <Text style={styles.subtitle}>Supervision des rayons et équipes</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.userManagementButton}
              onPress={() => router.push('/user-management')}
            >
              <Settings color="#3b82f6" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.employeeManagementButton}
              onPress={() => router.push('/employee-management')}
            >
              <Users color="#10b981" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertButton}>
              <Bell color="#ef4444" size={24} strokeWidth={2} />
              {alerts.length > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{alerts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Global Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users color="#3b82f6" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{isLoading ? '...' : managersPerformance.length}</Text>
            <Text style={styles.statLabel}>Rayons</Text>
          </View>
          <View style={styles.statCard}>
            <Package color="#10b981" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{isLoading ? '...' : averagePackages}</Text>
            <Text style={styles.statLabel}>Colis/jour</Text>
          </View>
          <View style={styles.statCard}>
            <Timer color="#f59e0b" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{isLoading ? '...' : `${avgRemainingHours}h${avgRemainingMinutes.toString().padStart(2, '0')}`}</Text>
            <Text style={styles.statLabel}>Temps moy.</Text>
          </View>
          <View style={styles.statCard}>
            <AlertTriangle color="#ef4444" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{isLoading ? '...' : (globalStats.totalAlerts || alerts.length)}</Text>
            <Text style={styles.statLabel}>Alertes</Text>
          </View>
        </View>

        {/* Critical Alerts */}
        {alerts.filter(alert => alert.severity === 'critical').length > 0 && (
          <View style={styles.criticalSection}>
            <Text style={styles.criticalTitle}>🚨 Alertes Critiques</Text>
            {alerts.filter(alert => alert.severity === 'critical').map((alert) => (
              <TouchableOpacity 
                key={alert.id} 
                style={styles.criticalAlert}
                onPress={() => showAlert(alert)}
              >
                <AlertTriangle color="#ef4444" size={20} strokeWidth={2} />
                <View style={styles.criticalContent}>
                  <Text style={styles.criticalMessage}>{alert.message}</Text>
                  <Text style={styles.criticalTime}>Il y a {alert.timestamp}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Managers Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance des Rayons</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des données de performance...</Text>
            </View>
          ) : managersPerformance.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Aucune tâche planifiée trouvée.{'\n'}
                Seuls les managers ayant planifié des tâches apparaissent ici.
              </Text>
            </View>
          ) : (
            <View style={styles.managersGrid}>
              {managersPerformance.map((manager) => {
                const remainingTime = {
                  hours: Math.floor(manager.remainingTimeMinutes / 60),
                  minutes: manager.remainingTimeMinutes % 60,
                  totalMinutes: manager.remainingTimeMinutes
                };
                
                return (
                  <View key={manager.id} style={styles.managerCard}>
                    <View style={styles.managerHeader}>
                      <View style={styles.managerInfo}>
                        <Text style={styles.managerName}>{manager.name}</Text>
                        <Text style={styles.managerSection}>{manager.section}</Text>
                      </View>
                      <View 
                        style={[
                          styles.statusIndicator, 
                          { backgroundColor: getStatusColor(manager.status) }
                        ]} 
                      />
                    </View>

                    <View style={styles.metricsContainer}>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>Colis traités (aujourd'hui)</Text>
                        <View style={styles.packageMetric}>
                          <Package color={getPackageStatusColor(manager.packagesProcessed, manager.totalPackages)} size={16} strokeWidth={2} />
                          <Text style={[styles.packageCount, { color: getPackageStatusColor(manager.packagesProcessed, manager.totalPackages) }]}>
                            {manager.packagesProcessed} / {manager.totalPackages}
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: manager.totalPackages > 0 ? `${(manager.packagesProcessed / manager.totalPackages) * 100}%` : '0%',
                                backgroundColor: getPackageStatusColor(manager.packagesProcessed, manager.totalPackages)
                              }
                            ]} 
                          />
                        </View>
                      </View>

                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>Temps restant estimé</Text>
                        <View style={styles.timeMetric}>
                          <Timer color={getTimeStatusColor(remainingTime.totalMinutes)} size={16} strokeWidth={2} />
                          <Text style={[styles.timeCount, { color: getTimeStatusColor(remainingTime.totalMinutes) }]}>
                            {remainingTime.hours}h {remainingTime.minutes.toString().padStart(2, '0')}min
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${Math.min((remainingTime.totalMinutes / 240) * 100, 100)}%`,
                                backgroundColor: getTimeStatusColor(remainingTime.totalMinutes)
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.managerFooter}>
                      <View style={styles.teamInfo}>
                        <Users color="#6b7280" size={16} strokeWidth={2} />
                        <Text style={styles.teamSize}>
                          {manager.teamSize} équipiers
                          {manager.reinforcementWorker > 0 && ` + ${manager.reinforcementWorker} renfort`}
                        </Text>
                      </View>
                      {manager.alerts > 0 && (
                        <View style={styles.alertCount}>
                          <AlertTriangle color="#ef4444" size={16} strokeWidth={2} />
                          <Text style={styles.alertCountText}>{manager.alerts}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Performance Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évolution Globale</Text>
          <View style={styles.chartContainer}>
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.chartHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <BarChart3 color="#ffffff" size={24} strokeWidth={2} />
              <Text style={styles.chartTitle}>Traitement des colis - 30 derniers jours</Text>
            </LinearGradient>
            <View style={styles.chartBody}>
              <Text style={styles.chartPlaceholder}>Graphique de traitement des colis</Text>
              <Text style={styles.chartNote}>Données agrégées de tous les rayons</Text>
            </View>
          </View>
        </View>

        {/* Add bottom padding to account for logout button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Right Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut color="#ffffff" size={24} strokeWidth={2} />
      </TouchableOpacity>

      {/* Alert Modal */}
      <Modal
        visible={alertModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle 
                color={getSeverityColor(selectedAlert?.severity || 'warning')} 
                size={24} 
                strokeWidth={2} 
              />
              <Text style={styles.modalTitle}>Alerte Critique</Text>
              <TouchableOpacity onPress={() => setAlertModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalMessage}>
              {selectedAlert?.message || 'Aucun message disponible'}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setAlertModal(false)}
              >
                <Text style={styles.modalButtonText}>Ignorer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => setAlertModal(false)}
              >
                <Text style={styles.primaryButtonText}>Intervenir</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userManagementButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeManagementButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  alertButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  alertBadge: {
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
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  criticalSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  criticalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 16,
  },
  criticalAlert: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  criticalContent: {
    marginLeft: 12,
    flex: 1,
  },
  criticalMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  criticalTime: {
    fontSize: 12,
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
  managersGrid: {
    gap: 16,
  },
  managerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  managerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  managerSection: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metric: {
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  packageMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageCount: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeCount: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  managerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSize: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  alertCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alertCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  chartPlaceholder: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  chartNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100, // Space for the logout button
  },
  logoutButton: {
    position: 'absolute',
    bottom: 30,
    right: 30, // Moved to bottom right
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 24,
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
    backgroundColor: '#ef4444',
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
  loadingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
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
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});