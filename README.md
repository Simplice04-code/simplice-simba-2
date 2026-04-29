# 🦁 Simba Supermarket — Online Shopping Platform

Rwanda's full-stack e-commerce platform for Simba Supermarket, Kigali.

**789 real products · 10 categories · MoMo/Airtel/COD payments · 3-language UI · Dark mode**

---

## 🚀 Quick Start

### Step 1 — Start the Backend API

```bash
cd backend
npm install          # first time only
npm run seed         # loads all 789 products into the database
npm start            # starts API on http://localhost:5000
```

### Step 2 — Open the Frontend

Open `frontend/index.html` directly in your browser.

> Use VS Code **Live Server** extension (right-click → Open with Live Server) or any static file server for the best experience. Opening the file directly via `file://` also works.

---

## 📁 Project Structure

```
vibeSimba/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express entry point
│   │   ├── config/database.js        # SQLite setup (node:sqlite built-in)
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register / Login (JWT)
│   │   │   ├── cartController.js     # Cart CRUD
│   │   │   ├── deliveryController.js # Delivery cost calculator
│   │   │   ├── orderController.js    # Order placement & tracking
│   │   │   ├── paymentController.js  # MoMo / Airtel / COD simulation
│   │   │   ├── productController.js  # Products, search, reviews
│   │   │   └── userController.js     # Profile management
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT guard
│   │   │   └── errorHandler.js
│   │   └── routes/                   # Express routers
│   ├── seeds/seedProducts.js         # Loads all 789 products from JSON
│   ├── simba.db                      # SQLite database (auto-created)
│   └── package.json
│
├── frontend/
│   ├── index.html                    # SPA shell
│   ├── css/style.css                 # Full design system (orange theme)
│   └── js/
│       ├── app.js                    # Router, nav, theme, search
│       ├── api.js                    # All fetch calls to backend
│       ├── cart.js                   # Cart state + sidebar + toasts
│       ├── i18n.js                   # EN / FR / RW translations
│       └── pages/
│           ├── home.js               # Hero, featured, categories
│           ├── products.js           # Grid, filters, pagination
│           ├── product-detail.js     # Detail view, reviews, related
│           ├── checkout.js           # Delivery, payment, order placement
│           ├── auth.js               # Login / Register forms
│           └── profile.js            # Profile editor + order tracker
│
└── simba_products (2).json           # Source product data (789 products)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, receive JWT |
| GET | `/api/users/profile` | Yes | Get profile |
| PUT | `/api/users/profile` | Yes | Update profile |
| GET | `/api/products` | No | List products (paginated, filterable) |
| GET | `/api/products/:id` | No | Product detail + reviews + related |
| GET | `/api/products/featured` | No | Featured products |
| GET | `/api/products/categories` | No | All categories with counts |
| POST | `/api/products/:id/reviews` | Yes | Submit review |
| GET | `/api/cart` | Yes | Get cart |
| POST | `/api/cart` | Yes | Add item |
| PUT | `/api/cart/:itemId` | Yes | Update quantity |
| DELETE | `/api/cart/:itemId` | Yes | Remove item |
| POST | `/api/orders` | Yes | Place order (from cart) |
| GET | `/api/orders/user` | Yes | Order history |
| GET | `/api/orders/:id` | Yes | Order detail |
| POST | `/api/delivery/calculate` | No | Estimate delivery cost & time |
| GET | `/api/delivery/districts` | No | All districts |
| POST | `/api/payments/momo` | Yes | Pay with MTN MoMo (simulated) |
| POST | `/api/payments/airtel` | Yes | Pay with Airtel Money (simulated) |
| POST | `/api/payments/cod` | Yes | Confirm pay-on-delivery |

---

## 🗄️ Database Schema

8 tables: `users`, `categories`, `products`, `cart`, `cart_items`, `orders`, `order_items`, `reviews`, `payments`

Uses Node.js built-in `node:sqlite` — no external database server needed.

---

## 🎨 Design

- **Primary color**: `#FF6600` (Simba Orange) matching the logo
- **Dark mode**: Toggle via 🌙 button in navbar
- **Mobile-first**: Responsive grid, hamburger nav, touch-friendly cart sidebar
- **3 languages**: English / Français / Kinyarwanda (EN/FR/RW switcher in navbar)
- **Currency**: Rwandan Francs (RWF), formatted with locale separators

---

## 💡 Features

- Browse 789 products across 10 categories
- Live search with dropdown suggestions
- Category filter bar (sticky)
- Sort by price / rating / newest
- Paginated product grid (24 per page)
- Product reviews & star ratings
- Cart sidebar with quantity controls
- Checkout with Rwanda address form (district → sector)
- Delivery cost calculator (based on district distance from Kigali)
- Free delivery on orders ≥ 100,000 RWF
- Payment simulation: MTN MoMo, Airtel Money, Cash on Delivery
- Order status tracker (Pending → Confirmed → Preparing → On the Way → Delivered)
- User profile with order history

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS SPA, CSS3 custom properties |
| Backend | Node.js + Express |
| Database | SQLite via `node:sqlite` (built-in, no compilation needed) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Fonts | Inter (Google Fonts) |

---

## 🌍 Delivery Zones

| District | Est. Cost | Est. Time |
|----------|-----------|-----------|
| Nyarugenge | 1,030 RWF | 33 min |
| Gasabo | 1,075 RWF | 37 min |
| Kicukiro | 1,060 RWF | 36 min |
| Muhanga | 2,125 RWF | 2h 22min |
| Huye | 2,950 RWF | 3h 15min |
| Rubavu | 3,400 RWF | 4h 30min |
| Free delivery on all orders ≥ 100,000 RWF | — | — |
