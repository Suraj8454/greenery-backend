const db = require('../config/db');

module.exports = {
  findBySlug: async (slug) => {
    const [rows] = await db.query('SELECT * FROM pages WHERE slug = ?', [slug]);
    return rows[0];
  },
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM pages');
    return rows;
  },
  update: async (slug, title, content) => {
    await db.query('UPDATE pages SET title=?, content=? WHERE slug=?', [title, content, slug]);
  },
  saveMessage: async (name, email, message) => {
    await db.query('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
  },
  getMessages: async () => {
    const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return rows;
  },
};