import * as XLSX from 'xlsx';
import {
  CalculatedStudentResult,
  ClassDefinition,
  Examination,
  SchoolProfile,
  Subject,
} from '../types';

export interface ExcelExportOptions {
  schoolProfile: SchoolProfile;
  selectedClass: ClassDefinition;
  examination: Examination;
  academicYear: string;
  subjects: Subject[];
  calculatedResults: CalculatedStudentResult[];
}

export function exportResultSheetToExcel({
  schoolProfile,
  selectedClass,
  examination,
  academicYear,
  subjects,
  calculatedResults,
}: ExcelExportOptions): void {
  const activeStudents = calculatedResults.filter(
    (st) => st.name && st.name.trim().length > 0
  );

  const wb = XLSX.utils.book_new();

  // Create sheet rows
  const sheetData: any[][] = [];

  // Row 1: School Title
  sheetData.push([schoolProfile.name]);
  // Row 2: School Subtitle / Location
  sheetData.push([`${schoolProfile.subtitle || 'Centre of Academic Excellence'} — ${schoolProfile.location}`]);
  // Row 3: Examination & Session Information
  sheetData.push([
    `Examination: ${examination.name}`,
    '',
    `Academic Session: ${academicYear}`,
    '',
    `Class: ${selectedClass.name} ${selectedClass.section ? `(${selectedClass.section})` : ''}`,
  ]);
  // Row 4: Blank separator
  sheetData.push([]);

  // Row 5: Table Header
  const headers: string[] = [
    'No.',
    'Student Name',
    'Father Name',
    ...subjects.map((s) => `${s.name} (${s.maxMarks})`),
    'Total Obtained',
    'Max Marks',
    'Percentage (%)',
    'Grade',
    'Position',
    'Status',
  ];
  sheetData.push(headers);

  // Rows 6+: Student Data
  activeStudents.forEach((student) => {
    const row: any[] = [
      student.number,
      student.name,
      student.fatherName || '',
    ];

    // Subject marks
    subjects.forEach((s) => {
      const mark = student.marks[s.id];
      row.push(mark !== null && mark !== undefined ? mark : '-');
    });

    row.push(
      student.totalMarks,
      student.maxMarksTotal,
      `${student.percentage.toFixed(2)}%`,
      student.grade,
      student.position > 0 ? `${student.position}` : '-',
      student.passed ? 'PASSED' : 'PROMOTED / FAILED'
    );

    sheetData.push(row);
  });

  // Summary Row
  sheetData.push([]);
  const totalCount = activeStudents.length;
  const passedCount = activeStudents.filter((s) => s.passed).length;
  const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : '0';

  sheetData.push(['SUMMARY STATISTICS']);
  sheetData.push(['Total Enrolled Students', totalCount]);
  sheetData.push(['Passed Students', passedCount]);
  sheetData.push(['Failed / Re-appear', totalCount - passedCount]);
  sheetData.push(['Overall Pass Rate', `${passRate}%`]);

  // Build worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths for readability
  const colWidths: { wch: number }[] = [
    { wch: 6 }, // No
    { wch: 24 }, // Student Name
    { wch: 22 }, // Father Name
    ...subjects.map(() => ({ wch: 14 })), // Each Subject
    { wch: 14 }, // Total Obtained
    { wch: 12 }, // Max Marks
    { wch: 14 }, // Percentage
    { wch: 8 }, // Grade
    { wch: 10 }, // Position
    { wch: 18 }, // Status
  ];
  ws['!cols'] = colWidths;

  // Add sheet to workbook
  const safeClassName = selectedClass.name.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, safeClassName || 'Result_Sheet');

  // Trigger download
  const safeFilename = `TAIBAH_${safeClassName}_${examination.name.replace(/[^a-zA-Z0-9]/g, '_')}_Result.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}
