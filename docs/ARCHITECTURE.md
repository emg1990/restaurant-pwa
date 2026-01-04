# Architecture & Implementation Plan

## Folder Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components
│   ├── common/      # Generic components (Button, Card, Modal)
│   ├── layout/      # Layout components (Header, Sidebar)
│   ├── ordering/    # Components specific to ordering flow
│   └── admin/       # Components specific to admin panel
├── context/         # React Contexts (Global state)
├── hooks/           # Custom hooks
├── lib/             # Utility functions
├── models/          # TypeScript interfaces/types
├── pages/           # Page components (routed)
├── services/        # Data services (API/DB abstraction)
│   ├── db.ts        # IndexedDB configuration
│   ├── repository.ts # Generic repository pattern
│   └── sync.ts      # Future Firebase sync logic
├── theme/           # MUI theme configuration
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Architecture Overview

The application follows a **Offline-First** architecture.

1.  **UI Layer**: React components using Material UI. Components should be dumb where possible, receiving data via props or hooks.
2.  **Business Logic Layer**: Custom React Hooks (`useMenu`, `useCart`, `useOrders`) manage state and interaction logic. They communicate with the Data Layer.
3.  **Data Layer**: A Repository pattern abstracts the underlying storage.
    *   **Local**: IndexedDB (via `idb` library) stores all data locally.
    *   **Remote (Future)**: Firebase. The repository will handle syncing.

## Offline Storage Strategy

*   **Database**: IndexedDB.
*   **Stores**:
    *   `categories`: Menu categories.
    *   `items`: Menu items/sub-items.
    *   `orders`: Placed orders.
    *   `settings`: App configuration.
    *   `sync_queue`: Operations waiting to be synced to Firebase.

## Firebase Sync Plan (Future)

To enable future Firebase integration without refactoring:

1.  **Repository Interface**: Define strict interfaces for data access (e.g., `getOrders()`, `saveOrder()`).
2.  **Sync Queue**: When an action occurs (e.g., `saveOrder`), save it to local IDB *and* add an entry to `sync_queue`.
3.  **Sync Worker**: A background process (or hook) checks `sync_queue` when online and pushes changes to Firebase.
4.  **Conflict Resolution**: Last-write-wins or timestamp-based resolution for simple conflicts.

## PWA Features

*   **Manifest**: `manifest.json` for installability.
*   **Service Worker**: Cache assets (HTML, CSS, JS) for offline execution.
*   **Meta Tags**: Viewport settings for mobile optimization.
