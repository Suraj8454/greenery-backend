# Cityscape Greenery — Test Checklist

## Storefront API / design
- [ ] Set `VITE_API_URL` to the backend `/api` URL.
- [ ] Confirm original hero and section styling still looks like the supplied frontend.
- [ ] Change Featured In title, description, card names and colours; refresh storefront.
- [ ] Repeat for Trust Badges, How It Works, Why Choose Us, Plant Story and Bulk Orders.
- [ ] Change Our Bestsellers, Our Products, New Arrivals and category headings in Headings & Subheadings; refresh.
- [ ] Hide a section and confirm it disappears; show it again.
- [ ] Add/edit a hero slide and upload a local image; verify it appears on the storefront.
- [ ] Create/edit a category and verify it appears on the storefront.
- [ ] Add/publish a testimonial and confirm it appears; hide it and confirm it disappears.
- [ ] Create a promo code, validate at checkout, test minimum order and expiry.
- [ ] Submit contact form and newsletter; confirm both appear in admin.

## Admin tables
- [ ] Product create/edit/delete and image upload.
- [ ] Testimonials create/edit/hide/delete.
- [ ] Promo code create/edit/enable/disable/delete.
- [ ] Blog create/edit/draft/publish/delete; test tags, hashtags without `#`, featured image, category, SEO fields and scheduled publish date.
- [ ] Hero slider create/edit/hide/delete.
- [ ] Category create/edit/hide/delete.
- [ ] Contact enquiry status: New → Contacted → Resolved; confirm row background/badge changes; save private note; delete test message.

## Orders / invoice
- [ ] Place a COD test order with at least one product.
- [ ] Confirm customer name, email, phone, address and ordered item image/quantity appear in admin.
- [ ] Confirm subtotal, shipping, discount, promo code and total are correct.
- [ ] Change expected delivery date, order status and payment status; add timeline note.
- [ ] Confirm customer order page displays ETA and timeline.
- [ ] Download invoice PDF and verify brand name, order ID, customer, delivery, items, quantities, right-aligned amounts, totals and page numbers.
- [ ] Test an order with more than five line items to verify invoice pagination.

## Before production
- [ ] Run frontend `npm run build` and resolve any build errors.
- [ ] Use a production database backup and verify migrations.
- [ ] Change admin password and use a strong `JWT_SECRET`.
- [ ] Set `NODE_ENV=production` and disable `TEST_OTP_ENABLED`.
- [ ] Configure persistent image storage and real payment provider credentials if online payments are enabled.
