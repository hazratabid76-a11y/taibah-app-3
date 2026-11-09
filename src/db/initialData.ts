import { AppDatabase, CardCustomDesign, ClassDefinition, Examination, GradeRule, Subject } from '../types';

export const OFFICIAL_LOGO_URL = '/assets/school-logo.jpg';
export const DEVELOPER_PHOTO_URL = '/assets/developer-photo.jpg';
export const APP_ICON_URL = '/assets/app-icon.png';

export const DEFAULT_CLASSES: ClassDefinition[] = [
  { id: 'class-kg', name: 'KG', order: 1 },
  { id: 'class-1', name: 'Class 1', order: 2 },
  { id: 'class-2', name: 'Class 2', order: 3 },
  { id: 'class-3', name: 'Class 3', order: 4 },
  { id: 'class-4', name: 'Class 4', order: 5 },
  { id: 'class-5', name: 'Class 5', order: 6 },
  { id: 'class-6', name: 'Class 6', order: 7 },
  { id: 'class-7', name: 'Class 7', order: 8 },
  { id: 'class-8', name: 'Class 8', order: 9 },
  { id: 'class-9', name: 'Class 9', order: 10 },
  { id: 'class-10', name: 'Class 10', order: 11 },
  { id: 'class-11', name: 'Class 11', order: 12 },
  { id: 'class-12', name: 'Class 12', order: 13 },
];

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-eng', name: 'English', code: 'ENG', maxMarks: 100, passMarks: 33 },
  { id: 'sub-urdu', name: 'Urdu', code: 'URD', maxMarks: 100, passMarks: 33 },
  { id: 'sub-math', name: 'Mathematics', code: 'MTH', maxMarks: 100, passMarks: 33 },
  { id: 'sub-isl', name: 'Islamiat', code: 'ISL', maxMarks: 100, passMarks: 33 },
  { id: 'sub-gsci', name: 'General Science', code: 'SCI', maxMarks: 100, passMarks: 33 },
  { id: 'sub-pak', name: 'Pakistan Studies', code: 'PST', maxMarks: 100, passMarks: 33 },
];

export const DEFAULT_EXAMINATIONS: Examination[] = [
  { id: 'exam-annual-2026', name: 'Annual Examination', academicYear: '2025-2026' },
  { id: 'exam-final-2026', name: 'Final Term Examination', academicYear: '2025-2026' },
  { id: 'exam-mid-2026', name: 'Mid Term Examination', academicYear: '2025-2026' },
  { id: 'exam-first-2026', name: 'First Term Examination', academicYear: '2025-2026' },
];

export const DEFAULT_GRADE_RULES: GradeRule[] = [
  { grade: 'A+', minPercentage: 80, maxPercentage: 100, gpa: 4.0, remarks: 'Outstanding' },
  { grade: 'A', minPercentage: 70, maxPercentage: 79.99, gpa: 3.7, remarks: 'Excellent' },
  { grade: 'B', minPercentage: 60, maxPercentage: 69.99, gpa: 3.0, remarks: 'Very Good' },
  { grade: 'C', minPercentage: 50, maxPercentage: 59.99, gpa: 2.0, remarks: 'Good' },
  { grade: 'D', minPercentage: 40, maxPercentage: 49.99, gpa: 1.0, remarks: 'Fair' },
  { grade: 'E', minPercentage: 33, maxPercentage: 39.99, gpa: 0.5, remarks: 'Satisfactory' },
  { grade: 'F', minPercentage: 0, maxPercentage: 32.99, gpa: 0.0, remarks: 'Fail' },
];

export const DEFAULT_CARD_SETTINGS: CardCustomDesign = {
  template: 'royal-blue',
  orientation: 'portrait',
  primaryColor: '#1d4ed8',
  secondaryColor: '#059669',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  fontFamily: 'Plus Jakarta Sans',
  fontSizeScale: 1.0,
  cardTitle: 'STUDENT IDENTITY CARD',
  titleColor: '#ffffff',
  titleSize: 11,
  borderRadius: 8,
  borderStyle: 'none',
  borderColor: '#cbd5e1',
  customLogoUrl: OFFICIAL_LOGO_URL,
  showLogo: true,
  showSchoolName: true,
  showLocation: true,
  showPhoto: true,
  showStudentName: true,
  showFatherName: true,
  showClass: true,
  showStudentNumber: true,
  showDob: true,
  showStudentPhone: true,
  showAcademicYear: true,
  showValidityDate: true,
  showSignature: true,
  showEmergencyContact: false,
  showBarcode: false,
  showSchoolContact: true,
  backTitle: 'STUDENT CARD POLICY & EMERGENCY CONTACTS',
  backTitleFontSize: 7.5,
  backTitleAlign: 'left',
  instructions: '1. This identity card is the official property of TAIBAH International School & College.\n2. Card must be carried and displayed by the student at all times during school hours.\n3. In case of emergency or loss of this card, please inform the school administration immediately.\n4. Misuse of this card is strictly prohibited.',
  instructionsFontSize: 6.8,
  instructionsAlign: 'left',
  emergencyContactText: '+92 300 0000000',
  parentContactText: 'Available on verified record',
  schoolContactText: 'Main Campus, District Bajaur, KP | info@taibahbajaur.edu.pk',
  additionalCustomText: 'Authorized by School Administration - Bajaur, Pakistan',
  showBackLogo: true,
  showBackSignature: true,
  showBackAddress: true,
  showBackEmergency: true,
  showBackParentContact: true,
  showBackRules: true,
  showBackQrCode: true,
  backCustomElements: [],
  qrContentType: 'all',
  qrPlacementSide: 'back',
  qrPosition: 'bottom-right',
  logoPosition: 'top-left',
  signaturePosition: 'bottom-right',
  photoPosition: 'left',
};

export function createEmptyStudentRows(count: number = 100) {
  const rows = [];
  for (let i = 1; i <= count; i++) {
    rows.push({
      number: i,
      name: '',
      fatherName: '',
      dateOfBirth: '',
      phone: '',
      photoUrl: '',
      marks: {},
    });
  }
  return rows;
}

export const DEFAULT_SECTIONS = ['A', 'B', 'C', 'Blue', 'Red', 'Science', 'Arts', 'Morning', 'Evening'];

export const INITIAL_DATABASE: AppDatabase = {
  version: 2,
  schoolProfile: {
    name: 'TAIBAH INTERNATIONAL SCHOOL AND COLLEGE',
    subtitle: 'Centre of Academic Excellence & Character Building',
    location: 'Bajaur, Pakistan',
    address: 'Main Campus, District Bajaur, Khyber Pakhtunkhwa, Pakistan',
    phone: '+92 300 0000000',
    email: 'info@taibahbajaur.edu.pk',
    logoUrl: OFFICIAL_LOGO_URL,
    established: '2016',
    affiliationNumber: 'BISE-BJR-4029',
  },
  principalProfile: {
    name: 'Muhammad Ismail Khan',
    title: 'Principal & Executive Director',
    description: 'Committed to fostering academic excellence, moral integrity, and modern educational standards for all students at TAIBAH International School and College.',
    photoUrl: '',
    signatureUrl: '',
    stampUrl: '',
  },
  academicYears: ['2025-2026', '2026-2027'],
  currentAcademicYear: '2025-2026',
  examinations: DEFAULT_EXAMINATIONS,
  currentExamId: 'exam-annual-2026',
  classes: DEFAULT_CLASSES,
  sections: DEFAULT_SECTIONS,
  subjects: DEFAULT_SUBJECTS,
  gradeRules: DEFAULT_GRADE_RULES,
  results: {},
  studentPersonalRecords: {},
  savedStudentCards: {},
  cardSettings: DEFAULT_CARD_SETTINGS,
  dmcTemplate: 'classic-blue',
  themeMode: 'light',
  activityLogs: [
    {
      id: 'log-init',
      timestamp: Date.now() - 3600000,
      action: 'System Initialized',
      category: 'settings',
      details: 'TAIBAH School Management System ready for operations.',
    },
  ],
};
