import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Users,
  Target,
  Coffee,
  Plus,
  Calculator,
  Filter,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  BarChart3,
  Settings,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowLeft
} from 'lucide-react-native';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useSupabaseEmployees } from '../../hooks/useSupabaseEmployees';
import { useSupabaseBreaks } from '../../hooks/useSupabaseBreaks';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useSupabaseEvents } from '../../hooks/useSupabaseEvents';
import { useSupabaseAlerts } from '../../hooks/useSupabaseAlerts';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import WorkingHoursPresets from '../../components/WorkingHoursPresets';
import { NotificationService } from '../../services/NotificationService';

const { width, height } = Dimensions.get('window');

interface PlanningItem {
  id: string;
  employeeId: number;
  employeeName: string;
  type: 'task' | 'break' | 'event' | 'recurring-event';
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in-progress' | 'completed' | 'delayed';
  isHidden?: boolean;
  recurringEventId?: string;
  delayReason?: string;
  delayMinutes?: number;
}

interface WorkingHoursPreset {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isDefault?: boolean;
}

interface FilterOptions {
  showTasks: boolean;
  showBreaks: boolean;
  showEvents: boolean;
  showRecurringEvents: boolean;
  selectedEmployees: number[];
  priority: string[];
}

export default function RayonPlanningScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useSupabaseAuth();
  const { profile } = useUserProfile();
  
  // États principaux
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [showFilters, setShowFilters] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlanningItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [showDelaySelectionModal, setShowDelaySelectionModal] = useState(false);
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<PlanningItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  
  // États pour les filtres
  const [filters, setFilters] = useState<FilterOptions>({
    showTasks: true,
    showBreaks: true,
    showEvents: true,
    showRecurringEvents: true,
    selectedEmployees: [],
    priority: []
  });
  
  // États pour les heures de travail
  const [workingHours, setWorkingHours] = useState({
    start: '06:30',
    end: '12:00'
  });
  
  // État pour le preset sélectionné
  const [selectedPreset, setSelectedPreset] = useState<WorkingHoursPreset | null>({
    id: '1',
    name: 'Matin',
    startTime: '06:30',
    endTime: '12:00',
    isDefault: true
  });

  // Récupération des données
  const { employees: teamMembers, loading: employeesLoading } = useSupabaseEmployees(
    profile?.section ? { section: profile.section } : undefined
  );

  const { breaks: allBreaks, loading: breaksLoading } = useSupabaseBreaks({
    date: selectedDate.toISOString().split('T')[0]
  });

  const { tasks, loading: tasksLoading, deleteTask } = useSupabaseTasks({
    managerId: user?.id?.toString()
  });

  const { events: recurringEvents, loading: eventsLoading, deleteEvent } = useSupabaseEvents({
    managerId: user?.id ? parseInt(user.id) : undefined
  });

  const { createAlert } = useSupabaseAlerts();

  // Génération des heures de la journée
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Génération des jours de la semaine
  const generateWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Obtenir tous les événements pour une date donnée avec filtres
  const getAllEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const events: PlanningItem[] = [];
    
    const teamMemberIds = new Set(teamMembers.map(emp => emp.id));
    
    // Ajouter les pauses (filtrées)
    if (filters.showBreaks) {
      allBreaks.forEach(breakItem => {
        if (breakItem.date === dateString && teamMemberIds.has(breakItem.employee_id)) {
          const employee = teamMembers.find(emp => emp.id === breakItem.employee_id);
          if (employee && (filters.selectedEmployees.length === 0 || filters.selectedEmployees.includes(breakItem.employee_id))) {
            events.push({
              id: `break-${breakItem.id}`,
              employeeId: breakItem.employee_id,
              employeeName: employee.name,
              type: 'break',
              title: breakItem.break_type === 'pause' ? 'Pause' : breakItem.break_type,
              startTime: breakItem.start_time,
              endTime: breakItem.end_time,
              color: '#3b82f6',
              description: breakItem.description,
              status: 'completed'
            });
          }
        }
      });
    }
    
    // Ajouter les tâches (filtrées)
    if (filters.showTasks) {
      tasks.forEach(task => {
        if (task.date === dateString) {
          events.push({
            id: `task-${task.id}`,
            employeeId: 0,
            employeeName: 'Équipe',
            type: 'task',
            title: task.title,
            startTime: task.start_time,
            endTime: task.end_time,
            color: '#10b981',
            description: task.description,
            priority: 'medium',
            status: 'pending',
            recurringEventId: task.recurring_event_id
          });
        }
      });
    }
    
    // Ajouter les événements récurrents (filtrés)
    if (filters.showRecurringEvents) {
      recurringEvents.forEach(event => {
        if (event.is_active) {
          // Vérifier si l'événement doit être affiché pour cette date
          const shouldShow = shouldShowRecurringEventForDate(event, date);
          if (shouldShow) {
            events.push({
              id: `recurring-${event.id}`,
              employeeId: 0,
              employeeName: 'Équipe',
              type: 'recurring-event',
              title: `${event.title} (Récurrent)`,
              startTime: event.start_time,
              endTime: calculateEndTime(event.start_time, event.duration_minutes),
              color: '#f59e0b',
              description: event.title,
              priority: 'medium',
              status: 'pending',
              recurringEventId: event.id
            });
          }
        }
      });
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      return events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return events;
  };

  // Vérifier si un événement récurrent doit être affiché pour une date donnée
  const shouldShowRecurringEventForDate = (event: any, date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    const eventDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    
    // Vérifier si la date est dans la plage de l'événement
    if (date < eventDate || (endDate && date > endDate)) {
      return false;
    }
    
    // Vérifier la récurrence selon le type
    switch (event.recurrence_type) {
      case 'daily':
        return true;
      case 'weekly':
        if (event.recurrence_days && event.recurrence_days.length > 0) {
          return event.recurrence_days.includes(date.getDay());
        }
        return true;
      case 'weekdays':
        return date.getDay() >= 1 && date.getDay() <= 5; // Lundi à vendredi
      case 'custom':
        if (event.recurrence_days && event.recurrence_days.length > 0) {
          return event.recurrence_days.includes(date.getDay());
        }
        return false;
      default:
        return false;
    }
  };

  // Calculer l'heure de fin d'un événement
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Navigation dans le calendrier
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Gestion des événements
  const handleEventPress = (event: PlanningItem) => {
    setSelectedEvent(event);
    setTaskTitle(event.title); // Initialiser le titre avec la valeur actuelle
    setShowEventModal(true);
  };

  const handleEditEvent = () => {
    // Logique d'édition
    setShowEventModal(false);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    let message = '';
    let confirmMessage = '';

    switch (selectedEvent.type) {
      case 'task':
        message = 'Supprimer cette tâche ?';
        confirmMessage = 'Cette action supprimera définitivement la tâche de la base de données.';
        break;
      case 'recurring-event':
        message = 'Supprimer cet événement récurrent ?';
        confirmMessage = 'Cette action supprimera définitivement l\'événement récurrent et toutes ses occurrences futures de la base de données.';
        break;
      case 'break':
        message = 'Supprimer cette pause ?';
        confirmMessage = 'Cette action supprimera définitivement la pause de la base de données.';
        break;
      default:
        message = 'Supprimer cet événement ?';
        confirmMessage = 'Cette action supprimera définitivement l\'événement de la base de données.';
    }

    Alert.alert(
      message,
      confirmMessage,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              let success = false;
              
              switch (selectedEvent.type) {
                case 'task':
                  const taskId = selectedEvent.id.replace('task-', '');
                  const result = await deleteTask(taskId);
                  success = result.success;
                  break;
                case 'recurring-event':
                  const eventId = selectedEvent.id.replace('recurring-', '');
                  const eventResult = await deleteEvent(eventId);
                  success = eventResult.success;
                  break;
                case 'break':
                  // Pour les pauses, on pourrait ajouter une fonction de suppression
                  Alert.alert('Info', 'La suppression des pauses sera bientôt disponible.');
                  success = false;
                  break;
                default:
                  success = false;
              }

              if (success) {
                Alert.alert('Succès', 'Élément supprimé avec succès.');
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer l\'élément.');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
            } finally {
              setShowEventModal(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelEvent = () => {
    if (!selectedEvent) return;

    let message = '';
    let confirmMessage = '';

    switch (selectedEvent.type) {
      case 'task':
        message = 'Annuler cette tâche ?';
        confirmMessage = 'Cette action marquera la tâche comme annulée.';
        break;
      case 'recurring-event':
        message = 'Annuler cet événement récurrent ?';
        confirmMessage = 'Cette action désactivera l\'événement récurrent.';
        break;
      case 'break':
        message = 'Annuler cette pause ?';
        confirmMessage = 'Cette action marquera la pause comme annulée.';
        break;
      default:
        message = 'Annuler cet événement ?';
        confirmMessage = 'Cette action marquera l\'événement comme annulé.';
    }

    Alert.alert(
      message,
      confirmMessage,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive',
          onPress: async () => {
            try {
              let success = false;
              
              switch (selectedEvent.type) {
                case 'task':
                  // Marquer la tâche comme annulée (soft delete)
                  const taskId = selectedEvent.id.replace('task-', '');
                  // Ici on pourrait ajouter une fonction pour marquer comme annulée
                  success = true;
                  break;
                case 'recurring-event':
                  // Désactiver l'événement récurrent
                  const eventId = selectedEvent.id.replace('recurring-', '');
                  // Ici on pourrait ajouter une fonction pour désactiver
                  success = true;
                  break;
                case 'break':
                  // Marquer la pause comme annulée
                  success = true;
                  break;
                default:
                  success = false;
              }

              if (success) {
                Alert.alert('Succès', 'Élément annulé avec succès.');
              } else {
                Alert.alert('Erreur', 'Impossible d\'annuler l\'élément.');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de l\'annulation.');
            } finally {
              setShowEventModal(false);
            }
          }
        }
      ]
    );
  };

  const handleDelayEvent = () => {
    if (!selectedEvent) return;
    
    // Debug: afficher le type d'événement sélectionné
    console.log('🔍 Type d\'événement sélectionné:', selectedEvent.type);
    console.log('🔍 Événement complet:', selectedEvent);
    
    // Vérifier que c'est une tâche ou un événement récurrent
    if (selectedEvent.type !== 'task' && selectedEvent.type !== 'recurring-event') {
      Alert.alert('Info', 'Seules les tâches et événements récurrents peuvent être marqués en retard.');
      return;
    }

    setShowDelayModal(true);
  };

  const handleConfirmDelay = async () => {
    if (!selectedTaskForDelay || !delayReason.trim() || !delayMinutes.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    const minutes = parseInt(delayMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de minutes valide.');
      return;
    }

    try {
      let taskId = '';
      let eventType = '';
      
      if (selectedTaskForDelay.type === 'task') {
        taskId = selectedTaskForDelay.id.replace('task-', '');
        eventType = 'tâche';
      } else if (selectedTaskForDelay.type === 'recurring-event') {
        taskId = selectedTaskForDelay.id.replace('recurring-', '');
        eventType = 'événement récurrent';
      }
      
      // Créer une alerte pour le directeur
      const alertResult = await createAlert({
        task_id: taskId,
        manager_id: user?.id || '',
        message: `⚠️ RETARD: La ${eventType} "${selectedTaskForDelay.title}" est en retard de ${minutes} minutes.\n\n📋 Cause: ${delayReason}\n👤 Manager: ${profile?.name || 'Manager'}\n🏪 Section: ${profile?.section || 'Section'}`,
        severity: 'critical'
      });

      if (alertResult.success) {
        // Envoyer une notification au directeur
        const notificationService = NotificationService.getInstance();
        await notificationService.sendImmediateNotification(
          '🚨 ALERTE RETARD',
          `${eventType} "${selectedTaskForDelay.title}" en retard de ${minutes} minutes\nCause: ${delayReason}`,
          {
            type: 'task_delay',
            taskId: taskId,
            managerId: user?.id,
            delayMinutes: minutes,
            delayReason: delayReason
          }
        );

        Alert.alert(
          'Retard signalé',
          `Le retard a été signalé au directeur avec succès.\n\n⏰ Retard: ${minutes} minutes\n📋 Cause: ${delayReason}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowDelayModal(false);
                setShowDelaySelectionModal(false);
                setDelayReason('');
                setDelayMinutes('');
                setSelectedTaskForDelay(null);
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de signaler le retard.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors du signalement du retard.');
    }
  };

  const handleSelectTaskForDelay = (task: PlanningItem) => {
    setSelectedTaskForDelay(task);
    setShowDelaySelectionModal(false);
    setShowDelayModal(true);
  };

  // Utilitaires
  const getDayName = (dayIndex: number) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayIndex];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Calculs
  const timeSlots = generateTimeSlots();
  const weekDays = generateWeekDays();
  const isLoading = employeesLoading || breaksLoading || tasksLoading || eventsLoading;

  const totalTasks = tasks.filter(task => task.date === selectedDate.toISOString().split('T')[0]).length;
  const totalBreaks = allBreaks.length;
  const totalEmployees = teamMembers.length;
  const totalRecurringEvents = recurringEvents.filter(event => event.is_active).length;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              // Refresh logic here
            }}
            tintColor={isDark ? "#f4f4f5" : "#3b82f6"}
          />
        }
      >
        {/* Header moderne */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color={isDark ? "#f4f4f5" : "#3b82f6"} size={24} strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={[styles.title, isDark && styles.titleDark]}>
                Planning Rayon
              </Text>
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                {profile?.section || 'Section'} • {formatDate(currentDate)}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            >
              <Filter color={isDark ? '#f4f4f5' : '#3b82f6'} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
            <Search color={isDark ? '#94a3b8' : '#64748b'} size={20} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              placeholder="Rechercher des événements..."
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={[styles.clearSearch, isDark && styles.clearSearchDark]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Navigation du calendrier */}
        <View style={styles.calendarNavigation}>
          <View style={styles.calendarNav}>
            <TouchableOpacity onPress={goToPreviousPeriod} style={styles.navButton}>
              <ChevronLeft color={isDark ? '#f4f4f5' : '#3b82f6'} size={20} strokeWidth={2} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Aujourd'hui</Text>
            </TouchableOpacity>
            
            <Text style={[styles.periodTitle, isDark && styles.periodTitleDark]}>
              {viewMode === 'week' 
                ? `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`
                : formatDate(currentDate)
              }
            </Text>
            
            <TouchableOpacity onPress={goToNextPeriod} style={styles.navButton}>
              <ChevronRight color={isDark ? '#f4f4f5' : '#3b82f6'} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Sélecteur de vue */}
          <View style={styles.viewSelector}>
            <TouchableOpacity 
              style={[styles.viewButton, viewMode === 'week' && styles.viewButtonActive]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'week' && styles.viewButtonTextActive]}>
                Semaine
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewButton, viewMode === 'day' && styles.viewButtonActive]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'day' && styles.viewButtonTextActive]}>
                Jour
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Sélecteur de présets d'horaires */}
      <WorkingHoursPresets
        selectedPreset={selectedPreset}
        onPresetSelect={setSelectedPreset}
        onHoursChange={setWorkingHours}
      />

      {/* Filtres */}
      {showFilters && (
        <View style={[styles.filtersContainer, isDark && styles.filtersContainerDark]}>
          <Text style={[styles.filtersTitle, isDark && styles.filtersTitleDark]}>Filtres</Text>
          
          <View style={styles.filterOptions}>
            <TouchableOpacity 
              style={[styles.filterChip, filters.showTasks && styles.filterChipActive]}
              onPress={() => setFilters(prev => ({ ...prev, showTasks: !prev.showTasks }))}
            >
              <Text style={[styles.filterChipText, filters.showTasks && styles.filterChipTextActive]}>
                Tâches
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterChip, filters.showBreaks && styles.filterChipActive]}
              onPress={() => setFilters(prev => ({ ...prev, showBreaks: !prev.showBreaks }))}
            >
              <Text style={[styles.filterChipText, filters.showBreaks && styles.filterChipTextActive]}>
                Pauses
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterChip, filters.showEvents && styles.filterChipActive]}
              onPress={() => setFilters(prev => ({ ...prev, showEvents: !prev.showEvents }))}
            >
              <Text style={[styles.filterChipText, filters.showEvents && styles.filterChipTextActive]}>
                Événements
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, filters.showRecurringEvents && styles.filterChipActive]}
              onPress={() => setFilters(prev => ({ ...prev, showRecurringEvents: !prev.showRecurringEvents }))}
            >
              <Text style={[styles.filterChipText, filters.showRecurringEvents && styles.filterChipTextActive]}>
                Récurrents
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Légende */}
      <View style={[styles.legend, isDark && styles.legendDark]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.legendText, isDark && styles.legendTextDark]}>Tâches</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={[styles.legendText, isDark && styles.legendTextDark]}>Pauses</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={[styles.legendText, isDark && styles.legendTextDark]}>Récurrents</Text>
        </View>
      </View>

      {/* Calendrier */}
      <ScrollView 
        style={styles.calendarContainer} 
        horizontal 
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.calendarGrid}>
          {/* En-têtes des heures */}
          <View style={styles.timeColumn}>
            <View style={styles.timeHeader}>
              <Text style={[styles.timezoneText, isDark && styles.timezoneTextDark]}>
                GMT+02
              </Text>
            </View>
            {timeSlots.map(timeSlot => (
              <View key={timeSlot} style={styles.timeSlot}>
                <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
                  {timeSlot}
                </Text>
              </View>
            ))}
          </View>

          {/* Colonnes des jours */}
          {weekDays.map((day, dayIndex) => {
            const events = getAllEventsForDate(day);
            
            return (
              <View key={dayIndex} style={styles.dayColumn}>
                <View style={[
                  styles.dayHeader,
                  day.toDateString() === new Date().toDateString() && styles.todayHeader,
                  isDark && styles.dayHeaderDark
                ]}>
                  <Text style={[
                    styles.dayText,
                    day.toDateString() === new Date().toDateString() && styles.todayText,
                    isDark && styles.dayTextDark
                  ]}>
                    {getDayName(day.getDay())}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    day.toDateString() === new Date().toDateString() && styles.todayNumber,
                    isDark && styles.dayNumberDark
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>

                {timeSlots.map(timeSlot => {
                  const eventsInSlot = events.filter(event => {
                    const eventStartHour = event.startTime.split(':')[0];
                    const eventStartMinute = event.startTime.split(':')[1];
                    const slotHour = timeSlot.split(':')[0];
                    const slotMinute = timeSlot.split(':')[1];
                    
                    return eventStartHour === slotHour && eventStartMinute === slotMinute;
                  });
                  
                  return (
                    <TouchableOpacity 
                      key={timeSlot} 
                      style={[
                        styles.calendarCell,
                        isDark && styles.calendarCellDark
                      ]}
                      onPress={() => {
                        // Logique pour ajouter un événement
                      }}
                    >
                      {eventsInSlot.map(event => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.eventItem,
                            { backgroundColor: event.color }
                          ]}
                          onPress={() => handleEventPress(event)}
                        >
                          <View style={styles.eventHeader}>
                            <View style={styles.eventDot} />
                            {event.priority && (
                              <View style={[
                                styles.priorityIndicator,
                                { backgroundColor: getPriorityColor(event.priority) }
                              ]} />
                            )}
                          </View>
                          <View style={styles.eventContent}>
                            <Text style={styles.eventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.eventEmployee} numberOfLines={1}>
                              {event.employeeName}
                            </Text>
                            <Text style={styles.eventTime}>
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Target color="#10b981" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {totalTasks}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Tâches</Text>
          </View>
          
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Coffee color="#3b82f6" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {totalBreaks}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Pauses</Text>
          </View>
          
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Users color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {totalEmployees}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Employés</Text>
          </View>

          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Calendar color="#8b5cf6" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {totalRecurringEvents}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Récurrents</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsContainer}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Actions rapides</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, isDark && styles.actionCardDark]} 
              onPress={() => router.push('/(manager-tabs)/calculator')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
                <Calculator color="#06b6d4" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>
                Calculer une tâche
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, isDark && styles.actionCardDark]} 
              onPress={() => router.push('/(manager-tabs)/efficiency')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <BarChart3 color="#8b5cf6" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>
                Voir les performances
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, isDark && styles.actionCardDark]} 
              onPress={() => setShowDelaySelectionModal(true)}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Clock color="#ef4444" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.actionTitle, isDark && styles.actionTitleDark]}>
                Signaler un retard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de détails d'événement */}
      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            {selectedEvent && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    {selectedEvent.title}
                  </Text>
                  <TouchableOpacity onPress={() => setShowEventModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  {selectedEvent.type === 'task' && (
                    <View style={styles.modalInfo}>
                      <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                        Titre de la tâche
                      </Text>
                      <TextInput
                        style={[styles.taskTitleInput, isDark && styles.taskTitleInputDark]}
                        placeholder="Entrez le titre de la tâche..."
                        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                      />
                    </View>
                  )}
                  
                  <View style={styles.modalInfo}>
                    <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                      Employé
                    </Text>
                    <Text style={[styles.modalValue, isDark && styles.modalValueDark]}>
                      {selectedEvent.employeeName}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfo}>
                    <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                      Horaires
                    </Text>
                    <Text style={[styles.modalValue, isDark && styles.modalValueDark]}>
                      {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                    </Text>
                  </View>
                  
                  {selectedEvent.description && (
                    <View style={styles.modalInfo}>
                      <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                        Description
                      </Text>
                      <Text style={[styles.modalValue, isDark && styles.modalValueDark]}>
                        {selectedEvent.description}
                      </Text>
                    </View>
                  )}
                </View>
                
                                 <View style={styles.modalActions}>
                   <TouchableOpacity 
                     style={[styles.modalButton, styles.modalButtonSecondary]}
                     onPress={() => setShowEventModal(false)}
                   >
                     <Text style={styles.modalButtonTextSecondary}>Fermer</Text>
                   </TouchableOpacity>
                   

                   
                   <TouchableOpacity 
                     style={[styles.modalButton, styles.modalButtonWarning]}
                     onPress={handleCancelEvent}
                   >
                     <Text style={styles.modalButtonTextWarning}>Annuler</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={[styles.modalButton, styles.modalButtonPrimary]}
                     onPress={handleEditEvent}
                   >
                     <Edit3 color="#ffffff" size={16} strokeWidth={2} />
                     <Text style={styles.modalButtonTextPrimary}>Modifier</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={[styles.modalButton, styles.modalButtonDanger]}
                     onPress={handleDeleteEvent}
                   >
                     <Trash2 color="#ffffff" size={16} strokeWidth={2} />
                     <Text style={styles.modalButtonTextDanger}>Supprimer</Text>
                   </TouchableOpacity>
                 </View>
              </>
            )}
          </View>
        </View>
             </Modal>

       {/* Modal de retard */}
       <Modal
         visible={showDelayModal}
         transparent={true}
         animationType="slide"
         onRequestClose={() => setShowDelayModal(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
             <View style={styles.modalHeader}>
               <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                 Signaler un retard
               </Text>
               <TouchableOpacity onPress={() => setShowDelayModal(false)}>
                 <Text style={styles.modalClose}>✕</Text>
               </TouchableOpacity>
             </View>
             
             <View style={styles.modalBody}>
               <View style={styles.modalInfo}>
                 <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                   Type d'événement
                 </Text>
                 <Text style={[styles.modalValue, isDark && styles.modalValueDark]}>
                   {selectedTaskForDelay?.type === 'task' ? 'Tâche' : selectedTaskForDelay?.type === 'recurring-event' ? 'Événement récurrent' : selectedTaskForDelay?.type}
                 </Text>
               </View>
               
               <View style={styles.modalInfo}>
                 <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                   Titre
                 </Text>
                 <Text style={[styles.modalValue, isDark && styles.modalValueDark]}>
                   {selectedTaskForDelay?.title}
                 </Text>
               </View>
               
               <View style={styles.modalInfo}>
                 <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                   Horaires
                 </Text>
                 <Text style={[styles.modalValue, isDark && styles.modalValueDark]}>
                   {selectedTaskForDelay ? `${formatTime(selectedTaskForDelay.startTime)} - ${formatTime(selectedTaskForDelay.endTime)}` : ''}
                 </Text>
               </View>
               
               <View style={styles.modalInfo}>
                 <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                   Retard (minutes) *
                 </Text>
                 <TextInput
                   style={[styles.delayInput, isDark && styles.delayInputDark]}
                   placeholder="Ex: 15"
                   placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                   value={delayMinutes}
                   onChangeText={setDelayMinutes}
                   keyboardType="numeric"
                 />
               </View>
               
               <View style={styles.modalInfo}>
                 <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                   Cause du retard *
                 </Text>
                 <TextInput
                   style={[styles.delayInput, styles.delayTextArea, isDark && styles.delayInputDark]}
                   placeholder="Ex: Camion en retard, équipe incomplète, problème technique..."
                   placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                   value={delayReason}
                   onChangeText={setDelayReason}
                   multiline
                   numberOfLines={3}
                   textAlignVertical="top"
                 />
               </View>
             </View>
             
             <View style={styles.modalActions}>
               <TouchableOpacity 
                 style={[styles.modalButton, styles.modalButtonSecondary]}
                 onPress={() => {
                   setShowDelayModal(false);
                   setDelayReason('');
                   setDelayMinutes('');
                 }}
               >
                 <Text style={styles.modalButtonTextSecondary}>Annuler</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={[styles.modalButton, styles.modalButtonDelay]}
                 onPress={handleConfirmDelay}
               >
                 <Text style={styles.modalButtonTextDelay}>Signaler</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* Modal de sélection de tâche pour retard */}
       <Modal
         visible={showDelaySelectionModal}
         transparent={true}
         animationType="slide"
         onRequestClose={() => setShowDelaySelectionModal(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
             <View style={styles.modalHeader}>
               <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                 Sélectionner une tâche
               </Text>
               <TouchableOpacity onPress={() => setShowDelaySelectionModal(false)}>
                 <Text style={styles.modalClose}>✕</Text>
               </TouchableOpacity>
             </View>
             
             <View style={styles.modalBody}>
               <Text style={[styles.modalLabel, isDark && styles.modalLabelDark, { marginBottom: 16 }]}>
                 Choisissez la tâche ou l'événement récurrent pour signaler un retard :
               </Text>
               
               <ScrollView style={styles.taskSelectionList}>
                 {getAllEventsForDate(selectedDate)
                   .filter(event => event.type === 'task' || event.type === 'recurring-event')
                   .map((task) => (
                     <TouchableOpacity
                       key={task.id}
                       style={[styles.taskSelectionItem, isDark && styles.taskSelectionItemDark]}
                       onPress={() => handleSelectTaskForDelay(task)}
                     >
                       <View style={[styles.taskSelectionDot, { backgroundColor: task.color }]} />
                       <View style={styles.taskSelectionContent}>
                         <Text style={[styles.taskSelectionTitle, isDark && styles.taskSelectionTitleDark]}>
                           {task.title}
                         </Text>
                         <Text style={[styles.taskSelectionTime, isDark && styles.taskSelectionTimeDark]}>
                           {formatTime(task.startTime)} - {formatTime(task.endTime)}
                         </Text>
                         <Text style={[styles.taskSelectionType, isDark && styles.taskSelectionTypeDark]}>
                           {task.type === 'task' ? 'Tâche' : 'Événement récurrent'}
                         </Text>
                       </View>
                     </TouchableOpacity>
                   ))}
                 
                 {getAllEventsForDate(selectedDate).filter(event => event.type === 'task' || event.type === 'recurring-event').length === 0 && (
                   <View style={styles.noTasksContainer}>
                     <Text style={[styles.noTasksText, isDark && styles.noTasksTextDark]}>
                       Aucune tâche ou événement récurrent trouvé pour cette date.
                     </Text>
                   </View>
                 )}
               </ScrollView>
             </View>
             
             <View style={styles.modalActions}>
               <TouchableOpacity 
                 style={[styles.modalButton, styles.modalButtonSecondary]}
                 onPress={() => setShowDelaySelectionModal(false)}
               >
                 <Text style={styles.modalButtonTextSecondary}>Annuler</Text>
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
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  titleDark: {
    color: '#f4f4f5',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  subtitleDark: {
    color: '#94a3b8',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchContainerDark: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0.2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  searchInputDark: {
    color: '#f4f4f5',
  },
  clearSearch: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  clearSearchDark: {
    color: '#94a3b8',
  },
  calendarNavigation: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  periodTitleDark: {
    color: '#f4f4f5',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewButtonTextActive: {
    color: '#1a1a1a',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContainerDark: {
    borderBottomColor: '#374151',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  filtersTitleDark: {
    color: '#f4f4f5',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 20,
  },
  legendDark: {
    borderBottomColor: '#374151',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  legendTextDark: {
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  statCardDark: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0.2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statValueDark: {
    color: '#f4f4f5',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  statLabelDark: {
    color: '#94a3b8',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#f4f4f5',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  actionCardDark: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0.2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  actionTitleDark: {
    color: '#f4f4f5',
  },
  calendarContainer: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    minWidth: width * 1.5,
  },
  timeColumn: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  timeHeader: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timezoneText: {
    fontSize: 10,
    color: '#6b7280',
  },
  timezoneTextDark: {
    color: '#9ca3af',
  },
  timeSlot: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#6b7280',
  },
  timeTextDark: {
    color: '#9ca3af',
  },
  dayColumn: {
    flex: 1,
    minWidth: 80,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  dayHeader: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  dayHeaderDark: {
    backgroundColor: '#27272a',
    borderBottomColor: '#374151',
  },
  todayHeader: {
    backgroundColor: '#3b82f6',
  },
  dayText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  dayTextDark: {
    color: '#9ca3af',
  },
  todayText: {
    color: '#ffffff',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayNumberDark: {
    color: '#f4f4f5',
  },
  todayNumber: {
    color: '#ffffff',
  },
  calendarCell: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: 1,
  },
  calendarCellDark: {
    borderBottomColor: '#374151',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    borderRadius: 4,
    marginBottom: 1,
    gap: 2,
    minHeight: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  priorityIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: '600',
  },
  eventEmployee: {
    fontSize: 7,
    color: '#ffffff',
    opacity: 0.8,
  },
  eventTime: {
    fontSize: 7,
    color: '#ffffff',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  statsContainerDark: {
    borderTopColor: '#374151',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  statValueDark: {
    color: '#f4f4f5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  actionsContainerDark: {
    borderTopColor: '#374151',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  actionTitleDark: {
    color: '#f4f4f5',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionSubtitleDark: {
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
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: width - 40,
    maxHeight: height * 0.7,
  },
  modalContentDark: {
    backgroundColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalTitleDark: {
    color: '#f4f4f5',
  },
  modalClose: {
    fontSize: 24,
    color: '#6b7280',
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalInfo: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  modalLabelDark: {
    color: '#9ca3af',
  },
  modalValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  modalValueDark: {
    color: '#f4f4f5',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  modalButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonDanger: {
    backgroundColor: '#ef4444',
  },
  modalButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  modalButtonDelay: {
    backgroundColor: '#dc2626',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextDanger: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextWarning: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextDelay: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  delayInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  delayInputDark: {
    borderColor: '#374151',
    color: '#f4f4f5',
    backgroundColor: '#27272a',
  },
  delayTextArea: {
    minHeight: 80,
  },
  taskTitleInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  taskTitleInputDark: {
    borderColor: '#374151',
    color: '#f4f4f5',
    backgroundColor: '#27272a',
  },
  taskSelectionList: {
    maxHeight: 300,
  },
  taskSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskSelectionItemDark: {
    backgroundColor: '#374151',
    borderColor: '#52525b',
  },
  taskSelectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskSelectionContent: {
    flex: 1,
  },
  taskSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  taskSelectionTitleDark: {
    color: '#f4f4f5',
  },
  taskSelectionTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  taskSelectionTimeDark: {
    color: '#9ca3af',
  },
  taskSelectionType: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  taskSelectionTypeDark: {
    color: '#71717a',
  },
  noTasksContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noTasksText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  noTasksTextDark: {
    color: '#9ca3af',
  },
}); 