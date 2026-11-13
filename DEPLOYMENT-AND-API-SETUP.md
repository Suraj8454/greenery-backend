# Cityscape Greenery — Admin and API Setup

## 1. Environment
Copy `.env.example` to `.env` and configure MySQL, `JWT_SECRET`, `CORS_ORIGIN`, and `FRONTEND_URL`. Never commit `.env`.

## 2. Install and run
```bash
npm install
npm run build:css
npm run dev
```
Open the admin panel at `http://localhost:5000/admin/login`. The database bootstrap in `server.js` creates/updates the tables used by this project.

## 3. Frontend connection
In the frontend folder, copy `.env.example` to `.env` and set:
```env
VITE_API_URL=http://localhost:5000/api
```
Then run `npm install` and `npm run dev`. For production, use your deployed backend URL ending in `/api`, and add the frontend's exact origin to the backend `CORS_ORIGIN` value.

## 4. Health check
Open `http://localhost:5000/api/health`. A healthy response includes `success: true` and `database: "connected"`.

## 5. Blog SEO fields
The admin Blog & SEO Studio supports SEO title, description, focus keyword, canonical URL, robots directive, Open Graph title/description, category, tags, author, featured image, publication status and reading time. Public blog API responses include SEO metadata used by the React article page.

## 6. Notes
- Existing schema is upgraded with `ensureColumn` statements; keep a database backup before deployment.
- Use an admin account with a strong password in production. Change/remove the development bootstrap credentials before exposing the admin panel publicly.
- Uploaded images are stored in `public/uploads/products` by the existing upload middleware; configure persistent storage or object storage for production deployments.
