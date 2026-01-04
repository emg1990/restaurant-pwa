import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Category, MenuItem, Order } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

interface RestaurantDB extends DBSchema {
  categories: {
    key: string;
    value: Category;
    indexes: { 'by-order': number };
  };
  items: {
    key: string;
    value: MenuItem;
    indexes: { 'by-category': string };
  };
  orders: {
    key: string;
    value: Order;
    indexes: { 'by-date': number };
  };
  reports: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    // settings store is used as a simple key/value store for app settings and counters
    value: any;
  };
}

const DB_NAME = 'restaurant-pwa-db';
const DB_VERSION = 2;

export const initDB = async (): Promise<IDBPDatabase<RestaurantDB>> => {
  return openDB<RestaurantDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('categories')) {
        const store = db.createObjectStore('categories', { keyPath: 'id' });
        store.createIndex('by-order', 'displayOrder');
      }
      if (!db.objectStoreNames.contains('items')) {
        const store = db.createObjectStore('items', { keyPath: 'id' });
        store.createIndex('by-category', 'categoryId');
      }
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
      }
      // reports store (archived finalized days)
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
};

export const seedInitialData = async () => {
  const db = await initDB();
  const count = await db.count('categories');
  if (count === 0) {
    const categories: Category[] = [
      { id: uuidv4(), name: 'Drinks', displayOrder: 1, isEnabled: true },
      { id: uuidv4(), name: 'Burgers', displayOrder: 2, isEnabled: true },
      { id: uuidv4(), name: 'Desserts', displayOrder: 3, isEnabled: true },
    ];
    
    const tx = db.transaction(['categories', 'items'], 'readwrite');
    const catStore = tx.objectStore('categories');
    const itemStore = tx.objectStore('items');

    for (const cat of categories) {
      await catStore.add(cat);
      // Add dummy items
      if (cat.name === 'Drinks') {
          await itemStore.add({
            id: uuidv4(), categoryId: cat.id, name: 'Cola', price: 2.5, isEnabled: true,
          });
        await itemStore.add({ id: uuidv4(), categoryId: cat.id, name: 'Water', price: 1.5, isEnabled: true });
      } else if (cat.name === 'Burgers') {
        await itemStore.add({ id: uuidv4(), categoryId: cat.id, name: 'Cheeseburger', price: 8.0, isEnabled: true });
        await itemStore.add({ id: uuidv4(), categoryId: cat.id, name: 'Chicken Burger', price: 7.5, isEnabled: true });
      }
    }
    await tx.done;
    console.log('Initial data seeded');
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  const db = await initDB();
  return db.getAllFromIndex('categories', 'by-order');
};

export const getAllItems = async (): Promise<MenuItem[]> => {
  const db = await initDB();
  return db.getAll('items');
};

export const addCategory = async (category: Category): Promise<void> => {
  const db = await initDB();
  await db.put('categories', category);
};

export const addItem = async (item: MenuItem): Promise<void> => {
  const db = await initDB();
  await db.put('items', item);
};

export const addOrder = async (order: Order): Promise<void> => {
  const db = await initDB();
  await db.put('orders', order);
};

export const getOrder = async (id: string): Promise<Order | undefined> => {
  const db = await initDB();
  return db.get('orders', id);
};

export const deleteOrder = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('orders', id);
};

export const finalizeDay = async (date?: string): Promise<void> => {
  const db = await initDB();
  const day = date ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${day}T00:00:00`).getTime();
  const end = new Date(`${day}T23:59:59.999`).getTime();

  // get today's orders
  const orders: Order[] = await db.getAllFromIndex('orders', 'by-date', IDBKeyRange.bound(start, end));

  // aggregate items and totals
  const itemsMap = new Map<string, { itemId: string; name: string; unitPrice: number; quantity: number; total: number }>();
  let total = 0;
  const totalsByPayment: Record<string, number> = { CASH: 0, QR_CODE: 0, CARD: 0, OTHER: 0 };

  for (const o of orders) {
    total += o.totalAmount;
    const pm = (o.paymentMethod ?? 'OTHER') as string;
    totalsByPayment[pm] = (totalsByPayment[pm] || 0) + o.totalAmount;
    for (const it of o.items) {
      // aggregate by itemId and unitPrice (variants removed)
      const priceKey = it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '';
      const key = `${it.itemId}::${priceKey}`;
      const existing = itemsMap.get(key);
      if (existing) {
        existing.quantity += it.quantity;
        existing.total += it.unitPrice * it.quantity;
      } else {
        itemsMap.set(key, { itemId: it.itemId, name: it.name, unitPrice: it.unitPrice, quantity: it.quantity, total: it.unitPrice * it.quantity });
      }
    }
  }

  const newRun = {
    createdAt: Date.now(),
    orderCount: orders.length,
    total,
    totalsByPayment,
    items: Array.from(itemsMap.values()),
    orders: orders.map((o) => ({ id: o.id, shortId: o.shortId, orderNumber: o.orderNumber, totalAmount: o.totalAmount })),
  } as any;

  // retrieve existing report for the date and append a run (so multiple finalizations per day are preserved)
  const existing = await db.get('reports', day);
  if (!existing) {
    await db.put('reports', { date: day, runs: [newRun] });
  } else if (existing.runs && Array.isArray(existing.runs)) {
    existing.runs.push(newRun);
    await db.put('reports', existing);
  } else {
    // existing single-run legacy shape, convert to runs array
    const legacyRun = {
      createdAt: existing.createdAt,
      orderCount: existing.orderCount,
      total: existing.total,
      totalsByPayment: existing.totalsByPayment,
      items: existing.items,
      orders: existing.orders,
    } as any;
    const converted = { date: day, runs: [legacyRun, newRun] };
    await db.put('reports', converted);
  }

  // delete the orders from orders store so DaySummary will be empty
  const tx = db.transaction('orders', 'readwrite');
  for (const o of orders) {
    await tx.objectStore('orders').delete(o.id);
  }
  await tx.done;

  // reset the order counter for that date so new orders start from 1
  await resetOrderNumber(day);
};

export const getReport = async (date: string): Promise<any | undefined> => {
  const db = await initDB();
  return db.get('reports', date);
};

export const getReportsInRange = async (startDate: string, endDate: string): Promise<any[]> => {
  const db = await initDB();
  const all = await db.getAll('reports');
  const start = new Date(startDate).toISOString().slice(0, 10);
  const end = new Date(endDate).toISOString().slice(0, 10);
  return all.filter((r) => r.date >= start && r.date <= end).sort((a, b) => a.date.localeCompare(b.date));
};

export const updateOrder = async (order: Order): Promise<void> => {
  const db = await initDB();
  await db.put('orders', order);
};

/**
 * Get orders for a given date (YYYY-MM-DD). If no date is provided, uses today's date.
 */
export const getOrdersByDate = async (date?: string): Promise<Order[]> => {
  const db = await initDB();
  const day = date ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${day}T00:00:00`).getTime();
  const end = new Date(`${day}T23:59:59.999`).getTime();
  // Use index 'by-date' on createdAt to query range
  return db.getAllFromIndex('orders', 'by-date', IDBKeyRange.bound(start, end));
};

// Generic settings helpers (keyed key/value store)
export const getSetting = async <T = any>(key: string): Promise<T | undefined> => {
  const db = await initDB();
  return db.get('settings', key) as T | undefined;
};

export const setSetting = async (key: string, value: any): Promise<void> => {
  const db = await initDB();
  await db.put('settings', value, key);
};

/**
 * Returns the next sequential order number. The counter resets automatically when the stored date
 * does not match today's date (daily reset). The function stores an object under key 'orderCounter'
 * with shape { date: 'YYYY-MM-DD', counter: number }.
 */
export const getNextOrderNumber = async (): Promise<number> => {
  const db = await initDB();
  const today = new Date().toISOString().slice(0, 10);
  const entry = (await db.get('settings', 'orderCounter')) as { date: string; counter: number } | undefined;

  if (!entry || entry.date !== today) {
    const newEntry = { date: today, counter: 1 };
    await db.put('settings', newEntry, 'orderCounter');
    return 1;
  }

  const next = entry.counter + 1;
  await db.put('settings', { ...entry, counter: next }, 'orderCounter');
  return next;
};

/**
 * Manually reset the order number counter. By default resets for today's date and sets counter to 0.
 * Call this at the start of a labor day (shift) if you need to reset manually.
 */
export const resetOrderNumber = async (forDate?: string): Promise<void> => {
  const db = await initDB();
  const date = forDate ?? new Date().toISOString().slice(0, 10);
  await db.put('settings', { date, counter: 0 }, 'orderCounter');
};

export const deleteCategory = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('categories', id);
};

export const deleteItem = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('items', id);
};

export const updateCategory = async (category: Category): Promise<void> => {
  const db = await initDB();
  await db.put('categories', category);
};

export const updateItem = async (item: MenuItem): Promise<void> => {
  const db = await initDB();
  await db.put('items', item);
};

