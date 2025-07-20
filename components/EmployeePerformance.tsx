import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { 
  TrendingUp, 
  Clock, 
  User, 
  Award, 
  Target, 
  CheckCircle, 
  X,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface PerformanceLog {
  id: number;
  team_member_id: number;
  task_id: string;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  performance_score: number;
  completion_date: string;
  notes?: string;
  created_at: string;
}

interface EmployeePerformanceStats {
  id: number;
  name: string;
  role: string;
  current_performance: number;
  tasks_completed: number;
  total_tasks: number;
  avg_performance: number;
  min_performance: number;
  max_performance: number;
  avg_actual_duration: number;
  avg_estimated_duration: number;
  excellent_tasks: number;
  good_tasks: number;
  average_tasks: number;
  poor_tasks: number;
}

interface TaskCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  estimatedDuration: number;
  onCompletion: (performanceScore: number) => void;
}

export default function EmployeePerformance() {
  const { isDark } = useTheme();
  const [performanceStats, setPerformanceStats] = useState<EmployeePerformanceStats[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformanceStats | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string; estimatedDuration: number } | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les statistiques de performance
      const { data: statsData, error: statsError } = await supabase
        .from('employee_performance_stats')
        .select('*')
        .order('avg_performance', { ascending: false });

      if (statsError) throw statsError;
      setPerformanceStats(statsData || []);

      // Charger les logs de performance récents
      const { data: logsData, error: logsError } = await supabase
        .from('performance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;
      setPerformanceLogs(logsData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des données de performance:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de performance');
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Vert - Excellent
    if (score >= 75) return '#3b82f6'; // Bleu - Bon
    if (score >= 50) return '#f59e0b'; // Orange - Moyen
    return '#ef4444'; // Rouge - À améliorer
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'À améliorer';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <Award color="#10b981" size={16} strokeWidth={2} />;
    if (score >= 75) return <TrendingUp color="#3b82f6" size={16} strokeWidth={2} />;
    if (score >= 50) return <Target color="#f59e0b" size={16} strokeWidth={2} />;
    return <Target color="#ef4444" size={16} strokeWidth={2} />;
  };

  const handleTaskCompletion = async (
    taskId: string,
    teamMemberId: number,
    actualStartTime: string,
    actualEndTime: string,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('update_employee_performance', {
        p_task_id: taskId,
        p_team_member_id: teamMemberId,
        p_actual_start_time: actualStartTime,
        p_actual_end_time: actualEndTime,
        p_completion_notes: notes
      });

      if (error) throw error;

      Alert.alert(
        'Tâche terminée',
        `Performance: ${data}% - ${getPerformanceLevel(data)}`,
        [{ text: 'OK', onPress: () => loadPerformanceData() }]
      );

      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Erreur lors de la finalisation de la tâche:', error);
      Alert.alert('Erreur', 'Impossible de finaliser la tâche');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
          Chargement des performances...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerContent}>
          <BarChart3 color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Performance des Employés
          </Text>
        </View>
        <TouchableOpacity onPress={loadPerformanceData} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiques globales */}
        <View style={[styles.statsSection, isDark && styles.statsSectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Vue d'ensemble
          </Text>
          
          <View style={styles.globalStats}>
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <User color="#3b82f6" size={20} strokeWidth={2} />
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {performanceStats.length}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Employés</Text>
            </View>
            
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <CheckCircle color="#10b981" size={20} strokeWidth={2} />
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {performanceStats.reduce((sum, emp) => sum + emp.tasks_completed, 0)}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Tâches terminées</Text>
            </View>
            
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <Award color="#f59e0b" size={20} strokeWidth={2} />
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {performanceStats.length > 0 
                  ? Math.round(performanceStats.reduce((sum, emp) => sum + emp.avg_performance, 0) / performanceStats.length)
                  : 0}%
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Performance moyenne</Text>
            </View>
          </View>
        </View>

        {/* Liste des employés */}
        <View style={[styles.employeesSection, isDark && styles.employeesSectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Performance par employé
          </Text>
          
          {performanceStats.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={[styles.employeeCard, isDark && styles.employeeCardDark]}
              onPress={() => setSelectedEmployee(employee)}
            >
              <View style={styles.employeeHeader}>
                <View style={styles.employeeInfo}>
                  <Text style={[styles.employeeName, isDark && styles.employeeNameDark]}>
                    {employee.name}
                  </Text>
                  <Text style={[styles.employeeRole, isDark && styles.employeeRoleDark]}>
                    {employee.role}
                  </Text>
                </View>
                
                <View style={styles.performanceIndicator}>
                  {getPerformanceIcon(employee.avg_performance)}
                  <Text style={[
                    styles.performanceScore,
                    { color: getPerformanceColor(employee.avg_performance) }
                  ]}>
                    {employee.avg_performance}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.employeeStats}>
                <View style={styles.statRow}>
                  <Clock color={isDark ? '#9ca3af' : '#6b7280'} size={14} strokeWidth={2} />
                  <Text style={[styles.statText, isDark && styles.statTextDark]}>
                    {employee.tasks_completed} tâches terminées
                  </Text>
                </View>
                
                <View style={styles.statRow}>
                  <Target color={isDark ? '#9ca3af' : '#6b7280'} size={14} strokeWidth={2} />
                  <Text style={[styles.statText, isDark && styles.statTextDark]}>
                    {employee.excellent_tasks} excellentes, {employee.good_tasks} bonnes
                  </Text>
                </View>
              </View>
              
              <View style={styles.performanceBar}>
                <View 
                  style={[
                    styles.performanceFill,
                    { 
                      width: `${employee.avg_performance}%`,
                      backgroundColor: getPerformanceColor(employee.avg_performance)
                    }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logs récents */}
        <View style={[styles.logsSection, isDark && styles.logsSectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Activité récente
          </Text>
          
          {performanceLogs.slice(0, 5).map((log) => (
            <View key={log.id} style={[styles.logCard, isDark && styles.logCardDark]}>
              <View style={styles.logHeader}>
                <Text style={[styles.logDate, isDark && styles.logDateDark]}>
                  {formatDate(log.completion_date)}
                </Text>
                <Text style={[
                  styles.logScore,
                  { color: getPerformanceColor(log.performance_score) }
                ]}>
                  {log.performance_score}%
                </Text>
              </View>
              
              <View style={styles.logDetails}>
                <Text style={[styles.logText, isDark && styles.logTextDark]}>
                  Estimé: {formatDuration(log.estimated_duration_minutes)}
                </Text>
                <Text style={[styles.logText, isDark && styles.logTextDark]}>
                  Réel: {formatDuration(log.actual_duration_minutes)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal de détail employé */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          visible={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onTaskCompletion={(taskId, title, estimatedDuration) => {
            setSelectedTask({ id: taskId, title, estimatedDuration });
            setShowTaskModal(true);
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* Modal de finalisation de tâche */}
      {selectedTask && (
        <TaskCompletionModal
          visible={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          estimatedDuration={selectedTask.estimatedDuration}
          onCompletion={(performanceScore) => {
            console.log('Performance score:', performanceScore);
          }}
        />
      )}
    </View>
  );
}

// Composant modal pour les détails d'un employé
interface EmployeeDetailModalProps {
  employee: EmployeePerformanceStats;
  visible: boolean;
  onClose: () => void;
  onTaskCompletion: (taskId: string, title: string, estimatedDuration: number) => void;
}

function EmployeeDetailModal({ employee, visible, onClose, onTaskCompletion }: EmployeeDetailModalProps) {
  const { isDark } = useTheme();
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadRecentTasks();
    }
  }, [visible, employee.id]);

  const loadRecentTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks_with_performance')
        .select('*')
        .eq('completed_by', employee.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTasks(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches récentes:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {employee.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                  Performance moyenne
                </Text>
                <Text style={[styles.detailValue, { color: getPerformanceColor(employee.avg_performance) }]}>
                  {employee.avg_performance}%
                </Text>
              </View>
              
              <View style={styles.detailStat}>
                <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                  Tâches terminées
                </Text>
                <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                  {employee.tasks_completed}
                </Text>
              </View>
            </View>

            <View style={styles.performanceBreakdown}>
              <Text style={[styles.breakdownTitle, isDark && styles.breakdownTitleDark]}>
                Répartition des performances
              </Text>
              
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: '#10b981' }]} />
                <Text style={[styles.breakdownText, isDark && styles.breakdownTextDark]}>
                  Excellent (90%+) : {employee.excellent_tasks}
                </Text>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={[styles.breakdownText, isDark && styles.breakdownTextDark]}>
                  Bon (75-89%) : {employee.good_tasks}
                </Text>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={[styles.breakdownText, isDark && styles.breakdownTextDark]}>
                  Moyen (50-74%) : {employee.average_tasks}
                </Text>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[styles.breakdownText, isDark && styles.breakdownTextDark]}>
                  À améliorer (&lt;50%) : {employee.poor_tasks}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Composant modal pour finaliser une tâche
function TaskCompletionModal({ 
  visible, 
  onClose, 
  taskId, 
  taskTitle, 
  estimatedDuration, 
  onCompletion 
}: TaskCompletionModalProps) {
  const { isDark } = useTheme();
  const [actualStartTime, setActualStartTime] = useState('');
  const [actualEndTime, setActualEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadEmployees();
    }
  }, [visible]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, role')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  };

  const handleSubmit = () => {
    if (!selectedEmployeeId || !actualStartTime || !actualEndTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Ici vous appelleriez la fonction de finalisation
    onCompletion(85); // Score exemple
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              Finaliser la tâche
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.taskTitle, isDark && styles.taskTitleDark]}>
              {taskTitle}
            </Text>
            
            <Text style={[styles.estimatedDuration, isDark && styles.estimatedDurationDark]}>
              Durée estimée : {Math.floor(estimatedDuration / 60)}h{estimatedDuration % 60}min
            </Text>

            {/* Sélection de l'employé */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Employé responsable
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.employeeSelector}>
                  {employees.map((emp) => (
                    <TouchableOpacity
                      key={emp.id}
                      style={[
                        styles.employeeOption,
                        selectedEmployeeId === emp.id && styles.selectedEmployeeOption,
                        isDark && styles.employeeOptionDark
                      ]}
                      onPress={() => setSelectedEmployeeId(emp.id)}
                    >
                      <Text style={[
                        styles.employeeOptionText,
                        selectedEmployeeId === emp.id && styles.selectedEmployeeOptionText,
                        isDark && styles.employeeOptionTextDark
                      ]}>
                        {emp.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Heures réelles */}
            <View style={styles.timeInputs}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                  Heure de début
                </Text>
                <TextInput
                  style={[styles.textInput, isDark && styles.textInputDark]}
                  value={actualStartTime}
                  onChangeText={setActualStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                  Heure de fin
                </Text>
                <TextInput
                  style={[styles.textInput, isDark && styles.textInputDark]}
                  value={actualEndTime}
                  onChangeText={setActualEndTime}
                  placeholder="HH:MM"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Notes (optionnel)
              </Text>
              <TextInput
                style={[styles.textArea, isDark && styles.textAreaDark]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Commentaires sur la tâche..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Finaliser la tâche</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerDark: {
    borderBottomColor: '#374151',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerTitleDark: {
    color: '#f4f4f5',
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingTextDark: {
    color: '#9ca3af',
  },
  statsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsSectionDark: {
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#f4f4f5',
  },
  globalStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statValueDark: {
    color: '#f4f4f5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  employeesSection: {
    padding: 20,
  },
  employeesSectionDark: {
    backgroundColor: '#18181b',
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  employeeCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  employeeNameDark: {
    color: '#f4f4f5',
  },
  employeeRole: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  employeeRoleDark: {
    color: '#9ca3af',
  },
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  performanceScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  employeeStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statTextDark: {
    color: '#9ca3af',
  },
  performanceBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 2,
  },
  logsSection: {
    padding: 20,
  },
  logsSectionDark: {
    backgroundColor: '#18181b',
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  logDateDark: {
    color: '#9ca3af',
  },
  logScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  logDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  logText: {
    fontSize: 12,
    color: '#6b7280',
  },
  logTextDark: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderDark: {
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalTitleDark: {
    color: '#f4f4f5',
  },
  modalBody: {
    padding: 20,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailStat: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailLabelDark: {
    color: '#9ca3af',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailValueDark: {
    color: '#f4f4f5',
  },
  performanceBreakdown: {
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  breakdownTitleDark: {
    color: '#f4f4f5',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownText: {
    fontSize: 14,
    color: '#6b7280',
  },
  breakdownTextDark: {
    color: '#9ca3af',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  taskTitleDark: {
    color: '#f4f4f5',
  },
  estimatedDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  estimatedDurationDark: {
    color: '#9ca3af',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  inputLabelDark: {
    color: '#f4f4f5',
  },
  employeeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  employeeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  employeeOptionDark: {
    borderColor: '#374151',
  },
  selectedEmployeeOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  employeeOptionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  employeeOptionTextDark: {
    color: '#9ca3af',
  },
  selectedEmployeeOptionText: {
    color: '#ffffff',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  textInputDark: {
    borderColor: '#374151',
    color: '#f4f4f5',
    backgroundColor: '#374151',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#374151',
    color: '#f4f4f5',
    backgroundColor: '#374151',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Fonction utilitaire pour obtenir la couleur de performance
function getPerformanceColor(score: number) {
  if (score >= 90) return '#10b981'; // Vert - Excellent
  if (score >= 75) return '#3b82f6'; // Bleu - Bon
  if (score >= 50) return '#f59e0b'; // Orange - Moyen
  return '#ef4444'; // Rouge - À améliorer
} 