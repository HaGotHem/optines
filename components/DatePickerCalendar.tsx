import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

interface DatePickerCalendarProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePickerCalendar({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
  minDate = new Date(),
  maxDate = new Date(Date.now() + 84 * 24 * 60 * 60 * 1000), // 12 weeks from now
}: DatePickerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Mémoriser les dates pour éviter les recalculs
  const memoizedMinDate = useMemo(() => minDate, [minDate]);
  const memoizedMaxDate = useMemo(() => maxDate, [maxDate]);
  const memoizedSelectedDate = useMemo(() => selectedDate, [selectedDate]);

  useEffect(() => {
    if (visible) {
      setCurrentMonth(new Date(memoizedSelectedDate.getFullYear(), memoizedSelectedDate.getMonth(), 1));
    }
  }, [visible, memoizedSelectedDate]);

  const getDaysInMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const isSelected = useCallback((date: Date) => {
    return date.toDateString() === memoizedSelectedDate.toDateString();
  }, [memoizedSelectedDate]);

  const isDisabled = useCallback((date: Date) => {
    return date < memoizedMinDate || date > memoizedMaxDate;
  }, [memoizedMinDate, memoizedMaxDate]);

  const isSameMonth = useCallback((date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
  }, []);

  // Normaliser une date pour la comparaison (ignorer l'heure)
  const normalizeDate = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }, []);

  // Vérifier si on peut aller au mois précédent
  const canGoToPreviousMonth = useCallback(() => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const normalizedCurrentMonthStart = normalizeDate(currentMonthStart);
    const normalizedMinDate = normalizeDate(memoizedMinDate);
    
    return normalizedCurrentMonthStart > normalizedMinDate;
  }, [currentMonth, memoizedMinDate, normalizeDate]);

  // Vérifier si on peut aller au mois suivant
  const canGoToNextMonth = useCallback(() => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const normalizedNextMonth = normalizeDate(nextMonth);
    const normalizedMaxDate = normalizeDate(memoizedMaxDate);
    return normalizedNextMonth <= normalizedMaxDate;
  }, [currentMonth, memoizedMaxDate, normalizeDate]);

  const goToPreviousMonth = useCallback(() => {
    if (canGoToPreviousMonth()) {
      const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      setCurrentMonth(newMonth);
    }
  }, [currentMonth, canGoToPreviousMonth]);

  const goToNextMonth = useCallback(() => {
    if (canGoToNextMonth()) {
      const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      setCurrentMonth(newMonth);
    }
  }, [currentMonth, canGoToNextMonth]);

  const handleDateSelect = useCallback((date: Date) => {
    if (!isDisabled(date)) {
      onDateSelect(date);
      onClose();
    }
  }, [isDisabled, onDateSelect, onClose]);

  const generateCalendarDays = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDisabled(date);
      const selected = isSelected(date);
      const today = isToday(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            selected && styles.selectedDay,
            disabled && styles.disabledDay,
          ]}
          onPress={() => handleDateSelect(date)}
          disabled={disabled}
        >
          <Text
            style={[
              styles.dayText,
              selected && styles.selectedDayText,
              disabled && styles.disabledDayText,
              today && !selected && styles.todayText,
            ]}
          >
            {day}
          </Text>
          {today && (
            <View style={[styles.todayIndicator, selected && styles.selectedTodayIndicator]} />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  }, [currentMonth, getDaysInMonth, getFirstDayOfMonth, isDisabled, isSelected, isToday, handleDateSelect]);

  const weekDays = useMemo(() => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], []);
  const monthNames = useMemo(() => [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ], []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.calendarContainer, Platform.OS !== 'web' && { width: '95%' }]}
          // Empêche la propagation du clic pour ne pas fermer si on clique sur le calendrier
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Sélectionner une date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#6b7280" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={[styles.navButton, !canGoToPreviousMonth() && styles.disabledNavButton]}
              onPress={goToPreviousMonth}
              disabled={!canGoToPreviousMonth()}
            >
              <ChevronLeft color={!canGoToPreviousMonth() ? "#d1d5db" : "#6b7280"} size={20} strokeWidth={2} />
            </TouchableOpacity>
            
            <Text style={styles.monthText}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            
            <TouchableOpacity
              style={[styles.navButton, !canGoToNextMonth() && styles.disabledNavButton]}
              onPress={goToNextMonth}
              disabled={!canGoToNextMonth()}
            >
              <ChevronRight color={!canGoToNextMonth() ? "#d1d5db" : "#6b7280"} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysHeader}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayHeader}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <ScrollView style={styles.calendarBody} contentContainerStyle={{flexGrow:1}} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarGrid}>
              {generateCalendarDays()}
            </View>
          </ScrollView>

          <View style={styles.calendarFooter}>
            <View style={styles.legendItem}>
              <View style={styles.todayIndicator} />
              <Text style={styles.legendText}>Aujourd'hui</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.todayIndicator, styles.selectedTodayIndicator]} />
              <Text style={styles.legendText}>Sélectionné</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarBody: {
    maxHeight: 300,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectedDay: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#d1d5db',
  },
  todayText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
  },
  selectedTodayIndicator: {
    backgroundColor: '#ffffff',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
}); 