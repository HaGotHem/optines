import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Animated,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calculator, Clock, Package, Users, Plus, Minus, TriangleAlert as AlertTriangle, Calendar, X, CheckCircle } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useNotifications } from '../../hooks/useNotifications';
import * as Notifications from 'expo-notifications';
import DatePickerCalendar from '../../components/DatePickerCalendar';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSupabaseEmployees } from '../../hooks/useSupabaseEmployees';
import { useSupabaseBreaks } from '../../hooks/useSupabaseBreaks';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useSupabaseWorkingHours } from '../../hooks/useSupabaseWorkingHours';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTaskRefresh } from '../../contexts/TaskRefreshContext';

interface TeamMember {
  id: number;
  name: string;
  role?: string;
  status?: string;
  rating?: number;
  location?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  shift?: string;
  performance?: number;
  tasksCompleted?: number;
}

interface Task {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration: string;
  date: string;
  packages: number;
  team_size: number;
  manager_section: string;
  manager_initials: string;
  palette_condition: boolean;
  team_members: number[]; // IDs des membres de l'équipe
}

export default function JobCalculatorTab() {
  const { scheduleTaskReminder, sendConflictAlert, sendImmediateNotification } = useNotifications();
  const [packages, setPackages] = useState('');
  const [paletteCondition, setPaletteCondition] = useState(true); // true = good, false = bad
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState('06:00');
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // États pour le nouveau sélecteur d'heure
  const [tempSelectedHour, setTempSelectedHour] = useState('06');
  const [tempSelectedMinute, setTempSelectedMinute] = useState('00');
  const [workingHours, setWorkingHours] = useState({ start: '06:00', end: '21:00' });

  // Hook pour les horaires de travail synchronisés
  const { 
    workingHours: storeWorkingHours, 
    isLoading: workingHoursLoading 
  } = useSupabaseWorkingHours();

  // État pour la popup de conflit
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<{title: string, startTime: string, endTime: string} | null>(null);
  const [allConflicts, setAllConflicts] = useState<Array<{title: string, startTime: string, endTime: string, type?: string}>>([]);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);
  
  // État pour la popup de confirmation de création de tâche
  const [showTaskConfirmationModal, setShowTaskConfirmationModal] = useState(false);
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);
  
  // État pour la popup d'alerte des horaires de travail
  const [showWorkingHoursAlertModal, setShowWorkingHoursAlertModal] = useState(false);
  const [workingHoursAlertData, setWorkingHoursAlertData] = useState<{
    selectedTime: string;
    workingStart: string;
    workingEnd: string;
    endTime?: string;
    isEndTimeInvalid?: boolean;
  } | null>(null);

  // États pour le menu de sélection des employés
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [assignedEmployees, setAssignedEmployees] = useState<TeamMember[]>([]);
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<number[]>([]);

  // Animation pour le modal de date
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Nombre d'employés de l'équipe rayon (basé sur l'équipe définie dans team.tsx)
  const totalEmployees = 4; // Nombre total d'employés dans l'équipe rayon
  const [availableEmployees, setAvailableEmployees] = useState(totalEmployees); // Employés réellement disponibles
  const [totalEmployeesDynamic, setTotalEmployeesDynamic] = useState(totalEmployees); // Nombre total d'employés dynamique

  const [totalColisJour, setTotalColisJour] = useState(0);
  const [colisTraitesJour, setColisTraitesJour] = useState(0);
  const [pourcentageColisTraites, setPourcentageColisTraites] = useState(0);

  const [tasksForSelectedDate, setTasksForSelectedDate] = useState<any[]>([]);

  const [showDevTools, setShowDevTools] = useState(false);

  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // TOUS LES HOOKS DOIVENT ÊTRE APPELÉS ICI, AVANT TOUS LES EARLY RETURNS
  const { isDark } = useTheme();
  const { user, isLoading } = useSupabaseAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  
  // Détermination robuste du managerId
  const managerId = user?.app_metadata?.user_id?.toString() || user?.id?.toString();

  // Hook Supabase pour charger les employés (filtre par section du manager)
  // Si pas de section, charger tous les employés du store
  const employeeFilters = profile?.section 
    ? { section: profile.section } 
    : (profile?.store_id ? { store_id: profile.store_id } : undefined);
  const {
    employees: allEmployees,
    isLoading: employeesLoading
  } = useSupabaseEmployees(employeeFilters);

  // Debug des filtres d'employés
  useEffect(() => {
    console.log('🟦 [DEBUG] Calculator - Employee filters:', {
      profileSection: profile?.section,
      employeeFilters,
      hasFilters: !!employeeFilters
    });
  }, [profile?.section, employeeFilters]);

  // Debug des employés chargés
  useEffect(() => {
    console.log('🟦 [DEBUG] Calculator - Employees state changed:', {
      profileSection: profile?.section,
      profileId: profile?.id,
      profileName: profile?.full_name,
      allEmployees: allEmployees ? allEmployees.length : 'null/undefined',
      employeesLoading,
      employees: allEmployees ? allEmployees.map(e => ({id: e.id, name: e.name, role: e.role, section: e.section})) : 'null/undefined'
    });
  }, [allEmployees, employeesLoading, profile?.section, profile?.id, profile?.full_name]);

  // Recalculer le temps quand l'équipe change
  useEffect(() => {
    console.log('🔄 Équipe changée, recalcul du temps...', {
      teamSize: teamMembers.length,
      teamMembers: teamMembers.map(m => m.name)
    });
    
    // Le calcul se fait automatiquement via timeCalculation qui dépend de teamMembers
  }, [teamMembers]);

  // Charger les horaires de travail depuis Supabase
  useEffect(() => {
    if (storeWorkingHours) {
      const hours = { start: storeWorkingHours.start_time, end: storeWorkingHours.end_time };
      setWorkingHours(hours);
      console.log('✅ Horaires de travail synchronisés depuis Supabase:', hours);
    }
  }, [storeWorkingHours]);

  // Hook Supabase pour gérer les tâches - TOUJOURS APPELÉ
  const {
    tasks: supabaseTasks,
    isLoading: tasksLoading,
    createTask,
    deleteTask,
    toggleTaskComplete,
    getTasksByDate,
    getPackagesProgress
  } = useSupabaseTasks({
    managerId: managerId
  });
  
  // Hook pour gérer les pauses des employés - filtrer uniquement par les employés de l'équipe
  const { breaks: employeeBreaks, calculateOverlappingBreaksDuration } = useSupabaseBreaks({
    date: selectedDate.toISOString().split('T')[0],
    team_member_ids: allEmployees.map(emp => emp.id) // Filtrer uniquement les employés de l'équipe
  });
  
  const { triggerRefresh } = useTaskRefresh();

  // FONCTIONS UTILITAIRES - DOIVENT ÊTRE DÉFINIES AVANT LES USEEFFECT
  const loadTotalEmployees = async () => {
    // Le nombre total d'employés est maintenant fourni par useSupabaseEmployees
    // via allEmployees.length
    if (allEmployees && allEmployees.length > 0) {
      setTotalEmployeesDynamic(allEmployees.length);
    }
  };

  const loadWorkingHours = async () => {
    try {
      const savedHours = await AsyncStorage.getItem('workingHours');
      console.log('Loading working hours from AsyncStorage:', savedHours);
      
      if (savedHours) {
        const newWorkingHours = JSON.parse(savedHours);
        console.log('Setting new working hours:', newWorkingHours);
        setWorkingHours(newWorkingHours);
    
        // Vérifier si l'heure sélectionnée actuellement est dans la plage des nouvelles heures de travail
        const currentStartMinutes = parseInt(selectedStartTime.split(':')[0]) * 60 + parseInt(selectedStartTime.split(':')[1]);
        const newStartMinutes = parseInt(newWorkingHours.start.split(':')[0]) * 60 + parseInt(newWorkingHours.start.split(':')[1]);
        const newEndMinutes = parseInt(newWorkingHours.end.split(':')[0]) * 60 + parseInt(newWorkingHours.end.split(':')[1]);
        
        console.log('Time validation:', {
          currentStartTime: selectedStartTime,
          currentStartMinutes,
          newStartMinutes,
          newEndMinutes,
          isInRange: currentStartMinutes >= newStartMinutes && currentStartMinutes <= newEndMinutes
        });
        
        // Ne plus réinitialiser automatiquement l'heure pour permettre l'affichage de la notification
        // La notification s'affichera automatiquement via le useEffect qui surveille selectedStartTime et workingHours
      } else {
        console.log('No working hours found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading working hours:', error);
    }
  };

  // Fonctions de calcul du temps - DOIVENT ÊTRE AVANT calculateAvailableEmployees
  const calculateWorkTime = () => {
      const packageCount = parseInt(packages) || 0;
    
    // Base time: 40 seconds per package
      const baseTimeSeconds = packageCount * 40;
    
    // Palette condition penalty: 20 minutes if bad condition
      const palettePenaltySeconds = paletteCondition ? 0 : 20 * 60;
    
    // Team efficiency: each additional member saves 30 minutes (1800 seconds)
      const additionalMembers = teamMembers.length - 1;
      const teamBonusSeconds = additionalMembers * 30 * 60;
    
    // Calculate base total time
      const baseTotalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds - teamBonusSeconds);
    
    // Calculate breaks impact for each team member
    let totalBreaksImpact = 0;
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const taskEndTime = calculateEndTime(selectedStartTime, baseTotalTimeSeconds);
    
    teamMembers.forEach(member => {
      const breaksImpact = calculateOverlappingBreaksDuration(
        selectedStartTime, 
        taskEndTime, 
        member.id, 
        selectedDateString
      );
      totalBreaksImpact += breaksImpact;
    });
    
    // Add breaks impact to total time
    const totalTimeSeconds = baseTotalTimeSeconds + totalBreaksImpact;
    
    // Convert to hours and minutes
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    const seconds = totalTimeSeconds % 60;
    
    return {
      baseTime: baseTimeSeconds,
      palettePenalty: palettePenaltySeconds,
      teamBonus: teamBonusSeconds,
      breaksImpact: totalBreaksImpact,
      totalTime: totalTimeSeconds,
      hours,
      minutes,
      seconds,
      formattedTime: `${hours}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`
    };
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

  const formatEndTimeForDisplay = (startTime: string, durationSeconds: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
    
    return endDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeCalculation = calculateWorkTime();

  const calculateAvailableEmployees = async () => {
    try {
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      
      // Utiliser les tâches de Supabase au lieu d'AsyncStorage
      const tasksOnSameDate = await getTasksByDate(selectedDateString);
      
      // ✅ CORRECTION : Calculer le nombre d'employés déjà assignés à des tâches NON TERMINÉES uniquement
      let assignedEmployees = 0;
      
      const newTaskStart = selectedStartTime;
      const newTaskEnd = calculateEndTime(selectedStartTime, timeCalculation.totalTime);
      
      tasksOnSameDate.forEach((task: any) => {
        // ✅ CORRECTION : Ignorer les tâches terminées
        if (task.is_completed) {
          console.log('⏭️ Skipping completed task:', task.title);
          return; // Ne pas compter les employés des tâches terminées
        }
        
        // Pour les nouvelles tâches avec team_members, compter les employés explicitement assignés
        if (task.team_members && task.team_members.length > 0) {
          assignedEmployees += task.team_members.length;
          console.log(`➕ Counting ${task.team_members.length} employees from active task: ${task.title}`);
    } else {
          // Pour les anciennes tâches sans team_members, ne pas les compter
          console.log('⏭️ Skipping legacy task without team_members:', task.title);
        }
      });
      
      // Calculer les employés disponibles
      const available = Math.max(0, totalEmployeesDynamic - assignedEmployees);
      console.log('📊 Available employees calculation:', {
        totalEmployeesDynamic,
        assignedEmployees,
        available,
        tasksOnSameDate: tasksOnSameDate.length,
        completedTasks: tasksOnSameDate.filter(t => t.is_completed).length,
        activeTasks: tasksOnSameDate.filter(t => !t.is_completed).length
      });
      
      setAvailableEmployees(available);
    } catch (error) {
      console.error('Error calculating available employees:', error);
      setAvailableEmployees(totalEmployeesDynamic);
    }
  };

  const calculerStatsColis = async () => {
    try {
      console.log('🔍 CalculerStatsColis - Début du calcul (Supabase)');
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      console.log('📅 Date sélectionnée:', selectedDateString);
      
      // Utiliser la fonction optimisée du hook pour calculer les colis traités
      const packagesProgress = getPackagesProgress(selectedDateString);
      console.log('📦 Progression des colis calculée:', packagesProgress);
      
      console.log('📊 Résultats calcul:', { 
        total: packagesProgress.totalPackages, 
        traites: packagesProgress.treatedPackages, 
        pourcentage: packagesProgress.progressPercentage 
      });
      console.log(`📦 Colis traités: ${packagesProgress.treatedPackages}/${packagesProgress.totalPackages} (${packagesProgress.progressPercentage}%)`);
      
      setTotalColisJour(packagesProgress.totalPackages);
      setColisTraitesJour(packagesProgress.treatedPackages);
      setPourcentageColisTraites(packagesProgress.progressPercentage);
    } catch (e) {
      console.error('❌ Erreur dans calculerStatsColis:', e);
      setTotalColisJour(0);
      setColisTraitesJour(0);
      setPourcentageColisTraites(0);
    }
  };

  const resetForm = () => {
    setPackages('');
    setPaletteCondition(true);
    setTeamMembers([]);
    setSelectedStartTime('06:00');
    setShowTaskModal(false);
    setShowTimePicker(false);
    setShowConflictAlert(false);
    setConflictMessage('');
    setShowConflictModal(false);
    setConflictDetails(null);
    setAllConflicts([]);
    setPendingTask(null);
    setShowEmployeeSelector(false);
    setAssignedEmployees([]);
    setAssignedEmployeeIds([]);
    setTempSelectedHour('06');
    setTempSelectedMinute('00');
    setShowEndDatePicker(false);
    setEndDate(null);
  };
        
  // TOUS LES USEEFFECT APRÈS LES FONCTIONS
  // Debug : log du user et du managerId
  useEffect(() => {
    console.log('🟦 [DEBUG] Calculator - user:', user);
    console.log('🟦 [DEBUG] Calculator - managerId:', managerId);
  }, [user, managerId]);

  // Redirection automatique si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (isLoading) return; // Ne rien faire tant que le chargement est en cours
    if (!user) {
      router.replace('/login?userType=manager');
    }
  }, [isLoading, user]);

  // Charger le nombre total d'employés depuis AsyncStorage
  useEffect(() => {
    loadTotalEmployees();
    // Ajout : calculer les stats au chargement initial
    calculerStatsColis();
  }, []);

  // Recalculer les stats de colis quand les tâches changent
  useEffect(() => {
    if (!tasksLoading && supabaseTasks) {
      console.log('🔄 [CALCULATOR] Tâches changées, recalcul des stats de colis...');
      calculerStatsColis();
    }
  }, [tasksLoading, supabaseTasks]);

  // Rafraîchissement automatique des statistiques de colis toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ [CALCULATOR] Rafraîchissement automatique des stats de colis...');
      calculerStatsColis();
    }, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, []);

  // Charger les heures de travail au montage du composant
  useEffect(() => {
    loadWorkingHours();
  }, []);

  // Recalculer les employés disponibles quand les heures de travail changent
  useEffect(() => {
    calculateAvailableEmployees();
  }, [workingHours]);

  // Mettre à jour les employés disponibles quand le nombre total change
  useEffect(() => {
    calculateAvailableEmployees();
  }, [totalEmployeesDynamic]);

  // Mettre à jour le nombre total d'employés quand allEmployees change
  useEffect(() => {
    if (allEmployees && allEmployees.length > 0) {
      setTotalEmployeesDynamic(allEmployees.length);
      console.log('🔄 [CALCULATOR] Nombre total d\'employés mis à jour:', allEmployees.length);
    }
  }, [allEmployees]);

  // Générer les créneaux horaires selon les heures de travail
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return slots;
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

  // Générer les minutes disponibles
  const generateAvailableMinutes = () => {
    const minutes = ['00', '10', '20', '30', '40', '50'];
    
    // Si l'heure sélectionnée est l'heure de fin, limiter les minutes
    if (tempSelectedHour === workingHours.end.split(':')[0]) {
      const endMinute = parseInt(workingHours.end.split(':')[1]);
      const availableMinutes = minutes.filter(minute => parseInt(minute) <= endMinute);
      console.log('Limited minutes for end hour:', availableMinutes);
      return availableMinutes;
    }
    
    return minutes;
  };

  // Manager information (récupérée depuis le profil utilisateur)
  const currentManager = {
    name: profile?.full_name || 'Utilisateur',
    section: profile?.section || 'Section inconnue',
    initials: profile?.full_name 
      ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() 
      : 'XX'
  };

  const addTeamMember = () => {
    const currentTeamSize = teamMembers.length;
    const remainingEmployees = availableEmployees - currentTeamSize;
    
    if (remainingEmployees > 0) {
      const newId = Math.max(...teamMembers.map(m => m.id)) + 1;
      setTeamMembers([...teamMembers, { id: newId, name: `Membre ${newId}` }]);
    } else {
      Alert.alert('Limite atteinte', `Tous les ${availableEmployees} employés disponibles sont déjà affectés à cette tâche`);
    }
  };

  const removeTeamMember = (id: number) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  // Ajouter un employé à l'équipe
  const addEmployeeToTeam = (employee: TeamMember) => {
    // Vérifier si l'employé est déjà occupé
    if (assignedEmployeeIds.includes(employee.id)) {
      console.log(`Cannot add employee ${employee.name} - already assigned to another task`);
      return;
    }
    
    if (!teamMembers.find(member => member.id === employee.id)) {
      const newTeamMembers = [...teamMembers, employee];
      setTeamMembers(newTeamMembers);
      
      console.log(`✅ Employé ${employee.name} ajouté à l'équipe. Nouvelle taille: ${newTeamMembers.length}`);
      
      // Recalculer le temps et l'heure de fin
      setTimeout(() => {
        const newTimeCalculation = calculateWorkTime();
        console.log('🕐 Nouveau calcul du temps:', {
          teamSize: newTeamMembers.length,
          totalTime: newTimeCalculation.totalTime,
          formattedTime: newTimeCalculation.formattedTime,
          endTime: calculateEndTime(selectedStartTime, newTimeCalculation.totalTime)
        });
      }, 100);
      
      // Rafraîchir la liste des employés disponibles
      if (showEmployeeSelector) {
        setTimeout(() => loadAssignedEmployees(), 100);
      }
    }
  };

  // Supprimer un employé de l'équipe
  const removeEmployeeFromTeam = (employeeId: number) => {
    const employeeToRemove = teamMembers.find(member => member.id === employeeId);
    const newTeamMembers = teamMembers.filter(member => member.id !== employeeId);
    setTeamMembers(newTeamMembers);
    
    if (employeeToRemove) {
      console.log(`❌ Employé ${employeeToRemove.name} retiré de l'équipe. Nouvelle taille: ${newTeamMembers.length}`);
      
      // Recalculer le temps et l'heure de fin
      setTimeout(() => {
        const newTimeCalculation = calculateWorkTime();
        console.log('🕐 Nouveau calcul du temps:', {
          teamSize: newTeamMembers.length,
          totalTime: newTimeCalculation.totalTime,
          formattedTime: newTimeCalculation.formattedTime,
          endTime: calculateEndTime(selectedStartTime, newTimeCalculation.totalTime)
        });
      }, 100);
    }
    
    // Rafraîchir la liste des employés disponibles
    if (showEmployeeSelector) {
      setTimeout(() => loadAssignedEmployees(), 100);
    }
  };

  // Ouvrir le sélecteur d'employés
  const openEmployeeSelector = () => {
    setShowEmployeeSelector(true);
    loadAssignedEmployees();
  };

  // Charger les employés déjà assignés
  const loadAssignedEmployees = async () => {
    try {
      const assignedIds: number[] = [];
      const currentTeamIds = teamMembers.map(member => member.id);
      
      console.log('👥 Calculator - Loading assigned employees:', {
        currentTeamIds,
        allEmployeesCount: allEmployees ? allEmployees.length : 'null/undefined',
        allEmployees: allEmployees ? allEmployees.map(e => ({id: e.id, name: e.name})) : 'null/undefined',
        employeesLoading
      });
      
      if (allEmployees && allEmployees.length > 0) {
        for (const employee of allEmployees) {
          // Ne jamais considérer comme occupé si l'employé est déjà dans l'équipe actuelle
          if (currentTeamIds.includes(employee.id)) {
            console.log(`Employee ${employee.name} (${employee.id}) is in current team, skipping`);
            continue;
          }
          
          const isAssigned = await isEmployeeAssigned(employee.id);
          console.log(`Employee ${employee.name} (${employee.id}) is assigned:`, isAssigned);
          
          if (isAssigned) {
            assignedIds.push(employee.id);
          }
        }
      } else {
        console.log('👥 Calculator - No employees available for assignment check');
      }
      
      console.log('Final assigned employee IDs:', assignedIds);
      setAssignedEmployeeIds(assignedIds);
    } catch (error) {
      console.error('Error loading assigned employees:', error);
    }
  };

  const getTimeColor = (totalSeconds: number) => {
    const hours = totalSeconds / 3600;
    if (hours <= 2) return '#10b981'; // green - excellent
    if (hours <= 4) return '#3b82f6'; // blue - good
    if (hours <= 6) return '#f59e0b'; // orange - warning
    return '#ef4444'; // red - critical
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction pour trier les événements chronologiquement
  const sortEventsChronologically = (events: Array<{title: string, startTime: string, endTime: string, type?: string}>) => {
    return events.sort((a, b) => {
      const timeA = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
      const timeB = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
      return timeA - timeB;
    });
  };

  const checkPlanningConflicts = async () => {
    try {
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      const tasksOnSameDate = await getTasksByDate(selectedDateString);
      
      // Événements fixes (réunions, formations, etc.)
      const fixedEvents = [
        {
          title: 'Réunion équipe',
          startTime: '09:00',
          endTime: '10:00',
          type: 'meeting'
        },
        {
          title: 'Formation sécurité',
          startTime: '16:30',
          endTime: '18:00',
          type: 'training'
        }
      ];
      
      const newTaskStart = selectedStartTime;
      const newTaskEnd = calculateEndTime(selectedStartTime, timeCalculation.totalTime);
      
      console.log('Checking conflicts for:', {
        newTaskStart,
        newTaskEnd,
        existingTasks: tasksOnSameDate.map((t: any) => ({ title: t.title, start: t.start_time, end: t.end_time })),
        fixedEvents: fixedEvents.map((e: any) => ({ title: e.title, start: e.startTime, end: e.endTime }))
      });
      
      // Vérifier les conflits avec les tâches planifiées
      const taskConflicts = tasksOnSameDate.filter((task: any) => {
        const existingStart = task.start_time;
        const existingEnd = task.end_time;
        
        // Convertir les heures en minutes pour faciliter la comparaison
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        // Vérifier si les plages horaires se chevauchent
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        console.log('Task conflict check:', {
          task: task.title,
          existingStart: existingStart,
          existingEnd: existingEnd,
          newStart: newTaskStart,
          newEnd: newTaskEnd,
          hasConflict
        });
        
        return hasConflict;
      }).map((task: any) => ({
        title: task.title,
        startTime: task.start_time,
        endTime: task.end_time,
        type: 'task'
      }));
      
      // Vérifier les conflits avec les événements fixes
      const eventConflicts = fixedEvents.filter((event: any) => {
        const existingStart = event.startTime;
        const existingEnd = event.endTime;
        
        // Convertir les heures en minutes pour faciliter la comparaison
        const newStartMinutes = parseInt(newTaskStart.split(':')[0]) * 60 + parseInt(newTaskStart.split(':')[1]);
        const newEndMinutes = parseInt(newTaskEnd.split(':')[0]) * 60 + parseInt(newTaskEnd.split(':')[1]);
        const existingStartMinutes = parseInt(existingStart.split(':')[0]) * 60 + parseInt(existingStart.split(':')[1]);
        const existingEndMinutes = parseInt(existingEnd.split(':')[0]) * 60 + parseInt(existingEnd.split(':')[1]);
        
        // Vérifier si les plages horaires se chevauchent
        const hasConflict = (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        );
        
        console.log('Event conflict check:', {
          event: event.title,
          existingStart: existingStart,
          existingEnd: existingEnd,
          newStart: newTaskStart,
          newEnd: newTaskEnd,
          hasConflict
        });
        
        return hasConflict;
      }).map((event: any) => ({
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type
      }));
      
      // Combiner et trier tous les conflits chronologiquement
      const allConflictsFound = sortEventsChronologically([...taskConflicts, ...eventConflicts]);
      
      if (allConflictsFound.length > 0) {
        setAllConflicts(allConflictsFound);
        // Garder le premier conflit pour la compatibilité avec l'interface existante
        setConflictDetails({
          title: allConflictsFound[0].title,
          startTime: allConflictsFound[0].startTime,
          endTime: allConflictsFound[0].endTime
        });
        setShowConflictModal(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return false;
    }
  };

  const startTask = async () => {
    if (!packages || parseInt(packages) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de colis valide');
      return;
    }

    if (availableEmployees === 0) {
      Alert.alert('Erreur', 'Aucun employé disponible pour cette plage horaire. Tous les employés sont déjà assignés à d\'autres tâches qui se chevauchent.');
      return;
    }

    if (teamMembers.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un membre d\'équipe à la tâche');
      return;
    }

    // Vérifier qu'aucun employé occupé n'est dans l'équipe
    const occupiedEmployees = teamMembers.filter(member => assignedEmployeeIds.includes(member.id));
    if (occupiedEmployees.length > 0) {
      const occupiedNames = occupiedEmployees.map(emp => emp.name).join(', ');
      Alert.alert(
        'Employés occupés', 
        `Les employés suivants sont déjà assignés à d'autres tâches : ${occupiedNames}. Veuillez les retirer de l'équipe.`
      );
      return;
    }

    // Validation des heures de travail
    const taskStartMinutes = parseInt(selectedStartTime.split(':')[0]) * 60 + parseInt(selectedStartTime.split(':')[1]);
    const workingStartMinutes = parseInt(workingHours.start.split(':')[0]) * 60 + parseInt(workingHours.start.split(':')[1]);
    const workingEndMinutes = parseInt(workingHours.end.split(':')[0]) * 60 + parseInt(workingHours.end.split(':')[1]);
    
    // Calculer l'heure de fin de la tâche
    const endTime = calculateEndTime(selectedStartTime, timeCalculation.totalTime);
    const taskEndMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    
    // Vérifier si le début OU la fin de la tâche est hors des heures de travail
    const isStartTimeInvalid = taskStartMinutes < workingStartMinutes || taskStartMinutes > workingEndMinutes;
    const isEndTimeInvalid = taskEndMinutes > workingEndMinutes;
    
    if (isStartTimeInvalid || isEndTimeInvalid) {
      // Afficher la popup d'alerte des horaires de travail
      setWorkingHoursAlertData({
        selectedTime: selectedStartTime,
        workingStart: workingHours.start,
        workingEnd: workingHours.end,
        endTime: endTime,
        isEndTimeInvalid: isEndTimeInvalid
      });
      setShowWorkingHoursAlertModal(true);
      return;
    }

    // Log de débogage pour la date
    console.log('📅 Date sélectionnée:', selectedDate);
    console.log('📅 Date formatée:', selectedDate.toISOString().split('T')[0]);
    console.log('📦 Nombre de colis:', packages);
    
    const task: Task = {
      id: Date.now().toString(),
      title: `${currentManager.section} - ${currentManager.initials}`,
      start_time: selectedStartTime,
      end_time: endTime,
      duration: timeCalculation.formattedTime,
      date: selectedDate.toISOString().split('T')[0],
      packages: parseInt(packages),
      team_size: teamMembers.length,
      manager_section: currentManager.section,
      manager_initials: currentManager.initials,
      palette_condition: paletteCondition,
      team_members: teamMembers.map(member => member.id)
    };
    
    console.log('🎯 Tâche créée:', task);

    // Vérifier les conflits de planning (mais ne pas bloquer)
    console.log('🔍 Vérification des conflits...');
    const hasConflict = await checkPlanningConflicts();
    console.log('⚠️ Conflit détecté:', hasConflict);
    
    if (hasConflict) {
      console.log('🚫 Tâche mise en attente à cause d\'un conflit');
      // Envoyer une notification d'alerte de conflit
      await sendConflictAlert({
        title: task.title,
        conflicts: allConflicts,
      });
      
      // Stocker la tâche en attente et afficher la popup de conflit
      setPendingTask(task);
      return;
    }

    console.log('✅ Pas de conflit, affichage de la popup de confirmation...');
    // Pas de conflit, afficher la popup de confirmation
    setTaskToConfirm(task);
    setShowTaskConfirmationModal(true);
  };

  const saveTask = async (task: Task) => {
    try {
      console.log('💾 SaveTask - Début de sauvegarde:', task);
      console.log('💾 SaveTask - managerId:', managerId);
      console.log('💾 SaveTask - createTask function:', typeof createTask);
      
      if (!managerId) {
        throw new Error('Manager ID manquant - impossible de sauvegarder la tâche');
      }

      if (!createTask) {
        throw new Error('Fonction createTask non disponible - hook Supabase non initialisé');
      }

      const taskData = {
        title: task.title,
        description: `${task.packages} colis`,
        start_time: task.start_time,
        end_time: task.end_time,
        date: task.date,
        packages: task.packages,
        team_size: task.team_size,
        manager_section: task.manager_section,
        manager_initials: task.manager_initials,
        palette_condition: task.palette_condition,
        manager_id: managerId, // ID du manager qui créé la tâche
        team_members: task.team_members
      };

      console.log('💾 SaveTask - Données à sauvegarder:', taskData);
      
      // Sauvegarder la tâche dans Supabase
      const result = await createTask(taskData);

      console.log('💾 SaveTask - Résultat de createTask:', result);

      if (!result || !result.success) {
        throw new Error(result?.error || 'Erreur lors de la sauvegarde - résultat invalide');
      }

      console.log('✅ Tâche sauvegardée dans Supabase avec succès:', result.task);

      // Envoyer une notification de confirmation
      await sendImmediateNotification(
        '✅ Tâche créée avec succès',
        `${task.title} - ${task.packages} colis - ${task.team_size} employé${task.team_size > 1 ? 's' : ''} - ${task.duration}`,
        { 
          type: 'task_created', 
          taskId: result.task.id,
          taskTitle: task.title,
          packages: task.packages,
          teamSize: task.team_size,
          duration: task.duration
        }
      );

      // Programmer un rappel de notification pour cette tâche
      await scheduleTaskReminder(task);

      // Afficher le modal de succès
      setShowTaskModal(true);
      
      // Recalculer immédiatement les employés disponibles après avoir ajouté la tâche
      calculateAvailableEmployees();
      
      // Recalculer immédiatement les stats de colis
      console.log('🔄 Recalcul immédiat des stats après sauvegarde');
      calculerStatsColis();
      
      // Forcer le rechargement des tâches
      setTimeout(() => {
        console.log('🔄 Rechargement forcé des tâches');
        loadTasksForSelectedDate();
        // Recalculer les stats après le rechargement des tâches
        calculerStatsColis();
      }, 300);
      
      // Déclencher un rafraîchissement global pour mettre à jour l'index manager
      setTimeout(() => {
        console.log('🔄 Déclenchement du rafraîchissement global pour l\'index manager');
        triggerRefresh();
        // Recalculer les stats une dernière fois après le refresh global
        calculerStatsColis();
      }, 800);
      
    } catch (error) {
      console.error('❌ Error saving task:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : 'Pas de stack trace',
        managerId,
        createTaskAvailable: !!createTask
      });
      Alert.alert('Erreur', `Impossible de sauvegarder la tâche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const goToCalendar = () => {
    setShowTaskModal(false);
    router.push('/(manager-tabs)/calendar');
  };

  const confirmTaskWithConflict = async () => {
    if (pendingTask) {
      await saveTask(pendingTask);
      setShowConflictModal(false);
      setPendingTask(null);
      setConflictDetails(null);
      setAllConflicts([]);
      // Recalculer les stats après confirmation de tâche avec conflit
      setTimeout(() => {
        console.log('🔄 Recalcul des stats après confirmation de tâche avec conflit');
        calculerStatsColis();
      }, 500);
      // Nettoyer le formulaire après avoir confirmé la tâche avec conflit
      resetForm();
    }
  };

  const cancelTaskWithConflict = () => {
    setShowConflictModal(false);
    setPendingTask(null);
    setConflictDetails(null);
    setAllConflicts([]);
  };

  // Fonctions pour la popup de confirmation de tâche
  const confirmTaskCreation = async () => {
    if (taskToConfirm) {
      await saveTask(taskToConfirm);
      setShowTaskConfirmationModal(false);
      setTaskToConfirm(null);
      // Recalculer les stats après confirmation de tâche normale
      setTimeout(() => {
        console.log('🔄 Recalcul des stats après confirmation de tâche normale');
        calculerStatsColis();
      }, 500);
      // Nettoyer le formulaire après confirmation
      resetForm();
    }
  };

  const cancelTaskCreation = () => {
    setShowTaskConfirmationModal(false);
    setTaskToConfirm(null);
  };

  // Fonctions pour la popup d'alerte des horaires de travail
  const closeWorkingHoursAlert = () => {
    setShowWorkingHoursAlertModal(false);
    setWorkingHoursAlertData(null);
  };

  const openTimePickerFromAlert = () => {
    setShowWorkingHoursAlertModal(false);
    setWorkingHoursAlertData(null);
    openTimePicker();
  };

  // Initialiser les valeurs temporaires du sélecteur d'heure
  const openTimePicker = () => {
    const [hour, minute] = selectedStartTime.split(':');
    
    // Valider que l'heure sélectionnée est dans la plage des heures de travail
    const currentStartMinutes = parseInt(hour) * 60 + parseInt(minute);
    const workingStartMinutes = parseInt(workingHours.start.split(':')[0]) * 60 + parseInt(workingHours.start.split(':')[1]);
    const workingEndMinutes = parseInt(workingHours.end.split(':')[0]) * 60 + parseInt(workingHours.end.split(':')[1]);
    
    let validHour = hour;
    let validMinute = minute;
    
    // Si l'heure est en dehors de la plage, la corriger
    if (currentStartMinutes < workingStartMinutes) {
      validHour = workingHours.start.split(':')[0];
      validMinute = workingHours.start.split(':')[1];
      console.log('Start time corrected to working hours start:', validHour + ':' + validMinute);
    } else if (currentStartMinutes > workingEndMinutes) {
      validHour = workingHours.end.split(':')[0];
      validMinute = workingHours.end.split(':')[1];
      console.log('Start time corrected to working hours end:', validHour + ':' + validMinute);
    }
    
    setTempSelectedHour(validHour);
    setTempSelectedMinute(validMinute);
    setShowTimePicker(true);
  };

  // Recharger les employés assignés quand la date, l'heure ou les paramètres de la tâche changent
  useEffect(() => {
    if (showEmployeeSelector) {
      loadAssignedEmployees();
    }
  }, [selectedDate, selectedStartTime, packages, paletteCondition, showEmployeeSelector]);

  // Recharger les employés assignés quand l'équipe change
  useEffect(() => {
    if (showEmployeeSelector) {
      loadAssignedEmployees();
    }
  }, [teamMembers, showEmployeeSelector]);

  // Charger les tâches planifiées du jour depuis Supabase
  const loadTasksForSelectedDate = async () => {
    try {
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      const filtered = await getTasksByDate(selectedDateString);
      console.log('📋 Tasks loaded for selected date:', {
        date: selectedDateString,
        tasksCount: filtered.length,
        tasks: filtered.map(t => ({id: t.id, title: t.title, packages: t.packages}))
      });
      setTasksForSelectedDate(filtered);
      
      // Recalculer les stats après le chargement des tâches
      setTimeout(() => {
        console.log('🔄 Recalcul des stats après chargement des tâches');
        calculerStatsColis();
      }, 100);
    } catch (e) {
      console.error('Erreur lors du chargement des tâches:', e);
      setTasksForSelectedDate([]);
    }
  };

  // Rafraîchir la liste quand la date ou une tâche change
  useEffect(() => {
    loadTasksForSelectedDate();
  }, [selectedDate, showTaskModal]);

  // Charger les tâches quand les hooks Supabase sont prêts
  useEffect(() => {
    if (!tasksLoading && getTasksByDate) {
      loadTasksForSelectedDate();
    }
  }, [tasksLoading]);

  // ✅ AJOUT : Rafraîchir les employés disponibles et les stats quand les tâches changent
  useEffect(() => {
    console.log('🔄 Tâches chargées, recalcul des employés disponibles et des stats...');
    calculateAvailableEmployees();
    calculerStatsColis();
  }, [tasksForSelectedDate]);

  // ✅ AJOUT : Rafraîchir les employés disponibles quand le refresh global est déclenché
  useEffect(() => {
    if (triggerRefresh > 0) {
      console.log('🔄 Refresh global détecté, recalcul des employés disponibles...');
      calculateAvailableEmployees();
      loadTasksForSelectedDate();
    }
  }, [triggerRefresh]);

  // Marquer une tâche comme traitée via Supabase
  const handleMarkTaskAsDone = async (taskId: string) => {
    try {
      const result = await toggleTaskComplete(taskId);
      if (result.success) {
        console.log('✅ Tâche marquée comme terminée');
        calculerStatsColis();
        loadTasksForSelectedDate();
        // ✅ AJOUT : Rafraîchir les employés disponibles après completion
        setTimeout(() => calculateAvailableEmployees(), 100);
        // Déclencher un rafraîchissement global pour mettre à jour toutes les interfaces
        triggerRefresh();
      } else {
        console.error('Erreur lors de la completion:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la completion de la tâche:', error);
    }
  };

  // Supprimer une tâche avec confirmation via Supabase
  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      "Supprimer la tâche",
      "Es-tu sûr de vouloir supprimer cette tâche ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
          try {
            const result = await deleteTask(taskId);
            if (result.success) {
              console.log('✅ Tâche supprimée');
              calculerStatsColis();
              loadTasksForSelectedDate();
              // Déclencher un rafraîchissement global pour mettre à jour toutes les interfaces
              triggerRefresh();
            } else {
              console.error('Erreur lors de la suppression:', result.error);
            }
          } catch (error) {
            console.error('Erreur lors de la suppression de la tâche:', error);
          }
        }}
      ]
    );
  };

  // Mettre à jour le nombre total d'employés quand les employés Supabase changent
  useEffect(() => {
    console.log('👥 Calculator - allEmployees changed:', {
      allEmployees: allEmployees ? allEmployees.length : 'null/undefined',
      employeesLoading,
      userAuth: user?.app_metadata?.user_id
    });
    
    // Mettre à jour même si allEmployees est vide pour refléter la réalité
    if (allEmployees !== undefined && allEmployees !== null) {
      console.log('👥 Calculator - Setting totalEmployeesDynamic to:', allEmployees.length);
      setTotalEmployeesDynamic(allEmployees.length);
    }
  }, [allEmployees, employeesLoading]);

  // Ajout de logs détaillés pour le debug
  useEffect(() => {
    console.log('🟦 [DEBUG] Calculator - allEmployees:', allEmployees);
    console.log('🟦 [DEBUG] Calculator - employeesLoading:', employeesLoading);
    if (allEmployees && Array.isArray(allEmployees)) {
      allEmployees.forEach((emp, idx) => {
        console.log(`🟦 [DEBUG] Employé #${idx}:`, emp);
      });
    }
  }, [allEmployees, employeesLoading]);

  // Recharger les données quand l'utilisateur revient sur cette page
  useFocusEffect(
    React.useCallback(() => {
      loadTotalEmployees();
    }, [])
  );

  // Recharger les heures de travail quand l'utilisateur revient sur cette page
  useFocusEffect(
    React.useCallback(() => {
      loadWorkingHours();
    }, [])
  );

  // Nettoyer le formulaire quand l'utilisateur revient sur cette page
  useFocusEffect(
    React.useCallback(() => {
      resetForm();
    }, [])
  );

  useEffect(() => {
    if (showDatePicker) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150, // Animation très rapide de 150ms
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100, // Disparition encore plus rapide de 100ms
        useNativeDriver: true,
      }).start();
    }
  }, [showDatePicker, fadeAnim]);

  // Early return si managerId non disponible
  if (!managerId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement du manager...</Text>
      </View>
    );
  }

  // Early return si le profil utilisateur est en cours de chargement
  if (profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement du profil utilisateur...</Text>
      </View>
    );
  }

  // Vérifier si un employé est déjà assigné à une tâche (occupé ou en conflit)
  // Fonctions pour la récurrence
  const getDayName = (day: number) => {
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return dayNames[day - 1];
  };

  const isEmployeeAssigned = async (employeeId: number) => {
    try {
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      const tasksOnSameDate = await getTasksByDate(selectedDateString);
      
      // Calculer la durée de la nouvelle tâche
      const packageCount = parseInt(packages) || 0;
      const baseTimeSeconds = packageCount * 40;
      const palettePenaltySeconds = paletteCondition ? 0 : 20 * 60;
      const additionalMembers = teamMembers.length - 1;
      const teamBonusSeconds = additionalMembers * 30 * 60;
      const totalTimeSeconds = Math.max(0, baseTimeSeconds + palettePenaltySeconds - teamBonusSeconds);
      
      const newTaskStart = selectedStartTime;
      const newTaskEnd = calculateEndTime(selectedStartTime, totalTimeSeconds);
      
      // Vérifier si l'employé est dans une tâche qui se chevauche TEMPORELLEMENT
      for (const task of tasksOnSameDate) {
        // Ignorer les tâches terminées
        if (task.is_completed) {
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

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Bouton retour */}
      <View style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: isDark ? '#23293a' : '#f3f4f6', borderRadius: 24, padding: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#e5e7eb' }}
          accessibilityLabel="Retour"
        >
          <ArrowLeft color={isDark ? '#60a5fa' : '#3b82f6'} size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, isDark && styles.sectionDark]}>
          <Calculator color={isDark ? '#60a5fa' : '#3b82f6'} size={32} strokeWidth={2} />
          <Text style={[styles.title, isDark && styles.textDark]}>Calculateur d'Équipe</Text>
          <Text style={[styles.subtitle, isDark && styles.textDark]}>Calculez le temps de travail de votre équipe</Text>
          <View style={[styles.managerInfo, isDark && styles.cardDark]}>
            <Text style={[styles.managerText, isDark && styles.textDark]}>
              Manager: {currentManager.name}
            </Text>
            <Text style={[styles.sectionText, isDark && styles.textDark]}>
              Rayon: {currentManager.section}
            </Text>
          </View>
        </View>

        {/* Date & Time Selection */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Date et heure de planification</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
              onPress={() => {
                console.log('🟦 [DEBUG] Calculator - Date picker button pressed');
                setShowDatePicker(true);
                console.log('🟦 [DEBUG] Calculator - showDatePicker set to true');
              }}
            >
              <Calendar color={isDark ? '#60a5fa' : '#3b82f6'} size={20} strokeWidth={2} />
              <Text style={[styles.dateText, isDark && styles.textDark]}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateSelector, isDark && styles.dateSelectorDark, { flexDirection: 'row', minWidth: 90, justifyContent: 'center' }]}
              onPress={openTimePicker}
            >
              <Clock color={isDark ? '#60a5fa' : '#3b82f6'} size={20} strokeWidth={2} />
              <Text style={[styles.dateText, isDark && styles.textDark]}>{selectedStartTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Package Input */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Paramètres de la tâche</Text>
          
          <View style={[styles.inputCard, isDark && styles.inputCardDark]}>
            <View style={styles.inputHeader}>
              <Package color={isDark ? '#60a5fa' : '#3b82f6'} size={20} strokeWidth={2} />
              <Text style={[styles.inputLabel, isDark && styles.textDark]}>Nombre de colis à traiter</Text>
            </View>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={packages}
              onChangeText={setPackages}
              placeholder="Ex: 150"
              keyboardType="numeric"
              placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
            />
            <Text style={[styles.inputNote, isDark && styles.textDark]}>Base: 40 secondes par colis</Text>
          </View>

          {/* Palette Condition */}
          <View style={[styles.inputCard, isDark && styles.inputCardDark]}>
            <View style={styles.inputHeader}>
              <AlertTriangle 
                color={paletteCondition ? (isDark ? '#22d3ee' : '#10b981') : '#ef4444'} 
                size={20} 
                strokeWidth={2} 
              />
              <Text style={[styles.inputLabel, isDark && styles.textDark]}>État de la palette</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, !paletteCondition && styles.activeLabel, isDark && styles.textDark]}>
                Mauvais état (+20 min)
              </Text>
              <Switch
                value={paletteCondition}
                onValueChange={setPaletteCondition}
                trackColor={{ false: '#ef4444', true: (isDark ? '#22d3ee' : '#10b981') }}
                thumbColor={paletteCondition ? '#ffffff' : '#ffffff'}
              />
              <Text style={[styles.switchLabel, paletteCondition && styles.activeLabel, isDark && styles.textDark]}>
                Bon état
              </Text>
            </View>
          </View>
        </View>

        {/* Team Management */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Composition de l'équipe</Text>
            <View style={styles.teamInfo}>
              <Text style={[styles.teamCount, isDark && styles.textDark]}>{teamMembers.length}/{availableEmployees} membres</Text>
              <View style={[styles.employeeInfo, isDark && styles.employeeInfoDark]}>
                <Text style={[styles.employeeInfoText, isDark && styles.textDark]}>
                  {availableEmployees - teamMembers.length} employé{availableEmployees - teamMembers.length > 1 ? 's' : ''} restant{availableEmployees - teamMembers.length > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.totalEmployeesText, isDark && styles.textDark]}>
                  Équipe rayon: {totalEmployeesDynamic} employé{totalEmployeesDynamic > 1 ? 's' : ''} total
                </Text>
                {availableEmployees < totalEmployeesDynamic && (
                  <Text style={[styles.employeeWarningText, isDark && styles.textDark]}>
                    ⚠️ {totalEmployeesDynamic - availableEmployees} employé{totalEmployeesDynamic - availableEmployees > 1 ? 's' : ''} déjà assigné{totalEmployeesDynamic - availableEmployees > 1 ? 's' : ''} à d'autres tâches
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Bouton pour ouvrir le sélecteur d'employés */}
          <TouchableOpacity style={[styles.employeeSelectorButton, isDark && styles.cardDark]} onPress={openEmployeeSelector}>
            <Users color={isDark ? '#60a5fa' : '#3b82f6'} size={24} strokeWidth={2} />
            <Text style={[styles.employeeSelectorText, isDark && styles.textDark]}>
              Sélectionner les membres de l'équipe
            </Text>
            <Text style={[styles.employeeSelectorSubtext, isDark && styles.textDark]}>
              {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} sélectionné{teamMembers.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
          
          {/* Liste des employés sélectionnés */}
          {teamMembers.map((member, index) => (
            <View key={member.id} style={[styles.memberCard, isDark && styles.cardDark]}>
              <View style={styles.memberInfo}>
                {member.avatar ? (
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                ) : (
                  <View style={[styles.memberAvatarPlaceholder, isDark && styles.cardDark]}>
                    <Users color={isDark ? '#60a5fa' : '#3b82f6'} size={20} strokeWidth={2} />
                  </View>
                )}
                <View style={styles.memberDetails}>
                  <Text style={[styles.memberName, isDark && styles.textDark]}>{member.name}</Text>
                  {member.role && <Text style={[styles.memberRole, isDark && styles.textDark]}>{member.role}</Text>}
                </View>
                {index === 0 && <Text style={[styles.principalBadge, isDark && styles.cardDark]}>Principal</Text>}
                {index > 0 && <Text style={[styles.bonusBadge, isDark && styles.cardDark]}>-30 min</Text>}
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeEmployeeFromTeam(member.id)}
              >
                <X color="#ef4444" size={16} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}

          {teamMembers.length === 0 && (
            <View style={[styles.noEmployeeCard, isDark && styles.cardDark]}>
              <Text style={[styles.noEmployeeText, isDark && styles.textDark]}>
                Aucun membre sélectionné
              </Text>
              <Text style={[styles.noEmployeeSubtext, isDark && styles.textDark]}>
                Cliquez sur "Sélectionner les membres" pour ajouter des employés à cette tâche
              </Text>
            </View>
          )}

          <View style={[styles.teamNote, isDark && styles.teamNoteDark]}>
            <Text style={[styles.noteText, isDark && styles.textDark]}>
              💡 Chaque membre supplémentaire réduit le temps de 30 minutes
            </Text>
          </View>
        </View>

        {/* Time Breakdown */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Détail du calcul</Text>
          
          <View style={[styles.calculationCard, isDark && styles.calculationCardDark]}>
            <View style={styles.calculationRow}>
              <Text style={[styles.calculationLabel, isDark && styles.textDark]}>Temps de base</Text>
              <Text style={[styles.calculationValue, isDark && styles.textDark]}>
                {Math.floor(timeCalculation.baseTime / 60)} min
              </Text>
            </View>
            
            {!paletteCondition && (
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, styles.penaltyText, isDark && styles.textDark]}>
                  Pénalité palette
                </Text>
                <Text style={[styles.calculationValue, styles.penaltyText, isDark && styles.textDark]}>
                  +{Math.floor(timeCalculation.palettePenalty / 60)} min
                </Text>
              </View>
            )}
            
            {teamMembers.length > 1 && (
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, styles.bonusText, isDark && styles.textDark]}>
                  Bonus équipe ({teamMembers.length - 1} membres)
                </Text>
                <Text style={[styles.calculationValue, styles.bonusText, isDark && styles.textDark]}>
                  -{Math.floor(timeCalculation.teamBonus / 60)} min
                </Text>
              </View>
            )}

            {timeCalculation.breaksImpact > 0 && (
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, styles.penaltyText, isDark && styles.textDark]}>
                  Impact des pauses
                </Text>
                <Text style={[styles.calculationValue, styles.penaltyText, isDark && styles.textDark]}>
                  +{Math.floor(timeCalculation.breaksImpact / 60)} min
                </Text>
              </View>
            )}

            <View style={[styles.scheduleInfo, isDark && styles.scheduleInfoDark]}>
              <Text style={[styles.scheduleLabel, isDark && styles.textDark]}>Horaires prévus:</Text>
              <Text style={[styles.scheduleTime, isDark && styles.textDark]}>
                Début: {selectedStartTime} - Fin: {formatEndTimeForDisplay(selectedStartTime, timeCalculation.totalTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Final Result */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Temps total estimé</Text>
          
          <View style={[styles.resultCard, isDark && styles.resultCardDark, { borderColor: getTimeColor(timeCalculation.totalTime) }]}>
            <View style={styles.resultHeader}>
              <Clock color={getTimeColor(timeCalculation.totalTime)} size={32} strokeWidth={2} />
              <Text style={[styles.resultTime, { color: getTimeColor(timeCalculation.totalTime) }, isDark && styles.textDark]}>
                {timeCalculation.formattedTime}
              </Text>
            </View>
            
            <View style={styles.resultDetails}>
              <Text style={[styles.resultLabel, isDark && styles.textDark]}>
                Pour {packages || '0'} colis avec {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
              </Text>
              {!paletteCondition && (
                <Text style={[styles.warningText, isDark && styles.textDark]}>
                  ⚠️ Palette en mauvais état - temps majoré
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionSection, isDark && styles.sectionDark]}>
          <TouchableOpacity 
            style={[styles.saveButton, isDark && styles.saveButtonDark]} 
            onPress={async () => {
              console.log('🚀 Bouton "Démarrer la tâche" cliqué');
              
              // Validation de base
              if (!packages || parseInt(packages) <= 0) {
                Alert.alert('Erreur', 'Veuillez entrer un nombre de colis valide');
                return;
              }

              if (teamMembers.length === 0) {
                Alert.alert('Erreur', 'Veuillez ajouter au moins un membre d\'équipe à la tâche');
                return;
              }

              // Créer la tâche directement
              const endTime = calculateEndTime(selectedStartTime, timeCalculation.totalTime);
              
              const task: Task = {
                id: Date.now().toString(),
                title: `${currentManager.section} - ${currentManager.initials}`,
                start_time: selectedStartTime,
                end_time: endTime,
                duration: timeCalculation.formattedTime,
                date: selectedDate.toISOString().split('T')[0],
                packages: parseInt(packages),
                team_size: teamMembers.length,
                manager_section: currentManager.section,
                manager_initials: currentManager.initials,
                palette_condition: paletteCondition,
                team_members: teamMembers.map(member => member.id)
              };
              
              console.log('🎯 Tâche à créer:', task);
              
              try {
                await saveTask(task);
                console.log('✅ Tâche créée avec succès');
              } catch (error) {
                console.error('❌ Erreur lors de la création de la tâche:', error);
                Alert.alert('Erreur', 'Impossible de créer la tâche');
              }
            }}
          >
            <Text style={[styles.saveButtonText, isDark && styles.textDark]}>Démarrer la tâche</Text>
          </TouchableOpacity>
        </View>

        {/* Tâches planifiées du jour */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Tâches planifiées du jour</Text>
            <TouchableOpacity onPress={() => {
              console.log('🔄 Rafraîchissement manuel des tâches');
              loadTasksForSelectedDate();
            }}>
              <Text style={[styles.refreshText, isDark && styles.textDark]}>🔄 Actualiser</Text>
            </TouchableOpacity>
          </View>
          
          {tasksForSelectedDate.length === 0 ? (
            <View style={[styles.noTasksCard, isDark && styles.cardDark]}>
              <Text style={[styles.noTasksText, isDark && styles.textDark]}>
                Aucune tâche planifiée pour le {formatDate(selectedDate)}
              </Text>
              <Text style={[styles.noTasksSubtext, isDark && styles.textSecondaryDark]}>
                Planifiez votre première tâche avec le calculateur ci-dessus
              </Text>
            </View>
          ) : (
            tasksForSelectedDate.map((task) => (
              <View key={task.id} style={[styles.taskCard, isDark && styles.cardDark]}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskTitle, isDark && styles.textDark]}>{task.title}</Text>
                  <View style={styles.taskActions}>
                    <TouchableOpacity 
                      onPress={() => handleMarkTaskAsDone(task.id)}
                      style={styles.completeButton}
                    >
                      <Text style={styles.completeButtonText}>✓ Terminer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDeleteTask(task.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.taskDetails}>
                  <Text style={[styles.taskTime, isDark && styles.textSecondaryDark]}>
                    ⏰ {task.start_time} - {task.end_time}
                  </Text>
                  <Text style={[styles.taskPackages, isDark && styles.textSecondaryDark]}>
                    📦 {task.packages} colis
                  </Text>
                  <Text style={[styles.taskTeam, isDark && styles.textSecondaryDark]}>
                    👥 {task.team_size} équipier{task.team_size > 1 ? 's' : ''}
                  </Text>
                </View>
                {task.is_completed && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>✅ Terminée</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Interactive Calendar Date Picker */}
      <DatePickerCalendar
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => setSelectedDate(date)}
        selectedDate={selectedDate}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 84 * 24 * 60 * 60 * 1000)} // 12 weeks from now
      />

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner l'heure de début</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerPreview}>
              <Text style={styles.timePickerPreviewLabel}>Heure sélectionnée</Text>
              <Text style={styles.timePickerPreviewText}>
                {tempSelectedHour}:{tempSelectedMinute}
              </Text>
            </View>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heures</Text>
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
                  {generateAvailableHours().map((hour) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[
                        styles.timeOption,
                        tempSelectedHour === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempSelectedHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempSelectedHour === hour && styles.selectedTimeText
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
                <ScrollView style={styles.timePickerScroll} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
                  {generateAvailableMinutes().map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timeOption,
                        tempSelectedMinute === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempSelectedMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempSelectedMinute === minute && styles.selectedTimeText
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
                style={styles.modalButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  const selectedMinutes = parseInt(tempSelectedHour) * 60 + parseInt(tempSelectedMinute);
                  const workingStartMinutes = parseInt(workingHours.start.split(':')[0]) * 60 + parseInt(workingHours.start.split(':')[1]);
                  const workingEndMinutes = parseInt(workingHours.end.split(':')[0]) * 60 + parseInt(workingHours.end.split(':')[1]);
                  
                  // Vérifier si l'heure est hors plage
                  if (selectedMinutes < workingStartMinutes || selectedMinutes > workingEndMinutes) {
                    Alert.alert(
                      'Heure hors plage',
                      `L'heure sélectionnée est hors des horaires de travail (${workingHours.start} - ${workingHours.end})`
                    );
                    return; // Ne pas confirmer l'heure
                  }
                  
                  // Si l'heure est valide, confirmer et fermer le sélecteur
                  setSelectedStartTime(`${tempSelectedHour}:${tempSelectedMinute}`);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Conflict Modal */}
      <Modal
        visible={showConflictModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚠️ Conflit de planning</Text>
              <TouchableOpacity onPress={() => setShowConflictModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.conflictContent}>
              <View style={styles.conflictIcon}>
                <AlertTriangle color="#ef4444" size={32} strokeWidth={2} />
              </View>
              
              <Text style={styles.conflictTitle}>
                Conflit{allConflicts.length > 1 ? 's' : ''} détecté{allConflicts.length > 1 ? 's' : ''}
              </Text>
              
              <Text style={styles.conflictMessage}>
                Votre nouvelle tâche entre en conflit avec {allConflicts.length} événement{allConflicts.length > 1 ? 's' : ''} existant{allConflicts.length > 1 ? 's' : ''} :
              </Text>
              
              <ScrollView style={styles.conflictsList} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
                {allConflicts.map((conflict, index) => (
                  <View key={index} style={styles.conflictItem}>
                    <View style={styles.conflictItemHeader}>
                      {conflict.type === 'meeting' && <Calendar color="#3b82f6" size={16} strokeWidth={2} />}
                      {conflict.type === 'training' && <AlertTriangle color="#f59e0b" size={16} strokeWidth={2} />}
                      {conflict.type === 'task' && <Package color="#10b981" size={16} strokeWidth={2} />}
                      <Text style={styles.conflictEventTitle}>
                        {conflict.title}
                      </Text>
                    </View>
                    <Text style={styles.conflictEventTime}>
                      {conflict.startTime} - {conflict.endTime}
                    </Text>
                    {conflict.type && (
                      <Text style={styles.conflictType}>
                        {conflict.type === 'meeting' && 'Réunion'}
                        {conflict.type === 'training' && 'Formation'}
                        {conflict.type === 'task' && 'Tâche planifiée'}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
              
              <Text style={styles.conflictNote}>
                Voulez-vous ajouter cette tâche malgré le{allConflicts.length > 1 ? 's' : ''} conflit{allConflicts.length > 1 ? 's' : ''} ?
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={cancelTaskWithConflict}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={confirmTaskWithConflict}
              >
                <Text style={styles.primaryButtonText}>Ajouter quand même</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Confirmation Modal */}
      <Modal
        visible={showTaskConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelTaskCreation}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>✅ Confirmer la création</Text>
              <TouchableOpacity onPress={cancelTaskCreation}>
                <X color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.confirmationContent}>
              <View style={styles.confirmationIcon}>
                <CheckCircle color="#10b981" size={32} strokeWidth={2} />
              </View>
              
              <Text style={[styles.confirmationTitle, isDark && styles.confirmationTitleDark]}>
                Créer cette tâche ?
              </Text>
              
              {taskToConfirm && (
                <View style={styles.taskDetails}>
                  <View style={styles.taskDetailRow}>
                    <Text style={[styles.taskDetailLabel, isDark && styles.taskDetailLabelDark]}>Titre :</Text>
                    <Text style={[styles.taskDetailValue, isDark && styles.taskDetailValueDark]}>{taskToConfirm.title}</Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Text style={[styles.taskDetailLabel, isDark && styles.taskDetailLabelDark]}>Date :</Text>
                    <Text style={[styles.taskDetailValue, isDark && styles.taskDetailValueDark]}>
                      {new Date(taskToConfirm.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Text style={[styles.taskDetailLabel, isDark && styles.taskDetailLabelDark]}>Heure :</Text>
                    <Text style={[styles.taskDetailValue, isDark && styles.taskDetailValueDark]}>
                      {taskToConfirm.start_time} - {taskToConfirm.end_time}
                    </Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Text style={[styles.taskDetailLabel, isDark && styles.taskDetailLabelDark]}>Colis :</Text>
                    <Text style={[styles.taskDetailValue, isDark && styles.taskDetailValueDark]}>{taskToConfirm.packages}</Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Text style={[styles.taskDetailLabel, isDark && styles.taskDetailLabelDark]}>Équipe :</Text>
                    <Text style={[styles.taskDetailValue, isDark && styles.taskDetailValueDark]}>
                      {taskToConfirm.team_size} employé{taskToConfirm.team_size > 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Text style={[styles.taskDetailLabel, isDark && styles.taskDetailLabelDark]}>Durée :</Text>
                    <Text style={[styles.taskDetailValue, isDark && styles.taskDetailValueDark]}>{taskToConfirm.duration}</Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Text style={[styles.taskDetailLabel, isDark && styles.taskDetailLabelDark]}>État palette :</Text>
                    <Text style={[styles.taskDetailValue, isDark && styles.taskDetailValueDark]}>
                      {taskToConfirm.palette_condition ? '✅ Bon état' : '⚠️ Mauvais état'}
                    </Text>
                  </View>
                </View>
              )}
              
              <Text style={[styles.confirmationMessage, isDark && styles.confirmationMessageDark]}>
                Cette tâche sera ajoutée à votre planning et les équipiers actifs seront mis à jour.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={cancelTaskCreation}
              >
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={confirmTaskCreation}
              >
                <Text style={styles.primaryButtonText}>Créer la tâche</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Working Hours Alert Modal */}
      <Modal
        visible={showWorkingHoursAlertModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeWorkingHoursAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>⚠️ Heure hors plage</Text>
              <TouchableOpacity onPress={closeWorkingHoursAlert}>
                <X color={isDark ? "#a1a1aa" : "#6b7280"} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.workingHoursAlertContent}>
              <View style={styles.workingHoursAlertIcon}>
                <Clock color="#ef4444" size={32} strokeWidth={2} />
              </View>
              
              <Text style={[styles.workingHoursAlertTitle, isDark && styles.workingHoursAlertTitleDark]}>
                ⚠️ Heure hors des horaires de travail
              </Text>
              
              {workingHoursAlertData && (
                <View style={styles.workingHoursAlertDetails}>
                  <View style={styles.workingHoursAlertRow}>
                    <Text style={[styles.workingHoursAlertLabel, isDark && styles.workingHoursAlertLabelDark]}>
                      Heure de début :
                    </Text>
                    <Text style={[styles.workingHoursAlertValue, styles.workingHoursAlertValueError, isDark && styles.workingHoursAlertValueErrorDark]}>
                      {workingHoursAlertData.selectedTime}
                    </Text>
                  </View>
                  
                  {workingHoursAlertData.endTime && (
                    <View style={styles.workingHoursAlertRow}>
                      <Text style={[styles.workingHoursAlertLabel, isDark && styles.workingHoursAlertLabelDark]}>
                        Heure de fin :
                      </Text>
                      <Text style={[
                        styles.workingHoursAlertValue, 
                        workingHoursAlertData.isEndTimeInvalid ? styles.workingHoursAlertValueError : styles.workingHoursAlertValueSuccess,
                        isDark && (workingHoursAlertData.isEndTimeInvalid ? styles.workingHoursAlertValueErrorDark : styles.workingHoursAlertValueSuccessDark)
                      ]}>
                        {workingHoursAlertData.endTime}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.workingHoursAlertRow}>
                    <Text style={[styles.workingHoursAlertLabel, isDark && styles.workingHoursAlertLabelDark]}>
                      Horaires de travail :
                    </Text>
                    <Text style={[styles.workingHoursAlertValue, isDark && styles.workingHoursAlertValueDark]}>
                      {workingHoursAlertData.workingStart} - {workingHoursAlertData.workingEnd}
                    </Text>
                  </View>
                </View>
              )}
              
              <Text style={[styles.workingHoursAlertMessage, isDark && styles.workingHoursAlertMessageDark]}>
                ❌ Impossible de créer une tâche hors des heures de travail.
              </Text>
              <Text style={[styles.workingHoursAlertMessage, isDark && styles.workingHoursAlertMessageDark]}>
                {workingHoursAlertData?.isEndTimeInvalid 
                  ? `La tâche se termine après ${workingHoursAlertData.workingEnd}. Veuillez réduire le nombre de colis ou changer l'heure de début.`
                  : `Veuillez sélectionner une heure de début entre ${workingHoursAlertData?.workingStart} et ${workingHoursAlertData?.workingEnd}, ou annuler la création de la tâche.`
                }
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={closeWorkingHoursAlert}
              >
                <Text style={styles.secondaryButtonText}>❌ Annuler la tâche</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={openTimePickerFromAlert}
              >
                <Text style={styles.primaryButtonText}>🕐 Changer l'heure</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Employee Selector Modal */}
      <Modal
        visible={showEmployeeSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmployeeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
              <Text style={styles.modalTitle}>Sélectionner les employés</Text>
              <TouchableOpacity onPress={() => setShowEmployeeSelector(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalDivider, isDark && styles.modalDividerDark]} />
            <ScrollView style={styles.employeeList} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
              {/* Debug info */}
              <View style={{ padding: 10, backgroundColor: '#f3f4f6', margin: 10, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Debug: profile.section={profile?.section}, loading={employeesLoading.toString()}, count={allEmployees?.length || 0}
                </Text>
              </View>
              <View style={{ padding: 10, backgroundColor: '#f3f4f6', margin: 10, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Debug : profile = {profile ? JSON.stringify({id: profile.id, section: profile.section, full_name: profile.full_name}) : 'null'}
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#3b82f6', padding: 6, borderRadius: 6, marginTop: 6, alignSelf: 'flex-start' }}
                  onPress={() => {
                    console.log('🟦 [DEBUG] profile =', profile);
                    console.log('🟦 [DEBUG] allEmployees =', allEmployees);
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>Afficher dans la console</Text>
                </TouchableOpacity>
              </View>
              
              {employeesLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#6b7280' }}>Chargement des employés...</Text>
                </View>
              ) : allEmployees && allEmployees.length > 0 ? (
                allEmployees.map((employee) => {
                const isSelected = teamMembers.find(member => member.id === employee.id);
                const isAssigned = assignedEmployeeIds.includes(employee.id);
                
                return (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.employeeItem,
                      isDark && styles.employeeCardDark,
                      isSelected && !isAssigned && styles.selectedEmployeeItem,
                      isAssigned && styles.assignedEmployeeItem,
                      isAssigned && styles.assignedEmployeeItemVisual
                    ]}
                    onPress={() => {
                      if (isAssigned) {
                        console.log(`Cannot select employee ${employee.name} - already assigned to another task`);
                        return;
                      }
                      if (isSelected) {
                        removeEmployeeFromTeam(employee.id);
                      } else {
                        addEmployeeToTeam(employee);
                      }
                    }}
                    disabled={isAssigned}
                    activeOpacity={isAssigned ? 1 : 0.7}
                  >
                    <View style={styles.employeeItemContent}>
                      {/* Icône d'avertissement pour les employés occupés */}
                      {isAssigned && (
                        <View style={styles.assignedIconContainer}>
                          <AlertTriangle color="#ef4444" size={22} strokeWidth={2.5} />
                        </View>
                      )}
                      {employee.avatar ? (
                        <Image
                          source={{ uri: employee.avatar }}
                          style={[
                            styles.employeeItemAvatar,
                            isAssigned && styles.assignedEmployeeAvatar
                          ]}
                          // Flou sur l'avatar si occupé (sinon opacité réduite)
                          blurRadius={isAssigned ? 2 : 0}
                        />
                      ) : (
                        <View style={styles.employeeItemAvatarPlaceholder}>
                          <Users color="#3b82f6" size={20} strokeWidth={2} />
                        </View>
                      )}
                      <View style={styles.employeeItemDetails}>
                        <Text style={[
                          styles.employeeItemName,
                          isAssigned && styles.assignedEmployeeText
                        ]}>
                          {employee.name}
                        </Text>
                        {employee.role && (
                          <Text style={[
                            styles.employeeItemRole,
                            isAssigned && styles.assignedEmployeeText
                          ]}>
                            {employee.role}
                          </Text>
                        )}
                        {employee.status && (
                          <Text style={[
                            styles.employeeItemStatus,
                            isAssigned && styles.assignedEmployeeText
                          ]}>
                            {employee.status}
                          </Text>
                        )}
                      </View>
                      <View style={styles.employeeItemActions}>
                        {isSelected && !isAssigned && (
                          <View style={styles.selectedIndicator}>
                            <Text style={styles.selectedIndicatorText}>✓</Text>
                          </View>
                        )}
                        {isAssigned && (
                          <Text style={styles.assignedIndicatorStrong}>Occupé</Text>
                        )}
                        {!isSelected && !isAssigned && (
                          <Text style={styles.availableIndicator}>Disponible</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
                })
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#6b7280', textAlign: 'center' }}>
                    Aucun employé disponible.{'\n'}
                    {profile?.section 
                      ? `Section actuelle: ${profile.section}`
                      : 'Aucune section définie pour votre profil'
                    }{'\n'}
                    Ajoutez des employés dans la page "Équipe Rayon".
                  </Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.closeButtonDark]}
                onPress={() => setShowEmployeeSelector(false)}
              >
                <Text style={[styles.modalButtonText, isDark && styles.closeButtonTextDark, styles.modalText, isDark && styles.modalTextDark]}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* Outils de développement (section dédiée, repliable, compacte) */}
      <View style={{ margin: 16, marginTop: 16, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
          <TouchableOpacity onPress={() => setShowDevTools(!showDevTools)} style={{ padding: 6, backgroundColor: '#e5e7eb', borderRadius: 6, marginRight: 8 }}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{showDevTools ? 'Masquer' : 'Afficher'}</Text>
          </TouchableOpacity>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#ef4444' }}>
            Outils de développement
          </Text>
        </View>
        {showDevTools && (
          <>
            {/* Bloc infos stats colis déplacé ici */}
            <View style={{ backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginTop: 12, marginBottom: 12 }}>
              <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8}}>
                📦 Statistiques du {formatDate(selectedDate)}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{fontSize: 14, color: '#374151'}}>Total de la journée:</Text>
                <Text style={{fontSize: 16, fontWeight: '600', color: '#1f2937'}}>{totalColisJour} colis</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{fontSize: 14, color: '#374151'}}>Colis traités:</Text>
                <Text style={{fontSize: 16, fontWeight: '600', color: '#3b82f6'}}>{colisTraitesJour} colis</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{fontSize: 14, color: '#374151'}}>Progression:</Text>
                <Text style={{fontSize: 16, fontWeight: '600', color: '#10b981'}}>{pourcentageColisTraites}%</Text>
              </View>
              <View style={{ backgroundColor: '#f3f4f6', borderRadius: 4, height: 8, marginTop: 8 }}>
                <View style={{ 
                  backgroundColor: '#3b82f6', 
                  borderRadius: 4, 
                  height: 8, 
                  width: `${pourcentageColisTraites}%`,
                  maxWidth: '100%'
                }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' }}>
              <TouchableOpacity 
                style={{backgroundColor: '#3b82f6', padding: 8, borderRadius: 6, marginBottom: 8, minWidth: 80, alignItems: 'center'}}
                onPress={() => {
                  console.log('🔄 Bouton de rafraîchissement cliqué');
                  calculerStatsColis();
                }}
              >
                <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>🔄 Rafraîchir</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{backgroundColor: '#ef4444', padding: 8, borderRadius: 6, marginBottom: 8, minWidth: 80, alignItems: 'center'}}
                onPress={async () => {
                  console.log('🔍 Test AsyncStorage - Début');
                  try {
                    const tasksString = await AsyncStorage.getItem('scheduledTasks');
                    console.log('📦 Contenu brut AsyncStorage:', tasksString);
                    if (tasksString) {
                      const tasks = JSON.parse(tasksString);
                      console.log('📋 Toutes les tâches:', tasks);
                      const today = new Date().toISOString().split('T')[0];
                      console.log('📅 Date du jour pour comparaison:', today);
                      tasks.forEach((t: any, index: number) => {
                        console.log(`📋 Tâche ${index}:`, {
                          date: t.date,
                          packages: t.packages,
                          title: t.title,
                          isToday: t.date === today
                        });
                      });
                    }
                  } catch (e) {
                    console.error('❌ Erreur test AsyncStorage:', e);
                  }
                }}
              >
                <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>🔍 Debug</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{backgroundColor: '#f59e0b', padding: 8, borderRadius: 6, marginBottom: 8, minWidth: 80, alignItems: 'center'}} 
                onPress={() => {
                  sendImmediateNotification(
                    '🧪 Test de notification',
                    'Ceci est un test de notification immédiate !',
                    { type: 'test' }
                  );
                }}
              >
                <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>🧪 Tester Notification</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{backgroundColor: '#10b981', padding: 8, borderRadius: 6, marginBottom: 8, minWidth: 80, alignItems: 'center'}} 
                onPress={() => {
                  // Créer une tâche qui commence dans 30 secondes
                  const futureTime = new Date(Date.now() + 30000); // 30 secondes
                  const testTask = {
                    id: 'test-' + Date.now(),
                    title: 'Tâche de test',
                    date: futureTime.toISOString().split('T')[0],
                    startTime: futureTime.toTimeString().slice(0, 5),
                  };
                  if (Platform.OS === 'web') {
                    Alert.alert('Test Web', 'Sur le web, les notifications programmées ne fonctionnent pas. Utilisez Expo Go sur mobile pour tester les vrais rappels !');
                    return;
                  }
                  scheduleTaskReminder(testTask);
                  Alert.alert('Test', 'Rappel programmé pour dans 30 secondes !');
                }}
              >
                <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>⏰ Tester Rappel (30s)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{backgroundColor: '#8b5cf6', padding: 8, borderRadius: 6, marginBottom: 8, minWidth: 80, alignItems: 'center'}} 
                onPress={() => {
                  Alert.alert('Test', 'Notification programmée pour dans 5 secondes !');
                  setTimeout(() => {
                    sendImmediateNotification(
                      '🕐 Rappel de tâche (Simulé)',
                      'La tâche "Tâche de test" commence dans 5 secondes',
                      { type: 'task_reminder', taskId: 'test-simulated' }
                    );
                  }, 5000);
                }}
              >
                <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>⏰ Test Délai Simulé (5s)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{backgroundColor: '#ef4444', padding: 8, borderRadius: 6, marginBottom: 8, minWidth: 80, alignItems: 'center'}} 
                onPress={() => {
                  sendConflictAlert({
                    title: 'Tâche de test',
                    conflicts: [
                      { title: 'Tâche existante', startTime: '10:00', endTime: '11:00' }
                    ]
                  });
                }}
              >
                <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>⚠️ Tester Alerte Conflit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{backgroundColor: '#f59e0b', padding: 8, borderRadius: 6, marginBottom: 8, minWidth: 80, alignItems: 'center'}} 
                onPress={() => {
                  if (Platform.OS === 'web') {
                    Alert.alert('Test Web', 'Sur le web, les notifications programmées ne fonctionnent pas. Utilisez Expo Go sur mobile pour tester les vrais rappels !');
                    return;
                  }
                  const futureDate = new Date(Date.now() + 30000);
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: '🕐 Test Notification (30s)',
                      body: 'Cette notification a été programmée pour dans 30 secondes !',
                      sound: 'default',
                    },
                    trigger: {
                      type: Notifications.SchedulableTriggerInputTypes.DATE,
                      date: futureDate,
                    },
                  });
                  Alert.alert('Test', 'Notification programmée pour dans 30 secondes !');
                }}
              >
                <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>⏰ Test Direct (30s)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Bouton pour choisir la date de fin de récurrence */}
      <TouchableOpacity
        style={[styles.endDateButton, isDark && styles.endDateButtonDark]}
        onPress={() => setShowEndDatePicker(true)}
      >
        <Text style={styles.endDateButtonText}>
          {endDate ? formatDate(endDate) : 'Choisir une date de fin'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showEndDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999 }}>
          <View style={{ backgroundColor: isDark ? '#18181b' : '#fff', borderRadius: 16, padding: 16, elevation: 10 }}>
            <DatePickerCalendar
              visible={true}
              onClose={() => setShowEndDatePicker(false)}
              onDateSelect={(date) => { setEndDate(date); setShowEndDatePicker(false); }}
              selectedDate={endDate || new Date()}
              minDate={selectedDate}
            />
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
  sectionDark: {
    backgroundColor: 'transparent',
  },
  cardDark: {
    backgroundColor: '#23232a',
    borderColor: '#27272a',
  },
  inputCardDark: {
    backgroundColor: '#23232a',
    borderColor: '#27272a',
  },
  resultCardDark: {
    backgroundColor: '#23232a',
    borderColor: '#27272a',
  },
  dateSelectorDark: {
    backgroundColor: '#23232a',
    borderColor: '#27272a',
  },
  modalContentDark: {
    backgroundColor: '#23293a',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  modalDividerDark: {
    backgroundColor: '#334155',
  },
  inputDark: {
    backgroundColor: '#18181b',
    color: '#f1f5f9',
    borderColor: '#27272a',
  },
  textDark: {
    color: '#f1f5f9',
  },
  textSecondaryDark: {
    color: '#a1a1aa',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  managerInfo: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  managerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  teamCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dateSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
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
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
    textTransform: 'capitalize',
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  inputNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  principalBadge: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bonusBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addMemberButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  addMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  teamNote: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  teamNoteDark: {
    backgroundColor: '#23293a',
  },
  noteText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  noteTextDark: {
    color: '#e5e7eb',
  },
  calculationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  calculationCardDark: {
    backgroundColor: '#23293a',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  calculationLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  calculationValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  penaltyText: {
    color: '#ef4444',
  },
  bonusText: {
    color: '#10b981',
  },
  scheduleInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  scheduleInfoDark: {
    backgroundColor: '#23293a',
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTime: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 16,
  },
  resultDetails: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  saveButtonDark: {
    backgroundColor: '#059669', // vert foncé pour dark mode
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  secondaryButtonDark: {
    backgroundColor: '#23293a',
    borderColor: '#334155',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  secondaryButtonTextDark: {
    color: '#e5e7eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  taskModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  taskSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  summaryItem: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  modalButtonDark: {
    backgroundColor: '#23293a',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonTextDark: {
    color: '#e5e7eb',
  },
  primaryModalButton: {
    backgroundColor: '#3b82f6',
  },
  primaryModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#23293a',
    borderColor: '#334155',
  },
  modalHeader: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  modalHeaderDark: {
    backgroundColor: '#23293a',
    borderBottomColor: '#334155',
  },
  employeeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  employeeCardDark: {
    backgroundColor: '#23293a',
    borderColor: '#334155',
  },
  modalButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonDark: {
    backgroundColor: '#23293a',
    borderColor: '#334155',
  },
  modalButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonTextDark: {
    color: '#e5e7eb',
  },
  conflictContent: {
    alignItems: 'center',
    padding: 20,
  },
  conflictIcon: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  conflictTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  conflictMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  conflictsList: {
    maxHeight: 300,
  },
  conflictItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  conflictItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  conflictEventTime: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  conflictType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  conflictNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  employeeInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
    maxWidth: '80%',
    width: 'auto',
    alignSelf: 'flex-start',
    flexShrink: 1,
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  employeeInfoDark: {
    backgroundColor: '#23293a',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  employeeInfoText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  employeeWarningText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  totalEmployeesText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  noEmployeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEmployeeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  noEmployeeSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
  timeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
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
  timePickerPreview: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 16,
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
  timeWarningContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1000,
  },
  timeWarningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    flex: 1,
  },
  cooldownBarContainer: {
    marginTop: 8,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cooldownBarBackground: {
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
  },
  cooldownBarProgress: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  employeeSelectorButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
  employeeSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  employeeSelectorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberRole: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  employeeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedEmployeeItem: {
    backgroundColor: '#3b82f6',
  },
  assignedEmployeeItem: {
    backgroundColor: '#f8fafc',
    opacity: 0.5,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  employeeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  employeeItemAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeItemDetails: {
    flex: 1,
  },
  employeeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  assignedEmployeeText: {
    color: '#9ca3af',
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  employeeItemRole: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  employeeItemStatus: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedIndicator: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 4,
    marginRight: 8,
  },
  selectedIndicatorText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  assignedIndicator: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  employeeItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeList: {
    maxHeight: 400,
  },
  availableIndicator: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 8,
  },
  assignedEmployeeItemVisual: {
    backgroundColor: '#e5e7eb',
    borderLeftWidth: 5,
    borderLeftColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  assignedIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedEmployeeAvatar: {
    opacity: 0.5,
  },
  assignedIndicatorStrong: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    marginLeft: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonDark: {
    backgroundColor: '#334155',
  },
  closeButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 16,
  },
  closeButtonTextDark: {
    color: '#e5e7eb',
  },
  modalText: {
    color: '#1a1a1a',
  },
  modalTextDark: {
    color: '#e5e7eb',
  },
  refreshText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  noTasksCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  noTasksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noTasksSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  taskDetails: {
    gap: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskPackages: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskTeam: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  
  // Styles pour la récurrence
  toggleButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleButtonDark: {
    backgroundColor: '#374151',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  recurrenceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recurrenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  recurrenceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceTypeButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: '30%',
    flexGrow: 1,
  },
  recurrenceTypeButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  recurrenceTypeButtonActiveDark: {
    backgroundColor: '#1e3a8a',
    borderColor: '#60a5fa',
  },
  recurrenceTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  recurrenceTypeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  recurrenceTypeLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 45,
  },
  dayButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  dayButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayButtonActiveDark: {
    backgroundColor: '#60a5fa',
    borderColor: '#60a5fa',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  dayButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  recurrenceEndHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  endDateButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  endDateButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  endDateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  clearEndDateButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearEndDateButtonDark: {
    backgroundColor: '#450a0a',
    borderColor: '#7f1d1d',
  },
  clearEndDateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  recurrencePreview: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginTop: 8,
  },
  recurrencePreviewDark: {
    backgroundColor: '#1e3a8a',
    borderLeftColor: '#60a5fa',
  },
  recurrencePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  recurrencePreviewText: {
    fontSize: 14,
    color: '#3730a3',
    fontWeight: '500',
  },
  recurrencePreviewEnd: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    marginTop: 4,
  },
  recurrenceButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  recurrenceButtonDark: {
    backgroundColor: '#059669',
  },
  recurrenceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Styles pour la popup de confirmation de tâche
  confirmationContent: {
    alignItems: 'center',
    padding: 20,
  },
  confirmationIcon: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationTitleDark: {
    color: '#ffffff',
  },
  taskDetails: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  taskDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  taskDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  taskDetailLabelDark: {
    color: '#a1a1aa',
  },
  taskDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 2,
    textAlign: 'right',
  },
  taskDetailValueDark: {
    color: '#ffffff',
  },
  confirmationMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmationMessageDark: {
    color: '#a1a1aa',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  
  // Styles pour la popup d'alerte des horaires de travail
  workingHoursAlertContent: {
    alignItems: 'center',
    padding: 20,
  },
  workingHoursAlertIcon: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  workingHoursAlertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  workingHoursAlertTitleDark: {
    color: '#ffffff',
  },
  workingHoursAlertDetails: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  workingHoursAlertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  workingHoursAlertLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  workingHoursAlertLabelDark: {
    color: '#a1a1aa',
  },
  workingHoursAlertValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 2,
    textAlign: 'right',
  },
  workingHoursAlertValueDark: {
    color: '#ffffff',
  },
  workingHoursAlertValueError: {
    color: '#ef4444',
    fontWeight: '600',
  },
  workingHoursAlertValueErrorDark: {
    color: '#f87171',
  },
  workingHoursAlertValueSuccess: {
    color: '#10b981',
    fontWeight: '600',
  },
  workingHoursAlertValueSuccessDark: {
    color: '#34d399',
  },
  workingHoursAlertMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  workingHoursAlertMessageDark: {
    color: '#a1a1aa',
  },
});