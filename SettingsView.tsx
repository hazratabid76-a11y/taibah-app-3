import React, { useState, useRef, useMemo } from 'react';
import {
  School,
  UserCheck,
  BookOpen,
  FileText,
  Award,
  CreditCard,
  Palette,
  Database,
  Code2,
  Upload,
  Download,
  RotateCcw,
  MessageCircle,
  Save,
  CheckCircle2,
  AlertTriangle,
  User,
  PenTool,
  Trash2,
  GraduationCap,
  Layers,
  Plus,
  Edit2,
  ArrowUp,
  ArrowDown,
  Sun,
  Moon,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import { AppDatabase, ClassDefinition, GradeRule, PrincipalProfile, SchoolProfile, Subject } from '../../types';
import { DatabaseService } from '../../db/storage';
import { OFFICIAL_LOGO_URL, DEVELOPER_PHOTO_URL } from '../../db/initialData';

interface SettingsViewProps {
  db: AppDatabase;
  onUpdateDb: (db: AppDatabase) => void;
}

type SettingsTab =
  | 'school'
  | 'principal'
  | 'classes'
  | 'subjects'
  | 'academic'
  | 'results'
  | 'dmc'
  | 'card'
  | 'appearance'
  | 'backup'
  | 'developer';

export const SettingsView: React.FC<SettingsViewProps> = ({ db, onUpdateDb }) => {
  const dbService = useMemo(() => DatabaseService.getInstance(), []);

  const [activeTab, setActiveTab] = useState<SettingsTab>('school');
  const [saveToast, setSaveToast] = useState(false);

  // Form states
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({ ...db.schoolProfile });
  const [principalProfile, setPrincipalProfile] = useState<PrincipalProfile>({
    ...db.principalProfile,
  });
  const [gradeRules, setGradeRules] = useState<GradeRule[]>([...db.gradeRules]);

  // Class Management states
  const [newClassName, setNewClassName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  // Subject Management states
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectMax, setNewSubjectMax] = useState('100');
  const [newSubjectPass, setNewSubjectPass] = useState('33');
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectData, setEditingSubjectData] = useState<Subject | null>(null);

  // Custom Academic Session
  const [newSessionInput, setNewSessionInput] = useState('');

  // Backup & Restore state
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const principalPhotoInputRef = useRef<HTMLInputElement>(null);
  const principalSignatureInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAll = (customDb?: AppDatabase, toastMsg?: string) => {
    const updated: AppDatabase = customDb || {
      ...db,
      schoolProfile,
      principalProfile,
      gradeRules,
    };
    onUpdateDb(updated);
    dbService.saveDatabase(updated, {
      action: 'Settings Saved',
      category: 'settings',
      details: toastMsg || 'Administrator updated institutional profiles and system configuration.',
    });

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updatedProfile = { ...schoolProfile, logoUrl: base64 };
      setSchoolProfile(updatedProfile);
      handleSaveAll({ ...db, schoolProfile: updatedProfile });
    };
    reader.readAsDataURL(file);
  };

  // Reset to official logo
  const handleResetLogo = () => {
    const updatedProfile = { ...schoolProfile, logoUrl: OFFICIAL_LOGO_URL };
    setSchoolProfile(updatedProfile);
    handleSaveAll({ ...db, schoolProfile: updatedProfile });
  };

  // Principal Photo upload
  const handlePrincipalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updated = { ...principalProfile, photoUrl: base64 };
      setPrincipalProfile(updated);
      handleSaveAll({ ...db, principalProfile: updated });
    };
    reader.readAsDataURL(file);
  };

  // Principal Signature upload (supports PNG with transparency)
  const handlePrincipalSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updated = { ...principalProfile, signatureUrl: base64 };
      setPrincipalProfile(updated);
      handleSaveAll({ ...db, principalProfile: updated });
    };
    reader.readAsDataURL(file);
  };

  // Class Management Handlers
  const handleAddClass = () => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    const newId = `class-${Date.now()}`;
    const nextOrder = db.classes.length > 0 ? Math.max(...db.classes.map((c) => c.order)) + 1 : 1;
    const newClasses: ClassDefinition[] = [...db.classes, { id: newId, name: trimmed, order: nextOrder }];
    const updated: AppDatabase = { ...db, classes: newClasses };
    handleSaveAll(updated, `Class "${trimmed}" successfully added.`);
    setNewClassName('');
  };

  const handleSaveEditClass = (id: string) => {
    const trimmed = editingClassName.trim();
    if (!trimmed) return;
    const newClasses = db.classes.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
    const updated: AppDatabase = { ...db, classes: newClasses };
    handleSaveAll(updated, `Class name updated to "${trimmed}".`);
    setEditingClassId(null);
    setEditingClassName('');
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete class "${name}"? Existing results for this class will remain in database.`)) {
      const newClasses = db.classes.filter((c) => c.id !== id);
      const updated: AppDatabase = { ...db, classes: newClasses };
      handleSaveAll(updated, `Class "${name}" deleted.`);
    }
  };

  const handleMoveClass = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= db.classes.length) return;
    const copy = [...db.classes];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    // Reassign order
    const reordered = copy.map((c, i) => ({ ...c, order: i + 1 }));
    const updated: AppDatabase = { ...db, classes: reordered };
    handleSaveAll(updated, 'Class order updated.');
  };

  // Subject Management Handlers
  const handleAddSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    const code = newSubjectCode.trim() || name.substring(0, 3).toUpperCase();
    const maxMarks = parseInt(newSubjectMax, 10) || 100;
    const passMarks = parseInt(newSubjectPass, 10) || 33;
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name,
      code,
      maxMarks,
      passMarks,
    };
    const updatedSubs = [...db.subjects, newSub];
    const updated: AppDatabase = { ...db, subjects: updatedSubs };
    handleSaveAll(updated, `Subject "${name}" successfully added.`);
    setNewSubjectName('');
    setNewSubjectCode('');
    setNewSubjectMax('100');
    setNewSubjectPass('33');
    setShowAddSubjectForm(false);
  };

  const handleSaveEditSubject = () => {
    if (!editingSubjectData) return;
    const updatedSubs = db.subjects.map((s) => (s.id === editingSubjectData.id ? editingSubjectData : s));
    const updated: AppDatabase = { ...db, subjects: updatedSubs };
    handleSaveAll(updated, `Subject "${editingSubjectData.name}" updated.`);
    setEditingSubjectId(null);
    setEditingSubjectData(null);
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove subject "${name}"?`)) {
      const updatedSubs = db.subjects.filter((s) => s.id !== id);
      const updated: AppDatabase = { ...db, subjects: updatedSubs };
      handleSaveAll(updated, `Subject "${name}" deleted.`);
    }
  };

  // Academic Sessions Handlers
  const handleAddSession = () => {
    const trimmed = newSessionInput.trim();
    if (!trimmed) return;
    if (db.academicYears.includes(trimmed)) {
      alert('This academic session already exists.');
      return;
    }
    const updatedYears = [...db.academicYears, trimmed];
    const updated: AppDatabase = { ...db, academicYears: updatedYears };
    handleSaveAll(updated, `Session "${trimmed}" added.`);
    setNewSessionInput('');
  };

  const handleDeleteSession = (session: string) => {
    if (db.academicYears.length <= 1) {
      alert('You must have at least one academic session.');
      return;
    }
    if (confirm(`Are you sure you want to delete session "${session}"?`)) {
      const updatedYears = db.academicYears.filter((y) => y !== session);
      const updatedCurrent = db.currentAcademicYear === session ? updatedYears[0] : db.currentAcademicYear;
      const updated: AppDatabase = { ...db, academicYears: updatedYears, currentAcademicYear: updatedCurrent };
      handleSaveAll(updated, `Session "${session}" removed.`);
    }
  };

  // Theme Mode Switcher
  const handleToggleTheme = (mode: 'light' | 'dark') => {
    const updated: AppDatabase = { ...db, themeMode: mode };
    handleSaveAll(updated, `Switched to ${mode === 'dark' ? 'Dark' : 'Light'} Mode.`);
  };

  // Database Backup export
  const handleExportBackup = () => {
    const jsonStr = dbService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `TAIBAH_School_Database_Backup_${dateStr}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Database Restore file select
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = dbService.restoreBackup(content);
      if (result.success) {
        setRestoreStatus(result.message);
        setRestoreError(null);
        const fresh = dbService.getDatabase();
        onUpdateDb(fresh);
        setSchoolProfile(fresh.schoolProfile);
        setPrincipalProfile(fresh.principalProfile);
        setGradeRules(fresh.gradeRules);
      } else {
        setRestoreError(result.message);
        setRestoreStatus(null);
      }
    };
    reader.readAsText(file);
  };

  // Open direct WhatsApp chat with Hazrat Abid (+923300261440)
  // Strict Privacy: Number is NEVER rendered as text or input anywhere in the UI.
  const handleOpenDeveloperWhatsApp = () => {
    const url = 'https://wa.me/923300261440';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Settings Navigation Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">
          Administration Settings
        </div>
        <div className="space-y-1 text-xs font-medium">
          {[
            { id: 'school' as SettingsTab, label: 'School Profile', icon: School },
            { id: 'principal' as SettingsTab, label: 'Principal Profile', icon: UserCheck },
            { id: 'classes' as SettingsTab, label: 'Class Management', icon: GraduationCap },
            { id: 'subjects' as SettingsTab, label: 'Subject Management', icon: Layers },
            { id: 'academic' as SettingsTab, label: 'Grading & Sessions', icon: BookOpen },
            { id: 'results' as SettingsTab, label: 'Result Sheet Layout', icon: FileText },
            { id: 'dmc' as SettingsTab, label: 'DMC Certificate', icon: Award },
            { id: 'card' as SettingsTab, label: 'Student ID Cards', icon: CreditCard },
            { id: 'appearance' as SettingsTab, label: 'Theme & Appearance', icon: Palette },
            { id: 'backup' as SettingsTab, label: 'Backup & Restore', icon: Database },
            { id: 'developer' as SettingsTab, label: 'About Developer', icon: Code2 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-100 dark:border-blue-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Toast */}
          {saveToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Settings successfully saved & synced!</span>
            </div>
          )}

          {/* Tab 1: School Profile */}
          {activeTab === 'school' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">School Profile & Branding</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Official identity printed on all academic documents</p>
              </div>

              {/* Logo Section */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                  <img
                    src={schoolProfile.logoUrl}
                    alt="School Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Official School Logo</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Uploaded official school crest. Preserves crisp proportions across all documents.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change Logo</span>
                    </button>
                    <button
                      onClick={handleResetLogo}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Original</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">School Full Name</label>
                  <input
                    type="text"
                    value={schoolProfile.name}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">School Location / District</label>
                  <input
                    type="text"
                    value={schoolProfile.location}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Affiliation / Registration No.</label>
                  <input
                    type="text"
                    value={schoolProfile.affiliationNumber || ''}
                    placeholder="BISE-BJR-4029"
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, affiliationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Campus Address</label>
                  <input
                    type="text"
                    value={schoolProfile.address}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={schoolProfile.phone}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={schoolProfile.email}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => handleSaveAll()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save School Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Principal Profile */}
          {activeTab === 'principal' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Principal Profile & Authorizations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Principal photograph, name, bio description, and official signature for certificates and documents
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Principal Photograph */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {principalProfile.photoUrl ? (
                        <img
                          src={principalProfile.photoUrl}
                          alt="Principal"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Principal Photograph</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Displayed in Institutional Leadership on Dashboard.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={principalPhotoInputRef}
                      accept="image/*"
                      onChange={handlePrincipalPhotoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => principalPhotoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photograph</span>
                    </button>
                    {principalProfile.photoUrl && (
                      <button
                        onClick={() => {
                          const updated = { ...principalProfile, photoUrl: '' };
                          setPrincipalProfile(updated);
                          handleSaveAll({ ...db, principalProfile: updated });
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Principal Signature */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 p-1">
                      {principalProfile.signatureUrl ? (
                        <img
                          src={principalProfile.signatureUrl}
                          alt="Principal Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <PenTool className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Principal Signature</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically embedded on Result Sheets, DMCs, and ID Cards.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={principalSignatureInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePrincipalSignatureUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => principalSignatureInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Signature</span>
                    </button>
                    {principalProfile.signatureUrl && (
                      <button
                        onClick={() => {
                          const updated = { ...principalProfile, signatureUrl: '' };
                          setPrincipalProfile(updated);
                          handleSaveAll({ ...db, principalProfile: updated });
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                        title="Remove signature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Principal Full Name</label>
                  <input
                    type="text"
                    value={principalProfile.name}
                    onChange={(e) => setPrincipalProfile({ ...principalProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Official Title / Designation</label>
                  <input
                    type="text"
                    value={principalProfile.title}
                    onChange={(e) => setPrincipalProfile({ ...principalProfile, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Principal Bio / Vision Statement</label>
                  <textarea
                    rows={3}
                    value={principalProfile.description || ''}
                    onChange={(e) => setPrincipalProfile({ ...principalProfile, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => handleSaveAll()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Principal Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Class Management */}
          {activeTab === 'classes' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Class Management</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add, edit, reorder, or delete institutional classes ({db.classes.length} active classes)
                  </p>
                </div>
              </div>

              {/* Add Class Form */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Add New Class</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Class 13, Pre-Medical A, Hifz Section"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                  <button
                    onClick={handleAddClass}
                    disabled={!newClassName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Class</span>
                  </button>
                </div>
              </div>

              {/* Class List Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3">Class Name</th>
                      <th className="py-2.5 px-3 text-center w-28">Order</th>
                      <th className="py-2.5 px-3 text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {db.classes.map((cls, idx) => (
                      <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          {editingClassId === cls.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingClassName}
                                onChange={(e) => setEditingClassName(e.target.value)}
                                className="px-2 py-1 text-xs border border-blue-400 rounded dark:bg-slate-800 dark:text-white w-48 font-bold"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditClass(cls.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClassId(null);
                                  setEditingClassName('');
                                }}
                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 dark:text-white">{cls.name}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleMoveClass(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveClass(idx, 'down')}
                              disabled={idx === db.classes.length - 1}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingClassId(cls.id);
                                setEditingClassName(cls.name);
                              }}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer"
                              title="Edit Name"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id, cls.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                              title="Delete Class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Subject Management */}
          {activeTab === 'subjects' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Subject Management</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define curriculum subjects, official codes, total marks, and passing thresholds ({db.subjects.length} active subjects)
                  </p>
                </div>
                {!showAddSubjectForm && (
                  <button
                    onClick={() => setShowAddSubjectForm(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Subject</span>
                  </button>
                )}
              </div>

              {/* Add Subject Drawer / Form */}
              {showAddSubjectForm && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Add Curriculum Subject</span>
                    <button
                      onClick={() => setShowAddSubjectForm(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Subject Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Physics, Computer Science"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Code</label>
                      <input
                        type="text"
                        placeholder="PHY"
                        value={newSubjectCode}
                        onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Max</label>
                        <input
                          type="number"
                          value={newSubjectMax}
                          onChange={(e) => setNewSubjectMax(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Pass</label>
                        <input
                          type="number"
                          value={newSubjectPass}
                          onChange={(e) => setNewSubjectPass(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowAddSubjectForm(false)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddSubject}
                      disabled={!newSubjectName.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Confirm Add Subject
                    </button>
                  </div>
                </div>
              )}

              {/* Subjects Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3 text-center">Code</th>
                      <th className="py-2.5 px-3 text-center">Max Marks</th>
                      <th className="py-2.5 px-3 text-center">Pass Marks</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {db.subjects.map((sub) => {
                      const isEditing = editingSubjectId === sub.id;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3">
                            {isEditing && editingSubjectData ? (
                              <input
                                type="text"
                                value={editingSubjectData.name}
                                onChange={(e) =>
                                  setEditingSubjectData({ ...editingSubjectData, name: e.target.value })
                                }
                                className="px-2 py-1 border border-blue-400 rounded dark:bg-slate-800 dark:text-white font-bold w-full"
                              />
                            ) : (
                              <span className="font-bold text-slate-900 dark:text-white">{sub.name}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {isEditing && editingSubjectData ? (
                              <input
                                type="text"
                                value={editingSubjectData.code}
                                onChange={(e) =>
                                  setEditingSubjectData({
                                    ...editingSubjectData,
                                    code: e.target.value.toUpperCase(),
                                  })
                                }
                                className="w-16 px-1 py-1 border border-blue-400 rounded dark:bg-slate-800 dark:text-white text-center font-mono"
                              />
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">
                                {sub.code}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {isEditing && editingSubjectData ? (
                              <input
                                type="number"
                                value={editingSubjectData.maxMarks}
                                onChange={(e) =>
                                  setEditingSubjectData({
                                    ...editingSubjectData,
                                    maxMarks: parseInt(e.target.value, 10) || 0,
                                  })
                                }
                                className="w-16 px-1 py-1 border border-blue-400 rounded dark:bg-slate-800 dark:text-white text-center font-mono"
                              />
                            ) : (
                              sub.maxMarks
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {isEditing && editingSubjectData ? (
                              <input
                                type="number"
                                value={editingSubjectData.passMarks}
                                onChange={(e) =>
                                  setEditingSubjectData({
                                    ...editingSubjectData,
                                    passMarks: parseInt(e.target.value, 10) || 0,
                                  })
                                }
                                className="w-16 px-1 py-1 border border-blue-400 rounded dark:bg-slate-800 dark:text-white text-center font-mono"
                              />
                            ) : (
                              sub.passMarks
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={handleSaveEditSubject}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSubjectId(null);
                                    setEditingSubjectData(null);
                                  }}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSubjectId(sub.id);
                                    setEditingSubjectData({ ...sub });
                                  }}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Academic & Grading */}
          {activeTab === 'academic' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Grading Scale & Academic Sessions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure grade boundaries, GPA equivalents, and institutional academic sessions
                </p>
              </div>

              {/* Academic Sessions Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Academic Sessions Management</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {db.academicYears.map((session) => (
                    <div
                      key={session}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        session === db.currentAcademicYear
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <span>{session}</span>
                      {session === db.currentAcademicYear && (
                        <span className="text-[10px] bg-blue-700 px-1.5 py-0.2 rounded font-bold uppercase">Current</span>
                      )}
                      {db.academicYears.length > 1 && (
                        <button
                          onClick={() => handleDeleteSession(session)}
                          className="hover:opacity-75 ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Session"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom session (e.g. 2027-2028)"
                    value={newSessionInput}
                    onChange={(e) => setNewSessionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                  <button
                    onClick={handleAddSession}
                    disabled={!newSessionInput.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Session</span>
                  </button>
                </div>
              </div>

              {/* Grading Rules Table */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Grading Scale Matrix</div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3 text-center">Min %</th>
                        <th className="py-2.5 px-3 text-center">Max %</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {gradeRules.map((rule, idx) => (
                        <tr key={rule.grade} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{rule.grade}</td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              value={rule.minPercentage}
                              onChange={(e) => {
                                const updated = [...gradeRules];
                                updated[idx].minPercentage = parseFloat(e.target.value) || 0;
                                setGradeRules(updated);
                              }}
                              className="w-16 px-2 py-1 text-center font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              value={rule.maxPercentage}
                              onChange={(e) => {
                                const updated = [...gradeRules];
                                updated[idx].maxPercentage = parseFloat(e.target.value) || 0;
                                setGradeRules(updated);
                              }}
                              className="w-16 px-2 py-1 text-center font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={rule.remarks}
                              onChange={(e) => {
                                const updated = [...gradeRules];
                                updated[idx].remarks = e.target.value;
                                setGradeRules(updated);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => handleSaveAll()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Grading Rules</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 6: Result Sheet Layout */}
          {activeTab === 'results' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Result Sheet Specifications</h3>
                <p className="text-slate-500 dark:text-slate-400">Automated 50-student A4 portrait tabulation register engine</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Exact 50-Student Single Page Engine Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-1">
                    The software automatically calculates line height, font sizing, and cell padding to ensure 1 to 50 students fit legibly on exactly one A4 portrait page. When a class contains 51 to 100 students, exactly 2 pages are created.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="font-bold text-slate-800 dark:text-white block">Default Orientation</span>
                    <span className="text-slate-500 dark:text-slate-400">A4 Portrait (210mm × 297mm)</span>
                  </div>
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="font-bold text-slate-800 dark:text-white block">Top 3 Achievers Summary</span>
                    <span className="text-slate-500 dark:text-slate-400">Appears on final page footer only</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: DMC Settings */}
          {activeTab === 'dmc' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Detailed Marks Certificate (DMC) Settings</h3>
                <p className="text-slate-500 dark:text-slate-400">Official certificate layout and verification areas</p>
              </div>

              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Official School Seal & Stamp Box</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Enables designated stamping zone on bottom center</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                </div>

                <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Marks Source Verification</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Directly fetched from Result Generation database records</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Strictly Enforced</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 8: Student Card Settings */}
          {activeTab === 'card' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Student Identity Card Defaults</h3>
                <p className="text-slate-500 dark:text-slate-400">CR80 dimensions & automated A4 sheet tiling presets</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-800 dark:text-white block">Default Card Dimensions</span>
                  <span className="text-slate-500 dark:text-slate-400">CR80 Standard (85.6mm × 54mm)</span>
                </div>
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-800 dark:text-white block">A4 Sheet Tiling</span>
                  <span className="text-slate-500 dark:text-slate-400">8 Landscape Cards per A4 Sheet</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 9: Theme & Appearance */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme & Visual Styling</h3>
                <p className="text-slate-500 dark:text-slate-400">Select institutional visual appearance mode with instant live persistence</p>
              </div>

              {/* Theme Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => handleToggleTheme('light')}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    (db.themeMode || 'light') === 'light'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">Light Mode</span>
                    </div>
                    {(db.themeMode || 'light') === 'light' && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">Active</span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Clean, high-contrast light theme optimized for administrative daytime operations, report generation, and paper print previews.
                  </p>
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => handleToggleTheme('dark')}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    db.themeMode === 'dark'
                      ? 'border-blue-600 bg-blue-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-900 text-indigo-300 flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">Dark Mode</span>
                    </div>
                    {db.themeMode === 'dark' && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">Active</span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Sleek navy-indigo dark aesthetic designed to reduce eye fatigue during late-hour mark entry and high-volume card design sessions.
                  </p>
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Design System Specifications:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Theme: Premium, clean Light & Dark theme with royal blue institutional accents.</li>
                  <li>Primary Color: Professional Blue (`#1d4ed8` / `rgb(29, 78, 216)`).</li>
                  <li>Typography: Plus Jakarta Sans for UI, JetBrains Mono for Tabular figures.</li>
                  <li>State is saved persistently to institutional storage across reloads.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 10: Backup and Restore */}
          {activeTab === 'backup' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Database Safety, Backup & Restore</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Full offline backup, instant snapshot export, and verified restoration
                </p>
              </div>

              {restoreStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restoreStatus}</span>
                </div>
              )}

              {restoreError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Backup Card */}
                <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span>Create Database Backup</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Download a complete, portable JSON backup of all student records, classes, marks, profiles, and audit logs.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Backup File</span>
                  </button>
                </div>

                {/* Restore Backup Card */}
                <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Restore from Backup</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Load a previously saved backup file to restore complete school database records safely.
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={handleRestoreFile}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span>Select Backup File (.json)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset to Default */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-white block">Factory Reset Database</span>
                  <span className="text-slate-500 dark:text-slate-400">Erase all custom marks and reset to initial institutional defaults</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all records to default blank state? This will erase custom marks.')) {
                      dbService.resetToDefault();
                      const fresh = dbService.getDatabase();
                      onUpdateDb(fresh);
                      setSchoolProfile(fresh.schoolProfile);
                      setPrincipalProfile(fresh.principalProfile);
                    }
                  }}
                  className="px-3 py-1.5 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800 font-semibold rounded-lg cursor-pointer"
                >
                  Reset Records
                </button>
              </div>
            </div>
          )}

          {/* Tab 11: About Developer (CRITICAL: Settings Only, Real Photo, Strict Privacy on Phone Number) */}
          {activeTab === 'developer' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">About Developer</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official Software Developer & System Architect</p>
                </div>
                <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-md border border-blue-100 dark:border-blue-900">
                  Verified Developer
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-sm border border-slate-800">
                {/* Real Developer Photograph with proper cropping and rounded frame (Requirement 3) */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-4 ring-blue-500/30 shrink-0 shadow-xl bg-slate-800">
                  <img
                    src={DEVELOPER_PHOTO_URL}
                    alt="Hazrat Abid"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="text-center sm:text-left space-y-1.5 flex-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-serif">
                    Hazrat Abid
                  </h2>
                  <div className="text-xs font-semibold text-blue-300">
                    Student & Software Developer
                  </div>
                  <div className="text-xs text-slate-300">
                    Bajaur, Pakistan
                  </div>
                  <p className="text-xs text-slate-300 pt-2 leading-relaxed max-w-xl">
                    I develop educational software, modern desktop applications, and high-performance technology solutions for schools and colleges. Built with precision for TAIBAH International School and College to ensure effortless result calculations, automated A4 tabulation registers, and offline data safety.
                  </p>
                </div>
              </div>

              {/* WhatsApp Contact Action */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Direct Developer Support
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    For technical support, custom software requests, or feature inquiries, contact the developer directly via WhatsApp.
                  </p>
                </div>

                {/* The Working Contact Button with Internal Destination (Number is NEVER shown as text per Requirement 3) */}
                <div>
                  <a
                    href="https://wa.me/923300261440"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors items-center justify-center gap-2.5 cursor-pointer no-underline"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>CONTACT DEVELOPER ON WHATSAPP</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
