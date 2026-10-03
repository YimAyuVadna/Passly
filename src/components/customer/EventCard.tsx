import React from 'react';
import { ArrowRight } from 'lucide-react';
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

  const FALLBACK_EVENT_IMAGE = 'https://images.unsplash.com/photo-1779419183221-df0bb6fdad1d?w=800&auto=format&fit=crop&q=80';

  // High-End Luxury Jewel-Tone Category Accents
  const getCategoryTheme = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('concert') || c.includes('music') || c.includes('live')) {
      return 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]/70';
    }
    if (c.includes('fest') || c.includes('gala') || c.includes('cinema') || c.includes('theater')) {
      return 'bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF]/70';
    }
    if (c.includes('run') || c.includes('sport') || c.includes('marathon')) {
      return 'bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]/70';
    }
    if (c.includes('night') || c.includes('market') || c.includes('food') || c.includes('wine')) {
      return 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]/70';
    }
    if (c.includes('work') || c.includes('talk') || c.includes('class')) {
      return 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]/70';
    }
    return 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]/70';
  };

  if (isFeatured) {
    return (
      <article
        onClick={() => onSelect(event)}
        className="group cursor-pointer transition-all duration-300 md:col-span-2 double-bezel-tray-lg hover:border-[#C5A059]/40 hover:shadow-[0_16px_40px_rgba(197,160,89,0.12)] active:scale-[0.995]"
      >
        <div className="double-bezel-core-lg p-5 sm:p-6 flex flex-col md:flex-row gap-6 h-full justify-between items-center">
          <div className="relative aspect-[16/10] md:aspect-[4/3] w-full md:w-1/2 overflow-hidden rounded-xl bg-[#FAF8F5] border border-[#C5A059]/15 shrink-0">
            <img
              src={event.image}
              alt={event.name}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_EVENT_IMAGE) {
                  target.src = FALLBACK_EVENT_IMAGE;
                }
              }}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-[#0B0F17]/75 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-[10px] font-mono font-medium text-white uppercase tracking-wider px-2.5 py-0.5 bg-[#0B0F17] rounded-full border border-zinc-700">
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
                <span className={`px-2 py-0.5 rounded-full text-[9px] tracking-[0.16em] uppercase font-semibold ${getCategoryTheme(event.category)}`}>
                  {event.category}
                </span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#111111] group-hover:text-[#B88B2A] transition-colors tracking-tight leading-snug line-clamp-2">
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

            <div className="pt-4 border-t border-[#C5A059]/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Passes from</span>
                <span className="font-mono text-[#9A7424] font-semibold text-sm tabular-nums">
                  ${minPrice.toFixed(2)}
                </span>
              </div>

              <span className="inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-[#0B0F17]/[0.05] group-hover:bg-[#0B0F17] text-[#111111] group-hover:text-white border border-[#C5A059]/25 group-hover:border-[#C5A059]/60 group-hover:shadow-[0_4px_16px_rgba(11,15,23,0.18)] transition-all duration-300 text-xs font-medium select-none">
                <span>Details</span>
                <span className="w-5 h-5 rounded-full bg-[#C5A059]/25 group-hover:bg-gradient-to-r group-hover:from-[#D4AF37] group-hover:to-[#C5A059] group-hover:scale-110 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.35)] flex items-center justify-center shrink-0 transition-all duration-300">
                  <ArrowRight className="w-3 h-3 text-black stroke-[2.2] transition-colors" />
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
      className="group cursor-pointer transition-all duration-300 double-bezel-tray hover:border-[#C5A059]/40 hover:shadow-[0_12px_32px_rgba(197,160,89,0.12)] active:scale-[0.99]"
    >
      <div className="double-bezel-core p-3.5 space-y-3.5 flex flex-col h-full justify-between">
        <div className="space-y-3">
          {/* Clean Poster Image with Hardware Rim */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#FAF8F5] border border-[#C5A059]/15">
            <img
              src={event.image}
              alt={event.name}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_EVENT_IMAGE) {
                  target.src = FALLBACK_EVENT_IMAGE;
                }
              }}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
              referrerPolicy="no-referrer"
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-[#0B0F17]/75 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-[10px] font-mono font-medium text-white uppercase tracking-wider px-2 py-0.5 bg-[#0B0F17] rounded-full border border-zinc-700">
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
              <span className={`px-2 py-0.5 rounded-full text-[9px] tracking-[0.16em] uppercase font-semibold ${getCategoryTheme(event.category)}`}>
                {event.category}
              </span>
            </div>

            <h3 className="font-serif text-base sm:text-lg font-medium text-[#111111] group-hover:text-[#B88B2A] transition-colors tracking-tight line-clamp-1 leading-snug">
              {event.name}
            </h3>

            <p className="text-xs text-[#787774] line-clamp-1">
              {event.location}
            </p>
          </div>
        </div>

        {/* Minimal Price & Button-in-Button Micro Pill */}
        <div className="pt-2.5 border-t border-[#C5A059]/15 flex items-center justify-between text-xs">
          <span className="font-mono text-[#9A7424] font-semibold text-xs tabular-nums">
            From ${minPrice.toFixed(2)}
          </span>

          <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-[#0B0F17]/[0.05] group-hover:bg-[#0B0F17] text-[#111111] group-hover:text-white border border-[#C5A059]/25 group-hover:border-[#C5A059]/60 group-hover:shadow-[0_4px_14px_rgba(11,15,23,0.16)] transition-all duration-300 text-[11px] font-medium select-none">
            <span>Details</span>
            <span className="w-4 h-4 rounded-full bg-[#C5A059]/25 group-hover:bg-gradient-to-r group-hover:from-[#D4AF37] group-hover:to-[#C5A059] group-hover:scale-110 group-hover:shadow-[0_0_8px_rgba(212,175,55,0.35)] flex items-center justify-center shrink-0 transition-all duration-300">
              <ArrowRight className="w-2.5 h-2.5 text-black stroke-[2.2] transition-colors" />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
};

