import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Users, Edit3, Trash2, Briefcase, MapPin, Clock, User, Phone, Mail, X, CheckCircle } from 'lucide-react-native';
import { useSupabaseEmployees } from '../hooks/useSupabaseEmployees';
import { useSupabaseStores } from '../hooks/useSupabaseStores';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../contexts/ThemeContext';
import { useCustomAlert } from '../components/CustomAlert';
import { useSections } from '../contexts/SectionsContext';
import { SectionsManager } from '../components/SectionsManager';

export default function EmployeeManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    section: '',
    phone: '',
    email: '',
    shift: 'matin' as 'matin' | 'après-midi' | 'soir',
    manager_id: 0,
    store_id: 0,
  });

  // Utiliser le contexte centralisé pour les rayons
  const { availableSections, addSection, removeSection } = useSections();
  
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showSectionsManager, setShowSectionsManager] = useState(false);

  const { isDark } = useTheme();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { profile: user } = useUserProfile();
  const { stores } = useSupabaseStores();
  
  // Filtrer les utilisateurs selon le rôle et le magasin
  const userFilters = useMemo(() => {
    if (user?.role === 'director' && user.store_id) {
      return { store_id: user.store_id };
    }
    // Les autres rôles peuvent voir tous les utilisateurs ou selon d'autres règles
    return undefined;
  }, [user?.role, user?.store_id]);
  
  const { users: allUsers } = useSupabaseUsers(userFilters);
  
  // Plus besoin de filtrer les utilisateurs ici car c'est fait dans le hook
  const users = allUsers;

  // Mémoriser le filtre pour éviter les re-rendus en boucle
  const employeeFilter = useMemo(() => {
    return user?.role === 'director' && user?.store_id ? { store_id: user.store_id } : undefined;
  }, [user?.role, user?.store_id]);

  const { employees, isLoading, error, createEmployee, updateEmployee, deleteEmployee } = useSupabaseEmployees(employeeFilter);

  // Filtrer les managers du même magasin
  const managers = users.filter(u => u.role === 'manager' && u.store_id === user?.store_id);
  
  // Debug: Afficher les informations pour diagnostiquer le problème
  console.log('🔍 Debug - User profile loaded:', user);
  console.log('🔍 Debug - User store_id:', user?.store_id);
  console.log('🔍 Debug - User role:', user?.role);
  console.log('🔍 Debug - All users loaded:', allUsers.length);
  console.log('🔍 Debug - Users after filtering:', users.length);
  console.log('🔍 Debug - Filtered users store_ids:', users.map(u => ({ id: u.id, username: u.username, store_id: u.store_id })));
  console.log('🔍 Debug - Managers found:', managers.length);
  console.log('🔍 Debug - Employees loaded:', employees.length);
  console.log('🔍 Debug - Filter passed to useSupabaseEmployees:', user?.role === 'director' ? { store_id: user.store_id } : undefined);
  console.log('🔍 Debug - Employee store_ids:', employees.map(e => ({ id: e.id, name: e.name, store_id: e.store_id })));

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      section: '',
      phone: '',
      email: '',
      shift: 'matin',
      manager_id: 0,
      store_id: user?.store_id || 0,
    });
    setEditingEmployee(null);
    setShowAddForm(false);
    setShowSectionDropdown(false);
    setShowAddSectionModal(false);
    setNewSectionName('');
  };

  const handleSubmit = async () => {
    // Validation des champs obligatoires (manager_id optionnel si aucun manager disponible)
    const isManagerRequired = managers.length > 0;
    if (!formData.name || !formData.role || !formData.section || (isManagerRequired && !formData.manager_id)) {
      showAlert('Erreur', 'Veuillez remplir tous les champs obligatoires', [
        { text: 'OK', style: 'default' }
      ]);
      return;
    }

    const result = editingEmployee
      ? await updateEmployee(editingEmployee.id, formData)
      : await createEmployee(formData);

    if (result.success) {
      showAlert('Succès', editingEmployee ? 'Employé modifié avec succès' : 'Employé créé avec succès', [
        { text: 'OK', style: 'default' }
      ]);
      resetForm();
    } else {
      showAlert('Erreur', result.error || 'Une erreur est survenue', [
        { text: 'OK', style: 'default' }
      ]);
    }
  };

  const handleEdit = (employee: any) => {
    setFormData({
      name: employee.name,
      role: employee.role,
      section: employee.section,
      phone: employee.phone || '',
      email: employee.email || '',
      shift: employee.shift,
      manager_id: employee.manager_id,
      store_id: employee.store_id,
    });
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  // Fonctions pour gérer les rayons
  const addNewSection = () => {
    const trimmedName = newSectionName.trim();
    if (trimmedName) {
      const success = addSection(trimmedName);
      if (success) {
        setFormData({ ...formData, section: trimmedName });
        setNewSectionName('');
        setShowAddSectionModal(false);
        setShowSectionDropdown(false);
      } else {
        // Le rayon existe déjà
        showAlert('Information', 'Ce rayon existe déjà dans la liste', [
          { text: 'OK', style: 'default' }
        ]);
      }
    }
  };

  const handleRemoveSection = (sectionToRemove: string) => {
    removeSection(sectionToRemove);
    if (formData.section === sectionToRemove) {
      setFormData({ ...formData, section: '' });
    }
  };

  const handleDelete = (employee: any) => {
    console.log('🗑️ handleDelete appelé pour:', employee);
    console.log('🗑️ Nom de l\'employé:', employee.name);
    console.log('🗑️ ID de l\'employé:', employee.id);
    
    showAlert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer l'employé ${employee.name} ?`,
      [
        { 
          text: 'Annuler', 
          style: 'cancel',
          onPress: () => console.log('🗑️ Suppression annulée')
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ Suppression confirmée, appel API...');
            try {
              const result = await deleteEmployee(employee.id);
              console.log('🗑️ Résultat de l\'API:', result);
              if (result.success) {
                showAlert('Succès', 'Employé supprimé avec succès', [
                  { text: 'OK', style: 'default' }
                ]);
              } else {
                showAlert('Erreur', result.error || 'Erreur lors de la suppression', [
                  { text: 'OK', style: 'default' }
                ]);
              }
            } catch (error) {
              console.error('🗑️ Erreur lors de la suppression:', error);
              showAlert('Erreur', 'Erreur lors de la suppression de l\'employé', [
                { text: 'OK', style: 'default' }
              ]);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'break': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'busy': return 'Occupé';
      case 'break': return 'Pause';
      default: return 'Hors ligne';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Chargement des employés...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDark ? "#f4f4f5" : "#374151"} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Gestion des Employés
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowSectionsManager(true)}
            style={[styles.addButton, { backgroundColor: '#10b981' }]}
          >
            <Text style={styles.addButtonText}>Rayons</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            style={[styles.addButton, isDark && styles.addButtonDark]}
          >
            <Plus size={20} color="white" strokeWidth={2} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={[styles.errorContainer, isDark && styles.errorContainerDark]}>
          <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{error}</Text>
        </View>
      )}

      {/* Avertissement si l'utilisateur n'a pas de store_id */}
      {user && !user.store_id && (
        <View style={[styles.warningContainer, isDark && styles.warningContainerDark]}>
          <Text style={[styles.warningText, isDark && styles.warningTextDark]}>
            ⚠️ Votre compte n'est assigné à aucun magasin. Contactez l'administrateur.
          </Text>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Formulaire d'ajout/modification */}
        {showAddForm && (
          <View style={[styles.formContainer, isDark && styles.formContainerDark]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, isDark && styles.formTitleDark]}>
                {editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
              </Text>
              <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
                <X size={24} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.formFields}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Nom complet *</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Nom et prénom"
                  placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  style={[styles.textInput, isDark && styles.textInputDark]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Poste *</Text>
                <TextInput
                  value={formData.role}
                  onChangeText={(text) => setFormData({ ...formData, role: text })}
                  placeholder="Ex: Opérateur, Superviseur"
                  placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  style={[styles.textInput, isDark && styles.textInputDark]}
                />
              </View>

              <View style={[styles.fieldContainer, showSectionDropdown && styles.dropdownFieldContainer]}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Rayon *</Text>
                <TouchableOpacity
                  onPress={() => setShowSectionDropdown(!showSectionDropdown)}
                  style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]}
                >
                  <Text style={[
                    styles.dropdownButtonText, 
                    !formData.section && styles.placeholderText,
                    isDark && (!formData.section ? styles.placeholderTextDark : styles.dropdownButtonTextDark)
                  ]}>
                    {formData.section || 'Sélectionner un rayon'}
                  </Text>
                  <View style={[styles.dropdownArrow, showSectionDropdown && styles.dropdownArrowUp]}>
                    <Text style={[styles.dropdownArrowText, isDark && styles.dropdownArrowTextDark]}>▼</Text>
                  </View>
                </TouchableOpacity>

                {showSectionDropdown && (
                  <View style={[styles.dropdownMenu, isDark && styles.dropdownMenuDark]}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {availableSections.map((section, index) => (
                        <View key={index} style={styles.dropdownItemContainer}>
                          <TouchableOpacity
                            onPress={() => {
                              setFormData({ ...formData, section });
                              setShowSectionDropdown(false);
                            }}
                            style={[
                              styles.dropdownItem,
                              formData.section === section && styles.dropdownItemSelected,
                              isDark && styles.dropdownItemDark
                            ]}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              formData.section === section && styles.dropdownItemTextSelected,
                              isDark && styles.dropdownItemTextDark
                            ]}>
                              {section}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRemoveSection(section)}
                            style={styles.removeButton}
                          >
                            <X size={16} color="#ef4444" strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      
                      <TouchableOpacity
                        onPress={() => setShowAddSectionModal(true)}
                        style={[styles.addSectionButton, isDark && styles.addSectionButtonDark]}
                      >
                        <Plus size={16} color="#3b82f6" strokeWidth={2} />
                        <Text style={[styles.addSectionButtonText, isDark && styles.addSectionButtonTextDark]}>
                          Ajouter un rayon
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Téléphone</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="0123456789"
                  placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  keyboardType="phone-pad"
                  style={[styles.textInput, isDark && styles.textInputDark]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Email</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="email@example.com"
                  placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  keyboardType="email-address"
                  style={[styles.textInput, isDark && styles.textInputDark]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Équipe *</Text>
                <View style={styles.shiftContainer}>
                  {(['matin', 'après-midi', 'soir'] as const).map((shift) => (
                    <TouchableOpacity
                      key={shift}
                      onPress={() => setFormData({ ...formData, shift })}
                      style={[
                        styles.shiftButton,
                        formData.shift === shift
                          ? styles.shiftButtonSelected
                          : [styles.shiftButtonUnselected, isDark && styles.shiftButtonUnselectedDark]
                      ]}
                    >
                      <Text style={[
                        styles.shiftButtonText,
                        formData.shift === shift
                          ? styles.shiftButtonTextSelected
                          : [styles.shiftButtonTextUnselected, isDark && styles.shiftButtonTextUnselectedDark]
                      ]}>
                        {shift.charAt(0).toUpperCase() + shift.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Manager *</Text>
                {managers.length === 0 ? (
                  <View style={[styles.noManagerContainer, isDark && styles.noManagerContainerDark]}>
                    <User size={24} color={isDark ? "#71717a" : "#9ca3af"} strokeWidth={1} />
                    <Text style={[styles.noManagerText, isDark && styles.noManagerTextDark]}>
                      Aucun manager disponible dans ce magasin
                    </Text>
                    <Text style={[styles.noManagerSubtext, isDark && styles.noManagerSubtextDark]}>
                      Veuillez d'abord créer des utilisateurs avec le rôle "manager"
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.managerContainer, isDark && styles.managerContainerDark]}>
                    {managers.map((manager) => (
                      <TouchableOpacity
                        key={manager.id}
                        onPress={() => setFormData({ ...formData, manager_id: manager.id })}
                        style={[
                          styles.managerItem,
                          formData.manager_id === manager.id
                            ? styles.managerItemSelected
                            : [styles.managerItemUnselected, isDark && styles.managerItemUnselectedDark]
                        ]}
                      >
                        <View style={styles.managerInfo}>
                          <Text style={[styles.managerName, isDark && styles.managerNameDark]}>{manager.full_name}</Text>
                          <Text style={[styles.managerSection, isDark && styles.managerSectionDark]}>{manager.section}</Text>
                        </View>
                        {formData.manager_id === manager.id && (
                          <CheckCircle size={20} color="#3b82f6" strokeWidth={2} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={resetForm}
                  style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
                >
                  <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>
                    {editingEmployee ? 'Modifier' : 'Créer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Liste des employés */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, isDark && styles.listTitleDark]}>
              Employés ({employees.length})
            </Text>
            {user?.role === 'director' && user.store_id && (
              <Text style={[styles.filterInfo, isDark && styles.filterInfoDark]}>
                Magasin #{user.store_id} uniquement
              </Text>
            )}
          </View>
          
          {employees.length === 0 ? (
            <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
              <Users size={48} color={isDark ? "#71717a" : "#9ca3af"} strokeWidth={1} />
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>Aucun employé trouvé</Text>
            </View>
          ) : (
            <View style={styles.employeesList}>
              {employees.map((employee) => (
                <View key={employee.id} style={[styles.employeeCard, isDark && styles.employeeCardDark]}>
                  <View style={styles.employeeContent}>
                    <View style={styles.employeeInfo}>
                      <View style={styles.employeeHeader}>
                        <Text style={[styles.employeeName, isDark && styles.employeeNameDark]}>
                          {employee.name}
                        </Text>
                        <View 
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(employee.status) + '20' }
                          ]}
                        >
                          <Text 
                            style={[
                              styles.statusText,
                              { color: getStatusColor(employee.status) }
                            ]}
                          >
                            {getStatusText(employee.status)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.employeeDetails}>
                        <View style={styles.detailRow}>
                          <Briefcase size={16} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2} />
                          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>{employee.role}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <MapPin size={16} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2} />
                          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>{employee.section}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Clock size={16} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2} />
                          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>Équipe {employee.shift}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <User size={16} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2} />
                          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>{employee.manager_name}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.employeeActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(employee)}
                        style={[styles.actionButton, styles.editButton, isDark && styles.editButtonDark]}
                      >
                        <Edit3 size={20} color="#3b82f6" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          console.log('🔴 Bouton supprimer cliqué pour:', employee?.name || 'employé inconnu');
                          console.log('🔴 Données employé:', employee);
                          handleDelete(employee);
                        }}
                        style={[styles.actionButton, styles.deleteButton, isDark && styles.deleteButtonDark]}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={20} color="#ef4444" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal pour ajouter un nouveau rayon */}
      {showAddSectionModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Nouveau rayon
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddSectionModal(false);
                  setNewSectionName('');
                }}
                style={styles.modalCloseButton}
              >
                <X size={24} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                Nom du rayon
              </Text>
              <TextInput
                value={newSectionName}
                onChangeText={setNewSectionName}
                placeholder="Ex: Produits bio, Vins & Spiritueux"
                placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                style={[styles.modalTextInput, isDark && styles.modalTextInputDark]}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddSectionModal(false);
                    setNewSectionName('');
                  }}
                  style={[styles.modalCancelButton, isDark && styles.modalCancelButtonDark]}
                >
                  <Text style={[styles.modalCancelButtonText, isDark && styles.modalCancelButtonTextDark]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={addNewSection}
                  style={styles.modalAddButton}
                  disabled={!newSectionName.trim()}
                >
                  <Text style={styles.modalAddButtonText}>
                    Ajouter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Gestionnaire centralisé des rayons */}
      <SectionsManager
        visible={showSectionsManager}
        onClose={() => setShowSectionsManager(false)}
        isDark={isDark}
      />

      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },

  // Loading styles
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  loadingTextDark: {
    color: '#a1a1aa',
  },

  // Header styles
  header: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerDark: {
    backgroundColor: '#27272a',
    shadowColor: '#000',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerTitleDark: {
    color: '#f4f4f5',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonDark: {
    backgroundColor: '#3b82f6',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 4,
  },

  // Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
  },
  errorContainerDark: {
    backgroundColor: '#7f1d1d',
    borderColor: '#b91c1c',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  errorTextDark: {
    color: '#fca5a5',
  },

  // Warning styles
  warningContainer: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
  },
  warningContainerDark: {
    backgroundColor: '#78350f',
    borderColor: '#d97706',
  },
  warningText: {
    color: '#92400e',
    fontSize: 14,
  },
  warningTextDark: {
    color: '#fbbf24',
  },

  // Form styles
  formContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContainerDark: {
    backgroundColor: '#27272a',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  formTitleDark: {
    color: '#f4f4f5',
  },
  closeButton: {
    padding: 4,
  },
  formFields: {
    gap: 16,
  },
  fieldContainer: {
    gap: 4,
  },
  dropdownFieldContainer: {
    zIndex: 9999,
    elevation: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  fieldLabelDark: {
    color: '#d1d5db',
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

  // Shift selection styles
  shiftContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  shiftButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  shiftButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  shiftButtonUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  shiftButtonUnselectedDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  shiftButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  shiftButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  shiftButtonTextUnselected: {
    color: '#374151',
  },
  shiftButtonTextUnselectedDark: {
    color: '#d1d5db',
  },

  // Manager selection styles
  managerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  managerContainerDark: {
    borderColor: '#52525b',
  },
  managerItem: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  managerItemSelected: {
    backgroundColor: '#dbeafe',
  },
  managerItemUnselected: {
    backgroundColor: '#ffffff',
  },
  managerItemUnselectedDark: {
    backgroundColor: '#3f3f46',
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  managerNameDark: {
    color: '#f4f4f5',
  },
  managerSection: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  managerSectionDark: {
    color: '#a1a1aa',
  },

  // No manager available styles
  noManagerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  noManagerContainerDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  noManagerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  noManagerTextDark: {
    color: '#a1a1aa',
  },
  noManagerSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  noManagerSubtextDark: {
    color: '#71717a',
  },

  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },

  // List styles
  listContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  listTitleDark: {
    color: '#f4f4f5',
  },
  filterInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  filterInfoDark: {
    color: '#a1a1aa',
  },

  // Empty state styles
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainerDark: {
    backgroundColor: '#27272a',
  },
  emptyText: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 16,
  },
  emptyTextDark: {
    color: '#a1a1aa',
  },

  // Employee list styles
  employeesList: {
    gap: 12,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeCardDark: {
    backgroundColor: '#27272a',
  },
  employeeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  employeeNameDark: {
    color: '#f4f4f5',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  employeeDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#6b7280',
    fontSize: 14,
  },
  detailTextDark: {
    color: '#a1a1aa',
  },

  // Action buttons styles
  employeeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#dbeafe',
  },
  editButtonDark: {
    backgroundColor: '#1e3a8a',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonDark: {
    backgroundColor: '#7f1d1d',
  },

  // Dropdown styles
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonDark: {
    borderColor: '#52525b',
    backgroundColor: '#3f3f46',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  dropdownButtonTextDark: {
    color: '#f4f4f5',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  placeholderTextDark: {
    color: '#71717a',
  },
  dropdownArrow: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownArrowText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dropdownArrowTextDark: {
    color: '#a1a1aa',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 15,
  },
  dropdownMenuDark: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItem: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownItemDark: {
    borderBottomColor: '#52525b',
  },
  dropdownItemSelected: {
    backgroundColor: '#dbeafe',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownItemTextDark: {
    color: '#f4f4f5',
  },
  dropdownItemTextSelected: {
    color: '#1d4ed8',
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    marginRight: 4,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  addSectionButtonDark: {
    borderTopColor: '#52525b',
  },
  addSectionButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  addSectionButtonTextDark: {
    color: '#60a5fa',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    maxWidth: 400,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainerDark: {
    backgroundColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalTitleDark: {
    color: '#f4f4f5',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalLabelDark: {
    color: '#d1d5db',
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  modalTextInputDark: {
    borderColor: '#52525b',
    backgroundColor: '#3f3f46',
    color: '#f4f4f5',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonDark: {
    backgroundColor: '#52525b',
  },
  modalCancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  modalCancelButtonTextDark: {
    color: '#d1d5db',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  breakButton: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 8,
  },
  breakButtonDark: {
    backgroundColor: '#451a03',
  },
});