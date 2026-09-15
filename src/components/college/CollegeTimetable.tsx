import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  Clock, 
  Building2, 
  User, 
  Plus, 
  Trash2, 
  Edit3, 
  CalendarOff 
} from 'lucide-react';
import type { CollegePeriod, CollegeException } from '../../types';
import { format } from 'date-fns';
import { toDateString } from '../../services/recurrence';

const WEEKDAYS = [
  { weekday: 1, name: 'Monday' },
  { weekday: 2, name: 'Tuesday' },
  { weekday: 3, name: 'Wednesday' },
  { weekday: 4, name: 'Thursday' },
  { weekday: 5, name: 'Friday' },
  { weekday: 6, name: 'Saturday' },
  { weekday: 0, name: 'Sunday' },
];

export const CollegeTimetable: React.FC = () => {
  const { 
    collegeSchedule, 
    collegeExceptions, 
    saveCollegeSchedule, 
    saveCollegeException, 
    deleteCollegeException 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'schedule' | 'exceptions'>('schedule');
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);

  // Period modal state
  const [editingPeriod, setEditingPeriod] = useState<{
    weekday: number;
    period?: CollegePeriod;
  } | null>(null);

  const [periodSubject, setPeriodSubject] = useState('');
  const [periodCode, setPeriodCode] = useState('');
  const [periodStartTime, setPeriodStartTime] = useState('09:00');
  const [periodEndTime, setPeriodEndTime] = useState('10:00');
  const [periodRoom, setPeriodRoom] = useState('');
  const [periodProf, setPeriodProf] = useState('');
  const [periodType, setPeriodType] = useState<CollegePeriod['type']>('Lecture');

  // Exception modal state
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [excDate, setExcDate] = useState(() => toDateString(new Date()));
  const [excType, setExcType] = useState<CollegeException['type']>('holiday');
  const [excNote, setExcNote] = useState('');

  const currentDaySchedule = collegeSchedule.find(s => s.weekday === selectedWeekday) || {
    weekday: selectedWeekday,
    isEnabled: false,
    periods: [],
  };

  const handleToggleDayEnabled = async (weekday: number, isEnabled: boolean) => {
    const existing = collegeSchedule.find(s => s.weekday === weekday) || {
      weekday,
      isEnabled: false,
      periods: [],
    };
    await saveCollegeSchedule({
      ...existing,
      isEnabled,
    });
  };

  const handleOpenPeriodModal = (weekday: number, period?: CollegePeriod) => {
    setEditingPeriod({ weekday, period });
    if (period) {
      setPeriodSubject(period.subject);
      setPeriodCode(period.code || '');
      setPeriodStartTime(period.startTime);
      setPeriodEndTime(period.endTime);
      setPeriodRoom(period.room || '');
      setPeriodProf(period.professor || '');
      setPeriodType(period.type || 'Lecture');
    } else {
      setPeriodSubject('');
      setPeriodCode('');
      setPeriodStartTime('09:00');
      setPeriodEndTime('10:00');
      setPeriodRoom('');
      setPeriodProf('');
      setPeriodType('Lecture');
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod || !periodSubject.trim()) return;

    const weekday = editingPeriod.weekday;
    const existingSchedule = collegeSchedule.find(s => s.weekday === weekday) || {
      weekday,
      isEnabled: true,
      periods: [],
    };

    const newPeriod: CollegePeriod = {
      id: editingPeriod.period?.id || `period-${Date.now()}`,
      subject: periodSubject.trim(),
      code: periodCode.trim() || undefined,
      startTime: periodStartTime,
      endTime: periodEndTime,
      room: periodRoom.trim() || undefined,
      professor: periodProf.trim() || undefined,
      type: periodType,
    };

    let updatedPeriods: CollegePeriod[];
    if (editingPeriod.period) {
      updatedPeriods = existingSchedule.periods.map(p =>
        p.id === editingPeriod.period?.id ? newPeriod : p
      );
    } else {
      updatedPeriods = [...existingSchedule.periods, newPeriod].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
    }

    await saveCollegeSchedule({
      ...existingSchedule,
      isEnabled: true, // auto-enable day if period added
      periods: updatedPeriods,
    });

    setEditingPeriod(null);
  };

  const handleDeletePeriod = async (weekday: number, periodId: string) => {
    const existingSchedule = collegeSchedule.find(s => s.weekday === weekday);
    if (!existingSchedule) return;

    await saveCollegeSchedule({
      ...existingSchedule,
      periods: existingSchedule.periods.filter(p => p.id !== periodId),
    });
  };

  const handleSaveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excDate) return;

    const newException: CollegeException = {
      id: `exc-${Date.now()}`,
      date: excDate,
      type: excType,
      note: excNote.trim() || (excType === 'holiday' ? 'University Holiday' : 'Class cancelled'),
    };

    await saveCollegeException(newException);
    setIsExceptionModalOpen(false);
    setExcNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#1f6feb]/15 text-[#58a6ff] rounded-xl border border-[#1f6feb]/30">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f0f6fc]">College Timetable & Classes</h1>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Configure your weekly class periods. Supports variable days, free days, and date-specific exceptions.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-[#21262d] text-[#f0f6fc]'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Weekly Template
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exceptions')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'exceptions'
                  ? 'bg-[#21262d] text-[#f0f6fc]'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              <CalendarOff className="w-3.5 h-3.5" />
              <span>Exceptions & Holidays</span>
              {collegeExceptions.length > 0 && (
                <span className="bg-[#58a6ff]/20 text-[#58a6ff] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {collegeExceptions.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'schedule' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Day Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider px-1">
              Days of Week
            </h2>
            <div className="space-y-1">
              {WEEKDAYS.map(({ weekday, name }) => {
                const sched = collegeSchedule.find(s => s.weekday === weekday);
                const isSelected = selectedWeekday === weekday;
                const isEnabled = sched ? sched.isEnabled : false;
                const periodCount = sched?.periods.length || 0;

                return (
                  <button
                    key={weekday}
                    type="button"
                    onClick={() => setSelectedWeekday(weekday)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-[#1f6feb]/15 border-[#388bfd] text-[#f0f6fc]'
                        : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {isEnabled ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 text-[10px] font-bold">
                          {periodCount} {periodCount === 1 ? 'Period' : 'Periods'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#6e7681]">Off / No Class</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Timetable Main Area */}
          <div className="lg:col-span-3 bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-[#f0f6fc]">
                    {WEEKDAYS.find(w => w.weekday === selectedWeekday)?.name} Schedule
                  </h2>
                  <label className="flex items-center gap-2 text-xs text-[#8b949e] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentDaySchedule.isEnabled}
                      onChange={e => handleToggleDayEnabled(selectedWeekday, e.target.checked)}
                      className="rounded border-[#30363d] bg-[#0d1117] text-[#238636] focus:ring-0"
                    />
                    <span>College Active on this Day</span>
                  </label>
                </div>
                <p className="text-xs text-[#8b949e] mt-1">
                  {currentDaySchedule.periods.length} periods configured.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenPeriodModal(selectedWeekday)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Period / Lecture
              </button>
            </div>

            {/* Period Cards List */}
            <div className="mt-5 space-y-3">
              {currentDaySchedule.periods.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#30363d] rounded-xl text-xs text-[#8b949e] space-y-2">
                  <GraduationCap className="w-8 h-8 text-[#6e7681] mx-auto" />
                  <p className="font-semibold text-[#c9d1d9]">No classes scheduled for this day</p>
                  <p>Click "Add Period / Lecture" above to create course slots.</p>
                </div>
              ) : (
                currentDaySchedule.periods.map(period => (
                  <div
                    key={period.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0d1117] border border-[#30363d] rounded-xl hover:border-[#58a6ff]/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-[#f0f6fc]">
                          {period.subject}
                        </span>
                        {period.code && (
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-[#21262d] text-[#58a6ff] rounded border border-[#30363d]">
                            {period.code}
                          </span>
                        )}
                        {period.type && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#1f6feb]/20 text-[#58a6ff] rounded-full border border-[#1f6feb]/30">
                            {period.type}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[#8b949e] flex-wrap pt-1">
                        <span className="flex items-center gap-1 font-mono text-[#f0f6fc]">
                          <Clock className="w-3.5 h-3.5 text-[#58a6ff]" />
                          {period.startTime} – {period.endTime}
                        </span>
                        {period.room && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#3fb950]" />
                            {period.room}
                          </span>
                        )}
                        {period.professor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#e3b341]" />
                            {period.professor}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPeriodModal(selectedWeekday, period)}
                        className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] rounded transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(selectedWeekday, period.id)}
                        className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Exceptions Tab */
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
            <div>
              <h2 className="text-base font-bold text-[#f0f6fc]">
                Date-Specific Exceptions & Holidays
              </h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Override the regular weekly schedule for specific calendar dates without modifying your weekly pattern.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExceptionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Date Exception / Holiday
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {collegeExceptions.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#30363d] rounded-xl text-xs text-[#8b949e]">
                No exceptions or holidays registered. Regular weekly schedule applies every week.
              </div>
            ) : (
              collegeExceptions.map(exc => (
                <div
                  key={exc.id}
                  className="flex items-center justify-between p-4 bg-[#0d1117] border border-[#30363d] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#d29922]/15 text-[#e3b341] rounded-lg border border-[#d29922]/30">
                      <CalendarOff className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#f0f6fc]">
                          {format(new Date(exc.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#21262d] text-[#8b949e] rounded">
                          {exc.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b949e] mt-0.5">{exc.note}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteCollegeException(exc.id)}
                    className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Period Creator/Editor Modal */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-6 text-[#c9d1d9]">
            <h3 className="text-base font-bold text-[#f0f6fc] mb-4">
              {editingPeriod.period ? 'Edit Period' : 'Add Period / Lecture'}
            </h3>

            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={periodSubject}
                  onChange={e => setPeriodSubject(e.target.value)}
                  placeholder="e.g. Operating Systems, Computer Networks..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">Course Code</label>
                  <input
                    type="text"
                    value={periodCode}
                    onChange={e => setPeriodCode(e.target.value)}
                    placeholder="e.g. CS301"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">Session Type</label>
                  <select
                    value={periodType}
                    onChange={e => setPeriodType(e.target.value as any)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-xs text-[#f0f6fc]"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={periodStartTime}
                    onChange={e => setPeriodStartTime(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={periodEndTime}
                    onChange={e => setPeriodEndTime(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={periodRoom}
                    onChange={e => setPeriodRoom(e.target.value)}
                    placeholder="e.g. Hall 302, Lab 3"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">Professor</label>
                  <input
                    type="text"
                    value={periodProf}
                    onChange={e => setPeriodProf(e.target.value)}
                    placeholder="e.g. Prof. Sharma"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#c9d1d9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exception Creator Modal */}
      {isExceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-6 text-[#c9d1d9]">
            <h3 className="text-base font-bold text-[#f0f6fc] mb-4">
              Add Exception / Holiday
            </h3>

            <form onSubmit={handleSaveException} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={excDate}
                  onChange={e => setExcDate(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">Exception Type</label>
                <select
                  value={excType}
                  onChange={e => setExcType(e.target.value as any)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                >
                  <option value="holiday">University / College Holiday (Entire Day Off)</option>
                  <option value="cancelled_period">Class Cancellation</option>
                  <option value="note">Notice / Special Exam Session</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={excNote}
                  onChange={e => setExcNote(e.target.value)}
                  placeholder="e.g. Festival, Sports Meet, Semester Break..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#f0f6fc]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsExceptionModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#c9d1d9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded"
                >
                  Save Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
