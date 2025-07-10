import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Shield, Check, X, ExternalLink } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConsentBannerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem('gdpr_consent', JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
      onAccept();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du consentement:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await AsyncStorage.setItem('gdpr_consent', JSON.stringify({
        accepted: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
      onDecline();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du consentement:', error);
    }
  };

  const openPrivacyPolicy = () => {
    // En production, remplacer par l'URL de votre politique de confidentialité
    Alert.alert(
      'Politique de Confidentialité',
      'La politique de confidentialité sera disponible sur notre site web.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Ouvrir', 
          onPress: () => Linking.openURL('https://votre-site.com/privacy')
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerHeader}>
            <Shield color="#3b82f6" size={24} strokeWidth={2} />
            <Text style={styles.bannerTitle}>Respect de votre vie privée</Text>
          </View>
          
          <Text style={styles.bannerText}>
            Nous utilisons des cookies et collectons des données pour améliorer votre expérience. 
            En continuant, vous acceptez notre politique de confidentialité.
          </Text>
          
          <View style={styles.bannerActions}>
            <TouchableOpacity 
              style={styles.declineButton}
              onPress={handleDecline}
            >
              <X color="#ef4444" size={16} strokeWidth={2} />
              <Text style={styles.declineButtonText}>Refuser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.privacyButton}
              onPress={() => setShowPrivacyModal(true)}
            >
              <ExternalLink color="#6b7280" size={16} strokeWidth={2} />
              <Text style={styles.privacyButtonText}>En savoir plus</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={handleAccept}
            >
              <Check color="#ffffff" size={16} strokeWidth={2} />
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal Politique de Confidentialité */}
      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Shield color="#3b82f6" size={24} strokeWidth={2} />
              <Text style={styles.modalTitle}>Politique de Confidentialité</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} contentContainerStyle={{flexGrow:1}}>
              <Text style={styles.modalSectionTitle}>1. Données Collectées</Text>
              <Text style={styles.modalText}>
                Nous collectons uniquement les données nécessaires au fonctionnement de l'application :
                • Identifiants de connexion (nom d'utilisateur, mot de passe)
                • Informations de profil (nom, rôle, section)
                • Données de travail (tâches, planning, équipe)
                • Préférences utilisateur (thème, notifications)
              </Text>

              <Text style={styles.modalSectionTitle}>2. Finalité du Traitement</Text>
              <Text style={styles.modalText}>
                Vos données sont utilisées pour :
                • Authentification et gestion des comptes
                • Planification et gestion des tâches
                • Communication avec l'équipe
                • Amélioration de l'expérience utilisateur
              </Text>

              <Text style={styles.modalSectionTitle}>3. Base Légale</Text>
              <Text style={styles.modalText}>
                Le traitement est fondé sur :
                • L'exécution du contrat de travail
                • L'intérêt légitime de l'employeur
                • Votre consentement pour les fonctionnalités optionnelles
              </Text>

              <Text style={styles.modalSectionTitle}>4. Vos Droits</Text>
              <Text style={styles.modalText}>
                Vous disposez des droits suivants :
                • Droit d'accès à vos données
                • Droit de rectification
                • Droit d'effacement
                • Droit à la portabilité
                • Droit d'opposition
              </Text>

              <Text style={styles.modalSectionTitle}>5. Sécurité</Text>
              <Text style={styles.modalText}>
                Nous mettons en œuvre des mesures de sécurité appropriées :
                • Chiffrement des données sensibles
                • Accès restreint aux données
                • Sauvegarde sécurisée
                • Mise à jour régulière des mesures
              </Text>

              <Text style={styles.modalSectionTitle}>6. Conservation</Text>
              <Text style={styles.modalText}>
                Vos données sont conservées :
                • Pendant la durée de votre contrat
                • Maximum 3 ans après la fin du contrat
                • Selon les obligations légales
              </Text>

              <Text style={styles.modalSectionTitle}>7. Contact</Text>
              <Text style={styles.modalText}>
                Pour toute question sur vos données :
                • Email : privacy@votre-entreprise.com
                • Téléphone : +33 1 23 45 67 89
                • Adresse : 123 Rue de la Privacy, 75001 Paris
              </Text>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowPrivacyModal(false)}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowPrivacyModal(false);
                  openPrivacyPolicy();
                }}
              >
                <Text style={styles.primaryButtonText}>Politique complète</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1000,
  },
  bannerContent: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  bannerText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  privacyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 4,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    maxWidth: 500,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 8,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
}); 