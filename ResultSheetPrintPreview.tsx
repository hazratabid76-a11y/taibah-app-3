import React, { useRef, useState } from 'react';
import { Printer, Download, X, FileText, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import {
  CalculatedStudentResult,
  ClassDefinition,
  Examination,
  PrincipalProfile,
  SchoolProfile,
  Subject,
} from '../../types';
import { exportElementToPdf, printIsolatedDocument } from '../../utils/documentExporter';
import { exportResultSheetToExcel } from '../../utils/excelExporter';

interface ResultSheetPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  schoolProfile: SchoolProfile;
  principalProfile: PrincipalProfile;
  selectedClass: ClassDefinition;
  examination: Examination;
  academicYear: string;
  subjects: Subject[];
  calculatedResults: CalculatedStudentResult[];
}

export const ResultSheetPrintPreview: React.FC<ResultSheetPrintPreviewProps> = ({
  isOpen,
  onClose,
  schoolProfile,
  principalProfile,
  selectedClass,
  examination,
  academicYear,
  subjects,
  calculatedResults,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Only take students who have an actual name or record
  const activeStudents = calculatedResults.filter((st) => st.name && st.name.trim().length > 0);

  // EXACT 50-STUDENT REQUIREMENT: Split into chunks of 50 students per page
  const STUDENTS_PER_PAGE = 50;
  const pages: CalculatedStudentResult[][] = [];
  if (activeStudents.length === 0) {
    pages.push([]);
  } else {
    for (let i = 0; i < activeStudents.length; i += STUDENTS_PER_PAGE) {
      pages.push(activeStudents.slice(i, i + STUDENTS_PER_PAGE));
    }
  }

  // Top 3 achievers for the final page footer
  const sortedByMarks = [...activeStudents].sort((a, b) => b.totalMarks - a.totalMarks);
  const top1 = sortedByMarks[0] || null;
  const top2 = sortedByMarks[1] || null;
  const top3 = sortedByMarks[2] || null;

  // Direct Print using isolated container
  const handlePrint = () => {
    if (!printContainerRef.current) return;
    printIsolatedDocument(printContainerRef.current);
  };

  // Export to Excel (.xlsx) workbook
  const handleExportExcel = async () => {
    try {
      const result = await exportResultSheetToExcel({
        schoolProfile,
        selectedClass,
        examination,
        academicYear,
        subjects,
        calculatedResults,
      });
      if (result.success) {
        setFeedback({ type: 'success', message: 'Excel (.xlsx) spreadsheet exported successfully!' });
        setTimeout(() => setFeedback(null), 3500);
      } else if (result.error && result.error !== 'Save was cancelled.') {
        setFeedback({ type: 'error', message: result.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to export Excel file.' });
    }
  };

  // Direct Export to PDF via universal exporter (Scale 3 for 4K crisp output)
  const handleExportPDF = async () => {
    if (!printContainerRef.current) return;
    setIsExporting(true);
    setFeedback(null);

    const pageElements = Array.from(
      printContainerRef.current.querySelectorAll<HTMLElement>('.printable-a4-page')
    );

    const fileName = `TAIBAH_ResultSheet_${selectedClass.name.replace(/\s+/g, '_')}_${examination.name.replace(/\s+/g, '_')}`;

    const result = await exportElementToPdf(pageElements, {
      filename: fileName,
      orientation: orientation,
      format: 'a4',
      scale: 3,
    });

    setIsExporting(false);
    if (result.success) {
      setFeedback({ type: 'success', message: 'PDF downloaded and saved successfully!' });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to export PDF.' });
    }
  };

  // Determine row height styling depending on count on the page
  const getDynamicRowStyles = (pageStudentCount: number) => {
    if (pageStudentCount > 35) {
      // 36 to 50 students on a page: ultra-compact layout
      return {
        tableFontSize: 'text-[8px]',
        cellPadding: 'py-[1.5px] px-1',
        headerPadding: 'py-1 px-1',
        headerFontSize: 'text-[8.5px]',
      };
    } else if (pageStudentCount > 20) {
      // 21 to 35 students: medium compact
      return {
        tableFontSize: 'text-[9px]',
        cellPadding: 'py-1 px-1.5',
        headerPadding: 'py-1 px-1.5',
        headerFontSize: 'text-[9px]',
      };
    } else {
      // 1 to 20 students: spacious
      return {
        tableFontSize: 'text-[10px]',
        cellPadding: 'py-1.5 px-2',
        headerPadding: 'py-1.5 px-2',
        headerFontSize: 'text-[10px]',
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 backdrop-blur-xs">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              A4 Result Sheet Print & PDF Preview — {selectedClass.name}
            </h3>
            <p className="text-[10px] text-slate-500">
              {activeStudents.length} Students · {pages.length} Page{pages.length > 1 ? 's' : ''} (fits up to 50 students per A4 page)
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border font-medium ${
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

        <div className="flex items-center gap-3">
          {/* Orientation switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                orientation === 'portrait' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Portrait (A4)
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                orientation === 'landscape' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Landscape
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-4 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Export genuine editable Excel workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>{isExporting ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Now</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-200/80 flex flex-col items-center gap-8">
        <div ref={printContainerRef} className="space-y-8 print:space-y-0">
          {pages.map((pageStudents, pageIndex) => {
            const isFinalPage = pageIndex === pages.length - 1;
            const dynamicStyles = getDynamicRowStyles(pageStudents.length);

            return (
              <div
                key={pageIndex}
                className={`printable-a4-page bg-white shadow-xl text-slate-900 border border-slate-300 print:border-none print:shadow-none print:p-0 flex flex-col justify-between overflow-hidden relative ${
                  orientation === 'portrait'
                    ? 'w-[210mm] min-h-[297mm] p-[8mm_6mm_8mm_6mm]'
                    : 'w-[297mm] min-h-[210mm] p-[8mm_8mm_8mm_8mm]'
                } ${pageIndex < pages.length - 1 ? 'page-break-after' : ''}`}
                style={{ boxSizing: 'border-box' }}
              >
                {/* 1. Header (School logo, name, examination details) */}
                <div className="border-b-2 border-slate-900 pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    {/* Official School Logo */}
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1">
                      <img
                        src={schoolProfile.logoUrl}
                        alt="Official Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* School Identity */}
                    <div className="text-center flex-1 px-2">
                      <h1 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight uppercase leading-tight font-serif">
                        {schoolProfile.name}
                      </h1>
                      <div className="text-[11px] font-bold text-blue-900 uppercase tracking-widest mt-0.5">
                        {schoolProfile.location}
                      </div>
                      <div className="text-[10px] text-slate-600 italic">
                        {schoolProfile.subtitle}
                      </div>
                      <div className="inline-block mt-1 px-3 py-0.5 bg-slate-100 rounded text-[11px] font-bold uppercase tracking-wider text-slate-900 border border-slate-300">
                        OFFICIAL TABULATION SHEET / RESULT REGISTER
                      </div>
                    </div>

                    {/* Right Info Box */}
                    <div className="w-24 text-right text-[10px] text-slate-600 space-y-0.5">
                      <div>Date: <span className="font-mono font-semibold">{new Date().toLocaleDateString('en-GB')}</span></div>
                      <div>Affiliation: <span className="font-semibold">{schoolProfile.affiliationNumber || 'BISE-BJR'}</span></div>
                      <div>Page: <span className="font-mono font-bold">{pageIndex + 1} of {pages.length}</span></div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-1.5 border-t border-slate-200 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 font-medium">Class: </span>
                      <span className="font-bold text-slate-900">{selectedClass.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Section: </span>
                      <span className="font-bold text-slate-900">{selectedClass.section || 'A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Examination: </span>
                      <span className="font-bold text-slate-900">{examination.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Academic Year: </span>
                      <span className="font-bold text-slate-900">{academicYear}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Result Table (Fits up to 50 students with exact visibility) */}
                <div className="flex-1 overflow-hidden">
                  <table className={`w-full border-collapse border border-slate-400 ${dynamicStyles.tableFontSize}`}>
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                        <th className={`border border-slate-400 ${dynamicStyles.headerPadding} text-center w-8`}>
                          No.
                        </th>
                        <th className={`border border-slate-400 ${dynamicStyles.headerPadding} text-left`}>
                          Student Name
                        </th>
                        {subjects.map((sub) => (
                          <th
                            key={sub.id}
                            className={`border border-slate-400 ${dynamicStyles.headerPadding} text-center font-bold`}
                            title={`${sub.name} (Max: ${sub.maxMarks})`}
                          >
                            <div className="truncate max-w-[65px] mx-auto">{sub.code || sub.name}</div>
                            <div className="text-[7.5px] font-normal text-slate-500">
                              ({sub.maxMarks})
                            </div>
                          </th>
                        ))}
                        <th className={`border border-slate-400 ${dynamicStyles.headerPadding} text-center font-bold bg-slate-200/60 w-12`}>
                          Total
                        </th>
                        <th className={`border border-slate-400 ${dynamicStyles.headerPadding} text-center font-bold w-10`}>
                          %
                        </th>
                        <th className={`border border-slate-400 ${dynamicStyles.headerPadding} text-center font-bold w-8`}>
                          Grd
                        </th>
                        <th className={`border border-slate-400 ${dynamicStyles.headerPadding} text-center font-bold bg-amber-50/70 w-8`}>
                          Pos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={subjects.length + 5}
                            className="py-8 text-center text-slate-400 italic"
                          >
                            No students registered for this class.
                          </td>
                        </tr>
                      ) : (
                        pageStudents.map((st, sIdx) => (
                          <tr
                            key={st.number}
                            className={`border-b border-slate-300 ${
                              sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                            }`}
                          >
                            <td className={`border border-slate-300 ${dynamicStyles.cellPadding} text-center font-mono font-medium text-slate-700`}>
                              {st.number}
                            </td>
                            <td className={`border border-slate-300 ${dynamicStyles.cellPadding} font-semibold text-slate-900 truncate max-w-[140px]`}>
                              {st.name}
                            </td>
                            {subjects.map((sub) => {
                              const mark = st.marks[sub.id];
                              const isFail = typeof mark === 'number' && mark < sub.passMarks;
                              return (
                                <td
                                  key={sub.id}
                                  className={`border border-slate-300 ${dynamicStyles.cellPadding} text-center font-mono tabular-nums ${
                                    isFail ? 'text-rose-600 font-bold bg-rose-50/40' : 'text-slate-800'
                                  }`}
                                >
                                  {typeof mark === 'number' ? mark : '—'}
                                </td>
                              );
                            })}
                            <td className={`border border-slate-300 ${dynamicStyles.cellPadding} text-center font-mono font-bold text-slate-950 bg-slate-100/50`}>
                              {st.totalMarks}
                            </td>
                            <td className={`border border-slate-300 ${dynamicStyles.cellPadding} text-center font-mono tabular-nums text-slate-800`}>
                              {st.percentage}%
                            </td>
                            <td className={`border border-slate-300 ${dynamicStyles.cellPadding} text-center font-bold ${
                              st.grade === 'F' ? 'text-rose-600' : 'text-slate-900'
                            }`}>
                              {st.grade}
                            </td>
                            <td className={`border border-slate-300 ${dynamicStyles.cellPadding} text-center font-bold bg-amber-50/60 text-slate-950 font-mono`}>
                              {st.position > 0 ? st.position : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Final Page Footer (ONLY on final result page as required!) */}
                {isFinalPage ? (
                  <div className="mt-3 pt-2 border-t-2 border-slate-900">
                    <div className="grid grid-cols-2 gap-4 items-end">
                      {/* Top 3 Summary */}
                      <div className="border border-slate-300 bg-slate-50 p-2 rounded text-[9.5px]">
                        <div className="font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1">
                          Class High Achievers (Top 3)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="font-bold text-amber-700">1st: </span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {top1 ? `${top1.name} (${top1.percentage}%)` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">2nd: </span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {top2 ? `${top2.name} (${top2.percentage}%)` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-amber-800">3rd: </span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {top3 ? `${top3.name} (${top3.percentage}%)` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Principal Signature & Stamp */}
                      <div className="flex items-end justify-end gap-6 text-[10px]">
                        <div className="text-center">
                          <div className="w-28 border-b border-slate-800 pb-1 font-semibold text-slate-700">
                            Exam Incharge
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Signature</div>
                        </div>

                        <div className="text-center">
                          {/* Automatic Principal Signature image if uploaded */}
                          <div className="h-10 flex items-center justify-center">
                            {principalProfile.signatureUrl ? (
                              <img
                                src={principalProfile.signatureUrl}
                                alt="Principal Signature"
                                className="max-h-full max-w-[120px] object-contain"
                              />
                            ) : (
                              <div className="w-28 h-6" />
                            )}
                          </div>
                          <div className="w-36 border-b border-slate-800 pb-0.5 font-bold text-slate-900">
                            {principalProfile.name}
                          </div>
                          <div className="text-[9px] text-slate-600 font-medium mt-0.5">
                            {principalProfile.title || 'Principal Signature & Stamp'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Subsequent page footer - minimal */
                  <div className="mt-2 pt-1 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
                    <span>TAIBAH International School and College — Tabulation Register Continued...</span>
                    <span>Page {pageIndex + 1} of {pages.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
