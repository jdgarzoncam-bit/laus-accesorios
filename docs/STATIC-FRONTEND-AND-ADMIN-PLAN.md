# LAU'S — native frontend and admin scope

## Decision
The storefront and LAU'S STUDIO UI are moving to native HTML5, CSS3 and JavaScript. The static project can be served locally with Python 3:

```powershell
cd C:\Users\jdgar\Downloads\laus-accesorios
py -m http.server 5173
```

Open http://localhost:5173. Python only serves static files; it does not run the backend. The deployed Neon API remains reachable over HTTPS when configured.

## Dashboard metrics
- Visitors: distinct anonymous sessions for the selected period.
- WhatsApp click-throughs: catalog_events.whatsapp_click; these are purchase intentions, not confirmed sales.
- Most-viewed product: product_view events grouped by product.
- Most-viewed category: product views grouped by category.

## Sales
Manual confirmed sales are separate from WhatsApp click-throughs. Migration 001 adds sales and sale_items with historical item snapshots. Admin writes require server-verified Neon Auth identity and admin_profiles authorization.

## Catalog
The admin experience will manage product drafts/publication, categories, price, inventory, variants, multiple images and catalog PDF. Image uploads must use short-lived signed upload URLs from the server. Replace image by registering new object and metadata first, then deleting the old object after successful update.

## Status
The first HTML/CSS/JS admin shell is a UI prototype with sample values only. Forms and menu interactions are wired for demonstration but do not persist. Backend auth, analytics queries, sales endpoints, product CRUD, storage uploads, and real dashboard data remain to be implemented and verified in QA. No production branch or database has been changed.