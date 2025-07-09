import { Timestamp } from '@angular/fire/firestore';

// Base interface for documents with audit fields
export interface FirestoreDocument {
  id?: string; // Firestore document ID
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Category extends FirestoreDocument {
  name: string;
  description?: string;
}

export interface Supplier extends FirestoreDocument {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
}

export interface Product extends FirestoreDocument {
  name: string;
  description?: string;
  barcode?: string;
  salePrice: number;
  purchasePrice: number;
  currentStock: number; // ADDED BACK
  minStock?: number;
  unitOfMeasure?: string;
  isActive: boolean;
  categoryId: string;
  categoryName: string; // Denormalized
  supplierId: string;
  supplierName: string; // Denormalized
  imageUrl?: string; // URL from Firebase Storage
}

// Stock interface REMOVED

export interface Client extends FirestoreDocument {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  rfc?: string;
  registeredAt?: Timestamp; // Specific for clients
}

export interface OrderItem {
  productId: string;
  productName: string; // Denormalized
  quantity: number;
  unitSalePrice: number;
  unitPurchaseCost: number;
  lineSubtotal: number;
  lineTax: number;
}

export interface Order extends FirestoreDocument {
  clientId?: string; // Null for anonymous sales
  clientName?: string; // Denormalized
  saleDate: Timestamp;
  totalAmount: number;
  totalDiscount?: number;
  totalTax: number;
  paymentMethod: string;
  orderStatus: 'Completada' | 'Pendiente' | 'Cancelada'; // Enum-like string
  notes?: string;
  // orderItems will be a subcollection, not directly in the Order document
}

export interface KardexEntry extends FirestoreDocument {
  productId: string;
  productName: string; // Denormalized
  movementDate: Timestamp;
  movementType: 'entrada' | 'salida' | 'ajuste' | 'devolucion'; // Enum-like string
  quantityIn?: number;
  costIn?: number;
  quantityOut?: number;
  costOut?: number;
  balanceQuantity: number;
  balanceWeightedAvgCost: number;
  balanceTotalValue: number;
}

export interface CompanyConfig extends FirestoreDocument {
  companyName: string;
  legalName?: string;
  rfc?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string; // URL of the company logo in Firebase Storage
}