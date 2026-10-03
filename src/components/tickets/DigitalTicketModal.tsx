import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Check,
  Copy,
  Ticket as TicketIcon,
} from 'lucide-react';
import { Ticket } from '../../types';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface DigitalTicketModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  allOrderTickets?: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  ticket,
  onClose,
  allOrderTickets = [],
  onSelectTicket,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Lock background scrolling when digital ticket modal is open
  useBodyScrollLock(Boolean(ticket));

  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain print:p-0 print:bg-white">
      <div className="relative w-full max-w-sm double-bezel-tray-lg shadow-[0_24px_50px_rgba(0,0,0,0.15)] print:border-none print:shadow-none my-8 p-2">
        <div className="double-bezel-core-lg overflow-hidden text-[#111111]">
          {/* Top Header Actions */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#111111]/[0.06] print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center">
                <TicketIcon className="w-3 h-3" />
              </div>
              <span className="font-semibold text-xs text-[#111111]">Admission Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrint}
                title="Print Pass"
                className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#111111] hover:bg-[#111111]/[0.04] transition flex items-center justify-center cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopyCode}
                title="Copy Ticket ID"
                className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#111111] hover:bg-[#111111]/[0.04] transition flex items-center justify-center cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#346538]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#111111] hover:bg-[#111111]/[0.04] transition flex items-center justify-center ml-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Multi-pass switcher */}
          {allOrderTickets.length > 1 && onSelectTicket && (
            <div className="px-5 py-2 bg-[#FBFBFA] border-b border-[#111111]/[0.06] flex items-center gap-1.5 overflow-x-auto print:hidden">
              <span className="text-[11px] font-mono text-zinc-400 shrink-0">Pass:</span>
              {allOrderTickets.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTicket(t)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono transition shrink-0 cursor-pointer ${
                    t.id === ticket.id
                      ? 'bg-[#111111] text-white font-medium shadow-xs'
                      : 'bg-white text-zinc-600 hover:bg-[#F4F4F2] border border-[#111111]/[0.08]'
                  }`}
                >
                  #{idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Printable Ticket Body */}
          <div ref={printRef} className="p-4 bg-[#FBFBFA]">
            {/* Ticket Card Double-Bezel Container */}
            <div className="border border-[#111111]/[0.08] rounded-2xl overflow-hidden bg-white shadow-xs">
              {/* Top Pass Header */}
              <div className="p-5 space-y-3 border-b border-[#111111]/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-[#E1F3FE] text-[#1F6C9F] rounded-full text-[9px] font-mono font-semibold tracking-[0.16em] uppercase">
                    {ticket.ticketTypeName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase ${
                      ticket.status === 'VALID'
                        ? 'bg-[#EDF3EC] text-[#346538] border border-[#DBEADB]'
                        : ticket.status === 'USED'
                        ? 'bg-[#F4F4F2] text-[#787774] border border-[#EAEAEA]'
                        : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D7DA]'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

              <h4 className="font-serif text-lg font-medium text-[#111111] tracking-tight leading-snug">
                {ticket.eventName}
              </h4>

              <div className="space-y-1 text-xs text-[#787774] font-mono">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{ticket.eventDate}</span>
                  <span className="text-zinc-300">•</span>
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{ticket.eventTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{ticket.eventLocation}</span>
                </div>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="border-t border-dashed border-[#EAEAEA]" />

            {/* QR Code Section */}
            <div className="p-5 text-center space-y-3 bg-white">
              <div className="inline-block relative">
                <div className="p-3 bg-white rounded-lg border border-[#111111] inline-block">
                  <QRCodeDisplay value={ticket.qrToken} size={150} />
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
              <div className="pt-3 border-t border-[#EAEAEA] grid grid-cols-2 gap-2 text-left text-xs font-mono">
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
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Attendee</span>
                  <span className="font-medium text-[#111111] truncate block text-xs font-sans">
                    {ticket.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Price</span>
                  <span className="font-semibold text-[#111111] text-xs">
                    ${ticket.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {ticket.usedAt && (
                <div className="p-2 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] text-[11px] text-[#787774] text-left font-mono">
                  <span className="font-medium block text-[#111111]">Checked In:</span>
                  <span>
                    {new Date(ticket.usedAt).toLocaleTimeString()} • {ticket.usedBy || 'Staff'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-5 py-3 bg-white border-t border-[#111111]/[0.06] flex items-center justify-between text-xs text-[#787774] print:hidden">
          <span className="text-[11px] font-mono">Verified Admission Pass</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-full transition-spring text-xs cursor-pointer active:scale-[0.98] shadow-xs"
          >
            Done
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
