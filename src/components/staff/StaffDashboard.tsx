import React, { useState } from 'react';
import {
  Camera,
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
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
  onOpenScanner: () => void;
  onOpenAssistedPurchase: () => void;
  onSelectTicket: (ticket: Ticket) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onOpenScanner,
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

  // Ticket Search query matching Ticket ID, Order ID, Customer Name, Phone, Email
  const matchedTickets = searchQuery.trim()
    ? tickets.filter((t) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.orderNumber.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
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
    markTicketStatus(ticket.id, 'USED', `Manual validation by staff ${currentUser.name}`);
    setManualValidationSuccess(`Ticket ${ticket.ticketNumber} validated manually! Attendee allowed entry.`);
    setTimeout(() => setManualValidationSuccess(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Staff Operational Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-zinc-400">
              <span className="font-mono uppercase tracking-wider text-[11px]">Staff Portal</span>
              <span>•</span>
              <span>Operator: <strong className="text-zinc-900 font-medium">{currentUser.name}</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
              Gate Checkpoint & Box Office
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl">
              Ticket scanning, entrance logs, and customer assisted checkout.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-lg transition flex items-center gap-2 text-xs cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4 text-zinc-300" />
              <span>Scan Pass</span>
            </button>

            <button
              onClick={onOpenAssistedPurchase}
              className="px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-800 font-medium rounded-lg border border-zinc-200 transition flex items-center gap-2 text-xs cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-600" />
              <span>Assisted Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Senior Staff Merchandising & Storefront Controls */}
      {isSeniorStaff && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">Storefront Controls</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-700">Senior Staff / Admin</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage homepage hero spotlight and event categories.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateEventModalOpen(true)}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
            <button
              onClick={() => setIsHeroModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Hero Banner</span>
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>Categories</span>
            </button>
          </div>
        </div>
      )}

      {/* Pass Distribution Statistics Card */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs text-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Pass Verification Telemetry</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Distribution of verified admissions: Digital Online vs Box Office Counter.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenScanner}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scanner</span>
            </button>
          </div>
        </div>

        {/* Breakdown Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Verified Passes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-zinc-900">
                {mlScanStats.totalScanned}
              </span>
              <span className="text-[11px] text-zinc-400">total scans</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                Digital (Online)
              </span>
              <span className="text-xs font-mono font-semibold text-zinc-900">
                {mlScanStats.digitalPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-zinc-900">
                {mlScanStats.digitalCount}
              </span>
              <span className="text-[11px] text-zinc-400">passes</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                Physical (Counter)
              </span>
              <span className="text-xs font-mono font-semibold text-zinc-900">
                {mlScanStats.physicalPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-zinc-900">
                {mlScanStats.physicalCount}
              </span>
              <span className="text-[11px] text-zinc-400">passes</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Line */}
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden flex">
            <div
              className="bg-zinc-900 h-full transition-all duration-300"
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
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Checked In
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-zinc-950 font-mono mt-1 block">
            {totalScanned}
          </span>
          <span className="text-[11px] text-zinc-500">Verified at gate</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Remaining
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-zinc-950 font-mono mt-1 block">
            {validRemaining}
          </span>
          <span className="text-[11px] text-zinc-500">Pending entrance</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Tickets Sold
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-zinc-950 font-mono mt-1 block">
            {totalSoldToday}
          </span>
          <span className="text-[11px] text-zinc-500">Total attendance volume</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Assisted Sales
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-zinc-950 font-mono mt-1 block">
            ${totalStaffRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-500">{staffSalesOrders.length} counter orders</span>
        </div>
      </div>

      {/* Manual Search & Fallback Validation */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              Ticket Lookup & Manual Check In
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
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
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition"
            />
          </div>
        </div>

        {/* Success message banner */}
        {manualValidationSuccess && (
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{manualValidationSuccess}</span>
          </div>
        )}

        {/* Search Results Display */}
        {searchQuery.trim() && (
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Search Results ({matchedTickets.length})
            </span>

            {matchedTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-lg border border-zinc-200 bg-white space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-medium text-zinc-900">
                          {t.ticketNumber}
                        </span>
                        <h4 className="font-medium text-xs text-zinc-900 mt-0.5">{t.eventName}</h4>
                        <p className="text-[11px] text-zinc-500">{t.ticketTypeName} • ${t.price.toFixed(2)}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded ${
                          t.status === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'USED'
                            ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-600 space-y-0.5 border-t border-zinc-100 pt-2 text-[11px]">
                      <p>
                        <span className="text-zinc-400">Customer:</span> {t.customerName}
                      </p>
                      <p>
                        <span className="text-zinc-400">Phone:</span> {t.customerPhone} •{' '}
                        <span className="text-zinc-400">Order:</span> {t.orderNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {t.status === 'VALID' && (
                        <button
                          onClick={() => handleManualValidate(t)}
                          className="flex-1 py-1.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => onSelectTicket(t)}
                        className="py-1.5 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-zinc-500" />
                        <span>View Pass</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center bg-zinc-50 rounded-lg border border-zinc-200">
                No tickets matching "{searchQuery}".
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Scans History */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Entrance Scan Logs
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live audit trail of gate ticket validations
            </p>
          </div>

          <div className="flex items-center gap-0.5 bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
            {(['ALL', 'VALID', 'ALREADY_USED', 'INVALID'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterResult(filter)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  filterResult === filter
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Scans Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 text-zinc-400 text-[10px] font-mono uppercase tracking-wider border-b border-zinc-200">
              <tr>
                <th className="px-3.5 py-2.5">Time</th>
                <th className="px-3.5 py-2.5">Ticket</th>
                <th className="px-3.5 py-2.5">Event</th>
                <th className="px-3.5 py-2.5">Attendee</th>
                <th className="px-3.5 py-2.5">Staff</th>
                <th className="px-3.5 py-2.5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {filteredScans.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/70 transition">
                  <td className="px-3.5 py-2.5 font-mono text-zinc-400">
                    {new Date(log.scannedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-3.5 py-2.5 font-mono font-medium text-zinc-900">
                    {log.ticketNumber || 'N/A'}
                  </td>
                  <td className="px-3.5 py-2.5 truncate max-w-[160px] text-zinc-700">{log.eventName || 'General Entrance'}</td>
                  <td className="px-3.5 py-2.5 text-zinc-900">
                    {log.customerName || 'Walk-in Guest'}
                  </td>
                  <td className="px-3.5 py-2.5 text-zinc-500">{log.staffName}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-medium ${
                        log.result === 'VALID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.result === 'ALREADY_USED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
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
