# Contrato de API segura — Lau's Accesorios

**Estado:** especificación previa a implementación y despliegue.  
**Entorno objetivo:** Neon QA, rama `qa`.  
**No contiene secretos ni credenciales.**

## 1. Arquitectura elegida: API alojada en Neon Functions\n\nLa API se desplegará como **Neon Functions** en la misma rama Neon QA que aloja PostgreSQL, no en Vercel ni en un servidor externo. Neon Functions ejecuta funciones serverless Node.js 24 junto a la base de datos y ofrece URL de invocación HTTPS. Se recomienda Hono como router HTTP. La documentación oficial describe despliegue por CLI o API, variables de entorno de función y límites de ejecución. La cuenta/proyecto QA no tiene funciones desplegadas todavía: la consulta de funciones devolvió una lista vacía.\n\nLa función tendrá rutas agrupadas bajo `/api` y utilizará la conexión PostgreSQL de Neon con rol de runtime de privilegios mínimos. Las variables privadas se configuran en el despliegue de Neon Functions; nunca se compilan dentro de React ni se exponen mediante `VITE_`. La función se versiona en este repositorio y se despliega exclusivamente en la rama `qa`.\n\n## 2. Principios obligatorios

- El navegador nunca recibe una cadena de conexión privilegiada, credenciales S3, claves privadas ni tokens de administrador.
- El servidor valida la sesión de Neon Auth en cada solicitud protegida. No acepta un `user_id`, `role` o `is_admin` enviado por el cliente como prueba de identidad.
- El servidor consulta `admin_profiles` para comprobar que el usuario autenticado está autorizado.
- La conexión SQL de runtime debe usar un rol dedicado sin privilegios de propietario, superusuario ni `BYPASSRLS`.
- Las escrituras deben pasar por el servidor; no se crean políticas de escritura para `public` o `anon`.
- El bucket de imágenes permite lectura pública de objetos publicados, pero no escritura pública.
- Las operaciones de inventario deben ser transaccionales y generar un movimiento auditable.

## 3. Endpoints previstos

| Método y ruta | Acceso | Responsabilidad |
|---|---|---|
| GET `/api/admin/session` | Sesión válida | Validar sesión y responder `authorized`, rol y usuario mínimo. |
| GET `/api/catalog/products` | Público | Listar únicamente productos publicados, con paginación y filtros permitidos. |
| GET `/api/catalog/products/:slug` | Público | Ficha publicada, imágenes ordenadas, variantes activas y disponibilidad pública. |
| POST `/api/admin/products` | Administrador | Crear producto borrador y validar referencia/precio/categoría. |
| PATCH `/api/admin/products/:id` | Administrador | Editar campos permitidos y estado. |
| POST `/api/admin/products/:id/images/upload-intent` | Administrador | Validar tipo/tamaño y emitir autorización temporal para subir objeto. |
| POST `/api/admin/products/:id/images/confirm` | Administrador | Verificar objeto cargado y registrar metadatos de imagen. |
| DELETE `/api/admin/products/:id/images/:imageId` | Administrador | Retirar imagen y limpiar objeto de forma controlada. |
| POST `/api/admin/inventory/movements` | Administrador | Registrar entrada/ajuste/salida dentro de transacción. |
| GET/POST/PATCH `/api/admin/collections` | Administrador | Consultar y administrar colecciones. |
| GET/POST/PATCH `/api/admin/promotions` | Administrador | Consultar y administrar promociones. |
| POST `/api/events` | Público, limitado | Registrar eventos de catálogo con esquema permitido y protección antiabuso. |

Las rutas son un contrato funcional; no deben considerarse endpoints ya desplegados.

## 4. Validación de sesión y permisos

1. Leer la cookie de sesión de la solicitud entrante.
2. Validar la sesión contra Neon Auth/Better Auth en el servidor, usando el mecanismo oficial de verificación para el proyecto y la versión configurada.
3. Obtener el identificador de usuario desde la sesión validada, nunca desde el body.
4. Consultar el perfil administrativo con el rol SQL restringido.
5. Rechazar si la sesión no existe, expiró o el usuario no tiene perfil autorizado.
6. Aplicar protección CSRF/origen en operaciones con cookies y límites de frecuencia.
7. No registrar contraseñas, cookies, tokens ni URLs firmadas en logs.

**Bloqueante:** antes de escribir middleware debe confirmarse el método exacto de validación de sesión de Neon Auth para el dominio QA, el formato de cookies y el entorno de despliegue elegido. No se debe inventar un endpoint JWKS ni asumir que un token Better Auth es un JWT verificable localmente.

## 5. Carga de imágenes

- Permitir JPEG, PNG y WebP; rechazar SVG y archivos ejecutables.
- Definir límite de tamaño y dimensiones en servidor.
- Crear claves aleatorias dentro de prefijos por producto; no aceptar rutas arbitrarias del cliente.
- Emitir URL/permiso temporal con expiración corta, restringido al objeto y método necesarios.
- Confirmar que el objeto existe y coincide con el tipo/tamaño declarado antes de insertar `product_images`.
- No permitir borrar objetos ajenos a la referencia autorizada.
- Mantener originales/variantes optimizadas según política de imagen acordada.

**Bloqueante:** confirmar el método de firma y el SDK/API disponible para Neon Object Storage en la región del proyecto. No exponer claves S3 en variables `VITE_*`.

## 6. RLS y roles SQL

Antes de activar escrituras:

- Crear rol de runtime con privilegios mínimos.
- Conceder sólo los permisos SQL requeridos.
- Definir cómo el backend establece un contexto de usuario no falsificable para la transacción.
- Probar explícitamente que el rol de runtime no puede omitir RLS.
- Añadir políticas de escritura que dependan de ese contexto verificado.
- Mantener las lecturas públicas limitadas a registros publicados/activos.
- Mantener `inventory`, `inventory_movements` y `admin_profiles` fuera de lectura pública.

No usar `SET request.jwt.claim.sub` con valores recibidos directamente del navegador. Un valor de sesión sólo es confiable después de validarlo en el backend y establecerlo dentro de una transacción controlada.

## 7. Límite de administradores

El trigger existente limita los perfiles a tres, pero no implementa por sí solo invitaciones ni controla el registro en Neon Auth. El alta debe ejecutarse desde un proceso backend restringido: verificar invitación, crear/validar usuario, insertar perfil en transacción y auditar la acción. No crear todavía el usuario bootstrap hasta que el propietario lo autorice.

## 8. Pruebas de aceptación

- Sin sesión: GET público funciona sólo para catálogo publicado; todas las rutas admin responden 401.
- Sesión válida sin perfil admin: rutas admin responden 403.
- Admin autorizado: operaciones permitidas y validadas.
- Cuarto perfil admin: transacción rechazada.
- Precio negativo, referencia duplicada, MIME inválido, archivo excesivo y clave de objeto ajena: rechazados.
- Inventario no puede quedar negativo ni actualizarse sin movimiento auditable.
- Un producto borrador nunca aparece en endpoints públicos.
- Un fallo de carga no deja registros de imagen huérfanos.
- Las pruebas se ejecutan contra QA y no contra producción.

## 8. Decisiones necesarias antes del código desplegable

1. Seleccionar destino de despliegue de API (por ejemplo, Vercel Functions u otro runtime Node compatible).
2. Confirmar que el dominio de frontend y API comparte origen o definir CORS/cookies seguras y CSRF.
3. Confirmar el flujo de sesión oficial de Neon Auth y la API de firma para Object Storage.
4. Configurar secretos exclusivamente en el entorno servidor QA.
5. Desplegar y probar en QA antes de habilitar la integración de escritura desde React.
