const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Page = require('../models/pageModel');
const ejs = require('ejs');
const path = require('path');
require('dotenv').config();

// Render admin content inside the shared responsive admin layout.
async function renderAdminPage(res, view, data) {
  const body = await ejs.renderFile(path.join(__dirname, '..', 'views', `${view}.ejs`), data);
  return res.render('layouts/admin', { ...data, body });
}

// ===== ADMIN LOGIN (API) =====
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findByEmail(email);
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id, email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Set cookie for admin panel
    res.cookie('adminToken', token, { httpOnly: true, maxAge: 86400000 });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== ADMIN PANEL LOGIN PAGE (EJS) =====
exports.loginPage = (req, res) => {
  res.render('admin/login', { layout: false, error: null });
};

exports.loginSubmit = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findByEmail(email);
    if (!admin) return res.render('admin/login', { layout: false, error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.render('admin/login', { layout: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id, email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('adminToken', token, { httpOnly: true, maxAge: 86400000 });
    res.redirect('/admin');
  } catch (err) {
    res.render('admin/login', { layout: false, error: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/admin/login');
};

// ===== CHANGE PASSWORD =====
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);
    const ok = await bcrypt.compare(currentPassword, admin.password);
    if (!ok) return res.status(400).json({ error: 'Current password incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await Admin.updatePassword(req.admin.id, hashed);
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== ADMIN PANEL VIEWS =====

// Dashboard
exports.dashboardView = async (req, res) => {
  const db = require('../config/db');
  const [[rev]] = await db.query("SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE status <> 'Cancelled'");
  const [[orderCount]] = await db.query('SELECT COUNT(*) AS total FROM orders');
  const [[pending]] = await db.query("SELECT COUNT(*) AS total FROM orders WHERE status IN ('Confirmed','Processing','Packed')");
  const [[userCount]] = await db.query('SELECT COUNT(*) AS total FROM users');
  const [[productCount]] = await db.query('SELECT COUNT(*) AS total FROM products');
  const [[lowCount]] = await db.query('SELECT COUNT(*) AS total FROM products WHERE is_active=1 AND stock_quantity <= 5');
  const [lowStockProducts] = await db.query('SELECT id,name,stock_quantity,img,sku FROM products WHERE is_active=1 AND stock_quantity <= 5 ORDER BY stock_quantity ASC LIMIT 6');
  const [recentOrders] = await db.query('SELECT o.id, COALESCE(o.customer_name,u.name,"Guest") AS customer_name, o.total, o.status, o.created_at FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 8');
  const [monthlyRevenue] = await db.query("SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COALESCE(SUM(total),0) AS revenue FROM orders WHERE status <> 'Cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month ASC");
  const [orderStatuses] = await db.query('SELECT status, COUNT(*) AS total FROM orders GROUP BY status ORDER BY total DESC');
  return renderAdminPage(res, 'admin/dashboard', { page: 'dashboard', revenue:Number(rev.revenue), orders:Number(orderCount.total), pendingOrders:Number(pending.total), users:Number(userCount.total), products:Number(productCount.total), lowStockCount:Number(lowCount.total), lowStockProducts, recentOrders, monthlyRevenue, orderStatuses });
};

// Products list: server-side search, filters and pagination
exports.productsView = async (req, res) => {
  const db = require('../config/db');
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 12;
  const search = String(req.query.search || '').trim().slice(0, 100);
  const category = String(req.query.category || '').trim().slice(0, 100);
  const status = ['active','inactive','low','out'].includes(req.query.status) ? req.query.status : '';
  const where = []; const params = [];
  if (search) { where.push('(name LIKE ? OR sku LIKE ? OR CAST(id AS CHAR) LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (category) { where.push('category = ?'); params.push(category); }
  if (status === 'active') where.push('is_active=1');
  if (status === 'inactive') where.push('is_active=0');
  if (status === 'low') where.push('is_active=1 AND stock_quantity BETWEEN 1 AND 5');
  if (status === 'out') where.push('stock_quantity=0');
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[countRow]] = await db.query(`SELECT COUNT(*) AS total FROM products ${clause}`, params);
  const total = Number(countRow.total || 0);
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, pages);
  const [products] = await db.query(`SELECT * FROM products ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, (safePage - 1) * limit]);
  const [categoryRows] = await db.query("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> '' ORDER BY category");
  return renderAdminPage(res, 'admin/products', { page: 'products', products, filters: { search, category, status }, categories: categoryRows.map(r=>r.category), pagination: { page:safePage, pages, total, limit } });
};

// Product form (add)
exports.productFormView = async (req, res) => {
  const product = req.params.id ? await Product.findById(req.params.id) : null;
  const db = require('../config/db');
  const [categories] = await db.query('SELECT id,name,slug FROM categories WHERE is_active=1 ORDER BY sort_order, name');
  const [subcategories] = await db.query('SELECT id,category_id,name,slug FROM subcategories WHERE is_active=1 ORDER BY sort_order,name');
  return renderAdminPage(res, 'admin/product-form', { page: 'products', product, categories, subcategories });
};

// Create
const parseProductColors = (value) => {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (Array.isArray(parsed)) return parsed.map(c => ({ name: String(c.name || '').trim(), hex: /^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : '#2d6a4f' })).filter(c => c.name);
  } catch {}
  return String(value || '').split(',').map(v => { const [name, hex] = v.trim().split(':'); return { name: (name || '').trim(), hex: /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#2d6a4f' }; }).filter(c => c.name);
};
const orderUploadedImages = (req, existingImages = []) => {
  const uploaded = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  let manifest = [];
  try { manifest = JSON.parse(req.body.imageOrder || '[]'); } catch {}
  if (!Array.isArray(manifest) || !manifest.length) return [...existingImages, ...uploaded].slice(0, 8);
  const result = [];
  for (const entry of manifest) {
    const url = entry.type === 'existing' ? entry.value : uploaded[Number(entry.index)];
    if (url && !result.includes(url) && result.length < 8) result.push(url);
  }
  return result;
};
exports.createProduct = async (req, res) => {
  const images = orderUploadedImages(req);
  const colors = parseProductColors(req.body.colors);
  const db = require('../config/db');
  const [cat] = await db.query('SELECT name FROM categories WHERE id=?', [req.body.category_id || 0]);
  const data = { ...req.body, category: cat[0]?.name || req.body.category || '', colors, images, img: images[0] || '' };
  await Product.create(data);
  res.redirect('/admin/products');
};

// Update
exports.updateProduct = async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) return res.status(404).send('Product not found');
  const retained = Array.isArray(existing.images) ? existing.images : [existing.img].filter(Boolean);
  const images = orderUploadedImages(req, retained);
  const colors = parseProductColors(req.body.colors);
  const db = require('../config/db');
  const [cat] = await db.query('SELECT name FROM categories WHERE id=?', [req.body.category_id || 0]);
  const data = { ...req.body, category: cat[0]?.name || req.body.category || '', colors, images, img: images[0] || '' };
  await Product.update(req.params.id, data);
  res.redirect('/admin/products');
};

// Delete
exports.deleteProduct = async (req, res) => {
  await Product.delete(req.params.id);
  res.redirect('/admin/products');
};

// Orders
exports.ordersView = async (req, res) => {
  const orders = await Order.findAll();
  return renderAdminPage(res, 'admin/orders', { page: 'orders', orders });
};

exports.updateOrderStatus = async (req, res) => {
  await Order.updateStatus(req.params.id, req.body.status);
  res.redirect('/admin/orders');
};

// Users
exports.usersView = async (req, res) => {
  const users = await User.findAll();
  return renderAdminPage(res, 'admin/users', { page: 'users', users, notice: req.query.notice || '' });
};

exports.deleteUser = async (req, res) => {
  try {
    const db = require('../config/db');
    const [orders] = await db.query('SELECT COUNT(*) AS count FROM orders WHERE user_id = ?', [req.params.id]);
    if (orders[0].count > 0) return res.redirect('/admin/users?notice=' + encodeURIComponent('This customer has orders, so the account cannot be deleted without preserving order history.'));
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    return res.redirect('/admin/users?notice=' + encodeURIComponent('Customer deleted successfully.'));
  } catch (err) { return res.status(500).send('Unable to delete user: ' + err.message); }
};

// Pages
exports.pagesView = async (req, res) => {
  const pages = await Page.findAll();
  return renderAdminPage(res, 'admin/pages', { page: 'pages', pages });
};

exports.pageEditView = async (req, res) => {
  const page = await Page.findBySlug(req.params.slug);
  return renderAdminPage(res, 'admin/page-edit', { page: 'pages', pageData: page });
};

exports.updatePage = async (req, res) => {
  await Page.update(req.params.slug, req.body.title, req.body.content);
  res.redirect('/admin/pages');
};

// Settings
exports.settingsView = async (req, res) => {
  const db = require('../config/db');
  const [rows] = await db.query('SELECT setting_key, setting_value FROM site_settings');
  const settings = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
  return renderAdminPage(res, 'admin/settings', { page: 'settings', settings, querySaved: req.query.saved === '1' });
};