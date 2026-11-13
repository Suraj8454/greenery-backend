const db = require('../config/db');

exports.stats = async (_req, res) => {
  try {
    const [[revenueRow]] = await db.query("SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE status <> 'Cancelled'");
    const [[orderRow]] = await db.query('SELECT COUNT(*) AS total FROM orders');
    const [[pendingRow]] = await db.query("SELECT COUNT(*) AS total FROM orders WHERE status IN ('Confirmed','Processing','Packed')");
    const [[userRow]] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[productRow]] = await db.query('SELECT COUNT(*) AS total FROM products');
    const [[lowStockRow]] = await db.query('SELECT COUNT(*) AS total FROM products WHERE is_active=1 AND stock_quantity <= 5');
    const [lowStockProducts] = await db.query('SELECT id,name,stock_quantity,img,sku FROM products WHERE is_active=1 AND stock_quantity <= 5 ORDER BY stock_quantity ASC, name ASC LIMIT 8');
    const [recentOrders] = await db.query('SELECT o.id, COALESCE(o.customer_name,u.name,"Guest") AS customer_name, o.total, o.status, o.created_at FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 8');
    const [monthlyRevenue] = await db.query("SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COALESCE(SUM(total),0) AS revenue FROM orders WHERE status <> 'Cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month ASC");
    const [statusRows] = await db.query('SELECT status, COUNT(*) AS total FROM orders GROUP BY status ORDER BY total DESC');
    res.json({ revenue: Number(revenueRow.revenue), orders: Number(orderRow.total), pendingOrders: Number(pendingRow.total), users: Number(userRow.total), products: Number(productRow.total), lowStockCount: Number(lowStockRow.total), lowStockProducts, recentOrders, monthlyRevenue, orderStatuses: statusRows });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Unable to load dashboard statistics' });
  }
};
