/**
 * Types and Data Contracts for TAIBAH International School & College
 * Platform: Windows Desktop & Web Management Software
 * Developer: Hazrat Abid (Bajaur, Pakistan)
 */

export type NavigationTab = 
  | 'dashboard' 
  | 'results' 
  | 'dmc' 
  | 'cards' 
  | 'settings';

export interface Subject {
  id: string;
  name: string;
  code: string;
  maxMarks: number;
  passMarks: number;
}

export interface ClassDefinition {
  id: string;
  name: string;
  order: number;
  section?: string;
  subjects?: string[]; // IDs of subjects, if class-specific; defaults to all active subjects
}

export interface Examination {
  id: string;
  name: string;
  academicYear: string;
  termDate?: string;
}

export interface StudentRow {
  number: number; // 1 to 100
  name: string;
  fatherName?: string;
  dateOfBirth?: string;
  phone?: string;
  photoUrl?: string;
  marks: Record<string, number | null>; // subjectId -> mark
}

export interface StudentPersonalRecord {
  id: string; // key: `${classId}_${studentNumber}`
  studentNumber: number;
  classId: string;
  studentName: string;
  fatherName: string;
  dateOfBirth?: string;
  phone?: string;
  parentPhone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergencyContact?: string;
  photoUrl?: string;
  section?: string;
  academicYear?: string;
  updatedAt?: number;
}

export interface CalculatedStudentResult {
  number: number;
  name: string;
  fatherName?: string;
  dateOfBirth?: string;
  phone?: string;
  photoUrl?: string;
  marks: Record<string, number | null>;
  totalMarks: number;
  maxMarksTotal: number;
  percentage: number;
  grade: string;
  position: number;
  passed: boolean;
  failedSubjects: string[];
  hasAtLeastOneMark?: boolean;
}

export interface GradeRule {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gpa?: number;
  remarks: string;
}

export interface SchoolProfile {
  name: string;
  subtitle: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  website?: string;
  established?: string;
  affiliationNumber?: string;
}

export interface PrincipalProfile {
  name: string;
  title: string;
  description?: string; // Professional bio/message displayed on Dashboard
  photoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
}

export type DMCTemplateId = 
  | 'classic-blue'
  | 'modern-white'
  | 'premium-formal'
  | 'elegant-minimal'
  | 'college-style';

export type CardTemplateId = 
  | 'royal-blue'
  | 'modern-white-blue'
  | 'classic-identity'
  | 'navy-gold'
  | 'minimal-professional'
  | 'modern-gradient'
  | 'academic-crest'
  | 'premium-college';

export type QrCodeContentType =
  | 'all' // Full card verification details (School, Name, Class, Reg, Year, Emergency)
  | 'student-id' // Student Number + Name + Class
  | 'student-name' // Student Name only
  | 'school-verify' // School verification text
  | 'contact' // Parent / Emergency contact
  | 'custom' // Custom text entered by admin
  | 'vcard' // Digital vCard
  | 'custom-url'; // Custom text / URL

export interface BackCustomElement {
  id: string;
  type?: 'text';
  label?: string;
  text?: string;
  content?: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  offsetX?: number;
  offsetY?: number;
}

export interface CardCustomDesign {
  template: CardTemplateId;
  orientation: 'landscape' | 'portrait';
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSizeScale: number; // 0.85 to 1.25

  // Editable School Name & Location (Not hardcoded)
  customSchoolName?: string;
  customSchoolLocation?: string;
  schoolNameFontSize?: number;
  schoolNameColor?: string;
  studentNameFontSize?: number;
  studentNameColor?: string;

  // Typography & Styling
  cardTitle: string;
  titleColor?: string;
  titleSize?: number;
  borderRadius?: number; // 0 to 20
  borderStyle?: 'none' | 'solid' | 'double' | 'dashed';
  borderColor?: string;

  // Backgrounds & Custom Controls
  frontBgImage?: string;
  backBgImage?: string;
  frontBgFit?: 'cover' | 'contain' | 'fill' | 'center';
  backBgFit?: 'cover' | 'contain' | 'fill' | 'center';
  frontBgOpacity?: number; // 0.05 to 1.0
  backBgOpacity?: number; // 0.05 to 1.0
  customLogoUrl?: string;

  // Photo & Logo Controls
  photoWidth?: number;
  photoHeight?: number;
  photoBorderRadius?: number;
  photoBorderColor?: string;
  photoBlockOffsetX?: number;
  photoBlockOffsetY?: number;
  logoSize?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;

  // Canvas Movable Offsets
  headerOffsetY?: number;
  nameBlockOffsetX?: number;
  nameBlockOffsetY?: number;
  credentialsOffsetX?: number;
  credentialsOffsetY?: number;
  footerOffsetY?: number;
  qrSize?: number;
  qrCodeSize?: number;
  qrOffsetX?: number;
  qrOffsetY?: number;

  // Front Visible Fields (Toggles) - Blood Group completely removed
  showLogo: boolean;
  showSchoolName: boolean;
  showLocation: boolean;
  showPhoto: boolean;
  showStudentName: boolean;
  showFatherName: boolean;
  showClass: boolean;
  showStudentNumber: boolean;
  showDob: boolean;
  showStudentPhone: boolean;
  showAcademicYear: boolean;
  showValidityDate: boolean;
  showSignature: boolean;
  showEmergencyContact: boolean;
  showBarcode?: boolean;
  showSchoolContact?: boolean;

  // Back Side Settings & Comprehensive Editable Text (Requirement 7)
  backTitle: string;
  backTitleFontSize?: number;
  backTitleColor?: string;
  backTitleFontFamily?: string;
  backTitleAlign?: 'left' | 'center' | 'right';

  instructions: string; // School rules or guidelines (fully editable)
  backInstructions?: string;
  instructionsFontSize?: number;
  instructionsColor?: string;
  instructionsFontFamily?: string;
  instructionsAlign?: 'left' | 'center' | 'right' | 'justify';
  signatureLabel?: string;

  emergencyContactText: string;
  parentContactText: string;
  schoolContactText: string;
  additionalCustomText?: string;
  showBackLogo: boolean;
  showBackSignature: boolean;
  showBackAddress: boolean;
  showBackEmergency: boolean;
  showBackParentContact: boolean;
  showBackRules: boolean;
  showBackQrCode: boolean;
  backCustomElements?: BackCustomElement[];

  // QR Code Settings & Upload Management (Requirement 8)
  qrContentType: QrCodeContentType;
  qrCustomText?: string;
  customQrText?: string;
  uploadedQrCodeUrl?: string; // Uploaded custom QR code image
  qrPlacementSide?: 'front' | 'back' | 'both' | 'none'; // Position on front or back side
  qrPosition?: 'bottom-right' | 'bottom-left' | 'center' | 'top-right';

  // Positions
  logoPosition?: 'top-left' | 'top-center' | 'top-right';
  signaturePosition?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  photoPosition?: 'left' | 'right' | 'center';
}

export interface CustomTemplatePreset {
  id: string;
  name: string;
  design: CardCustomDesign;
  createdAt: number;
}

export interface SavedStudentCard {
  id: string; // Unique card ID (e.g. `card_${Date.now()}`)
  createdAt: number;
  updatedAt: number;
  
  // 10 Student Information Fields
  studentName: string;
  className: string;
  classId?: string;
  fatherName: string;
  dateOfBirth: string;
  studentPhone: string;
  parentPhone: string;
  studentNumber: string; // or Registration Number
  admissionNumber?: string;
  academicYear: string;
  section?: string;
  address?: string;
  emergencyContact?: string;
  validUntil?: string;

  // Student Photo with crop/zoom/position
  photoUrl: string;
  photoZoom: number; // 0.5 to 2.5, default 1.0
  photoOffsetX: number; // -50 to 50, default 0
  photoOffsetY: number; // -50 to 50, default 0

  // Card Design Overrides / Customization
  design: CardCustomDesign;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  action: string;
  category: 'result' | 'dmc' | 'card' | 'settings' | 'backup';
  details: string;
}

export interface AppDatabase {
  version: number;
  schoolProfile: SchoolProfile;
  principalProfile: PrincipalProfile;
  academicYears: string[];
  currentAcademicYear: string;
  examinations: Examination[];
  currentExamId: string;
  classes: ClassDefinition[];
  sections?: string[];
  subjects: Subject[];
  gradeRules: GradeRule[];
  // ClassID -> ExamID -> StudentRow[]
  results: Record<string, Record<string, StudentRow[]>>;
  // Persistent Student Personal Records (linked to studentKey: `${classId}_${studentNumber}`)
  studentPersonalRecords: Record<string, StudentPersonalRecord>;
  // Saved Student ID Cards Gallery & Persistent Registry
  savedStudentCards?: Record<string, SavedStudentCard>;
  customCardTemplates?: CustomTemplatePreset[];
  cardSettings: CardCustomDesign;
  dmcTemplate: DMCTemplateId;
  activityLogs: ActivityLogItem[];
  themeMode?: 'light' | 'dark';
  lastBackupDate?: string;
}
