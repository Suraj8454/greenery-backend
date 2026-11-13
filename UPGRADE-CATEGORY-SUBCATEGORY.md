# Category, subcategory and announcement upgrade

## Included
- MySQL `subcategories` table created automatically on backend startup.
- `products.category_id` and `products.subcategory_id` columns added without dropping old `category` text data.
- Existing product category names are backfilled to `category_id` at startup.
- Admin product form has a category selector and dependent subcategory selector.
- Admin subcategory manager: `/admin/subcategories` (requires admin login).
- `GET /api/categories` returns categories with nested active `subcategories`.
- Product API accepts `categoryId` and `subcategoryId` query parameters.
- Announcement setting supports one announcement per line; storefront loops those lines continuously.

## Setup
1. Replace your existing backend folder with this folder (keep your own `.env`).
2. Run `npm install` then `npm start` (or your existing dev script).
3. Backend startup creates the new table/columns and maps existing category names. No database reset is required.
4. Sign in to admin and open **Subcategories** at `/admin/subcategories` to add subcategories.
5. Edit each product, choose its category, then choose its subcategory and save.
6. Open Website Settings and enter announcements one per line, then save.

## Notes
- Existing `products.category` string is retained for backward compatibility.
- Do not delete/recreate the database. Take a DB backup before deployment as a normal precaution.
