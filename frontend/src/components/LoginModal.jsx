import React, { useState } from 'react';
import { Lock, User, Mail, ShieldCheck, ArrowRight, Loader2, KeyRound, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function LoginModal({ onLoginSuccess, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!username.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in all required fields.');
          setIsLoading(false);
          return;
        }
        const res = await registerUser(username.trim(), email.trim(), password, fullName.trim());
        localStorage.setItem('vault_token', res.token);
        localStorage.setItem('vault_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        if (!username.trim() || !password.trim()) {
          setError('Please enter your username/email and password.');
          setIsLoading(false);
          return;
        }
        const res = await loginUser(username.trim(), password);
        localStorage.setItem('vault_token', res.token);
        localStorage.setItem('vault_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUsername, demoPass) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginUser(demoUsername, demoPass);
      localStorage.setItem('vault_token', res.token);
      localStorage.setItem('vault_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError('Demo login failed. Please try manual login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2620]/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#1C2620]/20 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header Hero Banner */}
        <div className="bg-[#28493F] p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight">DocVault Records</h2>
          <p className="font-sans text-xs text-white/80 mt-1">
            Secure Multi-Tenant AI Document Vault & Archival System
          </p>

          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded hover:bg-white/10"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#1C2620]/15 bg-[#f8faf4]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              !isRegister 
                ? 'bg-white text-[#28493F] border-b-2 border-[#28493F]' 
                : 'text-[#1C2620]/60 hover:text-[#1C2620]'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              isRegister 
                ? 'bg-white text-[#28493F] border-b-2 border-[#28493F]' 
                : 'text-[#1C2620]/60 hover:text-[#1C2620]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-[#B4402F]/10 border border-[#B4402F]/30 rounded text-xs text-[#B4402F] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#1C2620]/70 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#1C2620]/40 absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Anandha Kaarthick"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#1C2620]/25 rounded text-sm text-[#1C2620] focus:outline-none focus:border-[#28493F] focus:ring-1 focus:ring-[#28493F]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#1C2620]/70 mb-1">
              {isRegister ? 'Username' : 'Username or Email'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#1C2620]/40 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegister ? "anandha" : "anandha or email@example.com"}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#1C2620]/25 rounded text-sm text-[#1C2620] focus:outline-none focus:border-[#28493F] focus:ring-1 focus:ring-[#28493F]"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#1C2620]/70 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#1C2620]/40 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anandha@docvault.io"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#1C2620]/25 rounded text-sm text-[#1C2620] focus:outline-none focus:border-[#28493F] focus:ring-1 focus:ring-[#28493F]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#1C2620]/70 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#1C2620]/40 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#1C2620]/25 rounded text-sm text-[#1C2620] focus:outline-none focus:border-[#28493F] focus:ring-1 focus:ring-[#28493F]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 font-mono text-xs uppercase tracking-wider rounded font-bold shadow transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing...</span>
              </>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4 text-white" />
                <span>Register Account</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Sign In To Vault</span>
              </>
            )}
          </button>

          {/* 1-Click Quick Demo Accounts Bar */}
          {!isRegister && (
            <div className="pt-3 border-t border-[#1C2620]/15 space-y-2">
              <p className="font-mono text-[10px] text-center uppercase tracking-widest text-[#1C2620]/60 font-bold">
                ⚡ Quick 1-Click Demo Logins
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('anandha', 'password123')}
                  className="px-2.5 py-1.5 bg-[#f8faf4] hover:bg-[#28493F]/10 text-[#28493F] border border-[#28493F]/30 rounded font-mono text-xs font-bold text-center truncate"
                >
                  👤 Anandha S.
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('demo_user', 'password123')}
                  className="px-2.5 py-1.5 bg-[#f8faf4] hover:bg-[#28493F]/10 text-[#28493F] border border-[#28493F]/30 rounded font-mono text-xs font-bold text-center truncate"
                >
                  👤 Demo User
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="bg-[#f8faf4] p-3 text-center border-t border-[#1C2620]/10">
          <p className="text-[11px] font-mono text-[#1C2620]/60">
            Vault Isolation: User document records are isolated per user profile.
          </p>
        </div>
      </div>
    </div>
  );
}
