# LAU'S Accesorios

Tienda digital de joyería, accesorios y moda. Frontend nativo, responsive y sin proceso de compilación.

## Arquitectura actual

- **Tienda pública:** HTML5, CSS3 y JavaScript ES6 en `index.html`.
- **Panel privado:** LAU'S STUDIO en `admin.html`.
- **Estilos y lógica:** `assets/`.
- **Backend:** Neon Functions (Node.js 24) + PostgreSQL.
- **Imágenes:** Neon Object Storage.
- **Repositorio:** GitHub.

El navegador no requiere React, TypeScript, Vite, npm ni Node.js para ejecutar el frontend.

## Prueba local en Windows

1. Descarga el ZIP de la rama `feat/storefront-admin-foundation`.
2. Descomprime el proyecto.
3. Abre PowerShell en la carpeta.
4. Ejecuta:

```powershell
py -m http.server 5173
```

5. Abre `http://localhost:5173` para la tienda o `http://localhost:5173/admin.html` para el panel.

También puedes usar VS Code Live Server abriendo `index.html`.

## Módulos de LAU'S STUDIO

- Dashboard: visitantes, clics a WhatsApp, producto y categoría más vistos.
- Ventas: registro manual e historial.
- Catálogo: productos, categorías, precios y fotografías.
- Inventario: existencias y movimientos.
- Promociones y colecciones.
- Analítica e informes.
- Configuración y acceso administrativo.

## Estado funcional

Las vistas y controles de navegación son interfaz de trabajo. Los productos que se ven actualmente son datos de demostración. El frontend todavía no debe utilizarse para administrar inventario real hasta completar el despliegue de la API, autorización de administradores, persistencia de productos y conexión a Object Storage. El prototipo registra eventos localmente si no existe una URL API configurada; esto no equivale a analítica centralizada.

## QA y producción

- Rama de desarrollo: `feat/storefront-admin-foundation`.
- Neon QA: proyecto `laus-accesorios-qa`, rama `qa`.
- Producción `main` permanece intacta y requiere autorización expresa para cualquier despliegue.

## Catálogo de referencia

El PDF de catálogo es la fuente para importar productos, imágenes, precios y referencias. No se debe copiar su diseño como diseño de la tienda. Los productos demo no representan el inventario real.

## Neon QA API

- Function: `lausapi`
- URL: `https://br-broad-block-bc99rqv7-lausapi.compute.c-16.us-east-1.aws.neon.tech`
- Deployment: Node.js 24, deployment 4 (QA only).
- Public routes: `GET /api/health`, `GET /api/products`, `GET /api/categories`, `POST /api/events`.
- Admin routes: session/auth proxy, products/categories, inventory adjustments, collections, promotions, sales, image upload tickets and image deletion.
- Admin signup is disabled on Neon Auth QA. No administrator profile/user has been created yet; the first admin must be provisioned explicitly.
- The function uses branch-injected Neon environment variables for PostgreSQL, Neon Auth and Object Storage credentials; secrets are not embedded in the frontend.

## Current implementation boundaries

- QA database is currently empty of product, category and sales records. Do not interpret sample content in preview mode as live business data.
- Product creation, initial inventory, product editing, image replacement/deletion, sales entry, inventory adjustments, collection creation and promotion creation are wired to the API.
- Sale entries with a selected product atomically check and decrement stock and write an inventory movement. Manual sales without a product do not alter stock.
- Promotions and collections have API create/update and product-assignment endpoints; the UI currently exposes creation and listing, with advanced assignment/editing still to be completed.
- Live HTTP verification from this environment was not possible. Deployment state is completed and code syntax/CI checks are the available validation; sign-in and browser upload need a local browser test after the first admin account is provisioned.
