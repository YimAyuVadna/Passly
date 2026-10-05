import React, { useState } from 'react';
import {
  Calendar,
  ShoppingBag,
  Users,
  Shield,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  BarChart3,
  X,
  Sliders,
  Tag,
  Edit3,
} from 'lucide-react';
import { EventItem, StaffRole } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import { EventFormModal } from './EventFormModal';
import { HeroBannerModal } from './HeroBannerModal';
import { CategoryManageModal } from './CategoryManageModal';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const AdminDashboard: React.FC = () => {
  const {
    events,
    orders,
    tickets,
    users,
    auditLogs,
    createEvent,
    updateEvent,
    deleteEvent,
    addUser,
    heroBanner,
    categories,
  } = useTicketContext();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'events' | 'orders' | 'customers' | 'staff' | 'audit' | 'storefront'
  >('overview');

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Storefront modals state
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // New staff modal state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  useBodyScrollLock(isStaffModalOpen);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('STAFF');

  // Search & Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSourceFilter, setOrderSourceFilter] = useState<'ALL' | 'ONLINE' | 'STAFF_ASSISTED'>('ALL');

  // Statistical calculations
  const totalEvents = events.length;
  const totalTicketsSold = orders.reduce((acc, o) => acc + o.quantity, 0);
  const totalTicketsUsed = tickets.filter((t) => t.status === 'USED').length;
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  const onlineOrders = orders.filter((o) => o.source === 'ONLINE');
  const staffOrders = orders.filter((o) => o.source === 'STAFF_ASSISTED');
  const onlineRevenue = onlineOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const staffRevenue = staffOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const onlinePercent = orders.length > 0 ? Math.round((onlineOrders.length / orders.length) * 100) : 0;
  const staffPercent = 100 - onlinePercent;
  const checkInRate = totalTicketsSold > 0 ? Math.round((totalTicketsUsed / totalTicketsSold) * 100) : 0;

  // Customers calculation
  const customerUsers = users.filter((u) => u.role === 'CUSTOMER');
  const staffUsers = users.filter((u) => u.role === 'STAFF' || u.role === 'ADMIN');

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    const matchesSource =
      orderSourceFilter === 'ALL' ? true : ord.source === orderSourceFilter;
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.eventName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.customerPhone.includes(orderSearch);
    return matchesSource && matchesSearch;
  });

  const handleCreateOrUpdateEvent = (eventData: Omit<EventItem, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
    } else {
      createEvent(eventData);
    }
    setEditingEvent(null);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    addUser({
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone || '012 000 000',
      role: 'STAFF',
      staffRole: newStaffRole,
      status: 'ACTIVE',
    });

    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setIsStaffModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#FFFFFF] rounded-[8px] p-6 sm:p-7 border border-[#EAEAEA] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono uppercase tracking-wider text-[11px] text-[#787774]">
            Administration Console
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#111111] mt-1">
            Platform Management
          </h1>
          <p className="text-xs text-[#787774] mt-0.5">
            Configure catalog events, monitor transactions, and manage operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] rounded-[6px] text-xs font-medium transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#EAEAEA]">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'events', label: `Events (${events.length})`, icon: Calendar },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'customers', label: `Customers (${customerUsers.length})`, icon: Users },
          { id: 'staff', label: `Staff (${staffUsers.length})`, icon: Shield },
          { id: 'storefront', label: 'Storefront', icon: Sliders },
          { id: 'audit', label: `Audit (${auditLogs.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs rounded-[6px] transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#111111] text-[#FFFFFF] font-medium'
                  : 'text-[#787774] hover:text-[#111111] hover:bg-[#F4F4F2] font-medium'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & REPORTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-[8px] border border-[#EAEAEA]">
              <span className="text-[10px] font-mono text-[#787774] uppercase tracking-wider block">
                Total Events
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-[#111111] font-mono mt-1 block">
                {totalEvents}
              </span>
              <span className="text-[11px] text-[#346538] font-medium">Catalog live</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-[8px] border border-[#EAEAEA]">
              <span className="text-[10px] font-mono text-[#787774] uppercase tracking-wider block">
                Tickets Sold
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-[#111111] font-mono mt-1 block">
                {totalTicketsSold}
              </span>
              <span className="text-[11px] text-[#787774] font-medium">All tiers combined</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-[8px] border border-[#EAEAEA]">
              <span className="text-[10px] font-mono text-[#787774] uppercase tracking-wider block">
                Tickets Used
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-[#111111] font-mono mt-1 block">
                {totalTicketsUsed}
              </span>
              <span className="text-[11px] text-[#346538] font-medium">{checkInRate}% turnout</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-[8px] border border-[#EAEAEA]">
              <span className="text-[10px] font-mono text-[#787774] uppercase tracking-wider block">
                Total Revenue
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-[#111111] font-mono mt-1 block">
                ${totalRevenue.toFixed(2)}
              </span>
              <span className="text-[11px] text-[#787774] font-medium">Gross sales</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-[8px] border border-[#EAEAEA] col-span-2 lg:col-span-1">
              <span className="text-[10px] font-mono text-[#787774] uppercase tracking-wider block">
                Customers
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-[#111111] font-mono mt-1 block">
                {customerUsers.length}
              </span>
              <span className="text-[11px] text-[#787774] font-medium">Registered accounts</span>
            </div>
          </div>

          {/* Sales Breakdown & Source Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Online vs Staff-Assisted Ratio */}
            <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-[8px] border border-[#EAEAEA] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-medium text-[#111111]">Purchase Source Breakdown</h3>
                <span className="text-xs text-[#787774]">Online vs Staff Assisted</span>
              </div>

              {/* Progress bar visual */}
              <div className="space-y-2.5">
                <div className="h-2 w-full bg-[#F4F4F2] rounded-full overflow-hidden flex border border-[#EAEAEA]">
                  <div
                    style={{ width: `${onlinePercent}%` }}
                    className="bg-[#111111] h-full transition-all duration-500"
                    title={`Online: ${onlinePercent}%`}
                  />
                  <div
                    style={{ width: `${staffPercent}%` }}
                    className="bg-[#A1A19E] h-full transition-all duration-500"
                    title={`Staff Assisted: ${staffPercent}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#111111]" />
                    <span className="text-[#111111]">
                      Online: {onlinePercent}% <span className="font-mono text-[#787774]">(${onlineRevenue.toFixed(2)})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#A1A19E]" />
                    <span className="text-[#111111]">
                      Staff: {staffPercent}% <span className="font-mono text-[#787774]">(${staffRevenue.toFixed(2)})</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA] text-xs text-[#555452]">
                <p>
                  Staff-assisted sales generated <strong className="text-[#111111] font-mono font-medium">${staffRevenue.toFixed(2)}</strong> across{' '}
                  <strong className="text-[#111111] font-medium">{staffOrders.length} walk-in orders</strong>.
                </p>
              </div>
            </div>

            {/* Check-in & Gate Turnout */}
            <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-[8px] border border-[#EAEAEA] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-medium text-[#111111]">Entrance Turnout</h3>
                <span className="text-xs font-medium text-[#346538] font-mono px-2 py-0.5 rounded-full bg-[#EDF3EC] border border-[#D5E3D3]">
                  {checkInRate}% Scanned
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA]">
                  <span className="text-[10px] font-mono text-[#346538] uppercase block">Used</span>
                  <span className="text-lg font-medium text-[#111111] font-mono mt-0.5 block">
                    {totalTicketsUsed}
                  </span>
                </div>
                <div className="p-3 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA]">
                  <span className="text-[10px] font-mono text-[#787774] uppercase block">Pending</span>
                  <span className="text-lg font-medium text-[#111111] font-mono mt-0.5 block">
                    {totalTicketsSold - totalTicketsUsed}
                  </span>
                </div>
                <div className="p-3 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA]">
                  <span className="text-[10px] font-mono text-[#787774] uppercase block">Total</span>
                  <span className="text-lg font-medium text-[#111111] font-mono mt-0.5 block">
                    {totalTicketsSold}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA] text-xs text-[#555452]">
                <p>
                  Single-use cryptographic QR validation prevents ticket fraud and duplicate admissions at gates.
                </p>
              </div>
            </div>
          </div>

          {/* Event Sales Report Table */}
          <div className="bg-[#FFFFFF] rounded-[8px] p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
            <h3 className="font-serif text-base font-medium text-[#111111]">Event Capacity & Sales Utilization</h3>

            <div className="overflow-x-auto rounded-[6px] border border-[#EAEAEA]">
              <table className="w-full text-left text-xs text-[#555452]">
                <thead className="bg-[#FBFBFA] text-[#787774] text-[10px] font-mono uppercase tracking-wider border-b border-[#EAEAEA]">
                  <tr>
                    <th className="px-4 py-3">Event Title</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Sold</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] font-normal">
                  {events.map((ev) => {
                    const eventOrders = orders.filter((o) => o.eventId === ev.id);
                    const eventSold = ev.ticketTypes.reduce((sum, tt) => sum + tt.sold, 0);
                    const eventRevenue = eventOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const remainingCapacity = Math.max(0, ev.capacity - eventSold);

                    return (
                      <tr key={ev.id} className="hover:bg-[#FBFBFA] transition">
                        <td className="px-4 py-3 font-medium text-[#111111]">{ev.name}</td>
                        <td className="px-4 py-3 text-[#787774] font-mono text-[11px]">{ev.date}</td>
                        <td className="px-4 py-3 font-mono">{ev.capacity.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono font-medium text-[#111111]">
                          {eventSold.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#787774]">
                          {remainingCapacity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-[#111111]">
                          ${eventRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                              ev.status === 'ACTIVE'
                                ? 'bg-[#EDF3EC] text-[#346538] border border-[#D5E3D3]'
                                : 'bg-[#F4F4F2] text-[#555452] border border-[#EAEAEA]'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS MANAGEMENT */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-medium text-[#111111]">Events Catalog & Ticket Inventory</h3>
              <p className="text-xs text-[#787774]">Manage listings, date schedules, and ticket pricing tiers</p>
            </div>
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] font-medium rounded-[6px] text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              return (
                <div
                  key={ev.id}
                  className="bg-[#FFFFFF] rounded-[8px] border border-[#EAEAEA] p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase bg-[#F4F4F2] text-[#555452] border border-[#EAEAEA]">
                          {ev.category}
                        </span>
                        <h4 className="font-serif text-lg font-medium text-[#111111] mt-1.5 leading-snug">{ev.name}</h4>
                        <p className="text-xs text-[#787774] mt-0.5">{ev.location} • {ev.date}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase ${
                          ev.status === 'ACTIVE'
                            ? 'bg-[#EDF3EC] text-[#346538] border border-[#D5E3D3]'
                            : 'bg-[#F4F4F2] text-[#555452] border border-[#EAEAEA]'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>

                    {/* Ticket Tiers list */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-mono text-[#787774] uppercase tracking-wider block">
                        Ticket Tiers Inventory
                      </span>
                      <div className="grid gap-1.5">
                        {ev.ticketTypes.map((tt) => (
                          <div
                            key={tt.id}
                            className="p-2.5 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-medium text-[#111111]">{tt.name}</span>
                              <span className="text-[#787774] ml-2 font-mono">
                                ${tt.price.toFixed(2)}
                              </span>
                            </div>
                            <span className="font-mono text-[#787774] text-[11px]">
                              {tt.sold} / {tt.quantity} sold
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
                    <div className="text-xs text-[#787774]">
                      <span>Total Capacity: </span>
                      <strong className="text-[#111111] font-mono font-medium">{ev.capacity}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingEvent(ev);
                          setIsEventModalOpen(true);
                        }}
                        className="p-1.5 text-[#787774] hover:text-[#111111] hover:bg-[#F4F4F2] rounded-[6px] transition cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete event "${ev.name}"?`)) {
                            deleteEvent(ev.id);
                          }
                        }}
                        className="p-1.5 text-[#787774] hover:text-[#9F2F2D] hover:bg-[#FDEBEC] rounded-[6px] transition cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-[#FFFFFF] rounded-[8px] p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base font-medium text-[#111111]">Order Transactions Register</h3>
              <p className="text-xs text-[#787774]">Customer self-checkout and staff-assisted purchases</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Source Filter */}
              <div className="flex items-center gap-0.5 bg-[#F4F4F2] p-0.5 rounded-[6px] border border-[#EAEAEA]">
                {(['ALL', 'ONLINE', 'STAFF_ASSISTED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setOrderSourceFilter(s)}
                    className={`px-2.5 py-1 rounded-[4px] text-xs transition cursor-pointer ${
                      orderSourceFilter === s
                        ? 'bg-[#FFFFFF] text-[#111111] font-medium border border-[#EAEAEA]'
                        : 'text-[#787774] hover:text-[#111111]'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : s === 'ONLINE' ? 'Online' : 'Staff'}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#787774] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Order #, name..."
                  className="w-full pl-8 pr-3 py-1 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[6px] border border-[#EAEAEA]">
            <table className="w-full text-left text-xs text-[#555452]">
              <thead className="bg-[#FBFBFA] text-[#787774] text-[10px] font-mono uppercase tracking-wider border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Qty / Tier</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA] font-normal">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FBFBFA] transition">
                    <td className="px-4 py-3 font-mono font-medium text-[#111111]">
                      {ord.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#111111] block">{ord.customerName}</span>
                      <span className="text-[11px] text-[#787774] font-mono">{ord.customerPhone}</span>
                    </td>
                    <td className="px-4 py-3 truncate max-w-[150px] text-[#111111]">{ord.eventName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          ord.source === 'ONLINE'
                            ? 'bg-[#E1F3FE] text-[#1F6C9F] border border-[#C6E6FC]'
                            : 'bg-[#FBF3DB] text-[#956400] border border-[#F5E5B8]'
                        }`}
                      >
                        {ord.source === 'ONLINE' ? 'Online' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {ord.quantity}x {ord.ticketTypeName}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-[#111111]">
                      ${ord.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#EDF3EC] text-[#346538] font-mono text-[10px] font-medium rounded-full border border-[#D5E3D3]">
                        {ord.paymentStatus} ({ord.paymentMethod})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#787774] text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-[#FFFFFF] rounded-[8px] p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
          <div>
            <h3 className="font-serif text-base font-medium text-[#111111]">Customer Directory</h3>
            <p className="text-xs text-[#787774]">Registered attendee accounts and purchase histories</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {customerUsers.map((cust) => {
              const custOrders = orders.filter((o) => o.customerId === cust.id);
              const custSpend = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);

              return (
                <div
                  key={cust.id}
                  className="p-4 bg-[#FBFBFA] rounded-[8px] border border-[#EAEAEA] space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {cust.avatar ? (
                      <img
                        src={cust.avatar}
                        alt={cust.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#EAEAEA]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono font-medium text-xs shrink-0">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-sm text-[#111111]">{cust.name}</h4>
                      <p className="text-xs text-[#787774] font-mono">{cust.phone}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EAEAEA] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#787774] text-[10px] font-mono uppercase block">Orders</span>
                      <span className="font-medium text-[#111111] font-mono">{custOrders.length}</span>
                    </div>
                    <div>
                      <span className="text-[#787774] text-[10px] font-mono uppercase block">Spend</span>
                      <span className="font-medium text-[#111111] font-mono">${custSpend.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="bg-[#FFFFFF] rounded-[8px] p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-medium text-[#111111]">Staff Account Roster</h3>
              <p className="text-xs text-[#787774]">Role-based access controls for checkpoint and box office staff</p>
            </div>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] font-medium rounded-[6px] text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-[6px] border border-[#EAEAEA]">
            <table className="w-full text-left text-xs text-[#555452]">
              <thead className="bg-[#FBFBFA] text-[#787774] text-[10px] font-mono uppercase tracking-wider border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA] font-normal">
                {staffUsers.map((staff) => (
                  <tr key={staff.id} className="hover:bg-[#FBFBFA] transition">
                    <td className="px-4 py-3 font-medium text-[#111111] flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#F4F4F2] text-[#111111] flex items-center justify-center text-[10px] font-semibold border border-[#EAEAEA]">
                        {staff.name.charAt(0)}
                      </div>
                      <span>{staff.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[#555452]">{staff.email}</td>
                    <td className="px-4 py-3 font-mono text-[#787774]">{staff.phone}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#F4F4F2] text-[#111111] font-mono text-[10px] font-medium rounded-full border border-[#EAEAEA]">
                        {staff.staffRole || staff.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#EDF3EC] text-[#346538] font-mono text-[10px] font-medium rounded-full border border-[#D5E3D3]">
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#787774]">
                      {staff.role === 'ADMIN' ? 'Full Platform Access' : 'Entrance Scanner & Box Office'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-[#FFFFFF] rounded-[8px] p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
          <div>
            <h3 className="font-serif text-base font-medium text-[#111111]">System Security & Audit Logs</h3>
            <p className="text-xs text-[#787774]">Immutable trace of purchases, status updates, and scan validations</p>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#F4F4F2] text-[#111111] font-mono font-medium text-[10px] rounded-full border border-[#EAEAEA]">
                      {log.action}
                    </span>
                    <span className="font-medium text-[#111111]">{log.details}</span>
                  </div>
                  <span className="text-[11px] text-[#787774] mt-1 block">
                    Executed by: <strong className="text-[#111111] font-medium">{log.performedBy}</strong>
                  </span>
                </div>

                <span className="font-mono text-[#787774] shrink-0 text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: STOREFRONT & HERO BANNER */}
      {activeTab === 'storefront' && (
        <div className="space-y-6">
          {/* Hero Banner Section */}
          <div className="bg-[#FFFFFF] rounded-[8px] p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-medium text-[#111111]">Storefront Hero Banner</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                      heroBanner.enabled
                        ? 'bg-[#EDF3EC] text-[#346538] border border-[#D5E3D3]'
                        : 'bg-[#F4F4F2] text-[#787774] border border-[#EAEAEA]'
                    }`}
                  >
                    {heroBanner.enabled ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                </div>
                <p className="text-xs text-[#787774] mt-0.5">
                  The primary editorial spotlight displayed atop the events catalog
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsHeroModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] rounded-[6px] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Hero Banner</span>
              </button>
            </div>

            {/* Editorial Presentation Banner Preview */}
            <div className="rounded-[8px] bg-[#FBFBFA] border border-[#EAEAEA] p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
                    {heroBanner.tag || 'Featured'}
                  </span>
                  {heroBanner.category && (
                    <>
                      <span className="text-[11px] text-[#A1A19E]">•</span>
                      <span className="text-[11px] text-[#111111] font-medium">{heroBanner.category}</span>
                    </>
                  )}
                </div>

                <h4 className="font-serif text-xl font-medium tracking-tight text-[#111111] truncate">
                  {heroBanner.title}
                </h4>

                <p className="text-xs text-[#555452] line-clamp-2 leading-relaxed">
                  {heroBanner.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-[#787774] font-medium pt-0.5">
                  {heroBanner.date && <span className="font-mono text-[11px]">{heroBanner.date}</span>}
                  {heroBanner.date && heroBanner.location && <span>•</span>}
                  {heroBanner.location && <span className="truncate">{heroBanner.location}</span>}
                </div>
              </div>

              <div className="w-full sm:w-64 aspect-[16/10] rounded-[6px] overflow-hidden bg-[#F4F4F2] border border-[#EAEAEA] shrink-0">
                <img
                  src={heroBanner.image}
                  alt={heroBanner.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Categories Management Section */}
          <div className="bg-[#FFFFFF] rounded-[8px] p-5 sm:p-6 border border-[#EAEAEA] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-medium text-[#111111]">Event Categories & Filters</h3>
                <p className="text-xs text-[#787774] mt-0.5">
                  Organize the genre tags and filters shown across catalog browsing
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] rounded-[6px] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Manage Categories</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#FBFBFA] border border-[#EAEAEA] text-[#111111] flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3 text-[#787774]" />
                  <span>{cat}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleCreateOrUpdateEvent}
        initialEvent={editingEvent}
      />

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/40 backdrop-blur-xs p-4 overflow-y-auto overscroll-contain">
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-[8px] p-6 border border-[#EAEAEA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#111111]">Add Staff Account</h3>
                <p className="text-xs text-[#787774]">Create staff credentials for checkpoint scanning and box office</p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 text-[#787774] hover:text-[#111111] rounded-[4px] cursor-pointer hover:bg-[#F4F4F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Rachel Green"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Staff Email</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="staff@gmail.com"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="089 999 111"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Role & Authority</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition"
                >
                  <option value="STAFF">STAFF (Scanning & Assisted Purchases)</option>
                  <option value="SENIOR_STAFF">SENIOR STAFF (Overriding & Searching)</option>
                  <option value="ADMIN">ADMIN (Full Catalog & Reports)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Full Permissions)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#EAEAEA] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] rounded-[6px] text-xs font-medium cursor-pointer"
                >
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Banner and Category Management Modals */}
      <HeroBannerModal isOpen={isHeroModalOpen} onClose={() => setIsHeroModalOpen(false)} />
      <CategoryManageModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </div>
  );
};
