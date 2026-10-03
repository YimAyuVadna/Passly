import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Globe,
  CheckCircle2,
  Ticket as TicketIcon,
  Printer,
  ArrowRight,
} from 'lucide-react';
import { TicketType, PaymentMethod, Ticket, OrderItem } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface StaffAssistedPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewGeneratedTicket: (ticket: Ticket) => void;
}

export const StaffAssistedPurchaseModal: React.FC<StaffAssistedPurchaseModalProps> = ({
  isOpen,
  onClose,
  onViewGeneratedTicket,
}) => {
  const { events, purchaseTickets, currentUser } = useTicketContext();

  // Lock background scrolling when assisted purchase modal is open
  useBodyScrollLock(isOpen);

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('Walk-in box office purchase');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [completedResult, setCompletedResult] = useState<{
    order: OrderItem;
    tickets: Ticket[];
  } | null>(null);

  // Reset form and step whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setCompletedResult(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const activeTicketTypes = currentEvent?.ticketTypes || [];
  const currentTicketType =
    activeTicketTypes.find((t) => t.id === selectedTypeId) || activeTicketTypes[0];

  const remaining = currentTicketType ? currentTicketType.quantity - currentTicketType.sold : 0;
  const totalAmount = currentTicketType ? currentTicketType.price * quantity : 0;

  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    setStep('confirm');
  };

  const handleExecutePurchase = () => {
    if (!currentEvent || !currentTicketType) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const emailValue = customerEmail.trim() || `${customerPhone.replace(/\s+/g, '')}@walkin.guest`;

      const result = purchaseTickets({
        event: currentEvent,
        ticketType: currentTicketType,
        quantity,
        customerInfo: {
          name: customerName,
          phone: customerPhone,
          email: emailValue,
          notes,
        },
        paymentMethod,
        source: 'STAFF_ASSISTED',
        staffCreator: currentUser,
      });

      setIsSubmitting(false);
      setCompletedResult(result);
      setStep('success');
    }, 400);
  };

  const handleResetAndClose = () => {
    setStep('form');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCompletedResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-xl bg-white rounded-xl border border-[#EAEAEA] overflow-hidden text-[#111111] my-8 shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-[#111111] text-white rounded-[4px] text-[10px] font-mono font-medium uppercase tracking-wider">
              Box Office
            </span>
            <div>
              <h3 className="font-semibold text-base text-[#111111]">
                Counter Pass Issuance
              </h3>
              <p className="text-xs text-[#787774]">
                Staff-assisted point-of-sale checkout
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-zinc-400 hover:text-[#111111] hover:bg-[#F4F4F2] rounded-[6px] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: FORM INPUT */}
        {step === 'form' && (
          <form onSubmit={handleNextToConfirm} className="p-6 space-y-4">
            {/* Event & Ticket Selection */}
            <div className="space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                Event & Admission Tier
              </span>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Target Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    const ev = events.find((item) => item.id === e.target.value);
                    if (ev && ev.ticketTypes[0]) {
                      setSelectedTypeId(ev.ticketTypes[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Ticket Tier
                  </label>
                  <select
                    value={selectedTypeId || currentTicketType?.id}
                    onChange={(e) => setSelectedTypeId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition cursor-pointer"
                  >
                    {activeTicketTypes.map((tt) => (
                      <option key={tt.id} value={tt.id}>
                        {tt.name} (${tt.price.toFixed(2)}) · {tt.quantity - tt.sold} left
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Pass Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(remaining, 20)}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111] transition"
                  />
                </div>
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="space-y-3 pt-2 border-t border-[#EAEAEA]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                Attendee Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Attendee Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Chan Dara / Walk-in Guest"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 012 345 678"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. customer@gmail.com"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Internal Note / Memo
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Paid cash at counter gate 1"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Record */}
            <div className="space-y-2 pt-2 border-t border-[#EAEAEA]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                Payment Method Received
              </span>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'QR_PAYMENT', label: 'KHQR', icon: QrCode },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'ONLINE', label: 'Online', icon: Globe },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2 rounded-[6px] border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-[#111111] bg-[#F7F6F3] text-[#111111] font-semibold'
                          : 'border-[#EAEAEA] text-[#787774] hover:border-zinc-400 bg-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#111111]' : 'text-zinc-500'}`} />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtotal & Next Button */}
            <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">Total Due</span>
                <span className="text-lg font-bold font-mono text-[#111111]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                disabled={!customerName || !customerPhone || remaining < quantity}
                className="py-2 px-4 bg-[#111111] hover:bg-[#222222] disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-medium rounded-[6px] transition flex items-center gap-2 text-xs cursor-pointer active:scale-[0.98]"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: CONFIRMATION VIEW */}
        {step === 'confirm' && (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-[#FBFBFA] rounded-lg border border-[#EAEAEA] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Order Verification
              </span>
              <h4 className="font-serif text-lg font-medium text-[#111111]">Verify Payment Collection</h4>
              <p className="text-xs text-[#787774]">
                Confirm receipt of{' '}
                <strong className="text-[#111111] font-mono">${totalAmount.toFixed(2)}</strong> via {paymentMethod}
              </p>
            </div>

            <div className="bg-[#FBFBFA] rounded-lg p-4 border border-[#EAEAEA] space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#EAEAEA] pb-2">
                <span className="text-[#787774]">Customer</span>
                <span className="font-medium text-[#111111]">{customerName}</span>
              </div>
              <div className="flex justify-between border-b border-[#EAEAEA] pb-2">
                <span className="text-[#787774]">Phone</span>
                <span className="font-mono text-[#111111]">{customerPhone}</span>
              </div>
              <div className="flex justify-between border-b border-[#EAEAEA] pb-2">
                <span className="text-[#787774]">Event</span>
                <span className="font-medium text-[#111111]">{currentEvent?.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#EAEAEA] pb-2">
                <span className="text-[#787774]">Admission Tier</span>
                <span className="font-medium text-[#111111]">
                  {quantity}x {currentTicketType?.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#EAEAEA] pb-2">
                <span className="text-[#787774]">Payment Method</span>
                <span className="px-1.5 py-0.5 bg-[#F4F4F2] text-[#111111] rounded text-[10px] font-mono border border-[#EAEAEA]">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-medium text-zinc-700">Total Collected</span>
                <span className="text-lg font-bold text-[#111111] font-mono">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 py-2 px-3 bg-white hover:bg-[#F7F6F3] text-zinc-700 border border-[#EAEAEA] rounded-[6px] text-xs font-medium transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecutePurchase}
                disabled={isSubmitting}
                className="flex-2 py-2 px-4 bg-[#111111] hover:bg-[#222222] disabled:opacity-50 text-white rounded-[6px] text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span>Issuing Passes...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Issue Passes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & TICKET HANDOVER */}
        {step === 'success' && completedResult && (
          <div className="p-6 text-center space-y-4">
            <div className="w-10 h-10 bg-[#EDF3EC] text-[#346538] rounded-full flex items-center justify-center mx-auto border border-[#DBEADB]">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 bg-[#EDF3EC] text-[#346538] text-[10px] font-mono font-medium rounded-full border border-[#DBEADB] uppercase">
                Confirmed
              </span>
              <h4 className="font-serif text-xl font-medium text-[#111111] mt-1.5">
                Passes Issued Successfully
              </h4>
              <p className="text-xs text-[#787774] mt-0.5 font-mono">
                Order <kbd>{completedResult.order.orderNumber}</kbd> • Box Office Counter
              </p>
            </div>

            {/* Issued Passes */}
            <div className="p-3 bg-[#FBFBFA] rounded-lg border border-[#EAEAEA] text-left space-y-2 max-h-48 overflow-y-auto">
              {completedResult.tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-white rounded-[6px] border border-[#EAEAEA] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <TicketIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <div>
                      <span className="font-mono font-medium text-[#111111]">{t.ticketNumber}</span>
                      <span className="text-[#787774] block text-[10px] font-sans">{t.customerName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onViewGeneratedTicket(t);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F7F6F3] text-[#111111] border border-[#EAEAEA] rounded-[4px] text-xs font-medium transition cursor-pointer"
                  >
                    View Pass
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  if (completedResult.tickets[0]) {
                    onViewGeneratedTicket(completedResult.tickets[0]);
                  }
                }}
                className="flex-1 py-2 px-4 bg-[#111111] hover:bg-[#222222] text-white rounded-[6px] text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Digital Pass</span>
              </button>
              <button
                onClick={handleResetAndClose}
                className="py-2 px-4 bg-white hover:bg-[#F7F6F3] text-zinc-700 border border-[#EAEAEA] rounded-[6px] text-xs font-medium transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
