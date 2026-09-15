import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TodayAgendaView } from './components/tasks/TodayAgendaView';
import { CalendarView } from './components/calendar/CalendarView';
import { CollegeTimetable } from './components/college/CollegeTimetable';
import { TasksManagerView } from './components/tasks/TasksManagerView';
import { TaskDetailView } from './components/tasks/TaskDetailView';
import { StatsView } from './components/stats/StatsView';
import { TaskModal } from './components/tasks/TaskModal';
import { DayDetailModal } from './components/heatmap/DayDetailModal';
import type { Task } from './types';

const MainContent: React.FC = () => {
  const { 
    activeView, 
    selectedTaskForDetail, 
    setSelectedTaskForDetail, 
    isLoading 
  } = useApp();

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string | undefined>(undefined);

  const [inspectDateStr, setInspectDateStr] = useState<string | null>(null);

  const handleOpenTaskModal = (defaultDate?: string, task?: Task) => {
    setTaskModalDefaultDate(defaultDate);
    setTaskToEdit(task || null);
    setIsTaskModalOpen(true);
  };

  const handleDayClick = (dateStr: string) => {
    setInspectDateStr(dateStr);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#8b949e] text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#238636] border-t-transparent rounded-full animate-spin" />
          <span>Loading Chronos Tracker...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top Navbar */}
      <Navbar onOpenNewTaskModal={() => handleOpenTaskModal()} />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'dashboard' && (
          <DashboardView
            onDayClick={handleDayClick}
            onOpenTaskModal={handleOpenTaskModal}
          />
        )}

        {activeView === 'stats' && (
          <StatsView onOpenTaskModal={() => handleOpenTaskModal()} />
        )}

        {activeView === 'agenda' && (
          <TodayAgendaView onOpenTaskModal={handleOpenTaskModal} />
        )}

        {activeView === 'calendar' && (
          <CalendarView onDayClick={handleDayClick} />
        )}

        {activeView === 'college' && (
          <CollegeTimetable />
        )}

        {activeView === 'tasks' && (
          selectedTaskForDetail ? (
            <TaskDetailView
              task={selectedTaskForDetail}
              onBack={() => setSelectedTaskForDetail(null)}
              onEdit={task => handleOpenTaskModal(undefined, task)}
              onDayClick={handleDayClick}
            />
          ) : (
            <TasksManagerView
              onOpenTaskModal={task => handleOpenTaskModal(undefined, task)}
              onSelectTaskDetail={task => setSelectedTaskForDetail(task)}
            />
          )
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
          setTaskModalDefaultDate(undefined);
        }}
        taskToEdit={taskToEdit}
        defaultDate={taskModalDefaultDate}
      />

      {inspectDateStr && (
        <DayDetailModal
          isOpen={Boolean(inspectDateStr)}
          dateStr={inspectDateStr}
          onClose={() => setInspectDateStr(null)}
          onOpenTaskModalForDate={dateStr => handleOpenTaskModal(dateStr)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
