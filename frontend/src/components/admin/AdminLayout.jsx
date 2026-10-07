import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import api from '../../services/api';
import { getAssetUrl } from '../../utils/imageUrl';
import { initialProducts, initialCategories, initialBanners } from '../../data/initialData';

const AdminLayout = () => {
  const { adminToken, loginAdmin, logoutAdmin, navigateTo, showToast, refreshData } = useStore();

  // Auth state
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab & Mobile Sidebar
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'banners' | 'products' | 'categories' | 'orders' | 'coupons' | 'inquiries' | 'settings'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Admin Data
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settings, setSettings] = useState(null);

  // Filters & Modals
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Modals state
  const [productModal, setProductModal] = useState(null); // null | {}
  const [productModalTab, setProductModalTab] = useState('photos'); // 'photos' | 'info' | 'pricing' | 'details'
  const [bannerModal, setBannerModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [couponModal, setCouponModal] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);

  // Image Presets for easy 1-click selection (including WordPress products)
  const storeImagePresets = [
    { label: 'Coastal Tray - Angle 1 (Starfish Front)', path: 'assets/coastal_tray_1.jpg' },
    { label: 'Coastal Tray - Angle 2 (Peach 45° Angle)', path: 'assets/coastal_tray_2.jpg' },
    { label: 'Coastal Tray - Angle 3 (Side Pearl Rim)', path: 'assets/coastal_tray_3.jpg' },
    { label: 'Coastal Tray - Angle 4 (Raised Back Profile)', path: 'assets/coastal_tray_4.jpg' },
    { label: 'Coastal Tray - Angle 5 (Sky Blue Variant)', path: 'assets/coastal_tray_5.jpg' },
    { label: 'Coastal Tray - Angle 6 (Yellow Variant)', path: 'assets/coastal_tray_6.jpg' },
    { label: 'Wave Tray (Marble Blue Ripple)', path: 'assets/wave_tray.jpg' },
    { label: 'Lotus Duo (Yellow Bowls on Tray)', path: 'assets/lotus_duo.jpg' },
    { label: 'Oval Pearl Tray (Beaded Catchall)', path: 'assets/oval_pearl_tray.jpg' },
    { label: 'Pebble Bowl (Blush Donut Dish)', path: 'assets/pebble_bowl.jpg' },
    { label: 'Baby Romper (Clothes)', path: 'assets/prod_romper.png' },
    { label: 'Rainbow Toy (Montessori)', path: 'assets/prod_rainbow.png' },
    { label: 'Baby Stroller (Gear)', path: 'assets/prod_stroller.png' },
    { label: 'Linen Dress (Maternity)', path: 'assets/prod_dress.png' },
    { label: 'DIY Art Kit', path: 'assets/DIY KIT.jpg' },
    { label: 'Resin Art Tray', path: 'assets/Resin Art.jpg' },
    { label: 'Aroma Candles', path: 'assets/candle.jpg' },
    { label: 'Decorative Art', path: 'assets/Decorative Shop.jpg' },
    { label: 'Corporate Gifts', path: 'assets/Corporate Gifts.jpg' },
    { label: 'Home Decor', path: 'assets/Home Decor.jpg' },
    { label: 'Treasure Keeps', path: 'assets/Treasure Keeps.jpg' },
    { label: 'Arts & Craft', path: 'assets/Arts and Craft.webp' },
    { label: 'Fashion Hero Banner', path: 'assets/hero_fashion.png' },
    { label: 'Toys Hero Banner', path: 'assets/hero_toys.png' }
  ];

  // Helper to compress images to crisp WebP/JPEG under 60KB so it never exceeds localStorage quota
  const compressImageFile = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Helper to load file from PC / Phone directly with auto-compression
  const handleImageUpload = async (file, setter, currentObj) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('File Too Large', 'Please select an image under 15MB.', 'error');
      return;
    }
    const compressed = await compressImageFile(file, 1200, 0.82);
    if (!compressed) return;
    setter(prev => ({ ...(prev || currentObj), image: compressed }));
    showToast('Photo Loaded', 'Optimized image ready to save.', 'success');
  };

  // Helper for 6 individual angle slots in Product Modal with auto-compression
  const handleSlotImageUpload = async (file, slotIndex) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('File Too Large', 'Please select an image under 15MB.', 'error');
      return;
    }
    const compressed = await compressImageFile(file, 800, 0.82);
    if (!compressed) return;
    setProductModal(prev => {
      const curImages = Array.isArray(prev.images) && prev.images.length > 0 ? [...prev.images] : [prev.image || ''];
      while (curImages.length <= slotIndex) curImages.push('');
      curImages[slotIndex] = compressed;
      return {
        ...prev,
        image: curImages[0] || compressed,
        images: curImages
      };
    });
    showToast(`Angle ${slotIndex + 1} Photo Loaded`, 'Optimized image ready to save.', 'success');
  };

  const handleSlotImageUrlChange = (url, slotIndex) => {
    setProductModal(prev => {
      const curImages = Array.isArray(prev.images) && prev.images.length > 0 ? [...prev.images] : [prev.image || ''];
      while (curImages.length <= slotIndex) curImages.push('');
      curImages[slotIndex] = url;
      return {
        ...prev,
        image: curImages[0] || url,
        images: curImages
      };
    });
  };

  const handleRemoveSlotImage = (slotIndex) => {
    setProductModal(prev => {
      const curImages = Array.isArray(prev.images) && prev.images.length > 0 ? [...prev.images] : [prev.image || ''];
      while (curImages.length <= slotIndex) curImages.push('');
      curImages[slotIndex] = '';
      const fallback = curImages.find(img => img && img.trim() !== '') || '';
      return {
        ...prev,
        image: fallback,
        images: curImages
      };
    });
  };

  const handleFillCoastalTemplate = () => {
    setProductModal(prev => ({
      ...prev,
      image: 'assets/coastal_tray_1.jpg',
      images: [
        'assets/coastal_tray_1.jpg',
        'assets/coastal_tray_2.jpg',
        'assets/coastal_tray_3.jpg',
        'assets/coastal_tray_4.jpg',
        'assets/coastal_tray_5.jpg',
        'assets/coastal_tray_6.jpg'
      ]
    }));
    showToast('Template Loaded', 'Coastal Tray 6-angle photos loaded into all 6 slots.', 'success');
  };

  // Helper to open Add Product modal with 6 slots and defaults
  const openNewProductModal = (catSlug = '') => {
    const targetCat = catSlug || (selectedProductCategory !== 'all' ? selectedProductCategory : (categories[0]?.slug || 'resin-art'));
    const targetCatObj = categories.find(c => c.slug === targetCat);
    setProductModalTab('info');
    setProductModal({
      title: '',
      category: targetCat,
      categoryLabel: targetCatObj ? targetCatObj.name : 'Resin Art',
      subCategory: 'Jewellery Jars & Trays',
      categoriesList: ['Gifts', 'Home Decor', 'Jewellery Jars & Trays'],
      sku: `G${Math.floor(100 + Math.random() * 900)}`,
      brand: 'KuaKua Craft',
      price: 589,
      originalPrice: 799,
      stock: 25,
      badge: 'NEW',
      colors: ['Blue', 'Cream', 'Green', 'Orange', 'Red', 'Yellow'],
      image: 'assets/coastal_tray_1.jpg',
      images: [
        'assets/coastal_tray_1.jpg',
        'assets/coastal_tray_2.jpg',
        'assets/coastal_tray_3.jpg',
        'assets/coastal_tray_4.jpg',
        'assets/coastal_tray_5.jpg',
        'assets/coastal_tray_6.jpg'
      ],
      shortDesc: 'A beautifully designed handcrafted artisan piece featuring smooth glossy surfaces, textured edges, and artisanal finish.',
      longDesc: 'Individually handcrafted with artisanal mineral composite and premium non-toxic resin. Features distinctive handcrafted details and a durable water-resistant gloss protective coat.',
      dimensions: '15cm x 15cm x 3.5cm',
      material: 'Fine Glazed Ceramic & Mineral Resin Composite',
      care: 'Wipe clean with a damp cloth. Avoid harsh abrasives or dishwashers.',
      sizes: ['Standard'],
      tags: ['Handcrafted', 'Home Decor', 'Jewellery Jars & Trays', 'resin art']
    });
  };

  const openEditProductModal = (p) => {
    const rawImages = Array.isArray(p.images) && p.images.length > 0 ? [...p.images] : [p.image || ''];
    while (rawImages.length < 6) rawImages.push('');
    setProductModalTab('info');
    setProductModal({
      ...p,
      images: rawImages,
      subCategory: p.subCategory || 'Jewellery Jars & Trays',
      sku: p.sku || `G${Math.floor(100 + Math.random() * 900)}`,
      brand: p.brand || 'KuaKua Craft'
    });
  };

  // Load all admin data
  const loadAdminData = async () => {
    try {
      const [s, p, c, b, o, cp, m, st] = await Promise.allSettled([
        api.getAdminStats(),
        api.getProducts(),
        api.getCategories(),
        api.getBanners(),
        api.getOrders(),
        api.getCoupons(),
        api.getMessages(),
        api.getSettings()
      ]);
      if (s.status === 'fulfilled' && s.value) {
        setStats(s.value);
      } else {
        setStats({
          totalRevenue: 184500,
          ordersCount: 28,
          productsCount: initialProducts.length,
          customersCount: 42,
          revenueChange: '+18.5%',
          ordersChange: '+12.3%',
          conversionRate: '3.4%'
        });
      }
      if (p.status === 'fulfilled' && Array.isArray(p.value) && p.value.length > 0) {
        setProducts(p.value);
      } else {
        setProducts(initialProducts);
      }
      if (c.status === 'fulfilled' && Array.isArray(c.value) && c.value.length > 0) {
        setCategories(c.value);
      } else {
        setCategories(initialCategories);
      }
      if (b.status === 'fulfilled' && Array.isArray(b.value) && b.value.length > 0) {
        setBanners(b.value);
      } else {
        setBanners(initialBanners);
      }
      if (o.status === 'fulfilled' && Array.isArray(o.value) && o.value.length > 0) {
        setOrders(o.value);
      } else {
        setOrders([
          {
            id: 'ORD-9842',
            createdAt: new Date().toISOString(),
            customer: { name: 'Mitalee Maurya', email: 'mitaleemaurya@gmail.com', phone: '+91 87572 01351' },
            items: [{ title: 'Organic Cotton Ribbed Romper', quantity: 2, price: 999, selectedSize: '3-6M' }],
            total: 1998,
            paymentMethod: 'UPI',
            status: 'Delivered',
            shippingAddress: { city: 'Mumbai', state: 'Maharashtra', pinCode: '400001', address: 'B-104, Palm Grove' }
          },
          {
            id: 'ORD-9843',
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            customer: { name: 'Rohit Sharma', email: 'rohit@example.com', phone: '+91 98765 43210' },
            items: [{ title: 'Artisan Wooden Rainbow Stacker', quantity: 1, price: 1599, selectedSize: 'Standard' }],
            total: 1599,
            paymentMethod: 'Credit Card',
            status: 'Shipped',
            shippingAddress: { city: 'Bengaluru', state: 'Karnataka', pinCode: '560001', address: '42, Indiranagar' }
          },
          {
            id: 'ORD-9844',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            customer: { name: 'Pooja Verma', email: 'pooja@example.com', phone: '+91 91234 56789' },
            items: [{ title: 'Aesthetic Bohemian Wall Hanging Tapestry', quantity: 1, price: 1499, selectedSize: '60cm x 80cm' }],
            total: 1499,
            paymentMethod: 'Cash on Delivery',
            status: 'Processing',
            shippingAddress: { city: 'Delhi', state: 'Delhi', pinCode: '110001', address: '12, Connaught Place' }
          }
        ]);
      }
      if (cp.status === 'fulfilled' && Array.isArray(cp.value) && cp.value.length > 0) {
        setCoupons(cp.value);
      } else {
        setCoupons([
          { code: 'PRETUTE20', type: 'percent', value: 20, description: 'Flat 20% Off for Launch celebration', active: true, usageCount: 48 },
          { code: 'FREESHIP', type: 'shipping', value: 0, description: 'Free Standard Shipping on all orders', active: true, usageCount: 92 }
        ]);
      }
      if (m.status === 'fulfilled' && Array.isArray(m.value)) setMessages(m.value);
      if (st.status === 'fulfilled' && st.value) setSettings(st.value);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setProducts(initialProducts);
      setCategories(initialCategories);
      setBanners(initialBanners);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadAdminData();
    }
  }, [adminToken]);

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setAuthError('Please enter the Admin Password or PIN.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await loginAdmin(cleanPin);
      if (!res || !res.success) {
        setAuthError((res && res.message) || 'Invalid Admin Password or PIN. Access denied.');
      } else {
        setPinInput('');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Product Actions
  const handleToggleStock = async (id) => {
    try {
      await api.toggleProductStock(id);
      loadAdminData();
      refreshData?.();
      showToast('Stock Updated', 'Product stock status toggled.', 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.toggleProductStatus(id);
      loadAdminData();
      refreshData?.();
      showToast('Status Updated', 'Product visibility toggled.', 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
        loadAdminData();
        refreshData?.();
        showToast('Product Deleted', 'Removed from store.', 'info');
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    }
  };

  const handleSaveProduct = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      // Validation: Title
      if (!productModal.title || !productModal.title.trim()) {
        setProductModalTab('info');
        showToast('Title Required', 'Please enter a Product Title.', 'error');
        return;
      }
      // Validation: Selling Price
      const parsedPrice = parseFloat(productModal.price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        setProductModalTab('pricing');
        showToast('Price Required', 'Please enter a valid Selling Price.', 'error');
        return;
      }

      // Ensure images array contains valid items and primary image is set
      const rawImages = Array.isArray(productModal.images) && productModal.images.length > 0
        ? productModal.images
        : [productModal.image || 'assets/coastal_tray_1.jpg'];
      const filteredImages = rawImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
      const primaryImage = filteredImages[0] || productModal.image || 'assets/coastal_tray_1.jpg';
      const finalImagesList = filteredImages.length > 0 ? filteredImages : [primaryImage];

      // Parse colors if provided as string
      let processedColors = productModal.colors;
      if (typeof processedColors === 'string') {
        processedColors = processedColors.split(',').map(c => c.trim()).filter(Boolean);
      }

      // Parse tags if provided as string
      let processedTags = productModal.tags;
      if (typeof processedTags === 'string') {
        processedTags = processedTags.split(',').map(t => t.trim()).filter(Boolean);
      }

      const productPayload = {
        ...productModal,
        title: productModal.title.trim(),
        image: primaryImage,
        images: finalImagesList,
        colors: processedColors || [],
        tags: processedTags || [],
        price: parsedPrice,
        originalPrice: parseFloat(productModal.originalPrice) || parsedPrice,
        stock: productModal.stock !== undefined ? parseInt(productModal.stock) : 25,
        sku: productModal.sku || `G${Math.floor(100 + Math.random() * 900)}`,
        brand: productModal.brand || 'KuaKua Craft',
        subCategory: productModal.subCategory || 'Jewellery Jars & Trays',
        categoryLabel: productModal.categoryLabel || productModal.category
      };

      if (productModal.id) {
        const updated = await api.updateProduct(productModal.id, productPayload);
        setProducts(prev => prev.map(p => String(p.id) === String(productModal.id) ? { ...p, ...productPayload, ...updated } : p));
        showToast('Product Updated', 'Changes saved with all 6 angles and details.', 'success');
      } else {
        const created = await api.createProduct(productPayload);
        const itemToAdd = created || { ...productPayload, id: Date.now(), createdAt: new Date().toISOString() };
        setProducts(prev => [itemToAdd, ...prev.filter(p => String(p.id) !== String(itemToAdd.id))]);
        showToast('Product Created', 'New product added to store.', 'success');
      }
      setProductModal(null);
      loadAdminData();
      refreshData?.();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await api.updateProduct(product.id, { ...product, featured: !product.featured });
      loadAdminData();
      refreshData?.();
      showToast('Featured Updated', !product.featured ? `"${product.title}" added to Featured` : `"${product.title}" removed from Featured`, 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (categoryModal.id) {
        await api.updateCategory(categoryModal.id, categoryModal);
        showToast('Category Updated', 'Category updated.', 'success');
      } else {
        await api.createCategory(categoryModal);
        showToast('Category Created', 'New category added to store.', 'success');
      }
      setCategoryModal(null);
      loadAdminData();
      refreshData?.();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.deleteCategory(id);
        loadAdminData();
        refreshData?.();
        showToast('Category Deleted', 'Category removed.', 'info');
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      loadAdminData();
      showToast('Order Updated', `Order marked as ${status}.`, 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Banner Actions
  const handleToggleBanner = async (id) => {
    try {
      await api.toggleBanner(id);
      loadAdminData();
      refreshData?.();
      showToast('Banner Updated', 'Banner status toggled.', 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      if (bannerModal.id) {
        await api.updateBanner(bannerModal.id, bannerModal);
        showToast('Banner Updated', 'Changes saved.', 'success');
      } else {
        await api.createBanner(bannerModal);
        showToast('Banner Created', 'New carousel slide added.', 'success');
      }
      setBannerModal(null);
      loadAdminData();
      refreshData?.();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Coupon Actions
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.createCoupon(couponModal);
      showToast('Coupon Created', `Code ${couponModal.code} is now live.`, 'success');
      setCouponModal(null);
      loadAdminData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (window.confirm(`Delete coupon ${code}?`)) {
      try {
        await api.deleteCoupon(code);
        loadAdminData();
        showToast('Coupon Deleted', 'Coupon removed.', 'info');
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    }
  };

  // Inquiry Actions
  const handleMarkMessageRead = async (id, read) => {
    try {
      await api.markMessageRead(id, read);
      loadAdminData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Settings Actions
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      showToast('Settings Saved', 'Store configuration updated.', 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Backup
  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pretute_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      showToast('Backup Exported', 'Downloaded store database snapshot.', 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Reset to Factory Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Warning: This will reset products, categories, banners, and settings to original demo state. Proceed?')) {
      try {
        await api.resetDefaults();
        loadAdminData();
        showToast('Reset Complete', 'Database restored to defaults.', 'info');
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    }
  };

  // 1. If not authenticated, render Login Gate
  if (!adminToken) {
    return (
      <div className="admin-auth-overlay" id="authOverlay" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="auth-card" style={{ maxWidth: '420px', width: '100%', background: '#fff', padding: '36px 30px', borderRadius: '18px', boxShadow: '0 20px 45px rgba(15,23,42,0.18)', textAlign: 'center', position: 'relative' }}>
          <div className="auth-header" style={{ marginBottom: '24px' }}>
            <div className="auth-logo-badge" style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '14px', boxShadow: '0 6px 14px rgba(244,63,94,0.18)' }}>
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h2 className="auth-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Admin Authentication</h2>
            <p className="auth-subtitle" style={{ color: '#64748b', fontSize: '0.88rem', margin: '6px 0 0 0' }}>Enter your security password or PIN to unlock the store back panel</p>
          </div>

          <form className="auth-form" id="adminLoginForm" onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label htmlFor="adminPassInput" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Admin Password or PIN
              </label>
              <div className="auth-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', color: '#94a3b8', fontSize: '0.95rem', pointerEvents: 'none' }}></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="adminPassInput"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Enter Password (admin123) or PIN (1234)"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 40px',
                    border: authError ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    color: '#0f172a',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = '#ffffff';
                    if (!authError) e.target.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = '#f8fafc';
                    if (!authError) e.target.style.borderColor = '#cbd5e1';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '4px 6px',
                    borderRadius: '4px'
                  }}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {authError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="auth-btn"
              id="loginSubmitBtn"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.96rem',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 18px rgba(244,63,94,0.28)',
                opacity: authLoading ? 0.75 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {authLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Unlock Back Panel</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="auth-hints" style={{ marginTop: '22px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.84rem', color: '#475569', border: '1px dashed #cbd5e1', lineHeight: 1.5 }}>
            <i className="fa-solid fa-key" style={{ marginRight: '6px', color: 'var(--color-primary)' }}></i>
            Fixed Admin Password: <strong style={{ color: '#0f172a' }}>admin123</strong> &bull; Fixed PIN: <strong style={{ color: '#0f172a' }}>1234</strong>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.86rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Return to Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard Layout
  return (
    <div className="admin-wrapper" id="adminWrapper" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', width: '100%', position: 'relative' }}>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1040
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`} id="adminSidebar" style={{ background: '#1A253C', color: '#fff', flexShrink: 0, padding: '20px 16px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, height: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              <i className="fa-solid fa-crown"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.5px' }}>PRETUTE</h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Back Panel</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.3rem', cursor: 'pointer', padding: '4px' }}
            aria-label="Close Sidebar"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Navigation Sections */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Group 1: Storefront Sections (Website Layout) */}
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: 700, padding: '0 8px 8px' }}>
              Storefront Sections
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'header', label: 'Header & Announcement', icon: 'fa-heading' },
                { id: 'banners', label: 'Hero Banners', icon: 'fa-images', count: banners.length },
                { id: 'categories', label: 'Shop by Category', icon: 'fa-layer-group', count: categories.length },
                { id: 'latest_products', label: 'Our Latest Products', icon: 'fa-sparkles', count: products.length },
                { id: 'featured_products', label: 'Featured Collections', icon: 'fa-star', count: products.filter(p => p.featured).length },
                { id: 'coupons', label: 'Exclusive Deals & Coupons', icon: 'fa-ticket', count: coupons.length }
              ].map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: activeTab === item.id ? 'var(--color-primary)' : 'transparent',
                      color: activeTab === item.id ? '#fff' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                      fontWeight: activeTab === item.id ? 600 : 500,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className={`fa-solid ${item.icon}`} style={{ width: '16px', color: activeTab === item.id ? '#fff' : '#94a3b8' }}></i>
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: activeTab === item.id ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)' }}>
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Group 2: Catalog & Store Operations */}
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: 700, padding: '0 8px 8px' }}>
              Store Management
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'products', label: 'Products (By Category)', icon: 'fa-boxes-stacked', count: products.length },
                { id: 'orders', label: 'Orders & Deliveries', icon: 'fa-cart-shopping', count: orders.length },
                { id: 'inquiries', label: 'Customer Messages', icon: 'fa-comments', count: messages.filter(m => !m.read).length },
                { id: 'settings', label: 'Store Settings & Backup', icon: 'fa-gear' },
                { id: 'dashboard', label: 'Dashboard Overview', icon: 'fa-chart-pie' }
              ].map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: activeTab === item.id ? 'var(--color-primary)' : 'transparent',
                      color: activeTab === item.id ? '#fff' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                      fontWeight: activeTab === item.id ? 600 : 500,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className={`fa-solid ${item.icon}`} style={{ width: '16px', color: activeTab === item.id ? '#fff' : '#94a3b8' }}></i>
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: activeTab === item.id ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)' }}>
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-arrow-left"></i> View Storefront
          </button>
          <button
            type="button"
            onClick={logoutAdmin}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: 'none', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-lock"></i> Lock Back Panel
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main" style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', minHeight: '100vh', boxSizing: 'border-box' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              style={{ background: '#1A253C', color: '#fff', border: 'none', borderRadius: '6px', width: '38px', height: '38px', cursor: 'pointer' }}
              title="Toggle Menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1A253C' }}>
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'header' && 'Header & Announcement Bar Manager'}
                {activeTab === 'banners' && 'Homepage Carousel Banners'}
                {activeTab === 'categories' && 'Shop by Category Manager'}
                {activeTab === 'latest_products' && 'Our Latest Products Manager'}
                {activeTab === 'featured_products' && 'Featured Collections Manager'}
                {activeTab === 'products' && 'Products Catalog (Category-Wise)'}
                {activeTab === 'orders' && 'Order Processing & Deliveries'}
                {activeTab === 'coupons' && 'Exclusive Deals & Promo Codes'}
                {activeTab === 'inquiries' && 'Customer Inquiries & Messages'}
                {activeTab === 'settings' && 'Store Configuration & Backups'}
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>PRETUTE Administrator Control Panel</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {activeTab === 'products' && (
              <button
                type="button"
                onClick={() => openNewProductModal(selectedProductCategory !== 'all' ? selectedProductCategory : '')}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-plus"></i> Add Product
              </button>
            )}
            {activeTab === 'latest_products' && (
              <button
                type="button"
                onClick={() => openNewProductModal('resin-art')}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-plus"></i> Add Product to Latest
              </button>
            )}
            {activeTab === 'featured_products' && (
              <button
                type="button"
                onClick={() => {
                  openNewProductModal('resin-art');
                  setProductModal(prev => ({ ...prev, featured: true, badge: 'Hot' }));
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-plus"></i> Add Featured Product
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                type="button"
                onClick={() => setCategoryModal({ name: '', slug: '', image: 'assets/Arts and Craft.webp', description: '', showOnHome: true })}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-plus"></i> Add Category
              </button>
            )}
            {activeTab === 'banners' && (
              <button
                type="button"
                onClick={() => setBannerModal({ headline: '', subtitle: '', description: '', image: 'assets/hero_fashion.png', btn1Text: 'Shop Now', btn1Link: '#home' })}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-plus"></i> Add Banner
              </button>
            )}
            {activeTab === 'coupons' && (
              <button
                type="button"
                onClick={() => setCouponModal({ code: '', type: 'percent', value: 20, minSpend: 0, description: '', usageLimit: 100 })}
                className="btn btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-plus"></i> Create Coupon
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>TOTAL REVENUE</span>
                <h2 style={{ fontSize: '1.8rem', color: '#1A253C', margin: '8px 0 0 0' }}>₹{stats ? stats.totalRevenue.toLocaleString() : '0'}</h2>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>TOTAL ORDERS</span>
                <h2 style={{ fontSize: '1.8rem', color: '#1A253C', margin: '8px 0 0 0' }}>{stats ? stats.totalOrders : '0'}</h2>
                <span style={{ fontSize: '0.78rem', color: '#f59e0b' }}>{stats?.pendingOrders || 0} pending fulfillment</span>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>PRODUCTS IN CATALOG</span>
                <h2 style={{ fontSize: '1.8rem', color: '#1A253C', margin: '8px 0 0 0' }}>{stats ? stats.totalProducts : '0'}</h2>
                <span style={{ fontSize: '0.78rem', color: '#10B981' }}>Active catalog items</span>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>CUSTOMER INQUIRIES</span>
                <h2 style={{ fontSize: '1.8rem', color: '#1A253C', margin: '8px 0 0 0' }}>{stats ? stats.totalInquiries : '0'}</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)' }}>{stats?.unreadInquiries || 0} unread</span>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1A253C' }}>Recent Orders</h3>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '10px 12px' }}>Order ID</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Items</th>
                      <th style={{ padding: '10px 12px' }}>Total</th>
                      <th style={{ padding: '10px 12px' }}>Payment</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-primary)' }}>{o.id}</td>
                        <td style={{ padding: '10px 12px' }}>{o.customerName}</td>
                        <td style={{ padding: '10px 12px' }}>{o.items?.length || 1} items</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>₹{Math.round(o.total).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px' }}>{o.paymentMethod}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, background: o.status === 'Delivered' ? '#ECFDF5' : o.status === 'Shipped' ? '#EFF6FF' : '#FEF3C7', color: o.status === 'Delivered' ? '#047857' : o.status === 'Shipped' ? '#1D4ED8' : '#B45309' }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS (CATEGORY-WISE) */}
        {activeTab === 'products' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Category Filter Pills */}
            <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1A253C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-layer-group" style={{ color: 'var(--color-primary)' }}></i>
                  <span>Category-Wise Filter & Direct Add:</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Showing {products.filter(p => (!productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase())) && (selectedProductCategory === 'all' || p.category === selectedProductCategory)).length} products
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProductCategory('all')}
                  style={{
                    padding: '7px 15px',
                    borderRadius: '20px',
                    border: '1.5px solid',
                    borderColor: selectedProductCategory === 'all' ? 'var(--color-primary)' : '#cbd5e1',
                    background: selectedProductCategory === 'all' ? 'var(--color-primary)' : '#ffffff',
                    color: selectedProductCategory === 'all' ? '#ffffff' : '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: selectedProductCategory === 'all' ? '0 2px 6px rgba(255,91,127,0.3)' : 'none'
                  }}
                >
                  All Categories ({products.length})
                </button>
                {categories.map(cat => {
                  const catCount = products.filter(p => p.category === cat.slug).length;
                  const isSel = selectedProductCategory === cat.slug;
                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => setSelectedProductCategory(cat.slug)}
                      style={{
                        padding: '7px 15px',
                        borderRadius: '20px',
                        border: '1.5px solid',
                        borderColor: isSel ? 'var(--color-primary)' : '#cbd5e1',
                        background: isSel ? 'var(--color-primary)' : '#ffffff',
                        color: isSel ? '#ffffff' : '#334155',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isSel ? '0 2px 6px rgba(255,91,127,0.3)' : 'none'
                      }}
                    >
                      {cat.name} ({catCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Dynamic Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={selectedProductCategory === 'all' ? 'Search products by title or category...' : `Search in ${categories.find(c => c.slug === selectedProductCategory)?.name || 'category'}...`}
                style={{ flex: 1, minWidth: '260px', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
              />
              <button
                type="button"
                onClick={() => openNewProductModal(selectedProductCategory !== 'all' ? selectedProductCategory : '')}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-plus"></i>
                {selectedProductCategory === 'all'
                  ? 'Add Product'
                  : `Add Product in ${categories.find(c => c.slug === selectedProductCategory)?.name || 'Category'}`}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 14px', width: '75px', textAlign: 'center' }}>Photo</th>
                    <th style={{ padding: '12px 14px' }}>Product Title</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Price</th>
                    <th style={{ padding: '12px 14px' }}>Stock</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => {
                      const matchesSearch = !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase());
                      const matchesCategory = selectedProductCategory === 'all' || p.category === selectedProductCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map(p => {
                      const pImg = getAssetUrl(p.image);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #e2e8f0', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.06)' }}>
                              <img
                                src={pImg}
                                alt={p.title}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                                onError={(e) => { e.target.src = 'assets/Logo.png'; }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600, color: '#1A253C', fontSize: '0.92rem' }}>{p.title}</div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {p.id}</span>
                              {p.badge && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 91, 127, 0.12)', color: 'var(--color-primary)' }}>
                                  {p.badge}
                                </span>
                              )}
                              {p.featured && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309' }}>
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500, color: '#475569' }}>
                              {p.categoryLabel || p.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>₹{p.price}</div>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{p.originalPrice}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleStock(p.id)}
                              style={{ border: 'none', background: p.stock > 0 ? '#ECFDF5' : '#FEF2F2', color: p.stock > 0 ? '#047857' : '#EF4444', padding: '4px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                            </button>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.id)}
                              style={{ border: 'none', background: p.status !== 'deactivated' ? '#EFF6FF' : '#F1F5F9', color: p.status !== 'deactivated' ? '#1D4ED8' : '#64748B', padding: '4px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {p.status !== 'deactivated' ? 'Active' : 'Deactivated'}
                            </button>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              title="Edit Product"
                              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563eb', cursor: 'pointer', marginRight: '8px', padding: '6px 10px', borderRadius: '6px' }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              title="Delete Product"
                              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#ef4444', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px' }}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: OUR LATEST PRODUCTS */}
        {activeTab === 'latest_products' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'rgba(255, 91, 127, 0.12)', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                  <i className="fa-solid fa-sparkles" style={{ marginRight: '4px' }}></i> Storefront Fresh Arrivals Section
                </span>
                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.15rem', color: '#1A253C' }}>Our Latest Products Manager</h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  These products appear directly after the <strong>"Shop by Category"</strong> section in the <strong>"Our Latest Products"</strong> showcase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openNewProductModal('resin-art')}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-plus"></i> Add Product to Latest
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px', width: '75px', textAlign: 'center' }}>Photo</th>
                    <th style={{ padding: '12px 14px' }}>Product Title</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Price</th>
                    <th style={{ padding: '12px 14px' }}>Stock</th>
                    <th style={{ padding: '12px 14px' }}>Badge</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...products]
                    .sort((a, b) => {
                      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (typeof a.id === 'number' ? a.id : 0);
                      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (typeof b.id === 'number' ? b.id : 0);
                      return timeB - timeA;
                    })
                    .map(p => {
                      const pImg = getAssetUrl(p.image);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #e2e8f0', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={pImg} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = 'assets/Logo.png'; }} />
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600, color: '#1A253C' }}>{p.title}</div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Created: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#475569' }}>
                              {p.categoryLabel || p.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontWeight: 700 }}>₹{p.price}</td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <span style={{ color: p.stock > 0 ? '#047857' : '#EF4444', fontWeight: 600, fontSize: '0.8rem' }}>
                              {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <span style={{ background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {p.badge || 'NEW'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563eb', cursor: 'pointer', marginRight: '8px', padding: '6px 10px', borderRadius: '6px' }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#ef4444', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px' }}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: FEATURED COLLECTIONS */}
        {activeTab === 'featured_products' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', textTransform: 'uppercase' }}>
                  <i className="fa-solid fa-star" style={{ marginRight: '4px' }}></i> Storefront Showcase Section
                </span>
                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.15rem', color: '#1A253C' }}>Featured Collections Manager</h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  Highlight any product as <strong>Featured ⭐</strong> with one click to display it in the "Featured Collections" showcase on the home page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  openNewProductModal('resin-art');
                  setProductModal(prev => ({ ...prev, featured: true, badge: 'Hot' }));
                }}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-plus"></i> Add Featured Product
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px', width: '75px', textAlign: 'center' }}>Photo</th>
                    <th style={{ padding: '12px 14px' }}>Product Title</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Price</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Featured Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const pImg = getAssetUrl(p.image);
                    const isFeat = !!p.featured;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: isFeat ? '#fffdfa' : '#fff' }}>
                        <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #e2e8f0', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={pImg} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = 'assets/Logo.png'; }} />
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#1A253C' }}>{p.title}</div>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#475569' }}>
                            {p.categoryLabel || p.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontWeight: 700 }}>₹{p.price}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(p)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: isFeat ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
                              background: isFeat ? '#fffbeb' : '#f8fafc',
                              color: isFeat ? '#b45309' : '#64748b',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <i className={isFeat ? 'fa-solid fa-star' : 'fa-regular fa-star'} style={{ color: isFeat ? '#f59e0b' : '#94a3b8' }}></i>
                            {isFeat ? 'Featured (On Home)' : 'Click to Feature'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563eb', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px' }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: HEADER & ANNOUNCEMENT */}
        {activeTab === 'header' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', maxWidth: '720px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1A253C' }}>Header & Announcement Bar Settings</h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Control the top banner message, brand logo name, support email, and phone shown on top of the store.</p>
            </div>
            {settings && (
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Top Announcement Bar Text
                  </label>
                  <input
                    type="text"
                    value={settings.announcementText || ''}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    placeholder="e.g. 🌟 Spend ₹1,499+ for Free Shipping! | Code: KUAKUA20"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '4px', display: 'block' }}>This message appears at the very top of all pages.</small>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <input
                    type="checkbox"
                    id="announcementActive"
                    checked={settings.announcementActive !== false}
                    onChange={(e) => setSettings({ ...settings, announcementActive: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="announcementActive" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    Show Top Announcement Bar on Storefront
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Store Brand Title
                  </label>
                  <input
                    type="text"
                    value={settings.storeName || ''}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Header Support Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Header Contact Phone</label>
                    <input
                      type="text"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ padding: '11px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.92rem', marginTop: '6px' }}
                >
                  Save Header Settings
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders by customer or ID..."
                style={{ flex: 1, minWidth: '240px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px' }}>Order ID</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Customer & Address</th>
                  <th style={{ padding: '10px 12px' }}>Total</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                  .filter(o => !orderSearch || o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || o.id.toLowerCase().includes(orderSearch.toLowerCase()))
                  .map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-primary)' }}>{o.id}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#64748b' }}>{new Date(o.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{o.address}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>₹{Math.round(o.total).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid #cbd5e1' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setInvoiceModal(o)}
                          style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: CATEGORIES */}
        {activeTab === 'categories' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.88rem' }}>
              All store categories for product organization and the homepage navigation strip.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {categories.map((cat) => {
                const catImg = getAssetUrl(cat.image);
                const prodCount = products.filter(p => p.category === cat.slug).length;
                return (
                  <div key={cat.id || cat.slug} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center', background: '#f8fafc' }}>
                    <img
                      src={catImg}
                      alt={cat.name}
                      style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', background: '#fff' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 3px 0', color: '#1A253C', fontSize: '0.95rem' }}>{cat.name}</h4>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Slug: <code>{cat.slug}</code></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '3px' }}>
                        {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setCategoryModal(cat)}
                        style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: BANNERS */}
        {activeTab === 'banners' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {banners.map((b, idx) => {
                const bImg = getAssetUrl(b.image);
                return (
                  <div key={b.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={bImg} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{b.subtitle}</div>
                      <h4 style={{ margin: '4px 0 8px 0', color: '#1A253C' }}>{b.headline || b.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>{b.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleBanner(b.id)}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', border: 'none', background: b.active !== false ? '#ECFDF5' : '#F1F5F9', color: b.active !== false ? '#047857' : '#64748b', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {b.active !== false ? 'Active' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerModal(b)}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: COUPONS */}
        {activeTab === 'coupons' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px' }}>Code</th>
                  <th style={{ padding: '10px 12px' }}>Discount</th>
                  <th style={{ padding: '10px 12px' }}>Min Spend</th>
                  <th style={{ padding: '10px 12px' }}>Usage</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-primary)' }}>{c.code}</td>
                    <td style={{ padding: '10px 12px' }}>{c.type === 'percent' ? `${c.value}% Off` : `₹${c.value} Flat`}</td>
                    <td style={{ padding: '10px 12px' }}>{c.minSpend ? `₹${c.minSpend}` : 'None'}</td>
                    <td style={{ padding: '10px 12px' }}>{c.usageCount || 0} / {c.usageLimit || '∞'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, background: c.status === 'active' ? '#ECFDF5' : '#FEF2F2', color: c.status === 'active' ? '#047857' : '#ef4444' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c.code)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No messages found.</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: m.read ? '#fff' : '#fff1f2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <strong>{m.name}</strong> <span style={{ color: '#64748b', fontSize: '0.82rem' }}>({m.email})</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(m.date).toLocaleString()}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#1A253C', marginBottom: '4px' }}>{m.subject}</div>
                    <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 10px 0' }}>{m.message}</p>
                    <button
                      type="button"
                      onClick={() => handleMarkMessageRead(m.id, !m.read)}
                      style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                    >
                      {m.read ? 'Mark as Unread' : 'Mark as Read'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', maxWidth: '640px' }}>
            {settings && (
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Store Name</label>
                  <input
                    type="text"
                    value={settings.storeName || ''}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Announcement Top Bar</label>
                  <input
                    type="text"
                    value={settings.announcementText || ''}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Support Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Support Phone</label>
                    <input
                      type="text"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save Store Settings
                </button>

                {/* Backup & Factory Reset */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '10px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1A253C' }}>Database Management</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      <i className="fa-solid fa-download"></i> Export Database JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #fca5a5', color: '#ef4444', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      <i className="fa-solid fa-rotate-left"></i> Reset to Factory Seeds
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Product Edit / Create Modal */}
      {productModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: '#fff', padding: '24px 28px', borderRadius: '16px', width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,91,127,0.1)', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                  <i className="fa-solid fa-boxes-stacked" style={{ marginRight: '4px' }}></i> Product Management
                </span>
                <h3 style={{ margin: '4px 0 0 0', color: '#1A253C', fontSize: '1.35rem' }}>
                  {productModal.id ? `Edit Product: ${productModal.title || 'Untitled'}` : 'Add New Product (6 Angle Photos & WordPress Catalog)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProductModal(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: '#64748b', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Internal Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'info', label: '1. Title, Category & SKU', icon: 'fa-tag' },
                { id: 'photos', label: '2. 6 Angle Photos Gallery', icon: 'fa-images' },
                { id: 'pricing', label: '3. Price & Colours', icon: 'fa-indian-rupee-sign' },
                { id: 'details', label: '4. Description & Specs', icon: 'fa-file-lines' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setProductModalTab(t.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: productModalTab === t.id ? 'var(--color-primary)' : '#f8fafc',
                    color: productModalTab === t.id ? '#ffffff' : '#475569',
                    fontWeight: productModalTab === t.id ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* TAB 1: 6 ANGLE PHOTOS */}
              {productModalTab === 'photos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Top helper banner */}
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1A253C' }}>
                        <i className="fa-solid fa-camera-rotate" style={{ color: 'var(--color-primary)', marginRight: '8px' }}></i>
                        Product 6-Angle Photo Gallery
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Upload high-resolution images for each viewing angle or enter image URLs.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleFillCoastalTemplate}
                        style={{ padding: '7px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Fill Coastal Tray 6 Angles
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProductModal(prev => ({ ...prev, image: '', images: ['', '', '', '', '', ''] }));
                          showToast('Cleared', 'All 6 photo slots cleared.', 'info');
                        }}
                        style={{ padding: '7px 12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        ✕ Clear All
                      </button>
                    </div>
                  </div>

                  {/* 6 Angle Slots Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
                    {[
                      { idx: 0, title: 'Slot 1: Main / Front View', sub: 'Primary Frontal View', icon: 'fa-star', required: true },
                      { idx: 1, title: 'Slot 2: 45° Side Angle', sub: 'Perspective Side Angle', icon: 'fa-camera', required: false },
                      { idx: 2, title: 'Slot 3: Rim Profile & Detail', sub: 'Rim & Edge Detailing', icon: 'fa-magnifying-glass-plus', required: false },
                      { idx: 3, title: 'Slot 4: Back Profile & Texture', sub: 'Back Profile & Finish', icon: 'fa-rotate', required: false },
                      { idx: 4, title: 'Slot 5: Color Variant 1 / Angle 5', sub: 'Variant Shade / Angle 5', icon: 'fa-palette', required: false },
                      { idx: 5, title: 'Slot 6: Color Variant 2 / Angle 6', sub: 'Variant Shade / Angle 6', icon: 'fa-palette', required: false }
                    ].map(slot => {
                      const curImgs = Array.isArray(productModal.images) ? productModal.images : [productModal.image || ''];
                      const currentVal = curImgs[slot.idx] || (slot.idx === 0 ? productModal.image || '' : '');
                      return (
                        <div
                          key={slot.idx}
                          style={{
                            background: '#ffffff',
                            borderRadius: '10px',
                            border: currentVal ? '1.5px solid #cbd5e1' : '1.5px dashed #cbd5e1',
                            padding: '12px 14px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            position: 'relative'
                          }}
                        >
                          {/* Thumbnail Box */}
                          <div style={{ width: '74px', height: '74px', borderRadius: '8px', overflow: 'hidden', border: currentVal ? '2px solid var(--color-primary)' : '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                            {currentVal ? (
                              <img
                                src={getAssetUrl(currentVal)}
                                alt={`Angle ${slot.idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
                                onError={(e) => { e.target.src = 'assets/Logo.png'; }}
                              />
                            ) : (
                              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                <i className={`fa-solid ${slot.icon}`} style={{ fontSize: '1.2rem', marginBottom: '2px', display: 'block' }}></i>
                                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Empty</span>
                              </div>
                            )}
                          </div>

                          {/* Controls Box */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                                {slot.title} {slot.required && <span style={{ color: '#ef4444' }}>*</span>}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                {slot.sub}
                              </span>
                            </div>

                            {/* Option A: Upload from PC / Phone */}
                            <div style={{ marginBottom: '6px' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#f1f5f9', color: '#334155', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #cbd5e1' }}>
                                <i className="fa-solid fa-upload" style={{ color: 'var(--color-primary)' }}></i>
                                <span>Choose File (Phone / PC)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSlotImageUpload(e.target.files[0], slot.idx)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                              {currentVal && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlotImage(slot.idx)}
                                  style={{ marginLeft: '6px', padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', border: 'none', color: '#b91c1c', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                                  title="Remove this image"
                                >
                                  ✕ Clear
                                </button>
                              )}
                            </div>

                            {/* Option B: Direct URL / WordPress link paste */}
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) => handleSlotImageUrlChange(e.target.value, slot.idx)}
                              placeholder="Paste Image URL (assets/... or https://...)"
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', background: '#fcfcfc', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Preset Selector */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      <i className="fa-solid fa-bolt" style={{ color: 'var(--color-primary)', marginRight: '5px' }}></i>
                      Quick Preset to Slot 1:
                    </label>
                    <select
                      value=""
                      onChange={(e) => e.target.value && handleSlotImageUrlChange(e.target.value, 0)}
                      style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', background: '#fff', minWidth: '240px' }}
                    >
                      <option value="">-- Choose store photo for Slot 1 --</option>
                      {storeImagePresets.map(p => (
                        <option key={p.path} value={p.path}>{p.label}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      💡 Copy and paste an image URL or upload directly from your device.
                    </span>
                  </div>

                  {/* Step Navigation Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('info')}
                      style={{ padding: '8px 16px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      ⬅ Back to Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('pricing')}
                      style={{ padding: '8px 18px', borderRadius: '6px', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Next: Price & Colours ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TITLE, CATEGORY & SKU */}
              {productModalTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. COASTAL TRAY"
                      value={productModal.title || ''}
                      onChange={(e) => setProductModal({ ...productModal, title: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>SKU (Product Code)</label>
                      <input
                        type="text"
                        placeholder="e.g. G118"
                        value={productModal.sku || ''}
                        onChange={(e) => setProductModal({ ...productModal, sku: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. KuaKua Craft or Pretute"
                        value={productModal.brand || ''}
                        onChange={(e) => setProductModal({ ...productModal, brand: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Main Category</label>
                      <select
                        value={productModal.category || (categories[0]?.slug || 'resin-art')}
                        onChange={(e) => setProductModal({ ...productModal, category: e.target.value, categoryLabel: e.target.options[e.target.selectedIndex].text })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      >
                        {categories.map(c => <option key={c.id || c.slug} value={c.slug}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Sub-Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Jewellery Jars & Trays"
                        value={productModal.subCategory || ''}
                        onChange={(e) => setProductModal({ ...productModal, subCategory: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Categories List (Comma separated breadcrumb list)</label>
                    <input
                      type="text"
                      placeholder="e.g. Gifts, Home Decor, Jewellery Jars & Trays"
                      value={Array.isArray(productModal.categoriesList) ? productModal.categoriesList.join(', ') : (productModal.categoriesList || '')}
                      onChange={(e) => setProductModal({ ...productModal, categoriesList: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Stock Quantity</label>
                      <input
                        type="number"
                        value={productModal.stock !== undefined ? productModal.stock : 25}
                        onChange={(e) => setProductModal({ ...productModal, stock: parseInt(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Badge (Optional, e.g. SALE!, HOT, NEW)</label>
                      <input
                        type="text"
                        placeholder="e.g. NEW"
                        value={productModal.badge || ''}
                        onChange={(e) => setProductModal({ ...productModal, badge: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Available Sizes (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Standard or S, M, L"
                      value={Array.isArray(productModal.sizes) ? productModal.sizes.join(', ') : (productModal.sizes || 'Standard')}
                      onChange={(e) => setProductModal({ ...productModal, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Step Navigation Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('photos')}
                      style={{ padding: '8px 18px', borderRadius: '6px', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Next: 6 Angle Photos ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING & COLOURS */}
              {productModalTab === 'pricing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Selling Price (₹) *</label>
                      <input
                        type="number"
                        required
                        placeholder="589"
                        value={productModal.price || ''}
                        onChange={(e) => setProductModal({ ...productModal, price: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', fontWeight: 700, color: '#047857', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Original MRP (₹) (Strikethrough Price)</label>
                      <input
                        type="number"
                        placeholder="799"
                        value={productModal.originalPrice || ''}
                        onChange={(e) => setProductModal({ ...productModal, originalPrice: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', color: '#64748b', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Live Discount Calculator Preview */}
                  {productModal.price && productModal.originalPrice && productModal.originalPrice > productModal.price && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-tag" style={{ color: '#047857', fontSize: '1.1rem' }}></i>
                      <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>
                        Customer Saving: ₹{(productModal.originalPrice - productModal.price).toFixed(2)} ({Math.round(((productModal.originalPrice - productModal.price) / productModal.originalPrice) * 100)}% Discount Badge will show)
                      </span>
                    </div>
                  )}

                  {/* Colours Palette Input */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A253C' }}>
                        <i className="fa-solid fa-palette" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                        Product Colour Swatches
                      </label>
                      <button
                        type="button"
                        onClick={() => setProductModal({ ...productModal, colors: ['Blue', 'Cream', 'Green', 'Orange', 'Red', 'Yellow'] })}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ Use Coastal Tray Palette
                      </button>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#64748b' }}>
                      Enter color names separated by commas (e.g. Blue, Cream, Green, Orange, Red, Yellow):
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Blue, Cream, Green, Orange, Red, Yellow"
                      value={Array.isArray(productModal.colors) ? productModal.colors.map(c => typeof c === 'object' ? c.name : c).join(', ') : (productModal.colors || '')}
                      onChange={(e) => setProductModal({ ...productModal, colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' }}
                    />

                    {/* Live Preview of Colour Chips */}
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Live Swatches Preview:</span>
                      {(Array.isArray(productModal.colors) && productModal.colors.length > 0
                        ? productModal.colors
                        : ['Blue', 'Cream', 'Green', 'Orange', 'Red', 'Yellow']
                      ).map((c, idx) => {
                        const cName = typeof c === 'object' ? c.name : c;
                        const cHexMap = { blue: '#2B7CD3', cream: '#FFFDF0', green: '#7CC04B', orange: '#E58A32', red: '#DE3B3B', yellow: '#F5E63E' };
                        const hex = typeof c === 'object' && c.hex ? c.hex : (cHexMap[cName.toLowerCase()] || '#E58A32');
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#fff',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: hex, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                            <span>{cName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step Navigation Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('photos')}
                      style={{ padding: '8px 16px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      ⬅ Back to Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('details')}
                      style={{ padding: '8px 18px', borderRadius: '6px', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Next: Description & Specs ➔
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: DESCRIPTION & SPECS */}
              {productModalTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Short Description (Appears below price on product page)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. A beautifully designed starfish-inspired jewellery tray featuring a distinctive coastal shape, smooth glossy surface..."
                      value={productModal.shortDesc || ''}
                      onChange={(e) => setProductModal({ ...productModal, shortDesc: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Detailed Story / Long Description (Appears in Description tab)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Individually handcrafted with artisanal mineral composite and non-toxic resin, this coastal tray captures the serene spirit of the ocean..."
                      value={productModal.longDesc || ''}
                      onChange={(e) => setProductModal({ ...productModal, longDesc: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Dimensions / Size</label>
                      <input
                        type="text"
                        placeholder="e.g. 15cm x 15cm x 3.5cm"
                        value={productModal.dimensions || ''}
                        onChange={(e) => setProductModal({ ...productModal, dimensions: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Material</label>
                      <input
                        type="text"
                        placeholder="e.g. Fine Glazed Ceramic & Mineral Resin Composite"
                        value={productModal.material || ''}
                        onChange={(e) => setProductModal({ ...productModal, material: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Care Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Wipe clean with a damp cloth. Avoid harsh abrasives or dishwashers."
                      value={productModal.care || ''}
                      onChange={(e) => setProductModal({ ...productModal, care: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Search &amp; Related Product Tags (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Corporate Gifts, Home Decor, Jewellery Jars & Trays, coastal tray"
                      value={Array.isArray(productModal.tags) ? productModal.tags.join(', ') : (productModal.tags || '')}
                      onChange={(e) => setProductModal({ ...productModal, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                    <strong style={{ color: '#1A253C' }}>🔗 Related Products:</strong> Products in the same category and sub-category will automatically be suggested as related items on the product page.
                  </div>

                  {/* Step Navigation Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('pricing')}
                      style={{ padding: '8px 16px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      ⬅ Back to Pricing
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px', alignItems: 'center' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(255,91,127,0.3)' }}
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  {productModal.id ? 'Save Changes' : 'Create & Publish Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setProductModal(null)}
                  style={{ padding: '12px 22px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Edit / Create Modal */}
      {bannerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1A253C' }}>{bannerModal.id ? 'Edit Carousel Banner' : 'Create New Carousel Banner'}</h3>
            <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handcrafted Montessori Toys"
                  value={bannerModal.headline || bannerModal.title || ''}
                  onChange={(e) => setBannerModal({ ...bannerModal, headline: e.target.value, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Subtitle Badge</label>
                <input
                  type="text"
                  placeholder="e.g. SPRING/SUMMER COLLECTION or PLAY & GROW"
                  value={bannerModal.subtitle || ''}
                  onChange={(e) => setBannerModal({ ...bannerModal, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Description Text</label>
                <textarea
                  rows={2}
                  placeholder="Promote creative exploration, sensory growth, and active learning..."
                  value={bannerModal.description || ''}
                  onChange={(e) => setBannerModal({ ...bannerModal, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              {/* Banner Image with Upload & Preview */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Banner Photo (Preview, Upload or Preset)
                </label>
                <div style={{ marginBottom: '10px' }}>
                  <img
                    src={getAssetUrl(bannerModal.image || 'assets/hero_fashion.png')}
                    alt="Preview"
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    onError={(e) => { e.target.src = 'assets/hero_fashion.png'; }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], setBannerModal, bannerModal)}
                    style={{ fontSize: '0.82rem', flex: 1 }}
                  />
                  <select
                    value=""
                    onChange={(e) => e.target.value && setBannerModal({ ...bannerModal, image: e.target.value })}
                    style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  >
                    <option value="">Presets...</option>
                    {storeImagePresets.map(p => (
                      <option key={p.path} value={p.path}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Or enter path: assets/hero_fashion.png"
                  value={bannerModal.image || ''}
                  onChange={(e) => setBannerModal({ ...bannerModal, image: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Button 1 Label</label>
                  <input
                    type="text"
                    value={bannerModal.btn1Text || 'Shop Now'}
                    onChange={(e) => setBannerModal({ ...bannerModal, btn1Text: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Button 1 Target Section</label>
                  <input
                    type="text"
                    value={bannerModal.btn1Link || '#home'}
                    onChange={(e) => setBannerModal({ ...bannerModal, btn1Link: e.target.value })}
                    placeholder="#home or #services"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '11px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                >
                  Save Banner
                </button>
                <button
                  type="button"
                  onClick={() => setBannerModal(null)}
                  style={{ padding: '11px 18px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Edit / Create Modal */}
      {categoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1A253C' }}>{categoryModal.id ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resin Art, Wooden Toys, Candle Decor"
                  value={categoryModal.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setCategoryModal({
                      ...categoryModal,
                      name,
                      slug: categoryModal.id ? categoryModal.slug : autoSlug
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Slug (URL Identifier) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. resin-art"
                  value={categoryModal.slug || ''}
                  onChange={(e) => setCategoryModal({ ...categoryModal, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              {/* Category Image with Preview & Upload */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Category Photo
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                  <img
                    src={getAssetUrl(categoryModal.image || 'assets/Arts and Craft.webp')}
                    alt="Preview"
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1', background: '#fff' }}
                    onError={(e) => { e.target.src = 'assets/Logo.png'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Upload from Device:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], setCategoryModal, categoryModal)}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    value=""
                    onChange={(e) => e.target.value && setCategoryModal({ ...categoryModal, image: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  >
                    <option value="">-- Choose preset image --</option>
                    {storeImagePresets.map(p => (
                      <option key={p.path} value={p.path}>{p.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={categoryModal.image || ''}
                    onChange={(e) => setCategoryModal({ ...categoryModal, image: e.target.value })}
                    placeholder="assets/Arts and Craft.webp"
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Category overview..."
                  value={categoryModal.description || ''}
                  onChange={(e) => setCategoryModal({ ...categoryModal, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '11px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryModal(null)}
                  style={{ padding: '11px 18px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {couponModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Create Promo Coupon</h3>
            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Code *</label>
                <input
                  type="text"
                  required
                  value={couponModal.code || ''}
                  onChange={(e) => setCouponModal({ ...couponModal, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER25"
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', textTransform: 'uppercase' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Discount Value</label>
                  <input
                    type="number"
                    required
                    value={couponModal.value || 10}
                    onChange={(e) => setCouponModal({ ...couponModal, value: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Type</label>
                  <select
                    value={couponModal.type || 'percent'}
                    onChange={(e) => setCouponModal({ ...couponModal, type: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Minimum Order Value (₹)</label>
                <input
                  type="number"
                  value={couponModal.minSpend || 0}
                  onChange={(e) => setCouponModal({ ...couponModal, minSpend: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Create Coupon
                </button>
                <button
                  type="button"
                  onClick={() => setCouponModal(null)}
                  style={{ padding: '10px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal for Admin */}
      {invoiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>PRETUTE</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>OFFICIAL INVOICE</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{invoiceModal.id}</strong>
                <div style={{ fontSize: '0.78rem' }}>{new Date(invoiceModal.date).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '14px', color: '#475569' }}>
              <div><strong>Customer:</strong> {invoiceModal.customerName} ({invoiceModal.customerEmail || 'No Email'})</div>
              <div><strong>Phone:</strong> {invoiceModal.customerPhone}</div>
              <div><strong>Address:</strong> {invoiceModal.address}</div>
              <div><strong>Payment:</strong> {invoiceModal.paymentMethod}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '6px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceModal.items?.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px' }}>{it.title}</td>
                    <td style={{ textAlign: 'center', padding: '6px' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{(it.price * it.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '0.95rem', fontWeight: 700, borderTop: '2px solid #e2e8f0', paddingTop: '8px' }}>
              Total: ₹{Math.round(invoiceModal.total).toLocaleString()}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setInvoiceModal(null)}
                style={{ padding: '10px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
