import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  LogIn,
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  onLogout: () => void;
  onUpdateName?: (newName: string) => void;
}

const STORAGE_USERS_KEY = 'jarvis_registered_users_db';
const STORAGE_CURRENT_USER_KEY = 'jarvis_current_auth_user';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onUpdateName,
}) => {
  const [email, setEmail] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Auto-clean any legacy test accounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Talha' && (parsed.email === 'talha@jarvis.ai' || !parsed.email)) {
          localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setEditNameInput(currentUser.name);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // Local user storage helper
  const getRegisteredUsers = (): Array<AuthUser & { passwordHash?: string }> => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveRegisteredUsers = (users: Array<AuthUser & { passwordHash?: string }>) => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users database:', e);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Please enter a password of your choice.');
      return;
    }

    // Determine callsign: user provided name or derived from email
    const emailPrefix = cleanEmail.split('@')[0] || 'Commander';
    const fallbackName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    const chosenName = userNameInput.trim() || fallbackName;

    const users = getRegisteredUsers();
    let existingUser = users.find((u) => u.email === cleanEmail);

    if (!existingUser) {
      // Automatically register new session with user's chosen email, name, and password
      existingUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: chosenName,
        email: cleanEmail,
        passwordHash: cleanPassword,
        createdAt: new Date().toISOString(),
      };
      users.push(existingUser);
      saveRegisteredUsers(users);
    } else {
      // Update password and update name if the user supplied a custom name
      existingUser.passwordHash = cleanPassword;
      if (userNameInput.trim()) {
        existingUser.name = chosenName;
      }
      saveRegisteredUsers(users);
    }

    const authSession: AuthUser = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      createdAt: existingUser.createdAt,
    };

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(authSession));
    if (onUpdateName) {
      onUpdateName(authSession.name);
    }
    onLogin(authSession);
    setSuccessMessage(`Access authorized. JARVIS will address you as ${authSession.name}.`);
    setTimeout(() => {
      onClose();
      setSuccessMessage(null);
    }, 700);
  };

  const handleSaveNameEdit = () => {
    const trimmed = editNameInput.trim();
    if (!trimmed || !currentUser) return;

    const updatedUser: AuthUser = {
      ...currentUser,
      name: trimmed,
    };

    const users = getRegisteredUsers();
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx].name = trimmed;
      saveRegisteredUsers(users);
    }

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
    if (onUpdateName) {
      onUpdateName(trimmed);
    }
    onLogin(updatedUser);
    setIsEditingName(false);
    setSuccessMessage(`Callsign updated to ${trimmed}.`);
    setTimeout(() => setSuccessMessage(null), 1800);
  };

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    onLogout();
    setEmail('');
    setUserNameInput('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#050a17] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.18)] overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-[#061126]/60 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-xs sm:text-sm text-cyan-300 tracking-[0.2em] glow-cyan-sm">
                JARVIS AUTHENTICATION
              </h3>
              <p className="text-[10px] font-mono-tech text-cyan-400/70">
                {currentUser ? 'ACTIVE USER SESSION' : 'SIGN IN WITH EMAIL & PASSWORD'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[80vh]">
          {/* Notifications */}
          {successMessage && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono-tech">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono-tech">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* IF CURRENTLY SIGNED IN */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#071124] border border-cyan-500/25 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-950/60 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 text-base font-orbitron font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-orbitron font-semibold text-sm sm:text-base text-cyan-200 truncate">
                        {currentUser.name}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono-tech bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        SIGNED IN
                      </span>
                    </div>
                    <p className="text-xs font-mono-tech text-zinc-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-cyan-500/15 text-[11px] font-mono-tech text-cyan-300/80 flex items-center justify-between">
                  <span>JARVIS CALLSIGN:</span>
                  <span className="font-bold text-cyan-200">{currentUser.name}</span>
                </div>
              </div>

              {/* Edit Callsign */}
              <div className="p-3.5 rounded-xl bg-[#060e1d] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-rajdhani font-semibold text-cyan-300">
                    JARVIS Name / Callsign
                  </span>
                  {!isEditingName && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-[11px] font-mono-tech text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editNameInput}
                      onChange={(e) => setEditNameInput(e.target.value)}
                      placeholder="Enter callsign or name"
                      className="flex-1 px-3 py-1.5 bg-[#030610] border border-cyan-500/40 rounded-lg text-xs text-cyan-100 font-mono-tech focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNameEdit}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs font-mono-tech transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditNameInput(currentUser.name);
                        setIsEditingName(false);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] font-rajdhani text-zinc-400">
                    JARVIS will address you as &quot;{currentUser.name}&quot; in voice responses.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-mono-tech transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>SIGN OUT</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs font-mono-tech transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          ) : (
            /* SIGN IN FORM (ONLY EMAIL & ANY PASSWORD OF CHOICE) */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300 font-mono-tech">
                Enter any email and any password of your choice to sign in.
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech text-cyan-400/80 mb-1.5 uppercase">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-cyan-500/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#030713] border border-cyan-500/25 rounded-xl text-xs text-cyan-100 placeholder-zinc-600 font-mono-tech focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech text-cyan-400/80 mb-1.5 uppercase flex items-center justify-between">
                  <span>Your Name / Callsign (Aapka Naam)</span>
                  <span className="text-[10px] text-cyan-400/60 lowercase font-normal">optional</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-cyan-500/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    placeholder="e.g. Talha, Boss, or your preferred name"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#030713] border border-cyan-500/25 rounded-xl text-xs text-cyan-100 placeholder-zinc-600 font-mono-tech focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono-tech">
                  JARVIS will address you directly by this name in all voice and text responses.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech text-cyan-400/80 mb-1.5 uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cyan-500/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter any password of your choice"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#030713] border border-cyan-500/25 rounded-xl text-xs text-cyan-100 placeholder-zinc-600 font-mono-tech focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-cyan-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-orbitron font-bold text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_16px_rgba(0,240,255,0.3)] mt-2 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>SIGN IN TO JARVIS</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
