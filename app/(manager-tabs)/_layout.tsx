import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { ArrowLeft, LogOut } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function ManagerTabLayout() {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isMainPage, setIsMainPage] = useState(true);

  useEffect(() => {
    // Log pour debug
    console.log('PATHNAME ACTUEL:', pathname);
    // Accueil manager : toutes les variantes (y compris la page affichée sur la capture)
    const isOnManagerHome = pathname === '/(manager-tabs)' || pathname === '/(manager-tabs)/' || pathname.endsWith('/index');
    setIsMainPage(isOnManagerHome);
    setIsVisible(pathname.includes('manager-tabs'));
  }, [pathname]);

  const handleButtonPress = () => {
    if (isMainPage) {
      // Action de déconnexion ici
      console.log('Déconnexion demandée');
      // TODO: Appeler la vraie fonction de déconnexion si besoin
    } else {
      // Retour en arrière avec expo-router
      router.back();
    }
  };

  // Styles inline pour éviter les warnings
  const getButtonStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: 30,
      right: 30,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      zIndex: 1000,
    };

    if (Platform.OS === 'web') {
      return {
        ...baseStyle,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
        backgroundColor: isMainPage ? '#ef4444' : '#3b82f6',
      };
    } else {
      return {
        ...baseStyle,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: isMainPage ? '#ef4444' : '#3b82f6',
      };
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="calculator" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="team" />
        <Tabs.Screen name="efficiency" />
        <Tabs.Screen name="settings" />
      </Tabs>
      
      {/* Retire le console.log qui cause l'erreur TypeScript */}
      {isVisible && isMainPage && (
      <TouchableOpacity 
        style={isMainPage ? [getButtonStyle(), { backgroundColor: '#e74c3c' }] : getButtonStyle()}
        onPress={handleButtonPress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isMainPage ? (
          <LogOut color="#fff" size={24} strokeWidth={2} />
        ) : (
          <ArrowLeft color="#ffffff" size={24} strokeWidth={2} />
        )}
      </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
});