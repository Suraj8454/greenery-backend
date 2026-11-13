// const express = require("express");
// const db = require("./config/db");

// require("dotenv").config();

// const app = express();

// app.use(express.json());

// app.get("/", (req, res) => {
//     res.json({
//         message: "Server is running"
//     });
// });

// app.get("/test-dbtest", async (req, res) => {
//     try {
//         const [result] = await db.query("SELECT 1 AS result");

//         res.json({
//             success: true,
//             message: "MySQL connected successfully",
//             result
//         });
//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             success: false,
//             message: "MySQL connection failed",
//             error: error.message
//         });
//     }
// });

// app.listen(5000, () => {
//     console.log("Server running on port 5000");
// });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const allowedOrigins = String(process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000,http://localhost:5000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Requests from server-rendered admin pages, curl and same-origin clients may omit Origin.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin is not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// DB setup
async function setupDatabase() {
  const rootConn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }).promise();

  await rootConn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
  await rootConn.end();

  const db = require('./config/db');

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2),
    category VARCHAR(100),
    img VARCHAR(500),
    tag VARCHAR(50),
    rating DECIMAL(3,2) DEFAULT 4.5,
    reviews INT DEFAULT 0,
    description TEXT,
    features TEXT NULL, benefits TEXT NULL, how_to_use TEXT NULL, image_gallery LONGTEXT NULL, color_options TEXT NULL,
    collection VARCHAR(40) NOT NULL DEFAULT 'our-products', is_active TINYINT(1) NOT NULL DEFAULT 1, stock_quantity INT NOT NULL DEFAULT 0, sku VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, slug VARCHAR(140) NOT NULL UNIQUE,
    description TEXT NULL, image VARCHAR(500) NULL, is_active TINYINT(1) DEFAULT 1, sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY, category_id INT NOT NULL, name VARCHAR(120) NOT NULL, slug VARCHAR(140) NOT NULL,
    description TEXT NULL, image VARCHAR(500) NULL, is_active TINYINT(1) DEFAULT 1, sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_subcategory_slug (category_id, slug),
    INDEX idx_subcategory_category (category_id), CONSTRAINT fk_subcategory_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS hero_slides (
    id INT AUTO_INCREMENT PRIMARY KEY, tagline VARCHAR(255) DEFAULT '', title1 VARCHAR(255) NOT NULL, title2 VARCHAR(255) DEFAULT '', title3 VARCHAR(255) DEFAULT '',
    description TEXT NULL, image VARCHAR(500) NOT NULL, button_text VARCHAR(100) DEFAULT 'Shop Now', button_url VARCHAR(255) DEFAULT '/category/Indoor',
    sort_order INT DEFAULT 0, is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add product information fields to existing databases without requiring a reset.
  const ensureColumn = async (table, column, definition) => {
    const [found] = await db.query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [table, column]);
    if (!found.length) { await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`); return true; }
    return false;
  };
  await ensureColumn('products', 'features', 'TEXT NULL');
  await ensureColumn('products', 'benefits', 'TEXT NULL');
  await ensureColumn('products', 'how_to_use', 'TEXT NULL');

  await ensureColumn('products', 'image_gallery', 'LONGTEXT NULL');
  await ensureColumn('products', 'color_options', 'TEXT NULL');
  await ensureColumn('products', 'collection', "VARCHAR(40) NOT NULL DEFAULT 'our-products'");
  await ensureColumn('products', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1');
  const stockColumnAdded = await ensureColumn('products', 'stock_quantity', 'INT NOT NULL DEFAULT 0');
  if (stockColumnAdded) await db.query('UPDATE products SET stock_quantity=20 WHERE stock_quantity=0');
  await ensureColumn('products', 'sku', 'VARCHAR(100) NULL');
  await ensureColumn('products', 'category_id', 'INT NULL');
  await ensureColumn('products', 'subcategory_id', 'INT NULL');

  await db.query(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, slug VARCHAR(280) NOT NULL UNIQUE,
    excerpt TEXT NULL, content LONGTEXT NOT NULL, image VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1, published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, movement_type ENUM('stock_in','stock_out','adjustment') NOT NULL,
    quantity INT NOT NULL, note VARCHAR(500) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inventory_product (product_id), FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )`);


  await db.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address VARCHAR(500), city VARCHAR(100), pincode VARCHAR(10), phone VARCHAR(15),
    payment_method VARCHAR(50),
    subtotal DECIMAL(10,2), shipping DECIMAL(10,2), total DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT, product_name VARCHAR(255), price DECIMAL(10,2), qty INT, image VARCHAR(500),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
  await ensureColumn('order_items', 'selected_color', 'VARCHAR(100) NULL');

  await db.query(`CREATE TABLE IF NOT EXISTS pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255), content LONGTEXT
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255), email VARCHAR(255), message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE,
    is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(100) PRIMARY KEY, setting_value TEXT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS home_sections (
    id INT AUTO_INCREMENT PRIMARY KEY, section_key VARCHAR(100) NOT NULL UNIQUE, title VARCHAR(255) NOT NULL DEFAULT '',
    eyebrow VARCHAR(255) DEFAULT '', description TEXT NULL, image VARCHAR(500) NULL, icon VARCHAR(100) DEFAULT '',
    color VARCHAR(30) DEFAULT '#1a3c2e', accent_color VARCHAR(30) DEFAULT '#2d6a4f', button_text VARCHAR(100) DEFAULT '',
    button_url VARCHAR(255) DEFAULT '', items_json LONGTEXT NULL, sort_order INT DEFAULT 0, is_active TINYINT(1) DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS order_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, status VARCHAR(50) NOT NULL, note VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_timeline_order(order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
  await ensureColumn('orders','expected_delivery_date','DATE NULL');
  await ensureColumn('orders','discount','DECIMAL(10,2) NOT NULL DEFAULT 0');
  await ensureColumn('orders','promo_code','VARCHAR(50) NULL');
  await ensureColumn('orders','payment_status',"VARCHAR(40) NOT NULL DEFAULT 'Pending'");
  await ensureColumn('orders','customer_email','VARCHAR(255) NULL');
  await ensureColumn('orders','customer_name','VARCHAR(150) NULL');
  await ensureColumn('contact_messages','phone','VARCHAR(40) NULL');
  await ensureColumn('contact_messages','status',"VARCHAR(30) NOT NULL DEFAULT 'New'");
  await ensureColumn('contact_messages','admin_note','VARCHAR(500) NULL');
  await ensureColumn('blog_posts','author',"VARCHAR(150) NOT NULL DEFAULT \'Cityscape Team\'");
  await ensureColumn('blog_posts','meta_title','VARCHAR(255) NULL');
  await ensureColumn('blog_posts','meta_description','VARCHAR(320) NULL');
  await ensureColumn('blog_posts','focus_keyword','VARCHAR(160) NULL');
  await ensureColumn('blog_posts','hashtags','TEXT NULL');
  await ensureColumn('blog_posts','category','VARCHAR(120) NULL');
  await ensureColumn('blog_posts','tags','TEXT NULL');
  await ensureColumn('blog_posts','canonical_url','VARCHAR(500) NULL');
  await ensureColumn('blog_posts','meta_robots',"VARCHAR(80) NOT NULL DEFAULT 'index,follow'");
  await ensureColumn('blog_posts','og_title','VARCHAR(255) NULL');
  await ensureColumn('blog_posts','og_description','VARCHAR(320) NULL');
  await ensureColumn('blog_posts','reading_minutes','INT DEFAULT 1');
  await ensureColumn('blog_posts','updated_at','TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  const defaultSections = [
    ['hero_features','Hero trust points','Quick benefits','Short trust statements shown below the hero slides.','','sprout','#1a3c2e','#2d6a4f','','','[{\"title\":\"Wide Range\",\"description\":\"of Plants\",\"icon\":\"sprout\",\"color\":\"#2d6a4f\"},{\"title\":\"Pan India\",\"description\":\"Delivery\",\"icon\":\"truck\",\"color\":\"#2d6a4f\"},{\"title\":\"Secure\",\"description\":\"Checkout\",\"icon\":\"shield-check\",\"color\":\"#2d6a4f\"}]', 5],
    ['hero_stats','Store stats','Impact','Stats displayed on the hero section.','','chart-no-axes-column','#1a3c2e','#a3d9b1','','','[{\"value\":\"500+\",\"label\":\"Plant Varieties\"},{\"value\":\"1000+\",\"label\":\"Happy Customers\"},{\"value\":\"Pan India\",\"label\":\"Delivery\"},{\"value\":\"Wholesale\",\"label\":\"& Retail\"}]', 6],
    ['featured_in','Recognised by voices that inspire.','Featured In','Trusted names celebrating thoughtful design and conscious living.','','newspaper','#253b2e','#2d6a4f','', '', JSON.stringify([{name:'VOGUE',icon:'sparkles',color:'#9ca3af'},{name:'ELLE DECOR',icon:'house',color:'#9ca3af'},{name:'AD',icon:'award',color:'#9ca3af'},{name:'HOME & GARDEN',icon:'leaf',color:'#9ca3af'},{name:'THE HINDU',icon:'book-open',color:'#9ca3af'},{name:'TIMES LIVING',icon:'sun',color:'#9ca3af'}]), 10],
    ['category_section','Shop by Category','Find your fit','Explore our curated categories for every green corner.','','grid-2x2','#1a3c2e','#2d6a4f','Explore categories','/category/Indoor','[]', 30],
    ['trust_badges','A better way to bring green home','Our Promise','Little details that make every order feel special.','','shield-check','#1a3c2e','#2d6a4f','', '', JSON.stringify([{title:'Secure Checkout',description:'Safe and simple payments',icon:'shield-check',color:'#2d6a4f'},{title:'Careful Packaging',description:'Packed with plant-safe care',icon:'package-check',color:'#2d6a4f'},{title:'Plant Parent Support',description:'Here to help you grow',icon:'heart-handshake',color:'#2d6a4f'},{title:'Quality Assured',description:'Thoughtfully selected products',icon:'badge-check',color:'#2d6a4f'}]), 20],
    ['how_it_works','Greener living in three simple steps','How It Works','A simple journey from choosing your favourite to growing beautifully.','','sprout','#1a3c2e','#2d6a4f','Explore products','/category/Indoor', JSON.stringify([{title:'Find your green',description:'Explore plants and planters for every corner.',icon:'search',color:'#2d6a4f'},{title:'We pack with care',description:'Your order is prepared thoughtfully and safely.',icon:'package-check',color:'#2d6a4f'},{title:'Grow beautifully',description:'Unbox, style your space and enjoy the green.',icon:'sprout',color:'#2d6a4f'}]), 40],
    ['why_choose_us','A little more green, a lot more joy','Why Choose Us','Thoughtful products and service for your greener everyday.','/uploads/products/media-1792874674837-905774504.png','leaf','#1a3c2e','#a3d9b1','Discover our story','/about', JSON.stringify([{title:'Handpicked Selection',description:'Every plant and pot is chosen with care.',icon:'leaf',color:'#a3d9b1'},{title:'Safe Packaging',description:'Packed carefully to reach you in great condition.',icon:'package',color:'#a3d9b1'},{title:'Made with Love',description:'We treat every order like our own.',icon:'heart',color:'#a3d9b1'},{title:'Trusted Support',description:'Friendly help whenever you need it.',icon:'award',color:'#a3d9b1'}]), 50],
    ['plant_story','Every plant has a story','Plant Story','Learn to choose, style and care for plants that make your space feel alive.','','book-open','#1a3c2e','#2d6a4f','Read the journal','/blog', JSON.stringify([{title:'Choose the right plant',description:'Match plants to your light and lifestyle.',icon:'sun',color:'#2d6a4f'},{title:'Create your own corner',description:'Style planters to suit your space.',icon:'flower-2',color:'#2d6a4f'},{title:'Care that lasts',description:'Simple routines for happier plants.',icon:'droplets',color:'#2d6a4f'}]), 60],
    ['bulk_order','Bring greenery to every space','Bulk & Corporate Orders','Special pricing for offices, hospitality, events and large projects.','','boxes','#1a3c2e','#2d6a4f','Enquire for bulk orders','/contact', JSON.stringify([{title:'Corporate offices',description:'Create healthier, greener workspaces.',icon:'building-2',color:'#2d6a4f'},{title:'Events & gifting',description:'Thoughtful plant gifts at scale.',icon:'gift',color:'#2d6a4f'},{title:'Custom quantities',description:'Plans tailored to your project.',icon:'package',color:'#2d6a4f'}]), 70],
    ['best_sellers','Our Bestsellers','Customer favourites','The pieces our community keeps coming back for.','','flame','#1a3c2e','#2d6a4f','Shop bestsellers','/category/Indoor','[]', 80],
    ['our_products','Our Products','Made for your space','Find something to make your corner greener.','','leaf','#1a3c2e','#2d6a4f','View all products','/category/Indoor','[]', 90],
    ['new_arrivals','New Arrivals','Fresh finds for your home','Meet the newest additions to our collection.','','sparkles','#1a3c2e','#2d6a4f','Shop new arrivals','/category/Indoor','[]', 100],
    ['testimonials','Loved by our community','Kind words','Real experiences from our customers.','','heart','#1a3c2e','#2d6a4f','','','[]',110]
  ];
  for (const sec of defaultSections) await db.query('INSERT IGNORE INTO home_sections (section_key,title,eyebrow,description,image,icon,color,accent_color,button_text,button_url,items_json,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', sec);
  await db.query(`CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, location VARCHAR(150) DEFAULT '',
    product VARCHAR(150) DEFAULT '', review TEXT NOT NULL, rating TINYINT DEFAULT 5, image VARCHAR(500) DEFAULT '',
    is_active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, discount_type ENUM('percent','flat') DEFAULT 'percent',
    discount_value DECIMAL(10,2) NOT NULL, min_order DECIMAL(10,2) DEFAULT 0, max_discount DECIMAL(10,2) NULL,
    usage_limit INT NULL, used_count INT DEFAULT 0, expires_at DATETIME NULL, is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  {
    const defaults = {
      brand_name: 'Cityscape Greenery', whatsapp_number: '919876543210', mobile_number: '+91 98765 43210',
      hero_tagline: 'Bring Nature Home', hero_title: 'Greener Spaces', hero_description: 'Premium plants, stylish pots, eco-friendly cocopeat and everything you need for a greener, healthier lifestyle.', hero_image_url: '', announcement_text: 'Free shipping on orders above ₹1999', footer_heading: 'Growing a greener tomorrow.', footer_image_url: '', footer_description: 'Bringing nature closer to you with premium plants, stylish pots, and eco-friendly gardening solutions.', footer_cta_text: 'Get in Touch', brand_tagline: 'Conscious plant living', search_placeholder: 'Search products, pots, plants...', footer_quick_title: 'Quick Links', footer_help_title: 'Help', navigation_json: '[{\"name\":\"Home\",\"path\":\"/\"},{\"name\":\"About Us\",\"path\":\"/about\"},{\"name\":\"Blog\",\"path\":\"/blog\"},{\"name\":\"Contact\",\"path\":\"/contact\"}]', footer_quick_links_json: '[{\"name\":\"Home\",\"path\":\"/\"},{\"name\":\"About Us\",\"path\":\"/about\"},{\"name\":\"Contact Us\",\"path\":\"/contact\"},{\"name\":\"Bulk Order\",\"path\":\"/bulk\"},{\"name\":\"My Orders\",\"path\":\"/orders\"}]', footer_help_links_json: '[{\"name\":\"Privacy Policy\",\"path\":\"/privacy\"},{\"name\":\"Terms & Conditions\",\"path\":\"/terms\"},{\"name\":\"Favorites\",\"path\":\"/favorites\"},{\"name\":\"Cart\",\"path\":\"/cart\"}]', footer_newsletter_title: 'Newsletter',
      contact_email: 'hello@cityscapegreenery.com', address: '123 Green Park, New Delhi - 110001',
      instagram_url: '', facebook_url: '', twitter_url: '', free_shipping_threshold: '1999',
      shipping_fee: '99', test_otp_enabled: process.env.NODE_ENV === 'production' ? '0' : '1'
    };
    for (const [key, value] of Object.entries(defaults)) await db.query('INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
  }

  // Bootstrap a development admin only when no admin exists. Production credentials must come from environment.
  const [existingAdmins] = await db.query('SELECT id FROM admins LIMIT 1');
  if (existingAdmins.length === 0) {
    const developmentMode = process.env.NODE_ENV !== 'production';
    const adminEmail = process.env.ADMIN_EMAIL || (developmentMode ? 'admin@cityscape.com' : '');
    const adminPassword = process.env.ADMIN_PASSWORD || (developmentMode ? 'admin123' : '');
    if (!adminEmail || !adminPassword) {
      throw new Error('No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before starting in production.');
    }
    const hashed = await bcrypt.hash(adminPassword, 12);
    await db.query('INSERT INTO admins (email, password) VALUES (?, ?)', [adminEmail, hashed]);
    if (developmentMode) console.log(`Development admin created: ${adminEmail} (change the default password before deployment).`);
  }

  // Default pages
  const [pages] = await db.query('SELECT * FROM pages');
  if (pages.length === 0) {
    await db.query(`INSERT INTO pages (slug, title, content) VALUES
      ('privacy', 'Privacy Policy', '<p>Your privacy is important...</p>'),
      ('terms', 'Terms & Conditions', '<p>By using our site you agree...</p>'),
      ('about', 'About Us', '<p>Cityscape Greenery...</p>')
    `);
  }

  // Sample products
  const [products] = await db.query('SELECT * FROM products LIMIT 1');
  if (products.length === 0 && process.env.NODE_ENV !== 'production') {
    const samples = [
      ['Ribbed Round Pot', 799, 1099, 'Indoor', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=600&h=600', 'Bestseller', 4.8, 125, 'Minimal planter.'],
      ['Matte Beige Planter', 1299, null, 'Indoor', 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&q=80&w=600&h=600', 'New', 4.9, 89, 'Matte finish.'],
      ['Tall Floor Pot', 1899, null, 'Outdoor', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600&h=600', null, 4.7, 210, 'For balcony.'],
      ['Rectangular Planter', 1499, null, 'Planters', 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&q=80&w=600&h=600', null, 4.6, 45, 'Spacious.'],
      ['Stone Finish Pot', 999, 1299, 'Outdoor', 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=600&h=600', '10% Off', 4.5, 67, 'Rustic.'],
    ];
    for (const p of samples) {
      await db.query('INSERT INTO products (name, price, old_price, category, img, tag, rating, reviews, description, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 20)', p);
    }
  }

  // Seed editable categories from existing product categories.
  const [categoryRows] = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND TRIM(category) <> \'\'');
  for (const row of categoryRows) {
    const name = String(row.category).trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await db.query('INSERT IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, 0)', [name, slug]);
  }
  await db.query('UPDATE products p JOIN categories c ON c.name=p.category SET p.category_id=c.id WHERE p.category_id IS NULL');
  const [slideRows] = await db.query('SELECT id FROM hero_slides LIMIT 1');
  if (!slideRows.length) {
    const slides = [
      ['Bring Nature Home','Greener Spaces','for a','Brighter Tomorrow','Premium plants, stylish pots, eco-friendly cocopeat and everything you need for a greener, healthier lifestyle.','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1920','Shop Plants','/category/Indoor',1],
      ['Premium Planters','Crafted Pots','for','Modern Living','Handpicked planters designed to elevate your space with timeless elegance.','https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=1920','Explore Planters','/category/Planters',2],
      ['Green Your World','Every Corner','deserves a','Touch of Green','Discover plants, soil and supplies for every green dream.','https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=1920','Shop Now','/',3]
    ];
    for (const slide of slides) await db.query('INSERT INTO hero_slides (tagline,title1,title2,title3,description,image,button_text,button_url,sort_order) VALUES (?,?,?,?,?,?,?,?,?)', slide);
  }

  console.log('✅ DB setup complete');
}

// Health check for deployment diagnostics.
app.get('/api/health', async (_req, res) => {
  try {
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({ success: true, service: 'cityscape-api', database: 'connected' });
  } catch (error) {
    res.status(503).json({ success: false, service: 'cityscape-api', database: 'unavailable' });
  }
});

// ===== API ROUTES =====
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/orders', require('./routes/api/orders'));
app.use('/api/pages', require('./routes/api/pages'));
app.use('/api/settings', require('./routes/api/settings'));
app.use('/api/slides', require('./routes/api/slides'));
app.use('/api/categories', require('./routes/api/categories'));
app.use('/api/testimonials', require('./routes/api/testimonials'));
app.use('/api/promo-codes', require('./routes/api/promoCodes'));
app.use('/api/contact', require('./routes/api/contact'));
app.use('/api/blogs', require('./routes/api/blogs'));
app.use('/api/sections', require('./routes/api/sections'));

// ===== ADMIN ROUTES =====
app.use('/admin', require('./routes/admin/auth'));
app.use('/admin', require('./routes/admin/dashboard'));
app.use('/admin/products', require('./routes/admin/products'));
app.use('/admin/orders', require('./routes/admin/orders'));
app.use('/admin/users', require('./routes/admin/users'));
app.use('/admin/pages', require('./routes/admin/pages'));
app.use('/admin/settings', require('./routes/admin/settings'));
app.use('/admin/slides', require('./routes/admin/slides'));
app.use('/admin/categories', require('./routes/admin/categories'));
app.use('/admin/subcategories', require('./routes/admin/subcategories'));
app.use('/admin/testimonials', require('./routes/admin/testimonials'));
app.use('/admin/promo-codes', require('./routes/admin/promoCodes'));
app.use('/admin/contact-messages', require('./routes/admin/contactMessages'));
app.use('/admin/newsletter', require('./routes/admin/newsletter'));
app.use('/admin/blog', require('./routes/admin/blog'));
app.use('/admin/inventory', require('./routes/admin/inventory'));
app.use('/admin/sections', require('./routes/admin/sections'));

// Root redirect
app.get('/', (req, res) => res.redirect('/admin'));

// Start server
const PORT = process.env.PORT || 5000;
setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🔐 Admin: http://localhost:${PORT}/admin/login`);
    console.log(`   Email: admin@cityscape.com | Password: admin123`);
  });
}).catch(err => console.error('❌', err));