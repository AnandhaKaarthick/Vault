import React, { useState } from 'react';
import { Lock, ShieldCheck, X, AlertCircle, Loader2 } from 'lucide-react';
import { verifyPin } from '../services/api';

export default function PinModal({ document, onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Please enter your 4-digit Security PIN.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      await verifyPin(pin);
      onSuccess(pin);
    } catch (err) {
      setError('Invalid Security PIN. Access denied.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2620]/60 backdrop-blur-sm animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md p-6 bg-[#FFFFFF] border border-[#1C2620]/20 rounded-lg shadow-2xl space-y-6"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#1C2620]/60 hover:text-[#1C2620] p-1.5 rounded hover:bg-[#1C2620]/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-[#1C2620] text-white border border-[#1C2620]">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1C2620]">Step-Up Verification</h3>
            <p className="font-mono text-xs text-[#1C2620]/70">
              Restricted Category: <span className="text-[#B4402F] font-bold uppercase">{document?.category || 'Sensitive'}</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-[#1C2620] bg-[#f8faf4] p-3.5 rounded border border-[#1C2620]/15 leading-relaxed">
          This record (<span className="font-semibold text-[#1C2620]">{document?.suggested_filename || document?.generated_filename || document?.original_filename}</span>) is restricted. Enter your 4-digit security PIN to unlock access.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs font-bold text-[#1C2620] mb-2 text-center uppercase tracking-wider">
              ENTER 4-DIGIT SECURITY PIN (DEFAULT: 1234)
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              placeholder="••••"
              autoFocus
              className="w-full text-center tracking-[1em] text-2xl font-mono font-bold py-3 bg-[#FFFFFF] border-2 border-[#1C2620] rounded text-[#1C2620] focus:outline-none focus:ring-2 focus:ring-[#1C2620]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#B4402F] bg-[#B4402F]/10 border border-[#B4402F]/30 rounded font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-mono text-xs font-bold text-[#1C2620] bg-white hover:bg-[#1C2620]/5 rounded border border-[#1C2620]/30 transition-all uppercase tracking-wider"
            >
              Cancel
            </button>

            {/* Solid Black High-Contrast Unlock Button */}
            <button
              type="submit"
              disabled={isVerifying || pin.length < 4}
              className="flex-1 py-3 font-mono text-xs font-bold text-white bg-[#1C2620] hover:bg-[#000000] rounded shadow disabled:bg-[#1C2620]/40 disabled:text-white/60 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" /> Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" /> Unlock File
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
