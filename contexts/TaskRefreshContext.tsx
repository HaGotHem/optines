import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TaskRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
}

const TaskRefreshContext = createContext<TaskRefreshContextType | undefined>(undefined);

interface TaskRefreshProviderProps {
  children: ReactNode;
}

export const TaskRefreshProvider: React.FC<TaskRefreshProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = () => {
    console.log('🔄 Déclenchement du rafraîchissement global des tâches');
    setRefreshTrigger(prev => prev + 1);
  };

  const value = {
    refreshTrigger,
    triggerRefresh,
    isRefreshing,
    setIsRefreshing,
  };

  return (
    <TaskRefreshContext.Provider value={value}>
      {children}
    </TaskRefreshContext.Provider>
  );
};

export const useTaskRefresh = (): TaskRefreshContextType => {
  const context = useContext(TaskRefreshContext);
  if (context === undefined) {
    throw new Error('useTaskRefresh must be used within a TaskRefreshProvider');
  }
  return context;
}; 