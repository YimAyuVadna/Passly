import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Check,
  Copy,
  Ticket as TicketIcon,
  Share2,
} from 'lucide-react';
import { Ticket } from '../../types';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { useBodyScrollLock } from '../../utils/scrollLock';
import { ShareTicketModal } from './ShareTicketModal';

interface DigitalTicketModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  allOrderTickets?: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
  isSharedView?: boolean;
}

interface PassCardProps {
  ticket: Ticket;
  passNumber?: number;
  totalPasses?: number;
  isPrintVersion?: boolean;
  isSharedView?: boolean;
}

const PassCard: React.FC<PassCardProps> = ({
  ticket,
  passNumber,
  totalPasses,
  isPrintVersion = false,
  isSharedView = false,
}) => {
  return (
    <div
      style={isPrintVersion ? { breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}
      className={`bg-white ${
        isPrintVersion
          ? 'border border-zinc-300 rounded-2xl shadow-none p-0 overflow-visible'
          : 'border border-[#C5A059]/25 rounded-2xl shadow-xs overflow-hidden'
      }`}
    >
      {/* If friend is viewing a shared admission pass, display clear attribution */}
      {isSharedView && !isPrintVersion && (
        <div className="px-4 py-2 bg-[#F0FDF4] border-b border-[#BBF7D0] flex items-center justify-between text-xs font-mono">
          <span className="font-semibold text-[#15803D] uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
            <Share2 className="w-3.5 h-3.5 text-[#16A34A]" />
            {ticket.sharedToName ? `Pass for ${ticket.sharedToName}` : 'Shared Guest Pass'}
          </span>
          <span className="text-[#166534] text-[10px]">
            Provided by {ticket.customerName}
          </span>
        </div>
      )}

      {/* If print version and multiple passes, show clear pass index header */}
      {isPrintVersion && totalPasses && totalPasses > 1 && (
        <div className="px-4 py-2 bg-[#FAF8F5] border-b border-zinc-200 flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-[#111111] uppercase tracking-wider">
            Pass {passNumber} of {totalPasses}
          </span>
          <span className="text-zinc-500 text-[10px] font-sans">
            Passly Verified Admission
          </span>
        </div>
      )}

      {/* Top Pass Header */}
      <div className={`${isPrintVersion ? 'p-4' : 'p-5'} space-y-2.5 border-b border-[#C5A059]/15`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]/60 rounded-full text-[9px] font-mono font-semibold tracking-[0.16em] uppercase">
              {ticket.ticketTypeName}
            </span>
            {ticket.isShared && (
              <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-full text-[9px] font-mono font-medium flex items-center gap-1">
                <Share2 className="w-2.5 h-2.5 text-[#059669]" />
                <span>{ticket.sharedToName ? `Shared to ${ticket.sharedToName}` : 'Shared'}</span>
              </span>
            )}
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase ${
              ticket.status === 'VALID'
                ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                : ticket.status === 'USED'
                ? 'bg-[#F4F4F2] text-[#787774] border border-[#EAEAEA]'
                : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D7DA]'
            }`}
          >
            {ticket.status}
          </span>
        </div>

        <h4 className="font-serif text-base sm:text-lg font-medium text-[#111111] tracking-tight leading-snug">
          {ticket.eventName}
        </h4>

        <div className="space-y-1 text-xs text-[#8F681B] font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#B88B2A]" />
            <span>{ticket.eventDate}</span>
            <span className="text-[#C5A059]/50">•</span>
            <Clock className="w-3.5 h-3.5 text-[#B88B2A]" />
            <span>{ticket.eventTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#B88B2A] shrink-0" />
            <span className="truncate">{ticket.eventLocation}</span>
          </div>
        </div>
      </div>

      {/* Perforated Divider */}
      <div className="border-t border-dashed border-[#C5A059]/30" />

      {/* QR Code Section */}
      <div className={`${isPrintVersion ? 'p-4' : 'p-5'} text-center space-y-2.5 bg-white`}>
        <div className="inline-block relative">
          <div className="p-2.5 bg-white rounded-xl border border-[#C5A059]/40 shadow-xs inline-block">
            <QRCodeDisplay value={ticket.qrToken} size={isPrintVersion ? 135 : 150} />
          </div>
          {ticket.status === 'USED' && (
            <div className="absolute inset-0 bg-[#111111]/80 rounded-lg flex items-center justify-center">
              <span className="px-2.5 py-1 bg-[#111111] text-white font-mono text-[10px] uppercase tracking-wider rounded-[4px] border border-zinc-600">
                TICKET USED
              </span>
            </div>
          )}
          {ticket.status === 'EXPIRED' && (
            <div className="absolute inset-0 bg-[#111111]/80 rounded-lg flex items-center justify-center">
              <span className="px-2.5 py-1 bg-[#9F2F2D] text-white font-mono text-[10px] uppercase tracking-wider rounded-[4px]">
                EXPIRED
              </span>
            </div>
          )}
          {ticket.status === 'CANCELLED' && (
            <div className="absolute inset-0 bg-[#111111]/80 rounded-lg flex items-center justify-center">
              <span className="px-2.5 py-1 bg-[#9F2F2D] text-white font-mono text-[10px] uppercase tracking-wider rounded-[4px]">
                CANCELLED
              </span>
            </div>
          )}
        </div>

        {/* Status explanation */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
            Admission QR Token
          </p>
          <p className="text-[11px] text-[#787774]">
            Scan at entrance gate checkpoint
          </p>
        </div>

        {/* Ticket Details Grid */}
        <div className="pt-2.5 border-t border-[#C5A059]/20 grid grid-cols-2 gap-2 text-left text-xs font-mono">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Pass ID</span>
            <span className="font-semibold text-[#111111] text-xs">
              {ticket.ticketNumber}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Order Ref</span>
            <span className="text-[#787774] text-xs">
              {ticket.orderNumber}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">
              {ticket.sharedToName ? 'Pass Holder' : 'Attendee'}
            </span>
            <span className="font-medium text-[#111111] truncate block text-xs font-sans">
              {ticket.sharedToName || ticket.customerName}
            </span>
            {ticket.sharedToName && (
              <span className="text-[10px] text-[#8F681B] truncate block font-sans">
                via {ticket.customerName}
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Price</span>
            <span className="font-semibold text-[#9A7424] text-xs">
              ${ticket.price.toFixed(2)}
            </span>
          </div>
        </div>

        {ticket.usedAt && (
          <div className="p-2 bg-[#FAF8F5] border border-[#C5A059]/20 rounded-[6px] text-[11px] text-[#787774] text-left font-mono">
            <span className="font-medium block text-[#111111]">Checked In:</span>
            <span>
              {new Date(ticket.usedAt).toLocaleTimeString()} • {ticket.usedBy || 'Staff'}
            </span>
          </div>
        )}
      </div>

      {isPrintVersion && (
        <div className="px-4 py-2 bg-[#FAF8F5] border-t border-zinc-200 text-center">
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            Passly Verified Admission • Present at entrance checkpoint
          </p>
        </div>
      )}
    </div>
  );
};

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  ticket,
  onClose,
  allOrderTickets = [],
  onSelectTicket,
  isSharedView = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [printScope, setPrintScope] = useState<'all' | 'single'>('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Lock background scrolling when digital ticket modal is open
  useBodyScrollLock(Boolean(ticket));

  // Manage print classes on document.body for flawless print isolation
  useEffect(() => {
    if (ticket) {
      document.body.classList.add('passly-ticket-modal-open');
      const handleAfterPrint = () => {
        document.body.classList.remove('passly-printing-tickets');
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        document.body.classList.remove('passly-ticket-modal-open');
        document.body.classList.remove('passly-printing-tickets');
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [ticket]);

  if (!ticket) return null;

  const currentIndex = allOrderTickets.findIndex((t) => t.id === ticket.id);
  const activePassNum = currentIndex >= 0 ? currentIndex + 1 : 1;
  const totalOrderTickets = allOrderTickets.length > 0 ? allOrderTickets.length : 1;
  const canShare = !isSharedView && !ticket.isShared;

  const executePrint = (scope: 'all' | 'single') => {
    setPrintScope(scope);
    document.body.classList.add('passly-printing-tickets');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine tickets that will be printed
  const ticketsToPrint =
    !isSharedView && printScope === 'all' && allOrderTickets.length > 0
      ? allOrderTickets
      : [ticket];

  return (
    <>
      {/* On-screen Interactive Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
        <div className="relative w-full max-w-sm double-bezel-tray-lg shadow-[0_24px_50px_rgba(0,0,0,0.15)] my-8 p-2">
          <div className="double-bezel-core-lg overflow-hidden text-[#111111]">
            {/* Top Header Actions */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#C5A059]/15">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#0B0F17] text-[#D4AF37] border border-[#C5A059]/30 flex items-center justify-center">
                  <TicketIcon className="w-3 h-3" />
                </div>
                <span className="font-semibold text-xs text-[#111111]">Admission Pass</span>
              </div>
              <div className="flex items-center gap-1">
                {canShare && (
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    title="Share this Pass"
                    className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#0B0F17] hover:bg-[#C5A059]/10 transition flex items-center justify-center cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!canShare && !isSharedView && ticket.isShared && (
                  <button
                    disabled
                    title={`Pass already shared${ticket.sharedToName ? ` to ${ticket.sharedToName}` : ''}`}
                    className="w-7 h-7 rounded-full text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0]/60 flex items-center justify-center cursor-default"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => executePrint(!isSharedView && allOrderTickets.length > 1 ? 'all' : 'single')}
                  title={!isSharedView && allOrderTickets.length > 1 ? `Print All (${allOrderTickets.length} Passes)` : 'Print Pass'}
                  className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#0B0F17] hover:bg-[#C5A059]/10 transition flex items-center justify-center cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopyCode}
                  title="Copy Ticket ID"
                  className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#0B0F17] hover:bg-[#C5A059]/10 transition flex items-center justify-center cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#065F46]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#0B0F17] hover:bg-[#C5A059]/10 transition flex items-center justify-center ml-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Multi-pass switcher (hidden if in shared single-pass recipient view) */}
            {!isSharedView && allOrderTickets.length > 1 && onSelectTicket && (
              <div
                data-hide-scrollbar
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="px-5 py-2.5 bg-[#FAF8F5] border-b border-[#C5A059]/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 select-none"
              >
                <span className="text-[11px] font-mono text-[#8F681B] font-medium shrink-0">Pass:</span>
                {allOrderTickets.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={(e) => {
                      onSelectTicket(t);
                      e.currentTarget.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest',
                      });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 ${
                      t.id === ticket.id
                        ? 'bg-[#0B0F17] text-[#FAF8F5] border border-[#C5A059]/40 font-medium shadow-xs'
                        : 'bg-white text-zinc-600 hover:bg-[#FDF8EE] border border-[#C5A059]/20'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Interactive Modal Body */}
            <div className="p-4 bg-[#FAF8F5]">
              <PassCard
                ticket={ticket}
                passNumber={activePassNum}
                totalPasses={totalOrderTickets}
                isPrintVersion={false}
                isSharedView={isSharedView}
              />
            </div>

            {/* Bottom Bar Actions */}
            <div className="px-5 py-3 bg-white border-t border-[#C5A059]/15 flex items-center justify-between gap-3 text-xs text-[#787774]">
              <button
                type="button"
                onClick={() => executePrint('single')}
                className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F4EFE6] border border-[#C5A059]/30 text-[#0B0F17] font-medium rounded-full transition text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span>Print Pass</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] text-[#0B0F17] font-semibold rounded-full transition-spring text-xs cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(212,175,55,0.25)] shrink-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Ticket Dialog Modal */}
      {isShareModalOpen && canShare && ticket && (
        <ShareTicketModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          ticket={ticket}
          passNumber={activePassNum}
          totalPasses={totalOrderTickets}
        />
      )}

      {/* Dedicated print-only container ported directly to document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="printable-ticket-area">
            {ticketsToPrint.map((t, idx) => (
              <div key={t.id} className="print-ticket-page">
                <PassCard
                  ticket={t}
                  passNumber={idx + 1}
                  totalPasses={ticketsToPrint.length}
                  isPrintVersion={true}
                  isSharedView={isSharedView}
                />
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
