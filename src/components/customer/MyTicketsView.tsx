import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Search,
  ArrowRight,
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
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#111111]/[0.08] shadow-xs flex items-center justify-center mx-auto text-zinc-500">
          <TicketIcon className="w-7 h-7 text-[#111111]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#111111]">
            Sign in to view your passes
          </h2>
          <p className="text-xs sm:text-sm text-[#787774] max-w-sm mx-auto leading-relaxed">
            Your admission tickets, digital QR passes, and order history will appear here once you authenticate.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-full text-xs transition cursor-pointer active:scale-[0.98] shadow-xs"
          >
            Sign In to Wallet
          </button>
          <button
            onClick={onBrowseEvents}
            className="px-5 py-2.5 bg-white hover:bg-[#F7F6F3] text-zinc-700 border border-[#111111]/[0.08] rounded-full text-xs font-medium transition cursor-pointer shadow-2xs"
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
      <section className="double-bezel-tray-lg shadow-xs">
        <div className="double-bezel-core-lg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="eyebrow-pill bg-[#111111]/[0.04] text-zinc-600 border border-[#111111]/[0.06] mb-1">
              Passes
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#111111]">
              Digital Wallet
            </h1>
            <p className="text-xs text-[#787774]">
              Admission passes and entrance QR codes for upcoming events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBrowseEvents}
              className="group inline-flex items-center justify-between gap-3 pl-4 pr-1.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-medium transition-spring cursor-pointer active:scale-[0.98] shadow-xs"
            >
              <span>Explore Events</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3 h-3 stroke-[2]" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 bg-[#111111]/[0.03] p-1 rounded-full border border-[#111111]/[0.05] w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('UPCOMING')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'UPCOMING'
                ? 'bg-white text-[#111111] font-semibold border border-[#111111]/[0.06] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Active Passes ({validCount})
          </button>
          <button
            onClick={() => setActiveFilter('USED')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'USED'
                ? 'bg-white text-[#111111] font-semibold border border-[#111111]/[0.06] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Past & Used ({usedCount})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'ALL'
                ? 'bg-white text-[#111111] font-semibold border border-[#111111]/[0.06] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            All ({userTickets.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passes..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#111111]/[0.08] rounded-full text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition shadow-2xs"
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
                className="group double-bezel-tray hover:border-[#111111]/25 hover:shadow-[0_12px_32px_rgba(0,0,0,0.05)] transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="double-bezel-core p-5 flex flex-col justify-between space-y-4 h-full">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#787774]">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#E1F3FE] text-[#1F6C9F] font-semibold tracking-[0.16em]">
                            {ticket.ticketTypeName}
                          </span>
                        </div>
                        <h4 className="font-serif text-lg font-medium text-[#111111] group-hover:text-zinc-600 transition-colors mt-1.5 leading-snug tracking-tight">
                          {ticket.eventName}
                        </h4>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full uppercase shrink-0 ${
                          isValid
                            ? 'bg-[#EDF3EC] text-[#346538] border border-[#DBEADB]'
                            : isUsed
                            ? 'bg-[#F4F4F2] text-[#787774] border border-[#EAEAEA]'
                            : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D7DA]'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#787774] bg-[#FBFBFA] p-3 rounded-xl border border-[#111111]/[0.06] mt-3.5 font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Date & Time</span>
                        <span className="font-medium text-[#111111] block">{ticket.eventDate}</span>
                        <span className="text-[11px] text-[#787774]">{ticket.eventTime}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Venue</span>
                        <span className="font-medium text-[#111111] truncate block">{ticket.eventLocation}</span>
                        <span className="text-[11px] text-[#787774] truncate block font-sans">{ticket.customerName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between border-t border-[#111111]/[0.06] text-xs">
                    <span className="font-mono text-zinc-400 text-[11px]">
                      Ref: <kbd>{ticket.orderNumber}</kbd>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket);
                      }}
                      className="group/btn inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-medium transition-spring cursor-pointer active:scale-[0.98] shadow-xs"
                    >
                      <span>Pass</span>
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:scale-105 transition-transform">
                        <QrCode className="w-3 h-3 text-white" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#F7F6F3] text-zinc-500 flex items-center justify-center mx-auto border border-[#EAEAEA]">
            <TicketIcon className="w-5 h-5 text-[#111111]" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-[#111111]">No Passes Found</h4>
            <p className="text-xs text-[#787774] max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No passes matched your search term.'
                : 'No active tickets in this wallet category.'}
            </p>
          </div>
          <button
            onClick={onBrowseEvents}
            className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium rounded-[6px] transition cursor-pointer active:scale-[0.98]"
          >
            Explore Events
          </button>
        </div>
      )}
    </div>
  );
};
