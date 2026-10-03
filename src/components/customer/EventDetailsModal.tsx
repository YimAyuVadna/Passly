import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  Building,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { EventItem, TicketType } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface EventDetailsModalProps {
  event: EventItem | null;
  onClose: () => void;
  onProceedToCheckout: (event: EventItem, ticketType: TicketType, quantity: number) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  onProceedToCheckout,
}) => {
  const { isLoggedIn } = useTicketContext();
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Lock background scrolling when event details modal is open
  useBodyScrollLock(Boolean(event));

  if (!event) return null;

  const currentTicketType =
    event.ticketTypes.find((t) => t.id === selectedTypeId) || event.ticketTypes[0];
  const remaining = currentTicketType ? currentTicketType.quantity - currentTicketType.sold : 0;
  const isAvailable = remaining > 0;
  const subtotal = currentTicketType ? currentTicketType.price * quantity : 0;

  const handleIncrement = () => {
    if (quantity < Math.min(remaining, 10)) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleCheckout = () => {
    if (currentTicketType && isAvailable) {
      onProceedToCheckout(event, currentTicketType, quantity);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-xl double-bezel-tray-lg shadow-[0_24px_50px_rgba(0,0,0,0.15)] my-8 max-h-[90vh] flex flex-col p-2">
        <div className="double-bezel-core-lg overflow-hidden flex flex-col max-h-full">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-zinc-600 hover:text-[#111111] border border-[#111111]/[0.08] shadow-xs flex items-center justify-center transition-spring cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Framed Poster */}
          <div className="relative aspect-[16/9] w-full bg-[#F7F6F3] overflow-hidden border-b border-[#EAEAEA]">
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Title & Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#787774]">
                <span className="font-mono uppercase text-[10px] tracking-wider text-[#1F6C9F] bg-[#E1F3FE] px-2 py-0.5 rounded-full font-semibold">
                  {event.category}
                </span>
                <span>•</span>
                <span className="text-[#787774] font-medium">{event.organizer}</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#111111] leading-tight">
                {event.name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#787774] pt-1 font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {event.startTime} - {event.endTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {event.location}
                </span>
              </div>
            </div>

            {/* Location & Address */}
            <div className="p-3.5 bg-[#FBFBFA] rounded-lg border border-[#EAEAEA] text-xs">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Venue</span>
              <p className="font-medium text-[#111111] mt-0.5">{event.location}</p>
              <p className="text-[#787774] mt-0.5">{event.address}</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Event Overview
              </h4>
              <p className="text-xs sm:text-sm text-[#787774] leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Ticket Tier Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                  Select Admission Tier
                </h4>
                <span className="text-[11px] text-zinc-400 font-mono">Verified QR Pass</span>
              </div>

              <div className="grid gap-2">
                {event.ticketTypes.map((type) => {
                  const left = type.quantity - type.sold;
                  const isSold = left <= 0;
                  const isSelected = (selectedTypeId || event.ticketTypes[0].id) === type.id;

                  return (
                    <div
                      key={type.id}
                      onClick={() => !isSold && setSelectedTypeId(type.id)}
                      className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#111111] bg-[#F7F6F3]'
                          : isSold
                          ? 'border-[#EAEAEA] bg-[#F9F9F8] opacity-50 cursor-not-allowed'
                          : 'border-[#EAEAEA] hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center ${
                              isSelected ? 'border-[#111111] bg-[#111111] text-white' : 'border-zinc-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-xs text-[#111111]">{type.name}</span>
                        </div>
                        <p className="text-xs text-[#787774] pl-5">{type.description}</p>
                        <div className="text-[11px] font-mono text-zinc-400 pl-5">
                          {isSold ? (
                            <span className="text-[#9F2F2D] font-medium">Sold Out</span>
                          ) : (
                            <span>{left} remaining</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-[#111111] font-mono block">
                          ${type.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-sans">per pass</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            {isAvailable && (
              <div className="p-3.5 bg-[#FBFBFA] rounded-lg border border-[#EAEAEA] flex items-center justify-between">
                <div>
                  <span className="font-medium text-xs text-[#111111] block">Quantity</span>
                  <span className="text-[11px] text-zinc-400">Up to 10 passes per checkout</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-[4px] bg-white border border-[#EAEAEA] flex items-center justify-center text-[#111111] hover:bg-[#F7F6F3] disabled:opacity-30 transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-semibold text-xs text-[#111111] font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= Math.min(remaining, 10)}
                    className="w-7 h-7 rounded-[4px] bg-white border border-[#EAEAEA] flex items-center justify-center text-[#111111] hover:bg-[#F7F6F3] disabled:opacity-30 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Admission Rules */}
            {event.rules && event.rules.length > 0 && (
              <div className="border-t border-[#EAEAEA] pt-4 space-y-2">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  Admission Rules
                </h4>
                <ul className="space-y-1 text-xs text-[#787774] list-disc list-inside">
                  {event.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer Checkout Bar */}
        <div className="p-4 bg-white border-t border-[#111111]/[0.06] flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-[0.16em] block font-medium">
              Total Amount
            </span>
            <span className="text-lg font-bold text-[#111111] font-mono tabular-nums">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {isLoggedIn ? (
            <button
              onClick={handleCheckout}
              disabled={!isAvailable}
              className="group inline-flex items-center justify-between gap-3 pl-5 pr-2 py-2 bg-[#111111] hover:bg-[#222222] disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-medium rounded-full transition-spring text-xs cursor-pointer active:scale-[0.98] shadow-xs"
            >
              <span>Continue to Checkout</span>
              <span className="btn-nested-icon w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
              </span>
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleCheckout}
                disabled={!isAvailable}
                className="group inline-flex items-center justify-between gap-3 pl-5 pr-2 py-2 bg-[#111111] hover:bg-[#222222] disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-medium rounded-full transition-spring text-xs cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <span>Sign In to Book</span>
                <span className="btn-nested-icon w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <LogIn className="w-3.5 h-3.5" />
                </span>
              </button>
              <span className="text-[10px] text-zinc-400">
                Account required to issue passes
              </span>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
