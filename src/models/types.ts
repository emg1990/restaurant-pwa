export interface Category {
  id: string;
  name: string;
  displayOrder: number;
  icon?: string;
  thumbnail?: string;
  isEnabled: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  thumbnail?: string;
  icon?: string;
  isEnabled: boolean;
}

export type PaymentMethod = 'CASH' | 'QR_CODE' | 'CARD' | 'OTHER';
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'EAT_IN' | 'TO_GO';

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  shortId: string;
  orderNumber: number;
  createdAt: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  orderType?: OrderType;
  table?: string;
  notes?: string;
}

export interface AppSettings {
  restaurantName: string;
  currencySymbol: string;
  taxRate: number;
  printerIp?: string;
}
