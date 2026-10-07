import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAssetUrl } from '../../utils/imageUrl';

const HeroBanner = () => {
  const { banners, navigateTo } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeBanners = (banners || []).filter(b => b && b.active !== false);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const handleActionClick = (e, link) => {
    e.preventDefault();
    if (link.startsWith('#category/')) {
      const cat = link.split('/')[1];
      navigateTo('category', cat);
    } else if (link === '#home') {
      navigateTo('home');
    } else {
      window.location.hash = link;
    }
  };

  return (
    <div
      className="hero-carousel-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel-container" id="heroCarousel">
        <div className="carousel-slider" id="carouselSlider">
          {activeBanners.map((banner, index) => {
            const bgImage = getAssetUrl(banner.image);
            return (
              <div
                key={banner.id || index}
                className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                style={{
                  display: index === currentSlide ? 'block' : 'none',
                  backgroundImage: `linear-gradient(rgba(26,37,60,0.5), rgba(26,37,60,0.2)), url('${bgImage}')`
                }}
              >
                <div className="carousel-content">
                  {banner.subtitle && <span className="slide-subtitle">{banner.subtitle}</span>}
                  <h2 className="slide-title">{banner.headline || banner.title}</h2>
                  <p className="slide-desc">{banner.description}</p>
                  <div className="slide-actions">
                    {banner.btn1Text && (
                      <a
                        href={banner.btn1Link || '#home'}
                        className="btn btn-primary btn-large"
                        onClick={(e) => handleActionClick(e, banner.btn1Link || '#home')}
                      >
                        {banner.btn1Text}
                      </a>
                    )}
                    {banner.btn2Text && (
                      <a
                        href={banner.btn2Link || '#home'}
                        className="btn btn-outline btn-large"
                        onClick={(e) => handleActionClick(e, banner.btn2Link || '#home')}
                      >
                        {banner.btn2Text}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slider Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              className="carousel-arrow prev"
              id="carouselPrevBtn"
              aria-label="Previous Slide"
              onClick={() => setCurrentSlide(prev => (prev - 1 + activeBanners.length) % activeBanners.length)}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              className="carousel-arrow next"
              id="carouselNextBtn"
              aria-label="Next Slide"
              onClick={() => setCurrentSlide(prev => (prev + 1) % activeBanners.length)}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {activeBanners.length > 1 && (
          <div className="carousel-dots" id="carouselDots">
            {activeBanners.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              ></span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroBanner;
