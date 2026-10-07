import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import ProductCard from './ProductCard';

const CategoryView = () => {
  const { products, categories, activeCategorySlug, navigateTo } = useStore();

  const [sortBy, setSortBy] = useState('popularity');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [minDiscount, setMinDiscount] = useState(0);
  const [assuredOnly, setAssuredOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const currentCategory = categories.find(c => c.slug === activeCategorySlug);
  const categoryTitle = currentCategory ? currentCategory.name : (activeCategorySlug && activeCategorySlug !== 'all' ? activeCategorySlug.replace(/-/g, ' ').toUpperCase() : 'All Collections');
  const categoryDesc = currentCategory ? currentCategory.description : 'Explore our premium handpicked collection';

  const clearAllFilters = () => {
    setMinRating(0);
    setMaxPrice(15000);
    setMinDiscount(0);
    setAssuredOnly(false);
    setInStockOnly(false);
    setSortBy('popularity');
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = (products || []).filter(p => {
      if (!p || p.status === 'deactivated') return false;
      if (activeCategorySlug && activeCategorySlug !== 'all') {
        if (p.category !== activeCategorySlug) return false;
      }
      if (p.price > maxPrice) return false;
      if (minRating > 0 && (p.rating || 4.5) < minRating) return false;
      if (minDiscount > 0 && (p.discount || 15) < minDiscount) return false;
      if (inStockOnly && (p.stockStatus === 'out_of_stock' || p.stock <= 0)) return false;
      return true;
    });

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [products, activeCategorySlug, maxPrice, minRating, minDiscount, inStockOnly, sortBy]);

  return (
    <div className="section-container fk-category-page-container" style={{ padding: '24px 20px 48px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.82rem', color: '#878787', marginBottom: '16px' }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} style={{ color: '#2874f0', textDecoration: 'none' }}>Home</a>
        <span style={{ margin: '0 8px' }}>&gt;</span>
        <span style={{ color: '#212121', fontWeight: 600 }}>{categoryTitle}</span>
      </div>

      {/* Mobile Filter Trigger Button */}
      <div className="fk-mobile-filter-trigger" style={{ display: 'none', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#212121' }}
        >
          <i className="fa-solid fa-filter"></i> Filter Products
        </button>
      </div>

      {/* Flipkart 2-Column Catalog Layout */}
      <div className="fk-catalog-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Filter Sidebar */}
        <aside className={`fk-filter-sidebar ${mobileFilterOpen ? 'open-mobile' : ''}`} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {/* Filter Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#212121', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Filters
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              style={{ background: 'none', border: 'none', color: '#2874f0', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
            >
              CLEAR ALL
            </button>
          </div>

          {/* Categories Tree */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#878787', textTransform: 'uppercase', marginBottom: '10px' }}>
              Categories
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              <a
                href="#category/all"
                onClick={(e) => { e.preventDefault(); navigateTo('category', 'all'); }}
                style={{
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  color: (!activeCategorySlug || activeCategorySlug === 'all') ? '#2874f0' : '#212121',
                  fontWeight: (!activeCategorySlug || activeCategorySlug === 'all') ? 700 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {(!activeCategorySlug || activeCategorySlug === 'all') && <i className="fa-solid fa-angle-right" style={{ fontSize: '0.7rem' }}></i>}
                All Collections
              </a>
              {(categories || []).filter(c => c && c.status !== 'deactivated').map(cat => (
                <a
                  key={cat.id}
                  href={`#category/${cat.slug}`}
                  onClick={(e) => { e.preventDefault(); navigateTo('category', cat.slug); }}
                  style={{
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    color: activeCategorySlug === cat.slug ? '#2874f0' : '#212121',
                    fontWeight: activeCategorySlug === cat.slug ? 700 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {activeCategorySlug === cat.slug && <i className="fa-solid fa-angle-right" style={{ fontSize: '0.7rem' }}></i>}
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          {/* Flipkart Assured Filter */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={assuredOnly}
                onChange={(e) => setAssuredOnly(e.target.checked)}
              />
              <span className="fk-assured-tag-mini">
                <span className="fk-f">F</span>-Assured <i className="fa-solid fa-check"></i>
              </span>
            </label>
          </div>

          {/* Price Range Filter */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#878787', textTransform: 'uppercase', marginBottom: '10px' }}>
              Price Range
            </div>
            <input
              type="range"
              min="500"
              max="15000"
              step="200"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#2874f0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
              <span>₹500</span>
              <span style={{ fontWeight: 700, color: '#2874f0' }}>Max ₹{maxPrice.toLocaleString()}</span>
            </div>
            {/* Quick Price Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              {[1000, 2000, 5000, 15000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMaxPrice(val)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: maxPrice === val ? '#2874f0' : '#e2e8f0',
                    background: maxPrice === val ? '#f0f5ff' : '#fff',
                    color: maxPrice === val ? '#2874f0' : '#212121',
                    cursor: 'pointer'
                  }}
                >
                  {val === 15000 ? 'All' : `Under ₹${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Ratings Filter */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#878787', textTransform: 'uppercase', marginBottom: '10px' }}>
              Customer Ratings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              {[
                { label: '4★ & above', val: 4 },
                { label: '3★ & above', val: 3 },
                { label: 'All Ratings', val: 0 }
              ].map(opt => (
                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#212121' }}>
                  <input
                    type="radio"
                    name="ratingFilter"
                    checked={minRating === opt.val}
                    onChange={() => setMinRating(opt.val)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Discount Filter */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#878787', textTransform: 'uppercase', marginBottom: '10px' }}>
              Discount
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              {[
                { label: '50% or more', val: 50 },
                { label: '30% or more', val: 30 },
                { label: '20% or more', val: 20 },
                { label: 'All Discounts', val: 0 }
              ].map(opt => (
                <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#212121' }}>
                  <input
                    type="radio"
                    name="discountFilter"
                    checked={minDiscount === opt.val}
                    onChange={() => setMinDiscount(opt.val)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div style={{ padding: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#212121' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>Exclude Out of Stock</span>
            </label>
          </div>

          {/* Close mobile filters button */}
          {mobileFilterOpen && (
            <div style={{ padding: '16px', background: '#f8fafc' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setMobileFilterOpen(false)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px' }}
              >
                Apply Filters
              </button>
            </div>
          )}
        </aside>

        {/* Right Content Area: Sort Bar & Products Grid */}
        <div className="fk-catalog-content">
          {/* Header & Sort Bar */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '6px', padding: '14px 18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#212121', margin: 0 }}>
                  {categoryTitle}
                </h1>
                <span style={{ fontSize: '0.8rem', color: '#878787' }}>
                  (Showing 1 – {filteredProducts.length} of {products.length} products)
                </span>
              </div>
            </div>

            {/* Flipkart Horizontal Sort Bar */}
            <div className="fk-sort-bar" style={{ display: 'flex', alignItems: 'center', gap: '18px', borderTop: '1px solid #f0f0f0', paddingTop: '10px', overflowX: 'auto' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#212121', whiteSpace: 'nowrap' }}>
                Sort By
              </span>
              {[
                { id: 'popularity', label: 'Popularity' },
                { id: 'price-low', label: 'Price -- Low to High' },
                { id: 'price-high', label: 'Price -- High to Low' },
                { id: 'newest', label: 'Newest First' },
                { id: 'discount', label: 'Discount' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSortBy(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: sortBy === tab.id ? '2px solid #2874f0' : '2px solid transparent',
                    padding: '6px 2px',
                    fontSize: '0.85rem',
                    fontWeight: sortBy === tab.id ? 700 : 500,
                    color: sortBy === tab.id ? '#2874f0' : '#212121',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '14px' }}></i>
              <h3 style={{ color: '#212121', margin: '0 0 6px 0' }}>No products found matching your filters</h3>
              <p style={{ color: '#878787', fontSize: '0.88rem' }}>Try clearing filters or selecting another category.</p>
              <button
                type="button"
                onClick={clearAllFilters}
                style={{ marginTop: '12px', background: '#2874f0', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryView;
