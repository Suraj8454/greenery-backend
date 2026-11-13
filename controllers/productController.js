const Product = require('../models/productModel');
exports.list = async (req, res) => {
  try {
    const products = await Product.findAll(req.query.category, { activeOnly: true, collection: req.query.collection, categoryId: req.query.categoryId, subcategoryId: req.query.subcategoryId });
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.get = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.is_active) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.categories = async (_req, res) => {
  try { const cats = await Product.getCategories(); res.json(cats); }
  catch (err) { res.status(500).json({ error: err.message }); }
};
