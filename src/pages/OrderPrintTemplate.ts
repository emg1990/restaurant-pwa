import type { Order } from '../models/types';

export const generateOrderPrintHTML = (order: Order): string => {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order #${order.orderNumber}</title>
        <style>
          /* Set the printed page size to a small ticket ~5cm x 5cm */
          @page { size: 5cm 5cm; margin: 4mm; }
          html, body { width: 5cm; height: 5cm; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 6px; box-sizing: border-box; font-size: 10px; }
          .header { text-align: center; margin-bottom: 4px; }
          .order-number { font-weight: bold; font-size: 12px; margin-bottom: 4px; }
          .order-info { margin-bottom: 6px; }
          .items { margin: 4px 0; }
          .item { display: flex; justify-content: space-between; padding: 2px 0; }
          .total { font-weight: bold; font-size: 11px; margin-top: 6px; display: flex; justify-content: space-between; }
          .divider { border-top: 1px solid #000; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="order-number">Order #${order.orderNumber}</div>
        </div>
        <div class="order-info">
          <div>Type: ${order.orderType === 'TO_GO' ? 'To go' : 'Eat in'}</div>
          ${order.table ? `<div>Table: ${escapeHtml(order.table)}</div>` : ''}
          <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div class="divider"></div>
        <div class="items">
          ${order.items.map(it => `
            <div class="item">
              <span>${escapeHtml(it.name)} x${it.quantity}</span>
              <span>$${((it.unitPrice ?? 0) * it.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="divider"></div>
        <div class="total">
          <span>Total:</span>
          <span>$${order.totalAmount.toFixed(2)}</span>
        </div>
      </body>
    </html>
  `;
};

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default generateOrderPrintHTML;

/**
 * Backwards-compatible print helper: opens a small window and triggers printing.
 */
export const printOrder = (order: Order) => {
  const html = generateOrderPrintHTML(order);
  const printWindow = window.open('', '', 'width=360,height=560');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    try { printWindow.focus(); printWindow.print(); } catch (err) { /* ignore */ }
    try { printWindow.close(); } catch (err) { /* ignore */ }
  }, 250);
};
