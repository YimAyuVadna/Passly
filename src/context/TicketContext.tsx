import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  UserRole,
  EventItem,
  OrderItem,
  Ticket,
  ScanLog,
  AuditLog,
  TicketType,
  PaymentMethod,
  OrderSource,
  TicketStatus,
  ScanResultStatus,
  HeroBannerConfig,
  MLTicketType,
  MLScanStats,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_ORDERS,
  INITIAL_TICKETS,
  INITIAL_SCAN_LOGS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';

export const INITIAL_ML_STATS: MLScanStats = {
  totalScanned: 0,
  digitalCount: 0,
  physicalCount: 0,
  digitalPercent: 0,
  physicalPercent: 0,
};

interface PurchaseParams {
  event: EventItem;
  ticketType: TicketType;
  quantity: number;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  };
  paymentMethod: PaymentMethod;
  source: OrderSource;
  staffCreator?: User;
  customCreatedAt?: string;
}

export interface ValidationResponse {
  status: ScanResultStatus;
  ticket?: Ticket;
  event?: EventItem;
  message: string;
  alreadyUsedInfo?: {
    usedAt: string;
    usedBy: string;
  };
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  enabled: true,
  tag: 'Featured Experience',
  category: 'Concert',
  title: 'Neon Pulse EDM Night 2026',
  description: 'The premier electronic dance music experience featuring world-class international DJs, laser visualizers, pyrotechnics, and an electrifying acoustic soundstage.',
  date: '2026-10-25',
  startTime: '19:00',
  location: 'Diamond Island Exhibition Center',
  image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop&q=80',
  buttonText: 'Reserve Tickets',
  eventId: 'evt-1',
};

export const DEFAULT_CATEGORIES: string[] = [
  'All',
  'Concert',
  'Conference',
  'Cinema',
  'Sports',
  'Theater',
  'Festival',
  'Exhibition',
];

interface TicketContextType {
  currentUser: User;
  currentRole: UserRole;
  isLoggedIn: boolean;
  users: User[];
  events: EventItem[];
  orders: OrderItem[];
  tickets: Ticket[];
  scanLogs: ScanLog[];
  auditLogs: AuditLog[];
  heroBanner: HeroBannerConfig;
  categories: string[];
  mlScanStats: MLScanStats;
  getOrderByTicketId: (ticketId: string) => OrderItem | undefined;
  recordMLScan: (type: MLTicketType) => void;
  updateHeroBanner: (updates: Partial<HeroBannerConfig>) => void;
  resetHeroBanner: () => void;
  addCategory: (categoryName: string) => void;
  removeCategory: (categoryName: string) => void;
  resetCategories: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  purchaseTickets: (params: PurchaseParams) => { order: OrderItem; tickets: Ticket[] };
  validateTicketByQr: (qrTokenOrTicketNo: string, staffUser?: User) => ValidationResponse;
  markTicketStatus: (ticketId: string, status: TicketStatus, notes?: string) => void;
  createEvent: (eventData: Omit<EventItem, 'id' | 'createdAt'>) => EventItem;
  updateEvent: (eventId: string, updates: Partial<EventItem>) => void;
  deleteEvent: (eventId: string) => void;
  addTicketType: (eventId: string, typeData: Omit<TicketType, 'id' | 'eventId' | 'sold'>) => void;
  updateTicketType: (eventId: string, ticketTypeId: string, updates: Partial<TicketType>) => void;
  deleteTicketType: (eventId: string, ticketTypeId: string) => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  login: (emailOrPhone: string) => boolean;
  register: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  logout: () => void;
  resetAllData: () => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'dtbp_users_v2',
  CURRENT_USER_ID: 'dtbp_current_uid_v2',
  EVENTS: 'dtbp_events_v2',
  ORDERS: 'dtbp_orders_v2',
  TICKETS: 'dtbp_tickets_v2',
  SCAN_LOGS: 'dtbp_scan_logs_v2',
  AUDIT_LOGS: 'dtbp_audit_logs_v2',
  IS_LOGGED_IN: 'dtbp_is_logged_in_v2',
  HERO_BANNER: 'dtbp_hero_banner_v2',
  CATEGORIES: 'dtbp_categories_v2',
  ML_STATS: 'dtbp_ml_stats_v2',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save storage key: ${key}`, e);
  }
}

export const TicketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => loadStorage(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    loadStorage(STORAGE_KEYS.CURRENT_USER_ID, 'usr-customer-1')
  );
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    loadStorage(STORAGE_KEYS.IS_LOGGED_IN, true)
  );
  const [events, setEvents] = useState<EventItem[]>(() => loadStorage(STORAGE_KEYS.EVENTS, INITIAL_EVENTS));
  const [orders, setOrders] = useState<OrderItem[]>(() => loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
  const [tickets, setTickets] = useState<Ticket[]>(() => loadStorage(STORAGE_KEYS.TICKETS, INITIAL_TICKETS));
  const [scanLogs, setScanLogs] = useState<ScanLog[]>(() => loadStorage(STORAGE_KEYS.SCAN_LOGS, INITIAL_SCAN_LOGS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS)
  );
  const [heroBanner, setHeroBanner] = useState<HeroBannerConfig>(() =>
    loadStorage(STORAGE_KEYS.HERO_BANNER, DEFAULT_HERO_BANNER)
  );
  const [categories, setCategories] = useState<string[]>(() =>
    loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
  );
  const [mlScanStats, setMlScanStats] = useState<MLScanStats>(() =>
    loadStorage(STORAGE_KEYS.ML_STATS, INITIAL_ML_STATS)
  );

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const currentRole = currentUser.role;

  // Persist whenever state changes
  useEffect(() => {
    saveStorage(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.IS_LOGGED_IN, isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.EVENTS, events);
  }, [events]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.TICKETS, tickets);
  }, [tickets]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.SCAN_LOGS, scanLogs);
  }, [scanLogs]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.HERO_BANNER, heroBanner);
  }, [heroBanner]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.ML_STATS, mlScanStats);
  }, [mlScanStats]);

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUserId(userId);
      setIsLoggedIn(true);
    }
  };

  const switchRole = (role: UserRole) => {
    const userWithRole = users.find((u) => u.role === role);
    if (userWithRole) {
      setCurrentUserId(userWithRole.id);
      setIsLoggedIn(true);
    }
  };

  const purchaseTickets = ({
    event,
    ticketType,
    quantity,
    customerInfo,
    paymentMethod,
    source,
    staffCreator,
    customCreatedAt,
  }: PurchaseParams) => {
    const orderTimestamp = customCreatedAt || new Date().toISOString();
    const orderSeq = orders.length + 1001;
    const orderNumber = `ORD-2026-${String(orderSeq).padStart(5, '0')}`;
    const orderId = `ord-${Date.now()}`;

    const totalAmount = ticketType.price * quantity;

    // Check if customer is existing or create/associate
    let custId = currentUser.id;
    if (source === 'STAFF_ASSISTED') {
      const match = users.find(
        (u) => u.email.toLowerCase() === customerInfo.email.toLowerCase() || u.phone === customerInfo.phone
      );
      custId = match ? match.id : `usr-cust-${Date.now()}`;
    }

    const newOrder: OrderItem = {
      id: orderId,
      orderNumber,
      customerId: custId,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      eventId: event.id,
      eventName: event.name,
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.name,
      quantity,
      unitPrice: ticketType.price,
      totalAmount,
      paymentStatus: 'PAID',
      paymentMethod,
      source,
      createdBy: staffCreator ? staffCreator.id : currentUser.id,
      createdByName: staffCreator
        ? `${staffCreator.name} (${staffCreator.staffRole || 'Staff'})`
        : customerInfo.name,
      notes: customerInfo.notes,
      createdAt: orderTimestamp,
    };

    // Generate N individual tickets with unique IDs and QR tokens
    const generatedTickets: Ticket[] = [];
    for (let i = 1; i <= quantity; i++) {
      const ticketSeq = tickets.length + generatedTickets.length + 935;
      const ticketNumber = `TKT-2026-${String(ticketSeq).padStart(6, '0')}`;
      const tokenSalt = Math.random().toString(36).substring(2, 8).toUpperCase();
      const qrToken = `${ticketNumber}-SEC-${tokenSalt}`;

      const tktName = quantity > 1 && i > 1 ? `${customerInfo.name} (Guest ${i})` : customerInfo.name;

      const newTicket: Ticket = {
        id: `tkt-${Date.now()}-${i}`,
        ticketNumber,
        orderId,
        orderNumber,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.startTime,
        eventLocation: event.location,
        customerId: custId,
        customerName: tktName,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        price: ticketType.price,
        qrToken,
        status: 'VALID',
        createdAt: orderTimestamp,
      };
      generatedTickets.push(newTicket);
    }

    // Update tickets inventory
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== event.id) return e;
        return {
          ...e,
          ticketTypes: e.ticketTypes.map((tt) => {
            if (tt.id !== ticketType.id) return tt;
            const newSold = tt.sold + quantity;
            return {
              ...tt,
              sold: newSold,
              status: newSold >= tt.quantity ? 'SOLD_OUT' : 'AVAILABLE',
            };
          }),
        };
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setTickets((prev) => [...generatedTickets, ...prev]);

    // Add Audit Log
    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: source === 'STAFF_ASSISTED' ? 'STAFF_PURCHASE' : 'ONLINE_PURCHASE',
      details: `Created order ${orderNumber} for ${quantity}x ${ticketType.name} ($${totalAmount}) for ${customerInfo.name}`,
      performedBy: staffCreator ? `${staffCreator.name} (${staffCreator.role})` : customerInfo.name,
      timestamp: orderTimestamp,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    return { order: newOrder, tickets: generatedTickets };
  };

  const validateTicketByQr = (
    qrTokenOrTicketNo: string,
    staffUser?: User
  ): ValidationResponse => {
    let trimmed = qrTokenOrTicketNo.trim();
    const effectiveStaff = staffUser || currentUser;
    const now = new Date().toISOString();

    // Support compact cross-device ticket format: TP1:ticketNumber|name|paymentMethod|leadTime|tier|price|eventName
    if (trimmed.startsWith('TP1:')) {
      try {
        const raw = trimmed.substring(4);
        const [tktNo, custName, payMethod, leadHoursStr, tierName, priceStr, evName] = raw.split('|');
        trimmed = tktNo || trimmed;

        const existing = tickets.find((t) => t.ticketNumber === trimmed || t.qrToken === trimmed);
        if (!existing) {
          const priceNum = parseFloat(priceStr) || 15;
          const leadHoursNum = parseFloat(leadHoursStr) || 48;
          const importedTicket: Ticket = {
            id: `tkt-imp-${tktNo}-${Date.now()}`,
            ticketNumber: tktNo,
            orderId: `ord-imp-${tktNo}`,
            orderNumber: `ORD-${tktNo}`,
            eventId: 'ev-001',
            eventName: evName || 'General Admission Event',
            eventDate: new Date().toISOString().split('T')[0],
            eventTime: '19:00',
            eventLocation: 'Main Entrance Gate',
            customerId: 'cust-remote',
            customerName: custName || 'Online Client',
            customerPhone: '012 999 111',
            customerEmail: 'attendee@example.com',
            ticketTypeId: 'tier-imported',
            ticketTypeName: tierName || 'Standard Pass',
            price: priceNum,
            qrToken: trimmed,
            status: 'VALID',
            createdAt: new Date().toISOString(),
          };

          const importedOrder: OrderItem = {
            id: importedTicket.orderId,
            orderNumber: importedTicket.orderNumber,
            customerId: importedTicket.customerId,
            customerName: importedTicket.customerName,
            customerPhone: importedTicket.customerPhone,
            customerEmail: importedTicket.customerEmail,
            eventId: importedTicket.eventId,
            eventName: importedTicket.eventName,
            ticketTypeId: importedTicket.ticketTypeId,
            ticketTypeName: importedTicket.ticketTypeName,
            quantity: 1,
            unitPrice: importedTicket.price,
            totalAmount: importedTicket.price,
            paymentStatus: 'PAID',
            paymentMethod: (payMethod as any) || 'ONLINE',
            source: 'ONLINE',
            createdBy: 'online',
            createdByName: importedTicket.customerName,
            createdAt: new Date(Date.now() - leadHoursNum * 3600 * 1000).toISOString(),
          };

          setTickets((prev) => [importedTicket, ...prev]);
          setOrders((prev) => [importedOrder, ...prev]);

          const scanLog: ScanLog = {
            id: `scan-${Date.now()}`,
            ticketId: importedTicket.id,
            ticketNumber: importedTicket.ticketNumber,
            eventId: importedTicket.eventId,
            eventName: importedTicket.eventName,
            customerName: importedTicket.customerName,
            staffId: effectiveStaff.id,
            staffName: `${effectiveStaff.name} (${effectiveStaff.staffRole || effectiveStaff.role})`,
            result: 'VALID',
            scannedAt: now,
            deviceInfo: 'Camera / Web Scanner',
            notes: `Admitted attendee via compact portable pass.`,
          };
          setScanLogs((prev) => [scanLog, ...prev]);

          return {
            status: 'VALID',
            ticket: importedTicket,
            event: events.find((e) => e.id === importedTicket.eventId) || events[0],
            message: `Checked in successfully. Attendee ${importedTicket.customerName} admitted!`,
          };
        }
      } catch (err) {
        console.error('Compact TP1 token parsing error:', err);
      }
    }

    // Support portable self-contained QR code from another device (e.g. laptop client -> phone scanner)
    if (trimmed.startsWith('{') && trimmed.includes('"tp":"v1"')) {
      try {
        const payload = JSON.parse(trimmed);
        trimmed = payload.qr || payload.tkt;

        // If not already in tickets list on this device, automatically import it
        const existing = tickets.find(
          (t) => t.qrToken === trimmed || t.ticketNumber === payload.tkt || t.id === payload.id
        );
        if (!existing) {
          const importedTicket: Ticket = {
            id: payload.id || `tkt-${Date.now()}`,
            ticketNumber: payload.tkt,
            orderId: `ord-${Date.now()}`,
            orderNumber: `ORD-${Date.now()}`,
            eventId: payload.ev,
            eventName: payload.evName,
            eventDate: payload.date,
            eventTime: payload.time,
            eventLocation: 'Main Entrance Gate',
            customerId: 'cust-remote',
            customerName: payload.name,
            customerPhone: payload.phone || '012 999 111',
            customerEmail: 'attendee@example.com',
            ticketTypeId: 'tier-imported',
            ticketTypeName: payload.tier,
            price: payload.price,
            qrToken: payload.qr,
            status: 'VALID',
            createdAt: new Date().toISOString(),
          };

          const importedOrder: OrderItem = {
            id: importedTicket.orderId,
            orderNumber: importedTicket.orderNumber,
            customerId: importedTicket.customerId,
            customerName: importedTicket.customerName,
            customerPhone: importedTicket.customerPhone,
            customerEmail: importedTicket.customerEmail,
            eventId: importedTicket.eventId,
            eventName: importedTicket.eventName,
            ticketTypeId: importedTicket.ticketTypeId,
            ticketTypeName: importedTicket.ticketTypeName,
            quantity: 1,
            unitPrice: importedTicket.price,
            totalAmount: importedTicket.price,
            paymentStatus: 'PAID',
            paymentMethod: payload.pay || 'ONLINE',
            source: 'ONLINE',
            createdBy: 'online',
            createdByName: payload.name || 'Online Customer',
            createdAt: new Date(Date.now() - (payload.lead || 48) * 3600 * 1000).toISOString(),
          };

          setTickets((prev) => [importedTicket, ...prev]);
          setOrders((prev) => [importedOrder, ...prev]);

          const scanLog: ScanLog = {
            id: `scan-${Date.now()}`,
            ticketId: importedTicket.id,
            ticketNumber: importedTicket.ticketNumber,
            eventId: importedTicket.eventId,
            eventName: importedTicket.eventName,
            customerName: importedTicket.customerName,
            staffId: effectiveStaff.id,
            staffName: `${effectiveStaff.name} (${effectiveStaff.staffRole || effectiveStaff.role})`,
            result: 'VALID',
            scannedAt: now,
            deviceInfo: 'Camera / Web Scanner',
            notes: `Admitted attendee via portable pass.`,
          };
          setScanLogs((prev) => [scanLog, ...prev]);

          return {
            status: 'VALID',
            ticket: importedTicket,
            event: events.find((e) => e.id === importedTicket.eventId),
            message: `Checked in successfully. Attendee ${importedTicket.customerName} admitted!`,
          };
        }
      } catch (err) {
        console.error('Portable QR parsing error:', err);
      }
    }

    // Find ticket by token or ticketNumber (exact or contained in URL/token string)
    const targetTicket = tickets.find(
      (t) =>
        t.qrToken.toLowerCase() === trimmed.toLowerCase() ||
        t.ticketNumber.toLowerCase() === trimmed.toLowerCase() ||
        t.id.toLowerCase() === trimmed.toLowerCase() ||
        (trimmed.length >= 6 &&
          (trimmed.toLowerCase().includes(t.qrToken.toLowerCase()) ||
            trimmed.toLowerCase().includes(t.ticketNumber.toLowerCase()) ||
            trimmed.toLowerCase().includes(t.id.toLowerCase())))
    );

    if (!targetTicket) {
      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketNumber: trimmed,
        staffId: effectiveStaff.id,
        staffName: `${effectiveStaff.name} (${effectiveStaff.staffRole || effectiveStaff.role})`,
        result: 'INVALID',
        scannedAt: now,
        deviceInfo: 'Camera / Web Scanner',
        notes: 'Unrecognized QR token or ticket code.',
      };
      setScanLogs((prev) => [scanLog, ...prev]);

      return {
        status: 'INVALID',
        message: 'This QR code is not recognized in the system database.',
      };
    }

    const event = events.find((e) => e.id === targetTicket.eventId);

    // If already USED
    if (targetTicket.status === 'USED') {
      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketId: targetTicket.id,
        ticketNumber: targetTicket.ticketNumber,
        eventId: targetTicket.eventId,
        eventName: targetTicket.eventName,
        customerName: targetTicket.customerName,
        staffId: effectiveStaff.id,
        staffName: `${effectiveStaff.name} (${effectiveStaff.staffRole || effectiveStaff.role})`,
        result: 'ALREADY_USED',
        scannedAt: now,
        deviceInfo: 'Camera / Web Scanner',
        notes: `Duplicate scan attempt! Previously checked in by ${targetTicket.usedBy || 'Staff'}.`,
      };
      setScanLogs((prev) => [scanLog, ...prev]);

      return {
        status: 'ALREADY_USED',
        ticket: targetTicket,
        event,
        message: 'This ticket has already been checked in. Multiple entries are strictly prohibited.',
        alreadyUsedInfo: {
          usedAt: targetTicket.usedAt || now,
          usedBy: targetTicket.usedBy || 'Authorized Staff',
        },
      };
    }

    // If CANCELLED
    if (targetTicket.status === 'CANCELLED') {
      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketId: targetTicket.id,
        ticketNumber: targetTicket.ticketNumber,
        eventId: targetTicket.eventId,
        eventName: targetTicket.eventName,
        customerName: targetTicket.customerName,
        staffId: effectiveStaff.id,
        staffName: `${effectiveStaff.name} (${effectiveStaff.staffRole || effectiveStaff.role})`,
        result: 'CANCELLED',
        scannedAt: now,
        deviceInfo: 'Camera / Web Scanner',
        notes: 'Rejected entry: Ticket has been cancelled.',
      };
      setScanLogs((prev) => [scanLog, ...prev]);

      return {
        status: 'CANCELLED',
        ticket: targetTicket,
        event,
        message: 'This ticket has been cancelled or invalidated.',
      };
    }

    // If REFUNDED or EXPIRED
    if (targetTicket.status === 'REFUNDED' || targetTicket.status === 'EXPIRED') {
      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketId: targetTicket.id,
        ticketNumber: targetTicket.ticketNumber,
        eventId: targetTicket.eventId,
        eventName: targetTicket.eventName,
        customerName: targetTicket.customerName,
        staffId: effectiveStaff.id,
        staffName: `${effectiveStaff.name} (${effectiveStaff.staffRole || effectiveStaff.role})`,
        result: 'EXPIRED',
        scannedAt: now,
        deviceInfo: 'Camera / Web Scanner',
        notes: `Ticket marked ${targetTicket.status}. Entry rejected.`,
      };
      setScanLogs((prev) => [scanLog, ...prev]);

      return {
        status: 'EXPIRED',
        ticket: targetTicket,
        event,
        message: `This ticket is ${targetTicket.status.toLowerCase()} and cannot be used for entry.`,
      };
    }

    // VALID: Atomically transition to USED!
    const staffLabel = `${effectiveStaff.name} (${effectiveStaff.staffRole || 'Staff'})`;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== targetTicket.id) return t;
        return {
          ...t,
          status: 'USED',
          usedAt: now,
          usedBy: staffLabel,
        };
      })
    );

    const scanLog: ScanLog = {
      id: `scan-${Date.now()}`,
      ticketId: targetTicket.id,
      ticketNumber: targetTicket.ticketNumber,
      eventId: targetTicket.eventId,
      eventName: targetTicket.eventName,
      customerName: targetTicket.customerName,
      staffId: effectiveStaff.id,
      staffName: staffLabel,
      result: 'VALID',
      scannedAt: now,
      deviceInfo: 'Camera / Web Scanner',
      notes: 'Entry approved. Status updated to USED.',
    };
    setScanLogs((prev) => [scanLog, ...prev]);

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'TICKET_CHECKIN',
      details: `Validated ticket ${targetTicket.ticketNumber} (${targetTicket.ticketTypeName}) for ${targetTicket.customerName}`,
      performedBy: staffLabel,
      timestamp: now,
    };
    setAuditLogs((prev) => [audit, ...prev]);

    const updatedTicket: Ticket = {
      ...targetTicket,
      status: 'USED',
      usedAt: now,
      usedBy: staffLabel,
    };

    return {
      status: 'VALID',
      ticket: updatedTicket,
      event,
      message: 'Ticket validated successfully! Allow attendee entry.',
    };
  };

  const markTicketStatus = (ticketId: string, newStatus: TicketStatus, notes?: string) => {
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: newStatus,
          usedAt: newStatus === 'USED' ? (t.usedAt || now) : t.usedAt,
          usedBy: newStatus === 'USED' ? (t.usedBy || currentUser.name) : t.usedBy,
        };
      })
    );

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: `TICKET_${newStatus}`,
      details: `Ticket ${ticketId} status changed to ${newStatus}. Note: ${notes || 'Manual admin/staff update'}`,
      performedBy: `${currentUser.name} (${currentUser.role})`,
      timestamp: now,
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const createEvent = (eventData: Omit<EventItem, 'id' | 'createdAt'>): EventItem => {
    const newEventId = `evt-${Date.now()}`;
    const newEvent: EventItem = {
      ...eventData,
      id: newEventId,
      createdAt: new Date().toISOString(),
      ticketTypes: eventData.ticketTypes.map((tt) => ({
        ...tt,
        eventId: tt.eventId || newEventId,
      })),
    };
    setEvents((prev) => [newEvent, ...prev]);

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'EVENT_CREATED',
      details: `Created new event "${newEvent.name}" (${newEvent.category})`,
      performedBy: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    return newEvent;
  };

  const updateEvent = (eventId: string, updates: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    );

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'EVENT_UPDATED',
      details: `Updated event details for ID ${eventId}`,
      performedBy: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      action: 'EVENT_DELETED',
      details: `Deleted event ID ${eventId}`,
      performedBy: `${currentUser.name} (${currentUser.role})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const addTicketType = (
    eventId: string,
    typeData: Omit<TicketType, 'id' | 'eventId' | 'sold'>
  ) => {
    const newType: TicketType = {
      ...typeData,
      id: `tt-${Date.now()}`,
      eventId,
      sold: 0,
    };

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          ticketTypes: [...e.ticketTypes, newType],
        };
      })
    );
  };

  const updateTicketType = (
    eventId: string,
    ticketTypeId: string,
    updates: Partial<TicketType>
  ) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          ticketTypes: e.ticketTypes.map((tt) =>
            tt.id === ticketTypeId ? { ...tt, ...updates } : tt
          ),
        };
      })
    );
  };

  const deleteTicketType = (eventId: string, ticketTypeId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          ticketTypes: e.ticketTypes.filter((tt) => tt.id !== ticketTypeId),
        };
      })
    );
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
  };

  const login = (emailOrPhone: string): boolean => {
    const trimmed = emailOrPhone.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        u.phone.replace(/\s+/g, '') === trimmed.replace(/\s+/g, '') ||
        u.id.toLowerCase() === trimmed
    );
    if (found) {
      setCurrentUserId(found.id);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const register = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsLoggedIn(true);
    return newUser;
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const updateHeroBanner = (updates: Partial<HeroBannerConfig>) => {
    setHeroBanner((prev) => ({ ...prev, ...updates }));
  };

  const resetHeroBanner = () => {
    setHeroBanner(DEFAULT_HERO_BANNER);
  };

  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    setCategories((prev) => (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]));
  };

  const removeCategory = (categoryName: string) => {
    if (categoryName.toLowerCase() === 'all') return;
    setCategories((prev) => prev.filter((c) => c.toLowerCase() !== categoryName.toLowerCase()));
  };

  const resetCategories = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  const getOrderByTicketId = (ticketId: string): OrderItem | undefined => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return undefined;
    return orders.find((o) => o.id === ticket.orderId);
  };

  const recordMLScan = (type: MLTicketType) => {
    setMlScanStats((prev) => {
      const nextDigital = type === 'DIGITAL' ? prev.digitalCount + 1 : prev.digitalCount;
      const nextPhysical = type === 'PHYSICAL' ? prev.physicalCount + 1 : prev.physicalCount;
      const nextTotal = nextDigital + nextPhysical;
      return {
        totalScanned: nextTotal,
        digitalCount: nextDigital,
        physicalCount: nextPhysical,
        digitalPercent: nextTotal > 0 ? Math.round((nextDigital / nextTotal) * 100) : 0,
        physicalPercent: nextTotal > 0 ? Math.round((nextPhysical / nextTotal) * 100) : 0,
      };
    });
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUserId('usr-customer-1');
    setIsLoggedIn(true);
    setEvents(INITIAL_EVENTS);
    setOrders(INITIAL_ORDERS);
    setTickets(INITIAL_TICKETS);
    setScanLogs(INITIAL_SCAN_LOGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setHeroBanner(DEFAULT_HERO_BANNER);
    setCategories(DEFAULT_CATEGORIES);
    setMlScanStats(INITIAL_ML_STATS);
    localStorage.clear();
  };

  return (
    <TicketContext.Provider
      value={{
        currentUser,
        currentRole,
        isLoggedIn,
        users,
        events,
        orders,
        tickets,
        scanLogs,
        auditLogs,
        heroBanner,
        categories,
        mlScanStats,
        getOrderByTicketId,
        recordMLScan,
        updateHeroBanner,
        resetHeroBanner,
        addCategory,
        removeCategory,
        resetCategories,
        switchUser,
        switchRole,
        purchaseTickets,
        validateTicketByQr,
        markTicketStatus,
        createEvent,
        updateEvent,
        deleteEvent,
        addTicketType,
        updateTicketType,
        deleteTicketType,
        addUser,
        updateUser,
        login,
        register,
        logout,
        resetAllData,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used within a TicketProvider');
  }
  return context;
};
