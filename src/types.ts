export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type StaffRole = 'STAFF' | 'SENIOR_STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
export type OrderSource = 'ONLINE' | 'STAFF_ASSISTED' | 'ADMIN_CREATED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'QR_PAYMENT' | 'CARD' | 'ONLINE' | 'OTHER';
export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'SOLD_OUT' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  staffRole?: StaffRole;
  status: 'ACTIVE' | 'INACTIVE';
  avatar?: string;
  createdAt: string;
  preferences?: {
    soundEffects?: boolean;
    emailPassUpdates?: boolean;
    smsAlerts?: boolean;
  };
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'HIDDEN';
}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  organizer: string;
  capacity: number;
  status: EventStatus;
  rules: string[];
  ticketTypes: TicketType[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventId: string;
  eventName: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  source: OrderSource;
  createdBy: string; // User ID or 'Self-service'
  createdByName: string;
  notes?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. TKT-2026-000928
  orderId: string;
  orderNumber: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  qrToken: string; // Secure token encoded into the QR code
  status: TicketStatus;
  usedAt?: string;
  usedBy?: string; // Staff member who validated it
  createdAt: string;
}

export type ScanResultStatus = 'VALID' | 'ALREADY_USED' | 'INVALID' | 'CANCELLED' | 'EXPIRED';

export interface ScanLog {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  eventId?: string;
  eventName?: string;
  customerName?: string;
  staffId: string;
  staffName: string;
  result: ScanResultStatus;
  scannedAt: string;
  deviceInfo?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface HeroBannerConfig {
  enabled: boolean;
  tag: string;
  category?: string;
  title: string;
  description: string;
  date?: string;
  startTime?: string;
  location?: string;
  image: string;
  buttonText: string;
  eventId?: string;
}

export type MLTicketType = 'DIGITAL' | 'PHYSICAL';

export interface MLPredictionFeatures {
  paymentMethod: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  hourOfPurchase: number;
  dayOfWeek: number;
  hasNotes: boolean;
  ticketTier: string;
  timeSincePurchaseHours: number;
}

export interface MLPredictionResult {
  status: 'success' | 'error';
  ticketType: MLTicketType;
  predictionCode: number;
  confidence: number;
  inputFeatures?: MLPredictionFeatures;
  explanation?: string;
}

export interface MLScanStats {
  totalScanned: number;
  digitalCount: number;
  physicalCount: number;
  digitalPercent: number;
  physicalPercent: number;
}
