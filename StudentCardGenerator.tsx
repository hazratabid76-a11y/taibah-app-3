import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  Printer,
  Download,
  Image as ImageIcon,
  Palette,
  Users,
  CheckSquare,
  Square,
  Upload,
  User,
  Plus,
  Eye,
  Settings2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  FileText,
  RotateCw,
  Trash2,
  Edit,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Move,
  Search,
  Sparkles,
  Layers,
  Copy,
  Undo2,
  Redo2,
  Type,
  Maximize2,
  Sliders,
  BookmarkPlus,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  AppDatabase,
  BackCustomElement,
  CardCustomDesign,
  CardTemplateId,
  CustomTemplatePreset,
  QrCodeContentType,
  SavedStudentCard,
} from '../../types';
import { DatabaseService } from '../../db/storage';
import { DEFAULT_SECTIONS } from '../../db/initialData';
import {
  exportElementToPdf,
  exportElementToPng,
  printIsolatedDocument,
} from '../../utils/documentExporter';
import { StudentCardPreview } from './StudentCardPreview';

interface StudentCardGeneratorProps {
  db: AppDatabase;
  onUpdateDb: (db: AppDatabase) => void;
}

export const StudentCardGenerator: React.FC<StudentCardGeneratorProps> = ({
  db,
  onUpdateDb,
}) => {
  const dbService = useMemo(() => DatabaseService.getInstance(), []);

  // View state: 'gallery' | 'editor' | 'batch-a4'
  const [currentView, setCurrentView] = useState<'gallery' | 'editor' | 'batch-a4'>('gallery');

  // Search & filter state in gallery
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // Active card being edited
  const [activeCard, setActiveCard] = useState<SavedStudentCard>(() => ({
    id: `card_${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    studentName: 'Ahmad Khan',
    className: 'Class 10',
    classId: 'class-10',
    fatherName: 'Zia-ur-Rehman',
    dateOfBirth: '2010-04-12',
    studentPhone: '0330-1234567',
    parentPhone: '0300-9876543',
    studentNumber: '1001',
    academicYear: db.currentAcademicYear || '2025-2026',
    section: 'A',
    address: 'Main Town, District Bajaur, KP',
    emergencyContact: '+92 300 0000000',
    validUntil: '31 Mar 2027',
    photoUrl: '',
    photoZoom: 1.0,
    photoOffsetX: 0,
    photoOffsetY: 0,
    design: db.cardSettings || {
      template: 'royal-blue',
      orientation: 'landscape',
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
      backTitle: 'STUDENT CARD POLICY & EMERGENCY CONTACTS',
      instructions:
        '1. This identity card is the official property of TAIBAH International School & College.\n2. Card must be carried and displayed by the student at all times during school hours.\n3. In case of emergency or loss of this card, please inform the school administration immediately.\n4. Misuse of this card is strictly prohibited.',
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
      qrContentType: 'all',
      qrPosition: 'bottom-right',
      logoPosition: 'top-left',
      signaturePosition: 'bottom-right',
      photoPosition: 'left',
    },
  }));

  // Canva Visual Editor Selection & Zoom State
  const [selectedElementId, setSelectedElementId] = useState<string | null>('school-header');
  const [canvasZoom, setCanvasZoom] = useState<number>(1.25); // 1.0, 1.25, 1.5, 2.0
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');

  // Undo / Redo History Stack
  const [undoStack, setUndoStack] = useState<SavedStudentCard[]>([]);
  const [redoStack, setRedoStack] = useState<SavedStudentCard[]>([]);

  // Push state to undo stack before making modifications
  const recordHistory = useCallback((currentState: SavedStudentCard) => {
    setUndoStack((prev) => [...prev.slice(-20), JSON.parse(JSON.stringify(currentState))]);
    setRedoStack([]);
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(activeCard))]);
    setActiveCard(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(activeCard))]);
    setActiveCard(next);
  };

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, activeCard]);

  // Gallery preview flip tracking: Record<cardId, 'front' | 'back'>
  const [gallerySides, setGallerySides] = useState<Record<string, 'front' | 'back'>>({});

  // Real Scannable QR Code Data URL for the active card
  const [activeQrCodeUrl, setActiveQrCodeUrl] = useState<string>('');

  // Autofill lookup modal state
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [autofillClassId, setAutofillClassId] = useState<string>(db.classes[0]?.id || 'class-kg');

  // Save custom template modal state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');

  // Create Student Card Form Modal State (Requirement 6.A)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCardForm, setCreateCardForm] = useState({
    studentName: '',
    fatherName: '',
    studentNumber: '',
    admissionNumber: '',
    dateOfBirth: '',
    className: db.classes[0]?.name || 'Class 10',
    classId: db.classes[0]?.id || 'class-10',
    section: 'A',
    admissionDate: '',
    studentPhone: '',
    address: '',
    photoUrl: '',
    orientation: 'portrait' as 'portrait' | 'landscape',
  });
  const [createFormError, setCreateFormError] = useState('');
  const createPhotoInputRef = useRef<HTMLInputElement>(null);

  // Custom Section Modal State
  const [showCustomSectionModal, setShowCustomSectionModal] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState('');

  const handleSaveCustomSection = () => {
    const trimmed = newSectionInput.trim();
    if (!trimmed) return;
    dbService.addCustomSection(trimmed);
    const updatedDb = dbService.getDatabase();
    onUpdateDb(updatedDb);
    setActiveCard((p) => ({ ...p, section: trimmed }));
    setNewSectionInput('');
    setShowCustomSectionModal(false);
    setFeedback({ type: 'success', message: `Section '${trimmed}' saved permanently.` });
  };

  // UI state
  const [editorTab, setEditorTab] = useState<'details' | 'design' | 'back' | 'qr'>('details');
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Refs for export and file inputs
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const batchA4Ref = useRef<HTMLDivElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const frontBgInputRef = useRef<HTMLInputElement>(null);
  const backBgInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const backImageInputRef = useRef<HTMLInputElement>(null);

  // Retrieve saved cards and custom templates
  const savedCardsList = useMemo(() => {
    return dbService.getSavedStudentCards();
  }, [dbService, db.savedStudentCards]);

  const customTemplatesList = useMemo(() => {
    return dbService.getCustomTemplates();
  }, [dbService, db.customCardTemplates]);

  // Filtered cards list for gallery
  const filteredCards = useMemo(() => {
    return savedCardsList.filter((c) => {
      const matchesSearch =
        c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.fatherName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = classFilter === 'all' || c.className === classFilter || c.classId === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [savedCardsList, searchQuery, classFilter]);

  // Generate real scannable QR code
  const generateQrCode = useCallback(async (card: SavedStudentCard) => {
    try {
      const { design, studentName, studentNumber, className, academicYear, emergencyContact, parentPhone } = card;
      let textToEncode = '';

      switch (design.qrContentType) {
        case 'student-id':
          textToEncode = `TAIBAH ID: ${studentNumber} | ${studentName} | ${className}`;
          break;
        case 'student-name':
          textToEncode = studentName;
          break;
        case 'school-verify':
          textToEncode = `TAIBAH INTERNATIONAL SCHOOL AND COLLEGE (Bajaur, Pakistan) - Official Student ID: ${studentNumber}`;
          break;
        case 'contact':
          textToEncode = `Emergency: ${emergencyContact || design.emergencyContactText} | Parent: ${parentPhone}`;
          break;
        case 'custom':
          textToEncode = design.qrCustomText || studentName;
          break;
        case 'all':
        default:
          textToEncode = `TAIBAH INTERNATIONAL SCHOOL & COLLEGE\nStudent: ${studentName}\nReg No: ${studentNumber}\nClass: ${className}\nAcademic Year: ${academicYear}\nEmergency: ${emergencyContact || design.emergencyContactText}`;
          break;
      }

      const qrDataUrl = await QRCode.toDataURL(textToEncode, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      setActiveQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  }, []);

  useEffect(() => {
    generateQrCode(activeCard);
  }, [activeCard, generateQrCode]);

  // Auto-clear feedback toast
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    recordHistory(activeCard);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setActiveCard((prev) => ({
        ...prev,
        photoUrl: base64,
        photoZoom: 1.0,
        photoOffsetX: 0,
        photoOffsetY: 0,
      }));
      setFeedback({ type: 'success', message: 'Student photograph uploaded successfully!' });
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom Front BG Upload
  const handleFrontBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    recordHistory(activeCard);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setActiveCard((prev) => ({
        ...prev,
        design: { ...prev.design, frontBgImage: base64 },
      }));
      setFeedback({ type: 'success', message: 'Front background image updated!' });
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom Back BG Upload
  const handleBackBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    recordHistory(activeCard);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setActiveCard((prev) => ({
        ...prev,
        design: { ...prev.design, backBgImage: base64 },
      }));
      setFeedback({ type: 'success', message: 'Back background image updated!' });
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom QR Code Image Upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    recordHistory(activeCard);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setActiveCard((prev) => ({
        ...prev,
        design: {
          ...prev.design,
          uploadedQrCodeUrl: base64,
          showBackQrCode: true,
        },
      }));
      setFeedback({ type: 'success', message: 'Custom QR Code image uploaded successfully!' });
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded QR code and revert to auto-generator
  const handleRemoveUploadedQr = () => {
    recordHistory(activeCard);
    setActiveCard((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        uploadedQrCodeUrl: undefined,
      },
    }));
    setFeedback({ type: 'success', message: 'Custom QR code removed. Auto-generator restored.' });
  };

  // Handle Custom School Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    recordHistory(activeCard);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setActiveCard((prev) => ({
        ...prev,
        design: {
          ...prev.design,
          customLogoUrl: base64,
          showLogo: true,
        },
      }));
      setFeedback({ type: 'success', message: 'School logo updated successfully!' });
    };
    reader.readAsDataURL(file);
  };

  // Reset to default official school logo
  const handleResetLogo = () => {
    recordHistory(activeCard);
    setActiveCard((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        customLogoUrl: undefined,
        showLogo: true,
      },
    }));
    setFeedback({ type: 'success', message: 'Restored official school logo.' });
  };

  // Handle Add Custom Text Element on Back Side
  const handleAddBackCustomElement = () => {
    recordHistory(activeCard);
    const newElem: BackCustomElement = {
      id: `elem_${Date.now()}`,
      label: 'Note',
      text: 'Valid only with official school stamp',
      fontSize: 7.5,
      fontFamily: 'Plus Jakarta Sans',
      color: activeCard.design.textColor || '#1e293b',
      align: 'left',
    };
    setActiveCard((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        backCustomElements: [...(prev.design.backCustomElements || []), newElem],
      },
    }));
    setSelectedElementId(`back-elem-${newElem.id}`);
    setPreviewSide('back');
    setFeedback({ type: 'success', message: 'New text element added to back side!' });
  };

  // Handle Update Custom Text Element on Back Side
  const handleUpdateBackCustomElement = (id: string, updates: Partial<BackCustomElement>) => {
    setActiveCard((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        backCustomElements: (prev.design.backCustomElements || []).map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      },
    }));
  };

  // Handle Delete Custom Text Element on Back Side
  const handleDeleteBackCustomElement = (id: string) => {
    recordHistory(activeCard);
    setActiveCard((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        backCustomElements: (prev.design.backCustomElements || []).filter((el) => el.id !== id),
      },
    }));
    if (selectedElementId === `back-elem-${id}`) {
      setSelectedElementId(null);
    }
    setFeedback({ type: 'success', message: 'Text element removed.' });
  };

  // Start creating a new card (Opens required Create Student Card Form Modal)
  const handleStartCreateCard = () => {
    setCreateCardForm({
      studentName: '',
      fatherName: '',
      studentNumber: `${Math.floor(1000 + Math.random() * 9000)}`,
      admissionNumber: `ADM-${Math.floor(100 + Math.random() * 900)}`,
      dateOfBirth: '',
      className: db.classes[0]?.name || 'Class 10',
      classId: db.classes[0]?.id || 'class-10',
      section: 'A',
      admissionDate: '',
      studentPhone: '',
      address: '',
      photoUrl: '',
      orientation: 'portrait',
    });
    setCreateFormError('');
    setShowCreateModal(true);
  };

  const handleConfirmCreateCard = () => {
    if (!createCardForm.studentName.trim()) {
      setCreateFormError('Student full name is required.');
      return;
    }
    if (!createCardForm.fatherName.trim()) {
      setCreateFormError("Father's name is required.");
      return;
    }
    if (!createCardForm.studentNumber.trim()) {
      setCreateFormError('Student ID / Roll number is required.');
      return;
    }
    if (!createCardForm.dateOfBirth.trim()) {
      setCreateFormError('Date of birth is required.');
      return;
    }
    if (!createCardForm.className.trim()) {
      setCreateFormError('Class is required.');
      return;
    }

    const newCard: SavedStudentCard = {
      id: `card_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      studentName: createCardForm.studentName.trim(),
      fatherName: createCardForm.fatherName.trim(),
      studentNumber: createCardForm.studentNumber.trim(),
      admissionNumber: createCardForm.admissionNumber.trim(),
      dateOfBirth: createCardForm.dateOfBirth.trim(),
      className: createCardForm.className.trim(),
      classId: createCardForm.classId,
      academicYear: db.currentAcademicYear || '2026-2027',
      section: createCardForm.section.trim(),
      validUntil: createCardForm.admissionDate ? `Valid until 31 Mar 2027` : '31 Mar 2027',
      studentPhone: createCardForm.studentPhone.trim(),
      parentPhone: createCardForm.studentPhone.trim(),
      address: createCardForm.address.trim(),
      emergencyContact: '+92 300 0000000',
      photoUrl: createCardForm.photoUrl,
      photoZoom: 1.0,
      photoOffsetX: 0,
      photoOffsetY: 0,
      design: {
        ...db.cardSettings,
        orientation: createCardForm.orientation || 'portrait',
      },
    };

    // Save to persistent storage immediately
    dbService.saveStudentCard(newCard);
    onUpdateDb(dbService.getDatabase());

    setActiveCard(newCard);
    setUndoStack([]);
    setRedoStack([]);
    setPreviewSide('front');
    setSelectedElementId('school-header');
    setShowCreateModal(false);
    setCurrentView('editor');
    setFeedback({
      type: 'success',
      message: `Card created for "${newCard.studentName}". Visual editor is ready!`,
    });
  };

  // Edit an existing saved card
  const handleEditCard = (card: SavedStudentCard) => {
    setActiveCard({ ...card });
    setUndoStack([]);
    setRedoStack([]);
    setPreviewSide('front');
    setSelectedElementId('school-header');
    setCurrentView('editor');
  };

  // Save Card persistently
  const handleSaveCard = () => {
    if (!activeCard.studentName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter the student name before saving.' });
      return;
    }

    dbService.saveStudentCard(activeCard);
    const freshDb = dbService.getDatabase();
    onUpdateDb(freshDb);
    setFeedback({
      type: 'success',
      message: `Student card for "${activeCard.studentName}" saved successfully!`,
    });
  };

  // Save current design as reusable custom template
  const handleSaveCustomTemplate = () => {
    if (!templateNameInput.trim()) return;
    const newPreset: CustomTemplatePreset = {
      id: `preset_${Date.now()}`,
      name: templateNameInput.trim(),
      design: JSON.parse(JSON.stringify(activeCard.design)),
      createdAt: Date.now(),
    };
    dbService.saveCustomTemplate(newPreset);
    const freshDb = dbService.getDatabase();
    onUpdateDb(freshDb);
    setShowSaveTemplateModal(false);
    setTemplateNameInput('');
    setFeedback({ type: 'success', message: `Saved custom template: "${newPreset.name}"!` });
  };

  // Delete Card
  const handleDeleteCard = (card: SavedStudentCard) => {
    if (confirm(`Are you sure you want to delete the student card for "${card.studentName}"?`)) {
      dbService.deleteStudentCard(card.id);
      const freshDb = dbService.getDatabase();
      onUpdateDb(freshDb);
      setFeedback({ type: 'success', message: 'Student card removed from registry.' });
    }
  };

  // Duplicate Card
  const handleDuplicateCard = (card: SavedStudentCard) => {
    const cloned: SavedStudentCard = {
      ...card,
      id: `card_${Date.now()}`,
      studentName: `${card.studentName} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dbService.saveStudentCard(cloned);
    const freshDb = dbService.getDatabase();
    onUpdateDb(freshDb);
    setFeedback({ type: 'success', message: 'Student card duplicated successfully!' });
  };

  // Autofill student from existing records
  const handleAutofillSelect = (studentRow: { number: number; name: string; fatherName?: string; dateOfBirth?: string; phone?: string; photoUrl?: string }) => {
    recordHistory(activeCard);
    const selectedClassObj = db.classes.find((c) => c.id === autofillClassId);
    setActiveCard((prev) => ({
      ...prev,
      studentName: studentRow.name,
      className: selectedClassObj?.name || prev.className,
      classId: autofillClassId,
      fatherName: studentRow.fatherName || prev.fatherName,
      dateOfBirth: studentRow.dateOfBirth || prev.dateOfBirth,
      studentPhone: studentRow.phone || prev.studentPhone,
      studentNumber: String(studentRow.number),
      photoUrl: studentRow.photoUrl || prev.photoUrl,
    }));
    setShowAutofillModal(false);
    setFeedback({ type: 'success', message: `Autofilled details for "${studentRow.name}"!` });
  };

  // Export Individual Card as PDF (Respects Orientation: Portrait or Landscape)
  const handleExportCardPdf = async () => {
    if (!cardPreviewRef.current) return;
    setIsExporting(true);

    try {
      const sanitizedName = activeCard.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
      const filename = `TAIBAH-Student-Card-${sanitizedName}-${activeCard.design.orientation}.pdf`;

      const result = await exportElementToPdf(cardPreviewRef.current, {
        filename,
        format: 'cr80',
        orientation: activeCard.design.orientation,
        scale: 3,
      });

      if (result.success) {
        setFeedback({ type: 'success', message: `PDF saved successfully: ${filename}` });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to generate PDF.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Export error.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Export Individual Card as PNG
  const handleExportCardPng = async () => {
    if (!cardPreviewRef.current) return;
    setIsExporting(true);

    try {
      const sanitizedName = activeCard.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
      const filename = `TAIBAH-Student-Card-${sanitizedName}-${previewSide}-${activeCard.design.orientation}.png`;

      const result = await exportElementToPng(cardPreviewRef.current, filename, 3);
      if (result.success) {
        setFeedback({ type: 'success', message: `Image downloaded: ${filename}` });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to export image.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'PNG export error.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Print Card
  const handlePrintCard = () => {
    if (!cardPreviewRef.current) return;
    printIsolatedDocument(cardPreviewRef.current, {
      orientation: activeCard.design.orientation,
      size: 'A4',
    });
  };

  // Print Batch A4 Sheet
  const handlePrintBatchA4 = () => {
    if (!batchA4Ref.current) return;
    printIsolatedDocument(batchA4Ref.current, {
      orientation: 'portrait',
      size: 'A4',
    });
  };

  // Export Batch A4 as PDF
  const handleExportBatchA4Pdf = async () => {
    if (!batchA4Ref.current) return;
    setIsExporting(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `TAIBAH-Student-Cards-A4-Batch-${dateStr}.pdf`;
      const result = await exportElementToPdf(batchA4Ref.current, {
        filename,
        format: 'a4',
        orientation: 'portrait',
        scale: 2,
      });

      if (result.success) {
        setFeedback({ type: 'success', message: `Batch A4 PDF exported: ${filename}` });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to export Batch PDF.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Batch export error.' });
    } finally {
      setIsExporting(false);
    }
  };

  // -------------------------------------------------------------
  // UNIVERSAL WRAPPER & ALL APPLICATION VIEWS
  // -------------------------------------------------------------
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Toast Feedback (Accessible in Gallery, Batch Sheet & Editor) */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-950 text-rose-300 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hidden File Inputs (Accessible across all views) */}
      <input
        type="file"
        ref={photoFileInputRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={frontBgInputRef}
        accept="image/*"
        onChange={handleFrontBgUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={backBgInputRef}
        accept="image/*"
        onChange={handleBackBgUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={qrFileInputRef}
        accept="image/*"
        onChange={handleQrUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={logoFileInputRef}
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={createPhotoInputRef}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            setCreateCardForm((prev) => ({
              ...prev,
              photoUrl: ev.target?.result as string,
            }));
          };
          reader.readAsDataURL(file);
        }}
        className="hidden"
      />

      {/* VIEW 1: GALLERY & MAIN PAGE */}
      {currentView === 'gallery' && (
        <div className="p-8 max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Student ID Card Studio
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Canva-style visual designer for official CR80 identity cards with full Portrait & Landscape support, real scannable QR verification, and A4 batch printing.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {savedCardsList.length > 0 && (
              <button
                onClick={() => setCurrentView('batch-a4')}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Batch Print A4 Sheet ({savedCardsList.length})</span>
              </button>
            )}

            <button
              onClick={handleStartCreateCard}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE STUDENT CARD</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        {savedCardsList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-500 font-medium">Filter by Class:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Classes</option>
                {db.classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {savedCardsList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs space-y-5 my-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <CreditCard className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                No Student Cards Created Yet
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click "Create Student Card" to open the Canva-style visual designer. Design, customize, and issue official CR80 student identity cards in Portrait or Landscape format.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartCreateCard}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Student Card</span>
              </button>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No student cards match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
              const cardSide = gallerySides[card.id] || 'front';
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 truncate max-w-[170px]">
                        {card.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {card.className} | Roll #{card.studentNumber} |{' '}
                        <span className="font-semibold text-blue-700 uppercase">
                          {card.design.orientation}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setGallerySides((prev) => ({
                          ...prev,
                          [card.id]: cardSide === 'front' ? 'back' : 'front',
                        }))
                      }
                      title="Flip between Front and Back preview"
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>{cardSide === 'front' ? 'Back' : 'Front'}</span>
                    </button>
                  </div>

                  {/* Thumbnail / Mini Preview */}
                  <div className="flex items-center justify-center py-2 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden min-h-[160px]">
                    <div className="transform scale-80 origin-center">
                      <StudentCardPreview
                        studentName={card.studentName}
                        className={card.className}
                        fatherName={card.fatherName}
                        dateOfBirth={card.dateOfBirth}
                        studentPhone={card.studentPhone}
                        parentPhone={card.parentPhone}
                        studentNumber={card.studentNumber}
                        academicYear={card.academicYear}
                        section={card.section}
                        address={card.address}
                        emergencyContact={card.emergencyContact}
                        validUntil={card.validUntil}
                        photoUrl={card.photoUrl}
                        photoZoom={card.photoZoom}
                        photoOffsetX={card.photoOffsetX}
                        photoOffsetY={card.photoOffsetY}
                        design={card.design}
                        side={cardSide}
                        schoolProfile={db.schoolProfile}
                        principalProfile={db.principalProfile}
                        qrCodeUrl={activeQrCodeUrl}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleEditCard(card)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Design & Edit</span>
                    </button>

                    <button
                      onClick={() => handleDuplicateCard(card)}
                      title="Duplicate this card"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteCard(card)}
                      title="Delete card"
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* VIEW 2: BATCH A4 SHEET PRINT & PDF TILING */}
      {currentView === 'batch-a4' && (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-200 overflow-hidden">
        {/* Top Action Bar */}
        <div className="no-print h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('gallery')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Back to Cards Gallery"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                A4 Batch Sheet Print & Export ({savedCardsList.length} Cards)
              </h2>
              <p className="text-[10px] text-slate-500">
                CR80 cards tiled on standard A4 page (210mm × 297mm) with cutting guides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBatchA4Pdf}
              disabled={isExporting || savedCardsList.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>{isExporting ? 'Exporting...' : 'Download A4 PDF'}</span>
            </button>

            <button
              onClick={handlePrintBatchA4}
              disabled={savedCardsList.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Sheet</span>
            </button>
          </div>
        </div>

        {/* A4 Sheet Preview Viewport */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div
            ref={batchA4Ref}
            className="w-[210mm] min-h-[297mm] p-[10mm] bg-white text-slate-900 shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-0 flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            <div className="grid grid-cols-2 gap-4 place-items-center">
              {savedCardsList.slice(0, 8).map((card) => (
                <div key={card.id} className="p-1 border border-dashed border-slate-300 rounded-lg">
                  <StudentCardPreview
                    studentName={card.studentName}
                    className={card.className}
                    fatherName={card.fatherName}
                    dateOfBirth={card.dateOfBirth}
                    studentPhone={card.studentPhone}
                    parentPhone={card.parentPhone}
                    studentNumber={card.studentNumber}
                    academicYear={card.academicYear}
                    section={card.section}
                    address={card.address}
                    emergencyContact={card.emergencyContact}
                    validUntil={card.validUntil}
                    photoUrl={card.photoUrl}
                    photoZoom={card.photoZoom}
                    photoOffsetX={card.photoOffsetX}
                    photoOffsetY={card.photoOffsetY}
                    design={card.design}
                    side="front"
                    schoolProfile={db.schoolProfile}
                    principalProfile={db.principalProfile}
                    qrCodeUrl={activeQrCodeUrl}
                    isPrintMode={true}
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400">
              TAIBAH International School and College — Student Identity Cards Batch Sheet
            </div>
          </div>
        </div>
      </div>
      )}

      {/* VIEW 3: COMPLETE CANVA-STYLE VISUAL EDITOR (PARTS 1 - 8) */}
      {currentView === 'editor' && (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 select-none">

      {/* TOP CANVA APP BAR */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('gallery')}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Back to Cards Gallery"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">Card Designer</span>
            <span className="text-slate-300">|</span>
            <input
              type="text"
              value={activeCard.studentName}
              onChange={(e) => {
                recordHistory(activeCard);
                setActiveCard((p) => ({ ...p, studentName: e.target.value }));
              }}
              placeholder="Student Name..."
              className="text-xs font-bold text-blue-700 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-44 truncate"
            />
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Orientation & Canvas Controls */}
        <div className="flex items-center gap-3">
          {/* Orientation Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => {
                recordHistory(activeCard);
                setActiveCard((p) => ({
                  ...p,
                  design: { ...p.design, orientation: 'portrait' },
                }));
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeCard.design.orientation === 'portrait'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vertical (Portrait)
            </button>

            <button
              onClick={() => {
                recordHistory(activeCard);
                setActiveCard((p) => ({
                  ...p,
                  design: { ...p.design, orientation: 'landscape' },
                }));
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeCard.design.orientation === 'landscape'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Horizontal (Landscape)
            </button>
          </div>

          {/* Front / Back Side Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPreviewSide('front')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                previewSide === 'front'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Side
            </button>

            <button
              onClick={() => setPreviewSide('back')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                previewSide === 'back'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back Side
            </button>
          </div>

          {/* Save / Export Actions */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <button
              onClick={handleSaveCard}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Card</span>
            </button>

            <button
              onClick={handleExportCardPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Download genuine CR80 PDF document"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleExportCardPng}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Download high-resolution PNG image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handlePrintCard}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Open print interface"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* DYNAMIC CANVA ELEMENT TOOLBAR (Contextual properties for selected element) */}
      <div className="h-11 bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between text-xs text-slate-700 shrink-0 z-20 overflow-x-auto">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Sliders className="w-3 h-3 text-blue-600" />
            <span>Editing:</span>
            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              {selectedElementId ? selectedElementId.replace(/-/g, ' ') : 'Select any card element'}
            </span>
          </span>

          {/* Controls for School Header */}
          {selectedElementId === 'school-header' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">School Title:</span>
                <input
                  type="text"
                  value={activeCard.design.customSchoolName || db.schoolProfile.name}
                  onChange={(e) => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({
                      ...p,
                      design: { ...p.design, customSchoolName: e.target.value },
                    }));
                  }}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-xs w-48 outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Font Size:</span>
                <input
                  type="number"
                  min="7"
                  max="14"
                  value={activeCard.design.schoolNameFontSize || 8.5}
                  onChange={(e) => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({
                      ...p,
                      design: { ...p.design, schoolNameFontSize: parseFloat(e.target.value) },
                    }));
                  }}
                  className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-semibold text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Nudge Y:</span>
                <button
                  onClick={() => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({
                      ...p,
                      design: { ...p.design, headerOffsetY: (p.design.headerOffsetY || 0) - 2 },
                    }));
                  }}
                  className="px-1.5 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100"
                >
                  ↑
                </button>
                <button
                  onClick={() => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({
                      ...p,
                      design: { ...p.design, headerOffsetY: (p.design.headerOffsetY || 0) + 2 },
                    }));
                  }}
                  className="px-1.5 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100"
                >
                  ↓
                </button>
              </div>
            </div>
          )}

          {/* Controls for Student Photo */}
          {selectedElementId === 'student-photo' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => photoFileInputRef.current?.click()}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Change Photo</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Zoom:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={activeCard.photoZoom || 1.0}
                  onChange={(e) => {
                    setActiveCard((p) => ({ ...p, photoZoom: parseFloat(e.target.value) }));
                  }}
                  className="w-20 accent-blue-600"
                />
                <span className="font-bold">{activeCard.photoZoom?.toFixed(1)}x</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Pan X:</span>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={activeCard.photoOffsetX || 0}
                  onChange={(e) => {
                    setActiveCard((p) => ({ ...p, photoOffsetX: parseInt(e.target.value) }));
                  }}
                  className="w-16 accent-blue-600"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Pan Y:</span>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={activeCard.photoOffsetY || 0}
                  onChange={(e) => {
                    setActiveCard((p) => ({ ...p, photoOffsetY: parseInt(e.target.value) }));
                  }}
                  className="w-16 accent-blue-600"
                />
              </div>
            </div>
          )}

          {/* Controls for Student Name Block */}
          {selectedElementId === 'student-name-block' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Name:</span>
                <input
                  type="text"
                  value={activeCard.studentName}
                  onChange={(e) => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({ ...p, studentName: e.target.value }));
                  }}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-xs w-36 outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Size:</span>
                <input
                  type="number"
                  min="8"
                  max="16"
                  value={activeCard.design.studentNameFontSize || 11.5}
                  onChange={(e) => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({
                      ...p,
                      design: { ...p.design, studentNameFontSize: parseFloat(e.target.value) },
                    }));
                  }}
                  className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-semibold text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Class:</span>
                <input
                  type="text"
                  value={activeCard.className}
                  onChange={(e) => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({ ...p, className: e.target.value }));
                  }}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-xs w-24 outline-none"
                />
              </div>
            </div>
          )}

          {/* Controls for Background */}
          {selectedElementId === 'card-bg' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  previewSide === 'front'
                    ? frontBgInputRef.current?.click()
                    : backBgInputRef.current?.click()
                }
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Upload {previewSide === 'front' ? 'Front' : 'Back'} BG</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Opacity:</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={
                    previewSide === 'front'
                      ? activeCard.design.frontBgOpacity ?? 0.18
                      : activeCard.design.backBgOpacity ?? 0.22
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setActiveCard((p) => ({
                      ...p,
                      design:
                        previewSide === 'front'
                          ? { ...p.design, frontBgOpacity: val }
                          : { ...p.design, backBgOpacity: val },
                    }));
                  }}
                  className="w-20 accent-blue-600"
                />
              </div>

              {(previewSide === 'front'
                ? activeCard.design.frontBgImage
                : activeCard.design.backBgImage) && (
                <button
                  onClick={() => {
                    recordHistory(activeCard);
                    setActiveCard((p) => ({
                      ...p,
                      design:
                        previewSide === 'front'
                          ? { ...p.design, frontBgImage: '' }
                          : { ...p.design, backBgImage: '' },
                    }));
                  }}
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                  title="Remove Background Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Canvas Zoom Stepper */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
          <button
            onClick={() => setCanvasZoom((z) => Math.max(0.75, Math.round((z - 0.25) * 100) / 100))}
            className="p-1 text-slate-500 hover:text-slate-900 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-[11px] w-12 text-center text-slate-800">
            {Math.round(canvasZoom * 100)}%
          </span>
          <button
            onClick={() => setCanvasZoom((z) => Math.min(2.0, Math.round((z + 0.25) * 100) / 100))}
            className="p-1 text-slate-500 hover:text-slate-900 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCanvasZoom(1.0)}
            className="text-[10px] font-bold text-blue-600 hover:underline ml-1"
          >
            Fit
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE: SIDEBAR CONTROLS (LEFT) + CANVA CANVAS (CENTER/RIGHT) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOL PANEL (Canva-Style 4-Tab Drawer) */}
        <aside className="w-84 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden shadow-xs">
          {/* 4 Tabs Header */}
          <div className="grid grid-cols-4 bg-slate-100 p-1 border-b border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => setEditorTab('details')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                editorTab === 'details'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[10px]">Details</span>
            </button>

            <button
              onClick={() => setEditorTab('design')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                editorTab === 'design'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="text-[10px]">Design</span>
            </button>

            <button
              onClick={() => {
                setEditorTab('back');
                setPreviewSide('back');
              }}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                editorTab === 'back'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[10px]">Back Side</span>
            </button>

            <button
              onClick={() => setEditorTab('qr')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                editorTab === 'qr'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="text-[10px]">QR Code</span>
            </button>
          </div>

          {/* TAB CONTENTS (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* TAB 1: DETAILS */}
            {editorTab === 'details' && (
              <div className="space-y-4">
                {/* Autofill from Register */}
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Autofill from Register</span>
                    </div>
                    <p className="text-blue-700 text-[10px]">Pull existing student credentials</p>
                  </div>
                  <button
                    onClick={() => setShowAutofillModal(true)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0"
                  >
                    Autofill
                  </button>
                </div>

                {/* Photo Upload & Positioning */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Student Photo</span>
                    {activeCard.photoUrl && (
                      <button
                        onClick={() => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({ ...p, photoUrl: '' }));
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-16 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                      {activeCard.photoUrl ? (
                        <img
                          src={activeCard.photoUrl}
                          alt="Student"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <button
                      onClick={() => photoFileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{activeCard.photoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                    </button>
                  </div>

                  {activeCard.photoUrl && (
                    <div className="space-y-2 pt-1 border-t border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-600 font-semibold">Zoom ({activeCard.photoZoom || 1.0}x)</span>
                        <input
                          type="range"
                          min="0.8"
                          max="2.5"
                          step="0.05"
                          value={activeCard.photoZoom || 1.0}
                          onChange={(e) => {
                            setActiveCard((p) => ({ ...p, photoZoom: parseFloat(e.target.value) }));
                          }}
                          className="w-28 accent-blue-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div>
                          <span className="text-slate-500 font-medium">Pan X:</span>
                          <input
                            type="range"
                            min="-30"
                            max="30"
                            step="1"
                            value={activeCard.photoOffsetX || 0}
                            onChange={(e) => {
                              setActiveCard((p) => ({ ...p, photoOffsetX: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Pan Y:</span>
                          <input
                            type="range"
                            min="-30"
                            max="30"
                            step="1"
                            value={activeCard.photoOffsetY || 0}
                            onChange={(e) => {
                              setActiveCard((p) => ({ ...p, photoOffsetY: parseInt(e.target.value) }));
                            }}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Student Credentials Form Fields */}
                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Student Full Name *</label>
                    <input
                      type="text"
                      value={activeCard.studentName}
                      onChange={(e) => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({ ...p, studentName: e.target.value }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Father's Name *</label>
                    <input
                      type="text"
                      value={activeCard.fatherName}
                      onChange={(e) => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({ ...p, fatherName: e.target.value }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px]">Class *</label>
                      <input
                        type="text"
                        value={activeCard.className}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({ ...p, className: e.target.value }));
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px]">Section</label>
                      <select
                        value={activeCard.section || ''}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setShowCustomSectionModal(true);
                          } else {
                            recordHistory(activeCard);
                            setActiveCard((p) => ({ ...p, section: e.target.value }));
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs font-semibold text-slate-800"
                      >
                        <option value="">None</option>
                        {(db.sections || DEFAULT_SECTIONS).map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                        <option value="__custom__">+ Custom...</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px]">Roll / Reg *</label>
                      <input
                        type="text"
                        value={activeCard.studentNumber}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({ ...p, studentNumber: e.target.value }));
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-blue-700 focus:bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px]">Date of Birth</label>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={activeCard.dateOfBirth}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({ ...p, dateOfBirth: e.target.value }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px]">Valid Until / Expiry</label>
                      <input
                        type="text"
                        value={activeCard.validUntil || '31 Mar 2027'}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({ ...p, validUntil: e.target.value }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Student Contact</label>
                    <input
                      type="text"
                      value={activeCard.studentPhone}
                      onChange={(e) => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({ ...p, studentPhone: e.target.value }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Parent / Guardian Phone</label>
                    <input
                      type="text"
                      value={activeCard.parentPhone}
                      onChange={(e) => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({ ...p, parentPhone: e.target.value }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Residential Address</label>
                    <textarea
                      rows={2}
                      value={activeCard.address || ''}
                      onChange={(e) => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({ ...p, address: e.target.value }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs resize-none"
                    />
                  </div>
                </div>

                {/* Visible Field Toggles */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="font-bold text-xs text-slate-900 block">Visible Fields On Front:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { key: 'showFatherName', label: "Father's Name" },
                      { key: 'showDateOfBirth', label: 'Date of Birth' },
                      { key: 'showSection', label: 'Section' },
                      { key: 'showRollNumber', label: 'Roll Number' },
                      { key: 'showStudentPhone', label: 'Student Phone' },
                      { key: 'showParentPhone', label: 'Parent Phone' },
                      { key: 'showAddress', label: 'Address' },
                      { key: 'showExpiryDate', label: 'Expiry Date' },
                    ].map((f) => (
                      <label key={f.key} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={(activeCard.design as any)[f.key] !== false}
                          onChange={(e) => {
                            recordHistory(activeCard);
                            setActiveCard((p) => ({
                              ...p,
                              design: { ...p.design, [f.key]: e.target.checked },
                            }));
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DESIGN */}
            {editorTab === 'design' && (
              <div className="space-y-4">
                {/* Orientation Selector */}
                <div className="space-y-1.5">
                  <span className="font-bold text-xs text-slate-900 block">Card Orientation</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      onClick={() => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({
                          ...p,
                          design: { ...p.design, orientation: 'portrait' },
                        }));
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        activeCard.design.orientation === 'portrait'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-extrabold'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Vertical (Portrait)
                    </button>
                    <button
                      onClick={() => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({
                          ...p,
                          design: { ...p.design, orientation: 'landscape' },
                        }));
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        activeCard.design.orientation === 'landscape'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-extrabold'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Horizontal (Landscape)
                    </button>
                  </div>
                </div>

                {/* Templates Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Card Templates</span>
                    <button
                      onClick={() => setShowSaveTemplateModal(true)}
                      className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span>Save Current</span>
                    </button>
                  </div>

                  {customTemplatesList.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Saved Presets:</span>
                      <div className="flex flex-wrap gap-1">
                        {customTemplatesList.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => {
                              recordHistory(activeCard);
                              setActiveCard((p) => ({
                                ...p,
                                design: JSON.parse(JSON.stringify(tpl.design)),
                              }));
                              setFeedback({ type: 'success', message: `Applied: ${tpl.name}` });
                            }}
                            className="px-2 py-0.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 rounded text-[10px] font-bold cursor-pointer"
                          >
                            ★ {tpl.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { id: 'royal-blue' as CardTemplateId, label: 'Royal Blue' },
                      { id: 'modern-white-blue' as CardTemplateId, label: 'Modern White' },
                      { id: 'navy-gold' as CardTemplateId, label: 'Navy & Gold' },
                      { id: 'classic-identity' as CardTemplateId, label: 'Classic ID' },
                      { id: 'modern-gradient' as CardTemplateId, label: 'Gradient Blue' },
                      { id: 'minimal-professional' as CardTemplateId, label: 'Minimal Slate' },
                      { id: 'academic-crest' as CardTemplateId, label: 'Academic Green' },
                      { id: 'premium-college' as CardTemplateId, label: 'College Split' },
                    ].map((t) => {
                      const active = activeCard.design.template === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            recordHistory(activeCard);
                            setActiveCard((p) => {
                              let primaryColor = p.design.primaryColor;
                              let secondaryColor = p.design.secondaryColor;
                              let backgroundColor = p.design.backgroundColor;
                              let textColor = p.design.textColor;

                              if (t.id === 'navy-gold') {
                                primaryColor = '#0a1128';
                                secondaryColor = '#d97706';
                                backgroundColor = '#0a1128';
                                textColor = '#f8fafc';
                              } else if (t.id === 'modern-white-blue') {
                                primaryColor = '#0284c7';
                                secondaryColor = '#0d9488';
                                backgroundColor = '#ffffff';
                                textColor = '#0f172a';
                              } else if (t.id === 'classic-identity') {
                                primaryColor = '#1e3a8a';
                                secondaryColor = '#881337';
                                backgroundColor = '#ffffff';
                                textColor = '#1e293b';
                              } else if (t.id === 'modern-gradient') {
                                primaryColor = '#2563eb';
                                secondaryColor = '#7c3aed';
                                backgroundColor = '#ffffff';
                                textColor = '#0f172a';
                              } else if (t.id === 'minimal-professional') {
                                primaryColor = '#1e293b';
                                secondaryColor = '#475569';
                                backgroundColor = '#ffffff';
                                textColor = '#0f172a';
                              } else if (t.id === 'academic-crest') {
                                primaryColor = '#15803d';
                                secondaryColor = '#b45309';
                                backgroundColor = '#ffffff';
                                textColor = '#0f172a';
                              } else if (t.id === 'premium-college') {
                                primaryColor = '#4338ca';
                                secondaryColor = '#0284c7';
                                backgroundColor = '#ffffff';
                                textColor = '#0f172a';
                              } else {
                                primaryColor = '#1d4ed8';
                                secondaryColor = '#059669';
                                backgroundColor = '#ffffff';
                                textColor = '#0f172a';
                              }

                              return {
                                ...p,
                                design: {
                                  ...p.design,
                                  template: t.id,
                                  primaryColor,
                                  secondaryColor,
                                  backgroundColor,
                                  textColor,
                                },
                              };
                            });
                          }}
                          className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                            active
                              ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Theme Colors */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block">Theme Colors</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Primary Theme:</span>
                      <input
                        type="color"
                        value={activeCard.design.primaryColor || '#1d4ed8'}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, primaryColor: e.target.value },
                          }));
                        }}
                        className="w-7 h-7 p-0.5 border border-slate-300 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Secondary Accent:</span>
                      <input
                        type="color"
                        value={activeCard.design.secondaryColor || '#059669'}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, secondaryColor: e.target.value },
                          }));
                        }}
                        className="w-7 h-7 p-0.5 border border-slate-300 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Card Background:</span>
                      <input
                        type="color"
                        value={activeCard.design.backgroundColor || '#ffffff'}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, backgroundColor: e.target.value },
                          }));
                        }}
                        className="w-7 h-7 p-0.5 border border-slate-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Borders & Corners */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block">Border & Corners</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Border Radius:</span>
                      <select
                        value={activeCard.design.borderRadius ?? 12}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, borderRadius: parseInt(e.target.value) },
                          }));
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-xs"
                      >
                        <option value={0}>Sharp (0px)</option>
                        <option value={6}>Slight (6px)</option>
                        <option value={12}>Standard CR80 (12px)</option>
                        <option value={18}>Round (18px)</option>
                        <option value={24}>Smooth Pill (24px)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Border Style:</span>
                      <select
                        value={activeCard.design.borderStyle || 'solid'}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, borderStyle: e.target.value as any },
                          }));
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-xs"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="double">Double</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block">Typography & Scale</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Font Family:</span>
                      <select
                        value={activeCard.design.fontFamily || 'Plus Jakarta Sans'}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, fontFamily: e.target.value },
                          }));
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-xs"
                      >
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Arial">Arial</option>
                        <option value="Poppins">Poppins</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* School Logo & Branding Header */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">School Logo & Header</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeCard.design.showLogo}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, showLogo: e.target.checked },
                          }));
                        }}
                        className="rounded accent-blue-600"
                      />
                      <span className="text-[11px] font-semibold text-slate-700">Show Logo</span>
                    </label>
                  </div>

                  {activeCard.design.showLogo && (
                    <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="flex-1 py-1.5 px-2.5 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>{activeCard.design.customLogoUrl ? 'Change Logo' : 'Upload Custom Logo'}</span>
                        </button>
                        {activeCard.design.customLogoUrl && (
                          <button
                            type="button"
                            onClick={handleResetLogo}
                            className="py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                            title="Reset to Official School Logo"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-600 text-[11px]">Logo Size:</span>
                        <input
                          type="range"
                          min="16"
                          max="48"
                          step="2"
                          value={activeCard.design.logoSize || 24}
                          onChange={(e) => {
                            setActiveCard((p) => ({
                              ...p,
                              design: { ...p.design, logoSize: parseInt(e.target.value) },
                            }));
                          }}
                          className="w-28 accent-blue-600"
                        />
                        <span className="text-[10px] font-bold text-slate-700 w-8 text-right">
                          {activeCard.design.logoSize || 24}px
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Custom School Name & Subtitle */}
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">School Name:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeCard.design.showSchoolName}
                            onChange={(e) => {
                              recordHistory(activeCard);
                              setActiveCard((p) => ({
                                ...p,
                                design: { ...p.design, showSchoolName: e.target.checked },
                              }));
                            }}
                            className="rounded accent-blue-600"
                          />
                          <span className="text-[10px] text-slate-600">Show</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder={db.schoolProfile?.name || 'TAIBAH International School & College'}
                        value={activeCard.design.customSchoolName || ''}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, customSchoolName: e.target.value },
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">Location / Subtitle:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeCard.design.showLocation}
                            onChange={(e) => {
                              recordHistory(activeCard);
                              setActiveCard((p) => ({
                                ...p,
                                design: { ...p.design, showLocation: e.target.checked },
                              }));
                            }}
                            className="rounded accent-blue-600"
                          />
                          <span className="text-[10px] text-slate-600">Show</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder={db.schoolProfile?.location || 'Islamabad'}
                        value={activeCard.design.customSchoolLocation || ''}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, customSchoolLocation: e.target.value },
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Front Background Image */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block">Front Background Image</span>
                  <button
                    onClick={() => frontBgInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Front Background</span>
                  </button>
                  {activeCard.design.frontBgImage && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600 text-[11px]">Opacity:</span>
                      <input
                        type="range"
                        min="0.05"
                        max="0.9"
                        step="0.05"
                        value={activeCard.design.frontBgOpacity ?? 0.18}
                        onChange={(e) => {
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, frontBgOpacity: parseFloat(e.target.value) },
                          }));
                        }}
                        className="w-28 accent-blue-600"
                      />
                      <button
                        onClick={() => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, frontBgImage: '' },
                          }));
                        }}
                        className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BACK SIDE */}
            {editorTab === 'back' && (
              <div className="space-y-4">
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Card Back Editor</span>
                  </div>
                  <button
                    onClick={() => setPreviewSide(previewSide === 'back' ? 'front' : 'back')}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10.5px] cursor-pointer"
                  >
                    {previewSide === 'back' ? 'View Front' : 'View Back'}
                  </button>
                </div>

                {/* Back Header Title */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700 text-[11px]">Back Header Title</label>
                  <input
                    type="text"
                    value={activeCard.design.backTitle || 'STUDENT IDENTITY CARD'}
                    onChange={(e) => {
                      recordHistory(activeCard);
                      setActiveCard((p) => ({
                        ...p,
                        design: { ...p.design, backTitle: e.target.value },
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 focus:bg-white text-xs"
                  />
                </div>

                {/* School Policy / Instructions Textarea */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700 text-[11px]">Terms, Rules & Instructions</label>
                  <textarea
                    rows={4}
                    value={activeCard.design.backInstructions || '1. This card must be worn at all times on school premises.\n2. Card is non-transferable and remains property of TAIBAH.\n3. If found, please return to the school administration office.'}
                    onChange={(e) => {
                      recordHistory(activeCard);
                      setActiveCard((p) => ({
                        ...p,
                        design: { ...p.design, backInstructions: e.target.value },
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs"
                  />
                </div>

                {/* Emergency Contact & School Office Note */}
                <div className="space-y-2 text-xs pt-1 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Emergency Helpline / Contact</label>
                    <input
                      type="text"
                      value={activeCard.emergencyContact || ''}
                      onChange={(e) => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({ ...p, emergencyContact: e.target.value }));
                      }}
                      placeholder="e.g. +92 300 0000000"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Principal / Official Signature Label</label>
                    <input
                      type="text"
                      value={activeCard.design.signatureLabel || 'Authorized Principal Signature'}
                      onChange={(e) => {
                        recordHistory(activeCard);
                        setActiveCard((p) => ({
                          ...p,
                          design: { ...p.design, signatureLabel: e.target.value },
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Back Background Image */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block">Back Background Image</span>
                  <button
                    onClick={() => backBgInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Back Background</span>
                  </button>
                  {activeCard.design.backBgImage && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600 text-[11px]">Opacity:</span>
                      <input
                        type="range"
                        min="0.05"
                        max="0.9"
                        step="0.05"
                        value={activeCard.design.backBgOpacity ?? 0.22}
                        onChange={(e) => {
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, backBgOpacity: parseFloat(e.target.value) },
                          }));
                        }}
                        className="w-28 accent-blue-600"
                      />
                      <button
                        onClick={() => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, backBgImage: '' },
                          }));
                        }}
                        className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom Text Elements on Back */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Custom Text Elements</span>
                    <button
                      onClick={handleAddBackCustomElement}
                      className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Text</span>
                    </button>
                  </div>

                  {(activeCard.design.backCustomElements || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No custom text elements added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(activeCard.design.backCustomElements || []).map((el) => (
                        <div key={el.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={el.label || 'Note'}
                              onChange={(e) => handleUpdateBackCustomElement(el.id, { label: e.target.value })}
                              className="font-bold text-[11px] text-slate-800 bg-transparent border-b border-dashed border-slate-300 w-28 outline-none"
                            />
                            <button
                              onClick={() => handleDeleteBackCustomElement(el.id)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                              title="Delete text element"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={el.text}
                            onChange={(e) => handleUpdateBackCustomElement(el.id, { text: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: QR CODE */}
            {editorTab === 'qr' && (
              <div className="space-y-4 text-xs">
                {/* QR Placement Side */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-900 block">QR Code Placement</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'back' as const, label: 'Back Side Only' },
                      { id: 'front' as const, label: 'Front Side Only' },
                      { id: 'both' as const, label: 'Both Front & Back' },
                      { id: 'none' as const, label: 'Hidden / None' },
                    ].map((opt) => {
                      const isSelected = (activeCard.design.qrPlacementSide || 'back') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            recordHistory(activeCard);
                            setActiveCard((p) => ({
                              ...p,
                              design: {
                                ...p.design,
                                qrPlacementSide: opt.id,
                                showBackQrCode: opt.id !== 'none',
                              },
                            }));
                          }}
                          className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom QR Code Image Upload */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Custom QR Image</span>
                    {activeCard.design.uploadedQrCodeUrl && (
                      <button
                        onClick={handleRemoveUploadedQr}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Reset to Auto QR
                      </button>
                    )}
                  </div>

                  <p className="text-[10.5px] text-slate-500">
                    Upload an official pre-generated QR code image or use the automatic system QR generator below.
                  </p>

                  <button
                    onClick={() => qrFileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{activeCard.design.uploadedQrCodeUrl ? 'Replace Uploaded QR' : 'Upload Custom QR Image'}</span>
                  </button>

                  {activeCard.design.uploadedQrCodeUrl && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                      <img
                        src={activeCard.design.uploadedQrCodeUrl}
                        alt="Custom QR"
                        className="w-10 h-10 object-contain bg-white rounded border border-emerald-300"
                      />
                      <div className="text-[11px] text-emerald-800">
                        <span className="font-bold block">Custom QR Active</span>
                        <span>Official custom image is being rendered on card</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Code Dimensions */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">QR Size ({activeCard.design.qrCodeSize || 54}px)</span>
                    <input
                      type="range"
                      min="36"
                      max="84"
                      step="2"
                      value={activeCard.design.qrCodeSize || 54}
                      onChange={(e) => {
                        setActiveCard((p) => ({
                          ...p,
                          design: { ...p.design, qrCodeSize: parseInt(e.target.value) },
                        }));
                      }}
                      className="w-32 accent-blue-600"
                    />
                  </div>
                </div>

                {/* Auto QR Content Type */}
                {!activeCard.design.uploadedQrCodeUrl && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900 block">Auto QR Data Content</span>
                    <div className="space-y-1.5">
                      {[
                        { id: 'student-id' as QrCodeContentType, label: 'Student ID & Roll Number' },
                        { id: 'vcard' as QrCodeContentType, label: 'Digital vCard (Name, Roll, Class, Phone)' },
                        { id: 'custom-url' as QrCodeContentType, label: 'Custom Text / URL' },
                      ].map((item) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                          <input
                            type="radio"
                            name="qrContentType"
                            checked={(activeCard.design.qrContentType || 'vcard') === item.id}
                            onChange={() => {
                              recordHistory(activeCard);
                              setActiveCard((p) => ({
                                ...p,
                                design: { ...p.design, qrContentType: item.id },
                              }));
                            }}
                            className="text-blue-600"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {activeCard.design.qrContentType === 'custom-url' && (
                      <input
                        type="text"
                        placeholder="e.g. https://taibah.edu.pk/verify/..."
                        value={activeCard.design.customQrText || ''}
                        onChange={(e) => {
                          recordHistory(activeCard);
                          setActiveCard((p) => ({
                            ...p,
                            design: { ...p.design, customQrText: e.target.value },
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={photoFileInputRef}
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={frontBgInputRef}
            accept="image/*"
            onChange={handleFrontBgUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={backBgInputRef}
            accept="image/*"
            onChange={handleBackBgUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={qrFileInputRef}
            accept="image/*"
            onChange={handleQrUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={createPhotoInputRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                setCreateCardForm((prev) => ({
                  ...prev,
                  photoUrl: ev.target?.result as string,
                }));
              };
              reader.readAsDataURL(file);
            }}
            className="hidden"
          />
        </aside>

        {/* CANVA INTERACTIVE CANVAS AREA */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto relative">
          {/* Card Dimensions & Aspect Ratio Indicator */}
          <div className="absolute top-4 left-6 text-xs text-slate-500 font-medium flex items-center gap-2">
            <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs font-bold text-slate-800">
              {activeCard.design.orientation === 'portrait' ? 'CR80 Portrait' : 'CR80 Landscape'}
            </span>
            <span>
              {activeCard.design.orientation === 'portrait'
                ? '53.98 × 85.60 mm'
                : '85.60 × 53.98 mm'}
            </span>
            <span className="text-slate-400">• Click any element on card to customize</span>
          </div>

          {/* The Active Rendered Card Container */}
          <div className="my-auto transition-transform duration-200">
            <div ref={cardPreviewRef}>
              <StudentCardPreview
                studentName={activeCard.studentName}
                className={activeCard.className}
                fatherName={activeCard.fatherName}
                dateOfBirth={activeCard.dateOfBirth}
                studentPhone={activeCard.studentPhone}
                parentPhone={activeCard.parentPhone}
                studentNumber={activeCard.studentNumber}
                academicYear={activeCard.academicYear}
                section={activeCard.section}
                address={activeCard.address}
                emergencyContact={activeCard.emergencyContact}
                validUntil={activeCard.validUntil}
                photoUrl={activeCard.photoUrl}
                photoZoom={activeCard.photoZoom}
                photoOffsetX={activeCard.photoOffsetX}
                photoOffsetY={activeCard.photoOffsetY}
                design={activeCard.design}
                side={previewSide}
                schoolProfile={db.schoolProfile}
                principalProfile={db.principalProfile}
                qrCodeUrl={activeQrCodeUrl}
                isEditable={true}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                scaleRatio={canvasZoom}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
    )}

      {/* Save Custom Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="font-bold text-sm text-slate-900">
              Save Design as Custom Template
            </div>
            <p className="text-xs text-slate-500">
              Save your current colors, typography, and card arrangement as a template preset to reuse for other students.
            </p>
            <input
              type="text"
              placeholder="e.g. Blue & Gold Formal"
              value={templateNameInput}
              onChange={(e) => setTemplateNameInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomTemplate}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autofill Modal (Optional lookup from class register) */}
      {showAutofillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-sm text-slate-900">
                Import Student from Class Register
              </div>
              <button
                onClick={() => setShowAutofillModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Select Class:</label>
              <select
                value={autofillClassId}
                onChange={(e) => setAutofillClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none"
              >
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs">
              {(() => {
                const examId = db.currentExamId || db.examinations[0]?.id || 'exam-annual-2026';
                const rows = dbService.getStudentRowsForClass(autofillClassId, examId);
                const valid = rows.filter((r) => r.name && r.name.trim().length > 0);

                if (valid.length === 0) {
                  return (
                    <div className="p-4 text-center text-slate-400">
                      No students enrolled in this class yet.
                    </div>
                  );
                }

                return valid.map((r) => (
                  <div
                    key={r.number}
                    onClick={() => handleAutofillSelect(r)}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Roll #{r.number} {r.fatherName ? `| Father: ${r.fatherName}` : ''}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Select
                    </span>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAutofillModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Section Management Modal */}
      {showCustomSectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Custom Section</h3>
                <p className="text-xs text-slate-500">
                  Add section names like A, B, Blue, Red, Science, Arts, Morning, Evening
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCustomSectionModal(false);
                  setNewSectionInput('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">New Section Name</label>
              <input
                type="text"
                placeholder="e.g. Science, Blue, Arts, Morning"
                value={newSectionInput}
                onChange={(e) => setNewSectionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomSection()}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* List of existing sections with quick delete option */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Available Sections:</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {(db.sections || DEFAULT_SECTIONS).map((sec) => (
                  <span
                    key={sec}
                    onClick={() => {
                      setActiveCard((p) => ({ ...p, section: sec }));
                      setShowCustomSectionModal(false);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{sec}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dbService.deleteCustomSection(sec);
                        onUpdateDb(dbService.getDatabase());
                      }}
                      className="text-slate-400 hover:text-rose-600"
                      title="Remove section"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCustomSectionModal(false);
                  setNewSectionInput('');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomSection}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Student Card Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Create Student ID Card</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in student particulars to generate an official identity card
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormError('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createFormError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Photo Upload and Orientation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                    {createCardForm.photoUrl ? (
                      <img
                        src={createCardForm.photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <span className="font-bold text-slate-800 text-[11px] block">Student Photograph</span>
                    <button
                      type="button"
                      onClick={() => createPhotoInputRef.current?.click()}
                      className="py-1.5 px-3 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{createCardForm.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {createCardForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setCreateCardForm((p) => ({ ...p, photoUrl: '' }))}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer block"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="font-bold text-slate-800 text-[11px]">Card Layout Orientation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateCardForm((p) => ({ ...p, orientation: 'portrait' }))}
                      className={`p-2 rounded-lg border text-center font-bold text-xs cursor-pointer transition-all ${
                        createCardForm.orientation === 'portrait'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateCardForm((p) => ({ ...p, orientation: 'landscape' }))}
                      className={`p-2 rounded-lg border text-center font-bold text-xs cursor-pointer transition-all ${
                        createCardForm.orientation === 'landscape'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Student Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Ali Khan"
                    value={createCardForm.studentName}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, studentName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Father's Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    value={createCardForm.fatherName}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, fatherName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Class *</label>
                  <select
                    value={createCardForm.classId}
                    onChange={(e) => {
                      const sel = db.classes.find((c) => c.id === e.target.value);
                      setCreateCardForm((p) => ({
                        ...p,
                        classId: e.target.value,
                        className: sel?.name || p.className,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  >
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Section</label>
                  <select
                    value={createCardForm.section}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, section: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  >
                    {(db.sections || DEFAULT_SECTIONS).map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Student ID / Roll Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1042"
                    value={createCardForm.studentNumber}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, studentNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Admission Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ADM-2026-089"
                    value={createCardForm.admissionNumber}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, admissionNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Date of Birth *</label>
                  <input
                    type="date"
                    value={createCardForm.dateOfBirth}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Admission Date / Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-03-15"
                    value={createCardForm.admissionDate}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, admissionDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +92 300 1234567"
                    value={createCardForm.studentPhone}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, studentPhone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Residential Address</label>
                  <input
                    type="text"
                    placeholder="e.g. House 12, Street 4, Sector G-8, Islamabad"
                    value={createCardForm.address}
                    onChange={(e) => setCreateCardForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormError('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateCard}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Student Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
