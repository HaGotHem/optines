import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
  Switch,
  Image,
} from 'react-native';
import { Calendar as CalendarIcon, Clock, Plus, MapPin, Package, Users, Trash2, ChevronLeft, ChevronRight, X, Edit3, Check, Pin, PinOff, Bell, BellOff, AlertTriangle, Eye } from 'lucide-react-native';

import { router } from 'expo-router';
import { notificationService } from '../../services/NotificationService';
import DatePickerCalendar from '../../components/DatePickerCalendar';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useSupabaseTeam } from '../../hooks/useSupabaseTeam';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useTaskRefresh } from '../../contexts/TaskRefreshContext';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledTask } from '../../types/database';
import { useSupabaseEvents } from '../../hooks/useSupabaseEvents';
import { supabase } from '../../lib/supabase';
import { useSupabaseAlerts } from '../../hooks/useSupabaseAlerts';
import { useSupabaseWorkingHours } from '../../hooks/useSupabaseWorkingHours';
import { WorkingHoursAlert } from '../../components/WorkingHoursAlert';

interface Event {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  type: string;
  date: string; // Date de l'événement au format YYYY-MM-DD
}

interface WorkingHours {
  start: string;
  end: string;
}

interface TeamMember {
  id: number;
  name: string;
  role?: string;
  avatar_url?: string | null;
}

interface SmartReminder {
  id: string;
  taskId: string;
  taskTitle: string;
  reminderTime: string;
  reminderDate: string;
  type: 'start' | 'preparation' | 'team_ready' | 'efficiency_alert';
  message: string;
  isEnabled: boolean;
  teamLoadPercentage?: number;
  suggestedTeamSize?: number;
}

export default function CalendarTab() {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(() => {
    // Essayer de restaurer la date sélectionnée depuis le localStorage
    try {
      const savedDate = localStorage.getItem('selectedDate');
      if (savedDate) {
        console.log('📅 [DEBUG] Date restaurée depuis localStorage:', savedDate);
        const restoredDate = new Date(savedDate);
        // Vérifier que la date est valide
        if (!isNaN(restoredDate.getTime())) {
          // Nettoyer la date sauvegardée après l'avoir restaurée
          localStorage.removeItem('selectedDate');
          console.log('🧹 [DEBUG] Date sauvegardée nettoyée');
          return restoredDate;
        }
      }
    } catch (error) {
      console.log('⚠️ [DEBUG] Erreur lors de la restauration de la date:', error);
    }
    // Si pas de date sauvegardée ou erreur, utiliser la date actuelle
    console.log('📅 [DEBUG] Utilisation de la date actuelle');
    return new Date();
  });
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start: '05:00', end: '21:00' });
  const [tempWorkingHours, setTempWorkingHours] = useState<WorkingHours>({ start: '05:00', end: '21:00' });

  // Hook pour les horaires de travail synchronisés
  const { 
    workingHours: storeWorkingHours, 
    isLoading: workingHoursLoading 
  } = useSupabaseWorkingHours();

  // États pour l'édition des tâches
  const [editPackages, setEditPackages] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editPaletteCondition, setEditPaletteCondition] = useState(true);
  const [editStartTime, setEditStartTime] = useState('05:00');
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editDelay, setEditDelay] = useState('0');
  const [showDelayInput, setShowDelayInput] = useState(false);

  // États pour l'édition des événements
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventStartTime, setEditEventStartTime] = useState('');
  const [editEventEndTime, setEditEventEndTime] = useState('');
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventType, setEditEventType] = useState('');
  const [editEventDate, setEditEventDate] = useState(new Date());
  const [showEditEventDatePicker, setShowEditEventDatePicker] = useState(false);

  // États pour les rappels intelligents
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [selectedTaskForReminders, setSelectedTaskForReminders] = useState<ScheduledTask | null>(null);
  const [taskReminders, setTaskReminders] = useState<SmartReminder[]>([]);
  const [workloadAnalysis, setWorkloadAnalysis] = useState<any>(null);

  // États pour les time pickers
  const [tempEditHour, setTempEditHour] = useState('05');
  const [tempEditMinute, setTempEditMinute] = useState('00');
  const [tempEventHour, setTempEventHour] = useState('09');
  const [tempEventMinute, setTempEventMinute] = useState('00');
  const [tempAddEventHour, setTempAddEventHour] = useState('09');
  const [tempAddEventMinute, setTempAddEventMinute] = useState('00');
  const [showEditEventTimePicker, setShowEditEventTimePicker] = useState(false);
  const [showAddEventTimePicker, setShowAddEventTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // États pour la sélection d'employés
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [editTeamMembers, setEditTeamMembers] = useState<TeamMember[]>([]);
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<number[]>([]);

  // 1. Ajouter un nouvel état pour le modal d'événement récurrent
  const [showRecurringEventModal, setShowRecurringEventModal] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recStartDate, setRecStartDate] = useState(new Date());
  const [recStartTime, setRecStartTime] = useState('09:00');
  const [recDuration, setRecDuration] = useState('60'); // minutes
  const [recRecurrenceType, setRecRecurrenceType] = useState<'daily'|'weekly'|'weekdays'|'custom'>('daily');
  const [recCustomDays, setRecCustomDays] = useState<number[]>([]);
  const [showRecDatePicker, setShowRecDatePicker] = useState(false);
  const [showRecTimePicker, setShowRecTimePicker] = useState(false);
  const [recEndDate, setRecEndDate] = useState<Date | null>(null);
  const [showRecEndDatePicker, setShowRecEndDatePicker] = useState(false);

  // États pour le modal de retard
  const [showDelaySelectionModal, setShowDelaySelectionModal] = useState(false);
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<ScheduledTask | null>(null);
  const [delayReason, setDelayReason] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [showDelayInputModal, setShowDelayInputModal] = useState(false);
  const [tempDelayMinutes, setTempDelayMinutes] = useState('');
  const [tempDelayReason, setTempDelayReason] = useState('');

  // États pour la gestion des tâches
  const [hiddenTasks, setHiddenTasks] = useState<Set<string>>(new Set());
  const [showHiddenTasks, setShowHiddenTasks] = useState(false);
  
  // États pour le modal de confirmation de suppression de tâche
  const [showTaskDeleteConfirmModal, setShowTaskDeleteConfirmModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // États pour la modification d'événements récurrents
  const [showEditRecurringEventModal, setShowEditRecurringEventModal] = useState(false);
  const [editingRecurringEvent, setEditingRecurringEvent] = useState<any>(null);
  const [editRecTitle, setEditRecTitle] = useState('');
  const [editRecStartTime, setEditRecStartTime] = useState('');
  const [editRecDuration, setEditRecDuration] = useState('');
  const [editRecRecurrenceType, setEditRecRecurrenceType] = useState<'daily'|'weekly'|'weekdays'|'custom'>('daily');
  const [editRecCustomDays, setEditRecCustomDays] = useState<number[]>([]);
  const [editRecStartDate, setEditRecStartDate] = useState(new Date());
  const [editRecEndDate, setEditRecEndDate] = useState<Date | null>(null);
  const [showEditRecDatePicker, setShowEditRecDatePicker] = useState(false);
  const [showEditRecEndDatePicker, setShowEditRecEndDatePicker] = useState(false);
  const [showEditRecTimePicker, setShowEditRecTimePicker] = useState(false);
  
  // États pour la suppression d'événements récurrents
  const [showRecurringEventDeleteConfirmModal, setShowRecurringEventDeleteConfirmModal] = useState(false);
  const [recurringEventToDelete, setRecurringEventToDelete] = useState<any>(null);
  
  // États pour la création de nouvelles tâches
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPackages, setNewTaskPackages] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date());
  const [newTaskStartTime, setNewTaskStartTime] = useState('09:00');
  const [newTaskPaletteCondition, setNewTaskPaletteCondition] = useState(true);
  const [showNewTaskDatePicker, setShowNewTaskDatePicker] = useState(false);
  const [showNewTaskTimePicker, setShowNewTaskTimePicker] = useState(false);

  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const editModalOpacity = useRef(new Animated.Value(0)).current;
  const editModalScale = useRef(new Animated.Value(0.8)).current;
  const datePickerOpacity = useRef(new Animated.Value(0)).current;
  const datePickerScale = useRef(new Animated.Value(0.9)).current;
  const remindersModalOpacity = useRef(new Animated.Value(0)).current;
  const remindersModalScale = useRef(new Animated.Value(0.8)).current;

  // Hooks Supabase
  const { user } = useSupabaseAuth();
  const { 
    tasks: scheduledTasks, 
    isLoading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    getTasksByDate,
    toggleTaskPin,
    toggleTaskComplete
  } = useSupabaseTasks({ 
    managerId: user?.id?.toString() 
  });
  
  const { triggerRefresh } = useTaskRefresh();

  const { 
    members: allEmployees,
    isLoading: employeesLoading 
  } = useSupabaseTeam(user?.id?.toString());

  const { 
    events: recurringEvents, 
    isLoading: eventsLoading, 
    createEvent,
    deleteEvent: deleteRecurringEventFromSupabase,
    reload: reloadEvents 
  } = useSupabaseEvents({ managerId: undefined }); // Temporairement récupérer tous les événements

  // Debug: Log des événements récurrents
  useEffect(() => {
    console.log('🔍 [DEBUG] ===== HOOK USE_SUPABASE_EVENTS =====');
    console.log('🔍 [DEBUG] User ID:', user?.id);
    console.log('🔍 [DEBUG] User object complet:', user);
    console.log('🔍 [DEBUG] Événements récurrents chargés:', recurringEvents);
    console.log('🔍 [DEBUG] Loading:', eventsLoading);
    console.log('🔍 [DEBUG] Nombre d\'événements:', recurringEvents.length);
  }, [recurringEvents, eventsLoading, user?.id]);

  const { createAlert } = useSupabaseAlerts();

  // États pour la validation des horaires
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null);
  const [showWorkingHoursAlert, setShowWorkingHoursAlert] = useState(false);

  // Événements en état pour permettre la modification
  // const [events, setEvents] = useState<Event[]>([ ...exemples... ]);

  useEffect(() => {
    // Animation d'entrée pour les nouvelles tâches
    if (scheduledTasks.length > 0) {
      slideAnimation.setValue(50);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [scheduledTasks, slideAnimation]);

  // Charger les heures de travail depuis Supabase
  useEffect(() => {
    if (storeWorkingHours) {
      const hours = { start: storeWorkingHours.start_time, end: storeWorkingHours.end_time };
      setWorkingHours(hours);
      setTempWorkingHours(hours);
      console.log('✅ Horaires de travail synchronisés depuis Supabase:', hours);
    }
  }, [storeWorkingHours]);

  // Charger tous les employés au démarrage
  useEffect(() => {
    const loadAllEmployees = async () => {
      try {
        const savedTeam = await AsyncStorage.getItem('teamMembers');
        if (savedTeam) {
          const employees = JSON.parse(savedTeam);
          console.log('All employees loaded:', employees);
        }
      } catch (error) {
        console.error('Error loading all employees:', error);
      }
    };

    loadAllEmployees();
  }, []);

  // Recharger les employés assignés quand les paramètres d'édition changent
  useEffect(() => {
    if (showEmployeeSelector) {
      loadAssignedEmployees();
    }
  }, [editTeamMembers, editDate, editStartTime, editPackages, editPaletteCondition, editDelay, showEmployeeSelector]);

  const handleDeleteTask = async (taskId: string) => {
    console.log('🔍 [DEBUG] ===== DÉBUT handleDeleteTask =====');
    console.log('🔍 [DEBUG] handleDeleteTask appelé avec taskId:', taskId);
    
    try {
      console.log('🔍 [DEBUG] Appel de deleteTask avec taskId:', taskId);
      const result = await deleteTask(taskId);
      console.log('🔍 [DEBUG] Résultat de deleteTask:', result);
      
      if (result.success) {
        console.log('✅ Tâche supprimée depuis Supabase');
        
        // Fermer le modal de modification
        closeEditModal();
        
        // Forcer un rechargement multiple pour s'assurer de la synchronisation
        console.log('🔄 [DEBUG] Déclenchement du refresh');
        triggerRefresh();
        
        // Rechargement supplémentaire après un délai
        setTimeout(() => {
          console.log('🔄 [DEBUG] Rechargement supplémentaire');
          triggerRefresh();
        }, 2000);
        
        // Sauvegarder la date sélectionnée avant le refresh
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        localStorage.setItem('selectedDate', selectedDateString);
        console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
        
        // Rechargement forcé de la page après 2 secondes
        setTimeout(() => {
          console.log('🔄 [DEBUG] Rechargement forcé de la page');
          window.location.reload();
        }, 2000);
        
        // Afficher un message de succès
        Alert.alert('Succès', 'Tâche supprimée avec succès');
      } else {
        console.error('❌ Erreur lors de la suppression:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible de supprimer la tâche');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la tâche:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la tâche');
    }
  };

  const editTask = (task: ScheduledTask) => {
    setEditingTask(task);
    setEditPackages(task.packages.toString());
    setEditDate(new Date(task.date));
    setEditStartTime(task.start_time);
    setEditDelay('0');
    setEditPaletteCondition(task.palette_condition);
    
    // Initialiser les membres de l'équipe pour l'édition
    if (task.team_members && allEmployees.length > 0) {
      const taskEmployees = allEmployees.filter(employee => 
        task.team_members!.includes(employee.id)
      );
      setEditTeamMembers(taskEmployees);
    } else {
      setEditTeamMembers([]);
    }
    
    setShowEditTaskModal(true);
    
    // Animation d'entrée
    editModalOpacity.setValue(0);
    editModalScale.setValue(0.8);
    
    Animated.parallel([
      Animated.timing(editModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(editModalScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeEditModal = () => {
    // Animation de sortie
    Animated.timing(editModalOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(editModalScale, {
      toValue: 0.8,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowEditTaskModal(false);
      setShowEmployeeSelector(false);
      setEditTeamMembers([]);
      setAssignedEmployeeIds([]);
    });
  };

  const openDatePicker = () => {
    setShowEditDatePicker(true);
    datePickerOpacity.setValue(0);
    datePickerScale.setValue(0.9);
    
    Animated.parallel([
      Animated.timing(datePickerOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(datePickerScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDatePicker = () => {
    Animated.parallel([
      Animated.timing(datePickerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(datePickerScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEditDatePicker(false);
    });
  };

  const openEditTimePicker = () => {
    const [hour, minute] = editStartTime.split(':');
    setTempEditHour(hour || '05');
    setTempEditMinute(minute || '00');
    setShowEditTimePicker(true);
  };

  const closeEditTimePicker = () => {
    setShowEditTimePicker(false);
  };

  const saveEditedTask = async () => {
    if (!editingTask || !editPackages.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Calculer la nouvelle durée
      const packages = parseInt(editPackages);
      const baseTimeSeconds = packages * 40;
      const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
      const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds);
      
      const hours = Math.floor(totalTimeSeconds / 3600);
      const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
      const seconds = totalTimeSeconds % 60;
      const formattedDuration = `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
      
      const newEndTime = calculateEndTime(editStartTime, totalTimeSeconds);

      // Mettre à jour la tâche via Supabase avec validation des horaires
      const result = await updateTask(editingTask.id, {
        packages: packages,
        date: editDate.toISOString().split('T')[0],
        start_time: editStartTime,
        end_time: newEndTime,
        duration: formattedDuration,
        palette_condition: editPaletteCondition,
        team_members: editTeamMembers.map(member => member.id)
      });

      if (!result.success) {
        // Afficher l'erreur de validation des horaires
        setWorkingHoursError(result.error || 'Erreur lors de la mise à jour de la tâche');
        setShowWorkingHoursAlert(true);
        return;
      }
      
      Alert.alert('Succès', 'Tâche modifiée avec succès');
      closeEditModal();
      
      // Sauvegarder la date sélectionnée avant le refresh
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      localStorage.setItem('selectedDate', selectedDateString);
      console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
      
      // Rechargement forcé de la page après 2 secondes
      setTimeout(() => {
        console.log('🔄 [DEBUG] Rechargement forcé de la page après modification de tâche');
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error saving edited task:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la tâche modifiée');
    }
  };

  const calculateEndTime = (startTime: string, durationSeconds: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
    
    // Retourner le format HH:MM pour les comparaisons
    return endDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };



  const addEvent = () => {
    if (!eventTitle.trim() || !eventTime.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Créer un nouvel événement
    const newEvent: Event = {
      id: Date.now(), // Utiliser timestamp comme ID unique
      title: eventTitle,
      startTime: eventTime,
      endTime: '10:00', // Heure de fin par défaut, à ajuster selon la durée
      duration: '1h', // Durée par défaut
      location: eventLocation || 'Non spécifié',
      type: 'meeting', // Type par défaut
      date: eventDate.toISOString().split('T')[0] // Date au format YYYY-MM-DD
    };

    // Ajouter l'événement à l'état
    // setEvents([...events, newEvent]);
    
    // Réinitialiser les champs
    setEventTitle('');
    setEventTime('');
    setEventLocation('');
    setEventDate(new Date());
    setShowEventModal(false);
    
    Alert.alert('Succès', `Événement "${newEvent.title}" ajouté avec succès pour le ${eventDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`);
    
    // Sauvegarder la date sélectionnée avant le refresh
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    localStorage.setItem('selectedDate', selectedDateString);
    console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
    
    // Rechargement forcé de la page après 2 secondes
    setTimeout(() => {
      console.log('🔄 [DEBUG] Rechargement forcé de la page après création d\'événement');
      window.location.reload();
    }, 2000);
  };

  const getTasksForSelectedDate = () => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const tasksForDate = scheduledTasks.filter(task => task.date === selectedDateString);
    
    // Filtrer les tâches masquées sauf si showHiddenTasks est true
    const filteredTasks = showHiddenTasks 
      ? tasksForDate 
      : tasksForDate.filter(task => !hiddenTasks.has(task.id));
    
    // Trier les tâches : épinglées d'abord, puis par heure de début
    return filteredTasks.sort((a, b) => {
      // Les tâches épinglées en premier
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      // Puis par heure de début
      const timeA = parseInt(a.start_time.split(':')[0]) * 60 + parseInt(a.start_time.split(':')[1]);
      const timeB = parseInt(b.start_time.split(':')[0]) * 60 + parseInt(b.start_time.split(':')[1]);
      return timeA - timeB;
    });
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return '#3b82f6';
      case 'inspection': return '#10b981';
      case 'training': return '#f59e0b';
      case 'task': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Generate full week (Monday to Sunday)
  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Find Monday of the current week + offset
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as well
    startOfWeek.setDate(today.getDate() + daysToMonday + (currentWeek * 7));

    // Generate Monday to Sunday (7 days)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getWeekLabel = () => {
    if (currentWeek === 0) return 'Cette semaine';
    if (currentWeek === 1) return 'Semaine prochaine';
    if (currentWeek === -1) return 'Semaine dernière';
    return `Semaine ${currentWeek > 0 ? '+' : ''}${currentWeek}`;
  };

  const navigateWeek = (direction: number) => {
    setCurrentWeek(currentWeek + direction);
    // Reset selected date to first day of new week if it's not in the current week
    const newWeekDates = generateWeekDates();
    if (direction !== 0) {
      setSelectedDate(newWeekDates[0]);
    }
  };

  const getDayName = (date: Date) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return dayNames[date.getDay()];
  };

  const generateTimeSlots = () => {
    const slots = [];
    
    // Générer toutes les heures de 00:00 à 23:50 par pas de 10 minutes
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    return slots;
  };

  const tasksForSelectedDate = getTasksForSelectedDate();
  const weekDates = generateWeekDates();
  const timeSlots = generateTimeSlots();

  // Composant TaskCard avec animations individuelles
  const TaskCard = ({ task, onDelete, onEdit }: { 
    task: ScheduledTask; 
    onDelete: (taskId: string) => void; 
    onEdit: (task: ScheduledTask) => void; 
  }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteAnimation = useRef(new Animated.Value(1)).current;
    const slideAnimation = useRef(new Animated.Value(0)).current;

    // Obtenir les employés assignés à cette tâche
    const getTaskEmployees = () => {
      if (!task.team_members || !allEmployees.length) {
        return [];
      }
      
      return allEmployees.filter(employee => 
        task.team_members!.includes(employee.id)
      );
    };

    const taskEmployees = getTaskEmployees();

    const handleDelete = () => {
      setIsDeleting(true);
      
      Animated.parallel([
        Animated.timing(deleteAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDelete(task.id);
      });
    };



    return (
      <Animated.View 
        style={[
          styles.taskCard,
          {
            opacity: deleteAnimation,
            transform: [
              { translateX: slideAnimation },
              { scale: deleteAnimation }
            ]
          }
        ]}
      >
          {/* Indicateurs visuels */}
          {task.is_pinned && (
            <View style={styles.pinIndicator}>
              <Pin color="#f59e0b" size={16} strokeWidth={2} />
            </View>
          )}
          {task.is_completed && (
            <View style={styles.completedIndicator}>
              <Check color="#10b981" size={16} strokeWidth={2} />
            </View>
          )}

          <View style={[styles.taskIndicatorLine, { backgroundColor: '#8b5cf6' }]} />
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={styles.taskActions}>
                <TouchableOpacity 
                  style={styles.reminderButton}
                  onPress={() => openRemindersModal(task)}
                  activeOpacity={0.7}
                >
                  <Bell color="#8b5cf6" size={16} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => toggleCompleteTask(task.id)}
                  activeOpacity={0.7}
                >
                  <Check color={task.is_completed ? "#10b981" : "#6b7280"} size={16} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => onEdit(task)}
                  activeOpacity={0.7}
                >
                  <Edit3 color="#3b82f6" size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.taskDetails}>
              <View style={styles.taskDetailRow}>
                <Clock color="#6b7280" size={16} strokeWidth={2} />
                <Text style={styles.taskDetailText}>
                  {task.start_time} - {task.end_time} ({task.duration})
                </Text>
              </View>
              
              <View style={styles.taskDetailRow}>
                <Package color="#6b7280" size={16} strokeWidth={2} />
                <Text style={styles.taskDetailText}>
                  {task.packages} colis à traiter
                </Text>
              </View>
              
              <View style={styles.taskDetailRow}>
                <Users color="#6b7280" size={16} strokeWidth={2} />
                <View style={styles.teamMembersContainer}>
                  {taskEmployees.length > 0 ? (
                    <View style={styles.teamMembersList}>
                      {taskEmployees.slice(0, 3).map((employee, index) => (
                        <View key={employee.id} style={styles.employeeAvatarContainer}>
                          {employee.avatar_url ? (
                            <Image source={{ uri: employee.avatar_url }} style={styles.employeeAvatar} />
                          ) : (
                            <View style={styles.employeeAvatarPlaceholder}>
                              <Users color="#3b82f6" size={12} strokeWidth={2} />
                            </View>
                          )}
                          {index === 2 && taskEmployees.length > 3 && (
                            <View style={styles.moreEmployeesIndicator}>
                              <Text style={styles.moreEmployeesText}>+{taskEmployees.length - 3}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.taskDetailText}>
                      {task.team_size} membre{task.team_size > 1 ? 's' : ''} d'équipe
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.taskDetailRow}>
                <MapPin color="#6b7280" size={16} strokeWidth={2} />
                <Text style={styles.taskDetailText}>
                  Rayon {task.manager_section}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
    );
  };

  const editEvent = (event: Event) => {
    setEditingEvent(event);
    setEditEventTitle(event.title);
    setEditEventStartTime(event.startTime);
    setEditEventEndTime(event.endTime);
    setEditEventLocation(event.location);
    setEditEventType(event.type);
    setEditEventDate(new Date(event.date)); // Initialiser la date
    setShowEditEventModal(true);
  };

  const closeEditEventModal = () => {
    setShowEditEventModal(false);
    setEditingEvent(null);
  };

  const deleteEvent = (eventId: number) => {
    // Trouver l'événement à supprimer
    // const eventToDelete = events.find(event => event.id === eventId);
    // Pour l'instant, on ne peut pas supprimer d'événements car ils ne sont pas stockés localement
    console.log('Event deletion not implemented yet:', eventId);
    Alert.alert('Info', 'Suppression d\'événement non implémentée');
  };

  const confirmDeleteEvent = () => {
    if (!eventToDelete) return;

    console.log('Confirming deletion of event:', eventToDelete.id, eventToDelete.title);
    
    // Supprimer l'événement de l'état
    // const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
    // setEvents(updatedEvents);
    
    // Fermer le modal
    setShowDeleteConfirmModal(false);
    setEventToDelete(null);
    
    // Afficher une notification de succès
    Alert.alert('Succès', `Événement "${eventToDelete.title}" supprimé`);
  };

  const cancelDeleteEvent = () => {
    setShowDeleteConfirmModal(false);
    setEventToDelete(null);
  };

  // Fonction de test pour supprimer directement sans confirmation
  const testDeleteEvent = (eventId: number) => {
    console.log('Test delete for event:', eventId);
    // const updatedEvents = events.filter(event => event.id !== eventId);
    // setEvents(updatedEvents);
    console.log('Test delete completed for event:', eventId);
  };

  const saveEditedEvent = () => {
    if (!editingEvent || !editEventTitle.trim() || !editEventStartTime || !editEventEndTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier que l'heure de fin est après l'heure de début
    const startMinutes = parseInt(editEventStartTime.split(':')[0]) * 60 + parseInt(editEventStartTime.split(':')[1]);
    const endMinutes = parseInt(editEventEndTime.split(':')[0]) * 60 + parseInt(editEventEndTime.split(':')[1]);
    
    if (endMinutes <= startMinutes) {
      Alert.alert('Erreur', 'L\'heure de fin doit être après l\'heure de début');
      return;
    }

    // Calculer la durée
    const durationMinutes = endMinutes - startMinutes;
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    const duration = durationHours > 0 
      ? `${durationHours}h${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`
      : `${remainingMinutes}min`;

    // Mettre à jour l'événement dans l'état
    // const updatedEvents = events.map(event => 
    //   event.id === editingEvent.id 
    //     ? {
    //         ...event,
    //         title: editEventTitle,
    //         startTime: editEventStartTime,
    //         endTime: editEventEndTime,
    //         duration: duration,
    //         location: editEventLocation,
    //         type: editEventType,
    //         date: editEventDate.toISOString().split('T')[0] // Date au format YYYY-MM-DD
    //       }
    //     : event
    // );
    
    // setEvents(updatedEvents);
    Alert.alert('Succès', 'Événement modifié avec succès');
    closeEditEventModal();
  };

  const openEventTimePicker = (mode: 'start' | 'end') => {
    setTimePickerMode(mode);
    const currentTime = mode === 'start' ? editEventStartTime : editEventEndTime;
    const [hour, minute] = currentTime.split(':');
    setTempEventHour(hour || (mode === 'start' ? '09' : '10'));
    setTempEventMinute(minute || '00');
    setShowEditEventTimePicker(true);
  };

  const closeEventTimePicker = () => {
    setShowEditEventTimePicker(false);
  };

  // Initialiser les valeurs temporaires pour l'édition d'événement
  const initializeEventTimePicker = (mode: 'start' | 'end') => {
    setTimePickerMode(mode);
    if (mode === 'start') {
      const [hour, minute] = editEventStartTime.split(':');
      setTempEventHour(hour || '09');
      setTempEventMinute(minute || '00');
    } else {
      const [hour, minute] = editEventEndTime.split(':');
      setTempEventHour(hour || '10');
      setTempEventMinute(minute || '00');
    }
  };

  // Générer les heures disponibles selon les heures de travail
  const generateAvailableHours = () => {
    const hours = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      hours.push(hour.toString().padStart(2, '0'));
    }
    
    return hours;
  };

  // Générer toutes les heures (pour les heures de travail)
  const generateAllHours = () => {
    const hours = [];
    for (let hour = 0; hour <= 23; hour++) {
      hours.push(hour.toString().padStart(2, '0'));
    }
    return hours;
  };

  // Générer les minutes disponibles
  const generateAvailableMinutes = () => {
    return ['00', '10', '20', '30', '40', '50'];
  };

  // Initialiser les valeurs temporaires pour l'ajout d'événement
  const openAddEventTimePicker = () => {
    const [hour, minute] = eventTime.split(':');
    setTempAddEventHour(hour || '09');
    setTempAddEventMinute(minute || '00');
    setShowAddEventTimePicker(true);
  };

  const openEventDatePicker = () => {
    setShowEventDatePicker(true);
  };

  const closeEventDatePicker = () => {
    setShowEventDatePicker(false);
  };

  const openEditEventDatePicker = () => {
    setShowEditEventDatePicker(true);
  };

  const closeEditEventDatePicker = () => {
    setShowEditEventDatePicker(false);
  };

  // Vérifier si un employé est déjà assigné à une tâche (occupé ou en conflit)
  const isEmployeeAssigned = async (employeeId: number) => {
    try {
      const selectedDateString = editDate.toISOString().split('T')[0];
      
      // Utiliser Supabase au lieu d'AsyncStorage
      const { data: tasksOnSameDate, error } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('date', selectedDateString)
        .eq('manager_id', user?.id?.toString())
        .not('is_completed', 'eq', true); // Exclure les tâches terminées
      
      if (error) {
        console.error('Error fetching tasks for date:', error);
        return false;
      }
      
      const newTaskStart = editStartTime;
      const newTaskEnd = calculateEndTime(editStartTime, (() => {
        const packages = parseInt(editPackages) || 0;
        const delayMinutes = parseInt(editDelay) || 0;
        const baseTimeSeconds = packages * 40;
        const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
        const delaySeconds = delayMinutes * 60;
        return Math.max(0, baseTimeSeconds + palettePenaltySeconds + delaySeconds);
      })());
      
      // Vérifier si l'employé est dans une tâche qui se chevauche TEMPORELLEMENT
      for (const task of tasksOnSameDate || []) {
        // Ignorer la tâche en cours d'édition
        if (editingTask && task.id === editingTask.id) {
          continue;
        }
        
        // Vérifier si l'employé est dans cette tâche
        const isInTask = task.team_members && task.team_members.includes(employeeId);
        
        if (!isInTask) {
          continue; // L'employé n'est pas dans cette tâche
        }
        
        const existingStart = task.start_time;
        const existingEnd = task.end_time;
        
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        // Vérifier s'il y a un conflit temporel
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        // L'employé est occupé SEULEMENT s'il y a un conflit temporel
        if (hasConflict) {
          console.log(`🚫 Employé ${employeeId} occupé: conflit temporel avec tâche ${task.id} (${existingStart}-${existingEnd})`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking employee assignment:', error);
      return false;
    }
  };

  // Ouvrir le modal des rappels intelligents
  const openRemindersModal = async (task: ScheduledTask) => {
    setSelectedTaskForReminders(task);
    
    // Charger les rappels existants
    const reminders = await notificationService.getSmartReminders(task.id);
    setTaskReminders(reminders);
    
    // Analyser la charge de travail
    const workload = await notificationService.analyzeTeamWorkload(task.date);
    setWorkloadAnalysis(workload);
    
    setShowRemindersModal(true);
    
    // Animation d'entrée
    remindersModalOpacity.setValue(0);
    remindersModalScale.setValue(0.8);
    
    Animated.parallel([
      Animated.timing(remindersModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(remindersModalScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Fermer le modal des rappels
  const closeRemindersModal = () => {
    Animated.timing(remindersModalOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(remindersModalScale, {
      toValue: 0.8,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowRemindersModal(false);
      setSelectedTaskForReminders(null);
      setTaskReminders([]);
      setWorkloadAnalysis(null);
    });
  };

  // Activer/désactiver un rappel
  const toggleReminder = async (reminderId: string, isEnabled: boolean) => {
    await notificationService.toggleReminder(reminderId, isEnabled);
    
    // Mettre à jour l'état local
    setTaskReminders(prev => 
      prev.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, isEnabled }
          : reminder
      )
    );
  };

  // Supprimer un rappel
  const deleteReminder = async (reminderId: string) => {
    Alert.alert(
      'Supprimer le rappel',
      'Êtes-vous sûr de vouloir supprimer ce rappel ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await notificationService.deleteReminder(reminderId);
            setTaskReminders(prev => prev.filter(r => r.id !== reminderId));
          }
        }
      ]
    );
  };

  // Régénérer les rappels intelligents
  const regenerateReminders = async () => {
    if (!selectedTaskForReminders) return;
    
    const newReminders = await notificationService.generateSmartReminders(selectedTaskForReminders);
    await notificationService.saveSmartReminders(selectedTaskForReminders.id, newReminders);
    setTaskReminders(newReminders);
    
    Alert.alert('Succès', 'Rappels intelligents régénérés avec succès');
  };

  // Obtenir l'icône pour le type de rappel
  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'start': return '🚀';
      case 'preparation': return '⚡';
      case 'team_ready': return '👥';
      case 'efficiency_alert': return '⚠️';
      default: return '🔔';
    }
  };

  // Obtenir la couleur pour le type de rappel
  const getReminderColor = (type: string) => {
    switch (type) {
      case 'start': return '#10b981';
      case 'preparation': return '#3b82f6';
      case 'team_ready': return '#8b5cf6';
      case 'efficiency_alert': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Charger les employés déjà assignés
  const loadAssignedEmployees = async () => {
    try {
      const assignedIds: number[] = [];
      const currentTeamIds = editTeamMembers.map(member => member.id);
      
      for (const employee of allEmployees) {
        // Ne jamais considérer comme occupé si l'employé est déjà dans l'équipe actuelle
        if (currentTeamIds.includes(employee.id)) {
          continue;
        }
        
        const isAssigned = await isEmployeeAssigned(employee.id);
        if (isAssigned) {
          assignedIds.push(employee.id);
        }
      }
      
      setAssignedEmployeeIds(assignedIds);
    } catch (error) {
      console.error('Error loading assigned employees:', error);
    }
  };

  // Ouvrir le sélecteur d'employés
  const openEmployeeSelector = () => {
    setShowEmployeeSelector(true);
    loadAssignedEmployees();
  };

  // Ajouter un employé à l'équipe
  const addEmployeeToTeam = (employee: any) => {
    if (!editTeamMembers.find(member => member.id === employee.id)) {
      const newTeamMembers = [...editTeamMembers, employee];
      setEditTeamMembers(newTeamMembers);
      
      // Rafraîchir la liste des employés disponibles
      if (showEmployeeSelector) {
        setTimeout(() => loadAssignedEmployees(), 100);
      }
    }
  };

  // Supprimer un employé de l'équipe
  const removeEmployeeFromTeam = (employeeId: number) => {
    const newTeamMembers = editTeamMembers.filter(member => member.id !== employeeId);
    setEditTeamMembers(newTeamMembers);
    
    // Rafraîchir la liste des employés disponibles
    if (showEmployeeSelector) {
      setTimeout(() => loadAssignedEmployees(), 100);
    }
  };

  // Fonctions pour épingler/désépingler et terminer une tâche
  const togglePinTask = async (taskId: string) => {
    try {
      console.log('🔄 Épinglage/désépinglage de la tâche:', taskId);
      const result = await toggleTaskPin(taskId);
      if (result.success) {
        console.log('✅ Tâche épinglée/désépinglée avec succès');
        // Recharger les tâches pour mettre à jour l'affichage
        setTimeout(() => {
          getTasksForSelectedDate();
        }, 100);
        
        // Sauvegarder la date sélectionnée avant le refresh
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        localStorage.setItem('selectedDate', selectedDateString);
        console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
        
        // Rechargement forcé de la page après 2 secondes
        setTimeout(() => {
          console.log('🔄 [DEBUG] Rechargement forcé de la page après épinglage/désépinglage');
          window.location.reload();
        }, 2000);
      } else {
        console.error('❌ Erreur lors de l\'épinglage de la tâche:', result.error);
        Alert.alert('Erreur', 'Impossible d\'épingler la tâche');
      }
    } catch (error) {
      console.error('Error toggling pin task:', error);
      Alert.alert('Erreur', 'Impossible d\'épingler la tâche');
    }
  };

  const toggleCompleteTask = async (taskId: string) => {
    try {
      console.log('🔄 Marquage de la tâche comme terminée:', taskId);
      const result = await toggleTaskComplete(taskId);
      if (result.success) {
        console.log('✅ Tâche marquée comme terminée avec succès');
        // Recharger les tâches pour mettre à jour l'affichage
        setTimeout(() => {
          getTasksForSelectedDate();
        }, 100);
        
        // Sauvegarder la date sélectionnée avant le refresh
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        localStorage.setItem('selectedDate', selectedDateString);
        console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
        
        // Rechargement forcé de la page après 2 secondes
        setTimeout(() => {
          console.log('🔄 [DEBUG] Rechargement forcé de la page après marquage comme terminée');
          window.location.reload();
        }, 2000);
      } else {
        console.error('❌ Erreur lors du marquage de la tâche:', result.error);
        Alert.alert('Erreur', 'Impossible de marquer la tâche comme terminée');
      }
    } catch (error) {
      console.error('Error toggling complete task:', error);
      Alert.alert('Erreur', 'Impossible de marquer la tâche comme terminée');
    }
  };

  // Fonctions pour la gestion des retards
  const handleSelectTaskForDelay = (task: ScheduledTask) => {
    setSelectedTaskForDelay(task);
    setShowDelaySelectionModal(false);
    setTempDelayMinutes('');
    setTempDelayReason('');
    setShowDelayInputModal(true);
  };

  const editRecurringEvent = (event: any) => {
    console.log('🔍 [DEBUG] Modification d\'événement récurrent:', event);
    setEditingRecurringEvent(event);
    setEditRecTitle(event.title);
    setEditRecStartTime(event.start_time);
    setEditRecDuration(event.duration_minutes?.toString() || '60');
    setEditRecRecurrenceType(event.recurrence_type || 'daily');
    setEditRecCustomDays(event.custom_days || []);
    setEditRecStartDate(new Date(event.start_date));
    setEditRecEndDate(event.end_date ? new Date(event.end_date) : null);
    setShowEditRecurringEventModal(true);
  };

  const closeEditRecurringEventModal = () => {
    setShowEditRecurringEventModal(false);
    setEditingRecurringEvent(null);
    setEditRecTitle('');
    setEditRecStartTime('');
    setEditRecDuration('');
    setEditRecRecurrenceType('daily');
    setEditRecCustomDays([]);
    setEditRecStartDate(new Date());
    setEditRecEndDate(null);
  };

  const saveEditedRecurringEvent = async () => {
    if (!editingRecurringEvent || !editRecTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      console.log('🔍 [DEBUG] Sauvegarde de l\'événement récurrent modifié');
      
      // Appeler la fonction de mise à jour depuis le hook useSupabaseEvents
      const result = await updateEvent(editingRecurringEvent.id, {
        title: editRecTitle,
        start_time: editRecStartTime,
        duration_minutes: parseInt(editRecDuration),
        recurrence_type: editRecRecurrenceType,
        custom_days: editRecCustomDays,
        start_date: editRecStartDate.toISOString().split('T')[0],
        end_date: editRecEndDate?.toISOString().split('T')[0] || null
      });

      if (result.success) {
        console.log('✅ Événement récurrent modifié avec succès');
        Alert.alert('Succès', 'Événement récurrent modifié avec succès');
        closeEditRecurringEventModal();
        reloadEvents(); // Recharger les événements
        
        // Sauvegarder la date sélectionnée avant le refresh
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        localStorage.setItem('selectedDate', selectedDateString);
        console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
        
        // Rechargement forcé de la page après 2 secondes
        setTimeout(() => {
          console.log('🔄 [DEBUG] Rechargement forcé de la page après modification d\'événement récurrent');
          window.location.reload();
        }, 2000);
      } else {
        console.error('❌ Erreur lors de la modification:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible de modifier l\'événement récurrent');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la modification de l\'événement récurrent:', error);
      Alert.alert('Erreur', 'Impossible de modifier l\'événement récurrent');
    }
  };

  const deleteRecurringEvent = (event: any) => {
    console.log('🔍 [DEBUG] ===== DÉBUT deleteRecurringEvent =====');
    console.log('🔍 [DEBUG] Événement à supprimer:', event);
    console.log('🔍 [DEBUG] ID de l\'événement:', event?.id);
    console.log('🔍 [DEBUG] Titre de l\'événement:', event?.title);
    
    if (!event || !event.id) {
      console.error('❌ [DEBUG] Événement invalide:', event);
      Alert.alert('Erreur', 'Événement invalide');
      return;
    }
    
    setRecurringEventToDelete(event);
    setShowRecurringEventDeleteConfirmModal(true);
    console.log('🔍 [DEBUG] Modal de confirmation ouvert');
  };

  const handleDeleteRecurringEvent = async () => {
    console.log('🔍 [DEBUG] ===== DÉBUT handleDeleteRecurringEvent =====');
    console.log('🔍 [DEBUG] recurringEventToDelete:', recurringEventToDelete);
    
    if (!recurringEventToDelete) {
      console.log('❌ [DEBUG] Aucun événement à supprimer');
      return;
    }

    try {
      console.log('🔍 [DEBUG] Suppression de l\'événement récurrent:', recurringEventToDelete.id);
      console.log('🔍 [DEBUG] Titre de l\'événement:', recurringEventToDelete.title);
      
      // Vérifier que deleteRecurringEventFromSupabase est bien disponible
      if (typeof deleteRecurringEventFromSupabase !== 'function') {
        console.error('❌ [DEBUG] deleteRecurringEventFromSupabase n\'est pas une fonction:', typeof deleteRecurringEventFromSupabase);
        Alert.alert('Erreur', 'Fonction de suppression non disponible');
        return;
      }
      
      console.log('🔍 [DEBUG] Appel de deleteRecurringEventFromSupabase avec id:', recurringEventToDelete.id);
      const result = await deleteRecurringEventFromSupabase(recurringEventToDelete.id);
      console.log('🔍 [DEBUG] Résultat de deleteEvent:', result);

      if (result && result.success) {
        console.log('✅ Événement récurrent supprimé avec succès');
        Alert.alert('Succès', 'Événement récurrent supprimé avec succès');
        setShowRecurringEventDeleteConfirmModal(false);
        setRecurringEventToDelete(null);
        
        // Recharger les événements
        console.log('🔄 [DEBUG] Rechargement des événements');
        reloadEvents();
        
        // Sauvegarder la date sélectionnée avant le refresh
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        localStorage.setItem('selectedDate', selectedDateString);
        console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
        
        // Rechargement forcé de la page après 2 secondes
        setTimeout(() => {
          console.log('🔄 [DEBUG] Rechargement forcé de la page après suppression d\'événement récurrent');
          window.location.reload();
        }, 2000);
      } else {
        console.error('❌ Erreur lors de la suppression:', result?.error || 'Résultat inattendu');
        Alert.alert('Erreur', result?.error || 'Impossible de supprimer l\'événement récurrent');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'événement récurrent:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'événement récurrent');
    }
  };

  // Fonctions pour les sélecteurs d'événements récurrents
  const openEditRecDatePicker = () => {
    setShowEditRecDatePicker(true);
  };

  const closeEditRecDatePicker = () => {
    setShowEditRecDatePicker(false);
  };

  const openEditRecEndDatePicker = () => {
    setShowEditRecEndDatePicker(true);
  };

  const closeEditRecEndDatePicker = () => {
    setShowEditRecEndDatePicker(false);
  };

  const openEditRecTimePicker = () => {
    setShowEditRecTimePicker(true);
  };

  const closeEditRecTimePicker = () => {
    setShowEditRecTimePicker(false);
  };

  const createNewTask = async () => {
    console.log('🔍 [DEBUG] ===== DÉBUT CRÉATION NOUVELLE TÂCHE =====');
    
    // Validation
    if (!newTaskTitle.trim()) {
      console.log('❌ [DEBUG] Titre de tâche manquant');
      Alert.alert('Erreur', 'Veuillez saisir un titre pour la tâche');
      return;
    }
    
    if (!newTaskPackages.trim() || parseInt(newTaskPackages) <= 0) {
      console.log('❌ [DEBUG] Nombre de colis invalide:', newTaskPackages);
      Alert.alert('Erreur', 'Veuillez saisir un nombre de colis valide');
      return;
    }
    
    if (!newTaskStartTime) {
      console.log('❌ [DEBUG] Heure de début manquante');
      Alert.alert('Erreur', 'Veuillez sélectionner une heure de début');
      return;
    }
    
    try {
      // Calculer la durée et l'heure de fin
      const packages = parseInt(newTaskPackages);
      const baseTimeSeconds = packages * 40;
      const palettePenaltySeconds = newTaskPaletteCondition ? 0 : 20 * 60;
      const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds);
      
      const hours = Math.floor(totalTimeSeconds / 3600);
      const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
      const seconds = totalTimeSeconds % 60;
      const formattedDuration = `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
      
      const endTime = calculateEndTime(newTaskStartTime, totalTimeSeconds);
      
      // Construction des données de la tâche
      const taskData = {
        title: newTaskTitle.trim(),
        packages: packages,
        date: newTaskDate.toISOString().split('T')[0],
        start_time: newTaskStartTime,
        end_time: endTime,
        duration: formattedDuration,
        palette_condition: newTaskPaletteCondition,
        manager_id: user?.id || 1,
        store_id: 1,
        manager_section: 'Général',
        manager_initials: 'GR',
        team_members: []
      };
      
      console.log('🔍 [DEBUG] Données de la tâche:', taskData);
      console.log('🔍 [DEBUG] User ID:', user?.id);
      
      // Vérifier que createTask est disponible
      if (typeof createTask !== 'function') {
        console.error('❌ [DEBUG] createTask n\'est pas une fonction:', typeof createTask);
        Alert.alert('Erreur', 'Fonction de création de tâche non disponible');
        return;
      }
      
      console.log('🔍 [DEBUG] Appel de createTask...');
      const result = await createTask(taskData);
      console.log('🔍 [DEBUG] Résultat de createTask:', result);
      
      if (result && result.success) {
        console.log('✅ [DEBUG] Tâche créée avec succès');
        
        // Réinitialisation des champs
        setNewTaskTitle('');
        setNewTaskPackages('');
        setNewTaskDate(new Date());
        setNewTaskStartTime('09:00');
        setNewTaskPaletteCondition(true);
        
        // Fermeture du modal
        setShowNewTaskModal(false);
        
        // Rechargement des données
        console.log('🔄 [DEBUG] Rechargement des tâches...');
        triggerRefresh();
        
        // Sauvegarder la date sélectionnée avant le refresh
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        localStorage.setItem('selectedDate', selectedDateString);
        console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
        
        // Rechargement forcé de la page après 2 secondes
        setTimeout(() => {
          console.log('🔄 [DEBUG] Rechargement forcé de la page après création de tâche');
          window.location.reload();
        }, 2000);
        
        Alert.alert(
          'Succès', 
          'Tâche créée avec succès !',
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ [DEBUG] Erreur lors de la création de la tâche:', result?.error);
        Alert.alert(
          'Erreur', 
          result?.error || 'Erreur lors de la création de la tâche',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur lors de la création de la tâche:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur inattendue s\'est produite',
        [{ text: 'OK' }]
      );
    }
  };

  const handleConfirmDelay = async () => {
    if (!selectedTaskForDelay || !tempDelayMinutes.trim() || parseInt(tempDelayMinutes) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de minutes valide');
      return;
    }

    if (!tempDelayReason.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer la raison du retard');
      return;
    }

    try {
      const delayMinutes = parseInt(tempDelayMinutes);
      const alertMessage = `Retard de ${delayMinutes} minutes signalé sur la tâche "${selectedTaskForDelay.title}" - ${selectedTaskForDelay.packages} colis. Raison: ${tempDelayReason}`;
      const severity = delayMinutes > 30 ? 'critical' : delayMinutes > 15 ? 'warning' : 'info';
      
      console.log('Création de l\'alerte avec les données:', {
        task_id: selectedTaskForDelay.id,
        manager_id: user?.id?.toString() || '1',
        message: alertMessage,
        severity: severity
      });
      
      const result = await createAlert({
        task_id: selectedTaskForDelay.id,
        manager_id: user?.id?.toString() || '1',
        message: alertMessage,
        severity: severity
      });
      
      console.log('Résultat de la création de l\'alerte:', result);

      // Envoyer une notification push
      await notificationService.sendImmediateNotification(
        '⚠️ Retard signalé',
        alertMessage,
        { type: 'task_delay', taskId: selectedTaskForDelay.id, delayMinutes: delayMinutes }
      );

      Alert.alert('Succès', 'Retard signalé avec succès');
      setShowDelayInputModal(false);
      setSelectedTaskForDelay(null);
      setTempDelayMinutes('');
      setTempDelayReason('');
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      Alert.alert('Erreur', 'Impossible de signaler le retard');
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        {/* Alerte pour les erreurs d'horaires */}
        <WorkingHoursAlert
          message={workingHoursError || ''}
          onClose={() => {
            setShowWorkingHoursAlert(false);
            setWorkingHoursError(null);
          }}
          visible={showWorkingHoursAlert}
        />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <ChevronLeft color={isDark ? '#f4f4f5' : '#1a1a1a'} size={28} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Planning Rayon</Text>
          <View style={[styles.workingHoursButton, isDark && styles.workingHoursButtonDark]}>
            <Clock color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
            <Text style={[styles.workingHoursText, isDark && styles.workingHoursTextDark]}>
              {workingHours.start} - {workingHours.end}
            </Text>
          </View>
        </View>

        {/* Week Navigation */}
        <View style={styles.section}>
          <View style={styles.weekHeader}>
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={() => navigateWeek(-1)}
            >
              <ChevronLeft color="#6b7280" size={20} strokeWidth={2} />
            </TouchableOpacity>
            
            <Text style={styles.weekTitle}>{getWeekLabel()}</Text>
            
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={() => navigateWeek(1)}
            >
              <ChevronRight color="#6b7280" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Week Carousel - 7 days */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekContainer} contentContainerStyle={styles.weekContainerContent}>
            {weekDates.map((date, index) => {
              const dayTasks = scheduledTasks.filter(task => task.date === date.toISOString().split('T')[0]);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCard,
                    isSameDate(date, selectedDate) && styles.selectedDayCard,
                    isToday(date) && styles.todayCard
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayName,
                    isSameDate(date, selectedDate) && styles.selectedDayText,
                    isToday(date) && styles.todayText
                  ]}>
                    {getDayName(date)}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isSameDate(date, selectedDate) && styles.selectedDayText,
                    isToday(date) && styles.todayText
                  ]}>
                    {date.getDate()}
                  </Text>
                  {/* Task indicators */}
                  <View style={styles.taskIndicators}>
                    {dayTasks.length > 0 && (
                      <View style={styles.taskIndicator}>
                        <Text style={styles.taskIndicatorText}>{dayTasks.length}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isToday(selectedDate) ? 'Aujourd\'hui' : formatDateForDisplay(selectedDate)}
          </Text>
          <View style={styles.dateCard}>
            <Text style={styles.dateText}>
              {formatDateForDisplay(selectedDate)}
            </Text>
            <View style={styles.dateSummary}>
              <Text style={styles.dateSummaryText}>
                {tasksForSelectedDate.length} tâche{tasksForSelectedDate.length !== 1 ? 's' : ''} planifiée{tasksForSelectedDate.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Scheduled Tasks */}
        {tasksForSelectedDate.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tâches planifiées</Text>
              <View style={styles.sectionHeaderActions}>
                <Text style={styles.taskCount}>{tasksForSelectedDate.length} tâche{tasksForSelectedDate.length > 1 ? 's' : ''}</Text>
                {hiddenTasks.size > 0 && (
                  <TouchableOpacity 
                    style={[styles.toggleHiddenButton, isDark && styles.toggleHiddenButtonDark]}
                    onPress={() => setShowHiddenTasks(!showHiddenTasks)}
                  >
                    <Eye color={isDark ? '#f4f4f5' : '#1a1a1a'} size={16} strokeWidth={2} />
                    <Text style={[styles.toggleHiddenText, isDark && styles.toggleHiddenTextDark]}>
                      {showHiddenTasks ? 'Masquer' : 'Afficher'} ({hiddenTasks.size})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {tasksForSelectedDate.map((task, index) => (
              <TaskCard
                key={task.id}
                task={{...task, duration: task.duration || '1h'} as ScheduledTask}
                onDelete={handleDeleteTask}
                onEdit={editTask}
              />
            ))}
          </View>
        )}

        {/* Regular Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Événements du jour</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowEventModal(true)}
            >
              <Plus color="#ffffff" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Affiche les événements récurrents du jour */}
          {(() => {
            console.log('🔍 [DEBUG] ===== AFFICHAGE ÉVÉNEMENTS RÉCURRENTS =====');
            console.log('🔍 [DEBUG] Nombre total d\'événements récurrents:', recurringEvents.length);
            console.log('🔍 [DEBUG] Date sélectionnée:', selectedDate.toISOString().split('T')[0]);
            console.log('🔍 [DEBUG] Événements récurrents:', recurringEvents);
            
            const filteredEvents = recurringEvents.filter(event => {
              // Affiche uniquement les événements actifs dont la date du jour est dans la plage de récurrence
              const today = selectedDate.toISOString().split('T')[0];
              const start = event.start_date;
              const end = event.end_date || today;
              const isInRange = event.is_active && today >= start && today <= end;
              
              console.log('🔍 [DEBUG] Événement:', event.title);
              console.log('🔍 [DEBUG] - Date de début:', start);
              console.log('🔍 [DEBUG] - Date de fin:', end);
              console.log('🔍 [DEBUG] - Actif:', event.is_active);
              console.log('🔍 [DEBUG] - Dans la plage:', isInRange);
              
              return isInRange;
            });
            
            console.log('🔍 [DEBUG] Événements filtrés:', filteredEvents.length);
            
            return filteredEvents.map(event => (
              <View key={event.id} style={[styles.eventCard, isDark && styles.eventCardDark]}>
                <View style={[styles.eventIndicator, { backgroundColor: '#8b5cf6' }]} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.title} <Text style={{color:'#10b981',fontWeight:'bold'}}>• Récurrent</Text></Text>
                    <View style={styles.eventActions}>
                      <TouchableOpacity 
                        style={styles.eventActionButton}
                        onPress={() => editRecurringEvent(event)}
                        activeOpacity={0.7}
                      >
                        <Edit3 color="#3b82f6" size={16} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.eventActionButton}
                        onPress={() => {
                          console.log('🔍 [DEBUG] ===== BOUTON SUPPRESSION CLIQUÉ =====');
                          console.log('🔍 [DEBUG] Événement:', event);
                          console.log('🔍 [DEBUG] ID de l\'événement:', event?.id);
                          console.log('🔍 [DEBUG] Titre de l\'événement:', event?.title);
                          deleteRecurringEvent(event);
                        }}
                        activeOpacity={0.7}
                      >
                        <Trash2 color="#ef4444" size={16} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.eventTime}>
                    <Clock color="#6b7280" size={16} strokeWidth={2} />
                    <Text style={styles.eventTimeText}>{event.start_time} ({event.recurrence_type})</Text>
                  </View>
                </View>
              </View>
            ));
          })()}

          {/* Affiche les événements locaux (anciens) */}
          {/* Remplacer tous les usages de 'events' (pour les événements locaux) par une source réelle Supabase ou supprimer la section si elle n'est plus utile. */}

        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity 
            style={[styles.actionCard, isDark && styles.actionCardDark]}
            onPress={() => setShowEventModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Planifier un événement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, isDark && styles.actionCardDark]}
            onPress={() => setShowNewTaskModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
              <Package color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Créer une nouvelle tâche</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, isDark && styles.actionCardDark]}
            onPress={() => {
              console.log('🔍 [DEBUG] Bouton "Créer un événement récurrent" cliqué');
              setShowRecurringEventModal(true);
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}> 
              <Package color="#10b981" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Créer un événement récurrent</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, isDark && styles.actionCardDark]}
            onPress={() => setShowDelaySelectionModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}>
              <Clock color="#ef4444" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Signaler un retard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, isDark && styles.actionCardDark]}
            onPress={() => setShowHiddenTasks(!showHiddenTasks)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f0f9ff' }]}>
              <Eye color="#0ea5e9" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>
              {showHiddenTasks ? 'Masquer les tâches' : 'Afficher les tâches masquées'}
            </Text>
            {hiddenTasks.size > 0 && (
              <View style={styles.hiddenTasksBadge}>
                <Text style={styles.hiddenTasksBadgeText}>{hiddenTasks.size}</Text>
              </View>
            )}
          </TouchableOpacity>


        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Titre *</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Ex: Réunion équipe"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Date *</Text>
              <TouchableOpacity 
                style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                onPress={openEventDatePicker}
              >
                <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                  {eventDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Heure de début *</Text>
              <TouchableOpacity 
                style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                onPress={openAddEventTimePicker}
              >
                <Clock color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                  {eventTime || 'Sélectionner une heure'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Lieu</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={eventLocation}
                onChangeText={setEventLocation}
                placeholder="Ex: Salle de pause"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={addEvent}
              >
                <Text style={styles.primaryButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Calendar Date Picker for New Event */}
      <DatePickerCalendar
        visible={showEventDatePicker}
        onClose={closeEventDatePicker}
        onDateSelect={(date) => setEventDate(date)}
        selectedDate={eventDate}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 84 * 24 * 60 * 60 * 1000)} // 12 weeks from now
      />

      {/* Edit Task Modal */}
      <Modal
        visible={showEditTaskModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeEditModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: editModalOpacity }]}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{ scale: editModalScale }]
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier la tâche</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {editingTask && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Titre de la tâche</Text>
                    <Text style={styles.readOnlyText}>{editingTask.title}</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nombre de colis *</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                      value={editPackages}
                      onChangeText={setEditPackages}
                      placeholder="Ex: 150"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Section des employés assignés */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Membres de l'équipe</Text>
                    <TouchableOpacity style={styles.employeeSelectorButton} onPress={openEmployeeSelector}>
                      <Users color="#3b82f6" size={24} strokeWidth={2} />
                      <Text style={styles.employeeSelectorText}>
                        Sélectionner les membres de l'équipe
                      </Text>
                      <Text style={styles.employeeSelectorSubtext}>
                        {editTeamMembers.length} membre{editTeamMembers.length > 1 ? 's' : ''} sélectionné{editTeamMembers.length > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Liste des employés sélectionnés */}
                    {editTeamMembers.map((member, index) => (
                      <View key={member.id} style={styles.memberCard}>
                        <View style={styles.memberInfo}>
                          {member.avatar_url ? (
                            <Image source={{ uri: member.avatar_url }} style={styles.memberAvatar} />
                          ) : (
                            <View style={styles.memberAvatarPlaceholder}>
                              <Users color="#3b82f6" size={20} strokeWidth={2} />
                            </View>
                          )}
                          <View style={styles.memberDetails}>
                            <Text style={styles.memberName}>{member.name}</Text>
                            {member.role && <Text style={styles.memberRole}>{member.role}</Text>}
                          </View>
                          {index === 0 && <Text style={styles.principalBadge}>Principal</Text>}
                          {index > 0 && <Text style={styles.bonusBadge}>-30 min</Text>}
                        </View>
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => removeEmployeeFromTeam(member.id)}
                        >
                          <X color="#ef4444" size={16} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {editTeamMembers.length === 0 && (
                      <View style={styles.noEmployeeCard}>
                        <Text style={styles.noEmployeeText}>
                          Aucun membre sélectionné
                        </Text>
                        <Text style={styles.noEmployeeSubtext}>
                          Cliquez sur "Sélectionner les membres" pour ajouter des employés à cette tâche
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>État de la palette</Text>
                    <View style={styles.switchContainer}>
                      <Text style={[styles.switchLabel, !editPaletteCondition && styles.activeLabel]}>
                        Mauvais état (+20 min)
                      </Text>
                      <Switch
                        value={editPaletteCondition}
                        onValueChange={setEditPaletteCondition}
                        trackColor={{ false: '#ef4444', true: '#10b981' }}
                        thumbColor={editPaletteCondition ? '#ffffff' : '#ffffff'}
                      />
                      <Text style={[styles.switchLabel, editPaletteCondition && styles.activeLabel]}>
                        Bon état
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Date</Text>
                    <TouchableOpacity 
                      style={styles.dateSelector}
                      onPress={() => setShowEditDatePicker(true)}
                    >
                      <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
                      <Text style={styles.dateText}>
                        {editDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Heure de début</Text>
                    <TouchableOpacity 
                      style={styles.dateSelector}
                      onPress={openEditTimePicker}
                    >
                      <Clock color="#3b82f6" size={20} strokeWidth={2} />
                      <Text style={styles.dateText}>{editStartTime}</Text>
                    </TouchableOpacity>
                  </View>



                  <View style={styles.previewSection}>
                    <Text style={styles.previewTitle}>Aperçu des modifications</Text>
                    <View style={[styles.previewCard, isDark && styles.previewCardDark]}>
                      <Text style={[styles.previewText, isDark && styles.previewTextDark]}>
                        Nouvelle durée estimée: {(() => {
                          const packages = parseInt(editPackages) || 0;
                          const baseTimeSeconds = packages * 40;
                          const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
                          const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds);
                          const hours = Math.floor(totalTimeSeconds / 3600);
                          const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
                          const seconds = totalTimeSeconds % 60;
                          return `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
                        })()}
                      </Text>
                      <Text style={[styles.previewText, isDark && styles.previewTextDark]}>
                        Nouvelle heure de fin: {(() => {
                          const packages = parseInt(editPackages) || 0;
                          const baseTimeSeconds = packages * 40;
                          const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
                          const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds);
                          return calculateEndTime(editStartTime, totalTimeSeconds);
                        })()}
                      </Text>
                      {!editPaletteCondition && (
                        <Text style={[styles.previewText, { color: '#ef4444', fontWeight: '600' }]}>
                          ⚠️ Pénalité palette: +20 minutes
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Section des actions principales */}
            <View style={styles.modalActionsPrimary}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={saveEditedTask}
              >
                <Text style={styles.primaryButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={closeEditModal}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            {/* Section des actions secondaires */}
            <View style={[styles.modalActionsSecondary, isDark && styles.modalActionsSecondaryDark]}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.warningButton, isDark && styles.warningButtonDark]}
                onPress={() => {
                  if (editingTask) {
                    const isHidden = hiddenTasks.has(editingTask.id);
                    if (isHidden) {
                      setHiddenTasks(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(editingTask.id);
                        return newSet;
                      });
                    } else {
                      setHiddenTasks(prev => new Set(prev).add(editingTask.id));
                    }
                    closeEditModal();
                  }
                }}
              >
                <Text style={styles.warningButtonText}>
                  {editingTask && hiddenTasks.has(editingTask.id) ? 'Afficher la tâche' : 'Masquer la tâche'}
                </Text>
              </TouchableOpacity>
              
              {console.log('🔍 [DEBUG] Rendu du bouton "Supprimer la tâche"')}
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: 'red' }]}
                onPress={() => {
                  console.log('🔍 [DEBUG] Bouton "Supprimer la tâche" cliqué');
                  console.log('🔍 [DEBUG] editingTask:', editingTask);
                  
                  if (editingTask) {
                    console.log('🔍 [DEBUG] Ouverture du modal de confirmation');
                    setTaskToDelete(editingTask.id);
                    setShowTaskDeleteConfirmModal(true);
                  } else {
                    console.error('❌ [DEBUG] editingTask est null ou undefined');
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>SUPPRIMER LA TÂCHE</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
        {/* <-- C'est ici qu'il faut insérer le menu */}
      </Modal>

      {/* Interactive Calendar Date Picker for Edit */}
      <DatePickerCalendar
        visible={showEditDatePicker}
        onClose={closeDatePicker}
        onDateSelect={(date) => setEditDate(date)}
        selectedDate={editDate}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 84 * 24 * 60 * 60 * 1000)} // 12 weeks from now
      />

      {/* Edit Time Picker Modal */}
      <Modal
        visible={showEditTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={closeEditTimePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner l'heure de début</Text>
              <TouchableOpacity onPress={closeEditTimePicker}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerPreview}>
              <Text style={styles.timePickerPreviewLabel}>Heure sélectionnée</Text>
              <Text style={styles.timePickerPreviewText}>
                {tempEditHour}:{tempEditMinute}
              </Text>
            </View>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heures</Text>
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={styles.timePickerScrollContent} showsVerticalScrollIndicator={false}>
                  {generateAvailableHours().map((hour) => (
                    <TouchableOpacity
                      key={`edit-hour-${hour}`}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempEditHour === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempEditHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempEditHour === hour && styles.selectedTimeText
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerDivider}>
                <Text style={styles.timePickerDividerText}>:</Text>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={styles.timePickerScrollContent} showsVerticalScrollIndicator={false}>
                  {generateAvailableMinutes().map((minute) => (
                    <TouchableOpacity
                      key={`edit-minute-${minute}`}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempEditMinute === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempEditMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempEditMinute === minute && styles.selectedTimeText
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={closeEditTimePicker}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={() => {
                  setEditStartTime(`${tempEditHour}:${tempEditMinute}`);
                  closeEditTimePicker();
                }}
              >
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        visible={showEditEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeEditEventModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier l'événement</Text>
              <TouchableOpacity onPress={closeEditEventModal}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Titre *</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={editEventTitle}
                onChangeText={setEditEventTitle}
                placeholder="Ex: Réunion équipe"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Date *</Text>
              <TouchableOpacity 
                style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                onPress={openEditEventDatePicker}
              >
                <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                  {editEventDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Heure de début *</Text>
              <TouchableOpacity 
                style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                onPress={() => openEventTimePicker('start')}
              >
                <Clock color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={[styles.dateText, isDark && styles.dateTextDark]}>{editEventStartTime}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Heure de fin *</Text>
              <TouchableOpacity 
                style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                onPress={() => openEventTimePicker('end')}
              >
                <Clock color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={[styles.dateText, isDark && styles.dateTextDark]}>{editEventEndTime}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Lieu</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={editEventLocation}
                onChangeText={setEditEventLocation}
                placeholder="Ex: Salle de réunion"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Type d'événement</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    isDark && styles.typeOptionDark,
                    editEventType === 'meeting' && styles.selectedTypeOption
                  ]}
                  onPress={() => setEditEventType('meeting')}
                >
                  <Text style={[
                    styles.typeOptionText,
                    isDark && styles.typeOptionTextDark,
                    editEventType === 'meeting' && styles.selectedTypeText
                  ]}>
                    Réunion
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    isDark && styles.typeOptionDark,
                    editEventType === 'training' && styles.selectedTypeOption
                  ]}
                  onPress={() => setEditEventType('training')}
                >
                  <Text style={[
                    styles.typeOptionText,
                    isDark && styles.typeOptionTextDark,
                    editEventType === 'training' && styles.selectedTypeText
                  ]}>
                    Formation
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    isDark && styles.typeOptionDark,
                    editEventType === 'inspection' && styles.selectedTypeOption
                  ]}
                  onPress={() => setEditEventType('inspection')}
                >
                  <Text style={[
                    styles.typeOptionText,
                    isDark && styles.typeOptionTextDark,
                    editEventType === 'inspection' && styles.selectedTypeText
                  ]}>
                    Inspection
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={closeEditEventModal}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={saveEditedEvent}
              >
                <Text style={styles.primaryButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Calendar Date Picker for Edit Event */}
      <DatePickerCalendar
        visible={showEditEventDatePicker}
        onClose={closeEditEventDatePicker}
        onDateSelect={(date) => setEditEventDate(date)}
        selectedDate={editEventDate}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 84 * 24 * 60 * 60 * 1000)} // 12 weeks from now
      />

      {/* Edit Event Time Picker Modal */}
      <Modal
        visible={showEditEventTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={closeEventTimePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {timePickerMode === 'start' ? 'Heure de début' : 'Heure de fin'}
              </Text>
              <TouchableOpacity onPress={closeEventTimePicker}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerPreview}>
              <Text style={styles.timePickerPreviewLabel}>Heure sélectionnée</Text>
              <Text style={styles.timePickerPreviewText}>
                {tempEventHour}:{tempEventMinute}
              </Text>
            </View>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heures</Text>
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={styles.timePickerScrollContent} showsVerticalScrollIndicator={false}>
                  {generateAvailableHours().map((hour) => (
                    <TouchableOpacity
                      key={`event-hour-${hour}`}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempEventHour === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempEventHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempEventHour === hour && styles.selectedTimeText
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerDivider}>
                <Text style={styles.timePickerDividerText}>:</Text>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={styles.timePickerScrollContent} showsVerticalScrollIndicator={false}>
                  {generateAvailableMinutes().map((minute) => (
                    <TouchableOpacity
                      key={`event-minute-${minute}`}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempEventMinute === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempEventMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempEventMinute === minute && styles.selectedTimeText
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={closeEventTimePicker}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={() => {
                  const newTime = `${tempEventHour}:${tempEventMinute}`;
                  if (timePickerMode === 'start') {
                    setEditEventStartTime(newTime);
                  } else {
                    setEditEventEndTime(newTime);
                  }
                  closeEventTimePicker();
                }}
              >
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelDeleteEvent}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Supprimer l'événement</Text>
              <TouchableOpacity onPress={cancelDeleteEvent}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalMessage, isDark && styles.modalMessageDark]}>
              Êtes-vous sûr de vouloir supprimer l'événement "{eventToDelete?.title}"?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={cancelDeleteEvent}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={confirmDeleteEvent}
              >
                <Text style={styles.primaryButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Event Time Picker Modal */}
      <Modal
        visible={showAddEventTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddEventTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner l'heure</Text>
              <TouchableOpacity onPress={() => setShowAddEventTimePicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerPreview}>
              <Text style={styles.timePickerPreviewLabel}>Heure sélectionnée</Text>
              <Text style={styles.timePickerPreviewText}>
                {tempAddEventHour}:{tempAddEventMinute}
              </Text>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heures</Text>
                <ScrollView 
                  style={styles.timePickerScroll}
                  contentContainerStyle={styles.timePickerScrollContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={50}
                  decelerationRate="fast"
                >
                  {generateAvailableHours().map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempAddEventHour === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempAddEventHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempAddEventHour === hour && styles.selectedTimeText
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerDivider}>
                <Text style={styles.timePickerDividerText}>:</Text>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <ScrollView 
                  style={styles.timePickerScroll}
                  contentContainerStyle={styles.timePickerScrollContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={50}
                  decelerationRate="fast"
                >
                  {generateAvailableMinutes().map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempAddEventMinute === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempAddEventMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempAddEventMinute === minute && styles.selectedTimeText
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowAddEventTimePicker(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={() => {
                  setEventTime(`${tempAddEventHour}:${tempAddEventMinute}`);
                  setShowAddEventTimePicker(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Employee Selector Modal */}
      <Modal
        visible={showEmployeeSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmployeeSelector(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner les membres de l'équipe</Text>
              <TouchableOpacity onPress={() => setShowEmployeeSelector(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalMessage, isDark && styles.modalMessageDark]}>
                Sélectionnez les employés à assigner à cette tâche. Les employés déjà assignés à d'autres tâches sont grisés.
              </Text>
              
              {/* Debug info */}
              <View style={{ padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Debug: {allEmployees.length} employés trouvés
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Manager ID: {user?.id || 'undefined'}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Loading: {employeesLoading ? 'Oui' : 'Non'}
                </Text>
              </View>
              
              {allEmployees.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Users color="#9ca3af" size={48} strokeWidth={2} />
                  <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                    {employeesLoading ? 'Chargement des employés...' : 'Aucun employé trouvé'}
                  </Text>
                  <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 12, marginTop: 5 }}>
                    Vérifiez que vous avez bien des employés dans votre équipe
                  </Text>
                </View>
              ) : (
                allEmployees.map((employee) => {
                  const isAssigned = editTeamMembers.find(member => member.id === employee.id);
                  const isBusy = assignedEmployeeIds.includes(employee.id);
                  const isCurrentTaskMember = editTeamMembers.find(member => member.id === employee.id);
                  return (
                    <TouchableOpacity
                      key={employee.id}
                      style={[
                        styles.employeeOption,
                        isAssigned && styles.employeeOptionSelected,
                        isBusy && !isCurrentTaskMember && styles.employeeOptionBusy
                      ]}
                      onPress={() => {
                        if (isAssigned) {
                          removeEmployeeFromTeam(employee.id);
                        } else if (!isBusy || isCurrentTaskMember) {
                          addEmployeeToTeam(employee);
                        }
                      }}
                      disabled={isBusy && !isCurrentTaskMember}
                    >
                      <View style={styles.employeeOptionContent}>
                        {employee.avatar_url ? (
                          <Image source={{ uri: employee.avatar_url }} style={styles.employeeOptionAvatar} />
                        ) : (
                          <View style={styles.employeeOptionAvatarPlaceholder}>
                            <Users color="#3b82f6" size={20} strokeWidth={2} />
                          </View>
                        )}
                        <View style={styles.employeeOptionDetails}>
                          <Text style={[
                            styles.employeeOptionName,
                            isAssigned && styles.employeeOptionNameSelected,
                            isBusy && !isCurrentTaskMember && styles.employeeOptionNameBusy
                          ]}>
                            {employee.name}
                          </Text>
                          {employee.role && (
                            <Text style={[
                              styles.employeeOptionRole,
                              isAssigned && styles.employeeOptionRoleSelected,
                              isBusy && !isCurrentTaskMember && styles.employeeOptionRoleBusy
                            ]}>
                              {employee.role}
                            </Text>
                          )}
                        </View>
                        {isAssigned && (
                          <View style={styles.employeeOptionBadge}>
                            <Check color="#ffffff" size={16} strokeWidth={2} />
                          </View>
                        )}
                        {isBusy && !isCurrentTaskMember && (
                          <View style={styles.employeeOptionBusyBadge}>
                            <Clock color="#6b7280" size={16} strokeWidth={2} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowEmployeeSelector(false)}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Smart Reminders Modal */}
      <Modal
        visible={showRemindersModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRemindersModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: remindersModalOpacity }]}> 
          <Animated.View style={[styles.modalContent, { transform: [{ scale: remindersModalScale }] }, isDark && styles.modalContentDark]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rappels intelligents</Text>
              <TouchableOpacity onPress={closeRemindersModal}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {selectedTaskForReminders && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{selectedTaskForReminders.title}</Text>
                <Text style={{ color: '#6b7280', fontSize: 14 }}>
                  {selectedTaskForReminders.start_time} - {selectedTaskForReminders.end_time} | {selectedTaskForReminders.packages} colis | {selectedTaskForReminders.team_size} pers.
                </Text>
                {workloadAnalysis && (
                  <Text style={{ color: '#8b5cf6', fontSize: 13, marginTop: 4 }}>
                    Charge moyenne: {Math.round(workloadAnalysis.averageLoadPerPerson)} colis/pers. | Suggestion équipe: {workloadAnalysis.suggestedTeamSize}
                  </Text>
                )}
              </View>
            )}
            <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{flexGrow:1}}>
              {taskReminders.length === 0 ? (
                <Text style={{ color: '#9ca3af', textAlign: 'center', marginVertical: 24 }}>Aucun rappel intelligent généré pour cette tâche.</Text>
              ) : (
                taskReminders.map(reminder => (
                  <View key={reminder.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: getReminderColor(reminder.type) + '22', borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 22, marginRight: 10 }}>{getReminderIcon(reminder.type)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: getReminderColor(reminder.type) }}>{reminder.message}</Text>
                      <Text style={{ color: '#6b7280', fontSize: 13 }}>À {reminder.reminderTime} le {reminder.reminderDate}</Text>
                      {reminder.type === 'efficiency_alert' && reminder.suggestedTeamSize && (
                        <Text style={{ color: '#f59e0b', fontSize: 12 }}>Suggestion: équipe de {reminder.suggestedTeamSize} personnes</Text>
                      )}
                    </View>
                    <Switch
                      value={reminder.isEnabled}
                      onValueChange={v => toggleReminder(reminder.id, v)}
                      trackColor={{ false: '#ef4444', true: '#10b981' }}
                      thumbColor={reminder.isEnabled ? '#fff' : '#fff'}
                    />
                    <TouchableOpacity onPress={() => deleteReminder(reminder.id)} style={{ marginLeft: 8 }}>
                      <Trash2 color="#ef4444" size={18} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalButton, { marginRight: 8 }]} onPress={regenerateReminders}>
                <Text style={styles.modalButtonText}>Régénérer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]} onPress={closeRemindersModal}>
                <Text style={styles.primaryButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Nouveau Modal de Création d'Événements Récurrents */}
      <Modal
        visible={showRecurringEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('🔍 [DEBUG] Fermeture du modal d\'événement récurrent');
          setShowRecurringEventModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            {/* Header fixe */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Package color="#10b981" size={24} strokeWidth={2} />
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  Nouvel événement récurrent
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowRecurringEventModal(false)}
              >
                <X color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Contenu scrollable */}
            <ScrollView 
              style={styles.modalScrollView} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formContainer}>
                {/* Titre */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    Titre de l'événement *
                  </Text>
                  <TextInput
                    style={[styles.formInput, isDark && styles.formInputDark]}
                    value={recTitle}
                    onChangeText={setRecTitle}
                    placeholder="Ex: Inventaire mensuel"
                    placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                    autoFocus={true}
                  />
                </View>

                {/* Description */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    Description
                  </Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, isDark && styles.formInputDark]}
                    value={recDescription}
                    onChangeText={setRecDescription}
                    placeholder="Description détaillée de l'événement"
                    placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Date et Heure */}
                <View style={styles.formRow}>
                  <View style={[styles.formSection, styles.formSectionHalf]}>
                    <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                      Date de début *
                    </Text>
                    <TouchableOpacity 
                      style={[styles.dateTimeButton, isDark && styles.dateTimeButtonDark]}
                      onPress={() => setShowRecDatePicker(true)}
                    >
                      <CalendarIcon color="#3b82f6" size={18} strokeWidth={2} />
                      <Text style={[styles.dateTimeText, isDark && styles.dateTimeTextDark]}>
                        {recStartDate.toLocaleDateString('fr-FR')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.formSection, styles.formSectionHalf]}>
                    <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                      Heure de début *
                    </Text>
                    <TouchableOpacity 
                      style={[styles.dateTimeButton, isDark && styles.dateTimeButtonDark]}
                      onPress={() => setShowRecTimePicker(true)}
                    >
                      <Clock color="#3b82f6" size={18} strokeWidth={2} />
                      <Text style={[styles.dateTimeText, isDark && styles.dateTimeTextDark]}>
                        {recStartTime || '09:00'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Durée */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    Durée estimée (minutes) *
                  </Text>
                  <TextInput
                    style={[styles.formInput, isDark && styles.formInputDark]}
                    value={recDuration}
                    onChangeText={setRecDuration}
                    placeholder="Ex: 90"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  />
                </View>

                {/* Type de récurrence */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    Type de récurrence *
                  </Text>
                  <View style={styles.recurrenceGrid}>
                    {[
                      { label: 'Quotidien', value: 'daily', icon: '📅' },
                      { label: 'Hebdomadaire', value: 'weekly', icon: '📆' },
                      { label: 'Jours ouvrés', value: 'weekdays', icon: '💼' },
                      { label: 'Personnalisé', value: 'custom', icon: '⚙️' }
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.recurrenceCard,
                          isDark && styles.recurrenceCardDark,
                          recRecurrenceType === option.value && styles.selectedRecurrenceCard
                        ]}
                        onPress={() => setRecRecurrenceType(option.value as any)}
                      >
                        <Text style={styles.recurrenceIcon}>{option.icon}</Text>
                        <Text style={[
                          styles.recurrenceCardText,
                          isDark && styles.recurrenceCardTextDark,
                          recRecurrenceType === option.value && styles.selectedRecurrenceCardText
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Jours personnalisés */}
                {recRecurrenceType === 'custom' && (
                  <View style={styles.formSection}>
                    <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                      Sélectionner les jours
                    </Text>
                    <View style={styles.customDaysContainer}>
                      {[
                        { day: 1, label: 'Lun', name: 'Lundi' },
                        { day: 2, label: 'Mar', name: 'Mardi' },
                        { day: 3, label: 'Mer', name: 'Mercredi' },
                        { day: 4, label: 'Jeu', name: 'Jeudi' },
                        { day: 5, label: 'Ven', name: 'Vendredi' },
                        { day: 6, label: 'Sam', name: 'Samedi' },
                        { day: 7, label: 'Dim', name: 'Dimanche' }
                      ].map(({ day, label, name }) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            isDark && styles.dayButtonDark,
                            recCustomDays.includes(day) && styles.selectedDayButton
                          ]}
                          onPress={() => {
                            if (recCustomDays.includes(day)) {
                              setRecCustomDays(recCustomDays.filter(d => d !== day));
                            } else {
                              setRecCustomDays([...recCustomDays, day]);
                            }
                          }}
                        >
                          <Text style={[
                            styles.dayButtonText,
                            isDark && styles.dayButtonTextDark,
                            recCustomDays.includes(day) && styles.selectedDayButtonText
                          ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Date de fin */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    Date de fin (optionnel)
                  </Text>
                  <TouchableOpacity 
                    style={[styles.dateTimeButton, isDark && styles.dateTimeButtonDark]}
                    onPress={() => setShowRecEndDatePicker(true)}
                  >
                    <CalendarIcon color="#3b82f6" size={18} strokeWidth={2} />
                    <Text style={[styles.dateTimeText, isDark && styles.dateTimeTextDark]}>
                      {recEndDate ? recEndDate.toLocaleDateString('fr-FR') : 'Aucune (illimitée)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Actions fixes */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton, isDark && styles.cancelButtonDark]}
                onPress={() => setShowRecurringEventModal(false)}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton, isDark && styles.createButtonDark]}
                onPress={async () => {
                  console.log('🔍 [DEBUG] ===== DÉBUT CRÉATION ÉVÉNEMENT RÉCURRENT =====');
                  
                  // Validation
                  if (!recTitle.trim()) {
                    console.log('❌ [DEBUG] Titre manquant');
                    Alert.alert('Erreur', 'Veuillez saisir un titre pour l\'événement');
                    return;
                  }
                  
                  if (!recStartTime) {
                    console.log('❌ [DEBUG] Heure de début manquante');
                    Alert.alert('Erreur', 'Veuillez sélectionner une heure de début');
                    return;
                  }
                  
                  if (!recDuration || parseInt(recDuration) <= 0) {
                    console.log('❌ [DEBUG] Durée invalide:', recDuration);
                    Alert.alert('Erreur', 'Veuillez saisir une durée valide');
                    return;
                  }
                  
                  if (recRecurrenceType === 'custom' && recCustomDays.length === 0) {
                    console.log('❌ [DEBUG] Jours personnalisés manquants');
                    Alert.alert('Erreur', 'Veuillez sélectionner au moins un jour pour la récurrence personnalisée');
                    return;
                  }
                  
                  // Construction des données
                  const eventData = {
                    title: recTitle.trim(),
                    description: recDescription.trim(),
                    start_time: recStartTime,
                    duration_minutes: parseInt(recDuration),
                    recurrence_type: recRecurrenceType,
                    recurrence_days: recRecurrenceType === 'custom' ? recCustomDays : undefined,
                    start_date: recStartDate.toISOString().split('T')[0],
                    end_date: recEndDate ? recEndDate.toISOString().split('T')[0] : undefined,
                    manager_id: user?.id || 1,
                    store_id: 1,
                    packages: 0,
                    team_size: 1,
                    manager_section: 'Général',
                    manager_initials: 'GR',
                    palette_condition: true,
                    is_active: true
                  };
                  
                  console.log('🔍 [DEBUG] Données de l\'événement:', eventData);
                  console.log('🔍 [DEBUG] User ID:', user?.id);
                  
                  try {
                    // Vérifier que createEvent est disponible
                    if (typeof createEvent !== 'function') {
                      console.error('❌ [DEBUG] createEvent n\'est pas une fonction:', typeof createEvent);
                      Alert.alert('Erreur', 'Fonction de création non disponible');
                      return;
                    }
                    
                    console.log('🔍 [DEBUG] Appel de createEvent...');
                    const result = await createEvent(eventData);
                    console.log('🔍 [DEBUG] Résultat de createEvent:', result);
                    
                    if (result && result.success) {
                      console.log('✅ [DEBUG] Événement créé avec succès');
                      
                      // Réinitialisation des champs
                      setRecTitle('');
                      setRecDescription('');
                      setRecStartDate(new Date());
                      setRecStartTime('09:00');
                      setRecDuration('60');
                      setRecRecurrenceType('daily');
                      setRecCustomDays([]);
                      setRecEndDate(null);
                      
                      // Fermeture du modal
                      setShowRecurringEventModal(false);
                      
                      // Rechargement des données
                      console.log('🔄 [DEBUG] Rechargement des événements...');
                      await reloadEvents();
                      triggerRefresh();
                      
                      // Sauvegarder la date sélectionnée avant le refresh
                      const selectedDateString = selectedDate.toISOString().split('T')[0];
                      localStorage.setItem('selectedDate', selectedDateString);
                      console.log('💾 [DEBUG] Date sauvegardée:', selectedDateString);
                      
                      // Rechargement forcé de la page après 2 secondes
                      setTimeout(() => {
                        console.log('🔄 [DEBUG] Rechargement forcé de la page après création d\'événement récurrent');
                        window.location.reload();
                      }, 2000);
                      
                      Alert.alert(
                        'Succès', 
                        'Événement récurrent créé avec succès !',
                        [{ text: 'OK' }]
                      );
                    } else {
                      console.error('❌ [DEBUG] Erreur lors de la création:', result?.error);
                      Alert.alert(
                        'Erreur', 
                        result?.error || 'Erreur lors de la création de l\'événement',
                        [{ text: 'OK' }]
                      );
                    }
                  } catch (error) {
                    console.error('❌ [DEBUG] Erreur lors de la création:', error);
                    Alert.alert(
                      'Erreur', 
                      'Une erreur inattendue s\'est produite',
                      [{ text: 'OK' }]
                    );
                  }
                }}
              >
                <Check color="#10b981" size={20} strokeWidth={2} />
                <Text style={[styles.actionButtonText, styles.createButtonText]}>
                  Créer l'événement
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* DatePicker pour la date de début */}
        <DatePickerCalendar
          visible={showRecDatePicker}
          onClose={() => setShowRecDatePicker(false)}
          onDateSelect={setRecStartDate}
          selectedDate={recStartDate}
          minDate={new Date()}
          maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
        />

        {/* DatePicker pour la date de fin */}
        <DatePickerCalendar
          visible={showRecEndDatePicker}
          onClose={() => setShowRecEndDatePicker(false)}
          onDateSelect={setRecEndDate}
          selectedDate={recEndDate || new Date()}
          minDate={recStartDate}
          maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
        />

        {/* TimePicker pour l'heure */}
        <Modal
          visible={showRecTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRecTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  Sélectionner l'heure
                </Text>
                <TouchableOpacity onPress={() => setShowRecTimePicker(false)}>
                  <X color="#6b7280" size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerSection}>
                  <Text style={styles.timePickerLabel}>Heures</Text>
                  <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                    {generateAvailableHours().map((hour) => (
                      <TouchableOpacity
                        key={`rec-hour-${hour}`}
                        style={[
                          styles.timeOption,
                          isDark && styles.timeOptionDark,
                          recStartTime.split(':')[0] === hour && styles.selectedTimeOption
                        ]}
                        onPress={() => setRecStartTime(`${hour}:${recStartTime.split(':')[1] || '00'}`)}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          isDark && styles.timeOptionTextDark,
                          recStartTime.split(':')[0] === hour && styles.selectedTimeText
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.timePickerDivider}>
                  <Text style={styles.timePickerDividerText}>:</Text>
                </View>

                <View style={styles.timePickerSection}>
                  <Text style={styles.timePickerLabel}>Minutes</Text>
                  <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                    {generateAvailableMinutes().map((minute) => (
                      <TouchableOpacity
                        key={`rec-minute-${minute}`}
                        style={[
                          styles.timeOption,
                          isDark && styles.timeOptionDark,
                          recStartTime.split(':')[1] === minute && styles.selectedTimeOption
                        ]}
                        onPress={() => setRecStartTime(`${recStartTime.split(':')[0] || '09'}:${minute}`)}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          isDark && styles.timeOptionTextDark,
                          recStartTime.split(':')[1] === minute && styles.selectedTimeText
                        ]}>
                          {minute}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, isDark && styles.modalButtonDark]}
                  onPress={() => setShowRecTimePicker(false)}
                >
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                  onPress={() => setShowRecTimePicker(false)}
                >
                  <Text style={styles.primaryButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
                Choisissez la tâche pour signaler un retard :
              </Text>
              
              <ScrollView style={styles.taskSelectionList}>
                {tasksForSelectedDate.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskSelectionItem, isDark && styles.taskSelectionItemDark]}
                    onPress={() => handleSelectTaskForDelay(task)}
                  >
                    <View style={[styles.taskSelectionDot, { backgroundColor: '#10b981' }]} />
                    <View style={styles.taskSelectionContent}>
                      <Text style={[styles.taskSelectionTitle, isDark && styles.taskSelectionTitleDark]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskSelectionTime, isDark && styles.taskSelectionTimeDark]}>
                        {task.start_time} - {task.end_time}
                      </Text>
                      <Text style={[styles.taskSelectionType, isDark && styles.taskSelectionTypeDark]}>
                        {task.packages} colis
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {tasksForSelectedDate.length === 0 && (
                  <View style={styles.noTasksContainer}>
                    <Text style={[styles.noTasksText, isDark && styles.noTasksTextDark]}>
                      Aucune tâche trouvée pour cette date.
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

      {/* Modal de saisie du retard */}
      <Modal
        visible={showDelayInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDelayInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Signaler un retard
              </Text>
              <TouchableOpacity onPress={() => setShowDelayInputModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {selectedTaskForDelay && (
                <View style={styles.selectedTaskInfo}>
                  <Text style={[styles.selectedTaskTitle, isDark && styles.selectedTaskTitleDark]}>
                    {selectedTaskForDelay.title}
                  </Text>
                  <Text style={[styles.selectedTaskDetails, isDark && styles.selectedTaskDetailsDark]}>
                    {selectedTaskForDelay.packages} colis • {selectedTaskForDelay.start_time} - {selectedTaskForDelay.end_time}
                  </Text>
                </View>
              )}
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                  Minutes de retard *
                </Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={tempDelayMinutes}
                  onChangeText={setTempDelayMinutes}
                  placeholder="Ex: 15"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                  Raison du retard *
                </Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark, styles.textArea]}
                  value={tempDelayReason}
                  onChangeText={setTempDelayReason}
                  placeholder="Ex: Problème de transport, retard employé..."
                  multiline={true}
                  numberOfLines={3}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowDelayInputModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={handleConfirmDelay}
              >
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation de suppression personnalisé */}
      <Modal
        visible={showTaskDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTaskDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Confirmer la suppression
              </Text>
              <TouchableOpacity onPress={() => setShowTaskDeleteConfirmModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.modalMessage, isDark && styles.modalMessageDark]}>
                Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowTaskDeleteConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.dangerButton, isDark && styles.dangerButtonDark]}
                onPress={() => {
                  console.log('🔍 [DEBUG] Confirmation de suppression pour taskId:', taskToDelete);
                  if (taskToDelete) {
                    handleDeleteTask(taskToDelete);
                  }
                  setShowTaskDeleteConfirmModal(false);
                  setTaskToDelete(null);
                }}
              >
                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de modification d'événement récurrent - Version mobile optimisée */}
      <Modal
        visible={showEditRecurringEventModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeEditRecurringEventModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentMobile, isDark && styles.modalContentMobileDark]}>
            {/* Header avec titre et bouton fermer */}
            <View style={styles.modalHeaderMobile}>
              <Text style={[styles.modalTitleMobile, isDark && styles.modalTitleMobileDark]}>
                Modifier l'événement
              </Text>
              <TouchableOpacity 
                style={styles.closeButtonMobile}
                onPress={closeEditRecurringEventModal}
              >
                <X color={isDark ? "#f4f4f5" : "#374151"} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            {/* Contenu scrollable */}
            <ScrollView 
              style={styles.modalScrollViewMobile} 
              contentContainerStyle={styles.modalScrollContentMobile}
              showsVerticalScrollIndicator={false}
            >
              {/* Section Informations de base */}
              <View style={styles.sectionMobile}>
                <Text style={[styles.sectionTitleMobile, isDark && styles.sectionTitleMobileDark]}>
                  Informations de base
                </Text>
                
                <View style={styles.inputContainerMobile}>
                  <Text style={[styles.inputLabelMobile, isDark && styles.inputLabelMobileDark]}>
                    Titre de l'événement *
                  </Text>
                  <TextInput
                    style={[styles.inputMobile, isDark && styles.inputMobileDark]}
                    value={editRecTitle}
                    onChangeText={setEditRecTitle}
                    placeholder="Ex: Réunion équipe matinale"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  />
                </View>

                <View style={styles.inputContainerMobile}>
                  <Text style={[styles.inputLabelMobile, isDark && styles.inputLabelMobileDark]}>
                    Heure de début *
                  </Text>
                  <TouchableOpacity 
                    style={[styles.selectorMobile, isDark && styles.selectorMobileDark]}
                    onPress={() => setShowEditRecTimePicker(true)}
                  >
                    <Clock color="#3b82f6" size={20} strokeWidth={2} />
                    <Text style={[styles.selectorTextMobile, isDark && styles.selectorTextMobileDark]}>
                      {editRecStartTime || 'Sélectionner une heure'}
                    </Text>
                    <ChevronRight color={isDark ? "#6b7280" : "#9ca3af"} size={20} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainerMobile}>
                  <Text style={[styles.inputLabelMobile, isDark && styles.inputLabelMobileDark]}>
                    Durée (minutes) *
                  </Text>
                  <TextInput
                    style={[styles.inputMobile, isDark && styles.inputMobileDark]}
                    value={editRecDuration}
                    onChangeText={setEditRecDuration}
                    placeholder="60"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  />
                </View>
              </View>

              {/* Section Planification */}
              <View style={styles.sectionMobile}>
                <Text style={[styles.sectionTitleMobile, isDark && styles.sectionTitleMobileDark]}>
                  Planification
                </Text>
                
                <View style={styles.inputContainerMobile}>
                  <Text style={[styles.inputLabelMobile, isDark && styles.inputLabelMobileDark]}>
                    Type de récurrence *
                  </Text>
                  <View style={styles.recurrenceGridMobile}>
                    {[
                      { key: 'daily', label: 'Quotidien', icon: '📅' },
                      { key: 'weekly', label: 'Hebdomadaire', icon: '📆' },
                      { key: 'weekdays', label: 'Jours ouvrables', icon: '💼' },
                      { key: 'custom', label: 'Personnalisé', icon: '⚙️' }
                    ].map(type => (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.recurrenceCardMobile,
                          isDark && styles.recurrenceCardMobileDark,
                          editRecRecurrenceType === type.key && styles.selectedRecurrenceCardMobile
                        ]}
                        onPress={() => setEditRecRecurrenceType(type.key as any)}
                      >
                        <Text style={styles.recurrenceIconMobile}>{type.icon}</Text>
                        <Text style={[
                          styles.recurrenceCardTextMobile,
                          isDark && styles.recurrenceCardTextMobileDark,
                          editRecRecurrenceType === type.key && styles.selectedRecurrenceCardTextMobile
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainerMobile}>
                  <Text style={[styles.inputLabelMobile, isDark && styles.inputLabelMobileDark]}>
                    Date de début *
                  </Text>
                  <TouchableOpacity 
                    style={[styles.selectorMobile, isDark && styles.selectorMobileDark]}
                    onPress={() => setShowEditRecDatePicker(true)}
                  >
                    <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
                    <Text style={[styles.selectorTextMobile, isDark && styles.selectorTextMobileDark]}>
                      {editRecStartDate.toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    <ChevronRight color={isDark ? "#6b7280" : "#9ca3af"} size={20} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainerMobile}>
                  <Text style={[styles.inputLabelMobile, isDark && styles.inputLabelMobileDark]}>
                    Date de fin (optionnel)
                  </Text>
                  <TouchableOpacity 
                    style={[styles.selectorMobile, isDark && styles.selectorMobileDark]}
                    onPress={() => setShowEditRecEndDatePicker(true)}
                  >
                    <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
                    <Text style={[styles.selectorTextMobile, isDark && styles.selectorTextMobileDark]}>
                      {editRecEndDate ? editRecEndDate.toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Aucune date de fin'}
                    </Text>
                    <ChevronRight color={isDark ? "#6b7280" : "#9ca3af"} size={20} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            {/* Actions fixes en bas */}
            <View style={styles.modalActionsMobile}>
              <TouchableOpacity 
                style={[styles.actionButtonMobile, styles.cancelButtonMobile, isDark && styles.cancelButtonMobileDark]}
                onPress={closeEditRecurringEventModal}
              >
                <Text style={styles.cancelButtonTextMobile}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButtonMobile, styles.saveButtonMobile, isDark && styles.saveButtonMobileDark]}
                onPress={saveEditedRecurringEvent}
              >
                <Text style={styles.saveButtonTextMobile}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation de suppression d'événement récurrent */}
      <Modal
        visible={showRecurringEventDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRecurringEventDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Confirmer la suppression
              </Text>
              <TouchableOpacity onPress={() => setShowRecurringEventDeleteConfirmModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.modalMessage, isDark && styles.modalMessageDark]}>
                Êtes-vous sûr de vouloir supprimer l'événement récurrent "{recurringEventToDelete?.title}" ? Cette action est irréversible et supprimera toutes les occurrences futures.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowRecurringEventDeleteConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.dangerButton, isDark && styles.dangerButtonDark]}
                onPress={() => {
                  console.log('🔍 [DEBUG] Bouton "Supprimer" du modal cliqué');
                  handleDeleteRecurringEvent();
                }}
              >
                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DatePickerCalendar pour la modification d'événement récurrent */}
      <DatePickerCalendar
        visible={showEditRecDatePicker}
        onClose={closeEditRecDatePicker}
        onDateSelect={(date) => setEditRecStartDate(date)}
        selectedDate={editRecStartDate}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 an
      />

      <DatePickerCalendar
        visible={showEditRecEndDatePicker}
        onClose={closeEditRecEndDatePicker}
        onDateSelect={(date) => setEditRecEndDate(date)}
        selectedDate={editRecEndDate || new Date()}
        minDate={editRecStartDate}
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 an
      />

      {/* Modal de création de nouvelle tâche */}
      <Modal
        visible={showNewTaskModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Nouvelle tâche
              </Text>
              <TouchableOpacity onPress={() => setShowNewTaskModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Titre de la tâche *</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  placeholder="Ex: Livraison colis urgents"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Nombre de colis *</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={newTaskPackages}
                  onChangeText={setNewTaskPackages}
                  placeholder="Ex: 150"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Date *</Text>
                <TouchableOpacity 
                  style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                  onPress={() => setShowNewTaskDatePicker(true)}
                >
                  <CalendarIcon color="#3b82f6" size={20} strokeWidth={2} />
                  <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                    {newTaskDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Heure de début *</Text>
                <TouchableOpacity 
                  style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                  onPress={() => setShowNewTaskTimePicker(true)}
                >
                  <Clock color="#3b82f6" size={20} strokeWidth={2} />
                  <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                    {newTaskStartTime || 'Sélectionner une heure'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Condition palette</Text>
                <View style={styles.switchContainer}>
                  <Text style={[styles.switchLabel, isDark && styles.switchLabelDark]}>
                    Palette en bon état
                  </Text>
                  <Switch
                    value={newTaskPaletteCondition}
                    onValueChange={setNewTaskPaletteCondition}
                    trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                    thumbColor={newTaskPaletteCondition ? '#ffffff' : '#ffffff'}
                  />
                </View>
                {!newTaskPaletteCondition && (
                  <Text style={styles.delayNote}>
                    ⚠️ Palette endommagée : +20 minutes de pénalité
                  </Text>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowNewTaskModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={createNewTask}
              >
                <Text style={styles.primaryButtonText}>Créer la tâche</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DatePickerCalendar pour la nouvelle tâche */}
      <DatePickerCalendar
        visible={showNewTaskDatePicker}
        onClose={() => setShowNewTaskDatePicker(false)}
        onDateSelect={(date) => setNewTaskDate(date)}
        selectedDate={newTaskDate}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 84 * 24 * 60 * 60 * 1000)} // 12 weeks from now
      />

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
  scrollContent: {
    flexGrow: 1,
    // Ajoute ici alignItems ou justifyContent si tu veux centrer le contenu
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerTitleDark: {
    color: '#f4f4f5',
  },
  workingHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  workingHoursButtonDark: {
    backgroundColor: '#27272a',
  },
  workingHoursText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  workingHoursTextDark: {
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  workingHoursCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  workingHoursCardDark: {
    backgroundColor: '#27272a',
  },
  workingHoursContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workingHoursHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#f4f4f5',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekNavButton: {
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
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  taskCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  weekContainerContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekContainerDark: {
    backgroundColor: '#27272a',
  },
  weekNav: {
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
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  weekLabelDark: {
    color: '#ffffff',
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  selectedDayCard: {
    backgroundColor: '#3b82f6',
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dayNameDark: {
    color: '#f4f4f5',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayNumberDark: {
    color: '#f4f4f5',
  },
  selectedDayText: {
    color: '#ffffff',
  },
  todayText: {
    color: '#10b981',
    fontWeight: '700',
  },
  taskIndicators: {
    position: 'absolute',
    bottom: 4,
    alignItems: 'center',
  },
  taskIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  dateCardDark: {
    backgroundColor: '#27272a',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  dateSummary: {
    alignItems: 'center',
  },
  dateSummaryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardDark: {
    backgroundColor: '#27272a',
  },
  taskIndicatorLine: {
    width: 4,
  },
  taskContent: {
    flex: 1,
    padding: 16,
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
  taskTitleDark: {
    color: '#f4f4f5',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskDetails: {
    gap: 8,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  taskDetailTextDark: {
    color: '#f4f4f5',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  eventCardDark: {
    backgroundColor: '#27272a',
  },
  eventIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  eventTitleDark: {
    color: '#f4f4f5',
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editEventButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteEventButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTimeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  eventTimeTextDark: {
    color: '#f4f4f5',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  eventActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  eventDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  eventDurationDark: {
    color: '#f4f4f5',
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  eventLocationTextDark: {
    color: '#f4f4f5',
  },
  actionCard: {
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
  actionCardDark: {
    backgroundColor: '#27272a',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
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
    height: '85%',
    flexDirection: 'column',
  },
  modalContentDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc même en mode sombre
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalTitleDark: {
    color: '#1a1a1a', // Garder le texte noir même en mode sombre
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerSection: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  timePickerScrollContent: {
    flexGrow: 1,
    // Ajoute ici alignItems ou justifyContent si besoin
  },
  timeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  timeOptionDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc
    borderColor: '#e5e7eb',
  },
  selectedTimeOption: {
    backgroundColor: '#3b82f6',
  },
  timeOptionText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  timeOptionTextDark: {
    color: '#1a1a1a', // Garder le texte noir
  },
  selectedTimeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#1a1a1a', // Garder le texte noir
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
  },
  inputDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc
    color: '#1a1a1a', // Garder le texte noir
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalButtonDark: {
    backgroundColor: '#ffffff', // Fond blanc cohérent
    borderColor: '#e5e7eb',
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#3b82f6',
  },
  primaryButtonDark: {
    backgroundColor: '#ffffff',
    borderColor: '#2563eb',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  dateSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  dateSelectorDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc
    borderColor: '#e5e7eb',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  previewTitleDark: {
    color: '#1a1a1a', // Garder le texte noir
  },
  previewCard: {
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
  previewCardDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc
  },
  previewText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  previewTextDark: {
    color: '#6b7280', // Garder le texte gris
  },


  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  activeLabel: {
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  modalScrollContent: {
    flexGrow: 1,
    // Ajoute ici alignItems ou justifyContent si besoin
  },
  delayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  delayNote: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  typeOptionDark: {
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
  selectedTypeOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  selectedTypeOptionDark: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedTypeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  selectedTypeTextDark: {
    color: '#f4f4f5',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalMessageDark: {
    color: '#f4f4f5',
  },
  timePickerPreview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerPreviewLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  timePickerPreviewText: {
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  timePickerDivider: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerDividerText: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: '700',
  },
  timePickerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  timePickerContent: {
    padding: 20,
  },
  timePickerColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  dangerButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ef4444',
  },
  dangerButtonDark: {
    backgroundColor: '#ffffff',
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerColumnTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 12,
  },
  timePickerScrollView: {
    height: 200,
    width: '100%',
  },
  timePickerItem: {
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: '#3b82f6',
  },
  timePickerItemText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  timePickerItemTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  timePickerSeparator: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerSeparatorText: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: '700',
  },
  teamMembersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamMembersList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeAvatarContainer: {
    marginRight: 4,
  },
  employeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  employeeAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreEmployeesIndicator: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  moreEmployeesText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  assignedEmployeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  assignedEmployeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  assignedEmployeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
  },
  assignedEmployeeAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  assignedEmployeeDetails: {
    flex: 1,
  },
  assignedEmployeeName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  assignedEmployeeRole: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  employeeSelectorButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeSelectorText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  employeeSelectorSubtext: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
  },
  memberAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  principalBadge: {
    backgroundColor: '#10b981',
    borderRadius: 4,
    padding: 4,
    marginLeft: 8,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  bonusBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    padding: 4,
    marginLeft: 8,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noEmployeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  noEmployeeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  noEmployeeSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
  employeeOption: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  employeeOptionSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  employeeOptionBusy: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.6,
  },
  employeeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeOptionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  employeeOptionAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeOptionDetails: {
    flex: 1,
  },
  employeeOptionName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  employeeOptionNameSelected: {
    color: '#ffffff',
  },
  employeeOptionNameBusy: {
    color: '#6b7280',
  },
  employeeOptionRole: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  employeeOptionRoleSelected: {
    color: '#ffffff',
    opacity: 0.9,
  },
  employeeOptionRoleBusy: {
    color: '#9ca3af',
  },
  employeeOptionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeOptionBusyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  pinIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    padding: 2,
  },
  completedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: '#e6fff7',
    borderRadius: 8,
    padding: 2,
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reminderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  delayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#e0f2fe',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#e0f2fe',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  dateDisplayContainerDark: {
    backgroundColor: '#1e293b',
  },
  dateDisplay: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  dateDisplayDark: {
    color: '#60a5fa',
  },
  selectedDate: {
    backgroundColor: '#3b82f6',
  },
  todayDate: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  selectedText: {
    color: '#ffffff',
  },
  // Styles pour le sélecteur de récurrence
  recurrenceSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  recurrenceSelectorDark: {
    // Pas de changement pour le mode sombre
  },
  recurrenceOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    minWidth: 100,
    alignItems: 'center',
  },
  recurrenceOptionDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  selectedRecurrenceOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  recurrenceOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  recurrenceOptionTextDark: {
    color: '#d1d5db',
  },
  selectedRecurrenceOptionText: {
    color: '#ffffff',
  },
  // Nouveaux styles pour le menu refait
  modalScrollView: {
    flex: 1,
    maxHeight: '70%',
  },
  modalScrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  formContainer: {
    gap: 20,
  },
  formSection: {
    gap: 8,
  },
  formSectionHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  formLabelDark: {
    color: '#374151', // Garder le texte noir
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  formInputDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc
    borderColor: '#e5e7eb',
    color: '#1f2937', // Garder le texte noir
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateTimeButtonDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc
    borderColor: '#e5e7eb',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  dateTimeTextDark: {
    color: '#1f2937', // Garder le texte noir
  },
  recurrenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recurrenceCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  recurrenceCardDark: {
    backgroundColor: '#ffffff', // Forcer le fond blanc
    borderColor: '#e5e7eb',
  },
  selectedRecurrenceCard: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  recurrenceIcon: {
    fontSize: 24,
  },
  recurrenceCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  recurrenceCardTextDark: {
    color: '#374151', // Garder le texte noir
  },
  selectedRecurrenceCardText: {
    color: '#10b981',
  },
  customDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  dayButtonDark: {
    backgroundColor: '#f3f4f6', // Garder le fond gris clair
    borderColor: '#e5e7eb',
  },
  selectedDayButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dayButtonTextDark: {
    color: '#374151', // Garder le texte noir
  },
  selectedDayButtonText: {
    color: '#ffffff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    flex: 1,
    minHeight: 44,
    minWidth: 80,
    maxWidth: '48%',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonDark: {
    backgroundColor: '#ffffff', // Fond blanc cohérent
    borderColor: '#e5e7eb',
  },
  createButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  createButtonDark: {
    backgroundColor: '#ffffff', // Fond blanc cohérent
    borderColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  cancelButtonText: {
    color: '#374151',
  },
  createButtonText: {
    color: '#10b981',
  },
  // Styles pour le modal de sélection de tâche
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
  // Styles pour les nouveaux boutons
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleHiddenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  toggleHiddenButtonDark: {
    backgroundColor: '#374151',
  },
  toggleHiddenText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  toggleHiddenTextDark: {
    color: '#f4f4f5',
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonDark: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningButtonDark: {
    backgroundColor: '#78350f',
    borderColor: '#f59e0b',
  },
  warningButtonText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  // Styles pour le modal de saisie du retard
  selectedTaskInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedTaskInfoDark: {
    backgroundColor: '#374151',
  },
  selectedTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedTaskTitleDark: {
    color: '#f4f4f5',
  },
  selectedTaskDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedTaskDetailsDark: {
    color: '#9ca3af',
  },
  // Styles pour le badge des tâches masquées
  hiddenTasksBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  hiddenTasksBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Styles pour la nouvelle disposition des boutons du modal
  modalActionsPrimary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalActionsSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalActionsSecondaryDark: {
    backgroundColor: '#374151',
    borderTopColor: '#52525b',
  },

  // Styles pour le modal mobile optimisé
  modalContentMobile: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    flex: 1,
    overflow: 'hidden',
  },
  modalContentMobileDark: {
    backgroundColor: '#27272a',
  },
  modalHeaderMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitleMobile: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalTitleMobileDark: {
    color: '#f4f4f5',
  },
  closeButtonMobile: {
    padding: 4,
  },
  modalScrollViewMobile: {
    flex: 1,
  },
  modalScrollContentMobile: {
    padding: 20,
    paddingBottom: 100, // Espace pour les boutons fixes
  },
  sectionMobile: {
    marginBottom: 24,
  },
  sectionTitleMobile: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionTitleMobileDark: {
    color: '#f4f4f5',
  },
  inputContainerMobile: {
    marginBottom: 20,
  },
  inputLabelMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputLabelMobileDark: {
    color: '#d4d4d8',
  },
  inputMobile: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputMobileDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
    color: '#f4f4f5',
  },
  selectorMobile: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorMobileDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  selectorTextMobile: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 12,
  },
  selectorTextMobileDark: {
    color: '#f4f4f5',
  },
  recurrenceGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recurrenceCardMobile: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%',
    flex: 1,
  },
  recurrenceCardMobileDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  selectedRecurrenceCardMobile: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  recurrenceIconMobile: {
    fontSize: 24,
    marginBottom: 8,
  },
  recurrenceCardTextMobile: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  recurrenceCardTextMobileDark: {
    color: '#d4d4d8',
  },
  selectedRecurrenceCardTextMobile: {
    color: '#1d4ed8',
  },
  modalActionsMobile: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  modalActionsMobileDark: {
    borderTopColor: '#52525b',
    backgroundColor: '#27272a',
  },
  actionButtonMobile: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonMobile: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonMobileDark: {
    backgroundColor: '#3f3f46',
  },
  saveButtonMobile: {
    backgroundColor: '#3b82f6',
  },
  saveButtonMobileDark: {
    backgroundColor: '#1d4ed8',
  },
  cancelButtonTextMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  cancelButtonTextMobileDark: {
    color: '#d4d4d8',
  },
  saveButtonTextMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});