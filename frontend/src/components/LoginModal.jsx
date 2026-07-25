import React, { useState } from 'react';
import { Lock, User, Mail, ShieldCheck, ArrowRight, Loader2, KeyRound, UserPlus, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

const extractErrorMessage = (err, fallback = 'Authentication failed.') => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(item => typeof item === 'object' ? (item.msg || JSON.stringify(item)) : String(item)).join(', ');
  }
  if (typeof detail === 'object' && detail !== null) {
    return detail.msg || JSON.stringify(detail);
  }
  return err.message || fallback;
};

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
      setError(extractErrorMessage(err, 'Authentication failed.'));
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
      setError(extractErrorMessage(err, 'Demo login failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF7F2] border-2 border-[#1C2620] rounded-xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300">
        
        {/* Modal Header */}
        <div className="bg-[#28493F] p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Lock className="w-6 h-6 text-[#A3B899]" />
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight">DocVault Workspace</h2>
          <p className="text-xs text-white/80 font-mono mt-1">
            {isRegister ? 'Create your isolated document vault account' : 'Sign in to access your intelligent vault'}
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded text-red-800 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{typeof error === 'string' ? error : String(error)}</span>
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
                  placeholder="Anandha Kaarthick S."
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
                placeholder={isRegister ? "anandha" : "demo or anandha"}
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
              <p className="font-mono text-[10px] text-center uppercase tracking-widest text-[#1C2620]/60 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#28493F]" />
                <span>Explore Live Demo Mode</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('demo', 'demo123')}
                  className="px-2.5 py-2 bg-[#28493F]/10 hover:bg-[#28493F]/20 text-[#28493F] border border-[#28493F]/40 rounded font-mono text-xs font-bold text-center truncate flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  ⚡ Demo User (Sample Vault)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('anandha', 'password123')}
                  className="px-2.5 py-2 bg-[#f8faf4] hover:bg-[#28493F]/10 text-[#28493F] border border-[#28493F]/30 rounded font-mono text-xs font-bold text-center truncate flex items-center justify-center gap-1"
                >
                  👤 Anandha S.
                </button>
              </div>
            </div>
          )}

          {/* Toggle Login/Register */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="font-mono text-xs text-[#28493F] hover:underline font-semibold"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
