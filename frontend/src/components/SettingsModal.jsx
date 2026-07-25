import React, { useState, useEffect } from 'react';
import { Settings, Key, Database, X, Check, Loader2, Sparkles } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function SettingsModal({ onClose, onSaveSuccess }) {
  const [nvidiaKey, setNvidiaKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  
  const [statusInfo, setStatusInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getSettings();
        setStatusInfo(res);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const payload = {};
      if (nvidiaKey.trim()) payload.nvidia_api_key = nvidiaKey.trim();
      if (supabaseUrl.trim() && supabaseKey.trim()) {
        payload.supabase_url = supabaseUrl.trim();
        payload.supabase_key = supabaseKey.trim();
      }

      const res = await updateSettings(payload);
      setSuccessMsg('API Credentials updated successfully!');
      
      const updatedStatus = await getSettings();
      setStatusInfo(updatedStatus);
      if (onSaveSuccess) onSaveSuccess();
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error updating settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 bg-card border border-ink/20 rounded-lg shadow-2xl space-y-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-ink/40 hover:text-ink p-1.5 rounded hover:bg-ink/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-ledger/10 text-ledger border border-ledger/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">Vault Configuration & API Keys</h3>
            <p className="font-mono text-xs text-ink/60">Configure NVIDIA Developer Platform & Supabase Credentials</p>
          </div>
        </div>

        {/* Current Active Mode Badge */}
        {statusInfo && (
          <div className="p-3.5 rounded bg-paper border border-ink/10 flex items-center justify-between font-mono text-xs">
            <span className="text-ink/60">Active AI & Database Engine:</span>
            <span className={`px-2.5 py-1 rounded font-bold flex items-center gap-1.5 uppercase ${
              statusInfo.has_nvidia_api_key 
                ? 'bg-ledger/10 text-ledger border border-ledger/30' 
                : 'bg-brass/10 text-brass border border-brass/30'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              {statusInfo.mode}
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Section 1: NVIDIA Developer Platform API Key */}
          <div className="space-y-2">
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-ledger flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> NVIDIA Developer Platform API Key
            </label>
            <p className="text-xs font-sans text-ink/60">
              Get your free API key from <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-ledger underline font-semibold">build.nvidia.com</a> for Vision OCR (Llama 3.2 Vision) and Gemma-2B/9B JSON extraction.
            </p>
            <input
              type="password"
              value={nvidiaKey}
              onChange={(e) => setNvidiaKey(e.target.value)}
              placeholder={statusInfo?.has_nvidia_api_key ? `Configured (${statusInfo.masked_nvidia_api_key})` : "nvapi-..."}
              className="w-full px-4 py-3 bg-paper border border-ink/20 rounded font-mono text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-ledger focus:ring-1 focus:ring-ledger"
            />
          </div>

          {/* Section 2: Supabase Credentials */}
          <div className="space-y-3 pt-2 border-t border-ink/10">
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-ledger flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Supabase Database & Storage Credentials
            </label>

            <div>
              <label className="block font-mono text-[11px] text-ink/60 mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder={statusInfo?.has_supabase ? `Configured (${statusInfo.masked_supabase_url})` : "https://your-project.supabase.co"}
                className="w-full px-4 py-2.5 bg-paper border border-ink/20 rounded font-mono text-xs text-ink placeholder-ink/40 focus:outline-none focus:border-ledger"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-ink/60 mb-1">Supabase Service / Anon Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-4 py-2.5 bg-paper border border-ink/20 rounded font-mono text-xs text-ink placeholder-ink/40 focus:outline-none focus:border-ledger"
              />
            </div>
          </div>

          {successMsg && (
            <div className="p-3 font-sans text-xs text-ledger bg-ledger/10 border border-ledger/20 rounded flex items-center gap-2">
              <Check className="w-4 h-4 text-ledger" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-mono text-xs font-semibold text-ink/70 hover:text-ink bg-paper hover:bg-ink/5 rounded border border-ink/10 transition-all uppercase tracking-wider"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 font-mono text-xs font-semibold text-white bg-ledger hover:bg-ledger/90 rounded shadow disabled:opacity-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Credentials'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
