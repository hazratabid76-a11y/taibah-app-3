import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  Image,
  Award,
  Users,
  CheckSquare,
  Square,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  User,
  Calendar,
  Phone,
  MapPin,
  Upload,
} from 'lucide-react';
import {
  AppDatabase,
  CalculatedStudentResult,
  DMCTemplateId,
  StudentPersonalRecord,
  StudentRow,
  Subject,
} from '../../types';
import { DatabaseService, calculateResults } from '../../db/storage';
import { exportElementToPdf, exportElementToPng, printIsolatedDocument } from '../../utils/documentExporter';

interface DMCGeneratorProps {
  db: AppDatabase;
  onUpdateDb: (db: AppDatabase) => void;
}

export const DMCGenerator: React.FC<DMCGeneratorProps> = ({
  db,
  onUpdateDb,
}) => {
  const dbService = useMemo(() => DatabaseService.getInstance(), []);

  // Filter selections
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    db.currentAcademicYear || db.academicYears[0] || '2025-2026'
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    db.currentExamId || db.examinations[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    db.classes[0]?.id || 'class-kg'
  );
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<number>(1);

  // Template selection
  const [dmcTemplate, setDmcTemplate] = useState<DMCTemplateId>(
    db.dmcTemplate || 'classic-blue'
  );

  // Batch selection mode
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedStudentNumbers, setSelectedStudentNumbers] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Student Personal Info Form State
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const dmcContainerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const selectedClass = useMemo(
    () => db.classes.find((c) => c.id === selectedClassId) || db.classes[0],
    [db.classes, selectedClassId]
  );

  const selectedExam = useMemo(
    () => db.examinations.find((e) => e.id === selectedExamId) || db.examinations[0],
    [db.examinations, selectedExamId]
  );

  // Active subjects for class
  const activeSubjects: Subject[] = useMemo(() => {
    if (selectedClass?.subjects && selectedClass.subjects.length > 0) {
      return db.subjects.filter((s) => selectedClass.subjects?.includes(s.id));
    }
    return db.subjects;
  }, [db.subjects, selectedClass]);

  // Load student rows for selected class & exam from saved spreadsheet
  const studentRows = useMemo(() => {
    return dbService.getStudentRowsForClass(selectedClassId, selectedExamId);
  }, [dbService, selectedClassId, selectedExamId, db.results]);

  // Calculated results from the real saved records
  const calculatedResults: CalculatedStudentResult[] = useMemo(() => {
    return calculateResults(studentRows, activeSubjects, db.gradeRules);
  }, [studentRows, activeSubjects, db.gradeRules]);

  // List of active students (who have names in Result Generation)
  const activeStudents = useMemo(() => {
    return calculatedResults.filter((st) => st.name && st.name.trim().length > 0);
  }, [calculatedResults]);

  // Current single student
  const currentStudent = useMemo(() => {
    return (
      activeStudents.find((st) => st.number === selectedStudentNumber) ||
      activeStudents[0] ||
      null
    );
  }, [activeStudents, selectedStudentNumber]);

  // Synchronize form when selected student changes
  useEffect(() => {
    if (currentStudent) {
      const personal = dbService.getPersonalRecord(selectedClassId, currentStudent.number);
      if (personal) {
        setFatherName(personal.fatherName || '');
        setDob(personal.dateOfBirth || '');
        setPhone(personal.phone || '');
        setGender(personal.gender || 'Male');
        setAddress(personal.address || '');
      } else {
        setFatherName(currentStudent.fatherName || '');
        setDob(currentStudent.dateOfBirth || '');
        setPhone(currentStudent.phone || '');
        setGender('Male');
        setAddress('');
      }
    }
  }, [currentStudent, selectedClassId, dbService]);

  // Save personal student info without touching examination marks
  const handleSavePersonalInfo = () => {
    if (!currentStudent) return;
    const key = `${selectedClassId}_${currentStudent.number}`;
    const personalRecord: StudentPersonalRecord = {
      id: key,
      studentNumber: currentStudent.number,
      classId: selectedClassId,
      studentName: currentStudent.name,
      fatherName: fatherName.trim(),
      dateOfBirth: dob.trim(),
      phone: phone.trim(),
      gender,
      address: address.trim(),
      academicYear: selectedAcademicYear,
      photoUrl: currentStudent.photoUrl || '',
    };

    dbService.savePersonalRecord(personalRecord);
    const freshDb = dbService.getDatabase();
    onUpdateDb(freshDb);

    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  // Select all or deselect all for batch
  const toggleSelectAll = () => {
    if (selectedStudentNumbers.length === activeStudents.length) {
      setSelectedStudentNumbers([]);
    } else {
      setSelectedStudentNumbers(activeStudents.map((s) => s.number));
    }
  };

  const toggleSelectStudent = (num: number) => {
    if (selectedStudentNumbers.includes(num)) {
      setSelectedStudentNumbers(selectedStudentNumbers.filter((n) => n !== num));
    } else {
      setSelectedStudentNumbers([...selectedStudentNumbers, num]);
    }
  };

  // Direct Print
  const handlePrint = () => {
    if (!dmcContainerRef.current) return;
    printIsolatedDocument(dmcContainerRef.current);
  };

  // Single or Batch PDF Export
  const handleExportPDF = async () => {
    if (!dmcContainerRef.current) return;
    setIsExporting(true);
    setFeedback(null);

    const certElements = Array.from(
      dmcContainerRef.current.querySelectorAll<HTMLElement>('.dmc-certificate-sheet')
    );

    const fileName = isBatchMode
      ? `TAIBAH_Batch_DMC_${selectedClass.name.replace(/\s+/g, '_')}_${selectedExam.name.replace(/\s+/g, '_')}`
      : `TAIBAH_DMC_${currentStudent?.name.replace(/\s+/g, '_') || 'Student'}_Roll_${currentStudent?.number}`;

    const result = await exportElementToPdf(certElements, {
      filename: fileName,
      orientation: 'portrait',
      format: 'a4',
      scale: 2,
    });

    setIsExporting(false);
    if (result.success) {
      setFeedback({ type: 'success', message: 'DMC PDF exported and downloaded successfully!' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to export PDF.' });
    }
  };

  // PNG Export
  const handleExportPNG = async () => {
    if (!dmcContainerRef.current) return;
    const certEl = dmcContainerRef.current.querySelector<HTMLElement>('.dmc-certificate-sheet');
    if (!certEl) return;

    setIsExporting(true);
    setFeedback(null);

    const fileName = `TAIBAH_DMC_${currentStudent?.name.replace(/\s+/g, '_') || 'Student'}_Roll_${currentStudent?.number}`;
    const result = await exportElementToPng(certEl, fileName);

    setIsExporting(false);
    if (result.success) {
      setFeedback({ type: 'success', message: 'DMC image downloaded successfully!' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to export image.' });
    }
  };

  // Determine which students to render
  const studentsToRender: CalculatedStudentResult[] = isBatchMode
    ? activeStudents.filter((s) => selectedStudentNumbers.includes(s.number))
    : currentStudent
    ? [currentStudent]
    : [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden">
      {/* Top Filter and Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Session Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Session:</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none"
            >
              {db.academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector (e.g. KG, Class 1-12) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudentNumbers([]);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none"
            >
              {db.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none"
            >
              {db.examinations.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>

          {/* Template Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Template:</span>
            <select
              value={dmcTemplate}
              onChange={(e) => setDmcTemplate(e.target.value as DMCTemplateId)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-blue-700 outline-none"
            >
              <option value="classic-blue">1. Classic Blue Academic</option>
              <option value="modern-white">2. Modern White & Blue</option>
              <option value="premium-formal">3. Premium Formal (Regal)</option>
              <option value="elegant-minimal">4. Elegant Minimal</option>
              <option value="college-style">5. Professional College Style</option>
            </select>
          </div>

          {/* Mode Switch: Single vs Batch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
            <button
              onClick={() => setIsBatchMode(false)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                !isBatchMode ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Single DMC
            </button>
            <button
              onClick={() => {
                setIsBatchMode(true);
                if (selectedStudentNumbers.length === 0) {
                  setSelectedStudentNumbers(activeStudents.map((s) => s.number));
                }
              }}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                isBatchMode ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Batch DMC
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`hidden xl:flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPNG}
            disabled={isExporting || studentsToRender.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            title="Download high-resolution image"
          >
            <Image className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting || studentsToRender.length === 0}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isExporting ? 'Generating...' : isBatchMode ? `PDF (${studentsToRender.length})` : 'Export PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={studentsToRender.length === 0}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print DMC</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Student Selection & Editable Personal Information Form */}
        <div className="no-print w-80 bg-white border-r border-slate-200 flex flex-col p-4 shrink-0 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Student from Result Records:
            </label>
            <select
              value={selectedStudentNumber}
              onChange={(e) => setSelectedStudentNumber(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-semibold text-slate-900 outline-none"
            >
              {activeStudents.map((st) => (
                <option key={st.number} value={st.number}>
                  No. {st.number} — {st.name} ({st.percentage}%)
                </option>
              ))}
            </select>
          </div>

          {currentStudent ? (
            /* Editable Student Personal Information Form (Requirement 7) */
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student Credentials</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Roll #{currentStudent.number}</span>
              </div>

              {/* Readonly verified student name from result records */}
              <div>
                <label className="block text-slate-500 font-semibold mb-0.5">Student Name (Auto-retrieved)</label>
                <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-900">
                  {currentStudent.name}
                </div>
              </div>

              {/* Father Name (Editable Input) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-0.5">Father's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ismail"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Phone & Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-0.5">Contact Phone</label>
                <input
                  type="text"
                  placeholder="0300-0000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-0.5">Residential Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Village / Town, Bajaur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs outline-none"
                />
              </div>

              <button
                onClick={handleSavePersonalInfo}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavedFeedback ? 'Saved!' : 'Save Student Info'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No students found in {selectedClass.name}. Enter results in spreadsheet first.
            </div>
          )}

          {/* Batch Selector if active */}
          {isBatchMode && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Batch Select ({selectedStudentNumbers.length}/{activeStudents.length})</span>
                <button
                  onClick={toggleSelectAll}
                  className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  {selectedStudentNumbers.length === activeStudents.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {activeStudents.map((st) => (
                  <div
                    key={st.number}
                    onClick={() => toggleSelectStudent(st.number)}
                    className="p-1.5 px-2 flex items-center gap-2 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    {selectedStudentNumbers.includes(st.number) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate flex-1 font-medium text-slate-800">
                      {st.number}. {st.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: DMC Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200/90 flex flex-col items-center">
          {activeStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs my-auto max-w-md">
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Student Marks Found for {selectedClass.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please enter student names and examination marks in the Result Generation spreadsheet first.
              </p>
            </div>
          ) : studentsToRender.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center my-auto">
              <p className="text-xs text-slate-500">Please select at least one student from the batch list.</p>
            </div>
          ) : (
            <div ref={dmcContainerRef} className="space-y-8 print:space-y-0">
              {studentsToRender.map((student, idx) => {
                const studentPersonal = db.studentPersonalRecords[`${selectedClassId}_${student.number}`];
                const activeFather = studentPersonal?.fatherName || student.fatherName || fatherName || '—';
                const activeDob = studentPersonal?.dateOfBirth || student.dateOfBirth || dob || '—';

                return (
                  <div
                    key={student.number}
                    className={`dmc-certificate-sheet bg-white text-slate-900 shadow-2xl border border-slate-300 print:border-none print:shadow-none w-[210mm] min-h-[297mm] p-[12mm_12mm_12mm_12mm] flex flex-col justify-between relative overflow-hidden ${
                      idx < studentsToRender.length - 1 ? 'page-break-after' : ''
                    }`}
                    style={{ boxSizing: 'border-box' }}
                  >
                    {/* Template Specific Frame Borders */}
                    {dmcTemplate === 'classic-blue' && (
                      <>
                        <div className="absolute inset-2 border-2 border-slate-900 pointer-events-none" />
                        <div className="absolute inset-3 border border-blue-900 pointer-events-none" />
                      </>
                    )}
                    {dmcTemplate === 'modern-white' && (
                      <div className="absolute inset-3 border-2 border-slate-200 pointer-events-none rounded-xl" />
                    )}
                    {dmcTemplate === 'premium-formal' && (
                      <>
                        <div className="absolute inset-2 border-4 border-amber-600 pointer-events-none" />
                        <div className="absolute inset-3.5 border border-slate-900 pointer-events-none" />
                      </>
                    )}
                    {dmcTemplate === 'college-style' && (
                      <div className="absolute inset-2 border-2 border-blue-950 pointer-events-none" />
                    )}

                    {/* DMC Header Section */}
                    <div className="text-center relative z-10 pt-2 pb-4 border-b-2 border-slate-900">
                      <div className="flex items-center justify-between mb-2 px-2">
                        {/* School Crest */}
                        <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1">
                          <img
                            src={db.schoolProfile.logoUrl}
                            alt="School Crest"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* School Titles */}
                        <div className="flex-1 px-4">
                          <h1 className="text-xl font-extrabold text-slate-950 uppercase tracking-tight font-serif">
                            {db.schoolProfile.name}
                          </h1>
                          <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mt-0.5">
                            {db.schoolProfile.location}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {db.schoolProfile.address}
                          </p>
                          <div className={`mt-2 inline-block px-4 py-1 rounded text-xs font-bold uppercase tracking-widest ${
                            dmcTemplate === 'premium-formal'
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-900 text-white'
                          }`}>
                            DETAILED MARKS CERTIFICATE (DMC)
                          </div>
                        </div>

                        {/* Serial & Session */}
                        <div className="w-24 text-right text-[10.5px] text-slate-600 space-y-0.5">
                          <div className="font-mono text-slate-400">SR: #{student.number.toString().padStart(4, '0')}</div>
                          <div>Date: <span className="font-semibold">{new Date().toLocaleDateString('en-GB')}</span></div>
                          <div>Session: <span className="font-semibold">{selectedAcademicYear}</span></div>
                        </div>
                      </div>

                      {/* Examination Banner */}
                      <div className="bg-slate-100 py-1.5 px-4 rounded border border-slate-300 mt-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Examination: </span>
                          <span className="font-bold text-slate-900">{selectedExam.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Academic Year: </span>
                          <span className="font-bold text-slate-900">{selectedAcademicYear}</span>
                        </div>
                      </div>
                    </div>

                    {/* Student Credentials Box */}
                    <div className="my-4 border border-slate-300 bg-slate-50/80 p-3.5 rounded-lg text-xs">
                      <div className="grid grid-cols-2 gap-y-2 gap-x-6">
                        <div className="flex items-center">
                          <span className="w-28 text-slate-500 font-medium">Student Name:</span>
                          <span className="font-bold text-slate-950 text-sm uppercase">{student.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-28 text-slate-500 font-medium">Student Number:</span>
                          <span className="font-bold font-mono text-slate-900">{student.number}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-28 text-slate-500 font-medium">Father's Name:</span>
                          <span className="font-semibold text-slate-900">{activeFather}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-28 text-slate-500 font-medium">Class / Grade:</span>
                          <span className="font-bold text-blue-900">{selectedClass.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-28 text-slate-500 font-medium">Date of Birth:</span>
                          <span className="font-mono text-slate-900">{activeDob}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-28 text-slate-500 font-medium">Registration No.:</span>
                          <span className="font-mono text-slate-900">TIS-{selectedClass.name.replace(/\s+/g, '')}-{student.number}</span>
                        </div>
                      </div>
                    </div>

                    {/* Academic Performance Table */}
                    <div className="flex-1 my-2">
                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold">
                            <th className="border border-slate-800 py-2 px-3 text-center w-10">Sr.</th>
                            <th className="border border-slate-800 py-2 px-4 text-left">Subject Title</th>
                            <th className="border border-slate-800 py-2 px-3 text-center w-24">Max Marks</th>
                            <th className="border border-slate-800 py-2 px-3 text-center w-24">Pass Marks</th>
                            <th className="border border-slate-800 py-2 px-3 text-center w-28">Obtained Marks</th>
                            <th className="border border-slate-800 py-2 px-3 text-center w-24">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {activeSubjects.map((sub, sIdx) => {
                            const mark = student.marks[sub.id];
                            const hasMark = typeof mark === 'number';
                            const isPass = hasMark && mark >= sub.passMarks;

                            return (
                              <tr key={sub.id} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="border border-slate-300 py-2 px-3 text-center font-mono text-slate-500">
                                  {sIdx + 1}
                                </td>
                                <td className="border border-slate-300 py-2 px-4 font-semibold text-slate-900">
                                  {sub.name}
                                </td>
                                <td className="border border-slate-300 py-2 px-3 text-center font-mono text-slate-700">
                                  {sub.maxMarks}
                                </td>
                                <td className="border border-slate-300 py-2 px-3 text-center font-mono text-slate-500">
                                  {sub.passMarks}
                                </td>
                                <td className={`border border-slate-300 py-2 px-3 text-center font-mono font-bold ${
                                  hasMark ? (isPass ? 'text-slate-950' : 'text-rose-700') : 'text-slate-400'
                                }`}>
                                  {hasMark ? mark : '—'}
                                </td>
                                <td className="border border-slate-300 py-2 px-3 text-center font-medium text-[11px]">
                                  {hasMark ? (
                                    isPass ? (
                                      <span className="text-emerald-700 font-semibold">Passed</span>
                                    ) : (
                                      <span className="text-rose-700 font-semibold">Failed</span>
                                    )
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Summary Aggregate Strip */}
                      <div className="grid grid-cols-4 gap-3 mt-4">
                        <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-center">
                          <div className="text-[10px] text-slate-500 font-medium uppercase">Total Marks</div>
                          <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                            {student.totalMarks} / {student.maxMarksTotal}
                          </div>
                        </div>
                        <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-center">
                          <div className="text-[10px] text-slate-500 font-medium uppercase">Percentage</div>
                          <div className="text-base font-extrabold text-blue-900 font-mono mt-0.5">
                            {student.percentage}%
                          </div>
                        </div>
                        <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-center">
                          <div className="text-[10px] text-slate-500 font-medium uppercase">Grade</div>
                          <div className={`text-base font-extrabold mt-0.5 ${
                            student.grade === 'F' ? 'text-rose-700' : 'text-emerald-700'
                          }`}>
                            {student.grade}
                          </div>
                        </div>
                        <div className="border border-slate-300 p-2.5 rounded bg-amber-50/60 text-center">
                          <div className="text-[10px] text-amber-800 font-medium uppercase">Class Position</div>
                          <div className="text-base font-extrabold text-amber-950 font-mono mt-0.5">
                            {student.position > 0 ? `${student.position}` : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Result Decision Banner */}
                      <div className="mt-3 py-1.5 px-4 bg-slate-100 border border-slate-300 rounded flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-600 font-medium">Final Assessment Result: </span>
                          <span className={`font-extrabold uppercase ${
                            student.passed ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {student.passed ? 'PROMOTED / PASSED' : 'NEEDS IMPROVEMENT / FAILED'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Grading Standard: BISE / FBISE Criterion
                        </div>
                      </div>
                    </div>

                    {/* DMC Footer: Principal Signature & Official Stamp area */}
                    <div className="pt-4 border-t-2 border-slate-900 mt-4">
                      <div className="flex items-end justify-between px-4">
                        {/* Controller of Examinations */}
                        <div className="text-center">
                          <div className="w-36 border-b border-slate-800 pb-1 font-semibold text-slate-700 text-xs">
                            Controller of Exams
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">Verified & Checked By</div>
                        </div>

                        {/* Official Stamp Area */}
                        <div className="text-center">
                          <div className="w-28 h-20 border border-dashed border-slate-400 rounded-lg flex items-center justify-center p-2 text-center text-slate-400 text-[9px] uppercase tracking-wider">
                            Official School Stamp
                          </div>
                        </div>

                        {/* Principal Signature Area (with Automatic Principal Signature insertion if uploaded) */}
                        <div className="text-center">
                          <div className="h-10 flex items-center justify-center">
                            {db.principalProfile.signatureUrl ? (
                              <img
                                src={db.principalProfile.signatureUrl}
                                alt="Principal Signature"
                                className="max-h-full max-w-[140px] object-contain"
                              />
                            ) : (
                              <div className="w-36 h-6" />
                            )}
                          </div>
                          <div className="w-40 border-b border-slate-800 pb-0.5 font-bold text-slate-900 text-xs">
                            {db.principalProfile.name}
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium mt-1">
                            {db.principalProfile.title || 'Principal & Head of Institute'}
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-[9px] text-slate-400 mt-4">
                        Note: This certificate is issued without any alteration or erasure. Errors and omissions excepted (E&OE).
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
