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

      {/* Mobile Docked Minimalist Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-zinc-200/90 py-1 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            type="button"
            onClick={() => setCurrentView('events')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer select-none ${
              currentView === 'events' ? 'text-zinc-950 font-medium' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px]">Events</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('my-tickets')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer select-none ${
              currentView === 'my-tickets' ? 'text-zinc-950 font-medium' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            <span className="text-[10px]">Passes</span>
          </button>

          {/* Center Scan QR button for staff and admin */}
          {isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN') && (
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center w-8 h-8 bg-zinc-950 text-white rounded-md hover:bg-zinc-800 transition-colors cursor-pointer select-none"
              title="Scan QR"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {isLoggedIn && (currentRole === 'STAFF' || currentRole === 'ADMIN') && (
            <button
              type="button"
              onClick={() => setCurrentView(currentRole === 'ADMIN' ? 'admin' : 'staff')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer select-none ${
                currentView === 'staff' || currentView === 'admin'
                  ? 'text-zinc-950 font-medium'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {currentRole === 'ADMIN' ? <Shield className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              <span className="text-[10px]">{currentRole === 'ADMIN' ? 'Console' : 'Staff'}</span>
            </button>
          )}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 transition-colors cursor-pointer text-zinc-600 hover:text-zinc-900 select-none"
              title={`Account Settings (${currentUser.name})`}
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser.name}
                className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-200"
              />
              <span className="text-[10px] font-medium truncate max-w-[48px]">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentView('auth')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer select-none ${
                currentView === 'auth' ? 'text-zinc-950 font-medium' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="text-[10px]">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Minimalist Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-8 px-4 text-xs text-zinc-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-xs text-zinc-900 tracking-tight">
              TicketPass
            </span>
            <span className="text-zinc-300">/</span>
            <p className="text-zinc-500 text-xs">Direct digital ticketing and checkpoint admission</p>
          </div>
          <div className="flex items-center gap-4 text-zinc-400 text-xs">
            <span>Events</span>
            <span>•</span>
            <span>Passes</span>
            <span>•</span>
            <span>Gate Checkpoint</span>
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
