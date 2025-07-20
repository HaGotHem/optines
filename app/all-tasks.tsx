import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Package, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Pin,
  Target
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseTasks } from '../hooks/useSupabaseTasks';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';

export default function AllTasksScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'pinned'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Hooks pour récupérer les données
  const { tasks: allTasks, isLoading: tasksLoading } = useSupabaseTasks({});
  const { users: allUsers, isLoading: usersLoading } = useSupabaseUsers();

  // Filtrer les tâches
  const filteredTasks = allTasks.filter(task => {
    // Filtre par recherche
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.manager_section.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtre par statut
    let matchesStatus = true;
    switch (selectedFilter) {
      case 'pending':
        matchesStatus = !task.is_completed;
        break;
      case 'completed':
        matchesStatus = task.is_completed;
        break;
      case 'pinned':
        matchesStatus = task.is_pinned;
        break;
      default:
        matchesStatus = true;
    }

    // Filtre par date
    const matchesDate = selectedDate === '' || task.date === selectedDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Générer les dates disponibles
  const availableDates = [...new Set(allTasks.map(task => task.date))].sort();

  // Statistiques
  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(task => !task.is_completed).length,
    completed: allTasks.filter(task => task.is_completed).length,
    pinned: allTasks.filter(task => task.is_pinned).length,
  };

  const getStatusColor = (task: any) => {
    if (task.is_completed) return '#10b981';
    if (task.is_pinned) return '#f59e0b';
    return '#3b82f6';
  };

  const getStatusText = (task: any) => {
    if (task.is_completed) return 'Terminée';
    if (task.is_pinned) return 'Épinglée';
    return 'En cours';
  };

  const getStatusIcon = (task: any) => {
    if (task.is_completed) return <CheckCircle color="#10b981" size={16} strokeWidth={2} />;
    if (task.is_pinned) return <Pin color="#f59e0b" size={16} strokeWidth={2} />;
    return <Target color="#3b82f6" size={16} strokeWidth={2} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getManagerName = (managerId: string) => {
    const manager = allUsers.find(user => 
      user.app_metadata?.user_id?.toString() === managerId
    );
    return manager?.full_name || manager?.username || 'Manager inconnu';
  };

  if (tasksLoading || usersLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Chargement des tâches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Toutes les Tâches
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            {filteredTasks.length} tâches trouvées
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiques */}
        <View style={[styles.statsSection, isDark && styles.statsSectionDark]}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {stats.total}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Total</Text>
            </View>
            
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                {stats.pending}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>En cours</Text>
            </View>
            
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {stats.completed}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Terminées</Text>
            </View>
            
            <View style={[styles.statCard, isDark && styles.statCardDark]}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                {stats.pinned}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Épinglées</Text>
            </View>
          </View>
        </View>

        {/* Filtres */}
        <View style={[styles.filtersSection, isDark && styles.filtersSectionDark]}>
          {/* Barre de recherche */}
          <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
            <Search color={isDark ? '#9ca3af' : '#6b7280'} size={20} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              placeholder="Rechercher une tâche..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filtres par statut */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'all' && styles.filterButtonActive,
                isDark && styles.filterButtonDark
              ]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'all' && styles.filterButtonTextActive,
                isDark && styles.filterButtonTextDark
              ]}>
                Toutes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'pending' && styles.filterButtonActive,
                isDark && styles.filterButtonDark
              ]}
              onPress={() => setSelectedFilter('pending')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'pending' && styles.filterButtonTextActive,
                isDark && styles.filterButtonTextDark
              ]}>
                En cours
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'completed' && styles.filterButtonActive,
                isDark && styles.filterButtonDark
              ]}
              onPress={() => setSelectedFilter('completed')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'completed' && styles.filterButtonTextActive,
                isDark && styles.filterButtonTextDark
              ]}>
                Terminées
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'pinned' && styles.filterButtonActive,
                isDark && styles.filterButtonDark
              ]}
              onPress={() => setSelectedFilter('pinned')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'pinned' && styles.filterButtonTextActive,
                isDark && styles.filterButtonTextDark
              ]}>
                Épinglées
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Filtre par date */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateFilters}>
            <TouchableOpacity
              style={[
                styles.dateFilterButton,
                selectedDate === '' && styles.dateFilterButtonActive,
                isDark && styles.dateFilterButtonDark
              ]}
              onPress={() => setSelectedDate('')}
            >
              <Text style={[
                styles.dateFilterButtonText,
                selectedDate === '' && styles.dateFilterButtonTextActive,
                isDark && styles.dateFilterButtonTextDark
              ]}>
                Toutes les dates
              </Text>
            </TouchableOpacity>
            
            {availableDates.slice(0, 7).map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateFilterButton,
                  selectedDate === date && styles.dateFilterButtonActive,
                  isDark && styles.dateFilterButtonDark
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateFilterButtonText,
                  selectedDate === date && styles.dateFilterButtonTextActive,
                  isDark && styles.dateFilterButtonTextDark
                ]}>
                  {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Liste des tâches */}
        <View style={styles.tasksSection}>
          {filteredTasks.length === 0 ? (
            <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
              <Target color={isDark ? '#6b7280' : '#9ca3af'} size={48} strokeWidth={2} />
              <Text style={[styles.emptyStateText, isDark && styles.emptyStateTextDark]}>
                Aucune tâche trouvée
              </Text>
              <Text style={[styles.emptyStateSubtext, isDark && styles.emptyStateSubtextDark]}>
                Essayez de modifier vos filtres de recherche
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <View key={task.id} style={[styles.taskCard, isDark && styles.taskCardDark]}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, isDark && styles.taskTitleDark]}>
                      {task.title}
                    </Text>
                    <Text style={[styles.taskManager, isDark && styles.taskManagerDark]}>
                      {getManagerName(task.manager_id)} - {task.manager_section}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.taskStatus,
                    { backgroundColor: getStatusColor(task) }
                  ]}>
                    {getStatusIcon(task)}
                    <Text style={styles.taskStatusText}>
                      {getStatusText(task)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.taskDetails}>
                  <View style={styles.taskDetailRow}>
                    <Calendar color={isDark ? '#9ca3af' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.taskDetailText, isDark && styles.taskDetailTextDark]}>
                      {formatDate(task.date)}
                    </Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Clock color={isDark ? '#9ca3af' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.taskDetailText, isDark && styles.taskDetailTextDark]}>
                      {task.start_time} - {task.end_time} ({task.duration})
                    </Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Package color={isDark ? '#9ca3af' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.taskDetailText, isDark && styles.taskDetailTextDark]}>
                      {task.packages} colis à traiter
                    </Text>
                  </View>
                  
                  <View style={styles.taskDetailRow}>
                    <Users color={isDark ? '#9ca3af' : '#6b7280'} size={16} strokeWidth={2} />
                    <Text style={[styles.taskDetailText, isDark && styles.taskDetailTextDark]}>
                      {task.team_size} équipiers assignés
                    </Text>
                  </View>
                  
                  {task.palette_condition && (
                    <View style={styles.taskDetailRow}>
                      <AlertTriangle color="#f59e0b" size={16} strokeWidth={2} />
                      <Text style={[styles.taskDetailText, { color: '#f59e0b' }]}>
                        Condition palette requise
                      </Text>
                    </View>
                  )}
                </View>
                
                {task.description && (
                  <View style={styles.taskDescription}>
                    <Text style={[styles.descriptionText, isDark && styles.descriptionTextDark]}>
                      {task.description}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
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
  statsGrid: {
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
  },
  statValueDark: {
    color: '#f4f4f5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  filtersSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersSectionDark: {
    borderBottomColor: '#374151',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchContainerDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  searchInputDark: {
    color: '#f4f4f5',
  },
  filterButtons: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonDark: {
    backgroundColor: '#374151',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextDark: {
    color: '#9ca3af',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  dateFilters: {
    marginBottom: 8,
  },
  dateFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  dateFilterButtonDark: {
    backgroundColor: '#374151',
  },
  dateFilterButtonActive: {
    backgroundColor: '#10b981',
  },
  dateFilterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  dateFilterButtonTextDark: {
    color: '#9ca3af',
  },
  dateFilterButtonTextActive: {
    color: '#ffffff',
  },
  tasksSection: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  emptyStateDark: {
    backgroundColor: '#27272a',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateTextDark: {
    color: '#9ca3af',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyStateSubtextDark: {
    color: '#6b7280',
  },
  taskCard: {
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
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
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
  taskTitleDark: {
    color: '#f4f4f5',
  },
  taskManager: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskManagerDark: {
    color: '#9ca3af',
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
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
  taskDetailTextDark: {
    color: '#9ca3af',
  },
  taskDescription: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  taskDescriptionDark: {
    borderTopColor: '#374151',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  descriptionTextDark: {
    color: '#9ca3af',
  },
}); 