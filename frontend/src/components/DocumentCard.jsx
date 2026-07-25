import React, { useState } from 'react';
import { 
  Lock, Star, Trash2, Zap, FileText, Loader2, Tag, Edit2, Check, X, GraduationCap, Award
} from 'lucide-react';

const STAMP_CLASSES = {
  "Academic & Marksheets": 'stamp-academic',
  "Certificates & Courses": 'stamp-certificates',
  "Tax": 'stamp-tax',
  "Financial & Bank": 'stamp-medical',
  "Identity & Official": 'stamp-identity',
  "Utility & Bills": 'stamp-utility',
  "Travel & Tickets": 'stamp-travel',
  "Medical & Health": 'stamp-medical',
  "Receipts & Invoices": 'stamp-receipts',
  "Other / Unsorted": 'stamp-general',
};

const SENSITIVE_CATEGORIES = ['Identity & Official', 'Tax', 'Financial & Bank'];

export default function DocumentCard({
  document,
  onOpen,
  onToggleStar,
  onDelete,
  onRename
}) {
  if (!document) return null;

  const currentTitle = document.suggested_filename || document.generated_filename || document.original_filename || 'Unnamed Record';
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(currentTitle);

  const category = document.category || 'Other / Unsorted';
  const isSensitive = SENSITIVE_CATEGORIES.includes(category);
  const isProcessing = document.status === 'pending' || document.status === 'processing';
  const stampClass = STAMP_CLASSES[category] || STAMP_CLASSES["Other / Unsorted"];

  const metadataEntries = document.extracted_metadata && typeof document.extracted_metadata === 'object'
    ? Object.entries(document.extracted_metadata).filter(([k, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    : [];

  const tagsList = Array.isArray(document.tags) ? document.tags : [];

  const handleSaveRename = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (editedTitle.trim() && editedTitle !== currentTitle) {
      await onRename(document.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="group archival-card p-6 relative flex flex-col h-full rounded-lg transition-all duration-200 shadow-sm bg-white border border-ink/10 hover:border-ledger">
      {/* Header Row: Stamp Badge & Actions */}
      <div className="flex justify-between items-start mb-4">
        <div className={`stamp-badge ${stampClass} self-start flex items-center gap-1.5`}>
          {isSensitive && <Lock className="w-3.5 h-3.5" />}
          {category.includes('Academic') && <GraduationCap className="w-3.5 h-3.5" />}
          {category.includes('Certificates') && <Award className="w-3.5 h-3.5" />}
          {category.includes('Utility') && <Zap className="w-3.5 h-3.5" />}
          <span>{category}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Edit Filename Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditedTitle(currentTitle);
              setIsEditing(!isEditing);
            }}
            className="p-1.5 text-ink/40 hover:text-[#28493F] hover:bg-ink/5 rounded transition-colors"
            title="Edit Filename"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Star Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleStar(document.id);
            }}
            className={`p-1.5 rounded transition-colors ${
              document.is_starred 
                ? 'text-yellow-600 hover:bg-yellow-50' 
                : 'text-ink/30 hover:text-ledger hover:bg-ink/5'
            }`}
            title="Star Record"
          >
            <Star className={`w-4 h-4 ${document.is_starred ? 'fill-yellow-600' : ''}`} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(document.id);
            }}
            className="p-1.5 text-ink/30 hover:text-stamp hover:bg-stamp/10 rounded transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Card Content Click Area */}
      <div 
        onClick={() => !isEditing && onOpen(document)} 
        className="cursor-pointer flex-1 flex flex-col select-none"
      >
        {/* Title Editing Input or Text Display */}
        {isEditing ? (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center gap-1.5 mb-2"
          >
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(e);
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
              className="flex-1 px-2 py-1 bg-white border-2 border-[#28493F] rounded text-xs font-serif font-bold text-ink focus:outline-none"
            />
            <button
              onClick={handleSaveRename}
              className="p-1.5 bg-[#28493F] text-white rounded hover:bg-[#1E372F]"
              title="Save Name"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 bg-ink/10 text-ink rounded hover:bg-ink/20"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <h3 className="font-serif font-semibold text-lg text-ink mb-2 leading-tight group-hover:text-ledger transition-colors line-clamp-1 flex items-center justify-between">
            <span>{currentTitle}</span>
          </h3>
        )}

        {/* 2-Sentence Auto-Summary */}
        <p className="text-xs font-sans italic text-ink/70 mb-4 line-clamp-2 leading-relaxed">
          {isProcessing ? (
            <span className="flex items-center gap-2 text-ledger font-normal not-italic animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> Transcribing text & auto-categorizing...
            </span>
          ) : (
            document.summary || 'Archival document stored securely in vault.'
          )}
        </p>

        {/* Tags Array */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tagsList.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-ledger/10 text-ledger font-mono text-[10px] uppercase font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Extracted Metadata Pills */}
        {metadataEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
            {metadataEntries.slice(0, 2).map(([key, val]) => (
              <span key={key} className="px-2 py-0.5 rounded bg-ink/5 text-ink/80 text-[11px] font-mono border border-ink/10 flex items-center gap-1 max-w-full truncate">
                <Tag className="w-2.5 h-2.5 text-ledger shrink-0" />
                <span className="capitalize text-ink/60">{key.replace('_', ' ')}:</span>
                <span className="font-semibold truncate">{String(val)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Grid */}
      <div 
        onClick={() => onOpen(document)} 
        className="cursor-pointer mt-auto pt-3 border-t border-ink/10 grid grid-cols-2 gap-3 text-left select-none"
      >
        <div>
          <p className="font-mono text-[10px] text-ink/60 uppercase tracking-widest mb-0.5">
            {document.expiry_date ? 'Due / Expiry' : 'Uploaded'}
          </p>
          <p className={`font-mono text-xs font-semibold uppercase ${document.expiry_date ? 'text-stamp' : 'text-ink'}`}>
            {document.expiry_date || (document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Today')}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] text-ink/60 uppercase tracking-widest mb-0.5">Vendor / Issuer</p>
          <p className="font-mono text-xs font-medium text-ink truncate">
            {document.vendor_or_issuer || 'Vault Office'}
          </p>
        </div>
      </div>
    </div>
  );
}
