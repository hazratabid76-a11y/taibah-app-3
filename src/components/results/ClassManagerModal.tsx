import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, X, Check } from 'lucide-react';
import { ClassDefinition } from '../../types';

interface ClassManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassDefinition[];
  onSaveClasses: (classes: ClassDefinition[]) => void;
}

export const ClassManagerModal: React.FC<ClassManagerModalProps> = ({
  isOpen,
  onClose,
  classes,
  onSaveClasses,
}) => {
  const [classList, setClassList] = useState<ClassDefinition[]>([...classes]);
  const [newClassName, setNewClassName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newId = 'class-' + Date.now();
    const newOrder = classList.length + 1;
    const updated = [...classList, { id: newId, name: newClassName.trim(), order: newOrder }];
    setClassList(updated);
    setNewClassName('');
  };

  const handleStartEdit = (cls: ClassDefinition) => {
    setEditingId(cls.id);
    setEditName(cls.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    setClassList(
      classList.map((c) => (c.id === editingId ? { ...c, name: editName.trim() } : c))
    );
    setEditingId(null);
  };

  const handleDeleteClass = (id: string) => {
    const updated = classList.filter((c) => c.id !== id).map((c, idx) => ({ ...c, order: idx + 1 }));
    setClassList(updated);
    setConfirmDeleteId(null);
  };

  const moveClass = (index: number, direction: 'up' | 'down') => {
    const newClasses = [...classList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newClasses.length) return;

    const temp = newClasses[index];
    newClasses[index] = newClasses[targetIdx];
    newClasses[targetIdx] = temp;

    // re-assign order numbers
    const updated = newClasses.map((c, idx) => ({ ...c, order: idx + 1 }));
    setClassList(updated);
  };

  const handleFinalSave = () => {
    onSaveClasses(classList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Manage School Classes</h3>
            <p className="text-xs text-slate-500">Add, rename, reorder, or delete classes</p>
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
          {/* Add New Class */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Class 10 (Science), HSSC-I, Prep"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              onClick={handleAddClass}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>

          {/* List of classes */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {classList.map((cls, idx) => (
              <div
                key={cls.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-6 text-slate-400 font-mono text-center">{idx + 1}.</span>
                  {editingId === cls.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 text-xs border border-blue-500 rounded-md focus:outline-none flex-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleStartEdit(cls)}
                      className="font-semibold text-slate-800 cursor-pointer hover:text-blue-600"
                      title="Click to rename"
                    >
                      {cls.name}
                    </span>
                  )}
                </div>

                {/* Actions: Reorder & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveClass(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === classList.length - 1}
                    onClick={() => moveClass(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {confirmDeleteId === cls.id ? (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-md hover:bg-rose-700 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] rounded-md hover:bg-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(cls.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
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
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
