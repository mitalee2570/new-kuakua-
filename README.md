# PRETUTE - Premium E-Commerce Platform

This project has been converted into a full-stack **React** application with separate **`backend/`** and **`frontend/`** folders, maintaining 100% of the original visual design, styles (`style.css` and `admin.css`), and functionality.

> 📖 **Code Structure & File Editing Guide**: See [CODE_STRUCTURE_GUIDE.md](file:///d:/PRETUTE-Premium-E-Commerce-Platform/CODE_STRUCTURE_GUIDE.md) for detailed descriptions of all CSS, HTML/JSX components, Admin Panel workflows, Products, and Backend services.

---

## 📁 Project Structure

```
PRETUTE-Premium-E-Commerce-Platform/
├── backend/                  # Node.js + Express REST API Server
│   ├── data/                 # JSON file-based database store
│   │   ├── products.json
│   │   ├── categories.json
│   │   ├── banners.json
│   │   ├── orders.json
│   │   ├── coupons.json
│   │   ├── messages.json
│   │   ├── settings.json
│   │   └── customers.json
│   ├── routes/               # API endpoints
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── banners.js
│   │   ├── orders.js
│   │   ├── coupons.js
│   │   ├── messages.js
│   │   ├── settings.js
│   │   ├── customers.js
│   │   └── admin.js
│   ├── public/assets/        # Media assets
│   ├── server.js             # Express Server
│   ├── package.json
│   └── .env
│
├── frontend/                 # Modern React + Vite Application
│   ├── public/assets/        # Original product images & banners
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Header, Navigation, Footer, Toast, Modals
│   │   │   ├── home/         # HeroBanner, CategorySlider, FeaturedProducts, DealCountdown
│   │   │   ├── product/      # ProductCard, CategoryView, ProductDetailModal
│   │   │   ├── cart/         # CartDrawer
│   │   │   ├── checkout/     # CheckoutModal
│   │   │   ├── wishlist/     # WishlistView
│   │   │   ├── customer/     # AuthModal, ProfileModal, OrdersModal
│   │   │   └── admin/        # AdminLayout, Dashboard, Banners, Products, Orders, etc.
│   │   ├── context/
│   │   │   └── StoreContext.jsx # Global State Management
│   │   ├── services/
│   │   │   └── api.js        # API Client for Backend
│   │   ├── style.css         # Original Storefront Stylesheet
│   │   ├── admin.css         # Original Admin Panel Stylesheet
│   │   ├── App.jsx           # Main React App with routing
│   │   └── main.jsx
│   ├── index.html            # Google Fonts & Font Awesome CDN
│   ├── vite.config.js
│   └── package.json
│
└── package.json              # Root scripts
```

---

## 🚀 How to Run the Project

### 1. Start the Backend API Server:
```bash
cd backend
npm install
npm run dev
# or: node server.js
```
The Backend server runs at `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Products API: `http://localhost:5000/api/products`

### 2. Start the Frontend React App:
```bash
cd frontend
npm install
npm run dev
```
The Frontend app opens at `http://localhost:5173/`

---

## 🔐 Credentials

- **Admin Back Panel**: Navigate to `http://localhost:5173/#admin` (or click "Admin Back Panel" in the account menu)
  - Default PIN: `1234`
  - Default Password: `admin123`
- **Demo Customer Account**:
  - Name: `Mitalee Maurya`
  - Email: `mitaleemaurya@gmail.com`
  - Phone: `8757201351`
  - Password: `password123`

---

## 🍃 MongoDB Integration & User Login Logs

User data and authentication logs are managed with **MongoDB & Mongoose**:

- **Database Models**:
  - `User`: Handles registration, profile, address, and credentials.
  - `UserLog`: Tracks all user activity: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `REGISTER`, and `PROFILE_UPDATE` with IP address, user agent, and timestamp.
- **Connection**:
  Configure your MongoDB URI in `backend/.env`:
  ```env
  MONGODB_URI=mongodb://127.0.0.1:27017/pretute_ecommerce
  # Or MongoDB Atlas:
  # MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pretute_ecommerce
  ```
- **Audit Logs API Endpoint**:
  - `GET http://localhost:5000/api/customers/logs` (Retrieve recent user login and activity audit trail).

