export type Role = 'ADMIN' | 'MERCHANT' | 'INFLUENCER' | 'DELIVERY_PARTNER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  location: string;
  vpa: string; // UPI ID / Virtual Payment Address
  trustScore: number; // For trust index calculations
  phone: string;
  storeName?: string;
  gstin?: string;
  niche?: string;
  vehicleType?: string;
  licenseNo?: string;
  aadhaarMasked?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  specifications: string;
  image: string;
  price: number;
  category: string;
  hsnCode: string;
  bisCertified: boolean;
}

export type OrderStatus = 
  | 'BOOKED' 
  | 'BUYER_ACCEPTED' 
  | 'TRANSPORT_PENDING'
  | 'RIDER_ASSIGNED'
  | 'RIDER_ACCEPTED'
  | 'ARRIVED_AT_VENDOR'
  | 'IN_TRANSIT'
  | 'DELIVERED_AWAITING_OTP'
  | 'DELIVERED';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerLocation: string;
  merchantId: string;
  merchantName: string;
  merchantLocation: string;
  influencerId?: string;
  influencerName?: string;
  influencerVpa?: string;
  product: Product;
  quantity: number;
  paymentMode: 'PREPAID' | 'COD';
  paymentStatus: 'PENDING' | 'COMPLETED';
  status: OrderStatus;
  notes?: string;
  trackingHistory: { status: OrderStatus; timestamp: string }[];
  createdAt: string;
  commissionPercent: number;
  platformFeePercent: number;
  taxPercent: number;
  deliveryFeeAmount: number;
  dispatchDetails?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vendorCode?: string;
  customerOtp?: string;
  enteredVendorCode?: string;
  enteredCustomerOtp?: string;
  finalSplits?: {
    merchant: number;
    influencer: number;
    platform: number;
    tax: number;
    delivery: number;
  };
}

export interface SystemConfig {
  platformFeePercent: number; // strictly capped at 2.0% - 3.0%
  defaultInfluencerPercent: number;
  defaultTaxPercent: number;
  deliveryFeeAmount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'REGISTRATION_APPROVAL' | 'TRANSACTION_OVERRIDE' | 'COMPLIANCE_FLAG_TOGGLE' | 'REGULATION_ADJUSTMENT' | 'CRITICAL_WIPE' | 'KYC_REVOCATION';
  actorName: string;
  actorEmail: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'SUCCESS' | 'BLOCKED' | 'FLAGGED';
  hash: string;
  prevHash: string;
  metadata?: Record<string, any>;
}

export type Language = 'en' | 'hi' | 'te' | 'ta';
