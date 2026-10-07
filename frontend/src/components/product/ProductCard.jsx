import React from 'react';
import { useStore } from '../../context/StoreContext';
import { getAssetUrl } from '../../utils/imageUrl';

const ProductCard = ({ product }) => {
  const { addToCart, buyNow, toggleWishlist, isInWishlist, setQuickViewProduct, navigateTo } = useStore();

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stockStatus === 'out_of_stock' || product.stock <= 0;
  const imgSrc = getAssetUrl(product.image);

  // Calculate discount percentage if not explicitly provided
  const discountPercent = product.discount || (product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 15);

  const originalPrice = product.originalPrice || Math.round(product.price * 1.25);

  return (
    <div className={`product-card fk-product-card ${isOutOfStock ? 'out-of-stock' : ''}`} data-id={product.id}>
      {/* Product Badges */}
      <div className="product-badges-container" style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {product.badge && (
          <span className="prod-badge" style={{ background: '#2874f0', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
            {product.badge}
          </span>
        )}
        {discountPercent > 0 && (
          <span className="discount-badge" style={{ background: '#388e3c', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        type="button"
        className={`wishlist-heart-btn ${isFavorited ? 'favorited' : ''}`}
        aria-label="Add to Wishlist"
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
        }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 3,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #f1f5f9',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <i
          className={`${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart`}
          style={{ color: isFavorited ? '#FF5B7F' : '#94a3b8', fontSize: '1rem' }}
        ></i>
      </button>

      {/* Image Container with Quick View Button */}
      <div
        className="prod-image-wrapper"
        onClick={() => navigateTo('details', product.id)}
      >
        <img
          src={imgSrc}
          alt={product.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '14px', transition: 'transform 0.4s ease' }}
        />
        <button
          type="button"
          className="quick-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            setQuickViewProduct(product);
          }}
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 41, 59, 0.9)',
            color: '#fff',
            border: 'none',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <i className="fa-regular fa-eye"></i> Quick View
        </button>
      </div>

      {/* Product Details */}
      <div className="prod-info" style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="prod-category" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            {product.categoryLabel || product.category}
          </span>
          {/* Flipkart Assured Badge */}
          <span className="fk-assured-tag-mini">
            <span className="fk-f">F</span>-Assured <i className="fa-solid fa-check"></i>
          </span>
        </div>

        <h3
          className="prod-title"
          onClick={() => navigateTo('details', product.id)}
          style={{ fontSize: '0.98rem', fontWeight: 600, color: '#0f172a', margin: '4px 0 8px 0', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Rating Pill Row (Flipkart style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="fk-rating-pill">
            {product.rating || '4.8'} <i className="fa-solid fa-star"></i>
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
            ({product.reviewsCount || 42})
          </span>
        </div>

        {/* Flipkart Pricing Layout */}
        <div className="fk-card-price-row" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{product.price.toLocaleString()}
          </span>
          {originalPrice > product.price && (
            <span style={{ fontSize: '0.88rem', color: '#878787', textDecoration: 'line-through' }}>
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
          {discountPercent > 0 && (
            <span style={{ fontSize: '0.84rem', color: '#388e3c', fontWeight: 700 }}>
              {discountPercent}% off
            </span>
          )}
        </div>

        {/* Action Buttons: Add to Cart & Buy Now */}
        <div className="fk-card-action-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className="btn fk-card-add-btn"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) addToCart(product, product.sizes?.[0] || 'Standard', 1);
            }}
            style={{
              padding: '9px 8px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              background: isOutOfStock ? '#cbd5e1' : '#ffd814',
              border: '1px solid #fcd200',
              color: '#0f1111',
              boxShadow: '0 1px 3px rgba(213,217,217,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <i className="fa-solid fa-cart-shopping"></i> Add
          </button>

          <button
            type="button"
            className="btn fk-card-buy-btn"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) buyNow(product, product.sizes?.[0] || 'Standard', 1);
            }}
            style={{
              padding: '9px 8px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              background: isOutOfStock ? '#cbd5e1' : '#ffa41c',
              border: '1px solid #ff8f00',
              color: '#0f1111',
              boxShadow: '0 1px 3px rgba(213,217,217,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <i className="fa-solid fa-bolt"></i> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
