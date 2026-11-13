const db = require('../config/db');

module.exports = {
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0];
  },
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0];
  },
  updatePassword: async (id, hashed) => {
    await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, id]);
  },
};