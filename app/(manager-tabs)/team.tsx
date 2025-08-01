import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { 
  Users, Phone, Mail, MapPin, Clock, X, UserPlus, Calendar, 
  Target, Edit, ChevronDown, ArrowLeft, Coffee, BarChart3, Search,
  Filter, TrendingUp, Activity
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSupabaseEmployees } from '../../hooks/useSupabaseEmployees';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import BreakManager from '../../components/BreakManager';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  section: string;
  status: 'online' | 'busy' | 'offline' | 'break';
  rating: number;
  location: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  shift: string;
  performance: number;
  tasks_completed: number;
  manager_id: number;
  store_id: number;
}

export default function TeamTab() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberSection, setNewMemberSection] = useState('');
  const [newMemberLocation, setNewMemberLocation] = useState('');
  const [newMemberShift, setNewMemberShift] = useState('matin');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  
  // États pour la modification d'un membre
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // États pour le sélecteur d'horaires
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [shiftPresets, setShiftPresets] = useState([
    'matin',
    'après-midi',
    'soir'
  ]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPreset, setNewPreset] = useState('');

  // États pour la confirmation de suppression
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{id: number, name: string} | null>(null);

  // États pour la gestion des pauses
  const [showBreakManager, setShowBreakManager] = useState(false);
  const [selectedEmployeeForBreaks, setSelectedEmployeeForBreaks] = useState<any>(null);

  // État pour la recherche
  const [searchQuery, setSearchQuery] = useState('');

  // Hooks
  const { user: authUser } = useSupabaseAuth();
  const { profile: userProfile } = useUserProfile();
  
  // Filtrer les employés par section du manager
  const { 
    employees: teamMembers, 
    isLoading: employeesLoading, 
    error: employeesError,
    createEmployee, 
    updateEmployee, 
    deleteEmployee
  } = useSupabaseEmployees(
    userProfile?.section ? { section: userProfile.section } : undefined
  );

  // Récupérer les tâches du rayon pour les statistiques
  const { tasks: rayonTasks, isLoading: tasksLoading } = useSupabaseTasks({
    managerId: userProfile?.id?.toString(),
    date: new Date().toISOString().split('T')[0] // Aujourd'hui
  });

  // Debug: Monitor team members state
  useEffect(() => {
    console.log('🟩 [DEBUG] TeamTab - userProfile:', userProfile);
    console.log('Team members state updated:', teamMembers);
    console.log('Team members IDs:', teamMembers.map(m => m.id));
  }, [userProfile, teamMembers]);

  // Calculer les statistiques réelles
  const stats = useMemo(() => {
    const totalEmployees = teamMembers.length;
    
    // Performance moyenne du rayon (moyenne des performances individuelles)
    const averagePerformance = totalEmployees > 0 
      ? Math.round(teamMembers.reduce((sum, emp) => sum + emp.performance, 0) / totalEmployees)
      : 0;
    
    // Employés actuellement en train de faire une tâche (status = 'busy')
    const activeEmployees = teamMembers.filter(emp => emp.status === 'busy').length;
    
    // Nombre de colis traités aujourd'hui (somme des packages des tâches du jour)
    const packagesToday = rayonTasks.reduce((sum, task) => sum + (task.packages || 0), 0);
    
    return {
      totalEmployees,
      averagePerformance,
      activeEmployees,
      packagesToday
    };
  }, [teamMembers, rayonTasks]);

  const isLoading = employeesLoading || tasksLoading;

  // Filtrer les employés selon la recherche
  const filteredTeamMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return teamMembers;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return teamMembers.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.section.toLowerCase().includes(query) ||
      member.location.toLowerCase().includes(query) ||
      member.shift.toLowerCase().includes(query) ||
      (member.email && member.email.toLowerCase().includes(query)) ||
      (member.phone && member.phone.toLowerCase().includes(query))
    );
  }, [teamMembers, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'break': return '#3b82f6';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'busy': return 'Occupé';
      case 'break': return 'En pause';
      case 'offline': return 'Hors ligne';
      default: return 'Inconnu';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return '#10b981';
    if (performance >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const addNewMember = async () => {
    if (!newMemberName.trim() || !newMemberRole.trim() || !newMemberSection.trim() || !newMemberLocation.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!userProfile?.id || !userProfile?.store_id) {
      Alert.alert('Erreur', 'Impossible de récupérer les informations du manager');
      return;
    }

    try {
      const memberData = {
        name: newMemberName.trim(),
        role: newMemberRole.trim(),
        section: newMemberSection.trim(),
        location: newMemberLocation.trim(),
        shift: newMemberShift as 'matin' | 'après-midi' | 'soir',
        manager_id: parseInt(userProfile.id),
        store_id: userProfile.store_id
      };

      const result = await createEmployee(memberData);
      
      if (result.success) {
        Alert.alert('Succès', 'Employé ajouté avec succès');
        setShowAddMemberModal(false);
    setNewMemberName('');
    setNewMemberRole('');
        setNewMemberSection('');
        setNewMemberLocation('');
        setNewMemberShift('matin');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'ajout de l\'employé');
    }
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditRole(member.role);
    setEditSection(member.section);
    setEditPhone(member.phone || '');
    setEditEmail(member.email || '');
    setEditLocation(member.location);
    setEditShift(member.shift);
    setEditAvatar(member.avatar_url || '');
    setShowEditMemberModal(true);
  };

  const saveMemberChanges = async () => {
    if (!editingMember || !editName.trim() || !editRole.trim() || !editSection.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const updates = {
        name: editName.trim(),
        role: editRole.trim(),
        section: editSection.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        location: editLocation.trim(),
        shift: editShift as 'matin' | 'après-midi' | 'soir'
      };

      const result = await updateEmployee(editingMember.id, updates);
      
      if (result.success) {
        Alert.alert('Succès', 'Employé mis à jour avec succès');
    setShowEditMemberModal(false);
    setEditingMember(null);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour de l\'employé');
    }
  };

  const scheduleMeeting = () => {
    if (!meetingTitle.trim() || !meetingTime.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    Alert.alert('Réunion planifiée', `Réunion "${meetingTitle}" planifiée pour ${meetingTime}`);
    setShowMeetingModal(false);
    setMeetingTitle('');
    setMeetingTime('');
  };

  const callMember = (phone: string, name: string) => {
    Alert.alert('Appel', `Appel en cours vers ${name} au ${phone}`);
  };

  const sendMessage = (email: string, name: string) => {
    Alert.alert('Message', `Message envoyé à ${name} à l'adresse ${email}`);
  };

  const removeMember = (memberId: number, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      const result = await deleteEmployee(memberToDelete.id);
      
      if (result.success) {
        Alert.alert('Succès', `${memberToDelete.name} a été supprimé de l'équipe`);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la suppression de l\'employé');
    } finally {
    setShowDeleteConfirmModal(false);
    setMemberToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setMemberToDelete(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const selectShift = (shift: string) => {
    setEditShift(shift);
    setShowShiftPicker(false);
  };

  // Fonctions pour la gestion des pauses
  const openBreakManager = (employee: any) => {
    setSelectedEmployeeForBreaks(employee);
    setShowBreakManager(true);
  };

  const closeBreakManager = () => {
    setShowBreakManager(false);
    setSelectedEmployeeForBreaks(null);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color={isDark ? "#f4f4f5" : "#3b82f6"} size={24} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={[styles.title, isDark && styles.titleDark]}>Équipe</Text>
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                {userProfile?.section || 'Rayon'} • {filteredTeamMembers.length} employés
              </Text>
            </View>
          </View>

          {/* Barre de recherche */}
          <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
            <Search color={isDark ? '#94a3b8' : '#64748b'} size={20} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              placeholder="Rechercher un employé..."
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

        {/* Team Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Users color="#3b82f6" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>{stats.totalEmployees}</Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Employés</Text>
          </View>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <TrendingUp color="#10b981" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {stats.averagePerformance}%
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Performance</Text>
          </View>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Activity color="#f59e0b" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {stats.activeEmployees}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Actifs</Text>
          </View>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Target color="#8b5cf6" size={20} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {stats.packagesToday}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Colis</Text>
          </View>
        </View>



        {/* Team Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Employés de la section</Text>
          </View>
          
          {filteredTeamMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color="#9ca3af" size={48} strokeWidth={2} />
              <Text style={styles.emptyStateText}>
                {searchQuery.trim() ? 'Aucun employé trouvé' : 'Aucun employé dans votre section'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery.trim() ? 'Essayez avec d\'autres termes de recherche' : 'Ajoutez des employés pour commencer'}
              </Text>
            </View>
          ) : (
            filteredTeamMembers
            .filter(member => member.id !== null && member.id !== undefined && !isNaN(member.id))
            .map((member) => (
            <View key={member.id} style={[styles.memberCard, isDark && styles.memberCardDark]}>
              <View style={styles.memberHeader}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={{ 
                      uri: member.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIxNSIgeT0iMTUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTEuNjcgNyA5SDE3QzE3IDExLjY3IDE0LjY3IDE0IDEyIDE0WiIgZmlsbD0iIzljYTNhZiIvPgo8L3N2Zz4KPC9zdmc+' 
                    }} 
                    style={styles.avatar} 
                  />
                  <View 
                    style={[
                      styles.statusIndicator, 
                      { backgroundColor: getStatusColor(member.status) }
                    ]} 
                  />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, isDark && styles.memberNameDark]}>{member.name}</Text>
                  <Text style={[styles.memberRole, isDark && styles.memberRoleDark]}>{member.role}</Text>
                  <Text style={[styles.memberSection, isDark && styles.memberSectionDark]}>{member.section}</Text>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, isDark && styles.statusTextDark]}>{getStatusText(member.status)}</Text>
                  </View>
                </View>
                <View style={styles.performanceContainer}>
                  <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor(member.performance) }]}>
                    <Text style={styles.performanceText}>{member.performance}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.memberDetails}>
                <View style={styles.detailRow}>
                  <MapPin color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.detailText}>{member.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.detailText}>{member.shift}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Target color="#6b7280" size={16} strokeWidth={2} />
                  <Text style={styles.detailText}>{member.tasks_completed} tâches terminées</Text>
                </View>
              </View>

              <View style={styles.memberActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => callMember(member.phone || '', member.name)}
                >
                  <Phone color="#3b82f6" size={18} strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => sendMessage(member.email || '', member.name)}
                >
                  <Mail color="#10b981" size={18} strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.breakButton]}
                  onPress={() => openBreakManager(member)}
                >
                  <Coffee color="#f59e0b" size={18} strokeWidth={2} />
                  <Text style={[styles.actionButtonText, styles.breakButtonText]}>Pauses</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(member)}
                >
                  <Edit color="#f59e0b" size={18} strokeWidth={2} />
                  <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                    console.log('Bouton supprimer cliqué pour:', member.name);
                    removeMember(member.id, member.name);
                  }}
                  activeOpacity={0.7}
                >
                  <X color="#ef4444" size={18} strokeWidth={2} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
              ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Actions rapides</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionCard, isDark && styles.quickActionCardDark]}
              onPress={() => router.push('/rayon-planning')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Calendar color="#f59e0b" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.quickActionText, isDark && styles.quickActionTextDark]}>Planning Rayon</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, isDark && styles.quickActionCardDark]}
              onPress={() => router.push('/employee-performance')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <BarChart3 color="#8b5cf6" size={20} strokeWidth={2} />
              </View>
              <Text style={[styles.quickActionText, isDark && styles.quickActionTextDark]}>Performance des employés</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un employé</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                style={styles.input}
                value={newMemberName}
                onChangeText={setNewMemberName}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Poste</Text>
              <TextInput
                style={styles.input}
                value={newMemberRole}
                onChangeText={setNewMemberRole}
                placeholder="Ex: Employé libre-service"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Section</Text>
              <TextInput
                style={styles.input}
                value={newMemberSection}
                onChangeText={setNewMemberSection}
                placeholder={userProfile?.section || "Ex: fruits-legumes"}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Localisation</Text>
              <TextInput
                style={styles.input}
                value={newMemberLocation}
                onChangeText={setNewMemberLocation}
                placeholder="Ex: Zone 1, Entrepôt A"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Équipe</Text>
              <View style={styles.shiftSelector}>
                {(['matin', 'après-midi', 'soir'] as const).map((shift) => (
                  <TouchableOpacity
                    key={shift}
                    style={[
                      styles.shiftOption,
                      newMemberShift === shift && styles.shiftOptionSelected
                    ]}
                    onPress={() => setNewMemberShift(shift)}
                  >
                    <Text style={[
                      styles.shiftOptionText,
                      newMemberShift === shift && styles.shiftOptionTextSelected
                    ]}>
                      {shift.charAt(0).toUpperCase() + shift.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={addNewMember}
              >
                <Text style={styles.primaryButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        visible={showEditMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le membre</Text>
              <TouchableOpacity onPress={() => setShowEditMemberModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet *</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nom complet"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Poste *</Text>
              <TextInput
                style={styles.input}
                value={editRole}
                onChangeText={setEditRole}
                placeholder="Poste"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Section *</Text>
              <TextInput
                style={styles.input}
                value={editSection}
                onChangeText={setEditSection}
                placeholder="Section"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+33 6 XX XX XX XX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="email@exemple.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Localisation</Text>
              <TextInput
                style={styles.input}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Ex: Fruits & Légumes"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Horaire de travail</Text>
              <TouchableOpacity 
                style={styles.shiftSelector}
                onPress={() => setShowShiftPicker(true)}
              >
                <Text style={[
                  styles.shiftSelectorText,
                  !editShift && styles.shiftSelectorPlaceholder
                ]}>
                  {editShift || "Sélectionner un horaire"}
                </Text>
                <ChevronDown color="#6b7280" size={20} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editPresetsButton}
                onPress={() => setShowPresetModal(true)}
              >
                <Text style={styles.editPresetsButtonText}>Modifier les presets</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Photo de profil</Text>
              <View style={styles.uploadContainer}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Text style={styles.uploadButtonText}>Choisir une image</Text>
                </TouchableOpacity>
                {editAvatar ? (
                  <Image source={{ uri: editAvatar }} style={styles.avatarPreview} />
                ) : null}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowEditMemberModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={saveMemberChanges}
              >
                <Text style={styles.primaryButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Shift Picker Modal */}
      <Modal
        visible={showShiftPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShiftPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un horaire</Text>
              <TouchableOpacity onPress={() => setShowShiftPicker(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.shiftPickerList}>
              {shiftPresets.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.shiftOption,
                    editShift === preset && styles.selectedShiftOption
                  ]}
                  onPress={() => selectShift(preset)}
                >
                  <Text style={[
                    styles.shiftOptionText,
                    editShift === preset && styles.selectedShiftText
                  ]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Preset Management Modal */}
      <Modal
        visible={showPresetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPresetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier les horaires</Text>
              <TouchableOpacity onPress={() => setShowPresetModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.presetList}>
              {shiftPresets.map((preset, idx) => (
                <View key={idx} style={styles.presetItem}>
                  <TextInput
                    style={styles.presetInput}
                    value={preset}
                    onChangeText={text => {
                      const newPresets = [...shiftPresets];
                      newPresets[idx] = text;
                      setShiftPresets(newPresets);
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.deletePresetButton}
                    onPress={() => {
                      const newPresets = shiftPresets.filter((_, i) => i !== idx);
                      setShiftPresets(newPresets);
                    }}
                  >
                    <X color="#ef4444" size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={styles.addPresetContainer}>
                <TextInput
                  style={styles.presetInput}
                  value={newPreset}
                  onChangeText={setNewPreset}
                  placeholder="Nouvel horaire"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity 
                  style={styles.addPresetButton}
                  onPress={() => {
                    if (newPreset.trim()) {
                      setShiftPresets([...shiftPresets, newPreset]);
                      setNewPreset('');
                    }
                  }}
                >
                  <Text style={styles.addPresetButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowPresetModal(false)}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Meeting Modal */}
      <Modal
        visible={showMeetingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMeetingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Planifier une réunion</Text>
              <TouchableOpacity onPress={() => setShowMeetingModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Titre de la réunion</Text>
              <TextInput
                style={styles.input}
                value={meetingTitle}
                onChangeText={setMeetingTitle}
                placeholder="Ex: Point équipe hebdomadaire"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Heure</Text>
              <TextInput
                style={styles.input}
                value={meetingTime}
                onChangeText={setMeetingTime}
                placeholder="Ex: 14:00"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowMeetingModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={scheduleMeeting}
              >
                <Text style={styles.primaryButtonText}>Planifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 350 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmer la suppression</Text>
              <TouchableOpacity onPress={cancelDelete}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.confirmMessageContainer}>
              <Text style={styles.confirmMessage}>
                Êtes-vous sûr de vouloir supprimer{' '}
                <Text style={styles.memberNameHighlight}>
                  {memberToDelete?.name}
                </Text>{' '}
                de l'équipe ?
              </Text>
              <Text style={styles.confirmSubtext}>
                Cette action est irréversible et ne peut pas être annulée.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteConfirmButtonText}>Supprimer définitivement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Break Manager Modal */}
      {selectedEmployeeForBreaks && (
        <BreakManager
          employeeId={selectedEmployeeForBreaks.id}
          employeeName={selectedEmployeeForBreaks.name}
          selectedDate={new Date().toISOString().split('T')[0]}
          visible={showBreakManager}
          onClose={closeBreakManager}
        />
      )}
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
    marginBottom: 24,
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
    shadowColor: '#000',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionTitleDark: {
    color: '#f4f4f5',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  memberCardDark: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0.2,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  memberNameDark: {
    color: '#f4f4f5',
  },
  memberRole: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  memberRoleDark: {
    color: '#94a3b8',
  },
  memberSection: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  memberSectionDark: {
    color: '#94a3b8',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusTextDark: {
    color: '#94a3b8',
  },
  performanceContainer: {
    alignItems: 'flex-end',
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  memberDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: '#fef3c7',
  },
  editButtonText: {
    color: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  breakButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  breakButtonText: {
    color: '#f59e0b',
    fontWeight: '600',
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
  quickActionCardDark: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0.2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  quickActionTextDark: {
    color: '#f4f4f5',
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
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
  primaryButton: {
    backgroundColor: '#3b82f6',
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
  shiftSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  shiftSelectorText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  shiftSelectorPlaceholder: {
    color: '#9ca3af',
  },
  editPresetsButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  editPresetsButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  avatarPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shiftPickerList: {
    maxHeight: 300,
  },
  shiftOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  selectedShiftOption: {
    backgroundColor: '#3b82f6',
  },
  shiftOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectedShiftText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  shiftOptionSelected: {
    backgroundColor: '#3b82f6',
  },
  shiftOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  presetList: {
    maxHeight: 300,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  presetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
  },
  deletePresetButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  addPresetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  addPresetButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  addPresetButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmMessageContainer: {
    marginBottom: 24,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  memberNameHighlight: {
    fontWeight: '600',
  },
  confirmSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 15,
  },
      emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 5,
  },
});