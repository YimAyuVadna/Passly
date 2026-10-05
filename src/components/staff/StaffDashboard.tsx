import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Ticket as TicketIcon,
  QrCode,
  Tag,
  Edit3,
  Plus,
} from 'lucide-react';
import { Ticket } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import { HeroBannerModal } from '../admin/HeroBannerModal';
import { CategoryManageModal } from '../admin/CategoryManageModal';
import { EventFormModal } from '../admin/EventFormModal';

interface StaffDashboardProps {
  onOpenScanner?: () => void;
  onOpenAssistedPurchase: () => void;
  onSelectTicket: (ticket: Ticket) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onOpenAssistedPurchase,
  onSelectTicket,
}) => {
  const { tickets, scanLogs, orders, currentUser, markTicketStatus, createEvent, mlScanStats } = useTicketContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'ALL' | 'VALID' | 'ALREADY_USED' | 'INVALID'>('ALL');
  const [manualValidationSuccess, setManualValidationSuccess] = useState<string | null>(null);

  // Storefront & event creation modal state for Senior Staff & Admin
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const isSeniorStaff =
    currentUser.role === 'ADMIN' ||
    currentUser.staffRole === 'SENIOR_STAFF' ||
    currentUser.staffRole === 'SUPER_ADMIN';

  // Today's statistics calculations
  const totalScanned = tickets.filter((t) => t.status === 'USED').length;
  const validRemaining = tickets.filter((t) => t.status === 'VALID').length;
  const staffSalesOrders = orders.filter((o) => o.source === 'STAFF_ASSISTED');
  const totalStaffRevenue = staffSalesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalSoldToday = orders.reduce((sum, o) => sum + o.quantity, 0);

  // Ticket Search query matching Ticket ID, Order ID, Customer Name, Guest Name, Phone, Email
  const matchedTickets = searchQuery.trim()
    ? tickets.filter((t) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.orderNumber.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          (t.sharedToName && t.sharedToName.toLowerCase().includes(q)) ||
          t.customerPhone.includes(q) ||
          t.customerEmail.toLowerCase().includes(q) ||
          t.eventName.toLowerCase().includes(q)
        );
      })
    : [];

  // Filtered scan history
  const filteredScans = scanLogs.filter((log) => {
    if (filterResult === 'ALL') return true;
    return log.result === filterResult;
  });

  const handleManualValidate = (ticket: Ticket) => {
    const attendeeLabel = ticket.sharedToName || ticket.customerName;
    const note = ticket.sharedToName
      ? `Manual validation by staff ${currentUser.name} for guest ${ticket.sharedToName} (shared via ${ticket.customerName})`
      : `Manual validation by staff ${currentUser.name}`;
    markTicketStatus(ticket.id, 'USED', note);
    setManualValidationSuccess(`Ticket ${ticket.ticketNumber} validated manually for ${attendeeLabel}. Attendee admitted.`);
    setTimeout(() => setManualValidationSuccess(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Staff Operational Header */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#EAEAEA]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-[#787774] font-mono">
              <span className="uppercase tracking-wider text-[11px]">Staff Gate</span>
              <span>•</span>
              <span>Operator: <strong className="text-[#111111] font-medium font-sans">{currentUser.name}</strong></span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#111111]">
              Gate Checkpoint & Box Office
            </h1>
            <p className="text-xs sm:text-sm text-[#787774] mt-1 max-w-xl">
              Ticket admission scanning, validation audit logs, and box office point-of-sale checkout.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAssistedPurchase}
              className="px-4 py-2.5 bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-[6px] transition flex items-center gap-2 text-xs cursor-pointer active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-300" />
              <span>Box Office Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Senior Staff Merchandising & Storefront Controls */}
      {isSeniorStaff && (
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111111]">Storefront Management</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#FBF3DB] text-[#956400] border border-[#F6E7B9]">
                Senior Staff
              </span>
            </div>
            <p className="text-xs text-[#787774] mt-0.5">
              Curate spotlight banners and organize public event categories.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateEventModalOpen(true)}
              className="px-3 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-[6px] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
            <button
              onClick={() => setIsHeroModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-[#F7F6F3] text-[#111111] border border-[#EAEAEA] rounded-[6px] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Spotlight</span>
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-[#F7F6F3] text-[#111111] border border-[#EAEAEA] rounded-[6px] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>Categories</span>
            </button>
          </div>
        </div>
      )}

      {/* Pass Distribution Statistics Card */}
      <div className="bg-white rounded-xl border border-[#EAEAEA] p-5 text-[#111111]">
        <div className="border-b border-[#EAEAEA] pb-3">
          <h3 className="text-sm font-semibold text-[#111111]">Pass Verification Telemetry</h3>
          <p className="text-xs text-[#787774] mt-0.5">
            Ratio of verified admissions: Digital Online vs Box Office Counter.
          </p>
        </div>

        {/* Breakdown Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
          <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3.5">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Verified Passes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {mlScanStats.totalScanned}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">total</span>
            </div>
          </div>

          <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider">
                Digital (Online)
              </span>
              <span className="text-xs font-mono font-semibold text-[#111111]">
                {mlScanStats.digitalPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {mlScanStats.digitalCount}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">passes</span>
            </div>
          </div>

          <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider">
                Box Office
              </span>
              <span className="text-xs font-mono font-semibold text-[#111111]">
                {mlScanStats.physicalPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {mlScanStats.physicalCount}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">passes</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Line */}
        <div className="mt-4 pt-3 border-t border-[#EAEAEA]">
          <div className="w-full h-1 bg-[#F4F4F2] rounded-full overflow-hidden flex">
            <div
              className="bg-[#111111] h-full transition-all duration-300"
              style={{ width: `${mlScanStats.totalScanned > 0 ? mlScanStats.digitalPercent : 50}%` }}
              title="Digital Ratio"
            />
            <div
              className="bg-zinc-300 h-full transition-all duration-300"
              style={{ width: `${mlScanStats.totalScanned > 0 ? mlScanStats.physicalPercent : 50}%` }}
              title="Physical Ratio"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#EAEAEA]">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Checked In
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-[#111111] font-mono mt-1 block">
            {totalScanned}
          </span>
          <span className="text-[11px] text-[#787774]">Admitted at gate</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#EAEAEA]">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Pending Entrance
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-[#111111] font-mono mt-1 block">
            {validRemaining}
          </span>
          <span className="text-[11px] text-[#787774]">Unscanned tickets</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#EAEAEA]">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Tickets Issued
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-[#111111] font-mono mt-1 block">
            {totalSoldToday}
          </span>
          <span className="text-[11px] text-[#787774]">Total attendee count</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#EAEAEA]">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Box Office Sales
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-[#111111] font-mono mt-1 block">
            ${totalStaffRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-[#787774]">{staffSalesOrders.length} counter orders</span>
        </div>
      </div>

      {/* Manual Search & Fallback Validation */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-[#111111] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              Ticket Lookup & Manual Check In
            </h3>
            <p className="text-xs text-[#787774] mt-0.5">
              Search by Ticket Number, Order ID, Customer Name, Phone, or Email
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket #, name, phone..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition"
            />
          </div>
        </div>

        {/* Success message banner */}
        {manualValidationSuccess && (
          <div className="p-3 bg-[#EDF3EC] border border-[#DBEADB] rounded-[6px] text-xs font-medium text-[#346538] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#346538] shrink-0" />
            <span>{manualValidationSuccess}</span>
          </div>
        )}

        {/* Search Results Display */}
        {searchQuery.trim() && (
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Search Results ({matchedTickets.length})
            </span>

            {matchedTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-lg border border-[#EAEAEA] bg-white space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-medium text-[#111111]">
                          <kbd>{t.ticketNumber}</kbd>
                        </span>
                        <h4 className="font-serif text-sm font-medium text-[#111111] mt-1">{t.eventName}</h4>
                        <p className="text-[11px] text-[#787774] font-mono">{t.ticketTypeName} • ${t.price.toFixed(2)}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-full ${
                          t.status === 'VALID'
                            ? 'bg-[#EDF3EC] text-[#346538] border border-[#DBEADB]'
                            : t.status === 'USED'
                            ? 'bg-[#F4F4F2] text-[#787774] border border-[#EAEAEA]'
                            : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D7DA]'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#787774] space-y-0.5 border-t border-[#EAEAEA] pt-2 text-[11px]">
                      <p className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-zinc-400">Customer:</span> {t.customerName}
                        {t.sharedToName && (
                          <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[10px] font-mono">
                            Guest: {t.sharedToName}
                          </span>
                        )}
                      </p>
                      <p className="font-mono">
                        <span className="text-zinc-400 font-sans">Phone:</span> {t.customerPhone} •{' '}
                        <span className="text-zinc-400 font-sans">Order:</span> {t.orderNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {t.status === 'VALID' && (
                        <button
                          onClick={() => handleManualValidate(t)}
                          className="flex-1 py-1.5 px-3 bg-[#111111] hover:bg-[#222222] text-white rounded-[6px] text-xs font-medium transition cursor-pointer active:scale-[0.98]"
                        >
                          Check In Attendee
                        </button>
                      )}
                      <button
                        onClick={() => onSelectTicket(t)}
                        className="py-1.5 px-3 bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3] text-zinc-800 rounded-[6px] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-zinc-500" />
                        <span>View Pass</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#787774] py-4 text-center bg-[#FBFBFA] rounded-lg border border-[#EAEAEA]">
                No tickets matching "{searchQuery}".
              </p>
            )}
          </div>
        )}
      </div>

      {/* Entrance Scan History */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-[#111111] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Entrance Gate Logs
            </h3>
            <p className="text-xs text-[#787774] mt-0.5">
              Live audit trail of checkpoint validations
            </p>
          </div>

          <div className="flex items-center gap-0.5 bg-[#F4F4F2] p-0.5 rounded-md border border-[#EAEAEA]">
            {(['ALL', 'VALID', 'ALREADY_USED', 'INVALID'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterResult(filter)}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition cursor-pointer ${
                  filterResult === filter
                    ? 'bg-white text-[#111111] font-semibold border border-[#EAEAEA]'
                    : 'text-zinc-500 hover:text-[#111111]'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Scans Table */}
        <div className="overflow-x-auto rounded-lg border border-[#EAEAEA]">
          <table className="w-full text-left text-xs text-[#787774]">
            <thead className="bg-[#FBFBFA] text-zinc-400 text-[10px] font-mono uppercase tracking-wider border-b border-[#EAEAEA]">
              <tr>
                <th className="px-3.5 py-2.5">Time</th>
                <th className="px-3.5 py-2.5">Ticket</th>
                <th className="px-3.5 py-2.5">Event</th>
                <th className="px-3.5 py-2.5">Attendee</th>
                <th className="px-3.5 py-2.5">Operator</th>
                <th className="px-3.5 py-2.5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA] font-normal">
              {filteredScans.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-[#FBFBFA] transition">
                  <td className="px-3.5 py-2.5 font-mono text-zinc-400">
                    {new Date(log.scannedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-3.5 py-2.5 font-mono font-medium text-[#111111]">
                    {log.ticketNumber || 'N/A'}
                  </td>
                  <td className="px-3.5 py-2.5 truncate max-w-[160px] text-zinc-700">{log.eventName || 'General Entrance'}</td>
                  <td className="px-3.5 py-2.5 text-[#111111]">
                    {log.customerName || 'Walk-in Guest'}
                  </td>
                  <td className="px-3.5 py-2.5 text-[#787774]">{log.staffName}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-medium ${
                        log.result === 'VALID'
                          ? 'bg-[#EDF3EC] text-[#346538] border border-[#DBEADB]'
                          : log.result === 'ALREADY_USED'
                          ? 'bg-[#FBF3DB] text-[#956400] border border-[#F6E7B9]'
                          : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D7DA]'
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchandising & Event Modals for Senior Staff */}
      {isSeniorStaff && (
        <>
          <EventFormModal
            isOpen={isCreateEventModalOpen}
            onClose={() => setIsCreateEventModalOpen(false)}
            onSave={(eventData) => {
              createEvent(eventData);
              setIsCreateEventModalOpen(false);
            }}
          />
          <HeroBannerModal
            isOpen={isHeroModalOpen}
            onClose={() => setIsHeroModalOpen(false)}
          />
          <CategoryManageModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
