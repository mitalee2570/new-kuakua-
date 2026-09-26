# 📘 PRETUTE E-Commerce Platform: Code Structure & Architecture Guide
### (Website & Admin Panel Master Guide)

This guide provides an architectural overview of all files in the website and admin panel. When you want to modify text, images, colors, styles, buttons, admin panel features, or product catalogs, use this document to locate the exact source files.

---

## 🗂️ 1. Project Structure Overview

```text
PRETUTE-Premium-E-Commerce-Platform/
│
├── CODE_STRUCTURE_GUIDE.md      <-- Architectural documentation
├── CODE_STRUCTURE_GUIDE.html    <-- Visual HTML guide
├── package.json                 <-- Root workspace scripts
│
├── frontend/                    <-- User Interface (React + Vite SPA)
│   ├── public/assets/           <-- Photos, branding, and hero assets
│   └── src/
│       ├── App.jsx              <-- Main Application Router & Layout
│       ├── style.css            <-- Storefront Stylesheet & Design System
│       ├── admin.css            <-- Admin Panel Stylesheet
│       ├── components/          <-- Modular UI Components
│       │   ├── admin/           <-- Admin Panel (AdminLayout.jsx)
│       │   ├── home/            <-- Storefront Sections (Hero, Latest, etc.)
│       │   ├── common/          <-- Header, Navigation, Footer, Modals
│       │   ├── product/         <-- Product Card & 6-Angle Product Details
│       │   ├── cart/            <-- Slide-out Cart Drawer
│       │   ├── checkout/        <-- Checkout & Payment Flows
│       │   └── customer/        <-- Authentication & Customer Profile
│       ├── context/             <-- Global State (StoreContext.jsx)
│       ├── data/                <-- Default Seed Data (initialData.js)
│       └── services/            <-- REST API Client (api.js)
│
└── backend/                     <-- Backend Server (Node.js + Express)
    ├── server.js                <-- Express Application Entry Point
    ├── data/                    <-- JSON Data Stores (Products, Categories, etc.)
    └── routes/                  <-- API Endpoints (Products, Orders, Coupons, Admin)
```

---

## 🎨 2. Design, Styling & Fonts (CSS Files)

| File Path | Purpose | Customization Scope |
| :--- | :--- | :--- |
| **`frontend/src/style.css`** | Primary storefront stylesheet | • **Brand Colors**: Primary accent (`#FF5B7F`), Navy header (`#1A253C`), Price green (`#22c55e`).<br>• **Typography**: Google Fonts 'Outfit' and 'Inter'.<br>• **Buttons & Cards**: Add to Cart, Buy Now, shadows, and hover animations.<br>• **Responsive Grid**: Mobile breakpoint column definitions. |
| **`frontend/src/admin.css`** | Admin panel stylesheet | • Sidebar dark navy styling (`#1A253C`).<br>• Tables, inputs, and 6-angle image upload slots.<br>• Status badges (Active, In Stock, Sale). |
| **`frontend/src/index.css`** | Base global reset | • Global body styling, box sizing, and base colors. |

---

## 🖥️ 3. Storefront Components

### A. Header, Navigation & Footer

| File Path | Description | Customization Scope |
| :--- | :--- | :--- |
| **`frontend/src/components/common/Header.jsx`** | Top header, announcement bar, logo, search | • Top announcement banner text.<br>• Logo image and brand title.<br>• Customer service hotline & email.<br>• Search bar placeholder, cart counter, and wishlist count. |
| **`frontend/src/components/common/Navigation.jsx`** | Primary navigation menu | • Main navigation links (Home, Categories, Latest, Deals, Contact).<br>• Dropdown category menus. |
| **`frontend/src/components/common/CategoryStrip.jsx`** | Circular category strip | • Rounded category shortcuts (Resin Art, DIY Kits, Candles, etc.). |
| **`frontend/src/components/common/Footer.jsx`** | Page footer | • Brand bio, copyright statement, social media links, and Admin Panel navigation link. |

### B. Homepage Sections (in sequence of display)

Mounted sequentially in `frontend/src/App.jsx`:

1. **`frontend/src/components/home/HeroBanner.jsx`**: Auto-sliding carousel banners, promotional badges, and action buttons.
2. **`frontend/src/components/home/ValueProps.jsx`**: 4 Trust badges (Free Express Shipping, 100% Authentic, Secure Checkout, 24/7 Support).
3. **`frontend/src/components/home/CategorySlider.jsx`**: Visual category slider tiles.
4. **`frontend/src/components/home/LatestProducts.jsx`**: Fresh arrivals grid featuring newly launched products (e.g., Coastal Tray).
5. **`frontend/src/components/home/FeaturedProducts.jsx`**: Curated star products grid.
6. **`frontend/src/components/home/DealCountdown.jsx`**: Deal of the Day live countdown timer and coupon codes.
7. **`frontend/src/components/home/PhilosophySection.jsx`**: Artisan craftsmanship statement and photography.
8. **`frontend/src/components/home/ReviewsSection.jsx`**: Customer reviews, 5-star ratings, and buyer testimonials.

---

## 🛍️ 4. Product Display & 6-Angle Gallery

| File Path | Description | Customization Scope |
| :--- | :--- | :--- |
| **`frontend/src/components/product/ProductDetailModal.jsx`** | Full product detail modal | • **6-Angle Gallery**: Primary high-resolution preview with 6 angle thumbnails below.<br>• **Sale Badge**: Circular promotional badge.<br>• **Pricing Row**: Original strike-through MRP and green selling price.<br>• **Color Swatches**: Clickable color selection.<br>• **Quantity Counter**: `[-] 1 [+]` counter, Add to Cart, and Buy Now.<br>• **Specifications**: SKU, Categories, Subcategories, Tags, Material, Dimensions, and Care. |
| **`frontend/src/components/product/ProductCard.jsx`** | Catalog card | • Product card image, Assured badge, discount badge, wishlist heart, and Quick View trigger. |
| **`frontend/src/components/product/CategoryView.jsx`** | Filtered category page | • Filtering and sorting view by price, rating, and newness. |

---

## ⚙️ 5. Admin Panel Architecture

All admin features are housed within **`frontend/src/components/admin/AdminLayout.jsx`**:

- **PIN Authentication**: Secure login with default PIN `2570`.
- **6-Angle Photo Slots**: Manage perspectives (Front, 45° Side, Rim & Edge, Rear Base, Variant 1, Variant 2) with instant upload or URL paste.
- **Client-Side Image Compression**: Automatically compresses uploaded photos to high-performance WebP/JPEG under 60KB to prevent browser storage limits.
- **Product Management**: Direct addition to "Our Latest Products" with validation for Title and Price.
- **Banners, Categories & Coupons**: Real-time management of storefront banners, category taxonomy, and promotional coupons.

---

## 📦 6. Data Storage & JSON Files

| File Path | Data Type | Description |
| :--- | :--- | :--- |
| **`backend/data/products.json`** | Products Database | Main product catalog with 6-angle image paths, prices, inventory, and descriptions. |
| **`backend/data/categories.json`** | Categories Database | Category catalog taxonomy. |
| **`backend/data/banners.json`** | Banners Database | Hero banner slides, titles, and links. |
| **`backend/data/coupons.json`** | Coupons Database | Active promotional coupon codes. |
| **`frontend/src/data/initialData.js`** | Offline Fallback Seed | Default seed data ensuring full functionality even in standalone client environments. |

---

## ⚡ 7. Quick Reference: "How do I change X?"

| Objective | File to Open | Instructions |
| :--- | :--- | :--- |
| **Change Brand Accent Color** | `frontend/src/style.css` | Search for `--color-primary` and replace `#FF5B7F` with your desired hex code. |
| **Modify Login Popup Delay** | `frontend/src/App.jsx` | Locate the timeout threshold (e.g., `10000` ms) and adjust as needed. |
| **Change Admin Access PIN** | `backend/routes/admin.js` | Update PIN from `2570` to your desired 4-digit code. |
| **Add Product Manually to JSON** | `backend/data/products.json` | Add a new product object to the top of the array. |
| **Update Latest Products Heading** | `frontend/src/components/home/LatestProducts.jsx` | Edit title or subtitle JSX text strings. |
| **Update Footer Contact Info** | `frontend/src/components/common/Footer.jsx` | Update phone numbers, email addresses, and social handles. |

---

## 🚀 8. Running the Application

```bash
# 1. Run both frontend and backend concurrently:
npm run dev

# 2. Run backend API only:
cd backend
npm start

# 3. Run frontend development server only:
cd frontend
npm run dev

# 4. Build frontend for production:
cd frontend
npm run build
```

- **Storefront**: `http://localhost:5173/`
- **Admin Back Panel**: `http://localhost:5173/#admin` (Default PIN: `2570`)
