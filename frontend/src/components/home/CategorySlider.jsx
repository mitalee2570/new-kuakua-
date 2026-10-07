import React, { useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAssetUrl } from '../../utils/imageUrl';

const CategorySlider = () => {
  const { categories, navigateTo } = useStore();
  const scrollRef = useRef(null);

  const activeCategories = (categories || []).filter(c => c && c.status !== 'deactivated' && c.showOnHome !== false);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="category-scroll-section">
      <div className="section-container">
        <div className="section-header category-heading-center">
          <h2 className="section-title">Shop by Category</h2>
        </div>
        <div className="category-scroll-wrapper">
          <button
            type="button"
            className="cat-scroll-arrow left"
            aria-label="Scroll Categories Left"
            onClick={() => handleScroll('left')}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="category-scroll-container" id="categoryScrollContainer" ref={scrollRef}>
            {activeCategories.map((cat) => {
              const imgSrc = getAssetUrl(cat.image);
              return (
                <a
                  key={cat.id}
                  href={`#category/${cat.slug}`}
                  className="cat-scroll-card"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('category', cat.slug);
                  }}
                >
                  <div className="cat-img-wrapper">
                    <img src={imgSrc} alt={cat.name} loading="lazy" />
                  </div>
                  <span className="cat-name">{cat.name}</span>
                </a>
              );
            })}
          </div>
          <button
            type="button"
            className="cat-scroll-arrow right"
            aria-label="Scroll Categories Right"
            onClick={() => handleScroll('right')}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategorySlider;
