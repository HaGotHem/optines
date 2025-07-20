import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Alert {
  id: string;
  task_id: string;
  manager_id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  // Données jointes (optionnelles)
  task_title?: string;
  manager_name?: string;
  manager_section?: string;
}

interface AlertFilters {
  manager_id?: string;
  severity?: 'info' | 'warning' | 'critical';
  is_read?: boolean;
  store_id?: number;
}

export const useSupabaseAlerts = (filters?: AlertFilters) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line
  }, [JSON.stringify(filters)]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (filters?.manager_id) query = query.eq('manager_id', filters.manager_id);
      if (filters?.severity) query = query.eq('severity', filters.severity);
      if (filters?.is_read !== undefined) query = query.eq('is_read', filters.is_read);
      // store_id: nécessite une jointure côté backend ou une vue
      const { data, error } = await query;
      if (error) throw error;
      setAlerts(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async (alertData: {
    task_id: string;
    manager_id: string;
    message: string;
    severity?: 'info' | 'warning' | 'critical';
  }) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('alerts')
        .insert([{ ...alertData, severity: alertData.severity || 'warning' }])
        .select()
        .single();
      if (error) throw error;
      setAlerts(prev => [data, ...prev]);
      return { success: true, alert: data };
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      return { success: false, error: err.message };
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .select()
        .single();
      if (error) throw error;
      setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, is_read: true } : alert));
      return { success: true, alert: data };
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      return { success: false, error: err.message };
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)
        .select()
        .single();
      if (error) throw error;
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      return { success: true, alert: data };
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      return { success: false, error: err.message };
    }
  };

  const refreshAlerts = () => {
    loadAlerts();
  };

  return {
    alerts,
    isLoading,
    error,
    createAlert,
    markAlertAsRead,
    deleteAlert,
    refreshAlerts,
  };
}; 