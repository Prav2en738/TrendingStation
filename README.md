# ToyVerse - Toy Store

A React toy-store app with a customer storefront and a role-based Admin area, in one project and behind one login page. Data is mock data stored in the browser (localStorage) for now.

## Run it (demo version - no backend, no database)

You only need Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
```

All data (users, products, orders, stock history) is dummy data kept in the browser's localStorage. The `server/` folder is left in the project but is **not used** and never contacted. To reset the demo, run `localStorage.clear()` in the browser console and refresh.

## Demo logins

| Role     | Email                    | Password      | After login     |
|----------|--------------------------|---------------|-----------------|
| Admin    | `admin@toyverse.demo`    | `admin123`    | Admin Dashboard |
| Customer | `customer@toyverse.demo` | `customer123` | Home page       |

Other dummy customers (`priya@`, `arjun@`, `sneha@toyverse.demo`, password `customer123`) own sample orders. The Register page also works and creates a customer saved in this browser only.

The session is stored as `{ id, name, role, isLoggedIn }` in `localStorage["toyverse_session"]`, so it survives a refresh; Logout clears it.

## Admin area (`/#/admin/...`)

- **Dashboard** - cards + 4 charts, all calculated from the local demo data (refreshes every 15 s)
- **Add Products** - add / edit / delete, discount, images (URL or file, saved in the browser), stock, and a label: Regular, Trending, New Arrival, Handmade, Best Seller, Coming Soon
- **Orders** - every order with customer details; change status (Pending, Dispatched, Delivered, Not Available, Cancelled, Returned)
- **Stock Movements** - history of every stock in/out (previous, changed, new, reason, time, who), manual stock in/out, low-stock alerts

## Stock rules

- Placing an order takes stock off the shelf; it can never go below zero.
- Cancelling an order (customer: only while Pending; admin: any time before Delivered), marking it Not Available, or marking a Delivered order Returned puts the units back - exactly once.
- Cancelled / Not Available / Returned orders are final and do not count as sales.
- Every change writes a row to the stock history.

## Project layout

```
server/models        User, Product, Order, StockMovement, Counter   (unused in the demo)
server/controllers   auth, products, orders, stock, dashboard, upload, users   (unused in the demo)
server/routes        one file per controller; admin routes use authMiddleware + adminMiddleware   (unused in the demo)
server/utils         http.js (errors), stock.js (atomic stock operations)   (unused in the demo)
server/tests         npm test - API integration tests (needs MongoDB)   (unused in the demo)
src/services/api.js  every page's data comes from here (localStorage demo service, no network)
```

## Environment variables

`server/.env` (see `server/.env.example`): `MONGODB_URI`, `JWT_SECRET` (required), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PORT`; optional `CLIENT_URL`, `SERVER_URL`, `LOW_STOCK_LIMIT`.
Frontend: optional `VITE_API_URL` for production builds.


```
