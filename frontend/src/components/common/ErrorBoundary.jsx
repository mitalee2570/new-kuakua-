import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    try {
      localStorage.removeItem('pretute_local_products');
      localStorage.removeItem('pretute_local_categories');
      localStorage.removeItem('pretute_local_banners');
    } catch (_e) {}
  }

  handleReload = () => {
    try {
      localStorage.removeItem('pretute_local_products');
      localStorage.removeItem('pretute_local_categories');
      localStorage.removeItem('pretute_local_banners');
    } catch (_e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '16px' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Temporary Display Issue</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '440px', margin: '0 0 20px 0' }}>
            We have safely refreshed the local product cache. Click below to reload the storefront smoothly.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{ padding: '10px 24px', background: 'var(--color-primary, #FF5B7F)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem' }}
          >
            Refresh Store
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
