import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { Plus, X, Settings } from 'lucide-react-native';
import { useSections } from '../contexts/SectionsContext';

interface SectionsManagerProps {
  visible: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const SectionsManager: React.FC<SectionsManagerProps> = ({ 
  visible, 
  onClose,
  isDark = false 
}) => {
  const { availableSections, addSection, removeSection } = useSections();
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSection = () => {
    const trimmedName = newSectionName.trim();
    if (trimmedName) {
      const success = addSection(trimmedName);
      if (success) {
        setNewSectionName('');
        setShowAddForm(false);
        Alert.alert('Succès', `Le rayon "${trimmedName}" a été ajouté avec succès`);
      } else {
        Alert.alert('Information', 'Ce rayon existe déjà dans la liste');
      }
    } else {
      Alert.alert('Erreur', 'Veuillez saisir un nom de rayon');
    }
  };

  const handleRemoveSection = (sectionName: string) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le rayon "${sectionName}" ?\n\nCette action affectera tous les employés et utilisateurs assignés à ce rayon.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            removeSection(sectionName);
            Alert.alert('Succès', `Le rayon "${sectionName}" a été supprimé`);
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewSectionName('');
    setShowAddForm(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.containerDark]}>
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerLeft}>
            <Settings size={24} color={isDark ? "#f4f4f5" : "#374151"} strokeWidth={2} />
            <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
              Gestion des Rayons
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={isDark ? "#f4f4f5" : "#374151"} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoContainer, isDark && styles.infoContainerDark]}>
          <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
            📋 Gérez ici tous les rayons de supermarché. Les modifications se synchronisent automatiquement dans toute l'application.
          </Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Formulaire d'ajout */}
          <View style={[styles.addSection, isDark && styles.addSectionDark]}>
            <View style={styles.addHeader}>
              <Text style={[styles.addTitle, isDark && styles.addTitleDark]}>
                Ajouter un nouveau rayon
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddForm(!showAddForm)}
                style={[styles.toggleButton, showAddForm && styles.toggleButtonActive]}
              >
                <Plus 
                  size={20} 
                  color={showAddForm ? "#ffffff" : (isDark ? "#f4f4f5" : "#374151")} 
                  strokeWidth={2} 
                />
              </TouchableOpacity>
            </View>

            {showAddForm && (
              <View style={styles.addForm}>
                <TextInput
                  value={newSectionName}
                  onChangeText={setNewSectionName}
                  placeholder="Ex: Produits bio, Vins & Spiritueux"
                  placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  style={[styles.textInput, isDark && styles.textInputDark]}
                  autoFocus
                />
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    onPress={resetForm}
                    style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
                  >
                    <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleAddSection}
                    style={styles.addButton}
                    disabled={!newSectionName.trim()}
                  >
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Liste des rayons */}
          <View style={[styles.sectionsContainer, isDark && styles.sectionsContainerDark]}>
            <Text style={[styles.sectionsTitle, isDark && styles.sectionsTitleDark]}>
              Rayons existants ({availableSections.length})
            </Text>
            
            {availableSections.length === 0 ? (
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                Aucun rayon configuré
              </Text>
            ) : (
              <View style={styles.sectionsList}>
                {availableSections.map((section, index) => (
                  <View key={index} style={[styles.sectionItem, isDark && styles.sectionItemDark]}>
                    <Text style={[styles.sectionName, isDark && styles.sectionNameDark]}>
                      {section}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveSection(section)}
                      style={styles.removeButton}
                    >
                      <X size={20} color="#ef4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Statistiques */}
          <View style={[styles.statsContainer, isDark && styles.statsContainerDark]}>
            <Text style={[styles.statsTitle, isDark && styles.statsTitleDark]}>
              📊 Statistiques
            </Text>
            <Text style={[styles.statsText, isDark && styles.statsTextDark]}>
              Total des rayons : {availableSections.length}
            </Text>
            <Text style={[styles.statsText, isDark && styles.statsTextDark]}>
              Synchronisation : ✅ Active
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerDark: {
    backgroundColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  headerTitleDark: {
    color: '#f4f4f5',
  },
  closeButton: {
    padding: 8,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  infoContainerDark: {
    backgroundColor: '#1e3a8a',
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    color: '#1976d2',
    fontSize: 14,
  },
  infoTextDark: {
    color: '#93c5fd',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addSectionDark: {
    backgroundColor: '#27272a',
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addTitleDark: {
    color: '#f4f4f5',
  },
  toggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  addForm: {
    marginTop: 16,
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  textInputDark: {
    borderColor: '#52525b',
    backgroundColor: '#3f3f46',
    color: '#f4f4f5',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonDark: {
    backgroundColor: '#52525b',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  cancelButtonTextDark: {
    color: '#d1d5db',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  sectionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionsContainerDark: {
    backgroundColor: '#27272a',
  },
  sectionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionsTitleDark: {
    color: '#f4f4f5',
  },
  emptyText: {
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyTextDark: {
    color: '#a1a1aa',
  },
  sectionsList: {
    gap: 8,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sectionItemDark: {
    backgroundColor: '#3f3f46',
  },
  sectionName: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  sectionNameDark: {
    color: '#f4f4f5',
  },
  removeButton: {
    padding: 4,
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainerDark: {
    backgroundColor: '#27272a',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statsTitleDark: {
    color: '#f4f4f5',
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statsTextDark: {
    color: '#a1a1aa',
  },
}); 