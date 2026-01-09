export type UserRole = 'admin' | 'staff';

export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id: string;
  name: string;
  sareeType: string;
  brand: string;
  color: string;
  pattern: string;
  costPrice: number;
  sellingPrice: number;
  sku: string;
  stockQuantity: number;
  purchaseDate: Date;
  qrCode?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  _id: string;
  name: string;
  mobileNumber: string;
  address?: string;
  totalPurchases?: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  _id: string;
  billNumber: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  items: BillItem[];
  subtotal: number;
  gst: number;
  discount: number;
  grandTotal: number;
  paymentMode: 'cash' | 'upi' | 'card';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Return {
  _id: string;
  billId: string;
  billNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    reason: string;
  }>;
  refundAmount: number;
  refundMode: 'cash' | 'upi' | 'card' | 'adjustment';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wastage {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  costImpact: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransaction {
  _id: string;
  productId: string;
  type: 'in' | 'out' | 'return' | 'wastage';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string; // Bill ID, Return ID, etc.
  createdBy: string;
  createdAt: Date;
}


