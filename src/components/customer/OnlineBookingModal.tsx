import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Download,
  AlertTriangle,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useTicketContext } from '../../context/TicketContext';
import { EventItem, TicketType, Ticket, PaymentMethod } from '../../types';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface OnlineBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestScanTicket?: (ticket: Ticket) => void;
}

export const OnlineBookingModal: React.FC<OnlineBookingModalProps> = ({
  isOpen,
  onClose,
  onTestScanTicket,
}) => {
  const { events, purchaseTickets } = useTicketContext();

  // Lock background scrolling when online booking simulation is open
  useBodyScrollLock(isOpen);

  // Active events list
  const activeEvents = events.filter((e) => e.status !== 'CANCELLED');

  // Form State
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [fullName, setFullName] = useState<string>('Rathana Kem');
  const [email, setEmail] = useState<string>('rathana.client@example.com');
  const [phone, setPhone] = useState<string>('012 999 111');
  const [notes, setNotes] = useState<string>('Online VIP pass booking');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');
  const [leadTimeHours, setLeadTimeHours] = useState<number>(48);

  // Flow State: 'form' | 'success'
  const [flowStep, setFlowStep] = useState<'form' | 'success'>('form');
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Always reset flow to pristine form state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setFlowStep('form');
      setIssuedTicket(null);
      setQrDataUrl('');
      setFormError(null);
    }
  }, [isOpen]);

  // Initialize selected event and tier
  useEffect(() => {
    if (activeEvents.length > 0 && !selectedEventId) {
      const firstEvent = activeEvents[0];
      setSelectedEventId(firstEvent.id);
      if (firstEvent.ticketTypes.length > 0) {
        setSelectedTierId(firstEvent.ticketTypes[0].id);
      }
    }
  }, [activeEvents, selectedEventId]);

  // When event changes, update available tier
  const currentEvent = activeEvents.find((e) => e.id === selectedEventId) || activeEvents[0];
  const availableTiers = currentEvent?.ticketTypes || [];
  const currentTier = availableTiers.find((t) => t.id === selectedTierId) || availableTiers[0];

  useEffect(() => {
    if (availableTiers.length > 0 && (!selectedTierId || !availableTiers.some((t) => t.id === selectedTierId))) {
      setSelectedTierId(availableTiers[0].id);
    }
  }, [selectedEventId, availableTiers, selectedTierId]);

  // Generate QR data URL when ticket is issued
  useEffect(() => {
    if (flowStep === 'success' && issuedTicket) {
      // Ultra-clean compact token: produces large, chunky QR squares that phone cameras scan effortlessly off laptop screens
      const compactToken = `TP1:${issuedTicket.ticketNumber}|${issuedTicket.customerName}|${paymentMethod}|${leadTimeHours}|${issuedTicket.ticketTypeName}|${issuedTicket.price}|${issuedTicket.eventName}`;

      // Generate sharp high-resolution QR code with large chunky blocks (errorCorrectionLevel 'L' maximizes square size)
      QRCode.toDataURL(compactToken, {
        width: 520,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'L',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate pass QR:', err));
    }
  }, [flowStep, issuedTicket, paymentMethod, leadTimeHours]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentEvent || !currentTier) {
      setFormError('Please select a valid event and ticket tier.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setFormError('Please complete all required customer information fields.');
      return;
    }

    try {
      // Calculate simulated purchase timestamp based on lead-time hours
      const eventDateStr = `${currentEvent.date}T${
        currentEvent.startTime.length === 5 ? currentEvent.startTime + ':00' : currentEvent.startTime
      }`;
      const eventTimestamp = new Date(eventDateStr).getTime();
      const simulatedCreatedAt = new Date(eventTimestamp - leadTimeHours * 3600 * 1000).toISOString();

      const result = purchaseTickets({
        event: currentEvent,
        ticketType: currentTier,
        quantity,
        customerInfo: {
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        },
        paymentMethod,
        source: 'ONLINE',
        customCreatedAt: simulatedCreatedAt,
      });

      if (result.tickets && result.tickets.length > 0) {
        setIssuedTicket(result.tickets[0]);
        setFlowStep('success');
      } else {
        setFormError('Failed to generate ticket. Please try again.');
      }
    } catch (err: any) {
      console.error('Online booking error:', err);
      setFormError(err.message || 'Transaction failed. Please check inputs.');
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !issuedTicket) return;
    setIsDownloading(true);

    const link = document.createElement('a');
    link.download = `ticket-${issuedTicket.ticketNumber}-qr.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 1200);
  };

  const handleCopyTicketNumber = () => {
    if (!issuedTicket) return;
    navigator.clipboard.writeText(issuedTicket.ticketNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleResetForAnother = () => {
    setFlowStep('form');
    setIssuedTicket(null);
    setQrDataUrl('');
    setFormError(null);
  };

  const handleClose = () => {
    setFlowStep('form');
    setIssuedTicket(null);
    setQrDataUrl('');
    setFormError(null);
    onClose();
  };

  const subtotal = currentTier ? currentTier.price * quantity : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/35 backdrop-blur-[2px] overflow-y-auto overscroll-contain">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white border border-[#EAEAEA] rounded-xl max-w-xl w-full overflow-hidden my-auto relative text-[#111111] shadow-2xs"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#EAEAEA]">
          <div>
            <h3 className="font-semibold text-base text-[#111111]">
              {flowStep === 'form' ? 'Simulate Ticket Booking' : 'Digital Admission Pass'}
            </h3>
            <p className="text-xs text-[#787774]">
              {flowStep === 'form'
                ? 'Generate a verified entrance pass with live QR validation'
                : 'Pass ready for gate checkpoint presentation'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-[6px] text-zinc-400 hover:text-[#111111] hover:bg-[#F4F4F2] transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: FORM */}
        {flowStep === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {formError && (
              <div className="p-3 bg-[#FDEBEC] border border-[#F8D7DA] rounded-[6px] flex items-center gap-2 text-xs text-[#9F2F2D]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#9F2F2D]" />
                <span>{formError}</span>
              </div>
            )}

            {/* Event & Tier Selection */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
                  >
                    {activeEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Ticket Tier
                  </label>
                  <select
                    value={selectedTierId}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
                  >
                    {availableTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name} · ${tier.price.toFixed(2)} ({tier.quantity - tier.sold} remaining)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentEvent && (
                <div className="flex items-center gap-2 text-xs text-[#787774] font-mono">
                  <span>{currentEvent.date}</span>
                  <span>•</span>
                  <span>{currentEvent.startTime}</span>
                  <span>•</span>
                  <span>{currentEvent.location}</span>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="space-y-3 pt-3 border-t border-[#EAEAEA]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rathana Kem"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="attendee@example.com"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012 xxx xxx"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Special Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Seating or accessibility requests..."
                  className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Payment & Lead-Time */}
            <div className="space-y-3 pt-3 border-t border-[#EAEAEA]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
                  >
                    <option value="ONLINE">ABA KHQR / E-Wallet</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="QR_PAYMENT">Bakong KHQR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Advance Booking Timing
                  </label>
                  <select
                    value={leadTimeHours}
                    onChange={(e) => setLeadTimeHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
                  >
                    <option value={48}>48 Hours in Advance (Standard)</option>
                    <option value={168}>7 Days in Advance (Early)</option>
                    <option value={24}>24 Hours in Advance (1 Day)</option>
                    <option value={2}>2 Hours Walk-in (Same-Day)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Total and Submit CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-[#EAEAEA]">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono block uppercase">Total Amount</span>
                <span className="text-xl font-bold text-[#111111] font-mono">
                  ${subtotal.toFixed(2)} <span className="text-xs font-normal text-zinc-400 font-sans">USD</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[#787774] hover:text-[#111111] text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] text-[#0B0F17] text-xs font-semibold transition cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
                >
                  Issue Pass
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: CONFIRMATION & QR NOTICE */}
        {flowStep === 'success' && issuedTicket && (
          <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Visual Admission Ticket Pass Card */}
            <div className="bg-white rounded-xl border border-[#EAEAEA] p-5 space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    {issuedTicket.ticketTypeName}
                  </span>
                  <h4 className="font-serif text-base font-medium text-[#111111] mt-0.5">
                    {issuedTicket.eventName}
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#EDF3EC] text-[#346538] border border-[#DBEADB]">
                  READY
                </span>
              </div>

              {/* Large Sharp QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-3 bg-white rounded-lg border border-[#111111]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Pass for ${issuedTicket.ticketNumber}`}
                      className="w-48 h-48 block"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-[#F7F6F3] text-xs text-zinc-400">
                      Generating...
                    </div>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="font-mono text-xs font-medium text-[#111111] bg-[#FBFBFA] px-2 py-0.5 rounded-[4px] border border-[#EAEAEA]">
                    <kbd>{issuedTicket.ticketNumber}</kbd>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketNumber}
                    className="p-1 text-zinc-400 hover:text-[#111111] transition cursor-pointer"
                    title="Copy Ticket ID"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-[#346538]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-left bg-[#FBFBFA] p-3 rounded-lg text-xs border border-[#EAEAEA] font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-sans">Attendee</span>
                  <span className="font-medium text-[#111111] truncate block font-sans">
                    {issuedTicket.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-sans">Price</span>
                  <span className="font-semibold text-[#111111]">
                    ${issuedTicket.price.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-sans">Date</span>
                  <span className="text-[#787774]">
                    {issuedTicket.eventDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-sans">Time</span>
                  <span className="text-[#787774]">
                    {issuedTicket.eventTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Download PNG + Test Scan Entrance Gate */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl || isDownloading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] text-[#0B0F17] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{isDownloading ? 'Downloading...' : 'Download Pass (.png)'}</span>
              </button>

              {onTestScanTicket && (
                <button
                  type="button"
                  onClick={() => onTestScanTicket(issuedTicket)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white hover:bg-[#FDF8EE] text-[#111111] border border-[#C5A059]/30 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B88B2A]" />
                  <span>Test Scan at Gate</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 pt-1 text-xs text-[#787774]">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="hover:text-[#111111] underline cursor-pointer"
              >
                Issue Another Pass
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClose}
                className="hover:text-[#111111] underline cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
