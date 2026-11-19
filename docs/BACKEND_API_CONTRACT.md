# LAU'S Accesorios — API contract (QA)

Base URL: `https://br-broad-block-bc99rqv7-lausapi.compute.c-16.us-east-1.aws.neon.tech`

## Public
- `GET /api/health`: service/branch/storage health descriptor.
- `GET /api/products?q=&category=`: published products, category, available stock and short-lived signed image URLs.
- `GET /api/categories`: visible categories.
- `POST /api/events`: allow-listed anonymous storefront analytics events.

## Authentication
- `/api/auth/*`: same-origin proxy to Neon Managed Auth. Auth cookies are scoped to the API host, Secure and SameSite=None for credentialed browser calls.
- `GET /api/admin/session`: requires a valid Neon Auth session and a matching row in `public.admin_profiles`.
- All other `/api/admin/*` routes require the same admin check. There is no public admin signup.

## Admin catalog and operations
- `GET|POST /api/admin/products`; `PATCH /api/admin/products/:id`.
- `GET|POST /api/admin/categories`.
- `GET /api/admin/inventory`; `POST /api/admin/inventory/adjust` (transactional, cannot make stock negative, writes inventory movement).
- `GET|POST /api/admin/collections`; `PATCH /api/admin/collections/:id`; `PUT /api/admin/collections/:id/products`.
- `GET|POST /api/admin/promotions`; `PATCH /api/admin/promotions/:id`; `PUT /api/admin/promotions/:id/products`.
- `GET|POST /api/admin/sales`; `PATCH /api/admin/sales/:id`.
- `POST /api/admin/images/upload-url`: presigned PUT for image/jpeg, image/png, image/webp, image/avif. Browser CORS is configured for signed PUT requests.
- `POST /api/admin/images`: save image metadata after upload.
- `DELETE /api/admin/images/:id`: delete metadata then the object from Neon Object Storage.
- `GET /api/admin/metrics?days=30`: visitor sessions, WhatsApp click count and top viewed product/category.

## Security notes
- API uses Neon-injected `DATABASE_URL`, `NEON_AUTH_BASE_URL` and S3-compatible `AWS_*` variables. No DB or storage secret belongs in frontend code.
- API checks Neon Auth session and `admin_profiles` before privileged routes. Browser never sets database JWT claims.
- Neon Auth QA email/password signups are disabled. First administrator provisioning is a controlled manual step.
- CORS permits localhost/127.0.0.1 for QA. Before hosting the frontend, set the function's `APP_ORIGIN` to the exact HTTPS origin and add that origin to Neon Auth trusted origins.
- This function and API URL target QA only. Production branch is not modified.


## Rutas añadidas en el código QA (pendientes de despliegue)

- `GET /api/collections` y `GET /api/promotions`: colecciones y promociones activas, con productos publicados asociados.
- `GET /api/store-config`: datos públicos de la tienda.
- `GET|PUT /api/admin/settings`: lectura y edición protegida de datos comerciales.
- `GET|POST /api/admin/products/:id/variants` y `PATCH /api/admin/variants/:id`: variantes y tallas.
- `GET /api/admin/analytics-series?days=30`: serie diaria de visitas/clics y ranking por categoría.

**Importante:** estas rutas están en la rama GitHub QA y pasan revisión sintáctica, pero no deben considerarse operativas hasta desplegar el bundle corregido y probar HTTP contra la Function activa.
