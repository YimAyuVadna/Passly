import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Ticket as TicketIcon,
  CreditCard,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
  FileText,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useTicketContext } from '../../context/TicketContext';
import { EventItem, TicketType, Ticket, PaymentMethod } from '../../types';

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

  // Trigger confetti and generate QR data URL when ticket is issued
  useEffect(() => {
    if (flowStep === 'success' && issuedTicket) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch {
        // Confetti unsupported or suppressed
      }

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
  };

  const subtotal = currentTier ? currentTier.price * quantity : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white border border-zinc-200/90 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-auto relative text-zinc-900"
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-white">
                  Online Client Booking Simulation
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-semibold tracking-wide">
                  Pass & QR Flow
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Simulate client web checkout • Auto-generate QR entrance pass • Test Decision Tree AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: FORM */}
        {flowStep === 'form' && (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Event & Tier Selection */}
            <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <TicketIcon className="w-3.5 h-3.5 text-blue-600" />
                1. Select Event & Pass Tier
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Event Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Event Target
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {activeEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Pass Category & Tier
                  </label>
                  <select
                    value={selectedTierId}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {availableTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name} — ${tier.price.toFixed(2)} ({tier.quantity - tier.sold} remaining)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Date & Location Pill */}
              {currentEvent && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {currentEvent.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {currentEvent.startTime}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {currentEvent.location}
                  </span>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                2. Online Customer Information
              </span>

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
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="attendee@example.com"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012 xxx xxx"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Order / Special Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP front row preferred, electronic receipt sent"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment & Simulated Machine Learning Parameters */}
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  3. Online Payment & ML Feature Simulation
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  Decision Tree Features
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Payment Gateway Channel
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ONLINE">ABA KHQR / E-Wallet (Online)</option>
                    <option value="CARD">Credit / Debit Card (Visa/Mastercard)</option>
                    <option value="QR_PAYMENT">Bakong KHQR (Mobile App)</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Simulates online digital payment gateway.
                  </p>
                </div>

                {/* Lead-Time Simulator */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Advance Purchase Lead-Time
                  </label>
                  <select
                    value={leadTimeHours}
                    onChange={(e) => setLeadTimeHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={48}>48 Hours in Advance (2 Days) - Recommended</option>
                    <option value={168}>7 Days in Advance (1 Week)</option>
                    <option value={24}>24 Hours in Advance (1 Day)</option>
                    <option value={2}>2 Hours Walk-in (Same-Day Test)</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Pre-event booking time drives the Decision Tree AI classifier.
                  </p>
                </div>
              </div>
            </div>

            {/* Total and Submit CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
              <div>
                <span className="text-xs text-zinc-500 block">Total Amount Due</span>
                <span className="text-xl font-bold text-zinc-900 tracking-tight">
                  ${subtotal.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-zinc-400">USD</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Complete Purchase & Generate Pass</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: CONFIRMATION & QR NOTICE */}
        {flowStep === 'success' && issuedTicket && (
          <div className="p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto text-center">
            {/* Header Success Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pass Successfully Issued & Activated</span>
            </div>

            {/* MANDATORY SCREENSHOT / DOWNLOAD NOTICE (High Visibility Warning Banner) */}
            <div className="bg-amber-50 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-left text-amber-950 shadow-sm">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                <Camera className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  📸 IMPORTANT: Screenshot or Download Your QR Pass Now!
                </h4>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  You <strong>must present this official QR pass</strong> to the gate scanner upon arrival at the event entrance.
                  Please <strong>take a screenshot</strong> or click <strong>&quot;Download QR Image&quot;</strong> below to save this pass to your phone before leaving this window!
                </p>
              </div>
            </div>

            {/* Visual Admission Ticket Pass Card */}
            <div className="bg-gradient-to-b from-zinc-50 to-white rounded-2xl border border-zinc-200/90 p-5 shadow-sm max-w-md mx-auto space-y-4">
              {/* Event Name & Category */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {issuedTicket.ticketTypeName}
                </span>
                <h4 className="text-base font-bold text-zinc-900 mt-1">
                  {issuedTicket.eventName}
                </h4>
              </div>

              {/* Large Sharp QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-zinc-900 shadow-md relative group">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Pass for ${issuedTicket.ticketNumber}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 block rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-zinc-100 rounded-xl text-xs text-zinc-400">
                      Generating Retina QR...
                    </div>
                  )}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-blue-600" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-blue-600" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-blue-600" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-blue-600" />
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
                    {issuedTicket.ticketNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketNumber}
                    className="p-1 text-zinc-400 hover:text-zinc-700 transition"
                    title="Copy Ticket Number"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-left bg-zinc-100/70 p-3 rounded-xl text-xs border border-zinc-200/60">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">Attendee</span>
                  <span className="font-semibold text-zinc-800 truncate block">
                    {issuedTicket.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">Gate Pass Type</span>
                  <span className="font-semibold text-blue-600">
                    Online Pass (${issuedTicket.price.toFixed(2)})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">Event Date</span>
                  <span className="font-medium text-zinc-700">
                    {issuedTicket.eventDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">Check-in Time</span>
                  <span className="font-medium text-zinc-700">
                    {issuedTicket.eventTime}
                  </span>
                </div>
              </div>

              {/* Decision Tree Simulation Pill */}
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 text-left text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-[11px] block">AI Features Configured:</span>
                    <span className="text-[10px] text-blue-700">
                      Channel: <strong>{paymentMethod}</strong> • Advance Lead: <strong>{leadTimeHours}h</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full">
                  Decision Tree
                </span>
              </div>
            </div>

            {/* Action Buttons: Download PNG + Test Scan Entrance Gate */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {/* 1-Click PNG Download */}
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl || isDownloading}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Downloading Image...' : '⬇️ Download QR Image (.png)'}</span>
              </button>

              {/* Test Scan at Entrance Gate Shortcut */}
              {onTestScanTicket && (
                <button
                  type="button"
                  onClick={() => onTestScanTicket(issuedTicket)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>🚀 Test Scan at Entrance Gate</span>
                </button>
              )}
            </div>

            {/* Bottom Secondary Links */}
            <div className="flex items-center justify-center gap-4 pt-1 text-xs text-zinc-500">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="hover:text-blue-600 underline cursor-pointer"
              >
                Book Another Ticket
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-zinc-800 underline cursor-pointer"
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
