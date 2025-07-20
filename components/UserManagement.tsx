import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Plus, X, Settings } from 'lucide-react-native';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';
import { useSections } from '../contexts/SectionsContext';
import { SectionsManager } from './SectionsManager';
import { supabase } from '../lib/supabase';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'manager' | 'director' | 'admin';
  section: string | null;
  store_id: number;
  is_active: boolean;
  store_name?: string;
  store_address?: string;
}

interface UserFilters {
  store_id?: number;
  role?: 'manager' | 'director' | 'admin';
}

interface UserManagementProps {
  userFilters?: UserFilters;
  currentUserRole?: 'manager' | 'director' | 'admin';
  currentUserStoreId?: number;
}

export default function UserManagement({ 
  userFilters, 
  currentUserRole, 
  currentUserStoreId 
}: UserManagementProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Utiliser le contexte centralisé pour les rayons
  const { availableSections, addSection, removeSection } = useSections();
  
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showSectionsManager, setShowSectionsManager] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: number, username: string} | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Utiliser le hook useSupabaseUsers avec les filtres
  const { 
    users, 
    isLoading, 
    error, 
    createUser, 
    updateUser, 
    deleteUser,
    refreshUsers 
  } = useSupabaseUsers(userFilters);
  
  // Formulaire
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'manager' as 'manager' | 'director' | 'admin',
    section: '',
    store_id: 1
  });

  const handleCreateUser = async () => {
    try {
      if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      const result = await createUser(formData);
      
      if (result.success) {
        Alert.alert('Succès', 'Utilisateur créé avec succès');
        resetForm();
        setModalVisible(false);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la création de l\'utilisateur');
      console.error('Erreur création utilisateur:', error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!editingUser || !formData.username || !formData.email || !formData.full_name) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
        return;
      }

      const updateData = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        section: formData.section || undefined,
        store_id: formData.store_id,
        ...(formData.password && { password: formData.password })
      };

      const result = await updateUser(editingUser.id.toString(), updateData);
      
      if (result.success) {
        Alert.alert('Succès', 'Utilisateur modifié avec succès');
        resetForm();
        setModalVisible(false);
        setEditingUser(null);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la modification de l\'utilisateur');
      console.error('Erreur modification utilisateur:', error);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (currentUserRole === 'director') {
      setDeleteTarget({ id: userId, username });
      setShowDeleteModal(true);
      setDeletePassword('');
      setDeleteError('');
      return;
    }
    // Ancienne logique pour les autres rôles
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteUser(userId.toString());
              if (result.success) {
                Alert.alert('Succès', 'Utilisateur supprimé avec succès');
              } else {
                Alert.alert('Erreur', result.error || 'Erreur lors de la suppression');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression de l\'utilisateur');
              console.error('Erreur suppression utilisateur:', error);
            }
          }
        }
      ]
    );
  };

  // Fonction pour confirmer la suppression après vérification du mot de passe
  const confirmDeleteWithPassword = async () => {
    if (!deletePassword) {
      setDeleteError('Veuillez entrer votre mot de passe.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      // Récupérer l'email du directeur connecté
      const user = supabase.auth.user ? supabase.auth.user() : null;
      const email = user?.email;
      if (!email) {
        setDeleteError('Impossible de vérifier votre identité.');
        setDeleteLoading(false);
        return;
      }
      // Vérification du mot de passe via signIn
      const { error } = await supabase.auth.signIn({ email, password: deletePassword });
      if (error) {
        setDeleteError('Mot de passe incorrect.');
        setDeleteLoading(false);
        return;
      }
      // Mot de passe correct, suppression
      if (deleteTarget) {
        const result = await deleteUser(deleteTarget.id.toString());
        if (result.success) {
          setShowDeleteModal(false);
          setDeleteTarget(null);
          setDeletePassword('');
          setDeleteError('');
          Alert.alert('Succès', 'Utilisateur supprimé avec succès');
          refreshUsers();
        } else {
          setDeleteError(result.error || 'Erreur lors de la suppression');
        }
      }
    } catch (e) {
      setDeleteError('Erreur lors de la vérification.');
    }
    setDeleteLoading(false);
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
        Alert.alert('Information', 'Ce rayon existe déjà dans la liste');
      }
    }
  };

  const handleRemoveSection = (sectionToRemove: string) => {
    removeSection(sectionToRemove);
    if (formData.section === sectionToRemove) {
      setFormData({ ...formData, section: '' });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'manager',
      section: '',
      store_id: 1
    });
    setShowSectionDropdown(false);
    setShowAddSectionModal(false);
    setNewSectionName('');
  };

  const openCreateModal = () => {
    resetForm();
    setEditingUser(null);
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      full_name: user.full_name,
      role: user.role,
      section: user.section || '',
      store_id: user.store_id
    });
    setEditingUser(user);
    setModalVisible(true);
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.full_name}</Text>
        <Text style={styles.email}>{item.email || 'Pas d\'email'}</Text>
        <Text style={styles.userDetails}>@{item.username} • {item.store_name}</Text>
        <Text style={[styles.role, item.role === 'director' ? styles.director : styles.manager]}>
          {item.role === 'director' ? 'Directeur' : 'Manager'}
          {item.section && ` • ${item.section}`}
        </Text>
        <Text style={[styles.status, item.is_active ? styles.active : styles.inactive]}>
          {item.is_active ? 'Actif' : 'Inactif'}
        </Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>
        {/* Pour un directeur, afficher le bouton supprimer uniquement sur les managers */}
        {currentUserRole === 'director' && item.role === 'manager' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item.id, item.username)}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        )}
        {/* Pour les autres rôles, logique existante */}
        {currentUserRole !== 'director' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item.id, item.username)}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading && users.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshUsers}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des utilisateurs</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: '#10b981' }]} 
            onPress={() => setShowSectionsManager(true)}
          >
            <Settings size={16} color="white" strokeWidth={2} />
            <Text style={styles.addButtonText}>Rayons</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {userFilters?.store_id && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>
            📍 {users.length > 0 && users[0].store_name ? users[0].store_name : `Magasin #${userFilters.store_id}`}
          </Text>
          {currentUserRole === 'director' && (
            <View>
              <Text style={styles.filterSubtext}>
                En tant que directeur, vous ne voyez que les comptes utilisateurs de votre magasin
              </Text>

            </View>
          )}
        </View>
      )}

      {currentUserRole === 'manager' && (
        <View style={styles.restrictionInfo}>
          <Text style={styles.restrictionText}>
            🚫 Les managers ne peuvent pas gérer les comptes utilisateurs
          </Text>
        </View>
      )}

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucun utilisateur trouvé</Text>
          <Text style={styles.emptyStateSubtext}>
            {userFilters?.store_id && userFilters.store_id > 0
              ? 'Aucun directeur ou manager dans ce magasin' 
              : currentUserRole === 'manager' 
                ? 'Vous n\'avez pas accès à la gestion des utilisateurs'
                : 'Ajoutez votre premier utilisateur'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
          refreshing={isLoading}
          onRefresh={refreshUsers}
          contentContainerStyle={styles.usersList}
        />
      )}

      {/* Modal de création/modification */}
              <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setModalVisible(false);
            setShowSectionDropdown(false);
            setShowAddSectionModal(false);
          }}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder={editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Menu déroulant pour la section */}
            <Text style={styles.sectionLabel}>Rayon (optionnel)</Text>
            <TouchableOpacity
              onPress={() => setShowSectionDropdown(!showSectionDropdown)}
              style={[styles.dropdownButton, showSectionDropdown && styles.dropdownButtonActive]}
            >
              <Text style={[
                styles.dropdownButtonText, 
                !formData.section && styles.placeholderText
              ]}>
                {formData.section || 'Sélectionner un rayon'}
              </Text>
              <View style={[styles.dropdownArrow, showSectionDropdown && styles.dropdownArrowUp]}>
                <Text style={styles.dropdownArrowText}>▼</Text>
              </View>
            </TouchableOpacity>

            {showSectionDropdown && (
              <View style={styles.dropdownMenu}>
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
                          formData.section === section && styles.dropdownItemSelected
                        ]}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          formData.section === section && styles.dropdownItemTextSelected
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
                    style={styles.addSectionButton}
                  >
                    <Plus size={16} color="#3b82f6" strokeWidth={2} />
                    <Text style={styles.addSectionButtonText}>
                      Ajouter un rayon
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Rôle :</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'manager' && styles.roleButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'manager' })}
                >
                  <Text style={[
                    styles.roleButtonText,
                    formData.role === 'manager' && styles.roleButtonTextActive
                  ]}>
                    Manager
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'director' && styles.roleButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'director' })}
                >
                  <Text style={[
                    styles.roleButtonText,
                    formData.role === 'director' && styles.roleButtonTextActive
                  ]}>
                    Directeur
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setShowSectionDropdown(false);
                  setShowAddSectionModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={editingUser ? handleUpdateUser : handleCreateUser}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'En cours...' : (editingUser ? 'Modifier' : 'Créer')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pour ajouter un nouveau rayon */}
      {showAddSectionModal && (
        <Modal
          visible={showAddSectionModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddSectionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.addSectionModalContent}>
              <View style={styles.addSectionModalHeader}>
                <Text style={styles.addSectionModalTitle}>
                  Nouveau rayon
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddSectionModal(false);
                    setNewSectionName('');
                  }}
                  style={styles.modalCloseButton}
                >
                  <X size={24} color="#6b7280" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.addSectionModalBody}>
                <Text style={styles.addSectionModalLabel}>
                  Nom du rayon
                </Text>
                <TextInput
                  value={newSectionName}
                  onChangeText={setNewSectionName}
                  placeholder="Ex: Produits bio, Vins & Spiritueux"
                  placeholderTextColor="#9ca3af"
                  style={styles.addSectionModalInput}
                  autoFocus
                />
                
                <View style={styles.addSectionModalActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddSectionModal(false);
                      setNewSectionName('');
                    }}
                    style={styles.addSectionCancelButton}
                  >
                    <Text style={styles.addSectionCancelButtonText}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={addNewSection}
                    style={styles.addSectionConfirmButton}
                    disabled={!newSectionName.trim()}
                  >
                    <Text style={styles.addSectionConfirmButtonText}>
                      Ajouter
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
                 </Modal>
       )}

       {/* Modal de confirmation suppression par mot de passe */}
  {showDeleteModal && (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirmer la suppression</Text>
          <Text style={{ marginBottom: 12 }}>
            Pour supprimer le compte manager <Text style={{ fontWeight: 'bold' }}>{deleteTarget?.username}</Text>, veuillez entrer votre mot de passe&nbsp;:
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!deleteLoading}
          />
          {deleteError ? (
            <Text style={{ color: '#ef4444', marginTop: 8 }}>{deleteError}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'flex-end' }}>
            <TouchableOpacity
              style={[styles.cancelButton, { marginRight: 8 }]}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, deleteLoading && styles.saveButtonDisabled]}
              onPress={confirmDeleteWithPassword}
              disabled={deleteLoading}
            >
              <Text style={styles.saveButtonText}>{deleteLoading ? 'Suppression...' : 'Confirmer'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )}

       {/* Gestionnaire centralisé des rayons */}
       <SectionsManager
         visible={showSectionsManager}
         onClose={() => setShowSectionsManager(false)}
         isDark={false}
       />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  usersList: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  role: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  manager: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  director: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  },
  status: {
    fontSize: 11,
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  inactive: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#1976d2',
  },
  filterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  filterSubtext: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  restrictionInfo: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#c62828',
  },
  restrictionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
  },
  // Styles pour le menu déroulant des rayons
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dropdownButtonActive: {
    borderColor: '#007bff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
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
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: -15,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#1976d2',
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
  addSectionButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  // Styles pour le modal d'ajout de rayon
  addSectionModalContent: {
    backgroundColor: 'white',
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
  addSectionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addSectionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  addSectionModalBody: {
    gap: 16,
  },
  addSectionModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  addSectionModalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  addSectionModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addSectionCancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSectionCancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  addSectionConfirmButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSectionConfirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
}); 