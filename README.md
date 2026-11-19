# LAU'S Accesorios

Tienda digital de joyería, accesorios y moda. Frontend nativo, responsive y sin proceso de compilación.

## Arquitectura actual

- **Tienda pública:** HTML5, CSS3 y JavaScript ES6 en `index.html`.
- **Panel privado:** LAU'S STUDIO en `admin.html`.
- **Estilos y lógica:** `assets/`.
- **Backend de datos:** Neon Data API (PostgREST) + PostgreSQL, con Neon Auth y RLS. Sin API personalizada en Neon Functions.
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

La tienda y el panel consumirán Neon Data API por HTTPS. La integración nativa del frontend está en migración y aún no debe considerarse operativa hasta completar sus pruebas. No introducir datos ficticios como si fueran inventario real. La validación funcional de persistencia, autorización y cargas de Object Storage debe realizarse contra QA antes de usar el sistema operativamente.

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


## Estado de cierre de bloques A–F (QA)

Última revisión: 2026-11-19.

- Se eliminaron los registros de demostración de los paneles y el catálogo de muestra del storefront. La base QA no contiene todavía productos, categorías, ventas, variantes, colecciones ni promociones reales.
- La interfaz incorpora creación de productos con varias imágenes, borrador/publicación, editor de variantes, asociación de productos a colecciones/promociones, ajustes de inventario, formularios de campañas, ajustes de tienda y exportación de ventas CSV.
- La tienda incorpora secciones de colecciones/promociones activas, selector de variantes, galería y salida imprimible para guardar como PDF.
- El esquema de QA incluye `store_settings` con el número comercial de WhatsApp leído desde Neon.
- Los archivos JavaScript y la API pasan validación sintáctica. Esto no sustituye pruebas HTTP ni pruebas en navegador.
- **Bloqueo de despliegue:** Neon reporta el deployment 4 de `lausapi` como `failed` por ausencia del paquete `pg`; el deployment activo sigue siendo el 2. Se añadió un paso de CI para generar un bundle ESM autocontenido y publicarlo como artefacto, pero ese artefacto aún no se ha desplegado en Neon.
- La cuenta administrativa no ha sido creada. El formulario de acceso existe; el alta del primer usuario y su perfil autorizado se hará con el correo que indique el propietario.
- No se ha modificado `main` ni se ha autorizado producción.


## Empaquetado y despliegue de QA

El workflow `Static QA package` debe validarse y actualizarse para empaquetar únicamente el frontend estático y sus pruebas. No se debe volver a compilar ni desplegar `lausapi` como parte del flujo. La rama Neon QA `br-broad-block-bc99rqv7` es el único destino de esta migración. No modificar `main` ni producción sin autorización expresa.
