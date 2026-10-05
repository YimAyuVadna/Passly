import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Search,
  ArrowRight,
  Share2,
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
      {/* Wallet Header - Screenshot 2 Obsidian & Gold Theme */}
      <section className="p-2 sm:p-2.5 rounded-3xl bg-[#0B0F17] border border-[#C5A059]/30 shadow-[0_24px_60px_rgba(11,15,23,0.35)]">
        <div className="rounded-2xl bg-gradient-to-br from-[#111625] via-[#141A29] to-[#0D121F] border border-[#C5A059]/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white relative overflow-hidden">
          {/* Subtle ambient light gradient */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#C5A059]/[0.08] blur-3xl pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <span className="eyebrow-pill bg-[#C5A059]/15 text-[#E5CA8F] border border-[#C5A059]/30 mb-1">
              Passes
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white">
              Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6E6C2] via-[#E5CA8F] to-[#D4AF37]">Wallet</span>
            </h1>
            <p className="text-xs text-zinc-300">
              Admission passes and entrance QR codes for upcoming events.
            </p>
          </div>

          <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto">
            <button
              onClick={onBrowseEvents}
              className="group inline-flex items-center justify-between gap-3 pl-5 pr-2 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] text-[#0B0F17] font-semibold rounded-full text-xs transition-spring cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(212,175,55,0.25)] w-full sm:w-auto"
            >
              <span>Explore Events</span>
              <span className="w-6 h-6 rounded-full bg-[#0B0F17] text-[#D4AF37] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 bg-[#0B0F17]/[0.03] p-1 rounded-full border border-[#C5A059]/15 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('UPCOMING')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'UPCOMING'
                ? 'bg-white text-[#0B0F17] font-semibold border border-[#C5A059]/35 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Active Passes ({validCount})
          </button>
          <button
            onClick={() => setActiveFilter('USED')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'USED'
                ? 'bg-white text-[#0B0F17] font-semibold border border-[#C5A059]/35 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Past & Used ({usedCount})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex-1 sm:flex-none ${
              activeFilter === 'ALL'
                ? 'bg-white text-[#0B0F17] font-semibold border border-[#C5A059]/35 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            All ({userTickets.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#B88B2A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passes..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#C5A059]/25 rounded-full text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/25 transition shadow-2xs"
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
                className="group double-bezel-tray hover:border-[#C5A059]/40 hover:shadow-[0_12px_32px_rgba(197,160,89,0.1)] transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="double-bezel-core p-5 flex flex-col justify-between space-y-4 h-full">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-[#8F681B]">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]/60 font-semibold tracking-[0.16em]">
                            {ticket.ticketTypeName}
                          </span>
                          {ticket.isShared && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] font-medium flex items-center gap-1">
                              <Share2 className="w-2.5 h-2.5 text-[#059669]" />
                              <span>{ticket.sharedToName ? `Shared to ${ticket.sharedToName}` : 'Shared'}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif text-lg font-medium text-[#111111] group-hover:text-[#B88B2A] transition-colors mt-1.5 leading-snug tracking-tight">
                          {ticket.eventName}
                        </h4>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full uppercase shrink-0 ${
                          isValid
                            ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                            : isUsed
                            ? 'bg-[#F4F4F2] text-[#787774] border border-[#EAEAEA]'
                            : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D7DA]'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#787774] bg-[#FAF8F5] p-3 rounded-xl border border-[#C5A059]/15 mt-3.5 font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Date & Time</span>
                        <span className="font-medium text-[#111111] block">{ticket.eventDate}</span>
                        <span className="text-[11px] text-[#787774]">{ticket.eventTime}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">
                          {ticket.sharedToName ? 'Pass Holder' : 'Venue'}
                        </span>
                        <span className="font-medium text-[#111111] truncate block">{ticket.eventLocation}</span>
                        <span className="text-[11px] text-[#787774] truncate block font-sans">
                          {ticket.sharedToName ? `Recipient: ${ticket.sharedToName}` : ticket.customerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between border-t border-[#C5A059]/15 text-xs">
                    <span className="font-mono text-zinc-400 text-[11px]">
                      Ref: <kbd>{ticket.orderNumber}</kbd>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket);
                      }}
                      className="group/btn inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-[#0B0F17]/[0.04] group-hover:bg-[#0B0F17] text-zinc-700 group-hover:text-white border border-[#C5A059]/20 group-hover:border-[#C5A059]/40 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-2xs group-hover:shadow-xs"
                    >
                      <span>Pass</span>
                      <span className="w-5 h-5 rounded-full bg-[#C5A059]/15 text-[#8F681B] group-hover:bg-[#C5A059] group-hover:text-white flex items-center justify-center transition-colors">
                        <QrCode className="w-3 h-3" />
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
