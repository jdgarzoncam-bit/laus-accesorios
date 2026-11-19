# LAU'S Accesorios — Neon Data API contract (QA)

Base URL: `https://ep-purple-dream-bceofn8m.apirest.c-16.us-east-1.aws.neon.tech/neondb/rest/v1`

## Arquitectura
- PostgreSQL gestionado por Neon.
- REST de datos administrado por Neon Data API / PostgREST.
- Identidad y JWT mediante Neon Auth / Better Auth.
- RLS y GRANTs en PostgreSQL como única capa de autorización.
- No usar la antigua Neon image-upload signer `lausapi` para operaciones de negocio.

## Tablas públicas y permisos
- Lectura anónima limitada por RLS a categorías visibles, productos publicados, imágenes de productos publicados, variantes activas, colecciones/promociones vigentes y configuración pública.
- Inserción anónima limitada a eventos de analítica permitidos.
- Operaciones de escritura autenticadas requieren que `public.is_laus_admin()` confirme un perfil en `admin_profiles`.
- Todas las tablas del esquema `public` tienen RLS habilitado.

## Operaciones
- Catálogo: `products`, `categories`, `product_images`, `product_variants`.
- Inventario: `inventory`, `inventory_movements`.
- Colecciones: `collections`, `collection_products`.
- Promociones: `promotions`, `product_promotions`.
- Ventas: `sales`, `sale_items`.
- Analítica: `catalog_events`.
- Configuración: `store_settings`.

## RPC transaccional pendiente
Las operaciones que deben ser atómicas (ajustes de inventario, venta con descuento de existencias, asociaciones de campañas y generación de métricas agregadas) se implementarán como funciones PostgreSQL invocadas por `rpc()`, con validación de admin y RLS. No se deben reproducir como secuencias de escrituras independientes desde el navegador.

## Object Storage
Bucket QA: `laus-product-images` (`public_read`). Las imágenes públicas se pueden consultar por URL; las cargas/borrados requieren URLs prefirmadas emitidas por un servicio de firma seguro. Las claves S3 jamás se incluyen en `assets/config.js` ni en JavaScript público.

## Seguridad y límites
- Neon Auth signup público deshabilitado.
- Primer perfil administrador aún no provisionado.
- Data API expone únicamente el esquema `public`.
- La configuración actual limita CORS a localhost:5173 y localhost:8000.
- No publicar ni cambiar `main` sin autorización expresa.

## Estado de migración
La Data API ya está habilitada en QA y se aplicó la migración `0003_neon_data_api_security.sql`. La integración de las pantallas nativas y la sustitución de las llamadas heredadas siguen pendientes de implementación y pruebas de navegador. La antigua Function `lausapi` queda fuera de uso para el nuevo flujo.
