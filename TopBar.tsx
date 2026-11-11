import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Plus,
  MapPin,
  Search,
  X,
  User,
  BookOpen,
  Award,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { AppDatabase, NavigationTab } from '../../types';
import { OFFICIAL_LOGO_URL } from '../../db/initialData';

interface TopBarProps {
  currentTab: NavigationTab;
  db: AppDatabase;
  onUpdateDb: (db: AppDatabase) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  db,
  onUpdateDb,
  onNavigate,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [showCustomSessionModal, setShowCustomSessionModal] = useState<boolean>(false);
  const [newSessionInput, setNewSessionInput] = useState<string>('');

  // Global Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);



  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'TAIBAH Institutional Dashboard',
      subtitle: 'Real-time academic performance, pass/fail analytics & school leadership',
    },
    results: {
      title: 'Result Generation & Spreadsheet',
      subtitle: 'Excel-like spreadsheet data entry with direct PDF, editable Excel (.xlsx), and A4 print registers',
    },
    dmc: {
      title: 'Detailed Marks Certificates (DMC)',
      subtitle: 'Official student DMC generation with verified marks, stamps & principal signature',
    },
    cards: {
      title: 'Student ID Card Studio',
      subtitle: 'Professional CR80 student card designer with 8 distinct templates & scannable QR verification',
    },
    settings: {
      title: 'System Settings & Administration',
      subtitle: 'School branding, principal profile, grading rules, database backup & developer details',
    },
  };

  const currentInfo = titles[currentTab];

  // Global Search indexing across actual saved records
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;

    interface SearchResultItem {
      id: string;
      title: string;
      subtitle: string;
      category: 'student' | 'class' | 'exam' | 'card';
      tab: NavigationTab;
      extra?: any;
    }

    const results: SearchResultItem[] = [];

    // 1. Search Student Personal Records & Results
    const seenStudentKeys = new Set<string>();
    const personalRecords = Object.values(db.studentPersonalRecords || {});
    personalRecords.forEach((rec) => {
      if (
        rec.studentName?.toLowerCase().includes(query) ||
        rec.fatherName?.toLowerCase().includes(query) ||
        rec.studentNumber?.toString().includes(query) ||
        rec.phone?.toLowerCase().includes(query)
      ) {
        seenStudentKeys.add(`${rec.classId}_${rec.studentNumber}`);
        const className = db.classes.find((c) => c.id === rec.classId)?.name || 'Class';
        results.push({
          id: `personal_${rec.id}`,
          title: rec.studentName,
          subtitle: `Roll #${rec.studentNumber} · ${className} · Father: ${rec.fatherName || 'N/A'}`,
          category: 'student',
          tab: 'dmc',
          extra: { classId: rec.classId, studentNumber: rec.studentNumber },
        });
      }
    });

    // Also search active students in results
    Object.keys(db.results || {}).forEach((classId) => {
      const examMap = db.results[classId] || {};
      Object.keys(examMap).forEach((examId) => {
        const rows = examMap[examId] || [];
        rows.forEach((r) => {
          if (r.name && r.name.trim().length > 0) {
            const key = `${classId}_${r.number}`;
            if (!seenStudentKeys.has(key)) {
              if (
                r.name.toLowerCase().includes(query) ||
                r.fatherName?.toLowerCase().includes(query) ||
                r.number.toString().includes(query)
              ) {
                seenStudentKeys.add(key);
                const className = db.classes.find((c) => c.id === classId)?.name || 'Class';
                results.push({
                  id: `result_${key}`,
                  title: r.name,
                  subtitle: `Roll #${r.number} · ${className} · Father: ${r.fatherName || 'N/A'}`,
                  category: 'student',
                  tab: 'results',
                  extra: { classId, examId, number: r.number },
                });
              }
            }
          }
        });
      });
    });

    // 2. Search Classes
    db.classes.forEach((c) => {
      if (c.name.toLowerCase().includes(query)) {
        results.push({
          id: `class_${c.id}`,
          title: c.name,
          subtitle: `Academic Class (Order: ${c.order})`,
          category: 'class',
          tab: 'results',
          extra: { classId: c.id },
        });
      }
    });

    // 3. Search Examinations
    db.examinations.forEach((e) => {
      if (e.name.toLowerCase().includes(query) || e.academicYear?.toLowerCase().includes(query)) {
        results.push({
          id: `exam_${e.id}`,
          title: e.name,
          subtitle: `Examination · Session ${e.academicYear || db.currentAcademicYear}`,
          category: 'exam',
          tab: 'results',
          extra: { examId: e.id },
        });
      }
    });

    // 4. Search Saved Student Cards
    const cards = Object.values(db.savedStudentCards || {});
    cards.forEach((card) => {
      if (
        card.studentName?.toLowerCase().includes(query) ||
        card.studentNumber?.toLowerCase().includes(query) ||
        card.fatherName?.toLowerCase().includes(query) ||
        card.className?.toLowerCase().includes(query)
      ) {
        results.push({
          id: `card_${card.id}`,
          title: `${card.studentName} (ID Card)`,
          subtitle: `Card No: ${card.studentNumber} · ${card.className} · Session ${card.academicYear}`,
          category: 'card',
          tab: 'cards',
          extra: { cardId: card.id },
        });
      }
    });

    return results.slice(0, 15);
  }, [searchQuery, db]);

  // Handle Academic Session Change
  const handleSessionSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setShowCustomSessionModal(true);
    } else {
      onUpdateDb({ ...db, currentAcademicYear: val });
    }
  };

  // Save new custom academic session
  const handleSaveCustomSession = () => {
    const trimmed = newSessionInput.trim();
    if (!trimmed) return;

    const existing = db.academicYears || ['2025-2026', '2026-2027'];
    const updatedYears = existing.includes(trimmed) ? existing : [...existing, trimmed];

    onUpdateDb({
      ...db,
      academicYears: updatedYears,
      currentAcademicYear: trimmed,
    });

    setNewSessionInput('');
    setShowCustomSessionModal(false);
  };

  const handleSelectSearchResult = (tab: NavigationTab) => {
    onNavigate(tab);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-4 shrink-0 z-20 transition-colors">
      {/* Zone 1: Context Title and Subtitle */}
      <div className="flex flex-col overflow-hidden max-w-[260px] lg:max-w-xs shrink-0">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
          {currentInfo.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Zone 2: GLOBAL SEARCH BAR (Live search across students, classes, exams, cards) */}
      <div className="flex-1 max-w-md relative mx-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search students, father name, roll #, class, exams... (Ctrl+K)"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            className="w-full pl-9 pr-14 py-1.5 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && searchResults && (
          <div
            ref={searchDropdownRef}
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold">Search Results ({searchResults.length})</span>
              <span>Press ESC to close</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching records found for "{searchQuery}".
              </div>
            ) : (
              <div className="p-1 divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSearchResult(item.tab)}
                      className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                          {item.category === 'student' && <User className="w-4 h-4" />}
                          {item.category === 'class' && <BookOpen className="w-4 h-4" />}
                          {item.category === 'exam' && <FileSpreadsheet className="w-4 h-4" />}
                          {item.category === 'card' && <CreditCard className="w-4 h-4" />}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.tab}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Academic Session, Theme Toggle & Institutional Badge */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Academic Session Selector */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 text-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Session:</span>
          <select
            value={db.currentAcademicYear}
            onChange={handleSessionSelectChange}
            className="bg-transparent font-semibold text-slate-900 dark:text-white border-none outline-none cursor-pointer"
          >
            {db.academicYears.map((yr) => (
              <option key={yr} value={yr} className="dark:bg-slate-900 dark:text-white">
                {yr}
              </option>
            ))}
            <option value="__custom__" className="dark:bg-slate-900 dark:text-white">
              + Custom Session...
            </option>
          </select>
        </div>

        {/* Live Date/Time */}
        <div className="hidden xl:block font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          {currentDateTime}
        </div>

        {/* Institutional Application Identity Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="hidden sm:inline font-bold">TISC</span>
        </div>
      </div>

      {/* Custom Academic Session Modal */}
      {showCustomSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add Custom Academic Session</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter any academic year or session (e.g. 2027–2028, 2028–2029).
              </p>
            </div>

            <input
              type="text"
              placeholder="e.g. 2027-2028"
              value={newSessionInput}
              onChange={(e) => setNewSessionInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCustomSessionModal(false);
                  setNewSessionInput('');
                }}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomSession}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
