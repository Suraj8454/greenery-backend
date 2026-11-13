const Order = require('../models/orderModel');
const db = require('../config/db');

exports.place = async (req, res) => {
  try {
    const { items, address, paymentMethod, promoCode } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty.' });
    if (!address?.address || !address?.city || !address?.pincode || !address?.phone) return res.status(400).json({ error: 'Complete your delivery address.' });

    // Rebuild the cart from database prices; never trust price/total sent by the browser.
    const verifiedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const qty = Math.floor(Number(item.qty));
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) return res.status(400).json({ error: 'Invalid item quantity.' });
      const [rows] = await db.query('SELECT id, name, price, img, color_options, stock_quantity, is_active FROM products WHERE id = ? LIMIT 1', [item.id]);
      if (!rows[0] || Number(rows[0].is_active) !== 1) return res.status(400).json({ error: `Product ${item.id} is no longer available.` });
      const product = rows[0];
      if (Number(product.stock_quantity) < qty) return res.status(400).json({ error: `${product.name} has only ${product.stock_quantity} item(s) in stock.` });
      const price = Number(product.price);
      let selectedColor = null;
      if (item.selectedColor || item.colorName) {
        let options = [];
        try { options = JSON.parse(product.color_options || '[]'); } catch {}
        const requestedHex = String(item.selectedColor || '').toLowerCase();
        const requestedName = String(item.colorName || '').trim().toLowerCase();
        const normalisedOptions = options.map(c => {
          if (c && typeof c === 'object') return { name: String(c.name || ''), hex: String(c.hex || '') };
          const [name, hex] = String(c || '').split(':');
          return { name: name.trim(), hex: (hex || '').trim() };
        });
        const match = normalisedOptions.find(c => (requestedHex && String(c.hex || '').toLowerCase() === requestedHex) || (requestedName && String(c.name || '').trim().toLowerCase() === requestedName));
        if (!match) return res.status(400).json({ error: `Please select a valid colour for ${product.name}.` });
        selectedColor = { name: String(match.name || ''), hex: String(match.hex || '') };
      }
      subtotal += price * qty;
      verifiedItems.push({ id: product.id, name: product.name, price, qty, img: product.img, selectedColor });
    }

    const [settingRows] = await db.query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('free_shipping_threshold','shipping_fee')");
    const settings = Object.fromEntries(settingRows.map(s => [s.setting_key, Number(s.setting_value)]));
    const freeShippingThreshold = Number.isFinite(settings.free_shipping_threshold) ? settings.free_shipping_threshold : 1999;
    const shippingFee = Number.isFinite(settings.shipping_fee) ? settings.shipping_fee : 99;
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
    let discount = 0; let promoId = null;
    if (promoCode) {
      const [promos] = await db.query("SELECT * FROM promo_codes WHERE UPPER(code)=? AND is_active=1 AND (expires_at IS NULL OR expires_at > NOW()) AND (usage_limit IS NULL OR used_count < usage_limit) LIMIT 1", [String(promoCode).trim().toUpperCase()]);
      const promo = promos[0];
      if (!promo) return res.status(400).json({ error: 'Promo code is invalid or expired.' });
      if (subtotal < Number(promo.min_order || 0)) return res.status(400).json({ error: `Minimum order value for this code is ₹${promo.min_order}.` });
      discount = promo.discount_type === 'flat' ? Number(promo.discount_value) : subtotal * Number(promo.discount_value) / 100;
      if (promo.discount_type === 'percent' && promo.max_discount) discount = Math.min(discount, Number(promo.max_discount));
      discount = Math.max(0, Math.min(subtotal, Math.round(discount * 100) / 100));
      promoId = promo.id;
    }
    const total = Math.max(0, subtotal + shipping - discount);
    const orderId = await Order.create(req.user.id, address, paymentMethod || 'cod', subtotal, shipping, total, verifiedItems);
    await db.query('UPDATE orders SET discount=?, promo_code=?, customer_name=COALESCE(?,customer_name), customer_email=(SELECT email FROM users WHERE id=?) WHERE id=?',[discount,promoCode?String(promoCode).trim().toUpperCase():null,address.name||null,req.user.id,orderId]);
    if (promoId) await db.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [promoId]);
    res.status(201).json({ success: true, orderId, subtotal, shipping, discount, total });
  } catch (err) {
    if (err.message.startsWith('INSUFFICIENT_STOCK:')) { const [, name, available] = err.message.split(':'); return res.status(400).json({ error: `${name} has only ${available} item(s) in stock.` }); }
    if (err.message.startsWith('PRODUCT_UNAVAILABLE:')) return res.status(400).json({ error: 'One of the products is no longer available.' });
    console.error('Place order failed:', err.message);
    res.status(500).json({ error: 'Unable to place order. Please try again.' });
  }
};

exports.myOrders = async (req, res) => {
  try { const orders = await Order.findByUser(req.user.id); res.json(orders); }
  catch (err) { res.status(500).json({ error: 'Unable to load your orders.' }); }
};
