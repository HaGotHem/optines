// Test simple pour vérifier les popups Alert
// À exécuter dans l'application React Native

import { Alert } from 'react-native';

export const testPopup = () => {
  console.log('🧪 Test de popup - Début');
  
  try {
    Alert.alert(
      'Test de popup',
      'Cette popup fonctionne-t-elle ?',
      [
        { 
          text: 'Non', 
          style: 'cancel',
          onPress: () => console.log('🧪 Popup test - Non cliqué')
        },
        {
          text: 'Oui',
          style: 'default',
          onPress: () => console.log('🧪 Popup test - Oui cliqué')
        }
      ],
      { cancelable: true }
    );
    console.log('🧪 Alert.alert() appelé avec succès');
  } catch (error) {
    console.error('🧪 Erreur lors du test de popup:', error);
  }
};

// Test alternatif avec confirm/alert natif
export const testNativePopup = () => {
  console.log('🧪 Test popup native - Début');
  
  try {
    if (typeof window !== 'undefined' && window.confirm) {
      const result = window.confirm('Test de popup native - Voulez-vous continuer ?');
      console.log('🧪 Résultat confirm:', result);
      window.alert(result ? 'Vous avez cliqué OK' : 'Vous avez cliqué Annuler');
    } else {
      console.log('🧪 window.confirm non disponible');
    }
  } catch (error) {
    console.error('🧪 Erreur popup native:', error);
  }
}; 