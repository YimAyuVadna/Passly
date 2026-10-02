import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TicketProvider,
  useTicketContext,
} from './context/TicketContext';
import { Navbar } from './components/layout/Navbar';
import { EventsCatalogView } from './components/customer/EventsCatalogView';
import { MyTicketsView } from './components/customer/MyTicketsView';
import { EventDetailsModal } from './components/customer/EventDetailsModal';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { DigitalTicketModal } from './components/tickets/DigitalTicketModal';
import { QRScannerModal } from './components/scanner/QRScannerModal';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { StaffAssistedPurchaseModal } from './components/staff/StaffAssistedPurchaseModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthView } from './components/auth/AuthView';
import { UserSettingsModal } from './components/profile/UserSettingsModal';
import { OnlineBookingModal } from './components/customer/OnlineBookingModal';
import { EventItem, TicketType, Ticket, UserRole } from './types';
import { Compass, Ticket as TicketIcon, Camera, Shield, HelpCircle, LogIn } from 'lucide-react';

function AppContent() {
  const { events, tickets, currentUser, isLoggedIn, currentRole } = useTicketContext();

  const [currentView, setCurrentView] = useState<
    'events' | 'my-tickets' | 'staff' | 'admin' | 'auth'
  >('events');

  // Modals state
  const [selectedEventDetails, setSelectedEventDetails] = useState<EventItem | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    event: EventItem;
    ticketType: TicketType;
    quantity: number;
  } | null>(null);
  const [activeDigitalTicket, setActiveDigitalTicket] = useState<Ticket | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialToken, setScannerInitialToken] = useState<string | null>(null);
  const [isOnlineBookingOpen, setIsOnlineBookingOpen] = useState(false);
  const [isAssistedPurchaseOpen, setIsAssistedPurchaseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Guest booking gate state: remembers what a guest tried to book
  const [pendingBooking, setPendingBooking] = useState<{
    event: EventItem;
    ticketType: TicketType;
    quantity: number;
  } | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Tickets in the same order as the active ticket (for multi-pass switcher)
  const orderTickets = activeDigitalTicket
    ? tickets.filter((t) => t.orderId === activeDigitalTicket.orderId)
    : [];

  // Strict Role Guard: Redirect customers and unauthenticated guests away from staff or admin views
  React.useEffect(() => {
    if (!isLoggedIn || currentRole === 'CUSTOMER') {
      if (currentView === 'staff' || currentView === 'admin') {
        setCurrentView('events');
      }
    } else if (currentRole === 'STAFF') {
      if (currentView === 'admin') {
        setCurrentView('staff');
      }
    }
  }, [isLoggedIn, currentRole, currentView]);

  const handleProceedToCheckout = (event: EventItem, ticketType: TicketType, quantity: number) => {
    setSelectedEventDetails(null);
    if (!isLoggedIn) {
      setPendingBooking({ event, ticketType, quantity });
      setAuthNotice(`Please sign in or create an account to book your tickets for "${event.name}".`);
      setCurrentView('auth');
      return;
    }
    setCheckoutData({ event, ticketType, quantity });
  };

  const handleCheckoutSuccess = (newTickets: Ticket[]) => {
    if (newTickets.length > 0) {
      setActiveDigitalTicket(newTickets[0]);
    }
  };

  const handleAuthSuccess = (role: UserRole) => {
    if (pendingBooking) {
      // Resume checkout directly for the pending event
      setCheckoutData(pendingBooking);
      setPendingBooking(null);
      setAuthNotice(null);
      setCurrentView('events');
      return;
    }

    if (role === 'CUSTOMER') {
      setCurrentView('events');
    } else if (role === 'STAFF') {
      setCurrentView('staff');
    } else if (role === 'ADMIN') {
      setCurrentView('admin');
    }
  };

  const handleTestScanTicket = (ticket: Ticket) => {
    setIsOnlineBookingOpen(false);
    setScannerInitialToken(ticket.qrToken);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-zinc-900 pb-20 md:pb-0 selection:bg-zinc-900 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenOnlineBooking={() => setIsOnlineBookingOpen(true)}
        onOpenScanner={() => {
          if (isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN')) {
            setIsScannerOpen(true);
          }
        }}
        onOpenAssistedPurchase={() => {
          if (isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN')) {
            setIsAssistedPurchaseOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'events' && (
          <EventsCatalogView
            events={events}
            onSelectEvent={(ev) => setSelectedEventDetails(ev)}
            onOpenOnlineBooking={() => setIsOnlineBookingOpen(true)}
          />
        )}

        {currentView === 'my-tickets' && (
          <MyTicketsView
            onSelectTicket={(t) => setActiveDigitalTicket(t)}
            onBrowseEvents={() => setCurrentView('events')}
            onSignIn={() => setCurrentView('auth')}
          />
        )}

        {/* Staff Operations: Strictly restricted to authenticated STAFF and ADMIN */}
        {currentView === 'staff' && isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN') && (
          <StaffDashboard
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAssistedPurchase={() => setIsAssistedPurchaseOpen(true)}
            onSelectTicket={(t) => setActiveDigitalTicket(t)}
          />
        )}

        {/* Platform Console: Strictly restricted to authenticated ADMIN */}
        {currentView === 'admin' && isLoggedIn && currentRole === 'ADMIN' && (
          <AdminDashboard />
        )}

        {currentView === 'auth' && (
          <AuthView
            onAuthSuccess={handleAuthSuccess}
            onBrowseAsGuest={() => {
              setAuthNotice(null);
              setPendingBooking(null);
              setCurrentView('events');
            }}
            authNotice={authNotice}
            pendingEventName={pendingBooking?.event.name}
          />
        )}
      </main>

      {/* Modals & Overlays */}
      <EventDetailsModal
        event={selectedEventDetails}
        onClose={() => setSelectedEventDetails(null)}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={checkoutData !== null}
        onClose={() => setCheckoutData(null)}
        event={checkoutData?.event || null}
        ticketType={checkoutData?.ticketType || null}
        quantity={checkoutData?.quantity || 1}
        onSuccessViewTickets={handleCheckoutSuccess}
      />

      <DigitalTicketModal
        ticket={activeDigitalTicket}
        onClose={() => setActiveDigitalTicket(null)}
        allOrderTickets={orderTickets}
        onSelectTicket={(t) => setActiveDigitalTicket(t)}
      />

      {/* Checkpoint Scanner: Staff gate operations or direct Online Booking Test Scanner */}
      <QRScannerModal
        isOpen={
          isScannerOpen &&
          (scannerInitialToken !== null || (isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN')))
        }
        onClose={() => {
          setIsScannerOpen(false);
          setScannerInitialToken(null);
        }}
        initialTokenToScan={scannerInitialToken}
      />

      {/* Online Client Booking & QR Simulation Modal */}
      <OnlineBookingModal
        isOpen={isOnlineBookingOpen}
        onClose={() => setIsOnlineBookingOpen(false)}
        onTestScanTicket={handleTestScanTicket}
      />

      {/* Staff Assisted Purchase Modal: Restricted to authorized staff and admin only */}
      <StaffAssistedPurchaseModal
        isOpen={isAssistedPurchaseOpen && isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN')}
        onClose={() => setIsAssistedPurchaseOpen(false)}
        onViewGeneratedTicket={(t) => setActiveDigitalTicket(t)}
      />

      {/* User Profile & Account Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Mobile Floating Minimalist Navigation Dock */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-40 max-w-sm mx-auto">
        <div className="bg-white/90 backdrop-blur-xl border border-zinc-200/90 py-2 px-3 flex items-center justify-around rounded-full shadow-lg shadow-zinc-950/5">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setCurrentView('events')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
              currentView === 'events' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px]">Events</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setCurrentView('my-tickets')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
              currentView === 'my-tickets' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            <span className="text-[10px]">Passes</span>
          </motion.button>

          {/* Center Scan QR button: strictly visible to staff and admin only */}
          {isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center w-10 h-10 bg-zinc-900 text-white rounded-full shadow-md hover:bg-zinc-800 transition-colors -my-1 cursor-pointer select-none"
              title="Scan QR"
            >
              <Camera className="w-4 h-4" />
            </motion.button>
          )}

          {isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN') && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentView(currentRole === 'ADMIN' ? 'admin' : 'staff')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
                currentView === 'staff' || currentView === 'admin'
                  ? 'text-zinc-900 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {currentRole === 'ADMIN' ? <Shield className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              <span className="text-[10px]">{currentRole === 'ADMIN' ? 'Console' : 'Staff'}</span>
            </motion.button>
          )}

          {isLoggedIn ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsSettingsOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-full transition-colors cursor-pointer text-zinc-600 hover:text-zinc-900 select-none"
              title={`Account Settings (${currentUser.name})`}
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser.name}
                className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-300"
              />
              <span className="text-[10px] font-medium truncate max-w-[48px]">
                {currentUser.name.split(' ')[0]}
              </span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentView('auth')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
                currentView === 'auth' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="text-[10px]">Sign In</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Modern Minimalist Footer */}
      <footer className="border-t border-zinc-200/70 bg-white/60 py-8 px-4 text-xs text-zinc-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">TicketPass</span>
            <span>•</span>
            <p>© 2026 Digital Ticket Buying Platform.</p>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
            <span>Instant Digital Passes</span>
            <span>•</span>
            <span>Verified QR Admission</span>
            <span>•</span>
            <span>Official Box Office</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <TicketProvider>
      <AppContent />
    </TicketProvider>
  );
}
