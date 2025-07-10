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
} from 'react-native';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';

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
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(item.id, item.username)}
        >
          <Text style={styles.deleteButtonText}>Supprimer</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {userFilters?.store_id && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>
            📍 Affichage: Directeurs et Managers du magasin #{userFilters.store_id} uniquement
          </Text>
          {currentUserRole === 'director' && (
            <Text style={styles.filterSubtext}>
              En tant que directeur, vous ne voyez que les comptes utilisateurs de votre magasin
            </Text>
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
        onRequestClose={() => setModalVisible(false)}
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

            <TextInput
              style={styles.input}
              placeholder="Section (optionnel)"
              value={formData.section}
              onChangeText={(text) => setFormData({ ...formData, section: text })}
            />

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
                onPress={() => setModalVisible(false)}
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
}); 