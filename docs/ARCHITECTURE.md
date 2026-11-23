# Arquitectura LAU'S Accesorios

## Alcance del producto

LAU'S es un catálogo digital con administración privada. No procesa compras, pagos ni checkout. El usuario arma una bolsita, ve los descuentos vigentes y envía el resumen a WhatsApp para coordinar disponibilidad y entrega.

## Arquitectura

- Frontend: HTML5, CSS3 y JavaScript ES Modules nativos.
- Datos: Neon Data API (PostgREST) conectada directamente desde el navegador mediante `@neon/neon-js`.
- Identidad: Neon Auth / Better Auth.
- Seguridad: PostgreSQL RLS y GRANTs; las escrituras administrativas requieren un registro válido en `admin_profiles`.
- Fotografías: Neon Object Storage, bucket público de lectura `laus-product-images`.
- Carga de fotografías: Neon Function `lausimgupload`, única y exclusivamente para validar la sesión/perfil administrador y firmar un PUT de 5 minutos. No gestiona catálogo, precios, promociones ni otras operaciones.
- Comunicación comercial: carrito local en navegador y enlace WhatsApp.

## Flujo público

1. La tienda consulta productos publicados, categorías, imágenes, inventario y promociones desde Neon Data API.
2. Calcula en el navegador el mejor descuento activo asociado a cada producto.
3. El carrito conserva producto, variante y cantidad.
4. El total estimado y el detalle se envían a WhatsApp. La disponibilidad y el envío se confirman por ese canal.

## Flujo administrativo

1. El administrador inicia sesión mediante Neon Auth.
2. El panel verifica que exista su perfil en `admin_profiles`.
3. Productos, categorías, inventario, promociones, colecciones y configuración se gestionan directamente con Data API.
4. Para fotografías, el navegador solicita un enlace firmado al servicio mínimo `lausimgupload`, sube el archivo directamente a Object Storage y registra la clave en `product_images`.

## Seguridad y límites

- No se publican credenciales de almacenamiento en JavaScript.
- No existe registro público de administradores.
- La rama QA es `br-broad-block-bc99rqv7`; no modificar `main` ni producción sin autorización expresa.
- El dominio público debe agregarse a CORS de Neon Data API antes de publicar fuera de localhost.
- La Function antigua `lausapi` fue eliminada de QA. No se debe recuperar ni volver a desplegar.
- Las tablas históricas de ventas no forman parte de la experiencia ni del flujo de compra; el sitio no registra ventas.

## Estado

La tienda y el administrador ya se migraron en la rama de trabajo a consultas Neon directas. El firmador de imágenes está desplegado en QA. Falta validar en navegador la autenticación real, persistencia, carga de archivos y recorrido completo hasta WhatsApp. No se declara listo para producción hasta esa validación.
