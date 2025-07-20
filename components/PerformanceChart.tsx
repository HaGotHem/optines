import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface ManagerPerformance {
  id: string;
  name: string;
  section: string;
  packagesProcessed: number;
  totalPackages: number;
  performance: number;
  teamSize: number;
  reinforcementWorker: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  alerts: number;
  trend: 'up' | 'down' | 'stable';
  remainingTimeMinutes: number;
  tasksCompleted: number;
  totalTasks: number;
}

interface PerformanceChartProps {
  data: ManagerPerformance[];
  title: string;
}

export default function PerformanceChart({ data, title }: PerformanceChartProps) {
  const { isDark } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            Aucune donnée de performance disponible
          </Text>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark, { fontSize: 12, marginTop: 8 }]}>
            Les managers n'ont pas encore créé de tâches
          </Text>
        </View>
      </View>
    );
  }

  const maxPerformance = Math.max(...data.map(d => d.performance));
  const maxPackages = Math.max(...data.map(d => d.totalPackages));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      
      <View style={styles.chartContainer}>
        {data.filter(manager => manager.totalPackages > 0).map((manager, index) => (
          <View key={manager.id} style={styles.barContainer}>
            <View style={styles.barInfo}>
              <Text style={[styles.managerName, isDark && styles.managerNameDark]} numberOfLines={1}>
                {manager.name}
              </Text>
              <Text style={[styles.managerSection, isDark && styles.managerSectionDark]} numberOfLines={1}>
                {manager.section}
              </Text>
            </View>
            
            <View style={styles.barWrapper}>
              {/* Barre de performance */}
              <View style={styles.performanceBar}>
                <View 
                  style={[
                    styles.performanceFill,
                    { 
                      width: `${(manager.performance / maxPerformance) * 100}%`,
                      backgroundColor: getStatusColor(manager.status)
                    }
                  ]} 
                />
                <Text style={[styles.performanceText, isDark && styles.performanceTextDark]}>
                  {manager.performance}%
                </Text>
              </View>
              
              {/* Barre de colis */}
              <View style={styles.packagesBar}>
                <View 
                  style={[
                    styles.packagesFill,
                    { 
                      width: `${(manager.totalPackages / maxPackages) * 100}%`,
                      backgroundColor: '#8b5cf6'
                    }
                  ]} 
                />
                <Text style={[styles.packagesText, isDark && styles.packagesTextDark]}>
                  {manager.packagesProcessed}/{manager.totalPackages} colis
                </Text>
              </View>
            </View>
            
            <View style={styles.barDetails}>
              <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
                {manager.teamSize} équipiers
                {manager.reinforcementWorker > 0 && ` +${manager.reinforcementWorker}`}
              </Text>
              {manager.alerts > 0 && (
                <Text style={styles.alertText}>⚠️ {manager.alerts}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.legendText, isDark && styles.legendTextDark]}>Excellent (90%+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
          <Text style={[styles.legendText, isDark && styles.legendTextDark]}>Bon (75-89%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
          <Text style={[styles.legendText, isDark && styles.legendTextDark]}>Attention (60-74%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
          <Text style={[styles.legendText, isDark && styles.legendTextDark]}>Critique (&lt;60%)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  titleDark: {
    color: '#f9fafb',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyTextDark: {
    color: '#9ca3af',
  },
  chartContainer: {
    gap: 12,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barInfo: {
    width: 80,
  },
  managerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  managerNameDark: {
    color: '#f9fafb',
  },
  managerSection: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  managerSectionDark: {
    color: '#9ca3af',
  },
  barWrapper: {
    flex: 1,
    gap: 4,
  },
  performanceBar: {
    height: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 10,
  },
  performanceText: {
    position: 'absolute',
    right: 8,
    top: 2,
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  performanceTextDark: {
    color: '#ffffff',
  },
  packagesBar: {
    height: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  packagesFill: {
    height: '100%',
    borderRadius: 8,
  },
  packagesText: {
    position: 'absolute',
    right: 6,
    top: 1,
    fontSize: 9,
    fontWeight: '500',
    color: '#ffffff',
  },
  packagesTextDark: {
    color: '#ffffff',
  },
  barDetails: {
    width: 60,
    alignItems: 'flex-end',
  },
  detailText: {
    fontSize: 10,
    color: '#6b7280',
  },
  detailTextDark: {
    color: '#9ca3af',
  },
  alertText: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  legendTextDark: {
    color: '#9ca3af',
  },
}); 