/**
 * CleanTasks - Scheduling Utilities
 * Extracted scheduling logic for testability
 */

interface Task {
  id: string;
  completed: boolean;
  lastCompletedAt?: string;
  schedule?: {
    type: string;
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
}

export function checkAndResetTasks(taskList: Task[]): Task[] {
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday
  const date = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  return taskList.map(task => {
    if (!task.schedule || task.schedule.type === 'none') return task;
    if (!task.completed) return task;
    
    const lastCompleted = task.lastCompletedAt ? new Date(task.lastCompletedAt) : null;
    if (!lastCompleted) return task;
    
    let shouldReset = false;
    const schedule = task.schedule;
    
    switch (schedule.type) {
      case 'daily':
        shouldReset = (now.getTime() - lastCompleted.getTime()) > 24 * 60 * 60 * 1000;
        break;
        
      case 'weekly':
      case 'weekly_monday':
      case 'weekly_friday':
        if (schedule.dayOfWeek !== undefined) {
          const daysSinceSchedule = (today - schedule.dayOfWeek + 7) % 7;
          const hoursSinceSchedule = daysSinceSchedule * 24 + 
            (now.getHours() - (parseInt(schedule.time?.split(':')[0] || '9')));
          shouldReset = daysSinceSchedule > 0 || (daysSinceSchedule === 0 && hoursSinceSchedule > 0);
        }
        break;
        
      case 'biweekly':
        const weeksSince = Math.floor((now.getTime() - lastCompleted.getTime()) / (14 * 24 * 60 * 60 * 1000));
        shouldReset = weeksSince >= 1;
        break;
        
      case 'monthly':
        if (schedule.dayOfMonth === 1) {
          shouldReset = date === 1;
        } else if (schedule.dayOfMonth === 31) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          shouldReset = (daysInMonth >= 31 && date >= 31) || (date < lastCompleted.getDate() && date >= daysInMonth - 2);
        } else if (schedule.dayOfMonth) {
          shouldReset = date >= schedule.dayOfMonth && lastCompleted.getDate() < schedule.dayOfMonth;
        }
        break;
        
      case 'second_friday':
        const firstDayOfMonth = new Date(year, month, 1);
        const firstFriday = new Date(year, month, (5 - firstDayOfMonth.getDay() + 7) % 7 + 1);
        const secondFriday = new Date(firstFriday);
        secondFriday.setDate(firstFriday.getDate() + 7);
        
        if (now >= secondFriday) {
          const lastResetWeek = lastCompleted.getTime() >= firstFriday.getTime() ? secondFriday : firstFriday;
          shouldReset = lastCompleted.getTime() < lastResetWeek.getTime();
        }
        break;
        
      case 'weekdays':
        if (today >= 1 && today <= 5) {
          shouldReset = today !== lastCompleted.getDay();
        }
        break;
        
      case 'weekends':
        if (today === 0 || today === 6) {
          shouldReset = today !== lastCompleted.getDay();
        }
        break;
    }
    
    if (shouldReset) {
      return { ...task, completed: false };
    }
    return task;
  });
}
