# Admin & Reporting

## Reporting Filters

The Admin Orders view will support:

1.  **Date Range**: Today, Yesterday, Last 7 Days, Custom Range.
2.  **Category**: Filter sales by specific food category (e.g., "How many Drinks sold?").
3.  **Payment Method**: Cash vs QR.

## Aggregations (Queries)

Since we are using IndexedDB, we will perform aggregations in JavaScript after fetching the relevant range.

**Total Sales**:
```typescript
const orders = await db.getAllFromIndex('orders', 'date', range);
const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);
```

**Item Popularity**:
```typescript
const itemCounts = {};
orders.forEach(order => {
  order.items.forEach(item => {
    itemCounts[item.itemId] = (itemCounts[item.itemId] || 0) + item.quantity;
  });
});
```

## Admin Interface

*   **Secure Access**: Simple PIN protection for now (local only).
*   **Data Management**:
    *   **Export**: Button to export all data to JSON (backup).
    *   **Import**: Restore from JSON.
