import React, { useState } from 'react';
import { Plus, Trash2, X, BookOpen } from 'lucide-react';
import { Subject } from '../../types';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSaveSubjects: (subjects: Subject[]) => void;
}

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onSaveSubjects,
}) => {
  const [subjectList, setSubjectList] = useState<Subject[]>([...subjects]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubMax, setNewSubMax] = useState('100');
  const [newSubPass, setNewSubPass] = useState('33');

  if (!isOpen) return null;

  const handleAddSubject = () => {
    if (!newSubName.trim()) return;
    const newId = 'sub-' + Date.now();
    const code = newSubCode.trim() || newSubName.trim().substring(0, 3).toUpperCase();
    const maxMarks = parseInt(newSubMax, 10) || 100;
    const passMarks = parseInt(newSubPass, 10) || 33;

    setSubjectList([
      ...subjectList,
      {
        id: newId,
        name: newSubName.trim(),
        code,
        maxMarks,
        passMarks,
      },
    ]);

    setNewSubName('');
    setNewSubCode('');
    setNewSubMax('100');
    setNewSubPass('33');
  };

  const handleUpdate = (id: string, field: keyof Subject, val: any) => {
    setSubjectList(
      subjectList.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSubjectList(subjectList.filter((s) => s.id !== id));
  };

  const handleFinalSave = () => {
    onSaveSubjects(subjectList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configure Academic Subjects</h3>
              <p className="text-xs text-slate-500">
                Manage subject names, maximum marks, and passing thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add Subject Row */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-800 mb-2">Add New Subject</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Subject Name (e.g. Physics)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="text"
                placeholder="Code (e.g. PHY)"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
              />
              <div className="flex gap-1.5 sm:col-span-2">
                <input
                  type="number"
                  placeholder="Max"
                  value={newSubMax}
                  onChange={(e) => setNewSubMax(e.target.value)}
                  className="w-16 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  title="Maximum Marks"
                />
                <input
                  type="number"
                  placeholder="Pass"
                  value={newSubPass}
                  onChange={(e) => setNewSubPass(e.target.value)}
                  className="w-16 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  title="Passing Marks"
                />
                <button
                  onClick={handleAddSubject}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Subjects */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3 text-center">Max Marks</th>
                  <th className="py-2.5 px-3 text-center">Pass Marks</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => handleUpdate(sub.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-medium border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={sub.code}
                        onChange={(e) => handleUpdate(sub.id, 'code', e.target.value.toUpperCase())}
                        className="w-16 px-2 py-1 text-xs font-mono uppercase border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        value={sub.maxMarks}
                        onChange={(e) => handleUpdate(sub.id, 'maxMarks', parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 text-xs font-mono text-center border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        value={sub.passMarks}
                        onChange={(e) => handleUpdate(sub.id, 'passMarks', parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 text-xs font-mono text-center border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalSave}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Save Subjects
          </button>
        </div>
      </div>
    </div>
  );
};
