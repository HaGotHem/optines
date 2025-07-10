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
import { Calendar as CalendarIcon, Clock, Plus, MapPin, Package, Users, Trash2, ChevronLeft, ChevronRight, X, Edit3, Check, Pin, PinOff, Bell, BellOff } from 'lucide-react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { notificationService } from '../../services/NotificationService';
import DatePickerCalendar from '../../components/DatePickerCalendar';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useSupabaseTeam } from '../../hooks/useSupabaseTeam';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledTask } from '../../types/database';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start: '05:00', end: '21:00' });
  const [tempWorkingHours, setTempWorkingHours] = useState<WorkingHours>({ start: '05:00', end: '21:00' });

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
    deleteTask: deleteTaskFromDB,
    getTasksByDate,
    toggleTaskPin,
    toggleTaskComplete
  } = useSupabaseTasks({ 
    managerId: user?.app_metadata?.user_id?.toString() 
  });

  const { 
    members: allEmployees,
    isLoading: employeesLoading 
  } = useSupabaseTeam(user?.app_metadata?.user_id?.toString());

  // Événements en état pour permettre la modification
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'Réunion équipe',
      startTime: '09:00',
      endTime: '10:00',
      duration: '1h',
      location: 'Salle de pause',
      type: 'meeting',
      date: new Date().toISOString().split('T')[0] // Aujourd'hui
    },
    {
      id: 2,
      title: 'Formation sécurité',
      startTime: '16:30',
      endTime: '18:00',
      duration: '1h30',
      location: 'Salle de formation',
      type: 'training',
      date: new Date().toISOString().split('T')[0] // Aujourd'hui
    }
  ]);

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

  // Charger les heures de travail au démarrage
  useEffect(() => {
    const loadWorkingHours = async () => {
      try {
        const savedHours = await AsyncStorage.getItem('workingHours');
        if (savedHours) {
          const hours = JSON.parse(savedHours);
          setWorkingHours(hours);
          setTempWorkingHours(hours);
          console.log('Working hours loaded from AsyncStorage:', hours);
        } else {
          console.log('No working hours found in AsyncStorage, using defaults');
        }
      } catch (error) {
        console.error('Error loading working hours:', error);
      }
    };

    loadWorkingHours();
  }, []);

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

  const deleteTask = async (taskId: string) => {
    // Confirmation visuelle immédiate
    const taskToDelete = scheduledTasks.find(task => task.id === taskId);
    if (!taskToDelete) {
      console.log('Task not found:', taskId);
      return;
    }

    try {
      // Suppression immédiate de l'état local
      const updatedTasks = scheduledTasks.filter(task => task.id !== taskId);
      console.log('Task deleted successfully:', taskId, taskToDelete.title);
      
      // Sauvegarde dans AsyncStorage
      await AsyncStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
      
      // Feedback visuel
      Alert.alert('Succès', `Tâche "${taskToDelete.title}" supprimée`);
    } catch (error) {
      console.error('Error deleting task:', error);
      
              // Restaurer l'état en cas d'erreur
        const tasksString = await AsyncStorage.getItem('scheduledTasks');
        if (tasksString) {
          console.log('Error restoring tasks');
        }
      
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
      const delayMinutes = parseInt(editDelay) || 0;
      const baseTimeSeconds = packages * 40;
      const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
      const delaySeconds = delayMinutes * 60;
      const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds + delaySeconds);
      
      const hours = Math.floor(totalTimeSeconds / 3600);
      const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
      const seconds = totalTimeSeconds % 60;
      const formattedDuration = `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
      
      const newEndTime = calculateEndTime(editStartTime, totalTimeSeconds);

      // Charger les tâches existantes
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      const existingTasks = existingTasksString ? JSON.parse(existingTasksString) : [];

      // Mettre à jour la tâche
      const updatedTasks = existingTasks.map((task: any) => 
        task.id === editingTask.id 
          ? {
              ...task,
              packages: packages,
              date: editDate.toISOString().split('T')[0],
              startTime: editStartTime,
              endTime: newEndTime,
              duration: formattedDuration,
              palette_condition: editPaletteCondition,
              team_members: editTeamMembers.map(member => member.id) // Inclure les IDs des membres (peut être vide)
            }
          : task
      );

      // Sauvegarder les tâches mises à jour
      await AsyncStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
      
      // Mettre à jour l'état local
      setScheduledTasks(updatedTasks);
      
      Alert.alert('Succès', 'Tâche modifiée avec succès');
      closeEditModal();
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
    setEvents([...events, newEvent]);
    
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
  };

  const saveWorkingHours = async () => {
    try {
      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem('workingHours', JSON.stringify(tempWorkingHours));
      
      // Mettre à jour l'état local
      setWorkingHours(tempWorkingHours);
      setShowWorkingHoursModal(false);
      
      Alert.alert('Horaires mis à jour', `Nouvelles heures de travail: ${tempWorkingHours.start} - ${tempWorkingHours.end}`);
      
      console.log('Working hours saved to AsyncStorage:', tempWorkingHours);
    } catch (error) {
      console.error('Error saving working hours:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les heures de travail');
    }
  };

  const getTasksForSelectedDate = () => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const tasksForDate = scheduledTasks.filter(task => task.date === selectedDateString);
    
    // Trier les tâches : épinglées d'abord, puis par heure de début
    return tasksForDate.sort((a, b) => {
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

    const renderRightActions = () => (
      <View style={styles.swipeRightActions}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeDelete]}
          onPress={() => {
            if (task.is_completed) {
              onDelete(task.id);
            } else {
              Alert.alert('Action requise', 'Vous devez d\'abord marquer cette tâche comme terminée avant de pouvoir la supprimer.');
            }
          }}
        >
          <Trash2 color="#fff" size={20} strokeWidth={2} />
          <Text style={styles.swipeActionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    );

    const renderLeftActions = () => (
      <View style={styles.swipeLeftActions}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipePin]}
          onPress={() => togglePinTask(task.id)}
        >
          {task.is_pinned ? (
            <PinOff color="#fff" size={20} strokeWidth={2} />
          ) : (
            <Pin color="#fff" size={20} strokeWidth={2} />
          )}
          <Text style={styles.swipeActionText}>
            {task.is_pinned ? 'Désépingler' : 'Épingler'}
          </Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        rightThreshold={40}
        leftThreshold={40}
      >
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
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Trash2 color="#ef4444" size={16} strokeWidth={2} />
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
      </Swipeable>
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
    const eventToDelete = events.find(event => event.id === eventId);
    if (!eventToDelete) {
      console.log('Event not found:', eventId);
      return;
    }

    // Afficher le modal de confirmation
    setEventToDelete(eventToDelete);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteEvent = () => {
    if (!eventToDelete) return;

    console.log('Confirming deletion of event:', eventToDelete.id, eventToDelete.title);
    
    // Supprimer l'événement de l'état
    const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
    setEvents(updatedEvents);
    
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
    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    console.log('Test delete completed. New events:', updatedEvents);
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
    const updatedEvents = events.map(event => 
      event.id === editingEvent.id 
        ? {
            ...event,
            title: editEventTitle,
            startTime: editEventStartTime,
            endTime: editEventEndTime,
            duration: duration,
            location: editEventLocation,
            type: editEventType,
            date: editEventDate.toISOString().split('T')[0] // Date au format YYYY-MM-DD
          }
        : event
    );
    
    setEvents(updatedEvents);
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
      const existingTasksString = await AsyncStorage.getItem('scheduledTasks');
      const existingTasks = existingTasksString ? JSON.parse(existingTasksString) : [];
      
      const selectedDateString = editDate.toISOString().split('T')[0];
      const tasksOnSameDate = existingTasks.filter((task: any) => task.date === selectedDateString);
      
      const newTaskStart = editStartTime;
      const newTaskEnd = calculateEndTime(editStartTime, (() => {
        const packages = parseInt(editPackages) || 0;
        const delayMinutes = parseInt(editDelay) || 0;
        const baseTimeSeconds = packages * 40;
        const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
        const delaySeconds = delayMinutes * 60;
        return Math.max(0, baseTimeSeconds + palettePenaltySeconds + delaySeconds);
      })());
      
      // Vérifier si l'employé est dans une tâche qui se chevauche
      for (const task of tasksOnSameDate) {
        // Ignorer la tâche en cours d'édition
        if (editingTask && task.id === editingTask.id) {
          continue;
        }
        
        const existingStart = task.start_time;
        const existingEnd = task.end_time;
        
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        // Vérifier si l'employé est dans cette tâche
        const isInTask = task.team_members && task.team_members.includes(employeeId);
        
        // Ne pas considérer les anciennes tâches sans team_members comme des conflits
        // car on ne peut pas savoir qui était assigné et on veut permettre l'assignation
        const isLegacyTask = !task.team_members;
        
        // Vérifier les conflits pour les tâches avec des employés explicitement assignés
        if (hasConflict && isInTask) {
          return true;
        }
        
        // Vérifier si l'employé est simplement assigné à une tâche (même sans conflit temporel)
        // pour éviter qu'il soit assigné à plusieurs tâches
        if (isInTask) {
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
      const updatedTasks = scheduledTasks.map(task => 
        task.id === taskId 
          ? { ...task, is_pinned: !task.is_pinned }
          : task
      );
      setScheduledTasks(updatedTasks);
      await AsyncStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error toggling pin task:', error);
    }
  };

  const toggleCompleteTask = async (taskId: string) => {
    try {
      const updatedTasks = scheduledTasks.map(task => 
        task.id === taskId 
          ? { ...task, is_completed: !task.is_completed }
          : task
      );
      setScheduledTasks(updatedTasks);
      await AsyncStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error toggling complete task:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <ChevronLeft color={isDark ? '#f4f4f5' : '#1a1a1a'} size={28} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Planning Rayon</Text>
          <TouchableOpacity 
            style={[styles.workingHoursButton, isDark && styles.workingHoursButtonDark]}
            onPress={() => setShowWorkingHoursModal(true)}
          >
            <Clock color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
            <Text style={[styles.workingHoursText, isDark && styles.workingHoursTextDark]}>
              {workingHours.start} - {workingHours.end}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Working Hours Display */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.workingHoursCard, isDark && styles.workingHoursCardDark]}
            onPress={() => {
              setTempWorkingHours(workingHours);
              setShowWorkingHoursModal(true);
            }}
          >
            <View style={styles.workingHoursContent}>
              <Clock color="#3b82f6" size={20} strokeWidth={2} />
              <Text style={styles.workingHoursText}>
                Heures de travail: {workingHours.start} - {workingHours.end}
              </Text>
            </View>
            <Text style={styles.workingHoursHint}>Appuyer pour modifier</Text>
          </TouchableOpacity>
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
              <Text style={styles.taskCount}>{tasksForSelectedDate.length} tâche{tasksForSelectedDate.length > 1 ? 's' : ''}</Text>
            </View>

            {tasksForSelectedDate.map((task, index) => (
              <TaskCard
                key={task.id}
                task={{...task, duration: task.duration || '1h'} as ScheduledTask}
                onDelete={deleteTask}
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

          {events
            .sort((a, b) => {
              const timeA = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
              const timeB = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
              return timeA - timeB;
            })
            .map((event) => (
            <View key={event.id} style={[styles.eventCard, isDark && styles.eventCardDark]}>
              <View 
                style={[
                  styles.eventIndicator, 
                  { backgroundColor: getEventColor(event.type) }
                ]} 
              />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventActions}>
                    <TouchableOpacity 
                      style={styles.editEventButton}
                      onPress={() => editEvent(event)}
                      activeOpacity={0.7}
                    >
                      <Edit3 color="#3b82f6" size={16} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteEventButton}
                      onPress={() => deleteEvent(event.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 color="#ef4444" size={16} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.eventTime}>
                  <Clock color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.eventTimeText}>{event.startTime} - {event.endTime}</Text>
                </View>
                <Text style={styles.eventDuration}>Durée: {event.duration}</Text>
                <View style={styles.eventLocation}>
                  <MapPin color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.eventLocationText}>{event.location}</Text>
                </View>
              </View>
            </View>
          ))}
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
            onPress={() => router.push('/(manager-tabs)/calculator')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
              <Package color="#10b981" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Programmer une livraison</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, isDark && styles.actionCardDark]}
            onPress={() => {
              setTempWorkingHours(workingHours);
              setShowWorkingHoursModal(true);
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fffbeb' }]}>
              <Clock color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Modifier les heures de travail</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Working Hours Modal */}
      <Modal
        visible={showWorkingHoursModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkingHoursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Heures de travail</Text>
              <TouchableOpacity onPress={() => setShowWorkingHoursModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heure de début</Text>
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={styles.timePickerScrollContent} showsVerticalScrollIndicator={false}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempWorkingHours.start === time && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempWorkingHours({...tempWorkingHours, start: time})}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempWorkingHours.start === time && styles.selectedTimeText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heure de fin</Text>
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={styles.timePickerScrollContent} showsVerticalScrollIndicator={false}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[
                        styles.timeOption,
                        isDark && styles.timeOptionDark,
                        tempWorkingHours.end === time && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempWorkingHours({...tempWorkingHours, end: time})}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        isDark && styles.timeOptionTextDark,
                        tempWorkingHours.end === time && styles.selectedTimeText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={() => setShowWorkingHoursModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={saveWorkingHours}
              >
                <Text style={styles.primaryButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Retard (minutes)</Text>
                    <View style={styles.delayContainer}>
                      <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        value={editDelay}
                        onChangeText={setEditDelay}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#9ca3af"
                      />
                      <Text style={styles.delayNote}>
                        {editDelay && parseInt(editDelay) > 0 
                          ? `+${editDelay} min de retard` 
                          : 'Aucun retard'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewSection}>
                    <Text style={styles.previewTitle}>Aperçu des modifications</Text>
                    <View style={[styles.previewCard, isDark && styles.previewCardDark]}>
                      <Text style={[styles.previewText, isDark && styles.previewTextDark]}>
                        Nouvelle durée estimée: {(() => {
                          const packages = parseInt(editPackages) || 0;
                          const delayMinutes = parseInt(editDelay) || 0;
                          const baseTimeSeconds = packages * 40;
                          const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
                          const delaySeconds = delayMinutes * 60;
                          const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds + delaySeconds);
                          const hours = Math.floor(totalTimeSeconds / 3600);
                          const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
                          const seconds = totalTimeSeconds % 60;
                          return `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
                        })()}
                      </Text>
                      <Text style={[styles.previewText, isDark && styles.previewTextDark]}>
                        Nouvelle heure de fin: {(() => {
                          const packages = parseInt(editPackages) || 0;
                          const delayMinutes = parseInt(editDelay) || 0;
                          const baseTimeSeconds = packages * 40;
                          const palettePenaltySeconds = editPaletteCondition ? 0 : 20 * 60;
                          const delaySeconds = delayMinutes * 60;
                          const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds + delaySeconds);
                          return calculateEndTime(editStartTime, totalTimeSeconds);
                        })()}
                      </Text>
                      {!editPaletteCondition && (
                        <Text style={[styles.previewText, { color: '#ef4444', fontWeight: '600' }]}>
                          ⚠️ Pénalité palette: +20 minutes
                        </Text>
                      )}
                      {editDelay && parseInt(editDelay) > 0 && (
                        <Text style={[styles.previewText, { color: '#f59e0b', fontWeight: '600' }]}>
                          ⏰ Retard ajouté: +{editDelay} minutes
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]}
                onPress={closeEditModal}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={saveEditedTask}
              >
                <Text style={styles.primaryButtonText}>Sauvegarder</Text>
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
              {allEmployees.map((employee) => {
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
              })}
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
      </SafeAreaView>
    </GestureHandlerRootView>
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
    maxHeight: '80%',
    minHeight: 400,
  },
  modalContentDark: {
    backgroundColor: '#27272a',
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
    color: '#f4f4f5',
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
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
  selectedTimeOption: {
    backgroundColor: '#3b82f6',
  },
  timeOptionText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '500',
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
    color: '#f4f4f5',
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
    backgroundColor: '#18181b',
    color: '#fff',
    borderColor: '#3f3f46',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  modalButtonDark: {
    backgroundColor: '#27272a',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonDark: {
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
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
    color: '#f4f4f5',
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
    backgroundColor: '#27272a',
  },
  previewText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  previewTextDark: {
    color: '#f4f4f5',
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
  // Styles pour le swipe
  swipeRightActions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  swipeLeftActions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  swipeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 8,
  },
  swipeDelete: {
    backgroundColor: '#ef4444',
  },
  swipePin: {
    backgroundColor: '#f59e0b',
  },
  swipeActionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
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
});