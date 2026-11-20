# LAU'S Accesorios

Tienda digital de joyería, accesorios y moda. Frontend nativo, responsive y sin proceso de compilación.

## Arquitectura actual

- **Tienda pública:** HTML5, CSS3 y JavaScript ES6 en `index.html`.
- **Panel privado:** LAU'S STUDIO en `admin.html`.
- **Estilos y lógica:** `assets/`.
- **Datos:** Neon Data API (PostgREST) + PostgreSQL, con Neon Auth y RLS.
- **Fotografías:** Neon Object Storage; un Neon Function independiente emite enlaces temporales de carga, sin gestionar productos ni datos comerciales.
- **Imágenes:** Neon Object Storage con enlaces de carga firmados de corta duración.
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
- Catálogo: productos, categorías, precios y fotografías.
- Inventario: existencias y movimientos.
- Promociones y colecciones.
- Analítica básica de visitas e intención de compra.
- Configuración y acceso administrativo.

## Estado funcional

La tienda y el panel consultan Neon Data API directamente mediante el SDK oficial. El panel utiliza Neon Auth y verifica el perfil administrador antes de mostrar las funciones privadas. No se implementa checkout ni registro de compras: el carrito se envía a WhatsApp.

## QA y producción

- Rama de desarrollo: `feat/storefront-admin-foundation`.
- Neon QA: proyecto `laus-accesorios-qa`, rama `qa`.
- Producción `main` permanece intacta y requiere autorización expresa para cualquier despliegue.

## Catálogo de referencia

El PDF de catálogo es la fuente para importar productos, imágenes, precios y referencias. No se debe copiar su diseño como diseño de la tienda. Los productos demo no representan el inventario real.

## Neon Data API QA

- Branch: `br-broad-block-bc99rqv7` (QA only).
- Data API: `https://ep-purple-dream-bceofn8m.apirest.c-16.us-east-1.aws.neon.tech/neondb/rest/v1`.
- Authentication provider: Neon Auth / Better Auth.
- Exposed schema: `public`; anonymous role: `anonymous`; broad default grants disabled.
- RLS is enabled on all 15 public tables. Public read access is restricted to catalog data; authenticated writes require `public.is_laus_admin()`.
- The former `lausapi` Neon Function has been deleted from QA. Only `lausimgupload` remains, dedicated exclusively to issuing temporary image-upload URLs.
- Public sign-up is disabled on the QA branch. One administrator profile exists for the authorized store account. The private invitation flow for up to two additional administrators remains pending; no invitations have been issued.
- Object Storage bucket: `laus-product-images` (`public_read`). The Neon Function `lausimgupload` is deployed (deployment 3, Node.js 24). Its current source validates the admin profile and signs S3 PUT requests using a corrected AWS SigV4 canonical request. The browser upload still needs a real end-to-end test from the published QA frontend.


## Integración actual

- `assets/neon-client.js` inicializa `@neon/neon-js` para Data API y Neon Auth.
- `assets/storefront.js` consulta directamente productos, categorías, inventario, imágenes y promociones; calcula el mejor descuento vigente y prepara el carrito para WhatsApp.
- `assets/admin.js` autentica con Neon Auth y valida `admin_profiles`; gestiona productos, inventario, promociones, colecciones y configuración.
- `backend/functions/image-signer/` contiene el firmador mínimo de enlaces de carga de Object Storage. No gestiona catálogo ni ventas.
- `lausapi` fue eliminado de la rama QA. No quedan llamadas `/api/*` en los scripts activos de tienda y administrador.


## Estado de migración (QA)

- El esquema de negocio y los datos se conservan en Neon QA.
- Neon Data API está activa con Neon Auth como proveedor.
- Se aplicó `db/migrations/0003_neon_data_api_security.sql`: grants de lectura pública limitados, eventos anónimos permitidos y escrituras autenticadas condicionadas a un perfil administrador.
- Se verificó que las 15 tablas públicas mantienen RLS habilitado; el rol anónimo lee configuración pública y no ve ventas; sin identidad no obtiene permisos de administrador.
- La migración de llamadas frontend y operaciones RPC sigue en curso. No hay usuarios administradores ni productos reales aún.
- No se modificó `main` ni producción.


## QA y publicación

El workflow `Static QA package` valida JavaScript y empaqueta el frontend estático. No instala ni empaqueta Neon Functions. La entrega se mantiene en `feat/storefront-admin-foundation`; no modificar `main` ni producción sin autorización expresa.


## Current QA audit (2026-11-20)

- GitHub default branch: `main`. Working branch: `feat/storefront-admin-foundation`; there is no Git branch named `qa`.
- Neon QA: project `dawn-cherry-24723488`, branch `qa` (`br-broad-block-bc99rqv7`). The frontend config points to this QA branch.
- Neon Auth: one user and one `admin_profiles` row exist for the authorized administrator. Public sign-up is disabled. Localhost is allowed and `https://jdgarzoncam-bit.github.io` is in the trusted-origin allowlist. The account's `emailVerified` flag is false, but email verification is not required by the current QA configuration.
- The `customer_reviews` table exists; the Data API schema configuration was refreshed. The table currently contains no reviews.
- QA data inventory: 7 visible categories; 1 published product (`Arete`, reference `1100`); 0 product image records; 0 collections; 0 published reviews; 0 delivered orders. The product row remained after its initial image upload failed and can be recovered with the new retry action in the QA admin.
- Object Storage bucket `laus-product-images` exists (`public_read`) but contains no objects.
- PDF processing is currently heuristic: it renders each page, proposes rectangular crops, and requires the operator to review and manually enter product name, reference, price, and category. It does not extract prices/text or semantically identify product boundaries yet.
- Brand/supplier collections are implemented in QA: assign a brand to products, select multiple existing products in the Collections module, sync and publish the brand collection, and filter the public catalog to that collection. The public collection display and end-to-end sync still need browser QA.
- The admin sidebar tooltip stacking fix is in QA CSS. The product form, screenshot/PDF import, and CSV template now include brand/provider metadata.
- The image signer now checks `admin_profiles` and uses a corrected AWS SigV4 canonical request; deployment 3 completed. A browser PUT and object appearance in storage remain to be verified.


## GitHub Pages and current QA delivery

- Expected project site URL: `https://jdgarzoncam-bit.github.io/laus-accesorios/`.
- Neon Auth trusted origin: `https://jdgarzoncam-bit.github.io` (origin only; the repository path is not part of the browser origin).
- The current changes remain on `feat/storefront-admin-foundation` and have not been merged or published to `main`.


## Actualización de interfaz y catálogo (QA)

- La portada usa la composición editorial con cielo azul, nubes rosadas y accesorios de joyería en la imagen de cabecera.
- El catálogo conserva tarjetas por producto; el detalle se abre en modal y la bolsita se presenta como panel lateral.
- El alta de productos usa una consulta explícita por referencia y actualiza el registro existente o inserta uno nuevo, en lugar de depender de un upsert que podía devolver `products_reference_key`.
- La descarga para Instagram no incorpora precio. Incluye fotografía, marca LAU'S, colección/proveedor, URL pública y símbolo de WhatsApp.
- El PDF tiene portada floral rosa con el logotipo LAU'S y una página por producto con fotografía, marca, colección, sitio y WhatsApp, sin precio.
- La rama de trabajo es `feat/storefront-admin-foundation`; los cambios siguen separados de `main` y GitHub Pages.
- Pendiente antes de publicación: pruebas visuales en navegador (desktop/móvil), carga real desde el formulario de alta y revisión del PDF en la impresión del navegador.


## Auditoría correctiva de interfaz (20 nov 2026)

- La captura local mostraba una versión distinta de la rama QA: el DOM del navegador local referencia `hero-reference.webp` y `laus-logo.svg` sin el prefijo `assets/`; en el repositorio los recursos viven dentro de `assets/`. Esto confirma una carpeta local/ZIP desactualizada o con rutas relativas distintas.
- La rama actual usa `./assets/laus-hero.svg`; se reforzó la portada con una imagen de fondo de respaldo, centrado explícito y dimensiones responsivas. Se actualizó el parámetro de caché del CSS.
- La carga del escaparate separa productos/categorías (servicios esenciales) de reseñas, contador, ajustes y colecciones (opcionales), para que un fallo secundario no tumbe todo el catálogo.
- La consulta pública de inventario se limita a `quantity_on_hand`. Se agregó y aplicó en Neon QA la función `get_public_product_stock()`, que expone únicamente ID de producto/variante y cantidad disponible, sin abrir lectura pública de la tabla de inventario.
- Se agregó `scripts/validate-static.mjs` y se incorporó al flujo de GitHub Actions para detectar rutas HTML/CSS inexistentes, llaves CSS desbalanceadas e IDs duplicados.
- No se modificó `main`; los cambios y la política de inventario se aplicaron únicamente a QA.
