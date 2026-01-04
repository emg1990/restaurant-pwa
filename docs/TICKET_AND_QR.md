# Ticket & QR Strategy

## Ticket Layout (Printable)

The ticket is generated as a hidden HTML element or a separate window for printing.

```html
<div class="ticket">
  <div class="header">
    <h3>Restaurant Name</h3>
    <p>Date: 2023-10-27 14:30</p>
    <p>Order #: 102</p>
  </div>
  <hr />
  <div class="items">
    <div class="row">
      <span>2x Burger</span>
      <span>$20.00</span>
    </div>
    <div class="row">
      <span>1x Coke</span>
      <span>$3.00</span>
    </div>
  </div>
  <hr />
  <div class="total">
    <strong>Total: $23.00</strong>
  </div>
  <div class="footer">
    <p>Payment: Cash</p>
    <p>Thank you!</p>
  </div>
</div>
```

**Printing Strategy**:
1.  Render ticket to a hidden `iframe` or `div`.
2.  Use `window.print()` with CSS `@media print` to target only the ticket content.
3.  Browser handles the connection to the printer (Bluetooth/WiFi printer paired with Android device).

## QR Code Generation

*   **Library**: `qrcode.react`
*   **Content**: JSON string or URL containing Order ID and Total.
    *   Example: `{"id":"12345", "total":23.00}`
*   **Usage**: Displayed on the "Order Success" screen. Can be scanned by a separate cashier app or customer payment app.
