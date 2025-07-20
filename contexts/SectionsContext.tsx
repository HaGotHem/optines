import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SectionsContextType {
  availableSections: string[];
  addSection: (sectionName: string) => boolean;
  removeSection: (sectionName: string) => void;
  loadSections: () => Promise<void>;
  saveSections: () => Promise<void>;
}

const SectionsContext = createContext<SectionsContextType | undefined>(undefined);

const STORAGE_KEY = '@optines_sections';

// Rayons par défaut
const DEFAULT_SECTIONS = [
  'Fruits & Légumes',
  'Boucherie',
  'Poissonnerie', 
  'Charcuterie',
  'Fromage',
  'Épicerie Salée',
  'Épicerie Sucrée',
  'Surgelés',
  'Produits Frais',
  'Boulangerie',
  'Hygiène & Beauté',
  'Maison & Jardin'
];

interface SectionsProviderProps {
  children: ReactNode;
}

export const SectionsProvider: React.FC<SectionsProviderProps> = ({ children }) => {
  const [availableSections, setAvailableSections] = useState<string[]>(DEFAULT_SECTIONS);

  // Charger les rayons depuis le stockage local
  const loadSections = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSections = JSON.parse(stored);
        if (Array.isArray(parsedSections) && parsedSections.length > 0) {
          setAvailableSections(parsedSections);
        } else {
          // Si pas de données valides, utiliser les rayons par défaut
          setAvailableSections(DEFAULT_SECTIONS);
          await saveSectionsToStorage(DEFAULT_SECTIONS);
        }
      } else {
        // Première utilisation, sauvegarder les rayons par défaut
        await saveSectionsToStorage(DEFAULT_SECTIONS);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rayons:', error);
      setAvailableSections(DEFAULT_SECTIONS);
    }
  };

  // Sauvegarder les rayons dans le stockage local
  const saveSectionsToStorage = async (sections: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des rayons:', error);
    }
  };

  // Sauvegarder les rayons actuels
  const saveSections = async () => {
    await saveSectionsToStorage(availableSections);
  };

  // Ajouter un nouveau rayon
  const addSection = (sectionName: string): boolean => {
    const trimmedName = sectionName.trim();
    
    if (!trimmedName) {
      return false;
    }
    
    if (availableSections.includes(trimmedName)) {
      return false; // Le rayon existe déjà
    }
    
    const newSections = [...availableSections, trimmedName];
    setAvailableSections(newSections);
    saveSectionsToStorage(newSections);
    return true;
  };

  // Supprimer un rayon
  const removeSection = (sectionName: string) => {
    const newSections = availableSections.filter(section => section !== sectionName);
    setAvailableSections(newSections);
    saveSectionsToStorage(newSections);
  };

  // Charger les rayons au démarrage
  useEffect(() => {
    loadSections();
  }, []);

  const value: SectionsContextType = {
    availableSections,
    addSection,
    removeSection,
    loadSections,
    saveSections,
  };

  return (
    <SectionsContext.Provider value={value}>
      {children}
    </SectionsContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useSections = (): SectionsContextType => {
  const context = useContext(SectionsContext);
  if (context === undefined) {
    throw new Error('useSections doit être utilisé dans un SectionsProvider');
  }
  return context;
};

export default SectionsContext; 