import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

/**
 * Checks whether an event date has passed.
 * Returns true if the event date is strictly before today, or if today has passed the event's end time.
 */
export const isEventExpired = (
  eventDateStr?: string,
  eventEndTimeStr?: string,
  eventStartTimeStr?: string
): boolean => {
  if (!eventDateStr) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDate = String(now.getDate()).padStart(2, '0');
  const todayStr = `${currentYear}-${currentMonth}-${currentDate}`;

  // If the event date (YYYY-MM-DD) is earlier than today, it has strictly passed
  if (eventDateStr < todayStr) {
    return true;
  }

  // If the event is today, check if the event's end time (or start time + 6 hours) has passed
  if (eventDateStr === todayStr) {
    const timeStr = eventEndTimeStr || eventStartTimeStr;
    if (timeStr) {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || '0', 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const eventEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        const cutoff = eventEndTimeStr ? eventEnd.getTime() : eventEnd.getTime() + 6 * 3600 * 1000;
        if (now.getTime() > cutoff) {
          return true;
        }
      }
    }
  }

  return false;
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
  tag: 'Featured Cambodian Experience',
  category: 'Heritage & Running',
  title: 'Angkor Sunrise International Marathon 2026',
  description: 'Experience dawn breaking across the majestic stone spires of Angkor Wat. Official certified timing, temple trail routes, and celebration finish at Angkor Archaeological Park.',
  date: '2026-11-08',
  startTime: '05:30',
  location: 'Angkor Archaeological Park',
  image: 'https://images.unsplash.com/photo-1779419183221-df0bb6fdad1d?w=1600&auto=format&fit=crop&q=80',
  buttonText: 'Reserve Pass',
  eventId: 'evt-6',
};

export const DEFAULT_CATEGORIES: string[] = [
  'All',
  'Concert',
  'Running',
  'Night Market',
  'Food & Wine',
  'Conference',
  'Cinema',
  'Sports',
  'Theater',
  'Festival',
  'Exhibition',
  'Workshop',
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
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    return loaded.map((u) => {
      if (['usr-customer-1', 'usr-staff-1', 'usr-staff-2', 'usr-admin-1'].includes(u.id)) {
        const { avatar: _, ...rest } = u;
        return rest;
      }
      return u;
    });
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    loadStorage(STORAGE_KEYS.CURRENT_USER_ID, 'usr-customer-1')
  );
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    loadStorage(STORAGE_KEYS.IS_LOGGED_IN, true)
  );
  const [events, setEvents] = useState<EventItem[]>(() => {
    const loaded = loadStorage<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const existingIds = new Set(loaded.map((e) => e.id));
    const missing = INITIAL_EVENTS.filter((e) => !existingIds.has(e.id));
    const repaired = loaded.map((e) => {
      const fresh = INITIAL_EVENTS.find((ie) => ie.id === e.id);
      if (fresh) {
        // Sync verified authentic Cambodian photography and fresh venue details
        return {
          ...e,
          image: fresh.image,
          name: fresh.name,
          location: fresh.location,
          address: fresh.address,
        };
      }
      return e;
    });
    return missing.length > 0 ? [...repaired, ...missing] : repaired;
  });
  const [orders, setOrders] = useState<OrderItem[]>(() => loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const loaded = loadStorage(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    return loaded.map((t) => {
      if (t.status === 'VALID' && isEventExpired(t.eventDate, undefined, t.eventTime)) {
        return { ...t, status: 'EXPIRED' as TicketStatus };
      }
      return t;
    });
  });
  const ticketsRef = useRef<Ticket[]>(tickets);

  const [scanLogs, setScanLogs] = useState<ScanLog[]>(() => loadStorage(STORAGE_KEYS.SCAN_LOGS, INITIAL_SCAN_LOGS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS)
  );
  const [heroBanner, setHeroBanner] = useState<HeroBannerConfig>(() => {
    const loaded = loadStorage<HeroBannerConfig>(STORAGE_KEYS.HERO_BANNER, DEFAULT_HERO_BANNER);
    if (!loaded.image || loaded.image.includes('photo-1470225620780')) {
      return DEFAULT_HERO_BANNER;
    }
    return loaded;
  });
  const [categories, setCategories] = useState<string[]>(() => {
    const loaded = loadStorage<string[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    const existingLower = new Set(loaded.map((c) => c.toLowerCase()));
    const missing = DEFAULT_CATEGORIES.filter((c) => !existingLower.has(c.toLowerCase()));
    return missing.length > 0 ? [...loaded, ...missing] : loaded;
  });
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
    ticketsRef.current = tickets;
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
    let maxOrderSeq = 1000;
    for (const o of orders) {
      const match = o.orderNumber.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxOrderSeq) {
          maxOrderSeq = num;
        }
      }
    }
    const orderSeq = maxOrderSeq + 1;
    const orderNumber = `ORD-2026-${String(orderSeq).padStart(5, '0')}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

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

    // Generate N individual tickets with guaranteed unique sequence numbers, IDs, and distinct QR tokens
    const currentTicketList = ticketsRef.current && ticketsRef.current.length > 0 ? ticketsRef.current : tickets;
    let maxTicketSeq = 934;
    for (const t of currentTicketList) {
      const match = t.ticketNumber.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxTicketSeq) {
          maxTicketSeq = num;
        }
      }
    }

    const generatedTickets: Ticket[] = [];
    const baseNow = Date.now();
    for (let i = 1; i <= quantity; i++) {
      const ticketSeq = maxTicketSeq + i;
      const ticketNumber = `TKT-2026-${String(ticketSeq).padStart(6, '0')}`;
      const tokenSalt = `${baseNow.toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${i}`;
      const qrToken = `${ticketNumber}-SEC-${tokenSalt}`;

      const tktName = quantity > 1 && i > 1 ? `${customerInfo.name} (Guest ${i})` : customerInfo.name;

      const newTicket: Ticket = {
        id: `tkt-${baseNow}-${i}-${Math.random().toString(36).substring(2, 6)}`,
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
    const updatedTickets = [...generatedTickets, ...currentTicketList];
    ticketsRef.current = updatedTickets;
    setTickets(updatedTickets);

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
    const staffLabel = `${effectiveStaff.name} (${effectiveStaff.staffRole || effectiveStaff.role || 'Staff'})`;

    // Always fetch the freshest synchronous tickets snapshot
    const currentTickets = ticketsRef.current && ticketsRef.current.length > 0 ? ticketsRef.current : tickets;

    // Support compact cross-device ticket format: TP1:ticketNumber|name|paymentMethod|leadTime|tier|price|eventName
    if (trimmed.startsWith('TP1:')) {
      try {
        const raw = trimmed.substring(4);
        const [tktNo, custName, payMethod, leadHoursStr, tierName, priceStr, evName] = raw.split('|');
        trimmed = tktNo || trimmed;

        const existing = currentTickets.find((t) => t.ticketNumber === trimmed || t.qrToken === trimmed);
        if (!existing) {
          const priceNum = parseFloat(priceStr) || 15;
          const leadHoursNum = parseFloat(leadHoursStr) || 48;
          const evDate = new Date().toISOString().split('T')[0];

          // Check if expired
          const isExpired = isEventExpired(evDate);

          if (isExpired) {
            const importedExpiredTicket: Ticket = {
              id: `tkt-imp-${tktNo}-${Date.now()}`,
              ticketNumber: tktNo,
              orderId: `ord-imp-${tktNo}`,
              orderNumber: `ORD-${tktNo}`,
              eventId: 'ev-001',
              eventName: evName || 'General Admission Event',
              eventDate: evDate,
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
              status: 'EXPIRED',
              createdAt: new Date().toISOString(),
            };
            ticketsRef.current = [importedExpiredTicket, ...currentTickets];
            setTickets((prev) => [importedExpiredTicket, ...prev]);

            return {
              status: 'EXPIRED',
              ticket: importedExpiredTicket,
              message: `This ticket has expired past the event date (${evDate}) and cannot be used for admission.`,
            };
          }

          // First scan: admit attendee and immediately mark USED so it cannot be scanned twice
          const importedTicket: Ticket = {
            id: `tkt-imp-${tktNo}-${Date.now()}`,
            ticketNumber: tktNo,
            orderId: `ord-imp-${tktNo}`,
            orderNumber: `ORD-${tktNo}`,
            eventId: 'ev-001',
            eventName: evName || 'General Admission Event',
            eventDate: evDate,
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
            status: 'USED',
            usedAt: now,
            usedBy: staffLabel,
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

          ticketsRef.current = [importedTicket, ...currentTickets];
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
            staffName: staffLabel,
            result: 'VALID',
            scannedAt: now,
            deviceInfo: 'Camera / Web Scanner',
            notes: 'First scan: Entry approved. Ticket permanently updated to USED.',
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

    // Support portable self-contained QR code from another device
    if (trimmed.startsWith('{') && trimmed.includes('"tp":"v1"')) {
      try {
        const payload = JSON.parse(trimmed);
        trimmed = payload.qr || payload.tkt;

        const existing = currentTickets.find(
          (t) => t.qrToken === trimmed || t.ticketNumber === payload.tkt || t.id === payload.id
        );
        if (!existing) {
          const isExpired = isEventExpired(payload.date, undefined, payload.time);
          if (isExpired) {
            const importedExpiredTicket: Ticket = {
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
              status: 'EXPIRED',
              createdAt: new Date().toISOString(),
            };
            ticketsRef.current = [importedExpiredTicket, ...currentTickets];
            setTickets((prev) => [importedExpiredTicket, ...prev]);

            return {
              status: 'EXPIRED',
              ticket: importedExpiredTicket,
              message: `This ticket has expired past the event date (${payload.date}) and cannot be used for admission.`,
            };
          }

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
            status: 'USED',
            usedAt: now,
            usedBy: staffLabel,
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

          ticketsRef.current = [importedTicket, ...currentTickets];
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
            staffName: staffLabel,
            result: 'VALID',
            scannedAt: now,
            deviceInfo: 'Camera / Web Scanner',
            notes: 'First scan: Entry approved. Ticket permanently updated to USED.',
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

    // Find ticket by token or ticketNumber (exact match first, then fallback to embedded token in URL/data)
    let targetTicket = currentTickets.find(
      (t) =>
        t.qrToken.toLowerCase() === trimmed.toLowerCase() ||
        t.ticketNumber.toLowerCase() === trimmed.toLowerCase() ||
        t.id.toLowerCase() === trimmed.toLowerCase()
    );

    if (!targetTicket && trimmed.length >= 6) {
      targetTicket = currentTickets.find(
        (t) =>
          trimmed.toLowerCase().includes(t.qrToken.toLowerCase()) ||
          trimmed.toLowerCase().includes(t.ticketNumber.toLowerCase()) ||
          trimmed.toLowerCase().includes(t.id.toLowerCase())
      );
    }

    if (!targetTicket) {
      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketNumber: trimmed,
        staffId: effectiveStaff.id,
        staffName: staffLabel,
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

    // 1. STRICT CHECK: Has ticket already been USED? Prevent second entry!
    if (targetTicket.status === 'USED') {
      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketId: targetTicket.id,
        ticketNumber: targetTicket.ticketNumber,
        eventId: targetTicket.eventId,
        eventName: targetTicket.eventName,
        customerName: targetTicket.customerName,
        staffId: effectiveStaff.id,
        staffName: staffLabel,
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
        message: 'This ticket has already been used and checked in. Multiple entries are strictly prohibited.',
        alreadyUsedInfo: {
          usedAt: targetTicket.usedAt || now,
          usedBy: targetTicket.usedBy || 'Authorized Staff',
        },
      };
    }

    // 2. CHECK: Cancelled or Refunded
    if (targetTicket.status === 'CANCELLED' || targetTicket.status === 'REFUNDED') {
      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketId: targetTicket.id,
        ticketNumber: targetTicket.ticketNumber,
        eventId: targetTicket.eventId,
        eventName: targetTicket.eventName,
        customerName: targetTicket.customerName,
        staffId: effectiveStaff.id,
        staffName: staffLabel,
        result: 'CANCELLED',
        scannedAt: now,
        deviceInfo: 'Camera / Web Scanner',
        notes: `Rejected entry: Ticket has been ${targetTicket.status.toLowerCase()}.`,
      };
      setScanLogs((prev) => [scanLog, ...prev]);

      return {
        status: 'CANCELLED',
        ticket: targetTicket,
        event,
        message: `This ticket has been ${targetTicket.status.toLowerCase()} and cannot be used for admission.`,
      };
    }

    // 3. STRICT CHECK: Has event date expired?
    const ticketEventDate = targetTicket.eventDate || event?.date;
    const ticketEndTime = event?.endTime;
    const ticketStartTime = targetTicket.eventTime || event?.startTime;

    const hasExpired =
      targetTicket.status === 'EXPIRED' ||
      isEventExpired(ticketEventDate, ticketEndTime, ticketStartTime) ||
      event?.status === 'COMPLETED';

    if (hasExpired) {
      const expiredTicket: Ticket = {
        ...targetTicket,
        status: 'EXPIRED',
      };

      ticketsRef.current = currentTickets.map((t) => (t.id === targetTicket.id ? expiredTicket : t));
      setTickets((prev) => prev.map((t) => (t.id === targetTicket.id ? expiredTicket : t)));

      const scanLog: ScanLog = {
        id: `scan-${Date.now()}`,
        ticketId: targetTicket.id,
        ticketNumber: targetTicket.ticketNumber,
        eventId: targetTicket.eventId,
        eventName: targetTicket.eventName,
        customerName: targetTicket.customerName,
        staffId: effectiveStaff.id,
        staffName: staffLabel,
        result: 'EXPIRED',
        scannedAt: now,
        deviceInfo: 'Camera / Web Scanner',
        notes: `Rejected entry: Event date (${ticketEventDate}) has passed. Ticket is expired.`,
      };
      setScanLogs((prev) => [scanLog, ...prev]);

      return {
        status: 'EXPIRED',
        ticket: expiredTicket,
        event,
        message: `This ticket is invalid because the event took place on ${ticketEventDate} and has expired.`,
      };
    }

    // 4. VALID PASS: Immediately transition to USED so it can NEVER be scanned twice!
    const updatedTicket: Ticket = {
      ...targetTicket,
      status: 'USED',
      usedAt: now,
      usedBy: staffLabel,
    };

    // Update synchronous ref first
    ticketsRef.current = currentTickets.map((t) => (t.id === targetTicket.id ? updatedTicket : t));
    setTickets((prev) => prev.map((t) => (t.id === targetTicket.id ? updatedTicket : t)));

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
      notes: 'First scan: Entry approved. Ticket permanently updated to USED.',
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
