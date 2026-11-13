const db = require('../config/db');

module.exports = {
  findByPhone: async (phone) => {
    const [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0];
  },
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },
  create: async ({ name, email, phone }) => {
    const [r] = await db.query(
      'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );
    return r.insertId;
  },
  findAll: async () => {
    const [rows] = await db.query('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC');
    return rows;
  },
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },
};