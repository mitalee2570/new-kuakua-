import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAssetUrl } from '../../utils/imageUrl';

const Header = () => {
  const {
    settings,
    customer,
    cartTotalItems,
    wishlist,
    setCartDrawerOpen,
    setAuthModalState,
    setProfileModalOpen,
    setOrdersModalOpen,
    setRefundPolicyModalOpen,
    products,
    navigateTo,
    logoutCustomer,
    currentView
  } = useStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchRef = useRef(null);

  // Scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search suggestions logic
  useEffect(() => {
    if (searchVal.trim().length >= 2) {
      const q = searchVal.toLowerCase();
      const filtered = (products || []).filter(p =>
        p && (
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
          (p.shortDesc && p.shortDesc.toLowerCase().includes(q))
        )
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchVal, products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setShowSuggestions(false);
      // Navigate or scroll to matching product
      if (suggestions.length > 0) {
        navigateTo('details', suggestions[0].id);
      }
    }
  };

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    if (sectionId === 'home') {
      navigateTo('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (sectionId === 'contact') {
      navigateTo('contact');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentView !== 'home') {
      navigateTo('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`main-header ${isScrolled ? 'scrolled sticky' : ''}`} id="mainHeader">
      {/* Top Announcement Bar */}
      {settings.announcementActive && (
        <div className="header-top">
          <p dangerouslySetInnerHTML={{ __html: settings.announcementText }} />
        </div>
      )}

      <div className="header-container">
        {/* Left Side: Kuakua Logo */}
        <div className="header-left">
          {/* Mobile Menu Toggle */}
          <button
            className="mobile-nav-toggle"
            id="mobileNavToggle"
            aria-label="Toggle Menu"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('toggle-mobile-menu'));
              setMobileMenuOpen(!mobileMenuOpen);
            }}
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>

          {/* Brand Logo Container */}
          <a
            href="#home"
            className="logo-container"
            id="logoLink"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <img
              src={getAssetUrl('assets/kuakua-logo.png')}
              alt="Kua Kua Crafts"
              className="brand-logo"
              id="brandLogoKuaKua"
            />
          </a>
        </div>

        {/* Right Side: Header Nav Links (Right-aligned next to search), Search Bar & Account Utilities */}
        <div className="header-right">
          {/* Header Navigation Links - Right-aligned next to Search */}
          <nav className="header-nav-links" aria-label="Main Navigation">
            <a
              href="#home"
              className={`header-nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'home')}
            >
              Home
            </a>
            <a
              href="#services"
              className="header-nav-link"
              onClick={(e) => handleNavClick(e, 'services')}
            >
              Services
            </a>
            <a
              href="#about"
              className="header-nav-link"
              onClick={(e) => handleNavClick(e, 'about')}
            >
              About
            </a>
            <a
              href="#reviews"
              className="header-nav-link"
              onClick={(e) => handleNavClick(e, 'reviews')}
            >
              Reviews
            </a>
            <a
              href="#why-us"
              className="header-nav-link"
              onClick={(e) => handleNavClick(e, 'why-us')}
            >
              Why Us
            </a>
            <a
              href="#contact"
              className={`header-nav-link ${currentView === 'contact' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'contact')}
            >
              Contact
            </a>
          </nav>

          {/* Search Area - Beside Header Navigation Links */}
          <div className="search-wrapper" ref={searchRef}>
            <form className="search-form" id="searchForm" onSubmit={handleSearchSubmit} autoComplete="off">
              <input
                type="text"
                id="searchInput"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search toys, clothes, crafts..."
                aria-label="Search"
              />
              <button type="submit" className="search-btn" aria-label="Submit Search">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>

            {/* Dynamic Search Suggestions Popup */}
            {showSuggestions && (
              <div className="search-suggestions active" id="searchSuggestions" style={{ display: 'block' }}>
                {suggestions.length > 0 ? (
                  suggestions.map((p) => (
                    <div
                      key={p.id}
                      className="suggestion-item"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f5' }}
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchVal('');
                        navigateTo('details', p.id);
                      }}
                    >
                      <img
                        src={getAssetUrl(p.image)}
                        alt={p.title}
                        style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1A253C' }}>{p.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#888' }}>
                          {p.categoryLabel} • ₹{p.price}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '14px', textAlign: 'center', color: '#777', fontSize: '0.85rem' }}>
                    No products found for "{searchVal}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Utility Icons */}
          <div className="header-utilities">
          {/* User Account / Profile Button (Direct Navigation) */}
          <div className="utility-item" id="userAccountWrapper">
            <button
              className="utility-btn user-profile-btn"
              id="userMenuBtn"
              aria-label={customer ? `${customer.name}'s Profile` : 'Sign In / Profile'}
              type="button"
              onClick={() => {
                if (customer) {
                  navigateTo('profile');
                } else {
                  setAuthModalState('signin');
                }
              }}
            >
              <span className="profile-squircle-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" ry="5.5"></rect>
                  <circle cx="12" cy="9.5" r="3"></circle>
                  <path d="M6.5 18c0-3 2.4-4.8 5.5-4.8s5.5 1.8 5.5 4.8"></path>
                </svg>
              </span>
              <span className="utility-label" id="userAccountLabel">
                {customer ? (customer.name.split(' ')[0] || 'Profile') : 'Sign In'}
              </span>
            </button>
          </div>

          {/* Wishlist Icon */}
          <a
            href="#wishlist"
            className="utility-item"
            id="wishlistIconBtn"
            aria-label="Wishlist"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('wishlist');
            }}
          >
            <div className="icon-badge-wrapper">
              <i className="fa-regular fa-heart"></i>
              <span className="badge" id="wishlistBadge">
                {wishlist.length}
              </span>
            </div>
            <span className="utility-label">Wishlist</span>
          </a>

          {/* Cart Icon & Trigger */}
          <button
            className="utility-item cart-trigger-btn"
            id="cartToggleBtn"
            aria-label="Shopping Cart"
            type="button"
            onClick={() => setCartDrawerOpen(true)}
          >
            <div className="icon-badge-wrapper">
              <i className="fa-solid fa-bag-shopping"></i>
              <span className="badge" id="cartBadge">
                {cartTotalItems}
              </span>
            </div>
            <div className="cart-text">
              <span className="utility-label">Bag</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </header>
);
};

export default Header;
