import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { EventItem } from '../../types';

interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  isFeatured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, isFeatured = false }) => {
  const minPrice = Math.min(...event.ticketTypes.map((t) => t.price));
  const totalAvailable = event.ticketTypes.reduce((acc, t) => acc + (t.quantity - t.sold), 0);
  const isSoldOut = totalAvailable <= 0;

  // Format clean date
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      // Fallback
    }
    return dateStr;
  };

  if (isFeatured) {
    return (
      <article
        onClick={() => onSelect(event)}
        className="group cursor-pointer transition-all duration-300 md:col-span-2 double-bezel-tray-lg hover:border-[#111111]/25 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] active:scale-[0.995]"
      >
        <div className="double-bezel-core-lg p-5 sm:p-6 flex flex-col md:flex-row gap-6 h-full justify-between items-center">
          <div className="relative aspect-[16/10] md:aspect-[4/3] w-full md:w-1/2 overflow-hidden rounded-xl bg-[#F7F6F3] border border-[#111111]/[0.06] shrink-0">
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-[#111111]/70 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-[10px] font-mono font-medium text-white uppercase tracking-wider px-2 py-0.5 bg-[#111111] rounded-full border border-zinc-700">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-[#787774] font-mono">
                <span>{formatDate(event.date)}</span>
                <span className="text-zinc-300">•</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E1F3FE] text-[#1F6C9F] text-[9px] tracking-[0.16em] uppercase font-semibold">
                  {event.category}
                </span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#111111] group-hover:text-zinc-600 transition-colors tracking-tight leading-snug line-clamp-2">
                {event.name}
              </h3>

              <p className="text-xs text-[#787774] line-clamp-2 leading-relaxed">
                {event.description || event.location}
              </p>

              <div className="text-xs text-[#787774] flex items-center gap-2 font-mono">
                <span>{event.location}</span>
                <span className="text-zinc-300">•</span>
                <span>{event.startTime}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#111111]/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Passes from</span>
                <span className="font-mono text-[#111111] font-semibold text-sm tabular-nums">
                  ${minPrice.toFixed(2)}
                </span>
              </div>

              <span className="inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-[#111111] text-white group-hover:bg-[#222222] transition-colors text-xs font-medium shadow-xs">
                <span>Reserve Pass</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelect(event)}
      className="group cursor-pointer transition-all duration-300 double-bezel-tray hover:border-[#111111]/25 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] active:scale-[0.99]"
    >
      <div className="double-bezel-core p-3.5 space-y-3.5 flex flex-col h-full justify-between">
        <div className="space-y-3">
          {/* Clean Poster Image with Hardware Rim */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#F7F6F3] border border-[#111111]/[0.06]">
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
              referrerPolicy="no-referrer"
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-[#111111]/70 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-[10px] font-mono font-medium text-white uppercase tracking-wider px-2 py-0.5 bg-[#111111] rounded-full border border-zinc-700">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Clean Editorial Content */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-[#787774] font-mono">
              <span>{formatDate(event.date)}</span>
              <span className="text-zinc-300">•</span>
              <span className="px-2 py-0.5 rounded-full bg-[#E1F3FE] text-[#1F6C9F] text-[9px] tracking-[0.16em] uppercase font-semibold">
                {event.category}
              </span>
            </div>

            <h3 className="font-serif text-base sm:text-lg font-medium text-[#111111] group-hover:text-zinc-600 transition-colors tracking-tight line-clamp-1 leading-snug">
              {event.name}
            </h3>

            <p className="text-xs text-[#787774] line-clamp-1">
              {event.location}
            </p>
          </div>
        </div>

        {/* Minimal Price & Button-in-Button Micro Pill */}
        <div className="pt-2.5 border-t border-[#111111]/[0.06] flex items-center justify-between text-xs">
          <span className="font-mono text-[#111111] font-semibold text-xs tabular-nums">
            From ${minPrice.toFixed(2)}
          </span>

          <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-[#111111]/[0.04] group-hover:bg-[#111111] text-zinc-600 group-hover:text-white transition-all duration-200 text-[11px] font-medium">
            <span>Details</span>
            <span className="w-4 h-4 rounded-full bg-zinc-300/70 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <ArrowUpRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
};
