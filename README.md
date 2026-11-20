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
- Public sign-up is disabled on the QA branch. One administrator profile exists for the authorized store account.
- Object Storage bucket: `laus-product-images` (`public_read`). The Neon Function `lausimgupload` issues five-minute signed upload URLs after checking the administrator session; storage credentials remain server-side.


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
