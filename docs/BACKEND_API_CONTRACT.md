# LAU'S Accesorios — contrato de datos Neon (QA)

## Servicios

- Neon Data API: `https://ep-purple-dream-bceofn8m.apirest.c-16.us-east-1.aws.neon.tech/neondb/rest/v1`
- Neon Auth: `https://ep-purple-dream-bceofn8m.neonauth.c-16.us-east-1.aws.neon.tech/neondb/auth`
- Neon Object Storage bucket: `laus-product-images` (public_read)
- Firmador de imágenes: `https://br-broad-block-bc99rqv7-lausimgupload.compute.c-16.us-east-1.aws.neon.tech/`

## Lecturas públicas

- `products`: solo productos publicados.
- `categories`: categorías visibles.
- `product_images`: claves de imágenes para construir la URL pública del bucket.
- `product_variants`, `inventory`: opciones y existencias.
- `promotions`, `product_promotions`: reglas y productos participantes.
- `collections`, `collection_products`: colecciones visibles.
- `store_settings`: datos públicos de la tienda.
- `catalog_events`: inserción anónima limitada a los tipos permitidos.

## Operaciones administrativas

El cliente oficial `@neon/neon-js` envía el JWT de Neon Auth a Data API. PostgreSQL RLS permite escrituras únicamente a usuarios presentes en `admin_profiles`.

- Productos: `products` y `categories`.
- Imágenes: `product_images` después de completar la carga a Object Storage.
- Existencias: `inventory` y `inventory_movements`.
- Descuentos: `promotions` y `product_promotions`.
- Colecciones: `collections` y `collection_products`.
- Configuración: `store_settings`.

## Carga segura de imágenes

El navegador envía al firmador un JWT de Neon Auth, UUID del producto, MIME type y tamaño. El firmador consulta `admin_profiles` y verifica que el producto exista. Si está autorizado, devuelve una URL PUT firmada con expiración de cinco minutos. El navegador sube directamente el archivo a Neon Object Storage y guarda `bucket_name` y `object_key` en `product_images`.

Tipos permitidos: JPEG, PNG, WebP y AVIF. Tamaño máximo: 8 MiB. No exponer claves S3 ni credenciales de Neon en el frontend.

## No incluido

- Checkout, pagos, órdenes o compras en línea.
- Registro de ventas desde la página.
- API general de negocio personalizada.
- Rutas heredadas `/api/*`.

## Entorno

QA: proyecto `dawn-cherry-24723488`, rama `br-broad-block-bc99rqv7`, región `aws-us-east-1`. CORS Data API está limitado a localhost:5173 y localhost:8000 hasta conocer el dominio final de publicación.
