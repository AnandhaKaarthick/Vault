import React, { useState, useRef } from 'react';
import { Plus, CheckCircle2, Loader2 } from 'lucide-react';

export default function Dropzone({ onUpload, isUploading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={`
        group relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 mb-8 bg-card select-none
        ${isDragOver 
          ? 'border-ledger bg-ledger/5 scale-[1.01]' 
          : 'border-ink/12 hover:border-ledger hover:bg-paper/40'
        }
        ${isUploading ? 'opacity-80 cursor-wait' : ''}
      `}
    >
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className={`w-14 h-14 rounded-full border border-ink/10 flex items-center justify-center transition-all duration-300 ${isUploading ? 'bg-ledger text-white animate-pulse' : 'group-hover:scale-110 group-hover:bg-ledger group-hover:text-white bg-paper text-ledger'}`}>
          {isUploading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <Plus className="w-7 h-7" />
          )}
        </div>

        <div>
          <h3 className="font-serif font-semibold text-2xl text-ink tracking-tight group-hover:text-ledger transition-colors">
            {isUploading ? 'Uploading to Vault Archival Office...' : 'Add New Record'}
          </h3>
          <p className="font-sans text-sm text-ink/60 mt-1">
            Drop PDF, JPEG, or PNG files (Invoices, Medical Records, Utility Bills, Identity Proofs)
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-ink/50 pt-2">
          <span className="flex items-center gap-1 text-ledger">
            <CheckCircle2 className="w-3.5 h-3.5" /> Auto-OCR & Categorization
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1 text-ledger">
            <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 Deduplication
          </span>
        </div>
      </div>
    </div>
  );
}
