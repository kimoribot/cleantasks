import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, SafeAreaView, StatusBar, Modal, Alert, Switch } from 'react-native';

// Types
type Room = 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'living_room' | 'garage' | 'laundry' | 'outdoor' | 'other';
type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'once';

interface Task {
  id: string;
  name: string;
  room: Room;
  frequency: Frequency;
  dueDate: string; // ISO date string
  lastCompleted?: string;
  completed: boolean;
  notes?: string;
}

const ROOMS: { value: Room; label: string; emoji: string }[] = [
  { value: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
  { value: 'kitchen', label: 'Kitchen', emoji: '🍳' },
  { value: 'bathroom', label: 'Bathroom', emoji: '🚿' },
  { value: 'office', label: 'Office', emoji: '💼' },
  { value: 'living_room', label: 'Living Room', emoji: '🛋️' },
  { value: 'garage', label: 'Garage', emoji: '🚗' },
  { value: 'laundry', label: 'Laundry', emoji: '🧺' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'once', label: 'One Time' },
];

const getRoomEmoji = (room: Room) => ROOMS.find(r => r.value === room)?.emoji || '📦';
const getRoomLabel = (room: Room) => ROOMS.find(r => r.value === room)?.label || 'Other';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'daily' | 'weekly' | 'monthly'>('list');
  const [sortBy, setSortBy] = useState<'due' | 'room' | 'frequency' | 'name' | 'completed'>('due');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formRoom, setFormRoom] = useState<Room>('bedroom');
  const [formFrequency, setFormFrequency] = useState<Frequency>('weekly');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  // Load mock data
  useEffect(() => {
    const today = new Date();
    const mockTasks: Task[] = [
      { id: '1', name: 'Make bed', room: 'bedroom', frequency: 'daily', dueDate: today.toISOString().split('T')[0], completed: false },
      { id: '2', name: 'Wash dishes', room: 'kitchen', frequency: 'daily', dueDate: today.toISOString().split('T')[0], completed: false },
      { id: '3', name: 'Vacuum floors', room: 'living_room', frequency: 'weekly', dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
      { id: '4', name: 'Clean toilet', room: 'bathroom', frequency: 'weekly', dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
      { id: '5', name: 'Dust shelves', room: 'office', frequency: 'biweekly', dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
      { id: '6', name: 'Do laundry', room: 'laundry', frequency: 'weekly', dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
      { id: '7', name: 'Mow lawn', room: 'outdoor', frequency: 'weekly', dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
      { id: '8', name: 'Organize closet', room: 'bedroom', frequency: 'monthly', dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
      { id: '9', name: 'Clean windows', room: 'living_room', frequency: 'monthly', dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
      { id: '10', name: 'Defrost freezer', room: 'kitchen', frequency: 'quarterly', dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false },
    ];
    setTasks(mockTasks);
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormRoom('bedroom');
    setFormFrequency('weekly');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setEditingTask(null);
  };

  const openAddModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormName(task.name);
      setFormRoom(task.room);
      setFormFrequency(task.frequency);
      setFormDueDate(task.dueDate);
      setFormNotes(task.notes || '');
    } else {
      resetForm();
    }
    setShowAddModal(true);
  };

  const saveTask = () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? {
        ...t,
        name: formName,
        room: formRoom,
        frequency: formFrequency,
        dueDate: formDueDate,
        notes: formNotes,
      } : t));
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        name: formName,
        room: formRoom,
        frequency: formFrequency,
        dueDate: formDueDate,
        notes: formNotes,
        completed: false,
      };
      setTasks([...tasks, newTask]);
    }
    setShowAddModal(false);
    resetForm();
  };

  const toggleComplete = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const updated = { ...t, completed: !t.completed };
        if (updated.completed) {
          updated.lastCompleted = new Date().toISOString();
          // Calculate next due date based on frequency
          const nextDate = getNextDueDate(t.frequency);
          updated.dueDate = nextDate;
        }
        return updated;
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTasks(tasks.filter(t => t.id !== id)) },
    ]);
  };

  const getNextDueDate = (frequency: Frequency): string => {
    const today = new Date();
    switch (frequency) {
      case 'daily': return today.toISOString().split('T')[0];
      case 'weekly': return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'biweekly': return new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'monthly': return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'quarterly': return new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      default: return today.toISOString().split('T')[0];
    }
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDueLabel = (dueDate: string): string => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days <= 7) return `Due in ${days} days`;
    return dueDate;
  };

  const getDueColor = (dueDate: string): string => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return '#EF4444';
    if (days === 0) return '#F59E0B';
    if (days <= 2) return '#F59E0B';
    return '#22C55E';
  };

  // Sorting
  const getSortedTasks = (): Task[] => {
    let sorted = [...tasks];
    switch (sortBy) {
      case 'due':
        sorted.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        break;
      case 'room':
        sorted.sort((a, b) => a.room.localeCompare(b.room));
        break;
      case 'frequency':
        const freqOrder = { daily: 0, weekly: 1, biweekly: 2, monthly: 3, quarterly: 4, once: 5 };
        sorted.sort((a, b) => freqOrder[a.frequency] - freqOrder[b.frequency]);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'completed':
        sorted.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
        break;
    }
    return sorted;
  };

  // Grouping for views
  const getTasksByRoom = (): Record<Room, Task[]> => {
    const grouped: Record<Room, Task[]> = {} as any;
    ROOMS.forEach(r => grouped[r.value] = []);
    getSortedTasks().forEach(t => grouped[t.room].push(t));
    return grouped;
  };

  const getTasksByDay = (): Record<string, Task[]> => {
    const grouped: Record<string, Task[]> = {};
    getSortedTasks().forEach(t => {
      const day = t.dueDate;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(t);
    });
    return grouped;
  };

  const renderSortButton = (label: string, value: typeof sortBy) => (
    <TouchableOpacity
      key={value}
      style={[styles.sortBtn, sortBy === value && styles.sortBtnActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortBtnText, sortBy === value && styles.sortBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderTask = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
      onPress={() => openAddModal(task)}
      onLongPress={() => deleteTask(task.id)}
    >
      <TouchableOpacity
        style={[styles.checkbox, task.completed && styles.checkboxChecked]}
        onPress={() => toggleComplete(task.id)}
      >
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskName, task.completed && styles.taskNameCompleted]}>{task.name}</Text>
        <View style={styles.taskMeta}>
          <Text style={styles.taskRoom}>{getRoomEmoji(task.room)} {getRoomLabel(task.room)}</Text>
          <Text style={styles.taskFreq}>• {FREQUENCIES.find(f => f.value === task.frequency)?.label}</Text>
        </View>
      </View>
      <View style={styles.dueContainer}>
        <Text style={[styles.dueDate, { color: getDueColor(task.dueDate) }]}>
          {getDueLabel(task.dueDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderListView = () => (
    <ScrollView style={styles.taskList}>
      {getSortedTasks().map(renderTask)}
    </ScrollView>
  );

  const renderDailyView = () => {
    const grouped = getTasksByDay();
    const sortedDays = Object.keys(grouped).sort();
    
    return (
      <ScrollView style={styles.taskList}>
        {sortedDays.map(day => (
          <View key={day} style={styles.dayGroup}>
            <Text style={styles.dayHeader}>
              {new Date(day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            {grouped[day].map(renderTask)}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderWeeklyView = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const days: Task[][] = [[], [], [], [], [], [], []];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    getSortedTasks().forEach(task => {
      const taskDate = new Date(task.dueDate);
      const dayIndex = Math.floor((taskDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        days[dayIndex].push(task);
      }
    });

    return (
      <ScrollView style={styles.taskList}>
        <View style={styles.weekGrid}>
          {days.map((dayTasks, i) => (
            <View key={i} style={styles.weekDay}>
              <Text style={styles.weekDayName}>{dayNames[i]}</Text>
              <Text style={styles.weekDayDate}>{weekStart.getDate() + i}</Text>
              <View style={styles.weekTasks}>
                {dayTasks.length === 0 ? (
                  <Text style={styles.weekEmpty}>-</Text>
                ) : (
                  dayTasks.map(t => (
                    <Text
                      key={t.id}
                      style={[styles.weekTask, t.completed && styles.weekTaskDone]}
                    >
                      {t.name}
                    </Text>
                  ))
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderMonthlyView = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    
    const dayTasks: Task[][] = Array(daysInMonth + 1).fill(null).map(() => []);
    const taskCountByDay: Record<number, number> = {};
    
    getSortedTasks().forEach(task => {
      const taskDate = new Date(task.dueDate);
      if (taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear()) {
        const day = taskDate.getDate();
        dayTasks[day].push(task);
        taskCountByDay[day] = (taskCountByDay[day] || 0) + 1;
      }
    });

    const rows: number[][] = [];
    let currentRow: number[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      currentRow.push(0);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      currentRow.push(day);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return (
      <ScrollView style={styles.taskList}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>
            {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.monthGrid}>
          <View style={styles.monthDayNames}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.monthDayName}>{d}</Text>
            ))}
          </View>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.monthRow}>
              {row.map((day, colIdx) => (
                <View key={colIdx} style={[styles.monthCell, day === today.getDate() && styles.monthCellToday]}>
                  {day === 0 ? (
                    <Text style={styles.monthEmpty}> </Text>
                  ) : (
                    <>
                      <Text style={[styles.monthDayNum, day === today.getDate() && styles.monthDayNumToday]}>{day}</Text>
                      {taskCountByDay[day] > 0 && (
                        <View style={styles.monthDotRow}>
                          {Array(Math.min(taskCountByDay[day], 3)).map((_, i) => (
                            <View key={i} style={styles.monthDot} />
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.tapHint}>Tap a day to see tasks (coming soon)</Text>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🧹 CleanTasks</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openAddModal()}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        {(['list', 'daily', 'weekly', 'monthly'] as const).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.viewBtn, viewMode === v && styles.viewBtnActive]}
            onPress={() => setViewMode(v)}
          >
            <Text style={[styles.viewBtnText, viewMode === v && styles.viewBtnTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort Options */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Sort:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderSortButton('Due', 'due')}
          {renderSortButton('Room', 'room')}
          {renderSortButton('Frequency', 'frequency')}
          {renderSortButton('Name', 'name')}
          {renderSortButton('Status', 'completed')}
        </ScrollView>
      </View>

      {/* Task List */}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'daily' && renderDailyView()}
      {viewMode === 'weekly' && renderWeeklyView()}
      {viewMode === 'monthly' && renderMonthlyView()}

      {/* Stats Footer */}
      <View style={styles.footer}>
        <Text style={styles.stats}>
          {tasks.filter(t => !t.completed).length} pending • {tasks.filter(t => t.completed).length} done
        </Text>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Add Task'}</Text>
            
            <Text style={styles.inputLabel}>Task Name</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g., Clean windows"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Room</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
              {ROOMS.map(room => (
                <TouchableOpacity
                  key={room.value}
                  style={[styles.optionBtn, formRoom === room.value && styles.optionBtnActive]}
                  onPress={() => setFormRoom(room.value)}
                >
                  <Text style={styles.optionEmoji}>{room.emoji}</Text>
                  <Text style={[styles.optionText, formRoom === room.value && styles.optionTextActive]}>{room.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
              {FREQUENCIES.map(freq => (
                <TouchableOpacity
                  key={freq.value}
                  style={[styles.optionBtn, formFrequency === freq.value && styles.optionBtnActive]}
                  onPress={() => setFormFrequency(freq.value)}
                >
                  <Text style={[styles.optionText, formFrequency === freq.value && styles.optionTextActive]}>{freq.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={formDueDate}
              onChangeText={setFormDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={formNotes}
              onChangeText={setFormNotes}
              placeholder="Any additional notes..."
              placeholderTextColor="#666"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveTask}>
                <Text style={styles.saveBtnText}>{editingTask ? 'Update' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  addBtn: { width: 44, height: 44, backgroundColor: '#6366f1', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  
  viewToggle: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  viewBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 2 },
  viewBtnActive: { backgroundColor: '#1a1a3e' },
  viewBtnText: { color: '#666', fontSize: 13, fontWeight: '600' },
  viewBtnTextActive: { color: '#fff' },

  sortBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  sortLabel: { color: '#666', fontSize: 12, marginRight: 8 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, backgroundColor: '#1a1a3e' },
  sortBtnActive: { backgroundColor: '#6366f1' },
  sortBtnText: { color: '#888', fontSize: 12 },
  sortBtnTextActive: { color: '#fff' },

  taskList: { flex: 1, paddingHorizontal: 20 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a3e', borderRadius: 12, padding: 14, marginBottom: 10 },
  taskCardCompleted: { opacity: 0.6 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#6366f1' },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskName: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  taskNameCompleted: { textDecorationLine: 'line-through', color: '#666' },
  taskMeta: { flexDirection: 'row', alignItems: 'center' },
  taskRoom: { color: '#888', fontSize: 13 },
  taskFreq: { color: '#666', fontSize: 13, marginLeft: 6 },
  dueContainer: { alignItems: 'flex-end' },
  dueDate: { fontSize: 12, fontWeight: '600' },

  dayGroup: { marginBottom: 20 },
  dayHeader: { color: '#6366f1', fontSize: 14, fontWeight: '600', marginBottom: 10 },

  weekGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', flex: 1 },
  weekDayName: { color: '#666', fontSize: 12, fontWeight: '600' },
  weekDayDate: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  weekTasks: { alignItems: 'center' },
  weekEmpty: { color: '#444', fontSize: 10 },
  weekTask: { color: '#888', fontSize: 9, marginBottom: 2, textAlign: 'center' },
  weekTaskDone: { textDecorationLine: 'line-through', color: '#444' },

  monthHeader: { alignItems: 'center', marginBottom: 16 },
  monthTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  monthGrid: { paddingHorizontal: 10 },
  monthDayNames: { flexDirection: 'row', marginBottom: 8 },
  monthDayName: { flex: 1, textAlign: 'center', color: '#666', fontSize: 12, fontWeight: '600' },
  monthRow: { flexDirection: 'row' },
  monthCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  monthCellToday: { backgroundColor: '#1a1a3e' },
  monthEmpty: { color: '#333' },
  monthDayNum: { color: '#888', fontSize: 14 },
  monthDayNumToday: { color: '#fff', fontWeight: 'bold' },
  monthDotRow: { flexDirection: 'row', marginTop: 4 },
  monthDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#6366f1', marginHorizontal: 1 },
  tapHint: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20 },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a3e' },
  stats: { color: '#666', fontSize: 12, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a3e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  inputLabel: { color: '#888', fontSize: 12, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#0f0f23', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  optionRow: { marginBottom: 8 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#0f0f23', marginRight: 8 },
  optionBtnActive: { backgroundColor: '#6366f1' },
  optionEmoji: { fontSize: 16, marginRight: 6 },
  optionText: { color: '#888', fontSize: 14 },
  optionTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#0f0f23' },
  cancelBtnText: { color: '#888', fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#6366f1' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
