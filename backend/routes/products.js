const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET all products with optional filtering and search
router.get('/', (req, res) => {
  let products = db.read('products');
  const { category, search, stock, status, featured } = req.query;

  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }
  if (stock && stock !== 'all') {
    products = products.filter(p => p.stockStatus === stock || (stock === 'in_stock' && p.stock > 0) || (stock === 'out_of_stock' && p.stock <= 0));
  }
  if (status && status !== 'all') {
    products = products.filter(p => p.status === status);
  }
  if (featured === 'true') {
    products = products.filter(p => p.featured === true);
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.shortDesc?.toLowerCase().includes(q) ||
      p.categoryLabel?.toLowerCase().includes(q)
    );
  }

  res.json(products);
});

// GET single product by ID
router.get('/:id', (req, res) => {
  const products = db.read('products');
  const product = products.find(p => String(p.id) === String(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// Middleware to verify admin authentication for product modifications
const requireAdminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Admin authentication required to modify products' });
  }
  const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid admin token' });
  }
  next();
};

// POST create new product
router.post('/', requireAdminAuth, (req, res) => {
  const products = db.read('products');
  const newProduct = {
    id: Date.now(),
    title: req.body.title || 'Untitled Product',
    category: req.body.category || 'general',
    categoryLabel: req.body.categoryLabel || req.body.category,
    subCategory: req.body.subCategory || '',
    categoriesList: req.body.categoriesList || [],
    sku: req.body.sku || `G${Math.floor(100 + Math.random() * 900)}`,
    brand: req.body.brand || 'KuaKua Craft',
    colors: req.body.colors || [],
    tags: req.body.tags || [],
    image: req.body.image || 'assets/coastal_tray_1.jpg',
    images: req.body.images && req.body.images.length > 0 ? req.body.images : [req.body.image || 'assets/coastal_tray_1.jpg'],
    originalPrice: parseFloat(req.body.originalPrice) || 0,
    price: parseFloat(req.body.price) || 0,
    discount: req.body.discount ? parseInt(req.body.discount) : 0,
    stock: parseInt(req.body.stock) || 0,
    stockStatus: (parseInt(req.body.stock) || 0) > 0 ? 'in_stock' : 'out_of_stock',
    rating: parseFloat(req.body.rating) || 5.0,
    reviewsCount: parseInt(req.body.reviewsCount) || 0,
    badge: req.body.badge || '',
    shortDesc: req.body.shortDesc || '',
    longDesc: req.body.longDesc || '',
    sizes: req.body.sizes || ['Standard'],
    featured: req.body.featured || false,
    status: req.body.status || 'active',
    availability: req.body.availability || 'available',
    createdAt: new Date().toISOString()
  };

  products.unshift(newProduct);
  db.write('products', products);
  res.status(201).json(newProduct);
});

// PUT update product
router.put('/:id', requireAdminAuth, (req, res) => {
  const products = db.read('products');
  const index = products.findIndex(p => String(p.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const stockNum = req.body.stock !== undefined ? parseInt(req.body.stock) : products[index].stock;
  products[index] = {
    ...products[index],
    ...req.body,
    id: products[index].id,
    stock: stockNum,
    stockStatus: req.body.stockStatus || (stockNum > 0 ? 'in_stock' : 'out_of_stock')
  };

  db.write('products', products);
  res.json(products[index]);
});

// PATCH toggle stock status
router.patch('/:id/stock', requireAdminAuth, (req, res) => {
  const products = db.read('products');
  const prod = products.find(p => String(p.id) === String(req.params.id));
  if (!prod) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (prod.stockStatus === 'out_of_stock' || prod.stock <= 0) {
    prod.stockStatus = 'in_stock';
    if (prod.stock <= 0) prod.stock = 15;
  } else {
    prod.stockStatus = 'out_of_stock';
    prod.stock = 0;
  }

  db.write('products', products);
  res.json(prod);
});

// PATCH toggle active/deactivated status
router.patch('/:id/status', requireAdminAuth, (req, res) => {
  const products = db.read('products');
  const prod = products.find(p => String(p.id) === String(req.params.id));
  if (!prod) {
    return res.status(404).json({ message: 'Product not found' });
  }

  prod.status = prod.status === 'deactivated' ? 'active' : 'deactivated';
  db.write('products', products);
  res.json(prod);
});

// DELETE product
router.delete('/:id', requireAdminAuth, (req, res) => {
  let products = db.read('products');
  const initialLength = products.length;
  products = products.filter(p => String(p.id) !== String(req.params.id));

  if (products.length === initialLength) {
    return res.status(404).json({ message: 'Product not found' });
  }

  db.write('products', products);
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = router;
