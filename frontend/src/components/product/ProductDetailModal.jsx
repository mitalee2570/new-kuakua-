import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAssetUrl } from '../../utils/imageUrl';

const ProductDetailModal = ({ product, isModal = true, onClose = null }) => {
  const { addToCart, buyNow, toggleWishlist, isInWishlist, products, navigateTo } = useStore();

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('desc'); // 'desc' | 'specs' | 'reviews'

  // Default color palette from WordPress Coastal Tray if not specified in product
  const defaultColors = [
    { name: 'Blue', hex: '#2B7CD3', imgIndex: 4 },
    { name: 'Cream', hex: '#FFFDF0', imgIndex: 2 },
    { name: 'Green', hex: '#7CC04B', imgIndex: 0 },
    { name: 'Orange', hex: '#E58A32', imgIndex: 0 },
    { name: 'Red', hex: '#DE3B3B', imgIndex: 1 },
    { name: 'Yellow', hex: '#F5E63E', imgIndex: 5 }
  ];

  const colorPalette = (product?.colors && product.colors.length > 0)
    ? product.colors.map((c, idx) => typeof c === 'object' ? c : { name: c, hex: c.startsWith('#') ? c : '#E58A32', imgIndex: idx % 6 })
    : defaultColors;

  useEffect(() => {
    if (product) {
      setActiveImgIndex(0);
      setSelectedColor(colorPalette[3] || colorPalette[0]); // default to Orange or first
      setSelectedSize(product.sizes?.[0] || 'Standard');
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stockStatus === 'out_of_stock' || product.stock <= 0;

  // Build images list with up to 6 angles
  const imageList = (product.images && product.images.length > 0)
    ? product.images.slice(0, 6)
    : [product.image];

  const currentImage = imageList[activeImgIndex] || product.image;
  const imgSrc = getAssetUrl(currentImage);

  const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
  const discountPercent = product.discount || (originalPrice > product.price
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 26);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, quantity);
    if (isModal && onClose) onClose();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (isModal && onClose) onClose();
    buyNow(product, selectedSize, quantity);
  };

  // Related products from same category
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.categoryLabel === product.categoryLabel))
    .slice(0, 4);

  const content = (
    <div className="wordpress-pdp-container">
      {/* Top 2-Column Product Layout */}
      <div className="wordpress-pdp-main">
        {/* LEFT COLUMN: Gallery with Main Image & Up to 6 Thumbnails */}
        <div className="pdp-gallery-column">
          {/* Main Large Image Box */}
          <div className="pdp-main-image-box">
            {/* Round SALE! Badge with Kua Kua Logo Icon */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 3,
                background: '#ffffff',
                border: '1.5px solid #a7f3d0',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
              }}
            >
              <span
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  textTransform: 'uppercase',
                  marginBottom: '2px',
                  letterSpacing: '0.5px'
                }}
              >
                SALE!
              </span>
              <img
                src={getAssetUrl('assets/kuakua-logo.png')}
                alt="KuaKua"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label="Save to Wishlist"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                zIndex: 3
              }}
            >
              <i
                className={`${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart`}
                style={{ color: isFavorited ? '#FF5B7F' : '#94a3b8', fontSize: '1.15rem' }}
              ></i>
            </button>

            {/* Main Image */}
            <img
              src={imgSrc}
              alt={product.title}
              style={{
                maxHeight: '88%',
                maxWidth: '88%',
                objectFit: 'contain',
                transition: 'transform 0.3s ease'
              }}
            />
          </div>

          {/* 6 Angle Thumbnail Gallery */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Multiple Angles &amp; Views ({imageList.length} Photos):</span>
              <span>Click any to zoom</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '8px'
              }}
            >
              {imageList.map((img, idx) => {
                const isActive = activeImgIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    style={{
                      aspectRatio: '1',
                      width: '100%',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: isActive ? 'var(--color-primary, #FF5B7F)' : '#e2e8f0',
                      padding: '4px',
                      background: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 0 0 2px rgba(255,91,127,0.25)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={getAssetUrl(img)}
                      alt={`Angle ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = 'assets/Logo.png'; }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Information & Purchase Details */}
        <div className="pdp-details-column">
          {/* Product Title */}
          <h1
            className="pdp-product-title"
          >
            {product.title}
          </h1>

          {/* Pricing Row matching Screenshot 1 */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '1.35rem',
                color: '#67e8f9',
                textDecoration: 'line-through',
                fontWeight: 600
              }}
            >
              ₹{originalPrice.toFixed(2)}
            </span>
            <span
              style={{
                fontSize: '2.1rem',
                color: '#22c55e',
                fontWeight: 800
              }}
            >
              ₹{product.price.toFixed(2)}
            </span>
            {discountPercent > 0 && (
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          {/* Short Description */}
          <p
            style={{
              fontSize: '0.94rem',
              lineHeight: 1.6,
              color: '#475569',
              margin: '0 0 24px 0'
            }}
          >
            {product.shortDesc ||
              "A beautifully designed starfish-inspired jewellery tray featuring a distinctive coastal shape, smooth glossy surface, and textured raised edges. Its playful yet elegant design adds a charming touch to any space."}
          </p>

          <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '22px' }}></div>

          {/* COLOUR SWATCHES Section matching Screenshot 1 */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#1A253C',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '10px'
              }}
            >
              COLOUR: {selectedColor?.name && <span style={{ fontWeight: 600, color: '#64748b' }}>{selectedColor.name}</span>}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {colorPalette.map((col, idx) => {
                const isSelected = selectedColor?.name === col.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedColor(col);
                      if (col.imgIndex !== undefined && imageList[col.imgIndex]) {
                        setActiveImgIndex(col.imgIndex);
                      }
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: col.hex,
                      border: isSelected ? '2px solid #000' : '1px solid #cbd5e1',
                      outline: isSelected ? '2px solid var(--color-primary, #FF5B7F)' : 'none',
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      transition: 'transform 0.15s ease'
                    }}
                    title={col.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Quantity Counter & Add To Cart Button */}
          <div className="pdp-actions-row">
            {/* Quantity Selector: [ - ] [ 1 ] [ + ] */}
            <div className="pdp-qty-selector">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                -
              </button>
              <span>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
              >
                +
              </button>
            </div>

            {/* ADD TO CART Button */}
            <button
              type="button"
              className="pdp-btn-cart"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <i className="fa-solid fa-cart-shopping" style={{ marginRight: '8px' }}></i>
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>

            {/* BUY NOW Button */}
            <button
              type="button"
              className="pdp-btn-buy"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '18px' }}></div>

          {/* Product Meta Section matching Screenshot 1 */}
          <div style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569' }}>
            <div>
              <strong style={{ color: '#1A253C' }}>SKU:</strong>{' '}
              <span style={{ color: '#64748b' }}>{product.sku || 'G118'}</span>
            </div>
            <div>
              <strong style={{ color: '#1A253C' }}>Categories:</strong>{' '}
              <span style={{ color: '#64748b' }}>
                {product.categoryLabel || product.category}, {product.subCategory || 'Gifts, Home Decor, Jewellery Jars & Trays'}
              </span>
            </div>
            <div>
              <strong style={{ color: '#1A253C' }}>Tags:</strong>{' '}
              <span style={{ color: '#64748b' }}>
                {Array.isArray(product.tags) && product.tags.length > 0
                  ? product.tags.join(', ')
                  : 'Corporate Gifts, Home Decor, Jewellery Jars & Trays'}
              </span>
            </div>
            <div>
              <strong style={{ color: '#1A253C' }}>Brand:</strong>{' '}
              <span style={{ color: '#64748b' }}>{product.brand || 'KuaKua Craft'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS SECTION: Description & Additional Information */}
      <div style={{ marginTop: '48px', borderTop: '1px solid #e2e8f0', paddingTop: '28px' }}>
        <div style={{ display: 'flex', gap: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
          {[
            { id: 'desc', label: 'Description' },
            { id: 'specs', label: 'Additional Information' },
            { id: 'reviews', label: `Reviews (${product.reviewsCount || 12})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: activeTab === tab.id ? 800 : 500,
                color: activeTab === tab.id ? 'var(--color-primary, #FF5B7F)' : '#64748b',
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '8px'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div style={{ position: 'absolute', bottom: '-14px', left: 0, right: 0, height: '3px', background: 'var(--color-primary, #FF5B7F)', borderRadius: '2px' }} />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'desc' && (
          <div style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.94rem' }}>
            <p>{product.longDesc || product.shortDesc || "Handcrafted with premium artisan materials, this tray adds an elegant charm to your home decor or vanity table."}</p>
            <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
              <li>Starfish-inspired organic contour styling</li>
              <li>Glossy durable ceramic finish with textured raised bead border</li>
              <li>Ideal for earrings, rings, necklaces, keys and vanity trinkets</li>
              <li>Safe packaging for worry-free delivery across India</li>
            </ul>
          </div>
        )}

        {activeTab === 'specs' && (
          <div style={{ color: '#475569', fontSize: '0.9rem' }}>
            <table style={{ width: '100%', maxWidth: '600px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', fontWeight: 600, color: '#1A253C' }}>SKU</td>
                  <td style={{ padding: '8px 0' }}>{product.sku || 'G118'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', fontWeight: 600, color: '#1A253C' }}>Dimensions</td>
                  <td style={{ padding: '8px 0' }}>15cm x 15cm x 3.5cm</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', fontWeight: 600, color: '#1A253C' }}>Material</td>
                  <td style={{ padding: '8px 0' }}>Fine Glazed Ceramic &amp; Beaded Border</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', fontWeight: 600, color: '#1A253C' }}>Weight</td>
                  <td style={{ padding: '8px 0' }}>320 grams</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1A253C' }}>5.0</div>
              <div>
                <div style={{ color: '#f59e0b', fontSize: '1rem' }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Based on verified customer orders</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
              <strong>"Stunning coastal tray!"</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Looked even more beautiful in person. The beaded pearl detail is pristine!</p>
            </div>
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '28px' }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '1.25rem', fontWeight: 800, color: '#1A253C' }}>
            Related Products
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {relatedProducts.map(rp => (
              <div
                key={rp.id}
                onClick={() => {
                  if (onClose) onClose();
                  navigateTo('details', rp.id);
                }}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  background: '#ffffff',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', borderRadius: '6px', marginBottom: '10px' }}>
                  <img src={getAssetUrl(rp.image)} alt={rp.title} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1A253C', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rp.title}
                </div>
                <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.9rem' }}>
                  ₹{rp.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // If used as modal
  if (isModal) {
    return (
      <div
        className="custom-modal-overlay active pdp-quick-view-overlay"
        onClick={onClose}
      >
        <div
          className="pdp-modal-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            className="pdp-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          {content}
        </div>
      </div>
    );
  }

  // If used on dedicated page view
  return content;
};

export default ProductDetailModal;
