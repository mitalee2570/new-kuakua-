import React from 'react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../product/ProductCard';

const LatestProducts = () => {
  const { products } = useStore();

  // Sort products to display the newest arrivals first
  const latestProducts = [...products]
    .filter(p => p.status !== 'deactivated')
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (typeof a.id === 'number' && a.id > 100000 ? a.id : 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (typeof b.id === 'number' && b.id > 100000 ? b.id : 0);
      return timeB - timeA;
    })
    .slice(0, 16); // Display up to 16 latest items

  if (latestProducts.length === 0) return null;

  return (
    <section className="latest-products-section" id="latestProductsSection" style={{ padding: '42px 0 36px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
      <div className="section-container">
        {/* Header */}
        <div
          className="section-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '26px'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 91, 127, 0.1)',
                color: 'var(--color-primary, #FF5B7F)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '8px'
              }}
            >
              <i className="fa-solid fa-sparkles"></i>
              Fresh Arrivals &amp; New Launches
            </div>
            <h2
              className="section-title"
              style={{
                margin: 0,
                fontSize: '1.9rem',
                fontWeight: 800,
                color: '#1A253C'
              }}
            >
              Our Latest Products
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '6px 0 0 0' }}>
              Explore our freshly crafted artisan collections, décor accents and newly added boutique gifts
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('homeProductsGrid');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1.5px solid var(--color-primary, #FF5B7F)',
              background: '#ffffff',
              color: 'var(--color-primary, #FF5B7F)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary, #FF5B7F)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = 'var(--color-primary, #FF5B7F)';
            }}
          >
            <span>View All Collections</span>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
          </button>
        </div>

        {/* Products Grid */}
        <div className="products-grid" id="latestProductsGrid">
          {latestProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;
