import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSupabaseStores } from '../hooks/useSupabaseStores';
import { useSupabaseUsers } from '../hooks/useSupabaseUsers';

export default function DeveloperPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<'stores' | 'users'>('stores');

  const {
    stores,
    isLoading: storesLoading,
    error: storesError,
    createStore,
    updateStore,
    deleteStore,
  } = useSupabaseStores();

  const {
    users,
    isLoading: usersLoading,
    error: usersError,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleUserStatus,
  } = useSupabaseUsers();

  // État pour les formulaires
  const [newStore, setNewStore] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
  });

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'manager' as 'manager' | 'director' | 'admin',
    section: '',
    store_id: 0,
  });

  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'manager' as 'manager' | 'director' | 'admin',
    section: '',
    store_id: 0,
    password: '', // Nouveau champ pour le mot de passe
  });

  const styles = {
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#a0a0a0' : '#666666',
    },
    tabContainer: {
      flexDirection: 'row' as const,
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
    },
    tab: {
      flex: 1,
      padding: 15,
      alignItems: 'center' as const,
    },
    activeTab: {
      backgroundColor: isDark ? '#333' : '#007AFF',
    },
    tabText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    activeTabText: {
      color: isDark ? '#f4f4f5' : '#ffffff',
    },
    inactiveTabText: {
      color: isDark ? '#a0a0a0' : '#666666',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
      marginBottom: 15,
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
      marginBottom: 5,
    },
    cardText: {
      fontSize: 14,
      color: isDark ? '#a0a0a0' : '#666666',
      marginBottom: 2,
    },
    form: {
      backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
      marginBottom: 15,
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#ddd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 15,
      backgroundColor: isDark ? '#333' : '#ffffff',
      color: isDark ? '#f4f4f5' : '#000000',
      fontSize: 16,
    },
    picker: {
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#ddd',
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: isDark ? '#333' : '#ffffff',
    },
    button: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginBottom: 10,
    },
    buttonText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    dangerButton: {
      backgroundColor: '#FF3B30',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center' as const,
      marginTop: 10,
    },
    warningButton: {
      backgroundColor: '#FF9500',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center' as const,
      marginTop: 5,
    },
    successButton: {
      backgroundColor: '#34C759',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center' as const,
      marginTop: 5,
    },
    editButton: {
      backgroundColor: '#007AFF',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center' as const,
      marginTop: 5,
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 14,
      marginBottom: 10,
      textAlign: 'center' as const,
    },
    switchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 10,
    },
    switchLabel: {
      fontSize: 14,
      color: isDark ? '#f4f4f5' : '#000000',
    },
    roleContainer: {
      marginBottom: 15,
    },
    roleLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
      marginBottom: 5,
    },
    roleButtons: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      backgroundColor: isDark ? '#333' : '#e0e0e0',
      borderRadius: 8,
      padding: 5,
    },
    roleButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 6,
    },
    roleButtonActive: {
      backgroundColor: '#007AFF',
    },
    roleButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
    },
    roleButtonTextActive: {
      color: '#ffffff',
    },
    storeContainer: {
      marginBottom: 15,
    },
    storeLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
      marginBottom: 5,
    },
    storeButtons: {
      backgroundColor: isDark ? '#333' : '#e0e0e0',
      borderRadius: 8,
      padding: 5,
    },
    storeButton: {
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 6,
      marginBottom: 5,
      backgroundColor: isDark ? '#444' : '#f0f0f0',
    },
    storeButtonActive: {
      backgroundColor: '#007AFF',
    },
    storeButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDark ? '#f4f4f5' : '#000000',
      textAlign: 'center' as const,
    },
    storeButtonTextActive: {
      color: '#ffffff',
    },
  };

  const handleCreateStore = async () => {
    if (!newStore.name.trim() || !newStore.city.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le nom et la ville du magasin');
      return;
    }

    setIsCreatingStore(true);
    try {
      const result = await createStore(newStore);
      if (result.success) {
        setNewStore({
          name: '',
          city: '',
          address: '',
          phone: '',
        });
        Alert.alert('Succès', 'Magasin créé avec succès');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la création du magasin');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur. Vérifiez que le serveur API est démarré.');
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim() || !newUser.full_name.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (newUser.store_id === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un magasin');
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await createUser(newUser);
      if (result.success) {
        setNewUser({
          username: '',
          email: '',
          password: '',
          full_name: '',
          role: 'manager',
          section: '',
          store_id: 0,
        });
        Alert.alert('Succès', 'Utilisateur créé avec succès. Il peut maintenant se connecter avec ses identifiants.');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur. Vérifiez que le serveur API est démarré.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteStore = async (id: number) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce magasin ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteStore(id);
            if (result.success) {
              Alert.alert('Succès', 'Magasin supprimé avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (id: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action supprimera également son compte d\'authentification.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteUser(id);
            if (result.success) {
              Alert.alert('Succès', 'Utilisateur supprimé avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nouveau mot de passe');
      return;
    }

    const result = await resetPassword(resetPasswordUserId, newPassword);
    if (result.success) {
      setResetPasswordUserId(null);
      setNewPassword('');
      Alert.alert('Succès', 'Mot de passe réinitialisé avec succès');
    } else {
      Alert.alert('Erreur', result.error || 'Erreur lors de la réinitialisation');
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    const result = await toggleUserStatus(id);
    if (result.success) {
      Alert.alert('Succès', 'Statut de l\'utilisateur modifié');
    } else {
      Alert.alert('Erreur', result.error || 'Erreur lors de la modification');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name || '',
      role: user.role,
      section: user.section || '',
      store_id: user.store_id || 0,
      password: '', // Initialiser le mot de passe à vide lors de l'édition
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editUserForm.username.trim() || !editUserForm.email.trim() || !editUserForm.full_name.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editUserForm.store_id === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un magasin');
      return;
    }

    // Préparer les données à envoyer
    const updateData: any = {
      username: editUserForm.username,
      email: editUserForm.email,
      full_name: editUserForm.full_name,
      role: editUserForm.role,
      section: editUserForm.section,
      store_id: editUserForm.store_id,
    };

    // Ajouter le mot de passe seulement s'il est fourni
    if (editUserForm.password.trim()) {
      updateData.password = editUserForm.password;
    }

    const result = await updateUser(editingUser.id, updateData);
    if (result.success) {
      setEditingUser(null);
      setEditUserForm({
        username: '',
        email: '',
        full_name: '',
        role: 'manager',
        section: '',
        store_id: 0,
        password: '',
      });
      Alert.alert('Succès', 'Utilisateur modifié avec succès');
    } else {
      Alert.alert('Erreur', result.error || 'Erreur lors de la modification de l\'utilisateur');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUserForm({
      username: '',
      email: '',
      full_name: '',
      role: 'manager',
      section: '',
      store_id: 0,
      password: '',
    });
  };

  const renderStoresTab = () => (
    <View>
      {/* Formulaire de création de magasin */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Créer un nouveau magasin</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nom du magasin *"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newStore.name}
          onChangeText={(text) => setNewStore({ ...newStore, name: text })}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Ville *"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newStore.city}
          onChangeText={(text) => setNewStore({ ...newStore, city: text })}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Adresse"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newStore.address}
          onChangeText={(text) => setNewStore({ ...newStore, address: text })}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newStore.phone}
          onChangeText={(text) => setNewStore({ ...newStore, phone: text })}
        />
        
        <TouchableOpacity 
          style={[styles.button, isCreatingStore && { opacity: 0.6 }]} 
          onPress={handleCreateStore}
          disabled={isCreatingStore}
        >
          <Text style={styles.buttonText}>
            {isCreatingStore ? 'Création...' : 'Créer le magasin'}
          </Text>
        </TouchableOpacity>
      </View>

      {storesError && <Text style={styles.errorText}>{storesError}</Text>}

      {/* Liste des magasins */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Magasins existants ({stores.length})</Text>
        {storesLoading ? (
          <Text style={styles.cardText}>Chargement...</Text>
        ) : (
          stores.map((store) => (
            <View key={store.id} style={styles.card}>
              <Text style={styles.cardTitle}>{store.name}</Text>
              <Text style={styles.cardText}>Ville: {store.city}</Text>
              {store.address && <Text style={styles.cardText}>Adresse: {store.address}</Text>}
              {store.phone && <Text style={styles.cardText}>Téléphone: {store.phone}</Text>}
              <Text style={styles.cardText}>
                Statut: {store.is_active ? '✅ Actif' : '❌ Inactif'}
              </Text>
              <Text style={styles.cardText}>Créé le: {new Date(store.created_at).toLocaleDateString()}</Text>
              
              <TouchableOpacity
                style={styles.warningButton}
                onPress={() => updateStore(store.id, { is_active: !store.is_active })}
              >
                <Text style={styles.buttonText}>
                  {store.is_active ? 'Désactiver' : 'Activer'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => handleDeleteStore(store.id)}
              >
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderUsersTab = () => (
    <View>
      {/* Formulaire de création d'utilisateur */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Créer un nouvel utilisateur</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur *"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newUser.username}
          onChangeText={(text) => setNewUser({ ...newUser, username: text })}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email *"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newUser.email}
          onChangeText={(text) => setNewUser({ ...newUser, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Mot de passe *"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newUser.password}
          onChangeText={(text) => setNewUser({ ...newUser, password: text })}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Nom complet *"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newUser.full_name}
          onChangeText={(text) => setNewUser({ ...newUser, full_name: text })}
        />
        
        {/* Sélection du rôle avec boutons radio */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Rôle *</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                newUser.role === 'manager' && styles.roleButtonActive
              ]}
              onPress={() => setNewUser({ ...newUser, role: 'manager' })}
            >
              <Text style={[
                styles.roleButtonText,
                newUser.role === 'manager' && styles.roleButtonTextActive
              ]}>
                Manager
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleButton,
                newUser.role === 'director' && styles.roleButtonActive
              ]}
              onPress={() => setNewUser({ ...newUser, role: 'director' })}
            >
              <Text style={[
                styles.roleButtonText,
                newUser.role === 'director' && styles.roleButtonTextActive
              ]}>
                Directeur
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Section (optionnel)"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={newUser.section}
          onChangeText={(text) => setNewUser({ ...newUser, section: text })}
        />
        
        {/* Sélection du magasin avec boutons */}
        <View style={styles.storeContainer}>
          <Text style={styles.storeLabel}>Magasin *</Text>
          <View style={styles.storeButtons}>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.storeButton,
                  newUser.store_id === store.id && styles.storeButtonActive
                ]}
                onPress={() => setNewUser({ ...newUser, store_id: store.id })}
              >
                <Text style={[
                  styles.storeButtonText,
                  newUser.store_id === store.id && styles.storeButtonTextActive
                ]}>
                  {store.name} ({store.city})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, isCreatingUser && { opacity: 0.6 }]} 
          onPress={handleCreateUser}
          disabled={isCreatingUser}
        >
          <Text style={styles.buttonText}>
            {isCreatingUser ? 'Création...' : 'Créer l\'utilisateur'}
          </Text>
        </TouchableOpacity>
      </View>

      {usersError && <Text style={styles.errorText}>{usersError}</Text>}

      {/* Formulaire d'édition d'utilisateur */}
      {editingUser && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Modifier l'utilisateur: {editingUser.full_name}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur *"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={editUserForm.username}
            onChangeText={(text) => setEditUserForm({ ...editUserForm, username: text })}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={editUserForm.email}
            onChangeText={(text) => setEditUserForm({ ...editUserForm, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Nom complet *"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={editUserForm.full_name}
            onChangeText={(text) => setEditUserForm({ ...editUserForm, full_name: text })}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe (optionnel)"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={editUserForm.password}
            onChangeText={(text) => setEditUserForm({ ...editUserForm, password: text })}
            secureTextEntry
          />
          
          {/* Sélection du rôle avec boutons radio */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Rôle *</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  editUserForm.role === 'manager' && styles.roleButtonActive
                ]}
                onPress={() => setEditUserForm({ ...editUserForm, role: 'manager' })}
              >
                <Text style={[
                  styles.roleButtonText,
                  editUserForm.role === 'manager' && styles.roleButtonTextActive
                ]}>
                  Manager
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  editUserForm.role === 'director' && styles.roleButtonActive
                ]}
                onPress={() => setEditUserForm({ ...editUserForm, role: 'director' })}
              >
                <Text style={[
                  styles.roleButtonText,
                  editUserForm.role === 'director' && styles.roleButtonTextActive
                ]}>
                  Directeur
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Section (optionnel)"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={editUserForm.section}
            onChangeText={(text) => setEditUserForm({ ...editUserForm, section: text })}
          />
          
          {/* Sélection du magasin avec boutons */}
          <View style={styles.storeContainer}>
            <Text style={styles.storeLabel}>Magasin *</Text>
            <View style={styles.storeButtons}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeButton,
                    editUserForm.store_id === store.id && styles.storeButtonActive
                  ]}
                  onPress={() => setEditUserForm({ ...editUserForm, store_id: store.id })}
                >
                  <Text style={[
                    styles.storeButtonText,
                    editUserForm.store_id === store.id && styles.storeButtonTextActive
                  ]}>
                    {store.name} ({store.city})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleUpdateUser}>
            <Text style={styles.buttonText}>Sauvegarder les modifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleCancelEdit}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Réinitialisation de mot de passe */}
      {resetPasswordUserId && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Réinitialiser le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              setResetPasswordUserId(null);
              setNewPassword('');
            }}
          >
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste des utilisateurs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Utilisateurs existants ({users.length})</Text>
        {usersLoading ? (
          <Text style={styles.cardText}>Chargement...</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.card}>
              <Text style={styles.cardTitle}>{user.full_name}</Text>
              <Text style={styles.cardText}>Username: {user.username}</Text>
              <Text style={styles.cardText}>Email: {user.email}</Text>
              <Text style={styles.cardText}>Rôle: {user.role}</Text>
              {user.section && <Text style={styles.cardText}>Section: {user.section}</Text>}
              <Text style={styles.cardText}>Magasin: {user.store_name}</Text>
              <Text style={styles.cardText}>
                Statut: {user.is_active ? '✅ Actif' : '❌ Inactif'}
              </Text>
              
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditUser(user)}
              >
                <Text style={styles.buttonText}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => setResetPasswordUserId(user.id)}
              >
                <Text style={styles.buttonText}>Réinitialiser mot de passe</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.warningButton}
                onPress={() => handleToggleUserStatus(user.id)}
              >
                <Text style={styles.buttonText}>
                  {user.is_active ? 'Désactiver' : 'Activer'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => handleDeleteUser(user.id)}
              >
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Développeur</Text>
        <Text style={styles.subtitle}>
          Gestion des magasins et utilisateurs
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stores' && styles.activeTab]}
          onPress={() => setActiveTab('stores')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'stores' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Magasins
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'users' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Utilisateurs
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'stores' ? renderStoresTab() : renderUsersTab()}
      </ScrollView>
    </View>
  );
} 