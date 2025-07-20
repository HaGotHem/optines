import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

interface WorkingHoursAlertProps {
  message: string;
  onClose: () => void;
  visible: boolean;
}

export const WorkingHoursAlert: React.FC<WorkingHoursAlertProps> = ({
  message,
  onClose,
  visible
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.alert}>
        <View style={styles.iconContainer}>
          <AlertTriangle color="#ef4444" size={24} strokeWidth={2} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Horaires invalides</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X color="#6b7280" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  alert: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
}); 