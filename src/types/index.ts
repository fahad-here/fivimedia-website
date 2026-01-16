// Type definitions for FiviMedia LLC Formation App
// Matches prisma/schema.prisma

export type Locale = "en" | "ar";

export interface State {
  id: string;
  code: string;
  name: string;
  basePrice: number;
  isRecommended: boolean;
}

export interface CoverageItem {
  id: string;
  key: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  sortOrder: number;
}

export interface StateCoverage {
  id: string;
  stateId: string;
  coverageItemId: string;
  enabled: boolean;
  processingTime?: string | null;
  coverageItem?: CoverageItem;
}

// API response for coverage (localized)
export interface CoverageResponse {
  key: string;
  title: string;
  description?: string | null;
  processingTime?: string | null;
}

export interface AddOn {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number;
  sortOrder: number;
  isActive: boolean;
}

// API response for add-ons (localized)
export interface AddOnResponse {
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  selected?: boolean;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  businessName: string;
  notes?: string;
}

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface Order {
  id: string;
  entity: string;
  stateCode: string;
  addOns: string[]; // Array of add-on slugs
  customerInfo: CustomerInfo;
  basePrice: number;
  addOnTotal: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  state?: State;
}

// Wizard state (client-side)
export interface WizardState {
  entity: string;
  stateCode: string | null;
  selectedAddOns: string[]; // Array of slugs
  customerInfo: CustomerInfo | null;
}

// API: Quote request/response
export interface QuoteRequest {
  stateCode: string;
  addOns?: string[]; // Array of slugs
}

export interface QuoteResponse {
  stateCode: string;
  stateName: string;
  basePrice: number;
  addOns: AddOnResponse[];
  addOnTotal: number;
  total: number;
}

// API: Create order request
export interface CreateOrderRequest {
  entity: string;
  stateCode: string;
  addOns: string[]; // Array of slugs
  customerInfo: CustomerInfo;
}

// API: Generic response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Admin stats
export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

// Contact form
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}
