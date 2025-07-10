import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useUserProfile } from '../hooks/useUserProfile';
import UserManagement from '../components/UserManagement';

export default function UserManagementPage() {
  const { profile: user } = useUserProfile();
  
  // Déterminer les filtres à appliquer selon le rôle de l'utilisateur
  const getUserFilters = () => {
    if (user?.role === 'director' && user.store_id) {
      // Les directeurs ne voient que les directeurs et managers de leur magasin (sauf eux-mêmes)
      return { 
        store_id: user.store_id,
        role: undefined, // On filtrera les rôles dans le hook mais on veut manager ET director
        excludeUserId: user.id // Exclure l'utilisateur connecté
      };
    }
    if (user?.role === 'admin') {
      // Les admins peuvent voir tous les directeurs et managers (sauf eux-mêmes)
      return { 
        excludeUserId: user?.id 
      };
    }
    // Les managers ne peuvent pas gérer d'utilisateurs
    return { store_id: -1 }; // Aucun résultat
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#333" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Gestion des utilisateurs</Text>
        <View style={styles.placeholder} />
      </View>

      <UserManagement 
        userFilters={getUserFilters()} 
        currentUserRole={user?.role}
        currentUserStoreId={user?.store_id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34, // Same width as back button for centering
  },
}); 