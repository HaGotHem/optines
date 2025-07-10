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
} from 'react-native';
import { ArrowLeft, Calendar, Clock, Package, Users, Plus, Edit, Trash2, Play, Pause, RotateCcw } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSupabaseEvents, ScheduledEvent } from '../../hooks/useSupabaseEvents';

export default function RecurringEventsTab() {
  const { isDark } = useTheme();
  const { user } = useSupabaseAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const managerId = user?.app_metadata?.user_id?.toString() || user?.id?.toString();
  
  const {
    events,
    isLoading,
    error,
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

  if (!managerId) {
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
          onPress={() => router.push('/(manager-tabs)/calculator')}
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
              onPress={() => router.push('/(manager-tabs)/calculator')}
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
                  <View style={styles.eventTitleSection}>
                    <View style={styles.eventTitleRow}>
                      <Text style={styles.eventIcon}>
                        {getRecurrenceIcon(event.recurrence_type)}
                      </Text>
                      <Text style={[styles.eventTitle, isDark && styles.textDark]}>
                        {event.title}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(event.is_active) }
                      ]}>
                        <Text style={styles.statusText}>
                          {event.is_active ? 'Actif' : 'Inactif'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.eventDescription, isDark && styles.textSecondaryDark]}>
                      {getRecurrenceDescription(event)}
                    </Text>
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
}); 