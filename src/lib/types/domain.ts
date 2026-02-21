/**
 * Domain types for Rental and Event management
 */

export type OrganizationPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
export type RentalStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type EventType = 'wedding' | 'corporate' | 'birthday' | 'other';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  logo?: string;
  timezone: string;
  currency: string;
  maxUsers: number;
  maxStorage: number;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rental {
  id: string;
  organizationId: string;
  clientId: string;
  eventType: EventType;
  eventName: string;
  description?: string;
  status: RentalStatus;
  deliveryDate: Date;
  pickupDate?: Date;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  items: RentalItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalItem {
  id: string;
  rentalId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  sku: string;
  description?: string;
  unitCost: number;
  rentalPrice: number;
  totalStock: number;
  availableStock: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetrics {
  todayEvents: number;
  pendingDeliveries: number;
  pickups: number;
  monthlyRevenue: number;
  clientCount: number;
  inventoryItems: number;
}
