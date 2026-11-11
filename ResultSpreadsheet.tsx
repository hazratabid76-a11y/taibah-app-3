import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Settings2,
  Trash2,
  CheckCircle2,
  BookOpen,
  Plus,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import {
  AppDatabase,
  CalculatedStudentResult,
  ClassDefinition,
  Examination,
  StudentRow,
  Subject,
} from '../../types';
import { DatabaseService, calculateResults } from '../../db/storage';
import { ClassManagerModal } from './ClassManagerModal';
import { SubjectManagerModal } from './SubjectManagerModal';
import { ResultSheetPrintPreview } from './ResultSheetPrintPreview';
import { exportResultSheetToExcel } from '../../utils/excelExporter';

interface ResultSpreadsheetProps {
  db: AppDatabase;
  onUpdateDb: (db: AppDatabase) => void;
}

export const ResultSpreadsheet: React.FC<ResultSpreadsheetProps> = ({
  db,
  onUpdateDb,
}) => {
  const dbService = useMemo(() => DatabaseService.getInstance(), []);

  // Selected Class & Examination
  const [selectedClassId, setSelectedClassId] = useState<string>(
    db.classes[0]?.id || 'class-10'
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.currentExamId || db.examinations[0]?.id || 'exam-annual-2026'
  );

  // 100 Student Rows for the active class & exam
  const [studentRows, setStudentRows] = useState<StudentRow[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editExamName, setEditExamName] = useState('');

  // Active focused cell: row index (0-99), colKey ('name' | subjectId)
  const [focusedCell, setFocusedCell] = useState<{ row: number; colKey: string } | null>(null);

  // Input refs for direct keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedClass = useMemo(
    () => db.classes.find((c) => c.id === selectedClassId) || db.classes[0],
    [db.classes, selectedClassId]
  );

  const selectedExam = useMemo(
    () => db.examinations.find((e) => e.id === selectedExamId) || db.examinations[0],
    [db.examinations, selectedExamId]
  );

  // Active subjects for this class
  const activeSubjects = useMemo(() => {
    if (selectedClass?.subjects && selectedClass.subjects.length > 0) {
      return db.subjects.filter((s) => selectedClass.subjects?.includes(s.id));
    }
    return db.subjects;
  }, [db.subjects, selectedClass]);

  // Load rows when class or exam changes
  useEffect(() => {
    if (selectedClassId && selectedExamId) {
      const rows = dbService.getStudentRowsForClass(selectedClassId, selectedExamId);
      setStudentRows(rows);
    }
  }, [selectedClassId, selectedExamId, dbService]);

  // Auto-save debounced
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ classId: string; examId: string; rows: StudentRow[] } | null>(null);

  const flushPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (pending) {
      pendingSaveRef.current = null;
      dbService.saveStudentRowsForClass(pending.classId, pending.examId, pending.rows);
    }
  }, [dbService]);

  const triggerAutosave = useCallback(
    (newRows: StudentRow[]) => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      pendingSaveRef.current = { classId: selectedClassId, examId: selectedExamId, rows: newRows };
      saveTimeoutRef.current = setTimeout(() => {
        flushPendingSave();
        setSaveStatus('saved');
      }, 500);
    },
    [flushPendingSave, selectedClassId, selectedExamId]
  );

  // Save any pending change when leaving the page (never lose data)
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

  // Update a single cell
  const handleCellChange = (rowIndex: number, colKey: string, value: string) => {
    const updated = [...studentRows];
    const targetRow = { ...updated[rowIndex] };

    if (colKey === 'name') {
      targetRow.name = value;
    } else {
      // It's a subject mark
      const numVal = value.trim() === '' ? null : Math.max(0, parseFloat(value));
      targetRow.marks = {
        ...targetRow.marks,
        [colKey]: numVal,
      };
    }

    updated[rowIndex] = targetRow;
    setStudentRows(updated);
    triggerAutosave(updated);
  };

  // Keyboard navigation sequence:
  // Name -> Subject 1 -> Subject 2 -> ... -> Subject N -> Name of Next Row!
  const getNextCell = (
    currentRow: number,
    currentColKey: string,
    direction: 'enter' | 'tab' | 'up' | 'down' | 'left' | 'right'
  ): { row: number; colKey: string } | null => {
    const colOrder = ['name', ...activeSubjects.map((s) => s.id)];
    const colIdx = colOrder.indexOf(currentColKey);

    if (direction === 'enter' || direction === 'tab') {
      // Enter Key flow required by user:
      // Student Name, Row 1 -> English -> Urdu -> Math -> Islamiat -> Sci -> Pak Studies -> Student Name, Row 2!
      if (colIdx < colOrder.length - 1) {
        return { row: currentRow, colKey: colOrder[colIdx + 1] };
      } else {
        // Move to next student name
        if (currentRow < 99) {
          return { row: currentRow + 1, colKey: 'name' };
        }
      }
    } else if (direction === 'down') {
      if (currentRow < 99) return { row: currentRow + 1, colKey: currentColKey };
    } else if (direction === 'up') {
      if (currentRow > 0) return { row: currentRow - 1, colKey: currentColKey };
    } else if (direction === 'right') {
      if (colIdx < colOrder.length - 1) return { row: currentRow, colKey: colOrder[colIdx + 1] };
    } else if (direction === 'left') {
      if (colIdx > 0) return { row: currentRow, colKey: colOrder[colIdx - 1] };
    }

    return null;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = getNextCell(rowIndex, colKey, 'enter');
      if (next) {
        focusCell(next.row, next.colKey);
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const next = getNextCell(rowIndex, colKey, 'tab');
      if (next) {
        focusCell(next.row, next.colKey);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = getNextCell(rowIndex, colKey, 'down');
      if (next) focusCell(next.row, next.colKey);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = getNextCell(rowIndex, colKey, 'up');
      if (next) focusCell(next.row, next.colKey);
    }
  };

  const focusCell = (rowIndex: number, colKey: string) => {
    setFocusedCell({ row: rowIndex, colKey });
    const key = `${rowIndex}-${colKey}`;
    const el = inputRefs.current[key];
    if (el) {
      el.focus();
      el.select();
    }
  };

  // Support pasting tab-delimited records from Excel / Google Sheets
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startColKey: string) => {
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData || !clipboardData.includes('\t') && !clipboardData.includes('\n')) {
      return; // Regular single-value paste
    }

    e.preventDefault();
    const rows = clipboardData.split(/\r?\n/).filter((r) => r.trim() !== '');
    const colOrder = ['name', ...activeSubjects.map((s) => s.id)];
    const startColIdx = colOrder.indexOf(startColKey);

    const updated = [...studentRows];

    rows.forEach((line, rOffset) => {
      const targetRowIdx = startRow + rOffset;
      if (targetRowIdx >= 100) return;

      const cells = line.split('\t');
      const targetRow = { ...updated[targetRowIdx] };

      cells.forEach((val, cOffset) => {
        const targetColIdx = startColIdx + cOffset;
        if (targetColIdx >= colOrder.length) return;

        const col = colOrder[targetColIdx];
        if (col === 'name') {
          targetRow.name = val.trim();
        } else {
          const num = val.trim() === '' ? null : parseFloat(val);
          targetRow.marks = {
            ...targetRow.marks,
            [col]: isNaN(num as number) ? null : num,
          };
        }
      });

      updated[targetRowIdx] = targetRow;
    });

    setStudentRows(updated);
    triggerAutosave(updated);
  };

  // Clear all rows for current class with confirmation
  const handleClearAllRows = () => {
    const empty = studentRows.map((r, idx) => ({
      number: idx + 1,
      name: '',
      fatherName: '',
      dateOfBirth: '',
      phone: '',
      photoUrl: '',
      marks: {},
    }));
    setStudentRows(empty);
    // Save immediately so the cleared table is permanent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingSaveRef.current = null;
    dbService.saveStudentRowsForClass(selectedClassId, selectedExamId, empty);
    setSaveStatus('saved');
    setShowClearConfirm(false);
  };

  // Handle creating, editing, and deleting custom examinations permanently
  const handleAddCustomExam = () => {
    const trimmed = newExamName.trim();
    if (!trimmed) return;
    const created = dbService.addCustomExamination(trimmed, db.currentAcademicYear);
    onUpdateDb(dbService.getDatabase());
    setSelectedExamId(created.id);
    setNewExamName('');
    setShowExamModal(false);
  };

  const handleUpdateExam = (id: string) => {
    const trimmed = editExamName.trim();
    if (!trimmed) return;
    dbService.updateCustomExamination(id, trimmed);
    onUpdateDb(dbService.getDatabase());
    setEditingExamId(null);
    setEditExamName('');
  };

  const handleDeleteExam = (id: string) => {
    dbService.deleteCustomExamination(id);
    const updatedDb = dbService.getDatabase();
    onUpdateDb(updatedDb);
    if (selectedExamId === id) {
      setSelectedExamId(updatedDb.examinations[0]?.id || 'exam-annual-2026');
    }
  };

  // Calculations for total marks, grade, positions in real-time
  const calculatedResults: CalculatedStudentResult[] = useMemo(() => {
    return calculateResults(studentRows, activeSubjects, db.gradeRules);
  }, [studentRows, activeSubjects, db.gradeRules]);

  // Lookup map for fast access by row number
  const calculatedMap = useMemo(() => {
    const map = new Map<number, CalculatedStudentResult>();
    calculatedResults.forEach((c) => map.set(c.number, c));
    return map;
  }, [calculatedResults]);

  const filledCount = useMemo(() => {
    return studentRows.filter((r) => r.name.trim() !== '').length;
  }, [studentRows]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-100/60 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        {/* Class Selection Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-2xl py-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Class:
          </span>
          {db.classes.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls.name}
              </button>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Autosave Status */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
            {saveStatus === 'saving' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-spin" />
                <span className="font-mono text-[11px]">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono text-[11px] text-emerald-700 font-medium">Autosaved</span>
              </>
            )}
          </div>

          {/* Manage Classes */}
          <button
            onClick={() => setShowClassModal(true)}
            title="Add, rename or reorder classes"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Classes</span>
          </button>

          {/* Configure Subjects */}
          <button
            onClick={() => setShowSubjectModal(true)}
            title="Configure subjects, max & pass marks"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Subjects</span>
          </button>

          {/* Export to Genuine Excel Workbook (.xlsx) */}
          <button
            onClick={async () => {
              try {
                const result = await exportResultSheetToExcel({
                  schoolProfile: db.schoolProfile,
                  selectedClass,
                  examination: selectedExam,
                  academicYear: db.currentAcademicYear,
                  subjects: activeSubjects,
                  calculatedResults,
                });
                if (!result.success && result.error && result.error !== 'Save was cancelled.') {
                  alert(result.error);
                }
              } catch (err: any) {
                alert(err?.message || 'Failed to export Excel file.');
              }
            }}
            title="Download editable Excel workbook (.xlsx)"
            className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* A4 Print Result Sheet Modal */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate A4 Sheet</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Examination selector, student count & quick tools */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Examination:</span>
            <select
              value={selectedExamId}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setShowExamModal(true);
                } else {
                  setSelectedExamId(e.target.value);
                }
              }}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 font-semibold text-slate-900 outline-none cursor-pointer"
            >
              {db.examinations.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
              <option value="__custom__">+ Custom Examination...</option>
            </select>
            <button
              onClick={() => setShowExamModal(true)}
              title="Manage or Add Examination Names"
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-slate-500 font-medium">
            Active Students: <span className="font-bold text-slate-900 font-mono">{filledCount}</span> / 100 rows
          </div>
        </div>

        <div className="flex items-center gap-2">
          {filledCount > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all student rows for this class"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Table</span>
            </button>
          )}
        </div>
      </div>

      {/* Excel-like High Performance Spreadsheet Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden inline-block min-w-full">
          <table className="w-full border-collapse text-xs select-text">
            <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
              <tr>
                {/* Column 1: Number (Mandatory: heading MUST be Number, NOT Roll No) */}
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-14 bg-slate-200/70">
                  Number
                </th>
                {/* Column 2: Student Name */}
                <th className="py-2.5 px-4 border-r border-slate-300 text-left min-w-[200px]">
                  Student Name
                </th>
                {/* Subject Columns (English, Urdu, Mathematics, Islamiat, General Science, Pakistan Studies, etc.) */}
                {activeSubjects.map((sub) => (
                  <th
                    key={sub.id}
                    className="py-2.5 px-3 border-r border-slate-300 text-center min-w-[100px]"
                  >
                    <div className="font-bold text-slate-800">{sub.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Max: {sub.maxMarks} · Pass: {sub.passMarks}
                    </div>
                  </th>
                ))}
                {/* Auto Calculated Columns */}
                <th className="py-2.5 px-3 border-r border-slate-300 text-center bg-blue-50/80 text-blue-900 font-bold min-w-[90px]">
                  Total Marks
                </th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center bg-slate-200/50 font-bold min-w-[70px]">
                  Grade
                </th>
                <th className="py-2.5 px-3 text-center bg-amber-50 text-amber-900 font-bold min-w-[70px]">
                  Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentRows.map((row, rowIndex) => {
                const calc = calculatedMap.get(row.number);
                const hasName = row.name.trim() !== '';

                return (
                  <tr
                    key={row.number}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      hasName ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* Number (1 to 100) */}
                    <td className="py-1 px-3 border-r border-slate-200 text-center font-mono font-semibold text-slate-500 bg-slate-100/50">
                      {row.number}
                    </td>

                    {/* Student Name */}
                    <td className="p-0 border-r border-slate-200">
                      <input
                        ref={(el) => {
                          inputRefs.current[`${rowIndex}-name`] = el;
                        }}
                        type="text"
                        value={row.name}
                        placeholder={rowIndex === 0 ? 'Type Student Name...' : ''}
                        onChange={(e) => handleCellChange(rowIndex, 'name', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 'name')}
                        onPaste={(e) => handlePaste(e, rowIndex, 'name')}
                        onFocus={() => setFocusedCell({ row: rowIndex, colKey: 'name' })}
                        className="w-full h-8 px-3 font-semibold text-slate-900 bg-transparent outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-600 transition-colors"
                      />
                    </td>

                    {/* Subject Marks */}
                    {activeSubjects.map((sub) => {
                      const markVal = row.marks[sub.id];
                      const displayVal = typeof markVal === 'number' ? markVal : '';
                      const isFail = typeof markVal === 'number' && markVal < sub.passMarks;

                      return (
                        <td
                          key={sub.id}
                          className={`p-0 border-r border-slate-200 ${
                            isFail ? 'bg-rose-50/50' : ''
                          }`}
                        >
                          <input
                            ref={(el) => {
                              inputRefs.current[`${rowIndex}-${sub.id}`] = el;
                            }}
                            type="number"
                            min="0"
                            max={sub.maxMarks}
                            step="any"
                            value={displayVal}
                            placeholder="—"
                            onChange={(e) => handleCellChange(rowIndex, sub.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, sub.id)}
                            onPaste={(e) => handlePaste(e, rowIndex, sub.id)}
                            onFocus={() => setFocusedCell({ row: rowIndex, colKey: sub.id })}
                            className={`w-full h-8 px-2 font-mono text-center outline-none transition-colors focus:bg-blue-50 focus:ring-2 focus:ring-blue-600 ${
                              isFail ? 'text-rose-700 font-bold' : 'text-slate-800'
                            }`}
                          />
                        </td>
                      );
                    })}

                    {/* Total Marks (Auto Calculated) */}
                    <td className="py-1 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-950 bg-blue-50/30 tabular-nums">
                      {calc ? calc.totalMarks : '—'}
                    </td>

                    {/* Grade (Auto Calculated) */}
                    <td className="py-1 px-3 border-r border-slate-200 text-center font-bold">
                      {calc ? (
                        <span
                          className={`font-semibold ${
                            calc.grade === 'F' ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {calc.grade}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Position (Auto Calculated) */}
                    <td className="py-1 px-3 text-center font-mono font-bold text-slate-950 bg-amber-50/40 tabular-nums">
                      {calc && calc.position > 0 ? (
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            calc.position === 1
                              ? 'bg-amber-400 text-amber-950 font-extrabold'
                              : calc.position === 2
                              ? 'bg-slate-300 text-slate-900'
                              : calc.position === 3
                              ? 'bg-amber-700/40 text-amber-950'
                              : 'text-slate-700'
                          }`}
                        >
                          {calc.position}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Table */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold text-slate-900">Clear All Student Rows?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to erase all student names and marks for{' '}
              <span className="font-bold text-slate-800">{selectedClass.name}</span> in{' '}
              <span className="font-bold text-slate-800">{selectedExam.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllRows}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer shadow-xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ClassManagerModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        classes={db.classes}
        onSaveClasses={(classes) => {
          const updatedDb = { ...db, classes };
          onUpdateDb(updatedDb);
          dbService.saveDatabase(updatedDb, {
            action: 'Classes Updated',
            category: 'settings',
            details: `Updated ${classes.length} school classes.`,
          });
        }}
      />

      <SubjectManagerModal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        subjects={db.subjects}
        onSaveSubjects={(subjects) => {
          const updatedDb = { ...db, subjects };
          onUpdateDb(updatedDb);
          dbService.saveDatabase(updatedDb, {
            action: 'Subjects Updated',
            category: 'settings',
            details: `Configured ${subjects.length} academic subjects.`,
          });
        }}
      />

      <ResultSheetPrintPreview
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        schoolProfile={db.schoolProfile}
        principalProfile={db.principalProfile}
        selectedClass={selectedClass}
        examination={selectedExam}
        academicYear={db.currentAcademicYear}
        subjects={activeSubjects}
        calculatedResults={calculatedResults}
      />

      {/* Custom Examination Manager Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Manage Examination Names</h3>
                <p className="text-xs text-slate-500">
                  Select existing, or create custom tests (e.g. Monthly, Weekly, Unit Test)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowExamModal(false);
                  setNewExamName('');
                  setEditingExamId(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Custom Exam Form */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Add Custom Examination</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Monthly Test, Weekly Test, Unit Test, Special Exam"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomExam()}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                />
                <button
                  onClick={handleAddCustomExam}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* List of Current Examinations */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">Active Examinations ({db.examinations.length})</label>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {db.examinations.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs gap-2"
                  >
                    {editingExamId === exam.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editExamName}
                          onChange={(e) => setEditExamName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateExam(exam.id)}
                          className="flex-1 px-2 py-1 text-xs border border-blue-500 rounded outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateExam(exam.id)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingExamId(null)}
                          className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => {
                            setSelectedExamId(exam.id);
                            setShowExamModal(false);
                          }}
                          className="flex-1 cursor-pointer group flex items-center gap-2"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              selectedExamId === exam.id ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-slate-300'
                            }`}
                          />
                          <span className="font-semibold text-slate-800 group-hover:text-blue-600">
                            {exam.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingExamId(exam.id);
                              setEditExamName(exam.name);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                            title="Rename Examination"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {db.examinations.length > 1 && (
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Delete Examination"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowExamModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
