import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus,
  X,
  Check
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  priority: 'low' | 'medium' | 'high';
}

type ViewMode = 'month' | 'week' | 'day';

export default function FutureTasksCalendar() {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    time: '09:00',
    priority: 'medium' as const,
  });

  // Fonctions utilitaires pour les dates
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const addTask = () => {
    if (!newTask.title.trim() || !selectedDate) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      date: selectedDate,
      time: newTask.time,
      priority: newTask.priority,
    };
    
    setTasks([...tasks, task]);
    setNewTask({ title: '', description: '', time: '09:00', priority: 'medium' });
    setShowAddModal(false);
    setSelectedDate(null);
  };

  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => setTasks(tasks.filter(task => task.id !== taskId))
        },
      ]
    );
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Fonction pour aller directement à une date spécifique
  const goToSpecificDate = (date: Date) => {
    setCurrentDate(date);
  };

  // Fonction pour générer des options de dates rapides
  const generateQuickDateOptions = () => {
    const today = new Date();
    const options = [];
    
    // Aujourd'hui
    options.push({ label: 'Aujourd\'hui', date: new Date(today) });
    
    // Demain
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    options.push({ label: 'Demain', date: tomorrow });
    
    // Dans une semaine
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    options.push({ label: 'Dans une semaine', date: nextWeek });
    
    // Dans deux semaines
    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);
    options.push({ label: 'Dans 2 semaines', date: twoWeeks });
    
    // Dans un mois
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    options.push({ label: 'Dans un mois', date: nextMonth });
    
    // Dans deux mois
    const twoMonths = new Date(today);
    twoMonths.setMonth(today.getMonth() + 2);
    options.push({ label: 'Dans 2 mois', date: twoMonths });
    
    // Dans trois mois
    const threeMonths = new Date(today);
    threeMonths.setMonth(today.getMonth() + 3);
    options.push({ label: 'Dans 3 mois', date: threeMonths });
    
    return options;
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const days = [];
    
    // Jours du mois précédent
    for (let i = 0; i < startingDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayTasks = getTasksForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isDark && styles.calendarDayDark,
            isToday && styles.today,
            dayTasks.length > 0 && styles.hasTasks
          ]}
          onPress={() => {
            setSelectedDate(date);
            setShowAddModal(true);
          }}
        >
          <Text style={[styles.dayNumber, isDark && styles.dayNumberDark, isToday && styles.todayText]}>
            {day}
          </Text>
          {dayTasks.length > 0 && (
            <View style={styles.taskIndicator}>
              <Text style={styles.taskCount}>{dayTasks.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.calendarGrid}>
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <Text key={day} style={[styles.weekdayHeader, isDark && styles.weekdayHeaderDark]}>{day}</Text>
        ))}
        {days}
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    
    return (
      <ScrollView horizontal contentContainerStyle={{flexGrow:1}} showsHorizontalScrollIndicator={false}>
        <View style={styles.weekContainer}>
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.weekDay,
                  isToday && styles.today,
                  dayTasks.length > 0 && styles.hasTasks
                ]}
                onPress={() => {
                  setSelectedDate(day);
                  setShowAddModal(true);
                }}
              >
                <Text style={[styles.weekdayName, isToday && styles.todayText]}>
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </Text>
                <Text style={[styles.weekdayNumber, isToday && styles.todayText]}>
                  {day.getDate()}
                </Text>
                {dayTasks.length > 0 && (
                  <View style={styles.taskIndicator}>
                    <Text style={styles.taskCount}>{dayTasks.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <View style={styles.dayContainer}>
        <View style={[styles.dayHeader, isToday && styles.today]}>
          <Text style={[styles.dayTitle, isToday && styles.todayText]}>
            {currentDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        
        <ScrollView style={styles.tasksList} contentContainerStyle={{flexGrow:1}}>
          {dayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar color="#6b7280" size={48} strokeWidth={1} />
              <Text style={styles.emptyText}>Aucune tâche planifiée</Text>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => {
                  setSelectedDate(currentDate);
                  setShowAddModal(true);
                }}
              >
                <Plus color="#ffffff" size={20} strokeWidth={2} />
                <Text style={styles.addTaskButtonText}>Ajouter une tâche</Text>
              </TouchableOpacity>
            </View>
          ) : (
            dayTasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskTime}>{task.time}</Text>
                  </View>
                  <View style={[styles.priorityBadge, styles[`priority${task.priority}`]]}>
                    <Text style={styles.priorityText}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Text>
                  </View>
                </View>
                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTask(task.id)}
                >
                  <X color="#ef4444" size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderViewMode = () => {
    switch (viewMode) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header avec navigation et sélecteur de vue */}
      <View style={styles.header}>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={() => navigateDate('prev')}>
            <ChevronLeft color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
          </TouchableOpacity>
          
          <Text style={[styles.currentDateText, isDark && styles.currentDateTextDark]}>
            {viewMode === 'month' && currentDate.toLocaleDateString('fr-FR', { 
              month: 'long', 
              year: 'numeric' 
            })}
            {viewMode === 'week' && `Semaine du ${getWeekDays(currentDate)[0].toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short' 
            })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          
          <TouchableOpacity onPress={() => navigateDate('next')}>
            <ChevronRight color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewModeSelector}>
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton, 
                isDark && styles.viewModeButtonDark,
                viewMode === mode && styles.activeViewMode
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={[
                styles.viewModeText, 
                isDark && styles.viewModeTextDark,
                viewMode === mode && styles.activeViewModeText
              ]}>
                {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Bouton pour accéder rapidement à des dates */}
        <TouchableOpacity 
          style={[styles.quickDateButton, isDark && styles.quickDateButtonDark]}
          onPress={() => {
            // Afficher un modal avec les options de dates rapides
            Alert.alert(
              'Aller à une date',
              'Choisissez une date rapide :',
              generateQuickDateOptions().map(option => ({
                text: option.label,
                onPress: () => goToSpecificDate(option.date)
              })).concat([
                { text: 'Annuler', style: 'cancel' }
              ])
            );
          }}
        >
          <Calendar color={isDark ? "#60a5fa" : "#3b82f6"} size={16} strokeWidth={2} />
          <Text style={[styles.quickDateButtonText, isDark && styles.quickDateButtonTextDark]}>Dates rapides</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu du calendrier */}
      <View style={styles.calendarContent}>
        {renderViewMode()}
      </View>

      {/* Modal d'ajout de tâche */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Nouvelle tâche</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Titre de la tâche"
              placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
              value={newTask.title}
              onChangeText={(text) => setNewTask({...newTask, title: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, isDark && styles.inputDark]}
              placeholder="Description (optionnel)"
              placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
              value={newTask.description}
              onChangeText={(text) => setNewTask({...newTask, description: text})}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Heure (HH:MM)"
              placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
              value={newTask.time}
              onChangeText={(text) => setNewTask({...newTask, time: text})}
            />
            
            <View style={styles.prioritySelector}>
              <Text style={[styles.priorityLabel, isDark && styles.priorityLabelDark]}>Priorité :</Text>
              {(['low', 'medium', 'high'] as const).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    newTask.priority === priority && styles.selectedPriority
                  ]}
                  onPress={() => setNewTask({...newTask, priority})}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    newTask.priority === priority && styles.selectedPriorityText
                  ]}>
                    {priority === 'high' ? 'Haute' : priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Check color="#ffffff" size={20} strokeWidth={2} />
              <Text style={styles.addButtonText}>Ajouter la tâche</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  containerDark: {
    backgroundColor: '#27272a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginHorizontal: 16,
  },
  currentDateTextDark: {
    color: '#ffffff',
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeButtonDark: {
    backgroundColor: '#3f3f46',
  },
  activeViewMode: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  viewModeTextDark: {
    color: '#a1a1aa',
  },
  activeViewModeText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  quickDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  quickDateButtonDark: {
    backgroundColor: '#1e293b',
  },
  quickDateButtonText: {
    color: '#3b82f6',
    marginLeft: 4,
    fontSize: 12,
  },
  quickDateButtonTextDark: {
    color: '#60a5fa',
  },
  calendarContent: {
    flex: 1,
    padding: 20,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekdayHeader: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  weekdayHeaderDark: {
    color: '#a1a1aa',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayDark: {
    backgroundColor: '#18181b',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  dayNumberDark: {
    color: '#ffffff',
  },
  today: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  hasTasks: {
    backgroundColor: '#fef3c7',
  },
  taskIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  weekContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  weekDay: {
    width: 80,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weekdayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  weekdayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayContainer: {
    flex: 1,
  },
  dayHeader: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  tasksList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addTaskButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  taskItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityhigh: {
    backgroundColor: '#fef2f2',
  },
  prioritymedium: {
    backgroundColor: '#fef3c7',
  },
  prioritylow: {
    backgroundColor: '#f0fdf4',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputDark: {
    backgroundColor: '#18181b',
    color: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 12,
  },
  priorityLabelDark: {
    color: '#ffffff',
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedPriority: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedPriorityText: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 