# Data Models

## Core Entities

### Category
```typescript
interface Category {
  id: string;
  name: string;
  displayOrder: number;
  icon?: string; // Icon name or URL
  isEnabled: boolean;
}
```

### MenuItem (Sub-item)
```typescript
interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  isEnabled: boolean;
  variants?: MenuItemVariant[]; // Optional for things like sizes
}

interface MenuItemVariant {
  id: string;
  name: string; // e.g., "500ml", "1L"
  priceModifier: number; // Add/subtract from base price or override
}
```

### Order
```typescript
type PaymentMethod = 'CASH' | 'QR_CODE' | 'CARD' | 'OTHER';
type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

interface Order {
  id: string; // UUID
  shortId: string; // Human readable short ID for tickets (e.g., #102)
  createdAt: number; // Timestamp
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
}

interface OrderItem {
  itemId: string;
  name: string; // Snapshot of name at time of order
  quantity: number;
  unitPrice: number; // Snapshot of price
  variantName?: string;
}
```

### Settings
```typescript
interface AppSettings {
  restaurantName: string;
  currencySymbol: string;
  taxRate: number;
  printerIp?: string; // For future network printing
}
```
