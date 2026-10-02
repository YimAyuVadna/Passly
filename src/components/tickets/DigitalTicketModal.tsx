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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden text-zinc-900 border border-zinc-200 print:border-none print:shadow-none my-8">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 print:hidden">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-4 h-4 text-zinc-800" />
            <span className="font-medium text-xs text-zinc-900">Digital Pass</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              title="Print Pass"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopyCode}
              title="Copy Ticket ID"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition ml-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-pass switcher */}
        {allOrderTickets.length > 1 && onSelectTicket && (
          <div className="px-5 py-2 bg-zinc-50 border-b border-zinc-100 flex items-center gap-1.5 overflow-x-auto print:hidden">
            <span className="text-[11px] font-mono text-zinc-400 shrink-0">Pass:</span>
            {allOrderTickets.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition shrink-0 cursor-pointer ${
                  t.id === ticket.id
                    ? 'bg-zinc-950 text-white font-medium'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Printable Ticket Body */}
        <div ref={printRef} className="p-4 bg-zinc-50/50">
          {/* Ticket Card Container */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            {/* Top Pass Header */}
            <div className="p-5 space-y-3 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-mono font-medium tracking-wide text-zinc-700 uppercase">
                  {ticket.ticketTypeName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                    ticket.status === 'VALID'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : ticket.status === 'USED'
                      ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>

              <h4 className="text-base font-semibold text-zinc-950 tracking-tight leading-snug">
                {ticket.eventName}
              </h4>

              <div className="space-y-1 text-xs text-zinc-500">
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
            <div className="border-t border-dashed border-zinc-200" />

            {/* QR Code Section */}
            <div className="p-5 text-center space-y-3 bg-white">
              <div className="inline-block relative">
                <div className="p-2.5 bg-white rounded-lg border border-zinc-200 shadow-2xs inline-block">
                  <QRCodeDisplay value={ticket.qrToken} size={150} />
                </div>
                {ticket.status === 'USED' && (
                  <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                    <span className="px-2.5 py-1 bg-zinc-900 text-white font-mono text-[11px] uppercase tracking-wider rounded border border-zinc-700">
                      TICKET USED
                    </span>
                  </div>
                )}
                {ticket.status === 'EXPIRED' && (
                  <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                    <span className="px-2.5 py-1 bg-rose-700 text-white font-mono text-[11px] uppercase tracking-wider rounded border border-rose-600">
                      EXPIRED
                    </span>
                  </div>
                )}
                {ticket.status === 'CANCELLED' && (
                  <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                    <span className="px-2.5 py-1 bg-rose-700 text-white font-mono text-[11px] uppercase tracking-wider rounded">
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
                <p className="text-[11px] text-zinc-500">
                  Scan at entrance gate checkpoint
                </p>
              </div>

              {/* Ticket Details Grid */}
              <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-left text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Pass ID</span>
                  <span className="font-mono font-medium text-zinc-900 text-xs">
                    {ticket.ticketNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Order Ref</span>
                  <span className="font-mono text-zinc-700 text-xs">
                    {ticket.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Attendee</span>
                  <span className="font-medium text-zinc-900 truncate block text-xs">
                    {ticket.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Price</span>
                  <span className="font-mono font-medium text-zinc-900 text-xs">
                    ${ticket.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {ticket.usedAt && (
                <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-md text-[11px] text-zinc-700 text-left">
                  <span className="font-medium block">Checked In:</span>
                  <span>
                    {new Date(ticket.usedAt).toLocaleTimeString()} • {ticket.usedBy || 'Staff'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-5 py-3 bg-white border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 print:hidden">
          <span className="text-[11px] font-mono">Verified Pass</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-md transition text-xs shadow-2xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

