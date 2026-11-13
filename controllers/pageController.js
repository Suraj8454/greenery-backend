const Page = require('../models/pageModel');

exports.get = async (req, res) => {
  const page = await Page.findBySlug(req.params.slug);
  if (!page) return res.status(404).json({ error: 'Not found' });
  res.json(page);
};

exports.contact = async (req, res) => {
  const { name, email, message } = req.body;
  await Page.saveMessage(name, email, message);
  res.json({ success: true });
};