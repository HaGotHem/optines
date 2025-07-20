import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  Coffee, 
  Users, 
  Target,
  Settings,
  CheckCircle
} from 'lucide-react-native';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useSupabaseEmployees } from '../../hooks/useSupabaseEmployees';
import { useSupabaseBreaks } from '../../hooks/useSupabaseBreaks';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface EmployeeSchedule {
  id: number;
  name: string;
  workingDays: number[]; // 0=Dimanche, 1=Lundi, etc.
  workingHours: {
    start: string;
    end: string;
  };
}

interface ScheduleItem {
  id: string;
  type: 'task' | 'break' | 'event';
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  description?: string;
}

export default function EmployeeScheduleScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useSupabaseAuth();
  const { profile } = useUserProfile();
  
  // États pour la gestion des employés
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  
  // États pour le calendrier
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // États pour les jours de travail
  const [showWorkingDaysModal, setShowWorkingDaysModal] = useState(false);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lun-Ven par défaut
  const [workingHours, setWorkingHours] = useState({
    start: '08:00',
    end: '18:00'
  });
  
  // États pour les événements
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'event' as 'task' | 'break' | 'event',
    description: ''
  });

  // Récupération des employés du manager
  const { employees: teamMembers } = useSupabaseEmployees(
    profile?.section ? { section: profile.section } : undefined
  );

  // Récupération des pauses de l'employé sélectionné
  const { breaks } = useSupabaseBreaks({
    employee_id: selectedEmployee?.id,
    date: selectedDate.toISOString().split('T')[0]
  });

  // Récupération des tâches de l'employé sélectionné
  const { tasks } = useSupabaseTasks({
    managerId: user?.id?.toString()
  });

  // Génération des heures de la journée
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
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

  // Vérifier si un jour est un jour de travail
  const isWorkingDay = (date: Date) => {
    return workingDays.includes(date.getDay());
  };

  // Obtenir les événements pour une date et heure données
  const getEventsForTimeSlot = (date: Date, timeSlot: string) => {
    const dateString = date.toISOString().split('T')[0];
    const events: ScheduleItem[] = [];
    
    // Ajouter les pauses
    breaks.forEach(breakItem => {
      if (breakItem.date === dateString) {
        const startHour = breakItem.start_time.split(':')[0];
        if (timeSlot.startsWith(startHour)) {
          events.push({
            id: `break-${breakItem.id}`,
            type: 'break',
            title: breakItem.break_type === 'pause' ? 'Pause' : breakItem.break_type,
            startTime: breakItem.start_time,
            endTime: breakItem.end_time,
            color: '#3b82f6',
            description: breakItem.description
          });
        }
      }
    });
    
    // Ajouter les tâches
    tasks.forEach(task => {
      if (task.date === dateString) {
        const startHour = task.start_time.split(':')[0];
        if (timeSlot.startsWith(startHour)) {
          events.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title,
            startTime: task.start_time,
            endTime: task.end_time,
            color: '#10b981',
            description: task.description
          });
        }
      }
    });
    
    return events;
  };

  // Navigation dans le calendrier
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Gestion des jours de travail
  const toggleWorkingDay = (dayIndex: number) => {
    setWorkingDays(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const saveWorkingDays = () => {
    // Ici vous pouvez sauvegarder les jours de travail dans la base de données
    Alert.alert('Succès', 'Jours de travail mis à jour');
    setShowWorkingDaysModal(false);
  };

  // Gestion des événements
  const addEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Ici vous pouvez sauvegarder l'événement dans la base de données
    Alert.alert('Succès', 'Événement ajouté');
    setShowAddEventModal(false);
    setNewEvent({
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      type: 'event',
      description: ''
    });
  };

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

  const timeSlots = generateTimeSlots();
  const weekDays = generateWeekDays();

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Planning Employé
          </Text>
          {selectedEmployee && (
            <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
              {selectedEmployee.name}
            </Text>
          )}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowWorkingDaysModal(true)}
            style={styles.headerButton}
          >
            <Settings color={isDark ? '#f4f4f5' : '#1a1a1a'} size={20} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowAddEventModal(true)}
            style={styles.headerButton}
          >
            <Plus color={isDark ? '#f4f4f5' : '#1a1a1a'} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sélecteur d'employé */}
      {!selectedEmployee ? (
        <View style={styles.employeeSelector}>
          <Text style={[styles.selectorTitle, isDark && styles.selectorTitleDark]}>
            Sélectionnez un employé
          </Text>
          <ScrollView style={styles.employeeList}>
            {teamMembers.map(employee => (
              <TouchableOpacity
                key={employee.id}
                style={[styles.employeeCard, isDark && styles.employeeCardDark]}
                onPress={() => setSelectedEmployee(employee)}
              >
                <View style={styles.employeeInfo}>
                  <Text style={[styles.employeeName, isDark && styles.employeeNameDark]}>
                    {employee.name}
                  </Text>
                  <Text style={[styles.employeeRole, isDark && styles.employeeRoleDark]}>
                    {employee.role}
                  </Text>
                </View>
                <ChevronRight color={isDark ? '#6b7280' : '#9ca3af'} size={20} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <>
          {/* Navigation du calendrier */}
          <View style={[styles.calendarHeader, isDark && styles.calendarHeaderDark]}>
            <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
              <ChevronLeft color={isDark ? '#f4f4f5' : '#1a1a1a'} size={20} strokeWidth={2} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Aujourd'hui</Text>
            </TouchableOpacity>
            
            <Text style={[styles.weekTitle, isDark && styles.weekTitleDark]}>
              {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
            </Text>
            
            <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
              <ChevronRight color={isDark ? '#f4f4f5' : '#1a1a1a'} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Calendrier */}
          <ScrollView style={styles.calendarContainer} horizontal>
            <View style={styles.calendarGrid}>
              {/* En-têtes des jours */}
              <View style={styles.timeColumn}>
                <View style={styles.timeHeader} />
                {timeSlots.map(timeSlot => (
                  <View key={timeSlot} style={styles.timeSlot}>
                    <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
                      {timeSlot}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Colonnes des jours */}
              {weekDays.map((day, dayIndex) => (
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
                    const events = getEventsForTimeSlot(day, timeSlot);
                    const isWorking = isWorkingDay(day);
                    
                    return (
                      <View 
                        key={timeSlot} 
                        style={[
                          styles.calendarCell,
                          !isWorking && styles.nonWorkingCell,
                          isDark && styles.calendarCellDark
                        ]}
                      >
                        {events.map(event => (
                          <View
                            key={event.id}
                            style={[
                              styles.eventItem,
                              { backgroundColor: event.color }
                            ]}
                          >
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.eventTime}>
                              {event.startTime} - {event.endTime}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* Modal des jours de travail */}
      <Modal
        visible={showWorkingDaysModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowWorkingDaysModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowWorkingDaysModal(false)}>
              <X color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              Jours de travail
            </Text>
            <TouchableOpacity onPress={saveWorkingDays} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.workingDaysSection}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Jours de travail
              </Text>
              <View style={styles.daysGrid}>
                {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.dayButton,
                      workingDays.includes(dayIndex) && styles.dayButtonSelected,
                      isDark && styles.dayButtonDark
                    ]}
                    onPress={() => toggleWorkingDay(dayIndex)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      workingDays.includes(dayIndex) && styles.dayButtonTextSelected,
                      isDark && styles.dayButtonTextDark
                    ]}>
                      {getDayName(dayIndex)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.workingHoursSection}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Heures de travail
              </Text>
              <View style={styles.hoursRow}>
                <View style={styles.hourInput}>
                  <Text style={[styles.hourLabel, isDark && styles.hourLabelDark]}>Début</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={workingHours.start}
                    onChangeText={(text) => setWorkingHours(prev => ({ ...prev, start: text }))}
                    placeholder="08:00"
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  />
                </View>
                <View style={styles.hourInput}>
                  <Text style={[styles.hourLabel, isDark && styles.hourLabelDark]}>Fin</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={workingHours.end}
                    onChangeText={(text) => setWorkingHours(prev => ({ ...prev, end: text }))}
                    placeholder="18:00"
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal d'ajout d'événement */}
      <Modal
        visible={showAddEventModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowAddEventModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddEventModal(false)}>
              <X color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              Nouvel événement
            </Text>
            <TouchableOpacity onPress={addEvent} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Titre</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
                placeholder="Titre de l'événement"
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Type</Text>
              <View style={styles.typeSelector}>
                {[
                  { key: 'task', label: 'Tâche', icon: Target, color: '#10b981' },
                  { key: 'break', label: 'Pause', icon: Coffee, color: '#3b82f6' },
                  { key: 'event', label: 'Événement', icon: Users, color: '#f59e0b' }
                ].map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      newEvent.type === type.key && styles.typeOptionSelected,
                      isDark && styles.typeOptionDark
                    ]}
                    onPress={() => setNewEvent(prev => ({ ...prev, type: type.key as any }))}
                  >
                    <type.icon 
                      color={newEvent.type === type.key ? '#ffffff' : type.color} 
                      size={16} 
                      strokeWidth={2} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      newEvent.type === type.key && styles.typeOptionTextSelected,
                      isDark && styles.typeOptionTextDark
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Heures</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>Début</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={newEvent.startTime}
                    onChangeText={(text) => setNewEvent(prev => ({ ...prev, startTime: text }))}
                    placeholder="09:00"
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  />
                </View>
                <View style={styles.timeInput}>
                  <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>Fin</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={newEvent.endTime}
                    onChangeText={(text) => setNewEvent(prev => ({ ...prev, endTime: text }))}
                    placeholder="10:00"
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Description (optionnel)</Text>
              <TextInput
                style={[styles.textArea, isDark && styles.textAreaDark]}
                value={newEvent.description}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                placeholder="Description de l'événement..."
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerDark: {
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerTitleDark: {
    color: '#f4f4f5',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerSubtitleDark: {
    color: '#9ca3af',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  employeeSelector: {
    flex: 1,
    padding: 20,
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  selectorTitleDark: {
    color: '#f4f4f5',
  },
  employeeList: {
    flex: 1,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  employeeCardDark: {
    backgroundColor: '#27272a',
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarHeaderDark: {
    borderBottomColor: '#374151',
  },
  navButton: {
    padding: 8,
  },
  todayButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  weekTitleDark: {
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
  },
  timeSlot: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
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
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: 2,
  },
  calendarCellDark: {
    borderBottomColor: '#374151',
  },
  nonWorkingCell: {
    backgroundColor: '#f9fafb',
  },
  eventItem: {
    padding: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 8,
    color: '#ffffff',
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalContainerDark: {
    backgroundColor: '#18181b',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalTitleDark: {
    color: '#f4f4f5',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  workingDaysSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#f4f4f5',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayButtonDark: {
    borderColor: '#374151',
  },
  dayButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dayButtonTextDark: {
    color: '#9ca3af',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },
  workingHoursSection: {
    marginBottom: 24,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 12,
  },
  hourInput: {
    flex: 1,
  },
  hourLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  hourLabelDark: {
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
    borderColor: '#374151',
    backgroundColor: '#27272a',
    color: '#f4f4f5',
  },
  inputSection: {
    marginBottom: 20,
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
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  typeOptionDark: {
    borderColor: '#374151',
    backgroundColor: '#27272a',
  },
  typeOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  typeOptionTextDark: {
    color: '#9ca3af',
  },
  typeOptionTextSelected: {
    color: '#ffffff',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  timeLabelDark: {
    color: '#f4f4f5',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#374151',
    backgroundColor: '#27272a',
    color: '#f4f4f5',
  },
}); 