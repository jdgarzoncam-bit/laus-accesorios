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

## Neon Data API QA

- Branch: `br-broad-block-bc99rqv7` (QA only).
- Data API: `https://ep-purple-dream-bceofn8m.apirest.c-16.us-east-1.aws.neon.tech/neondb/rest/v1`.
- Authentication provider: Neon Auth / Better Auth.
- Exposed schema: `public`; anonymous role: `anonymous`; broad default grants disabled.
- RLS is enabled on all 15 public tables. Public read access is restricted to catalog data; authenticated writes require `public.is_laus_admin()`.
- The former `lausapi` Neon Function is deprecated and must not be used by the frontend.
- Public sign-up remains disabled. The first administrator profile has not been provisioned.
- Object Storage bucket: `laus-product-images` (`public_read`). Uploads still require short-lived signed URLs; storage credentials must never be exposed in browser code.


## Límites actuales de la migración

La tienda y LAUS STUDIO aún tienen referencias JavaScript al contrato antiguo `/api/*`. Esas llamadas se están sustituyendo por el SDK oficial `@neon/neon-js` y consultas PostgREST. No usar el despliegue anterior de `lausapi`. Las operaciones de inventario/ventas deben pasar a RPC transaccional; las cargas de imágenes necesitan firma temporal segura. La interfaz no se declara lista hasta completar esa sustitución y pruebas de navegador.


## Estado de migración (QA)

- El esquema de negocio y los datos se conservan en Neon QA.
- Neon Data API está activa con Neon Auth como proveedor.
- Se aplicó `db/migrations/0003_neon_data_api_security.sql`: grants de lectura pública limitados, eventos anónimos permitidos y escrituras autenticadas condicionadas a un perfil administrador.
- Se verificó que las 15 tablas públicas mantienen RLS habilitado; el rol anónimo lee configuración pública y no ve ventas; sin identidad no obtiene permisos de administrador.
- La migración de llamadas frontend y operaciones RPC sigue en curso. No hay usuarios administradores ni productos reales aún.
- No se modificó `main` ni producción.


## QA y publicación

El workflow `Static QA package` valida JavaScript y empaqueta el frontend estático. No instala ni empaqueta Neon Functions. La entrega se mantiene en `feat/storefront-admin-foundation`; no modificar `main` ni producción sin autorización expresa.
