import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../product/ProductCard';

const FeaturedProducts = () => {
  const { products, categories, navigateTo } = useStore();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterTabs = [
    { key: 'all', label: 'All Items' },
    { key: 'diy-kit', label: 'Art & Craft Materials' },
    { key: 'resin-art', label: 'Resin Art' },
    { key: 'baby-fashion', label: 'Baby Wear' },
    { key: 'wooden-toys', label: 'Montessori' },
    { key: 'maternity', label: 'Maternity' }
  ];

  const filteredProducts = (products || []).filter(p => {
    if (!p || p.status === 'deactivated') return false;
    if (selectedFilter === 'all') return true;
    return p.category === selectedFilter;
  });

  return (
    <div className="category-showcase-section">
      <div className="section-container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Featured Collections</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Handpicked boutique essentials and artisan lifestyle accents</p>
          </div>

          {/* Filter Pills */}
          <div className="filter-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`filter-tab-btn ${selectedFilter === tab.key ? 'active' : ''}`}
                onClick={() => setSelectedFilter(tab.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedFilter === tab.key ? 'var(--color-primary)' : '#e2e8f0',
                  background: selectedFilter === tab.key ? 'var(--color-primary)' : '#fff',
                  color: selectedFilter === tab.key ? '#fff' : '#1A253C',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid" id="homeProductsGrid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
            <h3>No products found in this category</h3>
            <p>Check back later or browse other collections.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;
