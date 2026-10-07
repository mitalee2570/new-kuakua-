import React, { useEffect, useRef } from 'react';
import { useStore } from './context/StoreContext';

// Common Components
import Header from './components/common/Header';
import Navigation from './components/common/Navigation';
import Footer from './components/common/Footer';
import ToastContainer from './components/common/ToastContainer';
import RefundPolicyModal from './components/common/RefundPolicyModal';
import CategoryStrip from './components/common/CategoryStrip';
import ErrorBoundary from './components/common/ErrorBoundary';

// Home Components
import HeroBanner from './components/home/HeroBanner';
import ValueProps from './components/home/ValueProps';
import CategorySlider from './components/home/CategorySlider';
import LatestProducts from './components/home/LatestProducts';
import DealCountdown from './components/home/DealCountdown';
import FeaturedProducts from './components/home/FeaturedProducts';
import PhilosophySection from './components/home/PhilosophySection';
import ReviewsSection from './components/home/ReviewsSection';

// Product & Category Components
import CategoryView from './components/product/CategoryView';
import ProductDetailModal from './components/product/ProductDetailModal';

// Contact Component
import ContactView from './components/contact/ContactView';

// Cart & Wishlist & Checkout
import CartDrawer from './components/cart/CartDrawer';
import CheckoutModal from './components/checkout/CheckoutModal';
import WishlistView from './components/wishlist/WishlistView';

// Customer Components & Modals
import CustomerAuthModal from './components/customer/CustomerAuthModal';
import CustomerProfileModal from './components/customer/CustomerProfileModal';
import CustomerOrdersModal from './components/customer/CustomerOrdersModal';
import ProfileView from './components/customer/ProfileView';

// Admin
import AdminLayout from './components/admin/AdminLayout';

function App() {
  const {
    currentView,
    activeProductId,
    products,
    quickViewProduct,
    setQuickViewProduct,
    customer,
    setAuthModalState
  } = useStore();

  // 10-second timer: automatically prompts visitor to log in after 10 seconds of browsing
  useEffect(() => {
    if (customer) return;

    const timer = setTimeout(() => {
      const isAdminView = window.location.pathname.includes('/admin') || window.location.hash.includes('#admin');
      if (!customer && !isAdminView) {
        setAuthModalState('signin');
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [customer, setAuthModalState]);

  // If in Admin view, render full admin dashboard
  if (currentView === 'admin') {
    return (
      <div className="admin-app-root">
        <AdminLayout />
        <ToastContainer />
      </div>
    );
  }

  const selectedProduct = (products || []).find(p => p && p.id === activeProductId);

  return (
    <div className="storefront-app-root">
      {/* Sticky Header & Navigation & Flipkart Category Strip */}
      <Header />
      <Navigation />
      <CategoryStrip />

      {/* Main View Router */}
      <main className="main-content" id="mainContent">
        <ErrorBoundary>
          {currentView === 'home' && (
            <div id="homeView" className="page-view active" style={{ display: 'block' }}>
              <HeroBanner />
              <ValueProps />
              <CategorySlider />
              <LatestProducts />
              <FeaturedProducts />
              <DealCountdown />
              <PhilosophySection />
              <ReviewsSection />
            </div>
          )}

          {currentView === 'category' && (
            <div id="categoryView" className="page-view active" style={{ display: 'block' }}>
              <CategoryView />
            </div>
          )}

          {currentView === 'details' && (
            <div id="detailsView" className="page-view active" style={{ display: 'block', padding: '40px 20px' }}>
              <ProductDetailModal product={selectedProduct} isModal={false} />
            </div>
          )}

          {currentView === 'wishlist' && (
            <div id="wishlistView" className="page-view active" style={{ display: 'block' }}>
              <WishlistView />
            </div>
          )}

          {currentView === 'contact' && (
            <div id="contactView" className="page-view active" style={{ display: 'block' }}>
              <ContactView />
            </div>
          )}

          {currentView === 'profile' && (
            <div id="profileView" className="page-view active" style={{ display: 'block' }}>
              <ProfileView initialTab="profile" />
            </div>
          )}

          {currentView === 'orders' && (
            <div id="ordersView" className="page-view active" style={{ display: 'block' }}>
              <ProfileView initialTab="orders" />
            </div>
          )}

          {currentView === 'addresses' && (
            <div id="addressesView" className="page-view active" style={{ display: 'block' }}>
              <ProfileView initialTab="addresses" />
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer />

      {/* Slide-out Cart Drawer */}
      <CartDrawer />

      {/* Checkout Modal */}
      <CheckoutModal />

      {/* Customer Modals */}
      <CustomerAuthModal />
      <CustomerProfileModal />
      <CustomerOrdersModal />
      <RefundPolicyModal />

      {/* Quick View Product Modal */}
      {quickViewProduct && (
        <ProductDetailModal
          product={quickViewProduct}
          isModal={true}
          onClose={() => setQuickViewProduct(null)}
        />
      )}


      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
