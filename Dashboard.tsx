import React, { useMemo, useState } from 'react';
import {
  Users,
  Building2,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Award,
  CreditCard,
  Settings,
  Sparkles,
  User,
  History,
} from 'lucide-react';
import { AppDatabase, NavigationTab } from '../../types';
import { calculateResults } from '../../db/storage';
import { OFFICIAL_LOGO_URL } from '../../db/initialData';

interface DashboardProps {
  db: AppDatabase;
  onNavigate: (tab: NavigationTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ db, onNavigate }) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    db.currentAcademicYear || db.academicYears[0] || '2025-2026'
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.currentExamId || db.examinations[0]?.id || ''
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Filter exams that match selected academic year
  const availableExams = useMemo(() => {
    const matched = db.examinations.filter((e) => e.academicYear === selectedAcademicYear);
    return matched.length > 0 ? matched : db.examinations;
  }, [db.examinations, selectedAcademicYear]);

  // Aggregate student statistics from real saved records
  const aggregatedStats = useMemo(() => {
    let totalStudents = 0;
    let passedStudents = 0;
    let failedStudents = 0;
    let totalMarksAccumulator = 0;
    let totalMaxMarksAccumulator = 0;

    interface StudentWithMeta {
      name: string;
      className: string;
      classId: string;
      totalMarks: number;
      maxMarksTotal: number;
      percentage: number;
      grade: string;
      position: number;
      passed: boolean;
    }

    const allCalculatedStudents: StudentWithMeta[] = [];

    const classStatsList: {
      classId: string;
      className: string;
      total: number;
      passed: number;
      failed: number;
      highestPct: number;
      avgPct: number;
    }[] = [];

    const targetClasses =
      selectedClassFilter === 'all'
        ? db.classes
        : db.classes.filter((c) => c.id === selectedClassFilter);

    for (const cls of targetClasses) {
      const classRows = db.results[cls.id]?.[selectedExamId] || [];
      const classSubjects = cls.subjects?.length
        ? db.subjects.filter((s) => cls.subjects?.includes(s.id))
        : db.subjects;

      const calculated = calculateResults(classRows, classSubjects, db.gradeRules);

      let clsPassed = 0;
      let clsFailed = 0;
      let clsHighestPct = 0;
      let clsTotalPct = 0;

      for (const st of calculated) {
        totalStudents++;
        totalMarksAccumulator += st.totalMarks;
        totalMaxMarksAccumulator += st.maxMarksTotal;

        if (st.passed) {
          passedStudents++;
          clsPassed++;
        } else {
          failedStudents++;
          clsFailed++;
        }

        if (st.percentage > clsHighestPct) {
          clsHighestPct = st.percentage;
        }
        clsTotalPct += st.percentage;

        allCalculatedStudents.push({
          name: st.name,
          className: cls.name,
          classId: cls.id,
          totalMarks: st.totalMarks,
          maxMarksTotal: st.maxMarksTotal,
          percentage: st.percentage,
          grade: st.grade,
          position: st.position,
          passed: st.passed,
        });
      }

      classStatsList.push({
        classId: cls.id,
        className: cls.name,
        total: calculated.length,
        passed: clsPassed,
        failed: clsFailed,
        highestPct: clsHighestPct,
        avgPct: calculated.length > 0 ? Math.round((clsTotalPct / calculated.length) * 10) / 10 : 0,
      });
    }

    // Sort all students across the school by percentage descending for school topper and top 3
    allCalculatedStudents.sort((a, b) => b.percentage - a.percentage);

    const schoolTopper = allCalculatedStudents[0] || null;
    const topThree = allCalculatedStudents.slice(0, 3);

    const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
    const failRate = totalStudents > 0 ? Math.round((failedStudents / totalStudents) * 100) : 0;

    // Count all distinct registered students in personal records database
    const totalRegisteredCount = Object.keys(db.studentPersonalRecords || {}).length;
    const displayStudentCount = Math.max(totalStudents, totalRegisteredCount);

    return {
      totalStudents: displayStudentCount,
      activeExamStudents: totalStudents,
      totalClasses: db.classes.length,
      totalSubjects: db.subjects.length,
      passedStudents,
      failedStudents,
      passRate,
      failRate,
      schoolTopper,
      topThree,
      classStatsList,
      hasRecords: totalStudents > 0,
    };
  }, [db, selectedAcademicYear, selectedExamId, selectedClassFilter]);

  const currentExamObj = db.examinations.find((e) => e.id === selectedExamId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none transition-colors">
      {/* 1. Institutional Hero Banner with Official Logo (IMAGE 1) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-blue-800/60 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center shrink-0 border-2 border-amber-400">
            <img
              src={db.schoolProfile.logoUrl || OFFICIAL_LOGO_URL}
              alt="TAIBAH Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                Official School System
              </span>
              <span className="text-xs text-blue-300 font-semibold">Bajaur, Pakistan</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase font-sans">
              {db.schoolProfile.name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 font-medium">
              {db.schoolProfile.subtitle || 'Centre of Academic Excellence & Character Building'}
            </p>
          </div>
        </div>

        {/* Quick Session Badge */}
        <div className="flex items-center gap-3 z-10 shrink-0">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right">
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              Academic Session
            </div>
            <div className="text-base font-extrabold text-white font-mono">
              {db.currentAcademicYear}
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE 4 QUICK ACCESS MODULE CARDS (Requirement 2 & 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Result Generation */}
        <div
          onClick={() => onNavigate('results')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Module 1
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Result Generation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Spreadsheet data entry, 50-student A4 printable sheets, PDF download & genuine Excel (.xlsx) export.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
            <span>Open Result Sheet</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Module 2: DMC Generation */}
        <div
          onClick={() => onNavigate('dmc')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Module 2
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              DMC Generation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Official student Detailed Marks Certificates with multi-template selection, verified stamps & direct PDF download.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Generate DMCs</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Module 3: Student Card Generator */}
        <div
          onClick={() => onNavigate('cards')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Module 3
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              Student Card Generator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Independent CR80 ID designer, 8 distinct templates, portrait/landscape, custom backgrounds & scannable QR.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
            <span>Design ID Cards</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Module 4: Settings & Administration */}
        <div
          onClick={() => onNavigate('settings')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Module 4
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Settings & Config
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Principal profile, class & subject management, appearance, backup/restore, and verified About Developer.
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:translate-x-1 transition-transform">
            <span>System Settings</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>

      {/* 3. 4 KEY PERFORMANCE INDICATORS (Actual Saved Data - No Mock Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
            <Users className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Students
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {aggregatedStats.totalStudents}
            </div>
          </div>
        </div>

        {/* Available Classes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available Classes
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {aggregatedStats.totalClasses}
            </div>
          </div>
        </div>

        {/* Available Subjects */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available Subjects
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {aggregatedStats.totalSubjects}
            </div>
          </div>
        </div>

        {/* Current Academic Session */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Academic Session
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {db.currentAcademicYear}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filters Bar for Result Analytics */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Filter Examination Data:</span>
          </div>

          {/* Academic Year */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none"
          >
            {db.academicYears.map((yr) => (
              <option key={yr} value={yr} className="dark:bg-slate-900">
                Session {yr}
              </option>
            ))}
          </select>

          {/* Examination */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none"
          >
            {availableExams.map((exam) => (
              <option key={exam.id} value={exam.id} className="dark:bg-slate-900">
                {exam.name}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none"
          >
            <option value="all" className="dark:bg-slate-900">All Configured Classes</option>
            {db.classes.map((cls) => (
              <option key={cls.id} value={cls.id} className="dark:bg-slate-900">
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onNavigate('results')}
          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Open Spreadsheet</span>
        </button>
      </div>

      {/* 5. Principal Leadership Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row items-center gap-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
          {db.principalProfile.photoUrl ? (
            <img
              src={db.principalProfile.photoUrl}
              alt="Principal"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-slate-400" />
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900">
              Institutional Leadership
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{db.schoolProfile.name}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {db.principalProfile.name || 'Muhammad Ismail Khan'}
          </h3>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {db.principalProfile.title || 'Principal & Executive Director'}
          </p>
          {db.principalProfile.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 line-clamp-2 max-w-2xl leading-relaxed">
              "{db.principalProfile.description}"
            </p>
          )}
        </div>

        <button
          onClick={() => onNavigate('settings')}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit Leadership</span>
        </button>
      </div>

      {/* 6. Main Content Area */}
      {!aggregatedStats.hasRecords ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-100 dark:border-blue-900">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Student Marks Entered for {currentExamObj?.name || 'Selected Examination'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Data safety compliance: no fake student results or imaginary marks are generated. Open the Result Generation module to enter verified marks into the spreadsheet.
            </p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Open Result Spreadsheet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: School Topper & Pass/Fail Overview */}
          <div className="space-y-6">
            {aggregatedStats.schoolTopper && (
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-5 shadow-sm border border-blue-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-15">
                  <Trophy className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300 mb-3">
                  <Trophy className="w-4 h-4" />
                  <span>Institutional Position 1</span>
                </div>
                <div className="text-lg font-bold text-white tracking-tight">
                  {aggregatedStats.schoolTopper.name}
                </div>
                <div className="text-xs text-blue-200 mt-0.5">
                  Class: <span className="font-semibold text-white">{aggregatedStats.schoolTopper.className}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-blue-800/80">
                  <div className="bg-blue-950/60 rounded-xl p-2 border border-blue-800/40 text-center">
                    <div className="text-[10px] text-blue-300 font-medium">Marks</div>
                    <div className="text-xs font-bold text-white font-mono tabular-nums">
                      {aggregatedStats.schoolTopper.totalMarks}/{aggregatedStats.schoolTopper.maxMarksTotal}
                    </div>
                  </div>
                  <div className="bg-blue-950/60 rounded-xl p-2 border border-blue-800/40 text-center">
                    <div className="text-[10px] text-blue-300 font-medium">Percentage</div>
                    <div className="text-xs font-bold text-amber-300 font-mono tabular-nums">
                      {aggregatedStats.schoolTopper.percentage}%
                    </div>
                  </div>
                  <div className="bg-blue-950/60 rounded-xl p-2 border border-blue-800/40 text-center">
                    <div className="text-[10px] text-blue-300 font-medium">Grade</div>
                    <div className="text-xs font-bold text-emerald-300 font-mono tabular-nums">
                      {aggregatedStats.schoolTopper.grade}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pass and Fail Overview */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pass & Fail Overview
                </h3>
                <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {aggregatedStats.activeExamStudents} evaluated
                </span>
              </div>

              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200/80 dark:border-slate-700">
                <div
                  style={{ width: `${aggregatedStats.passRate}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${aggregatedStats.failRate}%` }}
                  className="bg-rose-500 h-full transition-all duration-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>Passed</span>
                    <span className="font-mono tabular-nums">{aggregatedStats.passRate}%</span>
                  </div>
                  <div className="text-xl font-black text-emerald-900 dark:text-emerald-200 font-mono tabular-nums mt-1">
                    {aggregatedStats.passedStudents}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900">
                  <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                    <span>Failed</span>
                    <span className="font-mono tabular-nums">{aggregatedStats.failRate}%</span>
                  </div>
                  <div className="text-xl font-black text-rose-900 dark:text-rose-200 font-mono tabular-nums mt-1">
                    {aggregatedStats.failedStudents}
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 High Achievers */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Top 3 High Achievers
                </h3>
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="space-y-2">
                {aggregatedStats.topThree.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{st.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {st.className} · Grade {st.grade}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        {st.percentage}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {st.totalMarks} marks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Class Performance & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Class-wise Performance Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Class-wise Academic Performance
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Summary across all configured school classes
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('results')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Edit in Spreadsheet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Class</th>
                      <th className="py-2.5 px-4 text-center">Students</th>
                      <th className="py-2.5 px-4 text-center">Passed</th>
                      <th className="py-2.5 px-4 text-center">Failed</th>
                      <th className="py-2.5 px-4 text-right">Highest %</th>
                      <th className="py-2.5 px-4 text-right">Average %</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {aggregatedStats.classStatsList.map((cls) => (
                      <tr key={cls.classId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cls.className}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {cls.total}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                          {cls.passed}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-rose-700 dark:text-rose-400 font-bold">
                          {cls.failed}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
                          {cls.highestPct > 0 ? `${cls.highestPct}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {cls.avgPct > 0 ? `${cls.avgPct}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onNavigate('results')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-colors cursor-pointer"
                          >
                            Spreadsheet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activities & System History */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recent Result Activity & Audit History
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Verified logs</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {db.activityLogs && db.activityLogs.length > 0 ? (
                  db.activityLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-xs text-slate-400 text-center">No recent activity logs recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
