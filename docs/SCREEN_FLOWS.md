# Screen Flows & UX

## 1. Main Screen (Menu Categories)
*   **Layout**: Grid of large cards.
*   **Content**: Category Name + Icon/Image.
*   **Interaction**: Tap category -> Navigate to Sub-item Screen.
*   **Footer**: "View Order" button (Floating Action Button or Bottom Bar) showing current total and item count.

## 2. Sub-item Screen (Ordering)
*   **Header**: Category Name + Back Button.
*   **Layout**: List or Grid of items.
*   **Item Card**:
    *   Name & Price.
    *   **Controls**: Big [-] Quantity [+] buttons.
    *   **Feedback**: Highlight item if quantity > 0.
*   **Interaction**: Tapping +/- updates cart immediately. No "Add to Cart" modal unless variants need selection.

## 3. Summary Screen (Cart)
*   **Layout**: List of selected items.
*   **Item Row**: Name, Quantity (editable via +/-), Total Price for row.
*   **Footer**:
    *   Total Amount.
    *   "Confirm Order" button (Primary).
    *   "Cancel" button (Secondary).

## 4. Order Confirmation & Payment
*   **Trigger**: "Confirm Order" tapped.
*   **Modal/Screen**: Select Payment Method (Cash, QR).
*   **Action**: Save Order -> Generate Ticket -> Show Success -> Reset for next order.

## 5. Admin Dashboard
*   **Access**: Hidden button or separate route (`/admin`).
*   **Tabs**:
    *   **Menu Management**: CRUD for Categories/Items.
    *   **Orders**: List of past orders with filters.
    *   **Settings**: App configuration.

## UX Decisions for Speed
*   **Touch Targets**: Minimum 48x48px, preferably larger for main actions.
*   **Less Taps**: Incrementing quantity happens directly on the item list, not a separate details page.
*   **Contrast**: High contrast for readability in varying lighting conditions.
*   **Feedback**: Haptic feedback (if available) or visual ripple on taps.
