import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Globe,
  Lock,
  CheckCircle2,
  Ticket as TicketIcon,
  ArrowRight,
} from 'lucide-react';
import { EventItem, TicketType, PaymentMethod, Ticket, OrderItem } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  ticketType: TicketType | null;
  quantity: number;
  onSuccessViewTickets: (tickets: Ticket[]) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  ticketType,
  quantity,
  onSuccessViewTickets,
}) => {
  const { currentUser, isLoggedIn, purchaseTickets } = useTicketContext();

  const [name, setName] = useState(isLoggedIn ? currentUser.name : '');
  const [phone, setPhone] = useState(isLoggedIn ? currentUser.phone : '');
  const [email, setEmail] = useState(isLoggedIn ? currentUser.email : '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QR_PAYMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    order: OrderItem;
    tickets: Ticket[];
  } | null>(null);

  // Lock background scrolling when checkout modal is open
  useBodyScrollLock(isOpen && Boolean(event) && Boolean(ticketType));

  // Sync with current user when opening or auth changes, ensure completedOrder is reset
  React.useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setIsSubmitting(false);
      if (isLoggedIn) {
        setName(currentUser.name);
        setPhone(currentUser.phone);
        setEmail(currentUser.email);
      } else {
        setName('');
        setPhone('');
        setEmail('');
      }
    }
  }, [isOpen, isLoggedIn, currentUser]);

  if (!isOpen || !event || !ticketType) return null;

  const total = ticketType.price * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const result = purchaseTickets({
        event,
        ticketType,
        quantity,
        customerInfo: {
          name,
          phone,
          email,
          notes: notes.trim() || undefined,
        },
        paymentMethod,
        source: 'ONLINE',
      });

      setIsSubmitting(false);
      setCompletedOrder(result);
    }, 400);
  };

  const handleReset = () => {
    setCompletedOrder(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleViewTickets = () => {
    if (completedOrder) {
      const ticketsToView = completedOrder.tickets;
      setCompletedOrder(null);
      setIsSubmitting(false);
      onClose();
      onSuccessViewTickets(ticketsToView);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-lg double-bezel-tray-lg shadow-[0_24px_50px_rgba(0,0,0,0.15)] my-8 p-2">
        <div className="double-bezel-core-lg overflow-hidden text-[#111111]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#111111]/[0.06]">
            <div>
              <h3 className="font-semibold text-base text-[#111111]">
                {completedOrder ? 'Order Confirmed' : 'Checkout'}
              </h3>
              <p className="text-xs text-[#787774]">
                {completedOrder
                  ? 'Your verified passes have been issued'
                  : 'Direct digital admission pass with live QR validation'}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-zinc-600 hover:text-[#111111] border border-[#111111]/[0.08] shadow-xs flex items-center justify-center transition-spring cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        {/* Content */}
        {completedOrder ? (
          /* SUCCESS CONFIRMATION VIEW */
          <div className="p-6 text-center space-y-5">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-lg flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#346538] bg-[#EDF3EC] px-2.5 py-0.5 rounded-full border border-[#DBEADB] font-semibold">
                Payment Confirmed
              </span>
              <h4 className="font-serif text-xl font-medium text-[#111111] pt-1">
                Thank You, {completedOrder.order.customerName}
              </h4>
              <p className="text-xs text-[#787774] font-mono">
                Order Reference: <kbd>{completedOrder.order.orderNumber}</kbd>
              </p>
            </div>

            {/* Generated Tickets Card */}
            <div className="p-4 bg-[#FBFBFA] rounded-lg border border-[#EAEAEA] text-left space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Event</span>
                  <h5 className="font-semibold text-[#111111]">{event.name}</h5>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Issued</span>
                  <span className="font-medium text-[#111111]">
                    {completedOrder.tickets.length} Digital {completedOrder.tickets.length > 1 ? 'Passes' : 'Pass'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {completedOrder.tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-white rounded-[6px] border border-[#EAEAEA] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <TicketIcon className="w-3.5 h-3.5 text-zinc-600" />
                      <div>
                        <span className="font-mono font-medium text-[#111111]">{t.ticketNumber}</span>
                        <span className="text-[#787774] ml-2 font-sans">({t.customerName})</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-[#EDF3EC] text-[#346538] text-[10px] font-mono font-medium rounded-full border border-[#DBEADB]">
                      VALID
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleViewTickets}
                className="group flex-1 py-2.5 pl-5 pr-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] text-[#0B0F17] font-semibold rounded-full transition-spring text-xs flex items-center justify-between cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
              >
                <span>View Digital Pass</span>
                <span className="btn-nested-icon w-6 h-6 rounded-full bg-[#0B0F17] text-[#D4AF37] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </span>
              </button>
              <button
                onClick={handleReset}
                className="py-2.5 px-5 bg-white hover:bg-[#FDF8EE] border border-[#C5A059]/30 text-zinc-700 font-medium rounded-full transition text-xs cursor-pointer shadow-2xs"
              >
                Back to Events
              </button>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM VIEW */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Order Summary banner */}
            <div className="p-3.5 bg-[#FBFBFA] rounded-lg border border-[#EAEAEA] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  {event.name}
                </span>
                <span className="text-xs font-semibold text-[#111111]">
                  {quantity}x {ticketType.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Total Due</span>
                <span className="text-base font-bold text-[#111111] font-mono">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer Information Form */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                  Attendee Information
                </h4>
                <span className="text-[10px] font-mono text-[#787774]">
                  {isLoggedIn ? `Signed in: ${currentUser.name}` : 'Guest Checkout'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rathana Kem"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Special Requests / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Seating preferences or accessibility needs..."
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-1">
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Payment Method
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR_PAYMENT')}
                  className={`p-2.5 rounded-[6px] border text-center transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                    paymentMethod === 'QR_PAYMENT'
                      ? 'border-[#C5A059] bg-[#FDF8EE] font-medium text-[#0B0F17] shadow-xs'
                      : 'border-[#EAEAEA] hover:border-[#C5A059]/40 text-zinc-600 bg-white'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-[#B88B2A]" />
                  <span className="text-xs font-medium">QR Pay</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Bakong KHQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-2.5 rounded-[6px] border text-center transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'border-[#C5A059] bg-[#FDF8EE] font-medium text-[#0B0F17] shadow-xs'
                      : 'border-[#EAEAEA] hover:border-[#C5A059]/40 text-zinc-600 bg-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#B88B2A]" />
                  <span className="text-xs font-medium">Card</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Visa / Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-2.5 rounded-[6px] border text-center transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                    paymentMethod === 'ONLINE'
                      ? 'border-[#C5A059] bg-[#FDF8EE] font-medium text-[#0B0F17] shadow-xs'
                      : 'border-[#EAEAEA] hover:border-[#C5A059]/40 text-zinc-600 bg-white'
                  }`}
                >
                  <Globe className="w-4 h-4 text-[#B88B2A]" />
                  <span className="text-xs font-medium">Online Bank</span>
                  <span className="text-[10px] text-zinc-400 font-mono">ABA Pay</span>
                </button>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#787774] pt-1 font-mono">
              <Lock className="w-3 h-3 text-[#B88B2A]" />
              <span>Encrypted checkout with real-time pass generation.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !name || !phone || !email}
              className="group w-full py-2.5 pl-6 pr-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] disabled:opacity-40 disabled:pointer-events-none text-[#0B0F17] font-semibold rounded-full transition-spring flex items-center justify-between text-xs cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2 mx-auto py-0.5">
                  <div className="w-3.5 h-3.5 border-2 border-[#0B0F17] border-t-transparent rounded-full animate-spin" />
                  <span>Issuing Passes...</span>
                </div>
              ) : (
                <>
                  <span>Pay ${total.toFixed(2)} & Issue Digital Passes</span>
                  <span className="btn-nested-icon w-6 h-6 rounded-full bg-[#0B0F17] text-[#D4AF37] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                </>
              )}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
