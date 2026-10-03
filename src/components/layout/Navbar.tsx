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
      label: 'Staff Gate',
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
    <header className="sticky top-3 sm:top-4 z-40 px-3 sm:px-6 lg:px-8 pointer-events-none transition-all">
      <div className="max-w-6xl mx-auto rounded-full bg-[#FFFFFF]/92 backdrop-blur-xl border border-[#C5A059]/25 shadow-[0_8px_30px_rgba(197,160,89,0.08),0_1px_3px_rgba(0,0,0,0.03)] p-1.5 px-3 sm:px-4 pointer-events-auto">
        <div className="flex items-center justify-between h-11 sm:h-12 gap-3 sm:gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onChangeView('events')}
              className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer select-none"
            >
              <div className="w-6 h-6 rounded-full bg-[#0B0F17] text-[#D4AF37] border border-[#C5A059]/30 flex items-center justify-center shadow-xs">
                <Ticket className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <span className="font-semibold text-xs sm:text-sm tracking-tight text-[#111111] flex items-center gap-1.5">
                TicketPass
                <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#8F681B] font-medium px-1.5 py-0.5 rounded-full bg-[#FDF8EE] border border-[#C5A059]/25">Direct</span>
              </span>
            </motion.button>

            {/* Desktop Segmented Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-[#0B0F17]/[0.03] p-1 rounded-full border border-[#C5A059]/15 relative">
              {navTabs
                .filter((tab) => tab.show)
                .map((tab) => {
                  const isActive = currentView === tab.id;
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onChangeView(tab.id)}
                      className={`relative px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer z-10 select-none ${
                        isActive
                          ? 'text-[#0B0F17] font-semibold'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="navbar-active-pill"
                          className="absolute inset-0 rounded-full bg-white border border-[#C5A059]/35 -z-10 shadow-[0_2px_8px_rgba(197,160,89,0.12)]"
                          transition={{ type: 'spring', bounce: 0.12, duration: 0.3 }}
                        />
                      )}
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-[#B88B2A]' : 'text-zinc-400'
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
                whileTap={{ scale: 0.98 }}
                onClick={onOpenOnlineBooking}
                title="Simulate Online Client Pass Purchase & QR Generation"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FDF8EE] text-[#111111] hover:text-[#8F681B] border border-[#C5A059]/20 hover:border-[#C5A059]/40 rounded-full text-xs font-medium transition-spring cursor-pointer select-none shadow-xs"
              >
                <Ticket className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span>Simulate Pass</span>
              </motion.button>
            )}

            {/* Quick staff action buttons */}
            {isLoggedIn && (currentUser.role === 'STAFF' || currentUser.role === 'ADMIN') && (
              <>
                <div className="hidden sm:flex items-center gap-1.5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenScanner}
                    title="Scan QR Code"
                    className="group inline-flex items-center justify-between gap-2 pl-3 pr-1.5 py-1 bg-[#0B0F17] hover:bg-[#161B26] text-white border border-[#C5A059]/30 rounded-full text-xs font-medium transition-spring cursor-pointer select-none shadow-xs"
                  >
                    <span>Scan QR</span>
                    <span className="w-5 h-5 rounded-full bg-[#C5A059] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Camera className="w-3 h-3 text-white" />
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenAssistedPurchase}
                    title="Staff Assisted Purchase"
                    className="px-3 py-1 bg-[#FDF8EE] hover:bg-[#F8EED8] text-[#8F681B] border border-[#C5A059]/30 rounded-full text-xs font-medium transition-spring flex items-center gap-1.5 cursor-pointer select-none shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#8F681B]" />
                    <span>Box Office</span>
                  </motion.button>
                </div>
                <div className="h-4 w-px bg-[#C5A059]/20 hidden sm:block mx-0.5" />
              </>
            )}

            {/* Auth Section */}
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-0.5 rounded-full bg-white hover:bg-[#FDF8EE] border border-[#C5A059]/25 hover:border-[#C5A059]/40 transition-colors focus:outline-none cursor-pointer select-none shadow-xs"
                  title="User Profile & Settings"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-5 h-5 rounded-full object-cover border border-[#C5A059]/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#0B0F17] text-[#D4AF37] border border-[#C5A059]/30 flex items-center justify-center text-[10px] font-mono font-medium">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <span className="font-medium text-xs text-[#111111] leading-tight block">
                      {currentUser.name}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#B88B2A]" />
                </motion.button>

                {/* User Profile Dropdown with Double-Bezel Framing */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-60 double-bezel-tray shadow-[0_16px_40px_rgba(0,0,0,0.08)] z-50 text-xs origin-top-right"
                    >
                      <div className="double-bezel-core p-1">
                        <div className="px-3 py-2 border-b border-[#111111]/[0.06]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-mono font-medium text-zinc-400 uppercase tracking-[0.16em] block">
                              Account
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#111111]/[0.04] rounded-full text-[9px] font-mono font-medium text-zinc-700 border border-[#111111]/[0.06]">
                              {currentUser.staffRole || currentUser.role}
                            </span>
                          </div>
                          <span className="font-semibold text-[#111111] text-xs block">
                            {currentUser.name}
                          </span>
                          <span className="text-zinc-500 text-[11px] truncate block">{currentUser.email}</span>
                        </div>

                        <div className="p-1 space-y-0.5">
                          <button
                            onClick={() => {
                              onChangeView('my-tickets');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-zinc-700 hover:text-[#111111] hover:bg-[#F7F6F3] rounded-[8px] transition-colors flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Ticket className="w-3.5 h-3.5 text-zinc-500" />
                            <span>My Digital Passes</span>
                          </button>

                          <button
                            onClick={() => {
                              onOpenSettings?.();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-zinc-700 hover:text-[#111111] hover:bg-[#F7F6F3] rounded-[8px] transition-colors flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Account Settings</span>
                          </button>

                          <button
                            onClick={handleSignOut}
                            className="w-full px-2.5 py-1.5 text-left text-zinc-700 hover:text-[#111111] hover:bg-[#F7F6F3] rounded-[8px] transition-colors flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Sign Out</span>
                          </button>
                        </div>

                        <div className="p-1 border-t border-[#111111]/[0.06]">
                          <button
                            onClick={() => {
                              resetAllData();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-zinc-500 hover:text-[#9F2F2D] hover:bg-[#FDEBEC] rounded-[8px] transition-colors flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Demo Data</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : currentView === 'auth' ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onChangeView('events')}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium text-zinc-700 hover:text-[#111111] bg-white hover:bg-[#F7F6F3] border border-[#111111]/[0.08] transition-spring cursor-pointer select-none shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Browse Events</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onChangeView('auth')}
                className="group inline-flex items-center justify-between gap-2 pl-3.5 pr-1.5 py-1 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-medium transition-spring cursor-pointer select-none shadow-xs"
              >
                <span>Sign In</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <LogIn className="w-3 h-3 text-white" />
                </span>
              </motion.button>
            )}

            {/* Mobile Hamburger Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-[#111111]/[0.05] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Drawer Menu with Double-Bezel Architecture */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-[#111111]/[0.06] pt-2 pb-1 space-y-1 overflow-hidden"
            >
              <button
                onClick={() => {
                  onChangeView('events');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-full text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentView === 'events'
                    ? 'bg-[#111111] text-white font-semibold'
                    : 'text-zinc-700 hover:bg-[#111111]/[0.04]'
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
                className={`w-full p-2.5 rounded-full text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentView === 'my-tickets'
                    ? 'bg-[#111111] text-white font-semibold'
                    : 'text-zinc-700 hover:bg-[#111111]/[0.04]'
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
                  className="w-full p-2.5 rounded-full text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer bg-white hover:bg-[#F7F6F3] text-[#111111] border border-[#111111]/[0.08]"
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
                  className={`w-full p-2.5 rounded-full text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentView === 'staff'
                      ? 'bg-[#111111] text-white font-semibold'
                      : 'text-zinc-700 hover:bg-[#111111]/[0.04]'
                  }`}
                >
                  <Camera className="w-4 h-4 text-zinc-500" />
                  <span>Staff Gate Checkpoint</span>
                </button>
              )}

              {isLoggedIn && currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    onChangeView('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-full text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-[#111111] text-white font-semibold'
                      : 'text-zinc-700 hover:bg-[#111111]/[0.04]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Console</span>
                </button>
              )}

              <div className="pt-2 border-t border-[#111111]/[0.06] my-1 space-y-1">
                {isLoggedIn ? (
                  <>
                    <div className="px-3 py-2 text-xs bg-[#111111]/[0.02] rounded-xl border border-[#111111]/[0.06] mb-1">
                      <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-[0.16em] block">Signed In</span>
                      <p className="font-semibold text-[#111111]">{currentUser.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        onOpenSettings?.();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full p-2 rounded-lg text-left text-xs font-medium text-zinc-700 hover:text-[#111111] hover:bg-[#111111]/[0.04] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-zinc-500" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full p-2 rounded-lg text-left text-xs font-medium text-zinc-700 hover:text-[#9F2F2D] hover:bg-[#FDEBEC] flex items-center gap-2 transition-colors cursor-pointer"
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
                    className={`w-full p-2.5 rounded-full text-left text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                      currentView === 'auth'
                        ? 'bg-[#111111] text-white'
                        : 'text-zinc-700 hover:bg-[#111111]/[0.04]'
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
      </div>
    </header>
  );
};
