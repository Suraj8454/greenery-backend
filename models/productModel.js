const db = require('../config/db');
const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};
const normalize = (p) => ({
  ...p,
  oldPrice: p.old_price,
  desc: p.description,
  img: p.img || '',
  images: [...new Set([p.img, ...parseJsonArray(p.image_gallery)].filter(Boolean))],
  colors: parseJsonArray(p.color_options),
  collection: p.collection || 'our-products',
  is_active: p.is_active === undefined ? 1 : Number(p.is_active),
  stock_quantity: Number(p.stock_quantity || 0),
  features: p.features || '', benefits: p.benefits || '', how_to_use: p.how_to_use || ''
});
module.exports = {
  findAll: async (category, options = {}) => {
    let q = 'SELECT * FROM products WHERE 1=1'; const params = [];
    if (options.categoryId) { q += ' AND category_id = ?'; params.push(Number(options.categoryId)); } else if (category) { q += ' AND (category = ? OR category_id = (SELECT id FROM categories WHERE slug=? LIMIT 1))'; params.push(category, category); }
    if (options.subcategoryId) { q += ' AND subcategory_id = ?'; params.push(Number(options.subcategoryId)); }
    if (options.activeOnly) q += ' AND is_active=1';
    if (options.collection) { q += ' AND collection = ?'; params.push(options.collection); }
    q += ' ORDER BY created_at DESC';
    const [rows] = await db.query(q, params); return rows.map(normalize);
  },
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] ? normalize(rows[0]) : null;
  },
  create: async (data) => {
    const images = Array.isArray(data.images) ? data.images : [];
    const primary = data.img || images[0] || '';
    const colors = Array.isArray(data.colors) ? data.colors : [];
    const [r] = await db.query(
      'INSERT INTO products (name, price, old_price, category, category_id, subcategory_id, img, image_gallery, color_options, collection, is_active, stock_quantity, sku, tag, rating, reviews, description, features, benefits, how_to_use) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, Number(data.price), data.oldPrice || null, data.category || null, data.category_id || null, data.subcategory_id || null, primary, JSON.stringify(images), JSON.stringify(colors), data.collection || 'our-products', data.is_active === '0' ? 0 : 1, Number(data.stock_quantity || 0), data.sku || null, data.tag || null, Number(data.rating || 4.5), Number(data.reviews || 0), data.desc || '', data.features || '', data.benefits || '', data.how_to_use || '']
    ); return r.insertId;
  },
  update: async (id, data) => {
    const colors = Array.isArray(data.colors) ? data.colors : [];
    const images = Array.isArray(data.images) ? data.images : [];
    const primary = data.img || images[0] || '';
    await db.query(
      'UPDATE products SET name=?, price=?, old_price=?, category=?, category_id=?, subcategory_id=?, img=?, image_gallery=?, color_options=?, collection=?, is_active=?, stock_quantity=?, sku=?, tag=?, rating=?, reviews=?, description=?, features=?, benefits=?, how_to_use=? WHERE id=?',
      [data.name, Number(data.price), data.oldPrice || null, data.category || null, data.category_id || null, data.subcategory_id || null, primary, JSON.stringify(images), JSON.stringify(colors), data.collection || 'our-products', data.is_active === '0' ? 0 : 1, Number(data.stock_quantity || 0), data.sku || null, data.tag || null, Number(data.rating || 4.5), Number(data.reviews || 0), data.desc || '', data.features || '', data.benefits || '', data.how_to_use || '', id]
    );
  },
  delete: async (id) => { await db.query('DELETE FROM products WHERE id = ?', [id]); },
  getCategories: async () => { const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE is_active=1 AND category IS NOT NULL ORDER BY category'); return rows.map(r => r.category); },
  count: async () => { const [rows] = await db.query('SELECT COUNT(*) as c FROM products'); return rows[0].c; },
};
