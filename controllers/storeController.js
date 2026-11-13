const db = require('../config/db');
const ejs = require('ejs');
const path = require('path');
async function renderAdmin(res, view, page, data) { const body = await ejs.renderFile(path.join(__dirname, '..', 'views', 'admin', `${view}.ejs`), data); return res.render('layouts/admin', { page, body }); }
exports.settings = async (_req, res) => {
  try { const [rows] = await db.query('SELECT setting_key, setting_value FROM site_settings'); const settings = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value])); res.json(settings); }
  catch (e) { res.status(500).json({ error: 'Unable to load settings' }); }
};
exports.testimonials = async (_req, res) => {
  try { const [rows] = await db.query('SELECT id, name, location, product, review, rating, image, is_active FROM testimonials WHERE is_active=1 ORDER BY created_at DESC'); res.json(rows); }
  catch (e) { console.error('Testimonials API failed:', e.message); res.status(500).json({ error: 'Unable to load testimonials' }); }
};
exports.validatePromo = async (req, res) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase(); const subtotal = Number(req.body.subtotal || 0);
    if (!code) return res.status(400).json({ error: 'Enter a promo code' });
    const [rows] = await db.query("SELECT * FROM promo_codes WHERE UPPER(code)=? AND is_active=1 AND (expires_at IS NULL OR expires_at > NOW()) AND (usage_limit IS NULL OR used_count < usage_limit) LIMIT 1", [code]);
    const p = rows[0]; if (!p) return res.status(404).json({ error: 'Promo code is invalid or expired' });
    if (subtotal < Number(p.min_order || 0)) return res.status(400).json({ error: `Minimum order value is ₹${p.min_order}` });
    let discount = p.discount_type === 'flat' ? Number(p.discount_value) : subtotal * Number(p.discount_value) / 100;
    if (p.max_discount && p.discount_type === 'percent') discount = Math.min(discount, Number(p.max_discount));
    discount = Math.max(0, Math.min(subtotal, Math.round(discount * 100) / 100));
    res.json({ success: true, code: p.code, discount, discountType: p.discount_type, discountValue: Number(p.discount_value) });
  } catch (e) { res.status(500).json({ error: 'Unable to validate promo code' }); }
};
exports.contact = async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) return res.status(400).json({ error: 'Name, email and message are required' });
    await db.query('INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)', [name.trim(), email.trim(), phone||null, message.trim()]);
    res.status(201).json({ success: true, message: 'Message received' });
  } catch (e) { res.status(500).json({ error: 'Unable to save message' }); }
};
exports.saveSettings = async (req, res) => {
  try {
    const allowed = ['brand_name','whatsapp_number','mobile_number','contact_email','address','hero_tagline','hero_title','hero_description','hero_image_url','announcement_text','footer_heading','footer_description','footer_cta_text','footer_image_url','brand_tagline','search_placeholder','footer_quick_title','footer_help_title','navigation_json','footer_quick_links_json','footer_help_links_json','footer_newsletter_title','instagram_url','facebook_url','twitter_url','youtube_url','pinterest_url','free_shipping_threshold','shipping_fee'];
    for (const key of allowed) if (req.body[key] !== undefined) { const value=String(req.body[key]); if (key.endsWith('_json')) { try { const parsed=JSON.parse(value); if (!Array.isArray(parsed)) return res.status(400).send(`${key} must be a JSON array.`); } catch { return res.status(400).send(`${key} contains invalid JSON.`); } } await db.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)', [key, value]); }
    res.redirect('/admin/settings?saved=1');
  } catch (e) { res.status(500).send('Unable to save settings'); }
};
exports.adminTestimonials = async (_req, res) => { const [rows] = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC'); return renderAdmin(res, 'testimonials', 'testimonials', { testimonials: rows }); };
exports.createTestimonial = async (req, res) => { const { name, location, product, review, rating, image } = req.body; const imagePath=req.file?`/uploads/products/${req.file.filename}`:(image||''); await db.query('INSERT INTO testimonials (name, location, product, review, rating, image) VALUES (?, ?, ?, ?, ?, ?)', [name, location || '', product || '', review, Math.min(5, Math.max(1, Number(rating || 5))), imagePath]); res.redirect('/admin/testimonials'); };
exports.deleteTestimonial = async (req, res) => { await db.query('DELETE FROM testimonials WHERE id=?', [req.params.id]); res.redirect('/admin/testimonials'); };
exports.updateTestimonial = async (req, res) => { const { name, location, product, review, rating, image, is_active } = req.body; const [old]=await db.query('SELECT image FROM testimonials WHERE id=?',[req.params.id]); const imagePath=req.file?`/uploads/products/${req.file.filename}`:(image||old[0]?.image||''); await db.query('UPDATE testimonials SET name=?, location=?, product=?, review=?, rating=?, image=?, is_active=? WHERE id=?', [name, location || '', product || '', review, Math.min(5, Math.max(1, Number(rating || 5))), imagePath, is_active === '0' ? 0 : 1, req.params.id]); res.redirect('/admin/testimonials'); };
exports.adminPromos = async (_req, res) => { const [rows] = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC'); return renderAdmin(res, 'promo-codes', 'promos', { promos: rows }); };
exports.createPromo = async (req, res) => { const { code, discount_type, discount_value, min_order, max_discount, usage_limit, expires_at } = req.body; await db.query('INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [String(code).trim().toUpperCase(), discount_type, Number(discount_value), Number(min_order || 0), max_discount || null, usage_limit || null, expires_at || null]); res.redirect('/admin/promo-codes'); };
exports.togglePromo = async (req, res) => { await db.query('UPDATE promo_codes SET is_active = IF(is_active=1,0,1) WHERE id=?', [req.params.id]); res.redirect('/admin/promo-codes'); };
exports.deletePromo = async (req, res) => { await db.query('DELETE FROM promo_codes WHERE id=?', [req.params.id]); res.redirect('/admin/promo-codes'); };
exports.updatePromo = async (req, res) => { const { code, discount_type, discount_value, min_order, max_discount, usage_limit, expires_at } = req.body; await db.query('UPDATE promo_codes SET code=?, discount_type=?, discount_value=?, min_order=?, max_discount=?, usage_limit=?, expires_at=? WHERE id=?', [String(code).trim().toUpperCase(), discount_type, Number(discount_value), Number(min_order || 0), max_discount || null, usage_limit || null, expires_at || null, req.params.id]); res.redirect('/admin/promo-codes'); };
exports.contactMessages = async (_req, res) => { const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC'); return renderAdmin(res, 'contact-messages', 'messages', { messages: rows }); };
exports.updateContactMessage = async (req,res) => { const status=['New','Contacted','Resolved'].includes(req.body.status)?req.body.status:'Contacted'; await db.query('UPDATE contact_messages SET status=?, admin_note=? WHERE id=?',[status,String(req.body.admin_note||'').slice(0,500),req.params.id]); return res.redirect('/admin/contact-messages'); };
exports.deleteContactMessage = async (req, res) => { await db.query('DELETE FROM contact_messages WHERE id=?', [req.params.id]); return res.redirect('/admin/contact-messages'); };

exports.subscribeNewsletter = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    await db.query('INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active=1', [email]);
    return res.status(201).json({ success: true, message: 'You are subscribed to our newsletter.' });
  } catch (e) { return res.status(500).json({ error: 'Unable to subscribe right now.' }); }
};
exports.newsletterSubscribers = async (_req, res) => {
  const [rows] = await db.query('SELECT id, email, is_active, created_at FROM newsletter_subscribers ORDER BY created_at DESC');
  return renderAdmin(res, 'newsletter', 'newsletter', { subscribers: rows });
};
exports.deleteSubscriber = async (req, res) => { await db.query('DELETE FROM newsletter_subscribers WHERE id=?', [req.params.id]); return res.redirect('/admin/newsletter'); };
exports.toggleSubscriber = async (req, res) => { await db.query('UPDATE newsletter_subscribers SET is_active=IF(is_active=1,0,1) WHERE id=?', [req.params.id]); return res.redirect('/admin/newsletter'); };
exports.createSubscriber = async (req, res) => { const email=String(req.body.email||'').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.redirect('/admin/newsletter'); await db.query('INSERT INTO newsletter_subscribers(email) VALUES (?) ON DUPLICATE KEY UPDATE is_active=1', [email]); return res.redirect('/admin/newsletter'); };

async function renderEntityForm(res,{entity,base,table,id,fields,page,eyebrow}) { const record=id?(await db.query(`SELECT * FROM ${table} WHERE id=?`,[id]))[0][0]:null; if(id&&!record)return res.status(404).send('Record not found'); const body=await ejs.renderFile(path.join(__dirname,'../views/admin/entity-form.ejs'),{entity,base,record,fields,eyebrow}); return res.render('layouts/admin',{page,body}); }
exports.testimonialForm = (req,res)=>renderEntityForm(res,{entity:'testimonial',base:'/admin/testimonials',table:'testimonials',id:req.params.id, page:'testimonials',eyebrow:'Content / Testimonials',fields:[{name:'name',label:'Customer name',required:true},{name:'location',label:'Location'},{name:'product',label:'Product'},{name:'rating',label:'Rating',type:'number',value:5},{name:'review',label:'Review',type:'textarea',full:true,required:true},{name:'image_file',keep:'image',label:'Customer photo',type:'file'}]});
exports.promoForm = (req,res)=>renderEntityForm(res,{entity:'promo code',base:'/admin/promo-codes',table:'promo_codes',id:req.params.id,page:'promos',eyebrow:'Marketing / Promo codes',fields:[{name:'code',label:'Promo code',required:true},{name:'discount_type',label:'Discount type',type:'select',value:'percent',options:[{value:'percent',label:'Percentage'},{value:'flat',label:'Flat amount'}]},{name:'discount_value',label:'Discount value',type:'number',required:true},{name:'min_order',label:'Minimum order',type:'number',value:0},{name:'max_discount',label:'Maximum discount',type:'number'},{name:'usage_limit',label:'Usage limit',type:'number'},{name:'expires_at',label:'Expiry date',type:'datetime-local'}]});
