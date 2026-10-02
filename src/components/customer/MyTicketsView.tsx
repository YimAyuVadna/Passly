import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Search,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Ticket } from '../../types';
import { useTicketContext } from '../../context/TicketContext';

interface MyTicketsViewProps {
  onSelectTicket: (ticket: Ticket) => void;
  onBrowseEvents: () => void;
  onSignIn?: () => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  onSelectTicket,
  onBrowseEvents,
  onSignIn,
}) => {
  const { tickets, currentUser, isLoggedIn } = useTicketContext();

  const [activeFilter, setActiveFilter] = useState<'UPCOMING' | 'USED' | 'ALL'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mx-auto text-zinc-400 shadow-xs">
          <TicketIcon className="w-8 h-8 text-zinc-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Sign in to view your passes
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Your admission tickets, digital QR passes, and order history will appear here once you sign in to your account.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            Sign In to Wallet
          </button>
          <button
            onClick={onBrowseEvents}
            className="px-5 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Explore Events
          </button>
        </div>
      </div>
    );
  }

  // Filter tickets belonging to current user
  const userTickets = tickets.filter(
    (t) =>
      t.customerId === currentUser.id ||
      t.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      t.customerPhone === currentUser.phone
  );

  const filteredTickets = userTickets.filter((t) => {
    const matchesFilter =
      activeFilter === 'ALL'
        ? true
        : activeFilter === 'UPCOMING'
        ? t.status === 'VALID'
        : t.status === 'USED' || t.status === 'CANCELLED' || t.status === 'EXPIRED';

    const matchesSearch =
      t.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketTypeName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const validCount = userTickets.filter((t) => t.status === 'VALID').length;
  const usedCount = userTickets.filter((t) => t.status !== 'VALID').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Wallet Header */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Passes
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
              Digital Wallet
            </h1>
            <p className="text-xs text-zinc-500">
              Admission passes and entrance QR codes for upcoming events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBrowseEvents}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-0.5 bg-zinc-100 p-1 rounded-md border border-zinc-200/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('UPCOMING')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'UPCOMING'
                ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Active Passes ({validCount})
          </button>
          <button
            onClick={() => setActiveFilter('USED')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'USED'
                ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Past & Used ({usedCount})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'ALL'
                ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            All ({userTickets.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passes..."
            className="w-full pl-8 pr-4 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
          />
        </div>
      </section>

      {/* Tickets List Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => {
            const isValid = ticket.status === 'VALID';
            const isUsed = ticket.status === 'USED';

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="group bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 p-5 shadow-xs transition-colors cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          {ticket.ticketTypeName}
                        </span>
                      </div>
                      <h4 className="font-semibold text-base text-zinc-950 group-hover:text-zinc-600 transition-colors mt-1.5 leading-snug">
                        {ticket.eventName}
                      </h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded uppercase shrink-0 ${
                        isValid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isUsed
                          ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100 mt-3.5">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Date & Time</span>
                      <span className="font-medium text-zinc-900 block">{ticket.eventDate}</span>
                      <span className="text-[11px] text-zinc-500">{ticket.eventTime}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Venue</span>
                      <span className="font-medium text-zinc-900 truncate block">{ticket.eventLocation}</span>
                      <span className="text-[11px] text-zinc-500 truncate block">{ticket.customerName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-zinc-100 text-xs">
                  <span className="font-mono text-zinc-400 text-[11px]">
                    Ref: {ticket.orderNumber}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(ticket);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Pass</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-zinc-900">No Passes Found</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No tickets matched your query.'
                : 'No active tickets in this section.'}
            </p>
          </div>
          <button
            onClick={onBrowseEvents}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition cursor-pointer"
          >
            Explore Events
          </button>
        </div>
      )}
    </div>
  );
};

