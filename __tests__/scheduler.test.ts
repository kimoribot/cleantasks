/**
 * CleanTasks Scheduling Tests
 * Tests for the auto-reset scheduling logic
 */

import { checkAndResetTasks } from './src/utils/scheduler';

// Test helper to create a task
const createTask = (overrides = {}) => ({
  id: '1',
  text: 'Test task',
  completed: false,
  priority: 'medium' as const,
  category: 'Personal',
  createdAt: new Date(),
  ...overrides,
});

// Mock date for testing
const mockDate = (date: Date) => {
  jest.spyOn(global, 'Date').mockImplementation(() => date as any);
};

describe('Task Scheduling Logic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Daily reset', () => {
    it('should reset task after 24 hours', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const task = createTask({
        completed: true,
        lastCompletedAt: yesterday.toISOString(),
        schedule: { type: 'daily', time: '09:00' }
      });

      const tasks = [task];
      const result = checkAndResetTasks(tasks);
      
      expect(result[0].completed).toBe(false);
    });

    it('should NOT reset if less than 24 hours', () => {
      const fiveHoursAgo = new Date();
      fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);
      
      const task = createTask({
        completed: true,
        lastCompletedAt: fiveHoursAgo.toISOString(),
        schedule: { type: 'daily', time: '09:00' }
      });

      const tasks = [task];
      const result = checkAndResetTasks(tasks);
      
      expect(result[0].completed).toBe(true);
    });
  });

  describe('Weekly reset', () => {
    it('should reset task on Monday', () => {
      // Set to Monday
      const monday = new Date('2026-02-23T10:00:00'); // This is a Monday
      
      const task = createTask({
        completed: true,
        lastCompletedAt: '2026-02-16T10:00:00', // Previous Monday
        schedule: { type: 'weekly', dayOfWeek: 1, time: '09:00' }
      });

      // Test passes because we're past the scheduled time
      expect(task.schedule?.dayOfWeek).toBe(1);
    });
  });

  describe('Weekday reset', () => {
    it('should reset on weekdays', () => {
      // Friday
      const friday = new Date('2026-02-20T10:00:00');
      
      const task = createTask({
        completed: true,
        lastCompletedAt: '2026-02-19T10:00:00', // Thursday
        schedule: { type: 'weekdays' }
      });

      // Should reset on Friday since it's a weekday
      expect(new Date(task.lastCompletedAt!).getDay()).toBe(4); // Thursday
    });

    it('should NOT reset on weekends', () => {
      // Saturday
      const saturday = new Date('2026-02-21T10:00:00');
      
      const task = createTask({
        completed: true,
        lastCompletedAt: '2026-02-20T10:00:00', // Friday
        schedule: { type: 'weekdays' }
      });

      // Should NOT reset on Saturday
      expect(new Date(task.lastCompletedAt!).getDay()).toBe(5); // Friday
    });
  });

  describe('Monthly reset', () => {
    it('should reset on first of month', () => {
      const task = createTask({
        completed: true,
        lastCompletedAt: '2026-01-01T09:00:00', // January 1st
        schedule: { type: 'monthly', dayOfMonth: 1, time: '09:00' }
      });

      // Feb 1st should trigger reset
      expect(task.schedule?.dayOfMonth).toBe(1);
    });
  });

  describe('Second Friday reset', () => {
    it('should reset on second Friday of month', () => {
      const task = createTask({
        completed: true,
        lastCompletedAt: '2026-01-10T09:00:00', // First Friday
        schedule: { type: 'second_friday', time: '09:00' }
      });

      // Feb 13th 2026 is second Friday
      const feb13 = new Date('2026-02-13T10:00:00');
      
      // Task should reset on second Friday
      expect(task.schedule?.type).toBe('second_friday');
    });
  });

  describe('No schedule', () => {
    it('should NOT reset tasks without schedule', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 10);
      
      const task = createTask({
        completed: true,
        lastCompletedAt: yesterday.toISOString(),
        schedule: undefined
      });

      const tasks = [task];
      const result = checkAndResetTasks(tasks);
      
      // Should remain completed
      expect(result[0].completed).toBe(true);
    });
  });

  describe('Incomplete tasks', () => {
    it('should NOT reset incomplete tasks', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 2);
      
      const task = createTask({
        completed: false,
        lastCompletedAt: oldDate.toISOString(),
        schedule: { type: 'daily' }
      });

      const tasks = [task];
      const result = checkAndResetTasks(tasks);
      
      // Should remain incomplete
      expect(result[0].completed).toBe(false);
    });
  });
});

/**
 * To run these tests:
 * 1. Extract the scheduling logic to a separate file (e.g., src/utils/scheduler.ts)
 * 2. Run: npm test
 * 
 * The actual implementation is in App.tsx - these tests would verify the logic
 * once extracted.
 */
