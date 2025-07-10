import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function AnalyticsTab() {
  const { isDark } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Analytics</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Vue d'ensemble des performances</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, isDark && styles.metricCardDark]}>
            <View style={[styles.metricIcon, isDark && styles.metricIconDark]}>
              <TrendingUp color="#10b981" size={24} strokeWidth={2} />
            </View>
            <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>€12,450</Text>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Revenus</Text>
            <Text style={styles.metricChange}>+8.2%</Text>
          </View>

          <View style={[styles.metricCard, isDark && styles.metricCardDark]}>
            <View style={[styles.metricIcon, isDark && styles.metricIconDark]}>
              <Users color="#3b82f6" size={24} strokeWidth={2} />
            </View>
            <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>1,247</Text>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Clients</Text>
            <Text style={styles.metricChange}>+12.5%</Text>
          </View>

          <View style={[styles.metricCard, isDark && styles.metricCardDark]}>
            <View style={[styles.metricIcon, isDark && styles.metricIconDark]}>
              <BarChart3 color="#f59e0b" size={24} strokeWidth={2} />
            </View>
            <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>89%</Text>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Satisfaction</Text>
            <Text style={styles.metricChange}>+2.1%</Text>
          </View>

          <View style={[styles.metricCard, isDark && styles.metricCardDark]}>
            <View style={[styles.metricIcon, isDark && styles.metricIconDark]}>
              <DollarSign color="#ef4444" size={24} strokeWidth={2} />
            </View>
            <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>€892</Text>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Coût/Client</Text>
            <Text style={styles.metricChange}>-3.4%</Text>
          </View>
        </View>

        {/* Chart Placeholder */}
        <View style={[styles.chartContainer, isDark && styles.chartContainerDark]}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.chartHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.chartTitle}>Évolution des ventes</Text>
            <Text style={styles.chartSubtitle}>30 derniers jours</Text>
          </LinearGradient>
          <View style={styles.chartBody}>
            <Text style={[styles.chartPlaceholder, isDark && styles.chartPlaceholderDark]}>
              Graphique des performances
            </Text>
            <Text style={[styles.chartNote, isDark && styles.chartNoteDark]}>
              Les données seront affichées ici
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  subtitleDark: {
    color: '#a1a1aa',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  metricCardDark: {
    backgroundColor: '#27272a',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconDark: {
    backgroundColor: '#3f3f46',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metricValueDark: {
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  metricLabelDark: {
    color: '#a1a1aa',
  },
  metricChange: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  chartContainer: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  chartContainerDark: {
    backgroundColor: '#27272a',
  },
  chartHeader: {
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  chartBody: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  chartPlaceholder: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  chartPlaceholderDark: {
    color: '#a1a1aa',
  },
  chartNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  chartNoteDark: {
    color: '#71717a',
  },
});