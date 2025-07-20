import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { ArrowLeft, Calendar, Clock, Package, Users, Plus, Edit, Trash2, Play, Pause, RotateCcw, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSupabaseEvents, ScheduledEvent } from '../../hooks/useSupabaseEvents';
import DatePickerCalendar from '../../components/DatePickerCalendar';

export default function RecurringEventsTab() {
  const { isDark } = useTheme();
  const { user } = useSupabaseAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // États pour la création d'événements
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventDuration, setEventDuration] = useState('60');
  const [eventPackages, setEventPackages] = useState('100');
  const [eventTeamSize, setEventTeamSize] = useState('2');
  const [eventRecurrenceType, setEventRecurrenceType] = useState<'daily'|'weekly'|'weekdays'|'custom'>('daily');
  const [eventCustomDays, setEventCustomDays] = useState<number[]>([]);
  const [eventStartDate, setEventStartDate] = useState(new Date());
  const [eventEndDate, setEventEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const managerId = parseInt(user?.app_metadata?.user_id?.toString() || user?.id?.toString() || '0');
  
  const {
    events,
    isLoading,
    error,
    createEvent,
    deleteEvent,
    updateEvent,
    toggleEventActive,
    generateTasksForDate,
    generateTasksForRange,
    getRecurrenceDescription,
    getNextOccurrence,
    getEventStats,
    refresh
  } = useSupabaseEvents({
    managerId: managerId
  });

  useEffect(() => {
    if (managerId) {
      refresh();
    }
  }, [managerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleDeleteEvent = (event: ScheduledEvent) => {
    Alert.alert(
      'Supprimer l\'événement récurrent',
      `Êtes-vous sûr de vouloir supprimer "${event.title}" ?\n\nCela supprimera l'événement récurrent mais pas les tâches déjà générées.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteEvent(event.id);
            if (result.success) {
              Alert.alert('Succès', 'Événement récurrent supprimé');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de supprimer l\'événement');
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (event: ScheduledEvent) => {
    const result = await toggleEventActive(event.id);
    if (result.success) {
      const status = !event.is_active ? 'activé' : 'désactivé';
      Alert.alert('Succès', `Événement ${status}`);
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de modifier l\'événement');
    }
  };

  const handleGenerateWeekTasks = async (event: ScheduledEvent) => {
    Alert.alert(
      'Générer les tâches',
      'Générer les tâches pour cette semaine à partir de cet événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: async () => {
            const today = new Date();
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
            
            const result = await generateTasksForRange(
              today.toISOString().split('T')[0],
              endOfWeek.toISOString().split('T')[0]
            );
            
            if (result.success) {
              Alert.alert('Succès', `${result.count} tâche(s) générée(s) pour cette semaine !`);
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de générer les tâches');
            }
          }
        }
      ]
    );
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRecurrenceIcon = (type: string) => {
    switch (type) {
      case 'daily': return '🔄';
      case 'weekly': return '📆';
      case 'weekdays': return '💼';
      case 'custom': return '⚙️';
      default: return '📅';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#ef4444';
  };

  const stats = getEventStats();

  if (!managerId || managerId === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, isDark && styles.textDark]}>
            Impossible de charger les événements récurrents
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isDark && styles.backButtonDark]}
        >
          <ArrowLeft color={isDark ? '#60a5fa' : '#3b82f6'} size={24} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.title, isDark && styles.textDark]}>Événements récurrents</Text>
          <Text style={[styles.subtitle, isDark && styles.textDark]}>
            Gérez vos tâches automatiques
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, isDark && styles.addButtonDark]}
        >
          <Plus color="#ffffff" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={[styles.statsSection, isDark && styles.sectionDark]}>
        <View style={[styles.statCard, isDark && styles.cardDark]}>
          <Text style={[styles.statNumber, isDark && styles.textDark]}>{stats.totalEvents}</Text>
          <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Total</Text>
        </View>
        <View style={[styles.statCard, isDark && styles.cardDark]}>
          <Text style={[styles.statNumber, { color: '#10b981' }, isDark && styles.textDark]}>{stats.activeEvents}</Text>
          <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Actifs</Text>
        </View>
        <View style={[styles.statCard, isDark && styles.cardDark]}>
          <Text style={[styles.statNumber, { color: '#ef4444' }, isDark && styles.textDark]}>{stats.inactiveEvents}</Text>
          <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Inactifs</Text>
        </View>
        <View style={[styles.statCard, isDark && styles.cardDark]}>
          <Text style={[styles.statNumber, isDark && styles.textDark]}>{stats.recurringEvents}</Text>
          <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Récurrents</Text>
        </View>
      </View>

      {/* Liste des événements */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#60a5fa' : '#3b82f6'}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.loadingText, isDark && styles.textDark]}>
              Chargement des événements...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, isDark && styles.textDark]}>
              Erreur: {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, isDark && styles.retryButtonDark]}
              onPress={onRefresh}
            >
              <Text style={[styles.retryButtonText, isDark && styles.textDark]}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar color={isDark ? '#64748b' : '#9ca3af'} size={64} strokeWidth={1} />
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
              Aucun événement récurrent
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.textSecondaryDark]}>
              Créez votre premier événement récurrent depuis le calculateur
            </Text>
            <TouchableOpacity
              style={[styles.createButton, isDark && styles.createButtonDark]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus color="#ffffff" size={20} strokeWidth={2} />
              <Text style={styles.createButtonText}>Créer un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          events.map((event) => {
            const nextOccurrence = getNextOccurrence(event);
            return (
              <View key={event.id} style={[styles.eventCard, isDark && styles.cardDark]}>
                {/* Header de l'événement */}
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleRow}>
                    <Text style={[styles.eventTitle, isDark && styles.textDark]}>{event.title} <Text style={{color:'#10b981', fontWeight:'bold'}}>• Récurrent</Text></Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Supprimer l\'événement récurrent',
                          `Voulez-vous vraiment supprimer "${event.title}" ?\n\nCela supprimera aussi toutes les tâches générées par cet événement.`,
                          [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'Supprimer',
                              style: 'destructive',
                              onPress: async () => {
                                const result = await deleteEvent(event.id);
                                if (result.success) {
                                  Alert.alert('Succès', 'Événement supprimé');
                                  refresh();
                                } else {
                                  Alert.alert('Erreur', result.error || 'Impossible de supprimer l\'événement');
                                }
                              }
                            }
                          ]
                        );
                      }}
                      style={{marginLeft: 8, padding: 4}}
                      accessibilityLabel="Supprimer l'événement"
                    >
                      <Trash2 color="#ef4444" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Détails de l'événement */}
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetailRow}>
                    <Clock color={isDark ? '#64748b' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.eventDetailText, isDark && styles.textSecondaryDark]}>
                      {formatTime(event.start_time)} ({event.duration_minutes} min)
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetailRow}>
                    <Package color={isDark ? '#64748b' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.eventDetailText, isDark && styles.textSecondaryDark]}>
                      {event.packages} colis
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetailRow}>
                    <Users color={isDark ? '#64748b' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.eventDetailText, isDark && styles.textSecondaryDark]}>
                      {event.team_size} équipier{event.team_size > 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetailRow}>
                    <Calendar color={isDark ? '#64748b' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.eventDetailText, isDark && styles.textSecondaryDark]}>
                      Du {formatDate(event.start_date)}
                      {event.end_date ? ` au ${formatDate(event.end_date)}` : ' (illimité)'}
                    </Text>
                  </View>

                  {nextOccurrence && (
                    <View style={[styles.nextOccurrence, isDark && styles.nextOccurrenceDark]}>
                      <Text style={[styles.nextOccurrenceText, isDark && styles.textSecondaryDark]}>
                        Prochaine occurrence : {formatDate(nextOccurrence.toISOString().split('T')[0])}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => handleToggleActive(event)}
                  >
                    {event.is_active ? (
                      <Pause color="#f59e0b" size={16} strokeWidth={2} />
                    ) : (
                      <Play color="#10b981" size={16} strokeWidth={2} />
                    )}
                    <Text style={[styles.actionButtonText, { color: event.is_active ? '#f59e0b' : '#10b981' }]}>
                      {event.is_active ? 'Pause' : 'Activer'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.generateButton]}
                    onPress={() => handleGenerateWeekTasks(event)}
                  >
                    <RotateCcw color="#3b82f6" size={16} strokeWidth={2} />
                    <Text style={[styles.actionButtonText, { color: '#3b82f6' }]}>
                      Générer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteEvent(event)}
                  >
                    <Trash2 color="#ef4444" size={16} strokeWidth={2} />
                    <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de création d'événement */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>Nouvel événement récurrent</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X color={isDark ? '#64748b' : '#6b7280'} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Titre *</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  placeholder="Ex: Inventaire mensuel"
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Heure de début *</Text>
                <TouchableOpacity 
                  style={[styles.dateSelector, isDark && styles.dateSelectorDark]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock color={isDark ? '#60a5fa' : '#3b82f6'} size={20} strokeWidth={2} />
                  <Text style={[styles.dateText, isDark && styles.textDark]}>
                    {eventStartTime}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Durée (minutes) *</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={eventDuration}
                  onChangeText={setEventDuration}
                  placeholder="Ex: 90"
                  keyboardType="numeric"
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Nombre de colis *</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={eventPackages}
                  onChangeText={setEventPackages}
                  placeholder="Ex: 150"
                  keyboardType="numeric"
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Taille de l'équipe *</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={eventTeamSize}
                  onChangeText={setEventTeamSize}
                  placeholder="Ex: 3"
                  keyboardType="numeric"
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Date de début *</Text>
                <TouchableOpacity 
                  style={[styles.dateSelector, isDark && styles.dateSelectorDark]} 
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Calendar color={isDark ? '#60a5fa' : '#3b82f6'} size={20} strokeWidth={2} />
                  <Text style={[styles.dateText, isDark && styles.textDark]}>
                    {eventStartDate.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Type de récurrence *</Text>
                <View style={styles.recurrenceButtons}>
                  {[
                    { label: 'Quotidien', value: 'daily' },
                    { label: 'Hebdomadaire', value: 'weekly' },
                    { label: 'Jours ouvrés', value: 'weekdays' },
                    { label: 'Personnalisé', value: 'custom' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.recurrenceButton,
                        eventRecurrenceType === option.value && styles.recurrenceButtonActive,
                        isDark && styles.recurrenceButtonDark
                      ]}
                      onPress={() => setEventRecurrenceType(option.value as any)}
                    >
                      <Text style={[
                        styles.recurrenceButtonText,
                        eventRecurrenceType === option.value && styles.recurrenceButtonTextActive,
                        isDark && styles.textDark
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {eventRecurrenceType === 'custom' && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, isDark && styles.textDark]}>Jours de la semaine</Text>
                  <View style={styles.daysSelector}>
                    {[
                      { day: 1, label: 'Lun' },
                      { day: 2, label: 'Mar' },
                      { day: 3, label: 'Mer' },
                      { day: 4, label: 'Jeu' },
                      { day: 5, label: 'Ven' },
                      { day: 6, label: 'Sam' },
                      { day: 0, label: 'Dim' }
                    ].map(({ day, label }) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          eventCustomDays.includes(day) && styles.dayButtonActive,
                          isDark && styles.dayButtonDark
                        ]}
                        onPress={() => {
                          if (eventCustomDays.includes(day)) {
                            setEventCustomDays(eventCustomDays.filter(d => d !== day));
                          } else {
                            setEventCustomDays([...eventCustomDays, day]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          eventCustomDays.includes(day) && styles.dayButtonTextActive,
                          isDark && styles.textDark
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={[styles.inputContainer]}>
                <Text style={[styles.inputLabel, isDark && styles.textDark]}>Date limite de récurrence</Text>
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity style={[styles.dateSelector, isDark && styles.dateSelectorDark]} onPress={() => setShowEndDatePicker(true)}>
                    <Calendar color="#3b82f6" size={20} strokeWidth={2} />
                    <Text style={[styles.dateText, isDark && styles.textDark]}>{eventEndDate ? eventEndDate.toLocaleDateString('fr-FR') : 'Aucune (illimitée)'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, isDark && styles.modalButtonDark]} 
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalButtonText, isDark && styles.textDark]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton, isDark && styles.primaryButtonDark]}
                onPress={async () => {
                  if (!eventTitle.trim() || !eventStartTime || !eventDuration || !eventPackages || !eventTeamSize) {
                    Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
                    return;
                  }

                  if (eventRecurrenceType === 'custom' && eventCustomDays.length === 0) {
                    Alert.alert('Erreur', 'Veuillez sélectionner au moins un jour pour la récurrence personnalisée');
                    return;
                  }

                  const eventData = {
                    title: eventTitle,
                    start_time: eventStartTime,
                    duration_minutes: parseInt(eventDuration),
                    packages: parseInt(eventPackages),
                    team_size: parseInt(eventTeamSize),
                    manager_section: 'Section A', // À adapter selon le profil utilisateur
                    manager_initials: 'MA', // À adapter selon le profil utilisateur
                    palette_condition: false,
                    recurrence_type: eventRecurrenceType,
                    recurrence_days: eventRecurrenceType === 'custom' ? eventCustomDays : null,
                    start_date: eventStartDate.toISOString().split('T')[0],
                    end_date: eventEndDate ? eventEndDate.toISOString().split('T')[0] : null,
                    manager_id: managerId,
                    store_id: 1, // À adapter selon le magasin de l'utilisateur
                    is_active: true
                  };

                  const result = await createEvent(eventData);
                  if (result.success) {
                    setShowCreateModal(false);
                    // Réinitialiser les champs
                    setEventTitle('');
                    setEventStartTime('09:00');
                    setEventDuration('60');
                    setEventPackages('100');
                    setEventTeamSize('2');
                    setEventRecurrenceType('daily');
                    setEventCustomDays([]);
                    setEventStartDate(new Date());
                    setEventEndDate(null);
                    Alert.alert('Succès', 'Événement récurrent créé !');
                  } else {
                    Alert.alert('Erreur', result.error || 'Erreur lors de la création');
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DatePicker pour la date de début */}
      <DatePickerCalendar
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onDateSelect={setEventStartDate}
        selectedDate={eventStartDate}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
      />

      {/* DatePicker pour la date de fin */}
      <DatePickerCalendar
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onDateSelect={setEventEndDate}
        selectedDate={eventEndDate || new Date()}
        minDate={eventStartDate}
        maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
      />

      {/* TimePicker pour l'heure de début */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timePickerOverlay}>
          <View style={[styles.timePickerContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.timePickerTitle, isDark && styles.textDark]}>Sélectionner l'heure</Text>
            <View style={styles.timePickerGrid}>
              {Array.from({ length: 24 }, (_, hour) => (
                <View key={hour} style={styles.timePickerRow}>
                  {Array.from({ length: 4 }, (_, minuteIndex) => {
                    const minute = minuteIndex * 15;
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    return (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timeButton,
                          eventStartTime === timeString && styles.timeButtonActive,
                          isDark && styles.timeButtonDark
                        ]}
                        onPress={() => {
                          setEventStartTime(timeString);
                          setShowTimePicker(false);
                        }}
                      >
                        <Text style={[
                          styles.timeButtonText,
                          eventStartTime === timeString && styles.timeButtonTextActive,
                          isDark && styles.textDark
                        ]}>
                          {timeString}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalButton, isDark && styles.modalButtonDark]}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={[styles.modalButtonText, isDark && styles.textDark]}>Fermer</Text>
            </TouchableOpacity>
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
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
  },
  backButtonDark: {
    backgroundColor: '#374151',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
  },
  addButtonDark: {
    backgroundColor: '#1d4ed8',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  sectionDark: {
    backgroundColor: '#1e293b',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardDark: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonDark: {
    backgroundColor: '#1d4ed8',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonDark: {
    backgroundColor: '#374151',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    marginBottom: 16,
  },
  eventTitleSection: {
    gap: 8,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventIcon: {
    fontSize: 24,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  nextOccurrence: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  nextOccurrenceDark: {
    backgroundColor: '#1e3a8a',
  },
  nextOccurrenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleButton: {
    backgroundColor: 'transparent',
    borderColor: '#e5e7eb',
  },
  generateButton: {
    backgroundColor: 'transparent',
    borderColor: '#e5e7eb',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textDark: {
    color: '#f1f5f9',
  },
  textSecondaryDark: {
    color: '#94a3b8',
  },
  // Styles pour le modal
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
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: '#1f2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
    color: '#f4f4f5',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    alignSelf: 'stretch',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  dateSelectorDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  dateTextDark: {
    color: '#f4f4f5',
  },
  recurrenceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  recurrenceButtonDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
  },
  recurrenceButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  recurrenceButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  recurrenceButtonTextActive: {
    color: '#ffffff',
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  dayButtonDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
  },
  dayButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  dayButtonTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  modalButtonDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  primaryButtonDark: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  timePickerGrid: {
    maxHeight: 300,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  timeButtonDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
  },
  timeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timeButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  timeButtonTextActive: {
    color: '#ffffff',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignSelf: 'stretch',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  textDark: {
    color: '#f4f4f5',
  },
}); 