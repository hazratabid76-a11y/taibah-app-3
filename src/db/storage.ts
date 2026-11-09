import { AppDatabase, CalculatedStudentResult, CustomTemplatePreset, Examination, GradeRule, SavedStudentCard, StudentPersonalRecord, StudentRow, Subject } from '../types';
import { createEmptyStudentRows, INITIAL_DATABASE } from './initialData';

const DB_STORAGE_KEY = 'taibah_school_management_database_v2';
const LEGACY_STORAGE_KEY = 'taibah_school_management_database_v1';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: AppDatabase;
  private listeners: Set<(db: AppDatabase) => void> = new Set();

  private constructor() {
    this.db = this.loadFromStorage();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private loadFromStorage(): AppDatabase {
    try {
      let stored = localStorage.getItem(DB_STORAGE_KEY);
      if (!stored) {
        // Safe migration from v1
        stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        const savedTheme = localStorage.getItem('taibah_theme_mode') as 'light' | 'dark' | null;
        const currentTheme = savedTheme || parsed?.themeMode || 'light';
        if (typeof document !== 'undefined') {
          if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }

        // Merge with initial database structure preserving all existing data
        const merged: AppDatabase = {
          ...INITIAL_DATABASE,
          ...parsed,
          themeMode: currentTheme,
          schoolProfile: {
            ...INITIAL_DATABASE.schoolProfile,
            ...(parsed.schoolProfile || {}),
          },
          principalProfile: {
            ...INITIAL_DATABASE.principalProfile,
            ...(parsed.principalProfile || {}),
          },
          cardSettings: {
            ...INITIAL_DATABASE.cardSettings,
            ...(parsed.cardSettings || {}),
          },
          dmcTemplate: parsed.dmcTemplate || INITIAL_DATABASE.dmcTemplate,
          classes: parsed.classes?.length ? parsed.classes : INITIAL_DATABASE.classes,
          sections: parsed.sections?.length ? parsed.sections : INITIAL_DATABASE.sections,
          subjects: parsed.subjects?.length ? parsed.subjects : INITIAL_DATABASE.subjects,
          gradeRules: parsed.gradeRules?.length ? parsed.gradeRules : INITIAL_DATABASE.gradeRules,
          examinations: parsed.examinations?.length ? parsed.examinations : INITIAL_DATABASE.examinations,
          academicYears: parsed.academicYears?.length ? parsed.academicYears : INITIAL_DATABASE.academicYears,
          results: parsed.results || {},
          studentPersonalRecords: parsed.studentPersonalRecords || {},
          savedStudentCards: parsed.savedStudentCards || {},
          customCardTemplates: parsed.customCardTemplates || [],
          activityLogs: parsed.activityLogs || INITIAL_DATABASE.activityLogs,
        };

        // Upgrade logo URL to official asset if outdated
        if (!merged.schoolProfile.logoUrl || merged.schoolProfile.logoUrl.includes('InShot')) {
          merged.schoolProfile.logoUrl = INITIAL_DATABASE.schoolProfile.logoUrl;
        }
        if (merged.cardSettings.customLogoUrl?.includes('InShot')) {
          merged.cardSettings.customLogoUrl = INITIAL_DATABASE.schoolProfile.logoUrl;
        }

        // Populate studentPersonalRecords from existing studentRows if any
        if (parsed.results) {
          const resultsRecord = parsed.results as Record<string, Record<string, StudentRow[]>>;
          for (const classId of Object.keys(resultsRecord)) {
            const examMap: Record<string, StudentRow[]> | undefined = resultsRecord[classId];
            if (!examMap) continue;
            for (const examId of Object.keys(examMap)) {
              const rows: StudentRow[] = examMap[examId] || [];
              for (const r of rows) {
                if (r.name && r.name.trim() !== '') {
                  const key = `${classId}_${r.number}`;
                  if (!merged.studentPersonalRecords[key]) {
                    merged.studentPersonalRecords[key] = {
                      id: key,
                      classId,
                      studentNumber: r.number,
                      studentName: r.name,
                      fatherName: r.fatherName || '',
                      dateOfBirth: r.dateOfBirth || '',
                      phone: r.phone || '',
                      photoUrl: r.photoUrl || '',
                    };
                  }
                }
              }
            }
          }
        }

        return merged;
      }
    } catch (e) {
      console.error('Failed to load database from localStorage, initializing fresh:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATABASE));
  }

  public getDatabase(): AppDatabase {
    return this.db;
  }

  public saveDatabase(newDb: AppDatabase, recordActivity?: { action: string; category: any; details: string }) {
    if (recordActivity) {
      const newLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
        action: recordActivity.action,
        category: recordActivity.category,
        details: recordActivity.details,
      };
      newDb.activityLogs = [newLog, ...(newDb.activityLogs || [])].slice(0, 50);
    }

    this.db = newDb;
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(newDb));
      if (newDb.themeMode) {
        localStorage.setItem('taibah_theme_mode', newDb.themeMode);
        if (typeof document !== 'undefined') {
          if (newDb.themeMode === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
      
      // If Electron IPC is available, sync to SQLite/disk
      if (typeof window !== 'undefined' && (window as any).electronAPI?.saveDatabase) {
        (window as any).electronAPI.saveDatabase(newDb);
      }
    } catch (e) {
      console.error('Failed to persist database to storage:', e);
    }

    // Notify listeners
    this.notify();
  }

  public subscribe(listener: (db: AppDatabase) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.db);
      } catch (err) {
        console.error('Error notifying database listener:', err);
      }
    }
  }

  public getStudentRowsForClass(classId: string, examId: string): StudentRow[] {
    const classResults = this.db.results[classId];
    let rows: StudentRow[] = [];
    if (classResults && classResults[examId]) {
      const existing = classResults[examId];
      if (existing.length < 100) {
        rows = createEmptyStudentRows(100);
        for (let i = 0; i < existing.length; i++) {
          rows[i] = { ...rows[i], ...existing[i], number: i + 1 };
        }
      } else {
        rows = [...existing];
      }
    } else {
      rows = createEmptyStudentRows(100);
    }

    // Overlay saved personal records for each student
    return rows.map((r) => {
      const personal = this.db.studentPersonalRecords[`${classId}_${r.number}`];
      if (personal) {
        return {
          ...r,
          name: r.name || personal.studentName,
          fatherName: personal.fatherName || r.fatherName || '',
          dateOfBirth: personal.dateOfBirth || r.dateOfBirth || '',
          phone: personal.phone || r.phone || '',
          photoUrl: personal.photoUrl || r.photoUrl || '',
        };
      }
      return r;
    });
  }

  public saveStudentRowsForClass(classId: string, examId: string, rows: StudentRow[]) {
    const updatedResults = { ...this.db.results };
    if (!updatedResults[classId]) {
      updatedResults[classId] = {};
    }
    updatedResults[classId][examId] = rows;

    // Also update personal records without losing existing details
    const updatedPersonal = { ...this.db.studentPersonalRecords };
    for (const r of rows) {
      if (r.name && r.name.trim() !== '') {
        const key = `${classId}_${r.number}`;
        const existing = updatedPersonal[key];
        updatedPersonal[key] = {
          id: key,
          classId,
          studentNumber: r.number,
          studentName: r.name.trim(),
          fatherName: r.fatherName || existing?.fatherName || '',
          dateOfBirth: r.dateOfBirth || existing?.dateOfBirth || '',
          phone: r.phone || existing?.phone || '',
          photoUrl: r.photoUrl || existing?.photoUrl || '',
          updatedAt: Date.now(),
        };
      }
    }

    const className = this.db.classes.find(c => c.id === classId)?.name || 'Class';
    const filledCount = rows.filter(r => r.name.trim() !== '').length;

    this.saveDatabase(
      {
        ...this.db,
        results: updatedResults,
        studentPersonalRecords: updatedPersonal,
      },
      {
        action: `Result Updated: ${className}`,
        category: 'result',
        details: `Saved records for ${className} (${filledCount} active students).`,
      }
    );
  }

  public getPersonalRecord(classId: string, studentNumber: number): StudentPersonalRecord | null {
    const key = `${classId}_${studentNumber}`;
    return this.db.studentPersonalRecords[key] || null;
  }

  public savePersonalRecord(record: StudentPersonalRecord) {
    const updatedPersonal = {
      ...this.db.studentPersonalRecords,
      [record.id]: {
        ...record,
        updatedAt: Date.now(),
      },
    };

    // Also sync the name/fatherName/dob/phone into any existing results for that student
    const updatedResults = { ...this.db.results };
    if (updatedResults[record.classId]) {
      for (const examId of Object.keys(updatedResults[record.classId])) {
        const rows = updatedResults[record.classId][examId];
        updatedResults[record.classId][examId] = rows.map((r) => {
          if (r.number === record.studentNumber) {
            return {
              ...r,
              name: record.studentName || r.name,
              fatherName: record.fatherName,
              dateOfBirth: record.dateOfBirth,
              phone: record.phone,
              photoUrl: record.photoUrl || r.photoUrl,
            };
          }
          return r;
        });
      }
    }

    this.saveDatabase(
      {
        ...this.db,
        studentPersonalRecords: updatedPersonal,
        results: updatedResults,
      },
      {
        action: `Student Info Updated: ${record.studentName}`,
        category: 'settings',
        details: `Updated personal credentials for No. ${record.studentNumber}.`,
      }
    );
  }

  // --- Student ID Card Management Methods ---

  public getSavedStudentCards(): SavedStudentCard[] {
    const cardsMap = this.db.savedStudentCards || {};
    return Object.values(cardsMap).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  public getSavedStudentCard(id: string): SavedStudentCard | undefined {
    return this.db.savedStudentCards?.[id];
  }

  public saveStudentCard(card: SavedStudentCard): void {
    const updatedCards = { ...(this.db.savedStudentCards || {}) };
    updatedCards[card.id] = {
      ...card,
      updatedAt: Date.now(),
    };

    this.saveDatabase(
      {
        ...this.db,
        savedStudentCards: updatedCards,
      },
      {
        action: `Student Card Saved: ${card.studentName}`,
        category: 'card',
        details: `Saved ID card for ${card.studentName} (${card.className || 'Class N/A'}).`,
      }
    );
  }

  public deleteStudentCard(id: string): void {
    const updatedCards = { ...(this.db.savedStudentCards || {}) };
    const cardToDelete = updatedCards[id];
    delete updatedCards[id];

    this.saveDatabase(
      {
        ...this.db,
        savedStudentCards: updatedCards,
      },
      {
        action: `Student Card Deleted: ${cardToDelete?.studentName || id}`,
        category: 'card',
        details: `Removed ID card from persistent registry.`,
      }
    );
  }

  public getCustomTemplates(): CustomTemplatePreset[] {
    return this.db.customCardTemplates || [];
  }

  public saveCustomTemplate(preset: CustomTemplatePreset): void {
    const existing = this.db.customCardTemplates || [];
    const filtered = existing.filter((t) => t.id !== preset.id);
    const updated = [preset, ...filtered];

    this.saveDatabase(
      {
        ...this.db,
        customCardTemplates: updated,
      },
      {
        action: `Custom Template Saved: ${preset.name}`,
        category: 'card',
        details: `Saved reusable custom card template preset.`,
      }
    );
  }

  // --- Custom Examination Management ---
  public addCustomExamination(name: string, academicYear?: string): Examination {
    const trimmed = name.trim();
    const year = academicYear || this.db.currentAcademicYear || '2025-2026';
    const id = 'exam-custom-' + Date.now();
    const newExam: Examination = {
      id,
      name: trimmed,
      academicYear: year,
    };

    const updated = [...this.db.examinations, newExam];
    this.saveDatabase(
      {
        ...this.db,
        examinations: updated,
        currentExamId: id,
      },
      {
        action: `Custom Examination Created: ${trimmed}`,
        category: 'result',
        details: `Created new examination '${trimmed}' for session ${year}.`,
      }
    );
    return newExam;
  }

  public updateCustomExamination(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = this.db.examinations.map((e) => (e.id === id ? { ...e, name: trimmed } : e));
    this.saveDatabase(
      {
        ...this.db,
        examinations: updated,
      },
      {
        action: `Examination Renamed: ${trimmed}`,
        category: 'result',
        details: `Renamed examination to '${trimmed}'.`,
      }
    );
  }

  public deleteCustomExamination(id: string): void {
    // Preserve base examinations if needed, but allow deleting custom exams
    const target = this.db.examinations.find((e) => e.id === id);
    if (!target) return;

    const updated = this.db.examinations.filter((e) => e.id !== id);
    const fallbackId = updated[0]?.id || 'exam-annual-2026';

    this.saveDatabase(
      {
        ...this.db,
        examinations: updated,
        currentExamId: this.db.currentExamId === id ? fallbackId : this.db.currentExamId,
      },
      {
        action: `Examination Deleted: ${target.name}`,
        category: 'result',
        details: `Removed examination from database records.`,
      }
    );
  }

  // --- Custom Section Management ---
  public addCustomSection(section: string): void {
    const trimmed = section.trim();
    if (!trimmed) return;
    const existing = this.db.sections || [];
    if (!existing.includes(trimmed)) {
      const updated = [...existing, trimmed];
      this.saveDatabase(
        {
          ...this.db,
          sections: updated,
        },
        {
          action: `Custom Section Created: ${trimmed}`,
          category: 'settings',
          details: `Added new section '${trimmed}'.`,
        }
      );
    }
  }

  public deleteCustomSection(section: string): void {
    const existing = this.db.sections || [];
    const updated = existing.filter((s) => s !== section);
    this.saveDatabase(
      {
        ...this.db,
        sections: updated,
      },
      {
        action: `Section Deleted: ${section}`,
        category: 'settings',
        details: `Removed section '${section}'.`,
      }
    );
  }

  // --- Custom Academic Session Management ---
  public addCustomAcademicSession(session: string): void {
    const trimmed = session.trim();
    if (!trimmed) return;
    const existing = this.db.academicYears || ['2025-2026', '2026-2027'];
    if (!existing.includes(trimmed)) {
      const updated = [...existing, trimmed];
      this.saveDatabase(
        {
          ...this.db,
          academicYears: updated,
          currentAcademicYear: trimmed,
        },
        {
          action: `Custom Academic Session Created: ${trimmed}`,
          category: 'settings',
          details: `Added new academic session '${trimmed}'.`,
        }
      );
    }
  }

  public deleteCustomAcademicSession(session: string): void {
    const existing = this.db.academicYears || ['2025-2026', '2026-2027'];
    if (existing.length <= 1) return; // keep at least 1 session
    const updated = existing.filter((s) => s !== session);
    const fallback = updated[0];
    this.saveDatabase(
      {
        ...this.db,
        academicYears: updated,
        currentAcademicYear: this.db.currentAcademicYear === session ? fallback : this.db.currentAcademicYear,
      },
      {
        action: `Academic Session Deleted: ${session}`,
        category: 'settings',
        details: `Removed academic session '${session}'.`,
      }
    );
  }

  public exportBackup(): string {
    const backupData = {
      ...this.db,
      exportedAt: new Date().toISOString(),
      schoolName: 'TAIBAH INTERNATIONAL SCHOOL AND COLLEGE',
      location: 'Bajaur, Pakistan',
      developer: 'Hazrat Abid',
    };
    return JSON.stringify(backupData, null, 2);
  }

  public restoreBackup(jsonContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || !parsed.schoolProfile || !parsed.classes || !parsed.subjects) {
        return { success: false, message: 'Invalid backup file structure. Missing required school records.' };
      }

      this.saveDatabase(
        {
          ...parsed,
          lastBackupDate: new Date().toLocaleDateString(),
        },
        {
          action: 'Database Restored',
          category: 'backup',
          details: 'Successfully restored all school records from backup file.',
        }
      );
      return { success: true, message: 'Database successfully restored from backup.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to parse backup JSON file.' };
    }
  }

  public resetToDefault(): void {
    localStorage.removeItem(DB_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    this.db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.saveDatabase(this.db, {
      action: 'System Reset',
      category: 'settings',
      details: 'All records reset to initial default state.',
    });
  }
}

/**
 * Pure calculation engine for results, marks, grades, and class positions
 */
export function calculateResults(
  studentRows: StudentRow[],
  activeSubjects: Subject[],
  gradeRules: GradeRule[]
): CalculatedStudentResult[] {
  const activeStudents = studentRows.filter(
    (row) => row.name && row.name.trim().length > 0
  );

  const totalMaxMarks = activeSubjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0);

  const calculated = activeStudents.map((student) => {
    let totalObtained = 0;
    const failedSubjects: string[] = [];
    let hasAtLeastOneMark = false;

    for (const subject of activeSubjects) {
      const mark = student.marks[subject.id];
      if (typeof mark === 'number' && !isNaN(mark)) {
        hasAtLeastOneMark = true;
        totalObtained += mark;
        if (mark < subject.passMarks) {
          failedSubjects.push(subject.name);
        }
      }
    }

    const percentage = totalMaxMarks > 0 ? (totalObtained / totalMaxMarks) * 100 : 0;
    const roundedPercentage = Math.round(percentage * 100) / 100;

    let grade = 'F';
    for (const rule of gradeRules) {
      if (roundedPercentage >= rule.minPercentage && roundedPercentage <= rule.maxPercentage) {
        grade = rule.grade;
        break;
      }
    }

    const passed = failedSubjects.length === 0 && roundedPercentage >= 33 && hasAtLeastOneMark;

    return {
      number: student.number,
      name: student.name.trim(),
      fatherName: student.fatherName?.trim() || '',
      dateOfBirth: student.dateOfBirth?.trim() || '',
      phone: student.phone?.trim() || '',
      photoUrl: student.photoUrl || '',
      marks: student.marks,
      totalMarks: totalObtained,
      maxMarksTotal: totalMaxMarks,
      percentage: roundedPercentage,
      grade,
      position: 0,
      passed,
      failedSubjects,
      hasAtLeastOneMark,
    };
  });

  const sorted = [...calculated].sort((a, b) => b.totalMarks - a.totalMarks);

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalMarks < sorted[i - 1].totalMarks) {
      currentRank = i + 1;
    }
    sorted[i].position = currentRank;
  }

  return sorted.sort((a, b) => a.number - b.number);
}
