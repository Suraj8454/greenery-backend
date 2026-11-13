# Cityscape Admin — Separate Add/Edit Pages

This package is based on the backend archive supplied in this conversation. It changes the admin workflow to list-first pages with dedicated create/edit screens for Categories, Hero Slider, Promo Codes, Testimonials, and Blog posts. Products already use dedicated product form pages.

## Apply
1. Back up your current backend folder and database.
2. Extract this ZIP over the backend project (merge folders). Do not overwrite your local `.env`.
3. Run `npm install` only if dependencies are missing.
4. Run `npm run build:css`, then `npm run dev`.
5. Open `/admin` and verify each list, Add, Edit, and Delete action.

## Notes
- Lists use compact tables with client-side search, so many records do not create a long page of stacked edit forms.
- Add and Edit open separate URLs (`/new` and `/:id/edit`).
- Existing POST handlers and database columns are reused.
- Homepage sections, contact enquiries, orders, customers, inventory, newsletter, and store settings retain their existing workflows in this update; they are not represented as arbitrary CRUD forms because their data models/actions differ.
- This package has not been run against your live MySQL instance. Test using a database backup first.
- `.env` is intentionally excluded. Keep your own credentials private.
