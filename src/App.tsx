import React, { useState } from 'react';
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
import { useBodyScrollLock } from './utils/scrollLock';

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

  // Top-level umbrella lock for all customer, staff, and order modals
  const isAnyModalOpen = Boolean(
    selectedEventDetails ||
    checkoutData ||
    activeDigitalTicket ||
    isScannerOpen ||
    isOnlineBookingOpen ||
    isAssistedPurchaseOpen ||
    isSettingsOpen
  );
  useBodyScrollLock(isAnyModalOpen);

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
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans text-[#111111] pb-20 md:pb-0 selection:bg-[#111111] selection:text-white">
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

      {/* Main Page Area with Generous Macro-Whitespace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20">
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

      {checkoutData && (
        <CheckoutModal
          key={`checkout-${checkoutData.event.id}-${checkoutData.ticketType.id}-${checkoutData.quantity}`}
          isOpen={true}
          onClose={() => setCheckoutData(null)}
          event={checkoutData.event}
          ticketType={checkoutData.ticketType}
          quantity={checkoutData.quantity}
          onSuccessViewTickets={handleCheckoutSuccess}
        />
      )}

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

      {/* Mobile Floating Island Capsule Dock */}
      <div className="md:hidden fixed bottom-3 inset-x-0 z-40 px-4 pointer-events-none">
        <div className="max-w-xs mx-auto rounded-full bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#111111]/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] py-1.5 px-3 flex items-center justify-around pointer-events-auto">
          <button
            type="button"
            onClick={() => setCurrentView('events')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
              currentView === 'events' ? 'text-[#111111] font-semibold' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[9px] font-medium">Events</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('my-tickets')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
              currentView === 'my-tickets' ? 'text-[#111111] font-semibold' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            <span className="text-[9px] font-medium">Passes</span>
          </button>

          {/* Center Scan QR button for staff and admin */}
          {isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN') && (
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center w-8 h-8 bg-[#111111] text-white rounded-full hover:bg-[#222222] transition-colors cursor-pointer select-none shadow-xs active:scale-95"
              title="Scan QR"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN') && (
            <button
              type="button"
              onClick={() => setCurrentView(currentRole === 'ADMIN' ? 'admin' : 'staff')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
                currentView === 'staff' || currentView === 'admin'
                  ? 'text-[#111111] font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {currentRole === 'ADMIN' ? <Shield className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              <span className="text-[9px] font-medium">{currentRole === 'ADMIN' ? 'Console' : 'Staff'}</span>
            </button>
          )}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-full transition-colors cursor-pointer text-zinc-600 hover:text-[#111111] select-none"
              title={`Account Settings (${currentUser.name})`}
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-4 h-4 rounded-full object-cover border border-[#111111]/[0.08]"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-[#111111] text-white flex items-center justify-center text-[9px] font-mono font-medium">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[9px] font-medium truncate max-w-[48px]">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentView('auth')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-colors cursor-pointer select-none ${
                currentView === 'auth' ? 'text-[#111111] font-semibold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="text-[9px] font-medium">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Utilitarian Editorial Luxury Footer */}
      <footer className="border-t border-[#111111]/[0.06] bg-[#FBFBFA] py-10 px-4 text-xs text-[#787774] mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-mono">
              TP
            </div>
            <span className="font-semibold text-xs text-[#111111] tracking-tight">
              TicketPass
            </span>
            <span className="text-zinc-300">/</span>
            <p className="text-[#787774] text-xs">Direct digital admission pass architecture</p>
          </div>
          <div className="flex items-center gap-4 text-[#787774] text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#346538] animate-pulse" />
              <span className="text-[11px] text-zinc-500">Gate Checkpoint Online</span>
            </div>
            <span className="text-zinc-300">•</span>
            <span className="text-[11px]">Encrypted QR Tokens</span>
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
