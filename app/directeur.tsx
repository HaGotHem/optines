import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, Phone, Mail, MapPin, Clock, Plus, X, UserPlus, Calendar, 
  Target, Edit, ChevronDown, ArrowLeft, Coffee, BarChart3, Search,
  Filter, TrendingUp, Activity, AlertTriangle, CircleCheck as CheckCircle, 
  Package, Timer, LogOut, Settings, Bell, BarChart3 as ChartBar
} from 'lucide-react-native';
import { router } from 'expo-router';
import { PerformanceService } from '../services/PerformanceService';
import { useSupabaseTasks } from '../hooks/useSupabaseTasks';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';
import { useSupabaseAlerts } from '../hooks/useSupabaseAlerts';
import { useSupabaseWorkingHours } from '../hooks/useSupabaseWorkingHours';
import { supabase } from '../lib/supabase';
import PerformanceChart from '../components/PerformanceChart';
import { notificationService } from '../services/NotificationService';

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
  const [managers, setManagers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [avgRemainingHours, setAvgRemainingHours] = useState(0);
  const [avgRemainingMinutes, setAvgRemainingMinutes] = useState(0);

  // États pour la configuration des horaires
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [workingHours, setWorkingHours] = useState({ start: '06:00', end: '21:00' });
  const [tempWorkingHours, setTempWorkingHours] = useState({ start: '06:00', end: '21:00' });
  const [isSavingHours, setIsSavingHours] = useState(false);
  
  // États pour les time pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartHour, setTempStartHour] = useState('06');
  const [tempStartMinute, setTempStartMinute] = useState('00');
  const [tempEndHour, setTempEndHour] = useState('21');
  const [tempEndMinute, setTempEndMinute] = useState('00');

  // États pour l'attribution de tâches
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskStartTime, setTaskStartTime] = useState('09:00');
  const [taskEndTime, setTaskEndTime] = useState('10:00');
  const [taskPackages, setTaskPackages] = useState('');
  const [taskTeamSize, setTaskTeamSize] = useState('2');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [sendUrgentNotification, setSendUrgentNotification] = useState(false);
  const [showManagerSelector, setShowManagerSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Animation pour le toggle de notification
  const toggleAnimation = useRef(new Animated.Value(0)).current;

  // Hooks pour récupérer les données
  const { tasks: allTasks, isLoading: tasksLoading, createTask } = useSupabaseTasks({});
  const { users: allUsers, isLoading: usersLoading } = useSupabaseUsers();
  const { alerts: realAlerts, isLoading: alertsLoading, markAlertAsRead } = useSupabaseAlerts({ store_id: 1 });
  const { 
    workingHours: storeWorkingHours, 
    isLoading: workingHoursLoading, 
    updateWorkingHours,
    loadWorkingHours
  } = useSupabaseWorkingHours();

  // Charger les horaires de travail
  useEffect(() => {
    if (storeWorkingHours) {
      console.log('🔄 Mise à jour des horaires depuis la base:', storeWorkingHours);
      const newWorkingHours = { start: storeWorkingHours.start_time, end: storeWorkingHours.end_time };
      setWorkingHours(newWorkingHours);
      setTempWorkingHours(newWorkingHours);
      console.log('✅ Horaires mis à jour dans l\'interface:', newWorkingHours);
    }
  }, [storeWorkingHours]);

  const saveWorkingHours = async () => {
    if (isSavingHours) return; // Éviter les clics multiples
    
    try {
      setIsSavingHours(true);
      console.log('🔄 Sauvegarde des horaires en cours...');
      console.log('Horaires à sauvegarder:', tempWorkingHours);
      
      const result = await updateWorkingHours(tempWorkingHours.start, tempWorkingHours.end);
      
      if (result) {
        console.log('✅ Résultat de la sauvegarde:', result);
        // Forcer le rechargement des horaires pour s'assurer de la synchronisation
        await loadWorkingHours();
        setShowWorkingHoursModal(false);
        console.log('✅ Horaires de travail mis à jour avec succès');
        
        // Afficher une alerte de succès
        Alert.alert(
          'Succès',
          `Horaires mis à jour : ${tempWorkingHours.start} - ${tempWorkingHours.end}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Aucun résultat retourné par updateWorkingHours');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des horaires:', error);
      
      // Afficher une alerte d'erreur détaillée
      Alert.alert(
        'Erreur',
        `Impossible de sauvegarder les horaires : ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nAssurez-vous que la table working_hours existe dans la base de données.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSavingHours(false);
    }
  };

  // Charger les données de performance
  useEffect(() => {
    const loadPerformanceData = async () => {
      if (tasksLoading || usersLoading || !allUsers || !allTasks) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Filtrer les managers
        const managersList = allUsers.filter(user => user.role === 'manager');
        setManagers(managersList);
        console.log('📊 Managers trouvés:', managersList.length, managersList.map(m => ({ name: m.full_name, section: m.section })));
        
        // Calculer les performances seulement pour les managers avec des vraies tâches
        const performanceData = [];
        
        managersList.forEach(manager => {
          // Chercher les vraies tâches du manager
          const managerTasks = allTasks.filter(task => {
            return task.manager_id === manager.id;
          });
          
          console.log(`📋 Tâches trouvées pour ${manager.full_name}:`, managerTasks.length);
          
          // Utiliser seulement les vraies données - pas de données simulées
          if (managerTasks.length > 0) {
            const performance = PerformanceService.calculateManagerPerformance(
              manager.id,
              manager.full_name || manager.username || 'Manager',
              manager.section || 'Section inconnue',
              managerTasks
            );
            
            console.log(`📊 Performance calculée pour ${manager.full_name}:`, performance);
            performanceData.push(performance);
          } else {
            console.log(`⚠️ Manager ${manager.full_name} n'a pas de tâches - ignoré`);
          }
        });

        console.log('📊 Données de performance générées:', performanceData.length);
        
        // Calculer les statistiques globales seulement avec les vraies données
        const stats = PerformanceService.calculateGlobalStats(performanceData);
        
        setManagersPerformance(performanceData);
        setGlobalStats(stats);
        
        // Calculer le temps moyen restant
        if (performanceData.length > 0) {
          const totalMinutes = performanceData.reduce((sum, manager) => sum + manager.remainingTimeMinutes, 0);
          const avgMinutes = Math.floor(totalMinutes / performanceData.length);
          setAvgRemainingHours(Math.floor(avgMinutes / 60));
          setAvgRemainingMinutes(avgMinutes % 60);
        }
        
        // Mettre à jour les alertes
        setAlerts(realAlerts || []);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données de performance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [allTasks, allUsers, tasksLoading, usersLoading]);



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
    // Marquer lalerte comme lue
    if (alert.id) {
      markAlertAsRead(alert.id.toString());
    }
  };

  const handleLogout = () => {
    router.replace('/');
  };

  // Fonctions pour générer les heures et minutes
  const generateAvailableHours = () => {
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  };

  const generateAvailableMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  };

  // Fonctions pour ouvrir les time pickers
  const openStartTimePicker = () => {
    const [hour, minute] = tempWorkingHours.start.split(':');
    setTempStartHour(hour);
    setTempStartMinute(minute);
    setShowStartTimePicker(true);
  };

  const openEndTimePicker = () => {
    const [hour, minute] = tempWorkingHours.end.split(':');
    setTempEndHour(hour);
    setTempEndMinute(minute);
    setShowEndTimePicker(true);
  };

  // Supprimer la simulation d'alertes en temps réel
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  //     if (criticalAlerts.length > 0 && Math.random() > 0.7) {
  //       const randomAlert = criticalAlerts[Math.floor(Math.random() * criticalAlerts.length)];
  //       showAlert(randomAlert);
  //     }
  //   }, 15000); // Check every 15 seconds

  //   return () => clearInterval(interval);
  // }, []);

  const assignTaskToManager = async () => {
    console.log('🔍 Début de assignTaskToManager');
    console.log('📋 Données du formulaire:', {
      selectedManager,
      taskTitle,
      taskDate,
      taskStartTime,
      taskEndTime,
      taskPackages,
      taskTeamSize,
      createTask: typeof createTask
    });

    console.log('🔍 Vérification des champs obligatoires...');
    
    if (!selectedManager || !taskTitle.trim() || !taskDate || !taskStartTime || !taskEndTime) {
      console.log('❌ Champs obligatoires manquants');
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    console.log('🔍 Vérification des valeurs numériques...');
    
    // Vérifier la taille de l'équipe (obligatoire)
    if (parseInt(taskTeamSize) <= 0) {
      console.log('❌ Taille d\'équipe invalide');
      Alert.alert('Erreur', 'La taille de l\'équipe doit être supérieure à 0');
      return;
    }

    // Vérifier le nombre de colis (optionnel mais doit être positif si renseigné)
    if (taskPackages.trim() !== '' && parseInt(taskPackages) <= 0) {
      console.log('❌ Nombre de colis invalide');
      Alert.alert('Erreur', 'Le nombre de colis doit être supérieur à 0 s\'il est renseigné');
      return;
    }

    console.log('🔍 Vérification de createTask...');
    
    if (!createTask) {
      console.log('❌ createTask non disponible');
      Alert.alert('Erreur', 'Fonction createTask non disponible');
      return;
    }

    console.log('🕐 Horaires de travail actuels:', workingHours);
    console.log('🕐 Horaires de la tâche:', taskStartTime, '-', taskEndTime);

    try {
      console.log('🔍 Début du try/catch...');
      setIsCreatingTask(true);
      
      console.log('🔍 Création de taskData...');
      console.log('🔍 Valeurs brutes:', {
        taskTitle: taskTitle,
        taskDescription: taskDescription,
        taskStartTime: taskStartTime,
        taskEndTime: taskEndTime,
        taskDate: taskDate,
        taskPackages: taskPackages,
        taskTeamSize: taskTeamSize,
        selectedManager: selectedManager
      });
      
      const taskData = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        start_time: taskStartTime + ':00', // Ajouter les secondes pour le format TIME
        end_time: taskEndTime + ':00', // Ajouter les secondes pour le format TIME
        duration: calculateDuration(taskStartTime, taskEndTime),
        date: taskDate,
        packages: taskPackages.trim() !== '' ? parseInt(taskPackages) : 0, // Optionnel, valeur par défaut 0
        team_size: parseInt(taskTeamSize),
        manager_section: selectedManager.section || 'Section inconnue',
        manager_initials: selectedManager.full_name?.substring(0, 2).toUpperCase() || 'MG',
        palette_condition: false,
        is_pinned: taskPriority === 'high' || taskPriority === 'urgent',
        is_completed: false,
        team_members: [], // Champ obligatoire manquant !
        manager_id: selectedManager.id, // Garder comme string/UUID
        store_id: selectedManager.store_id || 1
      };

      console.log('🔍 taskData final:', JSON.stringify(taskData, null, 2));

      console.log('🔄 Appel de createTask avec:', taskData);
      const result = await createTask(taskData);
      console.log('🔄 Résultat de createTask:', result);
      
      if (result.success) {
        // Envoyer une notification urgente si demandé
        if (sendUrgentNotification && taskPriority === 'urgent') {
          try {
            await notificationService.notifyUrgentTaskAssigned(result.task, selectedManager.full_name);
            console.log('✅ Notification urgente envoyée au manager:', selectedManager.full_name);
          } catch (notificationError) {
            console.error('❌ Erreur lors de l\'envoi de la notification urgente:', notificationError);
          }
        }

        const priorityText = getPriorityText(taskPriority);
        const notificationText = sendUrgentNotification && taskPriority === 'urgent' 
          ? `\n\n📱 Notification urgente envoyée au téléphone de ${selectedManager.full_name}`
          : '';
        
        const packagesText = taskPackages.trim() !== '' ? `• Colis : ${taskPackages}` : '• Colis : 0 (non spécifié)';
        
        const taskDetails = `📋 Détails de la tâche :
• Titre : ${taskTitle}
• Manager : ${selectedManager.full_name} (${selectedManager.section})
• Date : ${new Date(taskDate).toLocaleDateString('fr-FR')}
• Heures : ${taskStartTime} - ${taskEndTime}
${packagesText}
• Équipe : ${taskTeamSize} personnes
• Priorité : ${priorityText}`;

        Alert.alert(
          '✅ Tâche attribuée avec succès', 
          `${taskDetails}${notificationText}`,
          [
            { 
              text: 'Attribuer une autre tâche', 
              onPress: () => {
                resetAssignTaskForm();
                setShowAssignTaskModal(true);
              }
            },
            { 
              text: 'Fermer', 
              onPress: () => resetAssignTaskForm(),
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'attribution de la tâche');
      }
    } catch (error) {
      console.error('❌ Erreur dans assignTaskToManager:', error);
      Alert.alert('Erreur', `Erreur lors de l'attribution de la tâche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Élevée';
      case 'urgent': return 'Urgente';
      default: return 'Moyenne';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#3b82f6';
      case 'high': return '#f59e0b';
      case 'urgent': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const resetAssignTaskForm = () => {
    setSelectedManager(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDate(new Date().toISOString().split('T')[0]);
    setTaskStartTime('09:00');
    setTaskEndTime('10:00');
    setTaskPackages('');
    setTaskTeamSize('2');
    setTaskPriority('medium');
    setSendUrgentNotification(false);
    setShowAssignTaskModal(false);
  };

  const openTimePicker = (mode: 'start' | 'end') => {
    setTimePickerMode(mode);
    setShowTimePicker(true);
  };

  const selectTime = (hour: string, minute: string) => {
    const time = `${hour}:${minute}`;
    if (timePickerMode === 'start') {
      setTaskStartTime(time);
    } else {
      setTaskEndTime(time);
    }
    setShowTimePicker(false);
  };

  // Animer le toggle de notification
  const animateToggle = (active: boolean) => {
    Animated.timing(toggleAnimation, {
      toValue: active ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Mettre à jour l'animation quand l'état change
  useEffect(() => {
    animateToggle(sendUrgentNotification);
  }, [sendUrgentNotification]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>

        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={1}>Tableau de bord</Text>
            <Text style={styles.subtitle}>Vue d'ensemble</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Bell color="#ef4444" size={20} strokeWidth={2} />
              {realAlerts && realAlerts.length > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{realAlerts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions Rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => setShowAssignTaskModal(true)}
            >
              <Target color="#8b5cf6" size={24} strokeWidth={2} />
              <Text style={styles.quickActionText}>Attribuer tâche</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => setShowWorkingHoursModal(true)}
            >
              <Clock color="#f59e0b" size={24} strokeWidth={2} />
              <Text style={styles.quickActionText}>Horaires travail</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/user-management')}
            >
              <Settings color="#3b82f6" size={24} strokeWidth={2} />
              <Text style={styles.quickActionText}>Gestion utilisateurs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/employee-management')}
            >
              <Users color="#10b981" size={24} strokeWidth={2} />
              <Text style={styles.quickActionText}>Gestion équipes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/all-tasks')}
            >
              <BarChart3 color="#8b5cf6" size={24} strokeWidth={2} />
              <Text style={styles.quickActionText}>Toutes les tâches</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/employee-performance')}
            >
              <BarChart3 color="#f59e0b" size={24} strokeWidth={2} />
              <Text style={styles.quickActionText}>Performance</Text>
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
            <Text style={styles.statValue}>{isLoading ? '...' : globalStats.processedPackages || 0}</Text>
            <Text style={styles.statLabel}>Colis traités</Text>
          </View>
          <View style={styles.statCard}>
            <Package color="#8b5cf6" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{isLoading ? '...' : globalStats.totalPackages || 0}</Text>
            <Text style={styles.statLabel}>Total colis</Text>
          </View>
          <View style={styles.statCard}>
            <Timer color="#f59e0b" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{isLoading ? '...' : `${avgRemainingHours}h${avgRemainingMinutes.toString().padStart(2, '0')}`}</Text>
            <Text style={styles.statLabel}>Temps moy.</Text>
          </View>
          <View style={styles.statCard}>
            <AlertTriangle color="#ef4444" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{isLoading ? '...' : (realAlerts ? realAlerts.length : 0)}</Text>
            <Text style={styles.statLabel}>Alertes</Text>
          </View>
        </View>

        {/* Critical Alerts */}
        {realAlerts && realAlerts.filter(alert => alert.severity === 'critical').length > 0 && (
          <View style={styles.criticalSection}>
            <Text style={styles.criticalTitle}>🚨 Alertes</Text>
            {realAlerts.filter(alert => alert.severity === 'critical').map((alert) => (
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

        {/* Tâches Planifiées par les Managers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tâches Planifiées par les Managers</Text>
          <View style={styles.tasksContainer}>
            {allTasks.length === 0 ? (
              <View style={styles.emptyTasksState}>
                <Target color="#9ca3af" size={48} strokeWidth={2} />
                <Text style={styles.emptyTasksText}>Aucune tâche planifiée</Text>
                <Text style={styles.emptyTasksSubtext}>Les managers n'ont pas encore créé de tâches</Text>
              </View>
            ) : (
              allTasks
                .filter(task => !task.is_completed)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 10)
                .map((task) => {
                  const manager = allUsers.find(user => 
                    user.id === task.manager_id
                  );
                  
                  return (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <View style={styles.taskInfo}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <Text style={styles.taskManager}>
                            {manager?.full_name || manager?.username || 'Manager inconnu'} - {task.manager_section}
                          </Text>
                        </View>
                        <View style={[
                          styles.taskStatus,
                          { backgroundColor: task.is_pinned ? '#f59e0b' : '#3b82f6' }
                        ]}>
                          <Text style={styles.taskStatusText}>
                            {task.is_pinned ? 'Épinglée' : 'Planifiée'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.taskDetails}>
                        <View style={styles.taskDetailRow}>
                          <Clock color="#6b7280" size={14} strokeWidth={2} />
                          <Text style={styles.taskDetailText}>
                            {new Date(task.date).toLocaleDateString('fr-FR')} • {task.start_time} - {task.end_time}
                          </Text>
                        </View>
                        
                        <View style={styles.taskDetailRow}>
                          <Package color="#6b7280" size={14} strokeWidth={2} />
                          <Text style={styles.taskDetailText}>
                            {task.packages} colis • {task.team_size} équipiers
                          </Text>
                        </View>
                        
                        {task.palette_condition && (
                          <View style={styles.taskDetailRow}>
                            <AlertTriangle color="#f59e0b" size={14} strokeWidth={2} />
                            <Text style={styles.taskDetailText}>Condition palette requise</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.taskProgress}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: '0%',
                                backgroundColor: '#3b82f6'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.taskProgressText}>En attente de début</Text>
                      </View>
                    </View>
                  );
                })
            )}
            
            {allTasks.filter(task => !task.is_completed).length > 10 && (
              <TouchableOpacity 
                style={styles.viewAllTasksButton}
                onPress={() => router.push('/all-tasks')}
              >
                <Text style={styles.viewAllTasksText}>
                  Voir toutes les tâches ({allTasks.filter(task => !task.is_completed).length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Évolution Globale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évolution Globale</Text>
          
          {/* Performance Chart intégré dans Évolution Globale */}
          <PerformanceChart 
            data={managersPerformance}
            title="Traitement des colis - 30 derniers jours"
          />
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

      {/* Working Hours Configuration Modal */}
      <Modal
        visible={showWorkingHoursModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWorkingHoursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Clock color="#f59e0b" size={24} strokeWidth={2} />
              <Text style={styles.modalTitle}>Configuration des horaires</Text>
              <TouchableOpacity onPress={() => setShowWorkingHoursModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalMessage}>
              Configurez les heures d'ouverture et de fermeture du magasin. Ces horaires seront utilisés pour valider les tâches des managers.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Heure d'ouverture</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={openStartTimePicker}
              >
                <Clock color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={styles.timeButtonText}>{tempWorkingHours.start}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Heure de fermeture</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={openEndTimePicker}
              >
                <Clock color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={styles.timeButtonText}>{tempWorkingHours.end}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.currentHoursInfo}>
              <Text style={styles.currentHoursLabel}>Horaires actuels :</Text>
              <Text style={styles.currentHoursValue}>{workingHours.start} - {workingHours.end}</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadWorkingHours}
              >
                <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowWorkingHoursModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.primaryButton,
                  isSavingHours && styles.disabledButton
                ]}
                onPress={saveWorkingHours}
                disabled={isSavingHours}
              >
                <Text style={styles.primaryButtonText}>
                  {isSavingHours ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        visible={showAssignTaskModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAssignTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Target color="#8b5cf6" size={24} strokeWidth={2} />
              <Text style={styles.modalTitle}>Attribuer une tâche</Text>
              <TouchableOpacity onPress={() => setShowAssignTaskModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              Sélectionnez un manager/rayon et créez une tâche avec un indice d'importance.
            </Text>

            {/* Sélection du manager */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Manager / Rayon *</Text>
              <TouchableOpacity 
                style={styles.managerSelector}
                onPress={() => setShowManagerSelector(true)}
              >
                {selectedManager ? (
                  <View style={styles.selectedManager}>
                    <Users color="#3b82f6" size={20} strokeWidth={2} />
                    <View style={styles.managerInfo}>
                      <Text style={styles.managerName}>{selectedManager.full_name}</Text>
                      <Text style={styles.managerSection}>{selectedManager.section}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.managerSelectorPlaceholder}>
                    Sélectionner un manager...
                  </Text>
                )}
                <ChevronDown color="#6b7280" size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Titre de la tâche */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Titre de la tâche *</Text>
              <TextInput
                style={styles.input}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Ex: Réapprovisionnement fruits"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Description détaillée de la tâche..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar color="#3b82f6" size={20} strokeWidth={2} />
                <Text style={styles.dateButtonText}>
                  {new Date(taskDate).toLocaleDateString('fr-FR')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Horaires */}
            <View style={styles.timeContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Heure de début *</Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => openTimePicker('start')}
                >
                  <Clock color="#3b82f6" size={20} strokeWidth={2} />
                  <Text style={styles.timeButtonText}>{taskStartTime}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Heure de fin *</Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => openTimePicker('end')}
                >
                  <Clock color="#3b82f6" size={20} strokeWidth={2} />
                  <Text style={styles.timeButtonText}>{taskEndTime}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Détails de la tâche */}
            <View style={styles.taskDetailsContainer}>
              <View style={styles.taskDetailInput}>
                <Text style={styles.inputLabel}>Nombre de colis (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  value={taskPackages}
                  onChangeText={setTaskPackages}
                  placeholder="10"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.taskDetailInput}>
                <Text style={styles.inputLabel}>Taille équipe *</Text>
                <TextInput
                  style={styles.input}
                  value={taskTeamSize}
                  onChangeText={setTaskTeamSize}
                  placeholder="2"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Priorité */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Priorité *</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      taskPriority === priority && { 
                        backgroundColor: getPriorityColor(priority),
                        borderColor: getPriorityColor(priority)
                      }
                    ]}
                    onPress={() => setTaskPriority(priority)}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      taskPriority === priority && styles.priorityButtonTextSelected
                    ]}>
                      {getPriorityText(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Option de notification urgente */}
            {taskPriority === 'urgent' && (
              <View style={styles.inputContainer}>
                <View style={styles.notificationOptionContainer}>
                  <View style={styles.notificationOptionInfo}>
                    <Bell color="#ef4444" size={20} strokeWidth={2} />
                    <View style={styles.notificationOptionText}>
                      <Text style={styles.notificationOptionTitle}>Notification urgente</Text>
                      <Text style={styles.notificationOptionDescription}>
                        Envoyer une notification immédiate au téléphone du manager
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.notificationToggle,
                      sendUrgentNotification && styles.notificationToggleActive
                    ]}
                    onPress={() => setSendUrgentNotification(!sendUrgentNotification)}
                  >
                    <Animated.View 
                      style={[
                        styles.notificationToggleCircle,
                        {
                          transform: [{
                            translateX: toggleAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 20],
                            })
                          }]
                        }
                      ]} 
                    />
                  </TouchableOpacity>
                </View>
                {sendUrgentNotification && (
                  <View style={styles.notificationWarning}>
                    <AlertTriangle color="#ef4444" size={16} strokeWidth={2} />
                    <Text style={styles.notificationWarningText}>
                      Une notification urgente sera envoyée immédiatement au manager
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowAssignTaskModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.primaryButton,
                  isCreatingTask && styles.disabledButton
                ]}
                onPress={() => {
                  console.log('🔘 Bouton "Attribuer la tâche" cliqué');
                  assignTaskToManager();
                }}
                disabled={isCreatingTask}
              >
                <Text style={styles.primaryButtonText}>
                  {isCreatingTask ? 'Attribution...' : 'Attribuer la tâche'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Manager Selector Modal */}
      <Modal
        visible={showManagerSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowManagerSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Users color="#3b82f6" size={24} strokeWidth={2} />
              <Text style={styles.modalTitle}>Sélectionner un manager</Text>
              <TouchableOpacity onPress={() => setShowManagerSelector(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.managerList}>
              {managers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users color="#9ca3af" size={48} strokeWidth={2} />
                  <Text style={styles.emptyStateText}>Aucun manager disponible</Text>
                </View>
              ) : (
                managers.map((manager) => (
                  <TouchableOpacity
                    key={manager.id}
                    style={[
                      styles.managerOption,
                      selectedManager?.id === manager.id && styles.selectedManagerOption
                    ]}
                    onPress={() => {
                      setSelectedManager(manager);
                      setShowManagerSelector(false);
                    }}
                  >
                    <View style={styles.managerOptionInfo}>
                      <Text style={styles.managerOptionName}>{manager.full_name}</Text>
                      <Text style={styles.managerOptionSection}>{manager.section}</Text>
                    </View>
                    {selectedManager?.id === manager.id && (
                      <CheckCircle color="#10b981" size={20} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Calendar color="#3b82f6" size={24} strokeWidth={2} />
              <Text style={styles.modalTitle}>Sélectionner une date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateList}>
              {Array.from({ length: 14 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dateString = date.toISOString().split('T')[0];
                const isSelected = taskDate === dateString;
                
                return (
                  <TouchableOpacity
                    key={dateString}
                    style={[
                      styles.dateOption,
                      isSelected && styles.selectedDateOption
                    ]}
                    onPress={() => {
                      setTaskDate(dateString);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      isSelected && styles.selectedDateOptionText
                    ]}>
                      {date.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </Text>
                    {isSelected && (
                      <CheckCircle color="#ffffff" size={20} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              <Clock color="#3b82f6" size={24} strokeWidth={2} />
              <Text style={styles.modalTitle}>
                {timePickerMode === 'start' ? 'Heure de début' : 'Heure de fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Heures</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[
                        styles.timeOption,
                        (timePickerMode === 'start' ? taskStartTime : taskEndTime).split(':')[0] === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => {
                        const currentTime = timePickerMode === 'start' ? taskStartTime : taskEndTime;
                        const newTime = `${hour}:${currentTime.split(':')[1]}`;
                        if (timePickerMode === 'start') {
                          setTaskStartTime(newTime);
                        } else {
                          setTaskEndTime(newTime);
                        }
                      }}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        (timePickerMode === 'start' ? taskStartTime : taskEndTime).split(':')[0] === hour && styles.selectedTimeText
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
                  {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timeOption,
                        (timePickerMode === 'start' ? taskStartTime : taskEndTime).split(':')[1] === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => {
                        const currentTime = timePickerMode === 'start' ? taskStartTime : taskEndTime;
                        const newTime = `${currentTime.split(':')[0]}:${minute}`;
                        if (timePickerMode === 'start') {
                          setTaskStartTime(newTime);
                        } else {
                          setTaskEndTime(newTime);
                        }
                      }}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        (timePickerMode === 'start' ? taskStartTime : taskEndTime).split(':')[1] === minute && styles.selectedTimeText
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
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.primaryButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  mainTitleContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
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
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
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
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
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
  // Styles pour les tâches planifiées
  tasksContainer: {
    gap: 12,
  },
  emptyTasksState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  emptyTasksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyTasksSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  viewAllTasksButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllTasksText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  taskManager: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  taskDetails: {
    marginBottom: 12,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  taskProgress: {
    marginTop: 8,
  },
  taskProgressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  viewAllTasksButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllTasksText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },

  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  taskDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  taskDetailInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  priorityButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  priorityButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  managerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  selectedManager: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  managerSelectorPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  currentHoursInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentHoursLabel: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
  },
  currentHoursValue: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  managerList: {
    maxHeight: 300,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    textAlign: 'center',
  },
  managerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedManagerOption: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  managerOptionInfo: {
    flex: 1,
  },
  managerOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  managerOptionSection: {
    fontSize: 14,
    color: '#6b7280',
  },
  dateList: {
    maxHeight: 300,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedDateOption: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  selectedDateOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  timePickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  timePickerDivider: {
    paddingHorizontal: 20,
  },
  timePickerDividerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#3b82f6',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  selectedTimeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  urgentNotificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  urgentNotificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    flex: 1,
  },
  toggleContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  managerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  managerSection: {
    fontSize: 13,
    color: '#6b7280',
  },
  managerList: {
    maxHeight: 250,
  },
  managerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  managerOptionInfo: {
    flex: 1,
  },
  managerOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  managerOptionSection: {
    fontSize: 13,
    color: '#6b7280',
  },
  selectedManagerOption: {
    backgroundColor: '#e0e7ff',
    borderColor: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  dateList: {
    maxHeight: 200,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectedDateOption: {
    backgroundColor: '#3b82f6',
  },
  selectedDateOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
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
  timePickerDivider: {
    paddingHorizontal: 20,
  },
  timePickerDividerText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  currentHoursInfo: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  currentHoursLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  currentHoursValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  refreshButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  notificationOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  notificationOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  notificationOptionDescription: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 18,
  },
  notificationToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notificationToggleActive: {
    backgroundColor: '#ef4444',
  },
  notificationToggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  notificationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  notificationWarningText: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});