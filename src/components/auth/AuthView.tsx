import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ticket,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { useTicketContext } from '../../context/TicketContext';
import { User, UserRole } from '../../types';

interface AuthViewProps {
  onAuthSuccess: (role: UserRole) => void;
  onBrowseAsGuest: () => void;
  authNotice?: string | null;
  pendingEventName?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  onBrowseAsGuest,
  authNotice,
  pendingEventName,
}) => {
  const { users, switchUser, login, register, currentUser, isLoggedIn, logout } = useTicketContext();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In state
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    if (!signInIdentifier.trim()) {
      setSignInError('Please enter your email address or phone number.');
      return;
    }

    const success = login(signInIdentifier);
    if (success) {
      const loggedUser = users.find(
        (u) =>
          u.email.toLowerCase() === signInIdentifier.trim().toLowerCase() ||
          u.phone.replace(/\s+/g, '') === signInIdentifier.trim().replace(/\s+/g, '') ||
          u.id.toLowerCase() === signInIdentifier.trim().toLowerCase()
      );
      const targetRole = loggedUser ? loggedUser.role : 'CUSTOMER';
      onAuthSuccess(targetRole);
    } else {
      setSignInError(
        'Account not found. Select a demo persona or enter a registered email (chandara@gmail.com).'
      );
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPhone.trim()) {
      setSignUpError('Please complete all required fields.');
      return;
    }

    if (!signUpPassword) {
      setSignUpError('Please enter a password.');
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please verify.');
      return;
    }

    // Check if email already exists
    const existing = users.find(
      (u) => u.email.toLowerCase() === signUpEmail.trim().toLowerCase()
    );
    if (existing) {
      setSignUpError('An account with this email address already exists. Please sign in.');
      return;
    }

    const newUser = register({
      name: signUpName.trim(),
      email: signUpEmail.trim(),
      phone: signUpPhone.trim(),
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    onAuthSuccess(newUser.role);
  };

  const handleSelectDemoPersona = (persona: User) => {
    switchUser(persona.id);
    onAuthSuccess(persona.role);
  };

  const handleAutofillPersona = (persona: User) => {
    setSignInIdentifier(persona.email);
    setSignInPassword('password123');
    setSignInError(null);
    setMode('signin');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="space-y-1 text-center max-w-sm mx-auto">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-[#111111]">
          Account Access
        </h1>
        <p className="text-xs text-[#787774]">
          Sign in to your wallet or select a demo account
        </p>
      </div>

      {/* Guest Booking Gate Notice */}
      {authNotice && (
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 flex items-center justify-between text-xs text-[#111111] shadow-2xs">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-zinc-600 shrink-0" />
            <span>{authNotice}</span>
          </div>
          {pendingEventName && (
            <span className="font-mono text-[11px] font-medium text-[#111111] bg-[#F7F6F3] px-2 py-0.5 rounded-[4px] border border-[#EAEAEA]">
              {pendingEventName}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Double-Bezel Auth Card */}
        <div className="lg:col-span-6 double-bezel-tray-lg shadow-sm">
          <div className="double-bezel-core-lg p-6 sm:p-8 space-y-6">
            {/* Active Session Notice if already signed in */}
            {isLoggedIn && (
              <div className="p-4 bg-[#FBFBFA] border border-[#111111]/[0.06] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#111111]/[0.08]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono font-medium text-sm shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-zinc-400 font-mono uppercase tracking-wider">
                        Signed In
                      </span>
                      <span className="px-2 py-0.5 bg-[#111111]/[0.04] text-zinc-700 rounded-full text-[9px] font-mono font-medium border border-[#111111]/[0.06]">
                        {currentUser.staffRole || currentUser.role}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#111111]">{currentUser.name}</p>
                    <p className="text-xs text-[#787774] truncate max-w-[200px]">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onAuthSuccess(currentUser.role)}
                    className="px-4 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-medium transition cursor-pointer active:scale-[0.98] shadow-xs"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-1.5 bg-white hover:bg-[#F7F6F3] text-zinc-700 border border-[#111111]/[0.08] rounded-full text-xs font-medium transition cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Segmented Mode Selector */}
            <div className="relative flex bg-[#111111]/[0.03] p-1 rounded-full border border-[#111111]/[0.05] text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setSignInError(null);
                }}
                className={`relative flex-1 py-1.5 px-4 rounded-full transition-colors cursor-pointer z-10 ${
                  mode === 'signin'
                    ? 'text-[#111111] font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {mode === 'signin' && (
                  <motion.div
                    layoutId="auth-active-tab-pill"
                    className="absolute inset-0 bg-white rounded-full border border-[#111111]/[0.06] shadow-xs -z-10"
                    transition={{ type: 'spring', bounce: 0.12, duration: 0.28 }}
                  />
                )}
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setSignUpError(null);
                }}
                className={`relative flex-1 py-1.5 px-4 rounded-full transition-colors cursor-pointer z-10 ${
                  mode === 'signup'
                    ? 'text-[#111111] font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {mode === 'signup' && (
                  <motion.div
                    layoutId="auth-active-tab-pill"
                    className="absolute inset-0 bg-white rounded-full border border-[#111111]/[0.06] shadow-xs -z-10"
                    transition={{ type: 'spring', bounce: 0.12, duration: 0.28 }}
                  />
                )}
                <span>Create Account</span>
              </button>
            </div>

          {/* Form Container with Smooth Slide & Fade Transition */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            className="relative overflow-hidden"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {mode === 'signin' ? (
                <motion.form
                  key="signin-form"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onSubmit={handleSignInSubmit}
                  className="space-y-4 w-full"
                >
                  {signInError && (
                    <div className="p-3 bg-[#FDEBEC] border border-[#F8D7DA] text-[#9F2F2D] rounded-[6px] text-xs font-medium">
                      {signInError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={signInIdentifier}
                        onChange={(e) => setSignInIdentifier(e.target.value)}
                        placeholder="chandara@gmail.com or 012 345 678"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-700">
                        Password
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">Any demo password</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="group w-full py-2.5 pl-6 pr-2 bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-full transition-spring flex items-center justify-between text-xs cursor-pointer mt-2 active:scale-[0.98] shadow-xs"
                  >
                    <span>Sign In to Wallet</span>
                    <span className="btn-nested-icon w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </span>
                  </button>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={onBrowseAsGuest}
                      className="text-xs text-[#787774] hover:text-[#111111] transition font-medium cursor-pointer"
                    >
                      Continue browsing events as Guest &rarr;
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onSubmit={handleSignUpSubmit}
                  className="space-y-4 w-full"
                >
                  {signUpError && (
                    <div className="p-3 bg-[#FDEBEC] border border-[#F8D7DA] text-[#9F2F2D] rounded-[6px] text-xs font-medium">
                      {signUpError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Chan Dara"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-700">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="chandara@gmail.com"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-700">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={signUpPhone}
                          onChange={(e) => setSignUpPhone(e.target.value)}
                          placeholder="012 345 678"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-700">
                        Create Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          required
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full pl-9 pr-9 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                        >
                          {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-700">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showSignUpConfirmPassword ? 'text' : 'password'}
                          required
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-9 pr-9 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                        >
                          {showSignUpConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="group w-full py-2.5 pl-6 pr-2 bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-full transition-spring flex items-center justify-between text-xs cursor-pointer mt-2 active:scale-[0.98] shadow-xs"
                  >
                    <span>Create Verified Account</span>
                    <span className="btn-nested-icon w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UserCheck className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={onBrowseAsGuest}
                      className="text-xs text-[#787774] hover:text-[#111111] transition font-medium cursor-pointer"
                    >
                      Continue browsing events as Guest &rarr;
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
          </div>
        </div>

        {/* Right Column: Demo Personas */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-medium text-[#111111]">
              Demo Accounts
            </h3>
            <span className="text-xs text-[#787774] font-mono">
              One-click sign in
            </span>
          </div>

          {/* Demo Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((persona) => {
              const isCurrent = currentUser.id === persona.id;

              const roleTag =
                persona.role === 'ADMIN'
                  ? 'Admin'
                  : persona.role === 'STAFF'
                  ? persona.staffRole === 'SENIOR_STAFF'
                    ? 'Senior Staff'
                    : 'Staff'
                  : 'Customer';

              const badgeColor =
                persona.role === 'ADMIN'
                  ? 'bg-[#FBF3DB] text-[#956400] border-[#F6E7B9]'
                  : persona.role === 'STAFF'
                  ? 'bg-[#E1F3FE] text-[#1F6C9F] border-[#CDE9FD]'
                  : 'bg-[#EDF3EC] text-[#346538] border-[#DBEADB]';

              return (
                <div
                  key={persona.id}
                  className={`double-bezel-tray transition-all duration-200 ${
                    isCurrent
                      ? 'border-[#111111]/30 ring-1 ring-[#111111]/40'
                      : 'hover:border-[#111111]/25 hover:shadow-xs'
                  }`}
                >
                  <div className="double-bezel-core p-4 space-y-3 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {persona.avatar ? (
                          <img
                            src={persona.avatar}
                            alt={persona.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#111111]/[0.08] shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono font-medium text-xs shrink-0">
                            {persona.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs text-[#111111] truncate">
                            {persona.name}
                          </h4>
                          <span
                            className="text-[11px] text-[#787774] truncate block font-mono"
                            title={persona.email}
                          >
                            {persona.email}
                          </span>
                        </div>
                      </div>

                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium border ${badgeColor}`}>
                        {roleTag}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#111111]/[0.06] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleAutofillPersona(persona)}
                        className="text-[11px] text-[#787774] hover:text-[#111111] transition cursor-pointer font-mono"
                      >
                        Autofill
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectDemoPersona(persona)}
                        className="py-1 px-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-medium transition cursor-pointer active:scale-[0.98] shadow-xs"
                      >
                        <span>Sign In</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
