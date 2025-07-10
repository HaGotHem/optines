import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  InteractionManager,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock, Eye, EyeOff, ArrowLeft, Package, Mail, AlertCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { userType, animation } = useLocalSearchParams<{ userType: string; animation?: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUsername, setLastUsername] = useState('');
  const { isDark } = useTheme();

  // Nouveau hook Supabase Auth
  const { login, isLoading, error: authError } = useSupabaseAuth();

  // Obtenir les dimensions de l'écran avec listener pour les changements
  const { width: screenWidth, height: screenHeight } = dimensions;
  const isTablet = screenWidth > 768;
  const isLargeScreen = screenWidth > 1024;

  // Log pour debug
  React.useEffect(() => {
    // console.log('📱 Dimensions détectées:', {
    //   width: screenWidth,
    //   height: screenHeight,
    //   isTablet,
    //   isLargeScreen,
    //   platform: Platform.OS
    // });
  }, [screenWidth, screenHeight, isTablet, isLargeScreen]);

  // Animations pour améliorer la réactivité
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = React.useRef(new Animated.Value(1)).current;
  const popupScaleAnim = React.useRef(new Animated.Value(0)).current;
  const popupOpacityAnim = React.useRef(new Animated.Value(0)).current;

  const isManager = userType === 'manager';
  const isDirector = userType === 'director';

  // Fonction pour mettre à jour le dernier identifiant saisi
  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
    // Sauvegarder l'identifiant même s'il est vide (pour garder le dernier saisi)
    setLastUsername(text);
    // console.log('🔍 Identifiant saisi:', text, '-> lastUsername:', text);
    
    // Sauvegarder dans AsyncStorage
    if (text.trim()) {
      AsyncStorage.setItem('lastUsername', text.trim()).catch(error => {
        // console.log('❌ Erreur lors de la sauvegarde de l\'identifiant:', error);
      });
    }
    
    if (errorMessage) setErrorMessage('');
  }, [errorMessage]);

  // Fonctions d'animation pour la popup
  const showPopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(popupOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(popupScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [popupOpacityAnim, popupScaleAnim]);

  const hidePopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(popupOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(popupScaleAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setShowErrorPopup(false);
    });
  }, [popupOpacityAnim, popupScaleAnim]);

  // Animation d'entrée fluide
  React.useEffect(() => {
    // Animation simplifiée pour améliorer la réactivité
    if (animation === 'slide_from_left') {
      // Animation de glissement depuis la gauche
      slideAnim.setValue(-screenWidth);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      // Animation de fondu simple
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [animation, screenWidth]);

  // Écouter les changements de dimensions
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Charger l'identifiant de la dernière connexion au démarrage
  React.useEffect(() => {
    const loadLastUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('lastUsername');
        if (savedUsername) {
          setLastUsername(savedUsername);
          // console.log('📱 Identifiant chargé depuis le stockage:', savedUsername);
        }
      } catch (error) {
        // console.log('❌ Erreur lors du chargement de l\'identifiant:', error);
      }
    };
    
    loadLastUsername();
  }, []);

  // Gérer les erreurs d'authentification Supabase
  React.useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
      setShowErrorPopup(true);
      showPopup();
    }
  }, [authError, showPopup]);

  // Optimisation des callbacks
  const handleLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Veuillez remplir tous les champs');
      setShowErrorPopup(true);
      showPopup();
      return;
    }

    // Animation du bouton simplifiée
    Animated.timing(buttonScaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });

    // Connexion avec Supabase
    InteractionManager.runAfterInteractions(async () => {
      const role = isManager ? 'manager' : 'director';
      const result = await login(username.trim(), password.trim(), role);

      if (result.success) {
        // Redirection basée sur le rôle
        if (role === 'manager') {
          router.replace('/(manager-tabs)');
        } else {
          router.replace('/directeur');
        }
      }
      // L'erreur sera gérée par le useEffect qui écoute authError
    });
  }, [username, password, isManager, login, showPopup, buttonScaleAnim]);

  const quickLogin = useCallback((userExample: any) => {
    if (!userExample.isActive) {
      Alert.alert('Erreur', 'Ce compte est désactivé. Contactez l\'administrateur.');
      return;
    }
    
    setUsername(userExample.username);
    setPassword(userExample.password);
    
    // Connexion rapide optimisée
    InteractionManager.runAfterInteractions(() => {
      if (isManager) {
        router.replace('/(manager-tabs)');
      } else {
        router.replace('/directeur');
      }
    });
  }, [isManager]);

  // Fonction de connexion rapide avec le dernier identifiant
  const quickLoginWithLastUsername = useCallback(() => {
    // console.log('🚀 Pré-remplissage avec l\'identifiant:', lastUsername);
    if (!lastUsername) {
      setErrorMessage('Aucun identifiant précédent disponible. Veuillez saisir un identifiant d\'abord.');
      setShowErrorPopup(true);
      showPopup();
      return;
    }

    // Pré-remplir seulement le champ nom d'utilisateur
    setUsername(lastUsername);
    
    // Focus sur le champ mot de passe pour faciliter la saisie
    // Note: React Native n'a pas de focus automatique, l'utilisateur devra cliquer manuellement
  }, [lastUsername, showPopup]);

  // Fonction de connexion rapide pour le développement
  const handleDevQuickLogin = useCallback(() => {
    // console.log('🚀 Connexion rapide DEV activée');
    
    // Utiliser les identifiants de test selon le rôle
    if (isManager) {
      setUsername('manager1');
      setPassword('test');
    } else {
      setUsername('admin.directeur');
      setPassword('ADMIN2024!');
    }
    
    // Déclencher la connexion automatiquement après un court délai
    setTimeout(() => {
      handleLogin();
    }, 100);
  }, [isManager, handleLogin]);

  // Optimisation avec useMemo pour éviter les recalculs
  const example = useMemo(() => {
    return {
      username: 'exemple.user',
      password: 'motdepasse123',
      name: 'Utilisateur Exemple'
    };
  }, []);

  // Styles dynamiques basés sur la taille de l'écran
  const dynamicStyles = useMemo(() => ({
    formContainer: {
      paddingHorizontal: isLargeScreen ? 200 : isTablet ? 80 : 24,
      maxWidth: isLargeScreen ? 1000 : isTablet ? 700 : '100%' as any,
      alignSelf: 'center' as const,
      width: '100%' as const,
      marginBottom: 32,
    },
    formCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: isLargeScreen ? 60 : isTablet ? 40 : 24,
      minWidth: isLargeScreen ? 700 : isTablet ? 500 : 'auto' as any,
      maxWidth: isLargeScreen ? 900 : isTablet ? 600 : '100%' as any,
      ...Platform.select({
        web: {
          boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.15)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 12,
        },
      }),
    },
    title: {
      fontSize: isLargeScreen ? 48 : isTablet ? 36 : 28,
      fontWeight: '700' as const,
      color: '#1a1a1a',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      color: '#6b7280',
    },
    inputLabel: {
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      fontWeight: '600' as const,
      color: '#1a1a1a',
      marginBottom: 12,
    },
    input: {
      flex: 1,
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      color: '#1a1a1a',
      marginLeft: 16,
      marginRight: 12,
    },
    inputWrapper: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: isLargeScreen ? 24 : isTablet ? 20 : 14,
      borderWidth: 2,
      borderColor: '#e5e7eb',
      minHeight: isLargeScreen ? 80 : isTablet ? 70 : 52,
    },
    eyeButton: {
      padding: isLargeScreen ? 20 : isTablet ? 16 : 8,
      marginLeft: 8,
    },
    loginButton: {
      borderRadius: 16,
      padding: isLargeScreen ? 32 : isTablet ? 24 : 16,
      alignItems: 'center' as const,
      marginBottom: 16,
      marginTop: 8,
      minHeight: isLargeScreen ? 80 : isTablet ? 70 : 52,
      justifyContent: 'center' as const,
      ...Platform.select({
        web: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
      }),
    },
    loginButtonText: {
      fontSize: isLargeScreen ? 24 : isTablet ? 20 : 16,
      fontWeight: '600' as const,
      color: '#ffffff',
    },
  }), [isLargeScreen, isTablet]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (errorMessage) setErrorMessage('');
  }, [errorMessage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Animated.View style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: Platform.OS === 'web' ? 40 : 20,
              alignItems: 'stretch',
              justifyContent: 'flex-start',
            }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={true}
        >
            <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()}
                style={[styles.backButton, isDark && { backgroundColor: '#18181b', borderColor: '#27272a' }]}
              activeOpacity={0.7}
                accessibilityLabel="Retour"
            >
                <ArrowLeft size={24} color={isDark ? '#fff' : '#222'} />
            </TouchableOpacity>
            </View>
            {/* Bandeau différencié manager/directeur */}
            <View style={[
              styles.userTypeIndicator,
              isManager && { backgroundColor: '#3b82f6' },
              isDirector && { backgroundColor: '#10b981' },
            ]}>
              {isManager ? (
                <User color="#fff" size={24} />
              ) : (
                <User color="#fff" size={24} />
              )}
              <Text style={styles.userTypeText}>
                {isManager ? 'Espace Manager' : isDirector ? 'Espace Directeur' : ''}
              </Text>
            </View>
            {/* Fond décoratif adapté */}
            <View style={[
              styles.background,
              isManager && { backgroundColor: '#3b82f6' },
              isDirector && { backgroundColor: '#10b981' },
              isDark && styles.backgroundDark
            ]} />
            
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoCircle, isDark && styles.logoCircleDark]}>
                  <Package color={isDark ? "#60a5fa" : "#3b82f6"} size={48} strokeWidth={2} />
          </View>
                <Text style={[styles.logoText, isDark && styles.logoTextDark]}>OptineS</Text>
                <Text style={[styles.tagline, isDark && styles.taglineDark]}>Gestion d'équipe simplifiée</Text>
              </View>

              <View style={[styles.formContainer, isDark && styles.formContainerDark]}>
                <Text style={[styles.title, isDark && styles.titleDark]}>Connexion</Text>
                
              <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                    <Mail color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
                  <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                      placeholder="Email"
                      placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                      value={username}
                      onChangeText={handleUsernameChange}
                  />
                </View>
                <Text style={styles.inputHint}>
                  Format: prénom.première_lettre_nom (ex: {example.username})
                </Text>
              </View>

              <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                    <Lock color={isDark ? "#a1a1aa" : "#6b7280"} size={20} strokeWidth={2} />
                  <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                    placeholder="Mot de passe"
                      placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                      value={password}
                      onChangeText={handlePasswordChange}
                  />
                  <TouchableOpacity
                    style={dynamicStyles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff color="#6b7280" size={20} strokeWidth={2} />
                    ) : (
                      <Eye color="#6b7280" size={20} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  Mot de passe généré par l'administration
                </Text>
              </View>

              {/* Example Credentials */}
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleTitle}>💡 Exemple de connexion:</Text>
                <View style={styles.exampleCredentials}>
                  <Text style={styles.exampleText}>
                    <Text style={styles.exampleLabel}>Utilisateur:</Text> {example.name}
                  </Text>
                  <Text style={styles.exampleText}>
                    <Text style={styles.exampleLabel}>Identifiant:</Text> {example.username}
                  </Text>
                  <Text style={styles.exampleText}>
                    <Text style={styles.exampleLabel}>Mot de passe:</Text> {example.password}
                  </Text>
                </View>
              </View>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.loginButton,
                    { backgroundColor: isManager ? '#3b82f6' : '#10b981' },
                    isLoading && styles.loginButtonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={dynamicStyles.loginButtonText}>
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Quick Login Button */}
              <TouchableOpacity
                style={styles.quickLoginButton}
                onPress={quickLoginWithLastUsername}
                activeOpacity={0.8}
              >
                <Text style={styles.quickLoginText}>
                  🔄 Pré-remplir identifiant {lastUsername ? `(${lastUsername})` : '(Aucun identifiant)'}
                </Text>
              </TouchableOpacity>

              {/* Development Quick Login Button */}
              <TouchableOpacity
                style={styles.devQuickLoginButton}
                onPress={handleDevQuickLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.devQuickLoginText}>
                  🚀 Connexion rapide (DEV)
                </Text>
              </TouchableOpacity>

              {/* Help Text */}
              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  Problème de connexion ? Contactez l'administrateur système.
                </Text>
              </View>
              </View> {/* fermeture du formContainer */}
            </View> {/* fermeture du content */}
        </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
      {showErrorPopup && (
        <Animated.View 
          style={[
            styles.popupOverlay,
            {
              opacity: popupOpacityAnim
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.popupContainer,
              {
                transform: [{ scale: popupScaleAnim }]
              }
            ]}
          >
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>⚠️ Erreur</Text>
            </View>
            <View style={styles.popupContent}>
              <Text style={styles.popupMessage}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={hidePopup}
              activeOpacity={0.8}
            >
              <Text style={styles.popupButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
    backgroundColor: '#18181b',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'web' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Platform.OS === 'web' ? 32 : 24,
    marginLeft: Platform.OS === 'web' ? 24 : 12,
    zIndex: 10,
  },
  backButton: {
    padding: Platform.OS === 'web' ? 16 : 8,
    marginRight: Platform.OS === 'web' ? 20 : 12,
    marginTop: Platform.OS === 'web' ? 0 : 0, // géré par le header
    alignSelf: 'flex-start',
    borderRadius: Platform.OS === 'web' ? 12 : 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Platform.OS === 'web' ? 32 : 24,
  },
  inputHint: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    color: '#6b7280',
    marginTop: Platform.OS === 'web' ? 12 : 8,
    fontStyle: 'italic',
  },
  userTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'web' ? 20 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    marginBottom: Platform.OS === 'web' ? 32 : 24,
  },
  userTypeText: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: Platform.OS === 'web' ? 12 : 8,
  },
  exampleContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    padding: Platform.OS === 'web' ? 24 : 16,
    marginBottom: Platform.OS === 'web' ? 32 : 20,
    marginTop: Platform.OS === 'web' ? 12 : 4,
  },
  exampleTitle: {
    fontSize: Platform.OS === 'web' ? 18 : 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  exampleCredentials: {
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  exampleText: {
    fontSize: Platform.OS === 'web' ? 16 : 13,
    color: '#374151',
    marginBottom: Platform.OS === 'web' ? 6 : 4,
    lineHeight: Platform.OS === 'web' ? 24 : 18,
  },
  exampleLabel: {
    fontWeight: '600',
  },
  exampleNote: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: Platform.OS === 'web' ? 12 : 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  quickLoginButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    padding: Platform.OS === 'web' ? 24 : 12,
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 24 : 16,
    borderWidth: 2,
    borderColor: '#10b981',
    minHeight: Platform.OS === 'web' ? 64 : 44,
  },
  quickLoginText: {
    fontSize: Platform.OS === 'web' ? 20 : 14,
    fontWeight: '600',
    color: '#10b981',
  },
  helpContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 16 : 8,
  },
  helpText: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 24 : 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    fontWeight: '600',
    color: '#10b981',
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    maxWidth: '80%',
    width: '100%',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  popupContent: {
    marginBottom: 16,
  },
  popupMessage: {
    fontSize: 16,
    color: '#6b7280',
  },
  popupButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  popupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  devQuickLoginButton: {
    backgroundColor: '#fef3c7',
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    padding: Platform.OS === 'web' ? 24 : 12,
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 24 : 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    minHeight: Platform.OS === 'web' ? 64 : 44,
  },
  devQuickLoginText: {
    fontSize: Platform.OS === 'web' ? 20 : 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  background: {
    position: 'absolute',
    top: -200,
    left: -100,
    right: -100,
    height: 600,
    backgroundColor: '#3b82f6',
    borderRadius: 300,
    opacity: 0.1,
  },
  backgroundDark: {
    backgroundColor: '#60a5fa',
    opacity: 0.05,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 100 : 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoCircleDark: {
    backgroundColor: '#1e293b',
    shadowColor: '#60a5fa',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  logoTextDark: {
    color: '#ffffff',
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  taglineDark: {
    color: '#a1a1aa',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  formContainerDark: {
    backgroundColor: '#27272a',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  titleDark: {
    color: '#ffffff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputWrapperDark: {
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputDark: {
    color: '#ffffff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorContainerDark: {
    backgroundColor: '#7f1d1d',
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  errorTextDark: {
    color: '#fca5a5',
  },
});