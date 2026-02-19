import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Date;
  // Advanced scheduling
  schedule?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6, Sunday = 0
    dayOfMonth?: number; // 1-31
    customCron?: string; // For advanced patterns like "every second Friday"
  };
  lastCompletedAt?: string;
}

const CATEGORIES = ['Personal', 'Work', 'Shopping', 'Health', 'Ideas'];
const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#4CAF50' },
  { id: 'medium', label: 'Medium', color: '#FF9800' },
  { id: 'high', label: 'High', color: '#F44336' },
];

// Advanced schedule presets
const SCHEDULE_PRESETS = [
  { id: 'none', label: 'No Schedule', description: 'Manual only' },
  { id: 'daily', label: 'Daily', description: 'Every day at set time' },
  { id: 'weekdays', label: 'Weekdays Only', description: 'Monday to Friday' },
  { id: 'weekends', label: 'Weekends', description: 'Saturday and Sunday' },
  // Weekly options
  { id: 'weekly_sunday', label: 'Every Sunday', description: 'Resets every Sunday' },
  { id: 'weekly_monday', label: 'Every Monday', description: 'Resets every Monday' },
  { id: 'weekly_tuesday', label: 'Every Tuesday', description: 'Resets every Tuesday' },
  { id: 'weekly_wednesday', label: 'Every Wednesday', description: 'Resets every Wednesday' },
  { id: 'weekly_thursday', label: 'Every Thursday', description: 'Resets every Thursday' },
  { id: 'weekly_friday', label: 'Every Friday', description: 'Resets every Friday' },
  { id: 'weekly_saturday', label: 'Every Saturday', description: 'Resets every Saturday' },
  // Biweekly options
  { id: 'biweekly', label: 'Every 2 Weeks', description: 'Every other week' },
  { id: 'biweekly_even', label: 'Even Weeks', description: 'Weeks 2, 4, 6... (ISO)' },
  { id: 'biweekly_odd', label: 'Odd Weeks', description: 'Weeks 1, 3, 5... (ISO)' },
  // Monthly options
  { id: 'monthly', label: 'Monthly (1st)', description: 'First day of each month' },
  { id: 'monthly_15', label: 'Monthly (15th)', description: '15th of each month' },
  { id: 'monthly_last', label: 'Month End', description: 'Last day of each month' },
  // First week options
  { id: 'first_sunday', label: '1st Sunday', description: 'First Sunday of each month' },
  { id: 'first_monday', label: '1st Monday', description: 'First Monday of each month' },
  { id: 'first_tuesday', label: '1st Tuesday', description: 'First Tuesday of each month' },
  { id: 'first_wednesday', label: '1st Wednesday', description: 'First Wednesday of each month' },
  { id: 'first_thursday', label: '1st Thursday', description: 'First Thursday of each month' },
  { id: 'first_friday', label: '1st Friday', description: 'First Friday of each month' },
  { id: 'first_saturday', label: '1st Saturday', description: 'First Saturday of each month' },
  // Other week options
  { id: 'second_sunday', label: '2nd Sunday', description: 'Second Sunday of each month' },
  { id: 'second_monday', label: '2nd Monday', description: 'Second Monday of each month' },
  { id: 'second_tuesday', label: '2nd Tuesday', description: 'Second Tuesday of each month' },
  { id: 'second_wednesday', label: '2nd Wednesday', description: 'Second Wednesday of each month' },
  { id: 'second_thursday', label: '2nd Thursday', description: 'Second Thursday of each month' },
  { id: 'second_friday', label: '2nd Friday', description: 'Second Friday of each month' },
  { id: 'second_saturday', label: '2nd Saturday', description: 'Second Saturday of each month' },
  { id: 'third_friday', label: '3rd Friday', description: 'Third Friday of each month' },
  { id: 'last_sunday', label: 'Last Sunday', description: 'Last Sunday of each month' },
  { id: 'last_monday', label: 'Last Monday', description: 'Last Monday of each month' },
  { id: 'last_friday', label: 'Last Friday', description: 'Last Friday of each month' },
  // Quarterly
  { id: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
  // Yearly
  { id: 'yearly', label: 'Yearly', description: 'Once a year' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Schedule state
  const [scheduleType, setScheduleType] = useState('none');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // Load tasks from storage
  useEffect(() => {
    loadTasks();
    
    // Check for scheduled resets
    const interval = setInterval(checkScheduledResets, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Keyboard visibility listener
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check for scheduled resets
        const resetTasks = checkAndResetTasks(parsed);
        setTasks(resetTasks);
      }
    } catch (e) {
      console.log('Error loading tasks:', e);
    }
  };

  const checkAndResetTasks = (taskList: Task[]): Task[] => {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday
    const date = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    const weekNumber = Math.ceil(date / 7); // 1-5 for weeks in month
    
    return taskList.map(task => {
      if (!task.schedule || task.schedule.type === 'none') return task;
      if (!task.completed) return task;
      
      const lastCompleted = task.lastCompletedAt ? new Date(task.lastCompletedAt) : null;
      if (!lastCompleted) return task;
      
      let shouldReset = false;
      const schedule = task.schedule;
      const scheduleType = schedule.type;
      
      // Helper to get day of week from schedule type (e.g., 'weekly_monday' -> 1)
      const getDayFromType = (type: string): number | null => {
        const days: Record<string, number> = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
        };
        const match = type.match(/(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
        return match ? days[match[1]] : null;
      };
      
      // Helper to get which occurrence in month (1st, 2nd, 3rd, 4th, last)
      const getOccurrence = (type: string): number | null => {
        if (type.includes('first')) return 1;
        if (type.includes('second')) return 2;
        if (type.includes('third')) return 3;
        if (type.includes('fourth')) return 4;
        if (type.includes('last')) return 5; // 5 means "last"
        return null;
      };
      
      // Daily
      if (scheduleType === 'daily') {
        shouldReset = (now.getTime() - lastCompleted.getTime()) > 24 * 60 * 60 * 1000;
      }
      // Weekdays (Mon-Fri)
      else if (scheduleType === 'weekdays') {
        if (today >= 1 && today <= 5) {
          shouldReset = today !== lastCompleted.getDay();
        }
      }
      // Weekends (Sat-Sun)
      else if (scheduleType === 'weekends') {
        if (today === 0 || today === 6) {
          shouldReset = today !== lastCompleted.getDay();
        }
      }
      // Any weekly (weekly_sunday, weekly_monday, etc.)
      else if (scheduleType.startsWith('weekly_')) {
        const targetDay = getDayFromType(scheduleType);
        if (targetDay !== null) {
          const daysSinceSchedule = (today - targetDay + 7) % 7;
          shouldReset = daysSinceSchedule > 0 || (daysSinceSchedule === 0 && now.getHours() >= parseInt(schedule.time?.split(':')[0] || '9'));
        }
      }
      // Biweekly / Every 2 weeks
      else if (scheduleType === 'biweekly' || scheduleType === 'biweekly_even' || scheduleType === 'biweekly_odd') {
        const daysSince = Math.floor((now.getTime() - lastCompleted.getTime()) / (24 * 60 * 60 * 1000));
        const weeksSince = Math.floor(daysSince / 7);
        
        if (scheduleType === 'biweekly') {
          shouldReset = weeksSince >= 2;
        } else {
          // ISO week number parity
          const currentWeek = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          const lastWeek = Math.ceil((lastCompleted.getTime() - new Date(lastCompleted.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          const isEven = (weekNum: number) => weekNum % 2 === 0;
          
          if (scheduleType === 'biweekly_even') {
            shouldReset = isEven(currentWeek) && !isEven(lastWeek);
          } else {
            shouldReset = !isEven(currentWeek) && isEven(lastWeek);
          }
        }
      }
      // Monthly (1st of month)
      else if (scheduleType === 'monthly') {
        shouldReset = date === 1 && lastCompleted.getDate() !== 1;
      }
      // Monthly on 15th
      else if (scheduleType === 'monthly_15') {
        shouldReset = date >= 15 && lastCompleted.getDate() < 15;
      }
      // Month end
      else if (scheduleType === 'monthly_last') {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        shouldReset = date >= daysInMonth - 2;
      }
      // First/second/third/last week of month (e.g., first_wednesday, second_friday)
      else if (scheduleType.startsWith('first_') || scheduleType.startsWith('second_') || 
               scheduleType.startsWith('third_') || scheduleType.startsWith('fourth_') || 
               scheduleType.startsWith('last_')) {
        const targetDay = getDayFromType(scheduleType);
        const occurrence = getOccurrence(scheduleType);
        
        if (targetDay !== null && occurrence !== null) {
          const firstDayOfMonth = new Date(year, month, 1);
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          
          // Find the first occurrence of target day
          let firstOccurrence = (7 - firstDayOfMonth.getDay() + targetDay) % 7 + 1;
          if (firstOccurrence < 1) firstOccurrence += 7;
          
          // Calculate target date based on occurrence
          let targetDate: number;
          if (occurrence === 5) {
            // Last occurrence - find last targetDay in month
            targetDate = daysInMonth - ((new Date(year, month, daysInMonth).getDay() - targetDay + 7) % 7);
          } else {
            targetDate = firstOccurrence + (occurrence - 1) * 7;
          }
          
          // Check if we've passed the target date
          if (date >= targetDate) {
            // Check if last completed was before this occurrence
            const lastMonth = lastCompleted.getMonth();
            const lastYear = lastCompleted.getFullYear();
            
            if (lastMonth !== month || lastYear !== year) {
              shouldReset = true;
            } else {
              const lastDate = lastCompleted.getDate();
              const lastFirstOccurrence = (7 - new Date(lastYear, lastMonth, 1).getDay() + targetDay) % 7 + 1;
              const lastTargetDate = lastFirstOccurrence + (occurrence - 1) * 7;
              shouldReset = lastDate < lastTargetDate;
            }
          }
        }
      }
      // Quarterly
      else if (scheduleType === 'quarterly') {
        const currentQuarter = Math.floor(month / 3);
        const lastQuarter = Math.floor(lastCompleted.getMonth() / 3);
        shouldReset = currentQuarter !== lastQuarter;
      }
      // Yearly
      else if (scheduleType === 'yearly') {
        shouldReset = now.getFullYear() !== lastCompleted.getFullYear();
      }
      
      if (shouldReset) {
        return { ...task, completed: false };
      }
      return task;
    });
  };
          
        case 'weekends':
          // Reset if it's weekend and we haven't reset this weekend
          if (today === 0 || today === 6) {
            const lastResetDay = lastCompleted.getDay();
            shouldReset = today !== lastResetDay;
          }
          break;
      }
      
      if (shouldReset) {
        return { ...task, completed: false };
      }
      return task;
    });
  };

  const checkScheduledResets = () => {
    setTasks(prev => {
      const reset = checkAndResetTasks(prev);
      if (JSON.stringify(reset) !== JSON.stringify(prev)) {
        saveTasks(reset);
      }
      return reset;
    });
  };

  const saveTasks = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    } catch (e) {
      console.log('Error saving tasks:', e);
    }
  };

  const addTask = () => {
    if (!newTask.trim()) return;

    const schedule = scheduleType === 'none' ? undefined : {
      type: scheduleType as any,
      time: scheduleTime,
    };

    const task: Task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      priority: selectedPriority,
      category: selectedCategory,
      createdAt: new Date(),
      schedule,
    };

    const updated = [task, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setNewTask('');
    setShowAddModal(false);
    setScheduleType('none');
    Keyboard.dismiss();
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return { 
          ...t, 
          completed: !t.completed,
          lastCompletedAt: !t.completed ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    setTasks(updated);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = tasks.filter((t) => t.id !== id);
          setTasks(updated);
          saveTasks(updated);
        },
      },
    ]);
  };

  const editTask = (task: Task) => {
    setEditingTask(task);
    setNewTask(task.text);
    setSelectedPriority(task.priority);
    setSelectedCategory(task.category);
    setScheduleType(task.schedule?.type || 'none');
    setScheduleTime(task.schedule?.time || '09:00');
    setShowAddModal(true);
  };

  const updateTask = () => {
    if (!editingTask || !newTask.trim()) return;

    const schedule = scheduleType === 'none' ? undefined : {
      type: scheduleType as any,
      time: scheduleTime,
    };

    const updated = tasks.map((t) =>
      t.id === editingTask.id
        ? { ...t, text: newTask.trim(), priority: selectedPriority, category: selectedCategory, schedule }
        : t
    );
    setTasks(updated);
    saveTasks(updated);
    setNewTask('');
    setEditingTask(null);
    setShowAddModal(false);
    setScheduleType('none');
    Keyboard.dismiss();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTask(null);
    setNewTask('');
    setScheduleType('none');
    Keyboard.dismiss();
  };

  // Filter tasks by search + status
  const filteredTasks = tasks.filter((t) => {
    // Search filter
    if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Status filter
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find((p) => p.id === priority)?.color || '#999';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Personal: '#9C27B0',
      Work: '#2196F3',
      Shopping: '#FF9800',
      Health: '#4CAF50',
      Ideas: '#E91E63',
    };
    return colors[category] || '#666';
  };

  const getScheduleLabel = (schedule?: Task['schedule']) => {
    if (!schedule || schedule.type === 'none') return null;
    const preset = SCHEDULE_PRESETS.find(p => p.id === schedule.type);
    return preset?.label;
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>✨ CleanTasks</Text>
        <Text style={styles.subtitle}>Get things done</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: '#1a1a2e' }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#1a1a2e' }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#1a1a2e' }]}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching tasks' : 'No tasks yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Tap + to add your first task'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <TouchableOpacity
                style={styles.taskCheck}
                onPress={() => toggleTask(task.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    task.completed && styles.checkboxChecked,
                  ]}
                >
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.taskContent}
                onPress={() => editTask(task)}
              >
                <Text
                  style={[
                    styles.taskText,
                    task.completed && styles.taskTextCompleted,
                  ]}
                >
                  {task.text}
                </Text>
                <View style={styles.taskMeta}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(task.category) + '30' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: getCategoryColor(task.category) },
                      ]}
                    >
                      {task.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: getPriorityColor(task.priority) },
                    ]}
                  />
                  {task.schedule && task.schedule.type !== 'none' && (
                    <View style={styles.scheduleBadge}>
                      <Text style={styles.scheduleText}>🔄 {getScheduleLabel(task.schedule)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTask(task.id)}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Keyboard Dismiss Hint */}
      {keyboardVisible && (
        <TouchableOpacity style={styles.dismissKeyboard} onPress={() => Keyboard.dismiss()}>
          <Text style={styles.dismissKeyboardText}>Tap to dismiss keyboard</Text>
        </TouchableOpacity>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingTask(null);
          setNewTask('');
          setSelectedPriority('medium');
          setSelectedCategory('Personal');
          setScheduleType('none');
          setShowAddModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal with KeyboardAvoidingView */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardView}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Drag handle / Close button */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingTask ? 'Edit Task' : 'New Task'}
                </Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <TextInput
                  style={styles.input}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#666"
                  value={newTask}
                  onChangeText={setNewTask}
                  autoFocus
                  multiline
                />

                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.priorityOption,
                        selectedPriority === p.id && {
                          backgroundColor: p.color + '30',
                          borderColor: p.color,
                        },
                      ]}
                      onPress={() => setSelectedPriority(p.id as any)}
                    >
                      <View
                        style={[styles.priorityDotLarge, { backgroundColor: p.color }]}
                      />
                      <Text
                        style={[
                          styles.priorityText,
                          selectedPriority === p.id && { color: p.color },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  <View style={styles.categoryContainer}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          selectedCategory === cat && {
                            backgroundColor: getCategoryColor(cat) + '30',
                            borderColor: getCategoryColor(cat),
                          },
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryTextOption,
                            selectedCategory === cat && { color: getCategoryColor(cat) },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.inputLabel}>Auto-Reset Schedule</Text>
                <View style={styles.scheduleContainer}>
                  {SCHEDULE_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.scheduleOption,
                        scheduleType === preset.id && styles.scheduleOptionActive,
                      ]}
                      onPress={() => setScheduleType(preset.id)}
                    >
                      <Text style={[
                        styles.scheduleOptionLabel,
                        scheduleType === preset.id && styles.scheduleOptionLabelActive,
                      ]}>
                        {preset.label}
                      </Text>
                      <Text style={styles.scheduleOptionDesc}>{preset.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {scheduleType !== 'none' && (
                  <>
                    <Text style={styles.inputLabel}>Reset Time</Text>
                    <View style={styles.timeContainer}>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="09:00"
                        placeholderTextColor="#666"
                        value={scheduleTime}
                        onChangeText={setScheduleTime}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                      <Text style={styles.timeHint}>24-hour format (e.g., 09:00, 18:30)</Text>
                    </View>
                  </>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, !newTask.trim() && styles.saveButtonDisabled]}
                    onPress={editingTask ? updateTask : addTask}
                    disabled={!newTask.trim()}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingTask ? 'Update' : 'Add Task'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  clearSearch: {
    padding: 8,
  },
  clearSearchText: {
    color: '#666',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  filterTabActive: {
    backgroundColor: '#667eea',
  },
  filterText: {
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  taskCheck: {
    marginRight: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#444',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scheduleBadge: {
    backgroundColor: '#667eea30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduleText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#666',
    fontSize: 18,
  },
  dismissKeyboard: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dismissKeyboardText: {
    color: '#999',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  categoryScroll: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    minHeight: 60,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    gap: 8,
  },
  priorityDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 20,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
  },
  categoryTextOption: {
    color: '#666',
    fontWeight: '600',
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  scheduleOption: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#333',
  },
  scheduleOptionActive: {
    borderColor: '#667eea',
    backgroundColor: '#667eea20',
  },
  scheduleOptionLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  scheduleOptionLabelActive: {
    color: '#667eea',
  },
  scheduleOptionDesc: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  timeContainer: {
    marginBottom: 20,
  },
  timeInput: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  timeHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
