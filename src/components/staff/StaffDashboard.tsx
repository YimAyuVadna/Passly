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
  TrendingUp,
  DollarSign,
  QrCode,
  Sliders,
  Tag,
  Edit3,
  Plus,
  Bot,
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
      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-zinc-800 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-2.5 py-1 bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-[11px] font-mono uppercase tracking-wider">
                Staff Operations
              </span>
              <span className="text-xs text-zinc-400">
                Operator: <strong className="text-white font-medium">{currentUser.name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Gate Checkpoint & Box Office
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Real-time ticket scanning, validation log tracking, and customer assisted checkout.
            </p>
          </div>

          {/* Core Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScanner}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition shadow-xs flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Ticket (Camera)</span>
            </button>

            <button
              onClick={onOpenAssistedPurchase}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-xl transition shadow-xs flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-900" />
              <span>Buy For Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Senior Staff Merchandising & Storefront Controls */}
      {isSeniorStaff && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">Storefront & Merchandising Controls</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-100 text-purple-700">Senior Staff / Admin</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage the public homepage hero banner, headlines, and catalog event categories.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateEventModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
            <button
              onClick={() => setIsHeroModalOpen(true)}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Hero Banner</span>
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>Categories</span>
            </button>
          </div>
        </div>
      )}

      {/* Machine Learning Phase 4: Pass Distribution Intelligence Card */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 p-5 shadow-xs text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Machine Learning Pass Intelligence</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  DecisionTree ML #1
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time supervised classification of scanned passes into Digital (Online) vs Physical (Counter Walk-in).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch AI Scanner</span>
            </button>
          </div>
        </div>

        {/* Breakdown Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
          {/* Total Classified */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              AI-Classified Passes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {mlScanStats.totalScanned}
              </span>
              <span className="text-[11px] text-zinc-500">total evaluated</span>
            </div>
          </div>

          {/* Digital Passes */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">
                🖥️ Digital (Online)
              </span>
              <span className="text-xs font-mono font-semibold text-sky-300">
                {mlScanStats.digitalPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-sky-300">
                {mlScanStats.digitalCount}
              </span>
              <span className="text-[11px] text-zinc-500">passes</span>
            </div>
          </div>

          {/* Physical Passes */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
                🎫 Physical (Walk-in)
              </span>
              <span className="text-xs font-mono font-semibold text-amber-300">
                {mlScanStats.physicalPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-300">
                {mlScanStats.physicalCount}
              </span>
              <span className="text-[11px] text-zinc-500">passes</span>
            </div>
          </div>
        </div>

        {/* Visual Ratio Progress Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800/60">
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-mono">
            <span>Digital: {mlScanStats.digitalCount} ({mlScanStats.digitalPercent}%)</span>
            <span>Physical: {mlScanStats.physicalCount} ({mlScanStats.physicalPercent}%)</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-sky-500 h-full transition-all duration-500"
              style={{ width: `${mlScanStats.totalScanned > 0 ? mlScanStats.digitalPercent : 50}%` }}
              title="Digital Ratio"
            />
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${mlScanStats.totalScanned > 0 ? mlScanStats.physicalPercent : 50}%` }}
              title="Physical Ratio"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Checked In (Used)
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 font-mono mt-1 block">
              {totalScanned}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Verified at entrance</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Active / Remaining
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 font-mono mt-1 block">
              {validRemaining}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">Pending entrance check-in</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <TicketIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Tickets Sold
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 font-mono mt-1 block">
              {totalSoldToday}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">Across all events</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Staff Assisted Sales
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 font-mono mt-1 block">
              ${totalStaffRevenue.toFixed(2)}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {staffSalesOrders.length} assisted orders
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Manual Search & Fallback Validation */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-base text-zinc-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-600" />
              Customer & Ticket Lookup / Manual Entry
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Search by Ticket Number, Order ID, Customer Name, Phone, or Email
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. TKT-2026, Dara, 012..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition"
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
                    className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/40 hover:bg-white transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-semibold text-zinc-900">
                          {t.ticketNumber}
                        </span>
                        <h4 className="font-semibold text-sm text-zinc-900 mt-0.5">{t.eventName}</h4>
                        <p className="text-xs text-zinc-500">{t.ticketTypeName} • ${t.price.toFixed(2)}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-md ${
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

                    <div className="text-xs text-zinc-600 space-y-0.5 border-t border-zinc-200/60 pt-2.5">
                      <p>
                        <span className="text-zinc-400 font-medium">Customer:</span> {t.customerName}
                      </p>
                      <p>
                        <span className="text-zinc-400 font-medium">Phone:</span> {t.customerPhone} •{' '}
                        <span className="text-zinc-400 font-medium">Order:</span> {t.orderNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {t.status === 'VALID' && (
                        <button
                          onClick={() => handleManualValidate(t)}
                          className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Mark as Used (Check In)
                        </button>
                      )}
                      <button
                        onClick={() => onSelectTicket(t)}
                        className="py-2 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-zinc-500" />
                        <span>View Pass</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center bg-zinc-50/50 rounded-xl border border-zinc-200/60">
                No tickets matching "{searchQuery}".
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Scans History */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-base text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-600" />
              Real-time Scan History & Entrance Logs
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live audit trail of all entrance checkpoint QR validations
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/50">
            {(['ALL', 'VALID', 'ALREADY_USED', 'INVALID'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterResult(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
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
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/80">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider border-b border-zinc-200/80">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Ticket / Code</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Attendee</th>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {filteredScans.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/70 transition">
                  <td className="px-4 py-3 font-mono text-zinc-500">
                    {new Date(log.scannedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900">
                    {log.ticketNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-3 truncate max-w-[160px] text-zinc-700">{log.eventName || 'General Entrance'}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {log.customerName || 'Walk-in Guest'}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{log.staffName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[11px] font-medium ${
                        log.result === 'VALID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.result === 'ALREADY_USED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {log.result === 'VALID' && <CheckCircle2 className="w-3 h-3" />}
                      {log.result === 'ALREADY_USED' && <AlertTriangle className="w-3 h-3" />}
                      {log.result === 'INVALID' && <XCircle className="w-3 h-3" />}
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
