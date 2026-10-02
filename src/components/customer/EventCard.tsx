import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { EventItem } from '../../types';

interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
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

  return (
    <article
      onClick={() => onSelect(event)}
      className="group flex flex-col cursor-pointer transition-all duration-200"
    >
      {/* Clean Poster Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200/80 mb-3">
        <img
          src={event.image}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300 ease-out"
          referrerPolicy="no-referrer"
        />
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-[11px] font-medium text-white uppercase tracking-wider px-2.5 py-1 bg-black/80 rounded-md">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Clean Content */}
      <div className="space-y-1 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>{formatDate(event.date)}</span>
            <span>•</span>
            <span>{event.startTime}</span>
            <span>•</span>
            <span className="text-zinc-600">{event.category}</span>
          </div>

          <h3 className="font-semibold text-base text-zinc-900 group-hover:text-zinc-600 transition-colors tracking-tight line-clamp-1">
            {event.name}
          </h3>

          <p className="text-xs text-zinc-500 line-clamp-1">
            {event.location}
          </p>
        </div>

        {/* Minimal Price & Arrow */}
        <div className="pt-2 flex items-center justify-between text-xs">
          <span className="font-mono text-zinc-900 font-medium">
            From ${minPrice.toFixed(2)}
          </span>

          <span className="text-zinc-400 group-hover:text-zinc-900 flex items-center gap-0.5 transition-colors">
            <span>Tickets</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  );
};

