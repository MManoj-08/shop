# Kudla Santhe

A full-stack grocery delivery web app for a real neighbourhood shop in Bangalore (fresh produce and Mangalore & Udupi snacks): a mobile-friendly storefront for customers and a separate dashboard for the owner to run the business day to day.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Prisma** and **PostgreSQL (Neon)**.

## Features

**Customers**
- Browse a menu of categories and sub-categories, search, sort and filter (in stock, price bands). Product names in English and Kannada.
- Cart that works on phones (sticky cart bar), reorder a previous order in one tap.
- Checkout with **"Use my current location"**: the address fields fill themselves in (OpenStreetMap lookup) and stay editable. The exact coordinates are saved with the order but never shown to customers.
- Delivery area check by distance from the shop, delivery slots, delivery fee and minimum order.
- Pay by **UPI**: a QR code with the exact amount and order number, then the customer enters the 12-digit UTR. The order page updates by itself when the shop confirms.
- Mobile-number + password accounts, with **forgot password by email** (single-use links that expire).

**Shop owner** (separate login and interface, `/admin`)
- **Dashboard:** what needs attention (payments to check, orders to accept, refunds), sales figures, an interactive sales-by-day chart (7 days / 30 days / this month) and a **daily tracker** table with orders and amounts per day.
- **Orders** with filters, search and a per-day view; accept, pack, dispatch, deliver or cancel.
- **Payments ledger**, **customers** with order history, **products & stock** (prices, sizes, daily stock) and **settings** (delivery distance, fee, free-delivery limit, minimum order, time slots).

## How it works (design decisions)

- **Manual UPI verification instead of a payment gateway.** A small shop shouldn't pay gateway fees, so the customer pays to the shop's own UPI ID and submits the UTR. The owner confirms it against their own bank/UPI app, and only then can the order be accepted. A UTR can be used only once, unpaid orders cancel themselves after 30 minutes, and a payment that gets cancelled after being confirmed is flagged for refund.
- **Server-side everything that matters.** Prices are re-read from the database when an order is placed, the delivery radius is checked on the server, and every owner action and page checks the owner role before touching any data (a page cannot leak data before a layout redirect happens).
- **Authentication without a framework.** Signed JWT cookies (`jose`), `bcrypt` password hashes, account lockout after repeated wrong passwords, and identical error messages for unknown numbers and wrong passwords.
- **Password reset.** Random single-use tokens stored only as hashes, 30-minute expiry, a per-account hourly limit, the link built from a configured `APP_URL` (never the request's `Host` header), and the same answer whether or not a number is registered.
- **India time.** "Today" and the daily figures are computed in IST (UTC+5:30), whatever time zone the server runs in.
- **Privacy.** Customer coordinates and contact details stay on the server side and in the owner screens only.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Cache Components), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL on Neon, accessed with Prisma 6 (migrations in `prisma/migrations`) |
| Validation | Zod |
| Auth | `jose` (JWT), `bcryptjs` |
| Email | Nodemailer (any SMTP account) |
| QR codes | `qrcode` |
| Maps | OpenStreetMap embed and lookup (no API key) |

## Project layout

```
src/
  app/
    (shop)/      storefront: home, categories, product, cart, checkout, orders, profile
    (auth)/      login, sign-up, forgot / reset password (no footer)
    admin/       owner login and the owner interface
  actions/       server actions (auth, orders, payment, settings, ...)
  components/    shared UI (header, cart, product cards, admin nav, ...)
  lib/           session, payments, password reset, mail, date helpers, ...
prisma/          schema, migrations, seed
scripts/         one-off tools (add produce, set a password, copy a database)
data/            fresh-produce list and photo credits
```

## Getting started

You need Node.js 20+ and a PostgreSQL database (a free [Neon](https://neon.tech) project is fine).

```bash
npm install
cp .env.example .env          # then fill in your values (see below)
npm run db:migrate            # create the tables
npm run db:seed               # categories, sample products, delivery slots and area
npm run produce:add           # optional: the fresh fruit and vegetable list
npm run password:set -- <ADMIN_PHONE>   # creates the owner account and sets their password
npm run dev                   # http://localhost:3000
```

Owner login: `/admin/login` (there is also a button on the customer login page).

### Settings (`.env`)

See [`.env.example`](.env.example) for every setting. The important ones:

| Setting | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | signs login cookies; use a long random string |
| `SHOP_LAT`, `SHOP_LNG`, `SHOP_ADDRESS` | where the shop is (delivery distance and the footer map) |
| `ADMIN_PHONE` | the owner's mobile number |
| `SHOP_UPI_ID` | the UPI ID customers pay to. **Orders stay closed until this is set.** |
| `APP_URL`, `SMTP_*` | the website address and mail account used for password-reset emails. Without SMTP, the reset link is shown on screen in development only. |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | run, build and serve the app |
| `npm run lint` | ESLint |
| `npm run db:migrate` / `db:seed` | apply migrations / load starter data |
| `npm run produce:add` | add the fresh-produce items (safe to re-run) |
| `npm run password:set -- <mobile>` | set or reset a password from a hidden prompt (owner, staff or a customer) |

## Status and roadmap

A working project that is being prepared for real customers. Not built yet: SMS one-time codes, push notifications for new orders, an automated test suite, and staff accounts with limited permissions.

## Credits

Product photos come from Unsplash and Wikimedia Commons; each photographer is credited on the site's `/credits` page (data in `data/photo-credits.json`). Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
