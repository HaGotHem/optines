import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar, 
  Coffee, 
  Utensils, 
  BookOpen, 
  Users, 
  MoreHorizontal,
  ChevronLeft
} from 'lucide-react-native';
import { useSupabaseBreaks } from '../hooks/useSupabaseBreaks';
import { useTheme } from '../contexts/ThemeContext';

interface BreakManagerProps {
  employeeId: number;
  employeeName: string;
  selectedDate: string;
  visible: boolean;
  onClose: () => void;
}

interface BreakFormData {
  start_time: string;
  end_time: string;
  date: string;
  break_type: 'pause' | 'dejeuner' | 'formation' | 'reunion' | 'autre';
  description: string;
  is_recurring: boolean;
  recurrence_days: number[]; // 0 = Dimanche, 1 = Lundi, etc.
  recurrence_end_date?: string;
}

const breakTypes = [
  { key: 'pause', label: 'Pause', icon: Coffee, color: '#3b82f6' },
  { key: 'dejeuner', label: 'Déjeuner', icon: Utensils, color: '#10b981' },
  { key: 'formation', label: 'Formation', icon: BookOpen, color: '#8b5cf6' },
  { key: 'reunion', label: 'Réunion', icon: Users, color: '#f59e0b' },
  { key: 'autre', label: 'Autre', icon: MoreHorizontal, color: '#6b7280' },
];

export default function BreakManager({ 
  employeeId, 
  employeeName, 
  selectedDate, 
  visible, 
  onClose 
}: BreakManagerProps) {
  const { isDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBreak, setEditingBreak] = useState<any>(null);
  const [formData, setFormData] = useState<BreakFormData>({
    start_time: '12:00',
    end_time: '12:30',
    date: selectedDate,
    break_type: 'pause',
    description: '',
    is_recurring: false,
    recurrence_days: [],
    recurrence_end_date: undefined,
  });

  const { 
    breaks, 
    isLoading, 
    createBreak, 
    updateBreak, 
    deleteBreak 
  } = useSupabaseBreaks({ 
    employee_id: employeeId, 
    date: selectedDate 
  });

  useEffect(() => {
    if (visible) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [visible, selectedDate]);

  const resetForm = () => {
    setFormData({
      start_time: '12:00',
      end_time: '12:30',
      date: selectedDate,
      break_type: 'pause',
      description: '',
      is_recurring: false,
      recurrence_days: [],
      recurrence_end_date: undefined,
    });
    setEditingBreak(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const openEditModal = (breakItem: any) => {
    setEditingBreak(breakItem);
    setFormData({
      start_time: breakItem.start_time,
      end_time: breakItem.end_time,
      date: breakItem.date,
      break_type: breakItem.break_type,
      description: breakItem.description || '',
      is_recurring: breakItem.is_recurring,
      recurrence_days: breakItem.recurrence_days || [],
      recurrence_end_date: breakItem.recurrence_end_date,
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.start_time || !formData.end_time) {
      Alert.alert('Erreur', 'Veuillez remplir les heures de début et de fin');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      Alert.alert('Erreur', 'L\'heure de fin doit être après l\'heure de début');
      return;
    }

    try {
      if (editingBreak) {
        const result = await updateBreak(editingBreak.id, formData);
        if (result.success) {
          Alert.alert('Succès', 'Pause modifiée avec succès');
          closeAddModal();
        } else {
          Alert.alert('Erreur', result.error || 'Erreur lors de la modification');
        }
      } else {
        const result = await createBreak(employeeId, formData);
        if (result.success) {
          Alert.alert('Succès', 'Pause créée avec succès');
          closeAddModal();
        } else {
          Alert.alert('Erreur', result.error || 'Erreur lors de la création');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleDelete = (breakItem: any) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette pause ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteBreak(breakItem.id);
            if (result.success) {
              Alert.alert('Succès', 'Pause supprimée avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const getBreakTypeInfo = (type: string) => {
    return breakTypes.find(bt => bt.key === type) || breakTypes[0];
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? minutes + 'min' : ''}`;
    }
    return `${minutes}min`;
  };

  // Fonctions pour la gestion de la répétition
  const toggleRecurringDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(dayIndex)
        ? prev.recurrence_days.filter(d => d !== dayIndex)
        : [...prev.recurrence_days, dayIndex].sort()
    }));
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayIndex];
  };

  const formatRecurrenceDays = (days: number[]) => {
    if (days.length === 0) return 'Aucun jour';
    if (days.length === 7) return 'Tous les jours';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Lun-Ven';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Week-end';
    
    return days.map(d => getDayName(d)).join(', ');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ChevronLeft color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Pauses - {employeeName}
          </Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
            <Plus color="#ffffff" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Date Display */}
        <View style={[styles.dateCard, isDark && styles.dateCardDark]}>
          <Calendar color="#3b82f6" size={20} strokeWidth={2} />
          <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Breaks List */}
        <ScrollView style={styles.breaksList} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
                Chargement des pauses...
              </Text>
            </View>
          ) : breaks.length === 0 ? (
            <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
              <Coffee color={isDark ? '#6b7280' : '#9ca3af'} size={48} strokeWidth={1} />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                Aucune pause planifiée
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                Ajoutez des pauses pour cet employé
              </Text>
            </View>
          ) : (
            breaks.map((breakItem) => {
              const breakTypeInfo = getBreakTypeInfo(breakItem.break_type);
              const IconComponent = breakTypeInfo.icon;
              
              return (
                <View key={breakItem.id} style={[styles.breakCard, isDark && styles.breakCardDark]}>
                  <View style={[styles.breakIcon, { backgroundColor: breakTypeInfo.color + '20' }]}>
                    <IconComponent color={breakTypeInfo.color} size={20} strokeWidth={2} />
                  </View>
                  
                  <View style={styles.breakContent}>
                    <View style={styles.breakHeader}>
                      <Text style={[styles.breakType, isDark && styles.breakTypeDark]}>
                        {breakTypeInfo.label}
                      </Text>
                      {breakItem.is_recurring && (
                        <View style={styles.recurringBadge}>
                          <Text style={styles.recurringText}>Récurrent</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.breakTime}>
                      <Clock color="#6b7280" size={16} strokeWidth={2} />
                      <Text style={[styles.breakTimeText, isDark && styles.breakTimeTextDark]}>
                        {formatTime(breakItem.start_time)} - {formatTime(breakItem.end_time)}
                        {' '}({formatDuration(breakItem.start_time, breakItem.end_time)})
                      </Text>
                    </View>
                    
                    {breakItem.description && (
                      <Text style={[styles.breakDescription, isDark && styles.breakDescriptionDark]}>
                        {breakItem.description}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.breakActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => openEditModal(breakItem)}
                    >
                      <Edit3 color="#3b82f6" size={16} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDelete(breakItem)}
                    >
                      <Trash2 color="#ef4444" size={16} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={closeAddModal}
        >
          <SafeAreaView style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeAddModal}>
                <X color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {editingBreak ? 'Modifier la pause' : 'Nouvelle pause'}
              </Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Break Type Selection */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>Type de pause</Text>
                <View style={styles.breakTypeGrid}>
                  {breakTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.breakTypeOption,
                        formData.break_type === type.key && styles.breakTypeOptionSelected,
                        isDark && styles.breakTypeOptionDark
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, break_type: type.key as any }))}
                    >
                      <type.icon 
                        color={formData.break_type === type.key ? '#ffffff' : type.color} 
                        size={20} 
                        strokeWidth={2} 
                      />
                      <Text style={[
                        styles.breakTypeOptionText,
                        formData.break_type === type.key && styles.breakTypeOptionTextSelected,
                        isDark && styles.breakTypeOptionTextDark
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Selection */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>Heures</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>Début</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                      value={formData.start_time}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, start_time: text }))}
                      placeholder="12:00"
                      placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                    />
                  </View>
                  <View style={styles.timeInput}>
                    <Text style={[styles.timeLabel, isDark && styles.timeLabelDark]}>Fin</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                      value={formData.end_time}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, end_time: text }))}
                      placeholder="12:30"
                      placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                    />
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>Description (optionnel)</Text>
                <TextInput
                  style={[styles.textArea, isDark && styles.textAreaDark]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Description de la pause..."
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Répétition */}
              <View style={styles.formSection}>
                <View style={styles.recurringHeader}>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>Répétition</Text>
                  <TouchableOpacity
                    style={styles.recurringToggle}
                    onPress={() => setFormData(prev => ({ ...prev, is_recurring: !prev.is_recurring }))}
                  >
                    <View style={[
                      styles.toggleSwitch,
                      formData.is_recurring && styles.toggleSwitchActive,
                      isDark && styles.toggleSwitchDark
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        formData.is_recurring && styles.toggleThumbActive
                      ]} />
                    </View>
                  </TouchableOpacity>
                </View>

                {formData.is_recurring && (
                  <>
                    <Text style={[styles.formSubLabel, isDark && styles.formSubLabelDark]}>
                      Jours de répétition
                    </Text>
                    <View style={styles.daysGrid}>
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                        <TouchableOpacity
                          key={dayIndex}
                          style={[
                            styles.dayButton,
                            formData.recurrence_days.includes(dayIndex) && styles.dayButtonSelected,
                            isDark && styles.dayButtonDark
                          ]}
                          onPress={() => toggleRecurringDay(dayIndex)}
                        >
                          <Text style={[
                            styles.dayButtonText,
                            formData.recurrence_days.includes(dayIndex) && styles.dayButtonTextSelected,
                            isDark && styles.dayButtonTextDark
                          ]}>
                            {getDayName(dayIndex)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <Text style={[styles.selectedDaysText, isDark && styles.selectedDaysTextDark]}>
                      Sélectionné : {formatRecurrenceDays(formData.recurrence_days)}
                    </Text>

                    <View style={styles.formSection}>
                      <Text style={[styles.formSubLabel, isDark && styles.formSubLabelDark]}>
                        Date de fin (optionnel)
                      </Text>
                      <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        value={formData.recurrence_end_date || ''}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, recurrence_end_date: text }))}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                      />
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerTitleDark: {
    color: '#f4f4f5',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 12,
  },
  dateCardDark: {
    backgroundColor: '#27272a',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  dateTextDark: {
    color: '#f4f4f5',
  },
  breaksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingTextDark: {
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainerDark: {
    backgroundColor: '#18181b',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyTitleDark: {
    color: '#9ca3af',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  emptySubtitleDark: {
    color: '#71717a',
  },
  breakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  breakCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
  },
  breakIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakContent: {
    flex: 1,
  },
  breakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  breakTypeDark: {
    color: '#f4f4f5',
  },
  recurringBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  recurringText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  breakTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakTimeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  breakTimeTextDark: {
    color: '#9ca3af',
  },
  breakDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  breakDescriptionDark: {
    color: '#9ca3af',
  },
  breakActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  formLabelDark: {
    color: '#f4f4f5',
  },
  breakTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  breakTypeOptionDark: {
    borderColor: '#374151',
  },
  breakTypeOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  breakTypeOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  breakTypeOptionTextDark: {
    color: '#9ca3af',
  },
  breakTypeOptionTextSelected: {
    color: '#ffffff',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  timeLabelDark: {
    color: '#9ca3af',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#27272a',
    color: '#f4f4f5',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#374151',
    backgroundColor: '#27272a',
    color: '#f4f4f5',
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recurringToggle: {
    padding: 4,
  },
  toggleSwitch: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    padding: 2,
  },
  toggleSwitchDark: {
    backgroundColor: '#374151',
  },
  toggleSwitchActive: {
    backgroundColor: '#3b82f6',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    backgroundColor: '#ffffff',
    transform: [{ translateX: 20 }],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  selectedDaysText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  selectedDaysTextDark: {
    color: '#9ca3af',
  },
  formSubLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  formSubLabelDark: {
    color: '#9ca3af',
  },
}); 