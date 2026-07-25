import React from 'react';
import { AlertCircle, Clock, ChevronRight, X } from 'lucide-react';

export default function AlertBanner({ expiringDocs = [], onSelectDoc, onDismiss }) {
  if (!expiringDocs || expiringDocs.length === 0) return null;

  return (
    <div className="mb-6 bg-card border-l-4 border-stamp px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-r-lg gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-stamp/10 text-stamp shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div>
          <p className="font-sans text-sm font-medium text-ink">
            <span className="font-bold text-stamp uppercase tracking-wider text-xs mr-2">Urgent Deadline:</span> 
            You have <span className="font-bold text-stamp">{expiringDocs.length} document(s)</span> due or expiring within 30 days.
          </p>

          <div className="flex items-center gap-4 mt-2 overflow-x-auto">
            {expiringDocs.slice(0, 3).map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className="text-left flex items-center gap-2 text-xs font-mono text-ledger hover:underline bg-paper px-3 py-1 rounded border border-ink/10"
              >
                <Clock className="w-3 h-3 text-stamp" />
                <span className="font-semibold text-ink truncate max-w-[150px]">
                  {doc.generated_filename || doc.original_filename}
                </span>
                <span className="text-stamp font-bold">({doc.expiry_date || 'Soon'})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-ink/40 hover:text-ink p-1 rounded hover:bg-ink/5 self-end md:self-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
