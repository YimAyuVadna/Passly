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
  UserCheck,
} from 'lucide-react';
import { EventItem, TicketType, PaymentMethod, Ticket, OrderItem } from '../../types';
import { useTicketContext } from '../../context/TicketContext';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden text-zinc-900 border border-zinc-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h3 className="font-semibold text-base text-zinc-900">
              {completedOrder ? 'Order Confirmed' : 'Checkout'}
            </h3>
            <p className="text-xs text-zinc-400">
              {completedOrder
                ? 'Your admission pass has been issued'
                : 'Direct digital admission pass with QR validation'}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {completedOrder ? (
          /* SUCCESS CONFIRMATION VIEW */
          <div className="p-6 text-center space-y-5">
            <div className="w-10 h-10 bg-zinc-950 text-white rounded-lg flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Payment Confirmed
              </span>
              <h4 className="text-lg font-semibold text-zinc-900 pt-1">
                Thank You, {completedOrder.order.customerName}
              </h4>
              <p className="text-xs text-zinc-500 font-mono">
                Order Ref: {completedOrder.order.orderNumber}
              </p>
            </div>

            {/* Generated Tickets Card */}
            {/* Generated Tickets Card */}
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Event</span>
                  <h5 className="font-semibold text-zinc-900">{event.name}</h5>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Issued</span>
                  <span className="font-medium text-zinc-700">
                    {completedOrder.tickets.length} Digital {completedOrder.tickets.length > 1 ? 'Passes' : 'Pass'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {completedOrder.tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-white rounded-md border border-zinc-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <TicketIcon className="w-3.5 h-3.5 text-zinc-600" />
                      <div>
                        <span className="font-mono font-medium text-zinc-900">{t.ticketNumber}</span>
                        <span className="text-zinc-400 ml-2">({t.customerName})</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-medium rounded border border-emerald-200">
                      VALID
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleViewTickets}
                className="flex-1 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-lg transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>View Digital Pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleReset}
                className="py-2.5 px-4 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium rounded-lg transition-colors text-xs cursor-pointer"
              >
                Back to Events
              </button>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM VIEW */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Order Summary banner */}
            <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  {event.name}
                </span>
                <span className="text-xs font-semibold text-zinc-900">
                  {quantity}x {ticketType.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total</span>
                <span className="text-base font-bold text-zinc-900 font-mono">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer Information Form */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-[11px] uppercase tracking-wider text-zinc-400">
                  Attendee Information
                </h4>
                <span className={`text-[10px] font-mono ${isLoggedIn ? 'text-zinc-600' : 'text-zinc-400'}`}>
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
                    placeholder="e.g. Chan Dara"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
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
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
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
                    placeholder="chandara@gmail.com"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
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
                    placeholder="Seating preferences, accessibility..."
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-1">
              <h4 className="font-medium text-[11px] uppercase tracking-wider text-zinc-400">
                Payment Method
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR_PAYMENT')}
                  className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                    paymentMethod === 'QR_PAYMENT'
                      ? 'border-zinc-950 bg-zinc-50 font-medium text-zinc-900'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-zinc-800" />
                  <span className="text-xs font-medium">QR Pay</span>
                  <span className="text-[10px] text-zinc-400">Bakong KHQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'border-zinc-950 bg-zinc-50 font-medium text-zinc-900'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-zinc-800" />
                  <span className="text-xs font-medium">Card</span>
                  <span className="text-[10px] text-zinc-400">Visa / Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-2.5 rounded-md border text-center transition-colors flex flex-col items-center gap-0.5 cursor-pointer ${
                    paymentMethod === 'ONLINE'
                      ? 'border-zinc-950 bg-zinc-50 font-medium text-zinc-900'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <Globe className="w-4 h-4 text-zinc-800" />
                  <span className="text-xs font-medium">Online Bank</span>
                  <span className="text-[10px] text-zinc-400">ABA Pay</span>
                </button>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-1">
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>Encrypted checkout with real-time pass generation.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !name || !phone || !email}
              className="w-full py-2.5 px-5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-medium rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Issuing Passes...</span>
                </>
              ) : (
                <>
                  <span>Pay ${total.toFixed(2)} & Issue Digital Passes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

