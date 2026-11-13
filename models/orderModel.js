const db = require('../config/db');

module.exports = {
  create: async (userId, address, paymentMethod, subtotal, shipping, total, items) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // Lock stock rows so two simultaneous checkouts cannot sell the same units.
      const requested = new Map();
      for (const item of items) requested.set(Number(item.id), (requested.get(Number(item.id)) || 0) + Number(item.qty));
      for (const [productId, requestedQty] of requested) {
        const [rows] = await conn.query('SELECT name, stock_quantity, is_active FROM products WHERE id=? FOR UPDATE', [productId]);
        if (!rows.length || Number(rows[0].is_active) !== 1) throw new Error(`PRODUCT_UNAVAILABLE:${rows[0]?.name || productId}`);
        if (Number(rows[0].stock_quantity) < requestedQty) throw new Error(`INSUFFICIENT_STOCK:${rows[0].name}:${rows[0].stock_quantity}`);
      }
      const [r] = await conn.query(
        `INSERT INTO orders (user_id, customer_name, address, city, pincode, phone, payment_method, subtotal, shipping, total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')`,
        [userId, address.name || null, address.address, address.city, address.pincode, address.phone, paymentMethod, subtotal, shipping, total]
      );
      const orderId = r.insertId;
      await conn.query('INSERT INTO order_timeline(order_id,status,note) VALUES(?,?,?)',[orderId,'Confirmed','Order placed successfully']);
      for (const item of items) {
        await conn.query(
          'INSERT INTO order_items (order_id, product_id, product_name, price, qty, image, selected_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [orderId, item.id, item.name, item.price, item.qty, item.img, item.selectedColor ? JSON.stringify(item.selectedColor) : null]
        );
        await conn.query('UPDATE products SET stock_quantity=stock_quantity-? WHERE id=?', [item.qty, item.id]);
        await conn.query('INSERT INTO inventory_movements(product_id,movement_type,quantity,note) VALUES(?,?,?,?)', [item.id, 'stock_out', item.qty, `Order #${orderId}`]);
      }
      await conn.commit();
      return orderId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { conn.release(); }
  },
  findByUser: async (userId) => {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    for (const o of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      const [timeline] = await db.query('SELECT status,note,created_at FROM order_timeline WHERE order_id=? ORDER BY created_at ASC',[o.id]);
      o.items = items; o.timeline = timeline;
    }
    return orders;
  },
  findAll: async () => {
    const [orders] = await db.query('SELECT o.*, u.name AS customer_name, u.email AS user_email, u.phone AS user_phone FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC');
    for (const o of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      const [timeline] = await db.query('SELECT status,note,created_at FROM order_timeline WHERE order_id=? ORDER BY created_at ASC',[o.id]);
      o.items = items; o.timeline = timeline;
    }
    return orders;
  },
  updateStatus: async (id, status) => {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  },
  getRevenue: async () => {
    const [rows] = await db.query('SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status != "Cancelled"');
    return rows[0].total;
  },
  count: async () => {
    const [rows] = await db.query('SELECT COUNT(*) as c FROM orders');
    return rows[0].c;
  },
  recent: async (limit = 5) => {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?', [limit]);
    return rows;
  },
  monthlyRevenue: async () => {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as revenue
      FROM orders WHERE status != 'Cancelled'
      GROUP BY month ORDER BY month DESC LIMIT 6
    `);
    return rows.reverse();
  },
};