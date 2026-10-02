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
        'Account not found. Select a demo persona on the right or enter a registered email (e.g. chandara@gmail.com).'
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
      setSignUpError('Please create a password.');
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please ensure both passwords match.');
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
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
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
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="space-y-1 text-center max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Account Access
        </h1>
        <p className="text-xs text-zinc-500">
          Sign in to your wallet or select a demo account
        </p>
      </div>

      {/* Guest Booking Gate Notice */}
      {authNotice && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between text-xs text-zinc-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-zinc-600 shrink-0" />
            <span>{authNotice}</span>
          </div>
          {pendingEventName && (
            <span className="font-medium text-zinc-900 font-mono text-[11px]">
              {pendingEventName}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Auth Card (Tabs: Sign In / Create Account) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-zinc-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Active Session Notice if already signed in */}
          {isLoggedIn && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    currentUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                  }
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-zinc-400">
                      Signed In
                    </span>
                    <span className="px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded text-[10px] font-mono font-medium">
                      {currentUser.staffRole || currentUser.role}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{currentUser.name}</p>
                  <p className="text-xs text-zinc-500 truncate max-w-[200px]">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onAuthSuccess(currentUser.role)}
                  className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition cursor-pointer"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-md text-xs font-medium transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Segmented Mode Selector */}
          <div className="relative flex bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setSignInError(null);
              }}
              className={`relative flex-1 py-2 px-4 rounded-md transition-colors cursor-pointer z-10 ${
                mode === 'signin'
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {mode === 'signin' && (
                <motion.div
                  layoutId="auth-active-tab-pill"
                  className="absolute inset-0 bg-white rounded-md shadow-xs border border-zinc-200/80 -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
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
              className={`relative flex-1 py-2 px-4 rounded-md transition-colors cursor-pointer z-10 ${
                mode === 'signup'
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {mode === 'signup' && (
                <motion.div
                  layoutId="auth-active-tab-pill"
                  className="absolute inset-0 bg-white rounded-md shadow-xs border border-zinc-200/80 -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                />
              )}
              <span>Create Account</span>
            </button>
          </div>

          {/* Form Container with Smooth Slide & Fade Transition */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } }}
            className="relative overflow-hidden"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {mode === 'signin' ? (
                <motion.form
                  key="signin-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onSubmit={handleSignInSubmit}
                  className="space-y-4 w-full"
                >
                  {signInError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-medium">
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
                        placeholder="e.g. chandara@gmail.com or 012 345 678"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-700">
                        Password
                      </label>
                      <span className="text-[10px] text-zinc-400">Any demo password</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
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
                    className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-md transition shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={onBrowseAsGuest}
                      className="text-xs text-zinc-400 hover:text-zinc-900 transition font-medium cursor-pointer"
                    >
                      Continue browsing events as Guest &rarr;
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onSubmit={handleSignUpSubmit}
                  className="space-y-4 w-full"
                >
                  {signUpError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-medium">
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
                        placeholder="e.g. Chan Dara"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
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
                          className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
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
                          className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-md text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
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
                          className="w-full pl-9 pr-9 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
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
                          className="w-full pl-9 pr-9 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
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
                    className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-md transition shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={onBrowseAsGuest}
                      className="text-xs text-zinc-400 hover:text-zinc-900 transition font-medium cursor-pointer"
                    >
                      Continue browsing events as Guest &rarr;
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Column: Demo Personas */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-zinc-900">
              Demo Accounts
            </h3>
            <span className="text-xs text-zinc-400">
              Instant login
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

              return (
                <div
                  key={persona.id}
                  className={`bg-white rounded-xl border p-4 space-y-3 transition flex flex-col justify-between ${
                    isCurrent
                      ? 'border-zinc-950 ring-1 ring-zinc-950'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-xs text-zinc-900 truncate">
                          {persona.name}
                        </h4>
                        <span
                          className="text-[11px] text-zinc-400 truncate block"
                          title={persona.email}
                        >
                          {persona.email}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200">
                      {roleTag}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleAutofillPersona(persona)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                    >
                      Autofill
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectDemoPersona(persona)}
                      className="py-1.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition cursor-pointer"
                    >
                      <span>Sign In</span>
                    </button>
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
