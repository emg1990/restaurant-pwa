export interface Category {
  id: string;
  name: string;
  displayOrder: number;
  icon?: string;
  thumbnail?: string;
  isEnabled: boolean;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceModifier: number;
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
  variants?: MenuItemVariant[];
}

export type PaymentMethod = 'CASH' | 'QR_CODE' | 'CARD' | 'OTHER';
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  variantName?: string;
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
  notes?: string;
}

export interface AppSettings {
  restaurantName: string;
  currencySymbol: string;
  taxRate: number;
  printerIp?: string;
}
