import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { useTicketContext } from '../../context/TicketContext';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SUGGESTIONS = [
  'Festival',
  'Workshop',
  'Comedy',
  'Nightlife',
  'Exhibition',
  'Charity Gala',
  'Technology',
  'Classical Music',
];

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, addCategory, removeCategory, resetCategories } = useTicketContext();

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Category "${trimmed}" already exists.`);
      return;
    }

    addCategory(trimmed);
    setNewCategoryInput('');
  };

  const handleAddPreset = (preset: string) => {
    setError(null);
    if (!categories.some((c) => c.toLowerCase() === preset.toLowerCase())) {
      addCategory(preset);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all categories back to default values?')) {
      resetCategories();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden text-zinc-900 border border-zinc-200 my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h3 className="font-semibold text-base text-zinc-900">Manage Event Categories</h3>
            <p className="text-xs text-zinc-400">Storefront filter categories and tags</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700">
              Create New Category
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => {
                    setNewCategoryInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. Comedy, Art Festival..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
                />
              </div>
              <button
                type="submit"
                disabled={!newCategoryInput.trim()}
                className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-medium rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
          </form>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SUGGESTIONS.map((sug) => {
                const alreadyExists = categories.some(
                  (c) => c.toLowerCase() === sug.toLowerCase()
                );
                return (
                  <button
                    key={sug}
                    type="button"
                    disabled={alreadyExists}
                    onClick={() => handleAddPreset(sug)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      alreadyExists
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-transparent'
                        : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{sug}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Categories List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Current Categories ({categories.length})
              </span>
              <span className="text-[11px] text-zinc-400">Pills shown on storefront</span>
            </div>

            <div className="space-y-1.5">
              {categories.map((cat) => {
                const isAll = cat.toLowerCase() === 'all';
                return (
                  <div
                    key={cat}
                    className="p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between hover:border-zinc-300 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-900">{cat}</span>
                      {isAll && (
                        <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-mono">
                          Default
                        </span>
                      )}
                    </div>

                    {!isAll && (
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="p-1 text-zinc-400 hover:text-red-600 transition cursor-pointer"
                        title={`Remove "${cat}" category`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-md text-xs shadow-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
