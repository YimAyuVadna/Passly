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
  HelpCircle,
  LogIn,
} from 'lucide-react';
import { EventItem, TicketType } from '../../types';
import { useTicketContext } from '../../context/TicketContext';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden text-zinc-900 border border-zinc-200 my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-md bg-white/90 hover:bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-200/80 flex items-center justify-center transition cursor-pointer shadow-xs"
          aria-label="Close dialog"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1">
          {/* Crisp Framed Poster */}
          <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden border-b border-zinc-100">
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-6 space-y-6">
            {/* Title & Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-mono uppercase text-[10px] text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                  {event.category}
                </span>
                <span>•</span>
                <span className="text-zinc-500">{event.organizer}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 leading-snug">
                {event.name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 pt-0.5">
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
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-xs">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Venue</span>
              <p className="font-medium text-zinc-900 mt-0.5">{event.location}</p>
              <p className="text-zinc-500 mt-0.5">{event.address}</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="font-medium text-xs uppercase tracking-wider text-zinc-400">
                About Event
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Ticket Tier Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-xs uppercase tracking-wider text-zinc-400">
                  Select Admission Tier
                </h4>
                <span className="text-[11px] text-zinc-400 font-mono">Digital QR Pass</span>
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
                          ? 'border-zinc-950 bg-zinc-50/50'
                          : isSold
                          ? 'border-zinc-200 bg-zinc-50/50 opacity-40 cursor-not-allowed'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-xs text-zinc-950">{type.name}</span>
                        </div>
                        <p className="text-xs text-zinc-500 pl-5">{type.description}</p>
                        <div className="text-[11px] text-zinc-400 pl-5">
                          {isSold ? (
                            <span className="text-rose-600 font-medium">Sold Out</span>
                          ) : (
                            <span>{left} remaining</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-zinc-900 font-mono block">
                          ${type.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-sans">each</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            {isAvailable && (
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="font-medium text-xs text-zinc-800 block">Quantity</span>
                  <span className="text-[11px] text-zinc-400">Up to 10 passes</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-semibold text-xs text-zinc-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= Math.min(remaining, 10)}
                    className="w-7 h-7 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Admission Rules */}
            {event.rules && event.rules.length > 0 && (
              <div className="border-t border-zinc-100 pt-4 space-y-2">
                <h4 className="font-medium text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  Admission Rules
                </h4>
                <ul className="space-y-1 text-xs text-zinc-500 list-disc list-inside">
                  {event.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer Checkout Bar */}
        <div className="p-4 bg-white border-t border-zinc-200/80 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
              Total Due
            </span>
            <span className="text-lg font-bold text-zinc-900 font-mono">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {isLoggedIn ? (
            <button
              onClick={handleCheckout}
              disabled={!isAvailable}
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-medium rounded-lg shadow-xs transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Checkout</span>
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleCheckout}
                disabled={!isAvailable}
                className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-medium rounded-lg shadow-xs transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Book</span>
              </button>
              <span className="text-[10px] text-zinc-400">
                Sign in or quick sign up required
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

