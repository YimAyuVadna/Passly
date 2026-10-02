import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ticket,
  Camera,
  ShoppingBag,
  Shield,
  RotateCcw,
  Menu,
  X,
  Compass,
  ChevronDown,
  LogIn,
  LogOut,
  Settings,
} from 'lucide-react';
import { useTicketContext } from '../../context/TicketContext';

interface NavbarProps {
  currentView: 'events' | 'my-tickets' | 'staff' | 'admin' | 'auth';
  onChangeView: (view: 'events' | 'my-tickets' | 'staff' | 'admin' | 'auth') => void;
  onOpenScanner: () => void;
  onOpenAssistedPurchase: () => void;
  onOpenSettings?: () => void;
  onOpenOnlineBooking?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  onOpenScanner,
  onOpenAssistedPurchase,
  onOpenSettings,
  onOpenOnlineBooking,
}) => {
  const { currentUser, isLoggedIn, logout, resetAllData } = useTicketContext();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    onChangeView('auth');
    setIsUserMenuOpen(false);
  };

  const navTabs = [
    { id: 'events' as const, label: 'Explore', icon: Compass, show: true },
    { id: 'my-tickets' as const, label: 'My Passes', icon: Ticket, show: true },
    {
      id: 'staff' as const,
      label: 'Staff Portal',
      icon: Camera,
      show: isLoggedIn && (currentUser.role === 'STAFF' || currentUser.role === 'ADMIN'),
    },
    {
      id: 'admin' as const,
      label: 'Console',
      icon: Shield,
      show: isLoggedIn && currentUser.role === 'ADMIN',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-7">
            <motion.button
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChangeView('events')}
              className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer select-none"
            >
              <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-950">
                TicketPass
              </span>
            </motion.button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5 bg-zinc-100/70 p-1 rounded-lg border border-zinc-200/60 relative">
              {navTabs
                .filter((tab) => tab.show)
                .map((tab) => {
                  const isActive = currentView === tab.id;
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onChangeView(tab.id)}
                      className={`relative px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer z-10 select-none ${
                        isActive
                          ? tab.id === 'admin'
                            ? 'text-white'
                            : 'text-zinc-950 font-semibold'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="navbar-active-pill"
                          className={`absolute inset-0 rounded-md shadow-xs -z-10 ${
                            tab.id === 'admin'
                              ? 'bg-zinc-900'
                              : 'bg-white border border-zinc-200/70'
                          }`}
                          transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
                        />
                      )}
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive && tab.id === 'admin'
                            ? 'text-zinc-300'
                            : isActive
                            ? 'text-zinc-900'
                            : 'text-zinc-400'
                        }`}
                      />
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
            </nav>
          </div>

          {/* Right Action Group */}
          <div className="flex items-center gap-2">
            {/* Buy Pass Online Simulation Button */}
            {onOpenOnlineBooking && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onOpenOnlineBooking}
                title="Simulate Online Client Pass Purchase & QR Generation"
                className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-md text-xs font-medium transition cursor-pointer select-none flex items-center gap-1.5 shadow-2xs"
              >
                <Ticket className="w-3.5 h-3.5 text-zinc-600" />
                <span>Simulate Pass</span>
              </motion.button>
            )}

            {/* Quick staff action buttons */}
            {isLoggedIn && (currentUser.role === 'STAFF' || currentUser.role === 'ADMIN') && (
              <>
                <div className="hidden sm:flex items-center gap-1.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onOpenScanner}
                    title="Scan QR Code"
                    className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer select-none shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Scan QR</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onOpenAssistedPurchase}
                    title="Staff Assisted Purchase"
                    className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Assisted Sale</span>
                  </motion.button>
                </div>
                <div className="h-4 w-px bg-zinc-200 hidden sm:block mx-0.5" />
              </>
            )}

            {/* Auth Section */}
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-white hover:bg-zinc-50 border border-zinc-200 transition-colors focus:outline-none cursor-pointer select-none"
                  title="User Profile & Settings"
                >
                  <img
                    src={
                      currentUser.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left hidden lg:block">
                    <span className="font-medium text-xs text-zinc-900 leading-tight block">
                      {currentUser.name}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </motion.button>

                {/* User Profile Dropdown with AnimatePresence */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50 text-xs origin-top-right"
                    >
                      <div className="px-4 py-2.5 border-b border-zinc-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                            Account
                          </span>
                          <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-[10px] font-mono font-medium text-zinc-700">
                            {currentUser.staffRole || currentUser.role}
                          </span>
                        </div>
                        <span className="font-bold text-zinc-900 text-sm block">
                          {currentUser.name}
                        </span>
                        <span className="text-zinc-500 text-[11px] truncate block">{currentUser.email}</span>
                      </div>

                      <div className="p-1.5 space-y-0.5">
                        <button
                          onClick={() => {
                            onChangeView('my-tickets');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                        >
                          <Ticket className="w-4 h-4 text-zinc-500" />
                          <span>My Passes</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenSettings?.();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-zinc-500" />
                          <span>Account Settings</span>
                        </button>

                        <button
                          onClick={handleSignOut}
                          className="w-full px-3 py-2 text-left text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-zinc-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                      <div className="p-1.5 border-t border-zinc-100">
                        <button
                          onClick={() => {
                            resetAllData();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset All Demo Data</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : currentView === 'auth' ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onChangeView('events')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-700 hover:text-zinc-950 bg-zinc-100/80 hover:bg-zinc-200/70 border border-zinc-200/60 transition-colors cursor-pointer select-none"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Browse Events</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onChangeView('auth')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer select-none"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </motion.button>
            )}

            {/* Mobile Hamburger Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu with AnimatePresence */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-b border-zinc-200/80 bg-white/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1 overflow-hidden"
          >
            <button
              onClick={() => {
                onChangeView('events');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                currentView === 'events'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore Events</span>
            </button>

            <button
              onClick={() => {
                onChangeView('my-tickets');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                currentView === 'my-tickets'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>My Digital Passes</span>
            </button>

            {onOpenOnlineBooking && (
              <button
                onClick={() => {
                  onOpenOnlineBooking();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 border border-zinc-200/60"
              >
                <Ticket className="w-4 h-4 text-zinc-700" />
                <span>Simulate Pass</span>
              </button>
            )}

            {isLoggedIn && (currentUser.role === 'STAFF' || currentUser.role === 'ADMIN') && (
              <button
                onClick={() => {
                  onChangeView('staff');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentView === 'staff'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Camera className="w-4 h-4 text-zinc-500" />
                <span>Staff Portal</span>
              </button>
            )}

            {isLoggedIn && currentUser.role === 'ADMIN' && (
              <button
                onClick={() => {
                  onChangeView('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </button>
            )}

            <div className="pt-2 border-t border-zinc-200/60 my-1 space-y-1">
              {isLoggedIn ? (
                <>
                  <div className="px-3 py-2 text-xs border-b border-zinc-100 mb-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Signed In As</span>
                    <p className="font-bold text-zinc-900">{currentUser.name}</p>
                    <p className="text-[11px] text-zinc-500">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenSettings?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl text-left text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-zinc-500" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl text-left text-xs font-medium text-zinc-700 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onChangeView('auth');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentView === 'auth'
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
