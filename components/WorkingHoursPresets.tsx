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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, Edit, Plus, Trash2, Save, X, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface WorkingHoursPreset {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isDefault?: boolean;
}

interface WorkingHoursPresetsProps {
  selectedPreset: WorkingHoursPreset | null;
  onPresetSelect: (preset: WorkingHoursPreset) => void;
  onHoursChange: (start: string, end: string) => void;
}

const defaultPresets: WorkingHoursPreset[] = [
  { id: '1', name: 'Matin', startTime: '06:30', endTime: '12:00', isDefault: true },
  { id: '2', name: 'Toute la journée', startTime: '08:00', endTime: '17:00' },
  { id: '3', name: 'Soir', startTime: '16:00', endTime: '20:00' },
  { id: '4', name: 'Nuit', startTime: '22:00', endTime: '06:00' },
  { id: '5', name: 'Étendu', startTime: '07:00', endTime: '23:00' },
];

export default function WorkingHoursPresets({
  selectedPreset,
  onPresetSelect,
  onHoursChange,
}: WorkingHoursPresetsProps) {
  const { isDark } = useTheme();
  const [presets, setPresets] = useState<WorkingHoursPreset[]>(defaultPresets);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<WorkingHoursPreset | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  // Charger les présets depuis le stockage local au démarrage
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const savedPresets = await AsyncStorage.getItem('workingHoursPresets');
      if (savedPresets) {
        const parsedPresets = JSON.parse(savedPresets);
        setPresets(parsedPresets);
      } else {
        // Première utilisation, sauvegarder les présets par défaut
        await AsyncStorage.setItem('workingHoursPresets', JSON.stringify(defaultPresets));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des présets:', error);
      // En cas d'erreur, utiliser les présets par défaut
      setPresets(defaultPresets);
    }
  };

  const savePresets = async (updatedPresets: WorkingHoursPreset[]) => {
    try {
      await AsyncStorage.setItem('workingHoursPresets', JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des présets:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les présets');
    }
  };

  const handlePresetSelect = (preset: WorkingHoursPreset) => {
    onPresetSelect(preset);
    onHoursChange(preset.startTime, preset.endTime);
  };

  const handleEditPreset = (preset: WorkingHoursPreset) => {
    setEditingPreset(preset);
    setNewPresetName(preset.name);
    setNewStartTime(preset.startTime);
    setNewEndTime(preset.endTime);
    setIsModalVisible(true);
  };

  const handleAddPreset = () => {
    setEditingPreset(null);
    setNewPresetName('');
    setNewStartTime('');
    setNewEndTime('');
    setIsModalVisible(true);
  };

  const handleDeletePreset = (presetId: string) => {
    Alert.alert(
      'Supprimer le preset',
      'Êtes-vous sûr de vouloir supprimer ce preset ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedPresets = presets.filter(p => p.id !== presetId);
            savePresets(updatedPresets);
            
            // Si le preset supprimé était sélectionné, sélectionner le premier disponible
            if (selectedPreset?.id === presetId && updatedPresets.length > 0) {
              handlePresetSelect(updatedPresets[0]);
            }
          },
        },
      ]
    );
  };

  const handleResetPresets = () => {
    Alert.alert(
      'Réinitialiser les présets',
      'Cela remplacera tous vos présets personnalisés par les présets par défaut. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            savePresets(defaultPresets);
            // Sélectionner le preset par défaut
            handlePresetSelect(defaultPresets[0]);
          },
        },
      ]
    );
  };

  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour le preset');
      return;
    }

    if (!newStartTime || !newEndTime) {
      Alert.alert('Erreur', 'Veuillez saisir les heures de début et de fin');
      return;
    }

    if (!validateTimeFormat(newStartTime) || !validateTimeFormat(newEndTime)) {
      Alert.alert('Erreur', 'Format d\'heure invalide. Utilisez le format HH:MM (ex: 08:30)');
      return;
    }

    // Vérifier que le nom n'existe pas déjà (sauf pour l'édition)
    const existingPreset = presets.find(p => 
      p.name.toLowerCase() === newPresetName.trim().toLowerCase() && 
      (!editingPreset || p.id !== editingPreset.id)
    );
    
    if (existingPreset) {
      Alert.alert('Erreur', 'Un preset avec ce nom existe déjà');
      return;
    }

    if (newStartTime >= newEndTime) {
      Alert.alert('Erreur', 'L\'heure de fin doit être après l\'heure de début');
      return;
    }

    let updatedPresets: WorkingHoursPreset[];

    if (editingPreset) {
      // Modifier un preset existant
      updatedPresets = presets.map(p =>
        p.id === editingPreset.id
          ? { ...p, name: newPresetName, startTime: newStartTime, endTime: newEndTime }
          : p
      );
    } else {
      // Ajouter un nouveau preset
      const newPreset: WorkingHoursPreset = {
        id: Date.now().toString(),
        name: newPresetName,
        startTime: newStartTime,
        endTime: newEndTime,
      };
      updatedPresets = [...presets, newPreset];
    }

    savePresets(updatedPresets);
    setIsModalVisible(false);
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${start} - ${end}`;
  };

  const formatTimeInput = (text: string): string => {
    // Supprimer tous les caractères non numériques
    const numbers = text.replace(/\D/g, '');
    
    // Limiter à 4 chiffres maximum
    if (numbers.length > 4) return text;
    
    // Formater en HH:MM
    if (numbers.length >= 2) {
      const hours = numbers.substring(0, 2);
      const minutes = numbers.substring(2, 4);
      
      // Valider les heures (0-23)
      const hourNum = parseInt(hours);
      if (hourNum > 23) return text;
      
      // Valider les minutes (0-59)
      if (minutes && parseInt(minutes) > 59) return text;
      
      return `${hours}${minutes ? ':' + minutes : ''}`;
    }
    
    return numbers;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Horaires de travail
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleResetPresets} style={styles.resetButton}>
            <RotateCcw color={isDark ? '#f4f4f5' : '#1a1a1a'} size={16} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddPreset} style={styles.addButton}>
            <Plus color={isDark ? '#f4f4f5' : '#1a1a1a'} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsContainer}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetCard,
              selectedPreset?.id === preset.id && styles.selectedPresetCard,
              isDark && styles.presetCardDark,
              selectedPreset?.id === preset.id && isDark && styles.selectedPresetCardDark,
            ]}
            onPress={() => handlePresetSelect(preset)}
          >
            <View style={styles.presetHeader}>
              <Clock color={selectedPreset?.id === preset.id ? '#ffffff' : (isDark ? '#f4f4f5' : '#1a1a1a')} size={16} strokeWidth={2} />
              <Text style={[
                styles.presetName,
                selectedPreset?.id === preset.id && styles.selectedPresetText,
                isDark && styles.presetNameDark,
              ]}>
                {preset.name}
              </Text>
            </View>
            
            <Text style={[
              styles.presetTime,
              selectedPreset?.id === preset.id && styles.selectedPresetText,
              isDark && styles.presetTimeDark,
            ]}>
              {formatTimeRange(preset.startTime, preset.endTime)}
            </Text>

            <View style={styles.presetActions}>
              <TouchableOpacity
                onPress={() => handleEditPreset(preset)}
                style={styles.actionButton}
              >
                <Edit color={selectedPreset?.id === preset.id ? '#ffffff' : (isDark ? '#6b7280' : '#6b7280')} size={14} strokeWidth={2} />
              </TouchableOpacity>
              
              {!preset.isDefault && (
                <TouchableOpacity
                  onPress={() => handleDeletePreset(preset.id)}
                  style={styles.actionButton}
                >
                  <Trash2 color={selectedPreset?.id === preset.id ? '#ffffff' : (isDark ? '#6b7280' : '#6b7280')} size={14} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal pour éditer/ajouter un preset */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {editingPreset ? 'Modifier le preset' : 'Nouveau preset'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color={isDark ? '#f4f4f5' : '#1a1a1a'} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Nom du preset</Text>
              <TextInput
                style={[styles.textInput, isDark && styles.textInputDark]}
                value={newPresetName}
                onChangeText={setNewPresetName}
                placeholder="Ex: Matin, Soir, etc."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              />
            </View>

            <View style={styles.timeInputsContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Heure de début</Text>
                <TextInput
                  style={[styles.textInput, isDark && styles.textInputDark]}
                  value={newStartTime}
                  onChangeText={(text) => setNewStartTime(formatTimeInput(text))}
                  placeholder="HH:MM"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Heure de fin</Text>
                <TextInput
                  style={[styles.textInput, isDark && styles.textInputDark]}
                  value={newEndTime}
                  onChangeText={(text) => setNewEndTime(formatTimeInput(text))}
                  placeholder="HH:MM"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePreset}
              >
                <Save color="#ffffff" size={16} strokeWidth={2} />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#f4f4f5',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  presetCard: {
    minWidth: 120,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  presetCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
  },
  selectedPresetCard: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  selectedPresetCardDark: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  presetNameDark: {
    color: '#f4f4f5',
  },
  selectedPresetText: {
    color: '#ffffff',
  },
  presetTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  presetTimeDark: {
    color: '#9ca3af',
  },
  presetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalTitleDark: {
    color: '#f4f4f5',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  inputLabelDark: {
    color: '#f4f4f5',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  textInputDark: {
    borderColor: '#374151',
    color: '#f4f4f5',
    backgroundColor: '#374151',
  },
  timeInputsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
}); 