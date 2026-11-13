# Cityscape Greenery backend upgrade

## What changed
- Product create and edit forms now accept an image file upload (JPG/PNG/WEBP/GIF, max 5 MB). Editing without selecting a new file keeps the old image.
- Fixed product edit form routing: HTML POST now updates the selected product.
- Added public APIs for website settings, testimonials, contact submission, and promo validation.
- Added admin pages to manage site contact/social/shipping settings, testimonials, promo codes, and view contact messages.
- Added customer delete action. Customers with existing orders are intentionally protected to preserve order history.
- Order creation reads product prices from MySQL and recalculates totals server-side, including shipping settings and promo discounts.
- OTP 1234 is intended for local development/testing only. Production SMS OTP needs an SMS provider integration.

## Setup
1. Keep your existing `.env` file. Do not replace it with `.env.example`.
2. Ensure `.env` has the DB settings already used by your project and a long random `JWT_SECRET`.
3. For local test OTP, set `NODE_ENV=development` and `TEST_OTP_ENABLED=1` in `.env`.
4. Install dependencies: `npm install`
5. Rebuild admin Tailwind CSS: `npm run build:css`
6. Start backend: `npm run dev`
7. Admin panel: `http://localhost:5000/admin/login`

Existing database tables are retained. The server creates `site_settings`, `testimonials`, `promo_codes`, `categories`, and `hero_slides` on startup; it also adds `features`, `benefits`, and `how_to_use` to an existing `products` table if needed.

## New admin pages
- `/admin/settings` — business contact, WhatsApp, social URLs, shipping threshold/fee
- `/admin/slides` — create, edit, hide, reorder, upload and delete hero slides
- `/admin/categories` — create, edit, hide, reorder and delete categories
- `/admin/testimonials` — create/edit/hide/delete testimonials
- `/admin/promo-codes` — create/edit/enable/disable/delete promo codes
- `/admin/contact-messages` — view/delete messages submitted from the website
- `/admin/newsletter` — add, enable/disable and delete subscribers

## Upload notes
Images are saved under `public/uploads/products`. On hosting platforms with an ephemeral filesystem, use persistent storage or finish Cloudinary configuration before production deployment.


### Storefront API endpoints
- `GET /api/products`, `GET /api/products/:id`, `GET /api/products/categories/list`
- `POST /api/auth/signup`, `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `GET /api/auth/me`
- `POST /api/orders`, `GET /api/orders` (customer token required)
- `POST /api/promo-codes/validate`
- `GET /api/testimonials`, `GET /api/pages/:slug`, `GET /api/settings`, `GET /api/slides`, `GET /api/categories`
- `POST /api/contact`, `POST /api/contact/newsletter`

Product create/edit, user deletion, order status changes, page editing, site settings, testimonials, promo codes, contact messages, and newsletter management are handled by authenticated admin routes and the EJS admin interface.

Additional admin features in this bundle:
- `/admin/promo-codes` — create, edit, enable/disable and delete promo codes.
- `/admin/testimonials` — create, edit, hide/show and delete testimonials.
- `/admin/newsletter` — review and delete newsletter subscribers.
- `/admin/settings` — edit announcement bar, brand, contact details, WhatsApp, social URLs, shipping threshold and shipping fee. Use `/admin/slides` for hero content.
- The newsletter table is created automatically during startup.


### New content controls
- Admin sidebar now includes Hero slider and Categories.
- Manage slides at `/admin/slides` and categories at `/admin/categories`.
- Product create/edit includes Features, Benefits, and How to use/care fields. Existing MySQL databases are migrated automatically when the server starts.
- Contact messages can be deleted; newsletter entries can be added, enabled/disabled, and deleted. Testimonials and promo codes remain editable in the admin panel.
- WhatsApp links read `whatsapp_number` from Site Settings and use it for footer, floating button, product details, and bulk-order CTA.

Product features, benefits and how-to-use/care instructions are stored with each product and displayed on its product detail page. WhatsApp URLs throughout the storefront use the current `whatsapp_number` setting.


## V4 product, inventory and blog features
- Product forms now accept multiple gallery images, comma-separated colour swatches (`Name:#hex`), SKU, stock quantity, Active/Inactive status and a homepage collection (New Arrival, Most Loved Pots, Our Products).
- Inventory page: `/admin/inventory`. Stock-in, stock-out and quantity adjustments are logged; successful orders decrement stock inside a transaction and record a stock-out movement.
- Blog admin: `/admin/blog`; public listing: `/blog`; article links: `/blog/:slug`. Upload a cover image and set Published/Draft.
- Upload image files for categories, hero slides, testimonials, products and blog articles. Images are stored under `public/uploads/products` and served from `/uploads/products/...`.
- New columns and the `blog_posts` / `inventory_movements` tables are created automatically on backend startup. Existing products receive a starting stock of 20 only when the stock column is first introduced; review quantities in Inventory after migration.
- Testimonial component now renders a helpful empty state when no active testimonials are returned, rather than leaving a blank white section. Check `/api/testimonials` if existing reviews still do not appear.
