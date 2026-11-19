# Lau's Accesorios — Arquitectura funcional y roadmap

**Estado:** propuesta de arquitectura aprobada para desarrollo en QA  
**Repositorio:** `jdgarzoncam-bit/laus-accesorios`  
**Rama de trabajo:** `feat/storefront-admin-foundation`  
**Producción:** `main` permanece protegida; no realizar cambios allí sin autorización expresa.

## 1. Dirección del producto

Lau's Accesorios será una tienda digital omnicanal ligera para público femenino y masculino, con posicionamiento de moda, elegancia y accesibilidad. La experiencia visual será juvenil, dinámica y editorial, conservando la identidad rosa, el hero 3D de nubes y joyas, y las fichas de producto con glassmorphism.

Principios:
- Descubrimiento visual primero; compra sencilla y sin registro.
- WhatsApp como canal de cierre y coordinación de envíos.
- Un solo origen de verdad para productos, precios, imágenes, variantes y existencias.
- Administrar una vez y publicar en tienda y PDF.
- Mobile-first y responsive para móvil, tableta y escritorio.
- Privacidad y permisos: el catálogo público solo lee productos publicados; las escrituras son exclusivas del administrador autenticado.

## 2. Espacios funcionales

### LAUS STORE — tienda pública
- Portada de marca y navegación por categorías.
- Catálogo general y colecciones de temporada.
- Búsqueda, filtros, fichas de producto y galería de fotografías.
- Precio visible en COP y estado público de disponibilidad.
- Variantes de ropa (tallas/modelos) y otras variantes que se necesiten.
- Carrito sin registro y envío del resumen a WhatsApp.
- Consulta de disponibilidad incluso cuando un artículo esté agotado.
- Descarga del catálogo PDF vigente.

### LAUS STUDIO — administración privada
- Inicio de sesión de una única cuenta administradora en la primera versión.
- Carga múltiple de imágenes y creación de fichas por producto.
- Flujo rápido: seleccionar fotos, asignar referencia y precio, revisar y publicar.
- Categoría y nombre podrán asignarse en lote o editarse después; no inventar datos a partir de la imagen.
- Varias fotos pertenecientes a una misma referencia se agrupan en una ficha.
- Detección de referencias duplicadas antes de guardar.
- Edición de precio, categoría, fotos, estado, descripción y variantes.
- Inventario exacto interno; el storefront muestra Disponible/Agotado (no cantidad exacta por defecto).
- Borrador, publicado, agotado y archivado.
- Gestión de colecciones, temporadas y promociones.
- Generación y descarga de PDF bajo demanda.

### LAUS INSIGHTS — analítica inicial
- Productos más vistos/consultados (si se instrumentan eventos).
- Clics para iniciar pedido por WhatsApp.
- Productos añadidos al carrito y carritos que abren WhatsApp.
- Rendimiento por categoría y promoción.
- Diferenciar claramente intención/consulta de una venta confirmada: WhatsApp no confirma por sí solo que el pedido se haya pagado.

## 3. Arquitectura técnica propuesta

- Frontend: React + TypeScript + Vite (stack actual).
- Backend gestionado: Neon (PostgreSQL, Neon Auth y Neon Object Storage).
- Datos: PostgreSQL administrado por Neon.
- Imágenes: Neon Object Storage, bucket `laus-product-images` con lectura pública para imágenes del catálogo; las escrituras se realizarán exclusivamente desde backend con credenciales restringidas y URLs prefirmadas.
- Identidad: Neon Auth con Better Auth; una cuenta administradora inicialmente.
- Seguridad: PostgreSQL Row Level Security (RLS) en tablas expuestas; verificación de sesión Neon Auth en backend y privilegio mínimo.
- PDF: generar desde los datos publicados y sus imágenes, con plantilla de marca; no mantener un PDF manual como segunda fuente de datos.
- WhatsApp: construir mensaje con nombre, referencia, variante, cantidad, precio unitario y subtotal; número de destino configurado por variable de entorno.
- QA y producción: proyectos Supabase separados cuando llegue el momento de producción. Secretos fuera del repositorio; nunca exponer service_role en frontend.

## 4. Modelo de datos propuesto

- `profiles`: usuario administrador y rol.
- `categories`: categorías, orden y visibilidad.
- `products`: referencia única, nombre, slug, descripción, precio COP, estado, publicación, categoría y timestamps.
- `product_images`: producto, ruta Storage, texto alternativo y orden.
- `product_variants`: talla, modelo, color u opción; SKU opcional.
- `inventory`: cantidad disponible y umbral de alerta por producto/variante.
- `inventory_movements`: entradas, ajustes y salidas auditables.
- `collections`: colecciones generales, de temporada y campañas.
- `collection_products`: relación entre colecciones y productos.
- `promotions`: nombre, vigencia, tipo de descuento, valor, condiciones y estado.
- `product_promotions`: productos asociados a promociones.
- `catalog_events`: vistas, búsquedas, agregar al carrito, clic WhatsApp y descarga PDF.
- `catalog_exports` (opcional en primera iteración): fecha, versión y metadatos de PDF generado.

Precios y totales se almacenan como enteros en pesos colombianos. Las referencias deben ser únicas. No se borran físicamente productos que tengan actividad histórica: se archivan o despublican.

## 5. Flujo de carga rápida

1. Administrador selecciona o arrastra varias fotografías.
2. Define si las imágenes corresponden a un producto o a varias referencias.
3. Por cada producto, asigna referencia y precio; puede asignar categoría por lote.
4. El sistema valida formato, tamaño, duplicados y campos obligatorios.
5. Se suben originales/variantes optimizadas a Storage y se crean registros en estado borrador.
6. El administrador revisa la vista previa y publica.
7. La tienda consulta productos publicados; el PDF se genera desde esa misma consulta.

La plataforma no debe asumir que cada foto es un producto distinto: una referencia puede tener varias vistas. La detección automática de contenido o la generación de descripciones con IA queda fuera del primer alcance.

## 6. Reglas comerciales

- Público femenino y masculino: navegación inclusiva; no restringir categorías por género. Se podrán usar etiquetas descriptivas si el negocio las necesita.
- Catálogo doble: catálogo general por categorías + colecciones/temporadas.
- Inventario doble: unidades exactas internas + disponibilidad simplificada pública.
- Agotados: permanecen visibles si el administrador así lo decide y permiten consultar por WhatsApp.
- Ropa: variantes por talla/modelo; el inventario se controla por variante cuando corresponda.
- Promociones: fechas de inicio/fin, condiciones y precio promocional calculado de forma consistente en tienda, carrito y PDF.
- PDF: incluir solo productos publicados y elegibles para catálogo; respetar precios, promociones y disponibilidad según la configuración de exportación.

## 7. Roadmap por entregas verificables

### Fase 0 — Fundaciones y entorno QA
- Crear proyecto Neon QA, rama `qa`, habilitar Neon Auth y Object Storage.
- Configurar región, URL y claves públicas; secretos en GitHub/Vercel secrets o entorno local, nunca en código.
- Instalar cliente Supabase y configurar variables de entorno.
- Definir migraciones versionadas y separación QA/producción.
**Aceptación:** aplicación conecta al proyecto QA; no hay secretos en Git; producción no cambia.

### Fase 1 — Datos, autenticación y Storage
- Crear esquema, índices, restricciones, RLS y políticas.
- Configurar bucket `laus-product-images` y permisos de lectura pública/escritura backend.
- Configurar acceso de administrador único.
**Aceptación:** visitante puede leer solo productos publicados; visitante no puede insertar/editar/borrar; administrador autenticado puede gestionar datos e imágenes.

### Fase 2 — Catálogo y carga rápida en LAUS STUDIO
- Reemplazar persistencia localStorage por Supabase.
- Carga de múltiples imágenes, agrupación por referencia, referencia/precio obligatorios, categoría opcional por lote.
- Validación de duplicados, edición, borradores y publicación.
- Gestión de tallas/modelos e inventario.
**Aceptación:** publicar un producto o lote se refleja en otro navegador/dispositivo; cambios de precio e inventario se sincronizan; no hay productos demo mezclados con inventario real.

### Fase 3 — LAUS STORE y pedidos WhatsApp
- Consultas reales, búsqueda, categorías, colecciones y promociones.
- Ficha de producto, galería, variantes y carrito.
- Mensaje de WhatsApp con detalle correcto del pedido.
- Consulta de agotados.
**Aceptación:** carrito calcula totales y variantes correctamente; WhatsApp recibe referencias, cantidades y precios correctos; ninguna compra requiere registro.

### Fase 4 — Catálogo PDF
- Plantilla editorial rosa de marca, portada, índice/categorías y fichas.
- Paginación, imágenes optimizadas, precios COP y datos de contacto.
- Botón de descarga en tienda y administración.
**Aceptación:** PDF generado después de publicar/editar refleja exactamente el catálogo vigente; pruebas de imágenes faltantes, muchas páginas y saltos de página.

### Fase 5 — Promociones y temporadas
- CRUD de colecciones, campañas y promociones.
- Fechas de vigencia, reglas de descuento y visualización.
**Aceptación:** promoción activa/inactiva en fechas correctas; precio coherente en ficha, carrito, WhatsApp y PDF.

### Fase 6 — Analítica y endurecimiento
- Eventos de navegación y embudo hasta WhatsApp.
- Métricas por producto/categoría/campaña.
- Pruebas responsive, accesibilidad, seguridad, rendimiento y restauración.
**Aceptación:** métricas etiquetadas como consultas/intención, no ventas confirmadas; pruebas críticas pasan en QA antes de autorizar producción.

## 8. Pruebas mínimas obligatorias por entrega

- Referencia duplicada y referencia válida.
- Producto con una imagen y con varias imágenes.
- Imagen inválida, muy grande o subida interrumpida.
- Precio cero, negativo, decimal o vacío.
- Producto agotado y producto con inventario.
- Variante de ropa sin talla seleccionada y con talla seleccionada.
- Actualización visible en dos sesiones/dispositivos.
- Usuario anónimo intentando modificar datos.
- PDF con catálogo vacío, una página y múltiples páginas.
- Mensaje WhatsApp con varias líneas, cantidades y variantes.
- Diseño en móvil, tableta y escritorio.

## 9. Estado actual y brechas conocidas

La rama de trabajo contiene React/TypeScript/Vite y una experiencia inicial de tienda, carrito, panel administrativo y ficha visual. Sin embargo, la implementación inspeccionada aún usa datos de demostración y `localStorage`; el formulario actual de producto no es una carga real de archivos a Storage. El PDF actual invoca impresión del navegador, no un generador editorial de catálogo. El proyecto aún no incluye la integración cliente/servidor de Neon Auth, PostgreSQL y Object Storage.

Por tanto, estas funciones se consideran base/prototipo, no integraciones de producción. La primera tarea técnica es configurar el backend Neon QA (Auth, PostgreSQL y Storage) y migrar el catálogo a una fuente de datos centralizada.

## 10. Fuera del alcance inicial

- Pasarela de pagos y checkout propio.
- Registro de clientes.
- Sincronización automática con Instagram/TikTok.
- IA para reconocer automáticamente cada joya o redactar descripciones.
- Multiusuario y permisos por empleado (se deja el modelo preparado, pero solo habrá un administrador inicialmente).

Estas funciones podrán evaluarse después de validar el flujo principal de catálogo y pedidos.


## 11. Backend confirmado: Neon QA

- Proyecto Neon: `laus-accesorios-qa` (Project ID: `dawn-cherry-24723488`).
- Región: `aws-us-east-1` (Virginia, Estados Unidos).
- PostgreSQL: versión 17.
- Rama de desarrollo: `qa` (Branch ID: `br-broad-block-bc99rqv7`).
- Neon Auth: habilitado con Better Auth en la rama QA.
- Neon Object Storage: habilitado.
- Bucket: `laus-product-images`, acceso `public_read` para servir fotografías del catálogo.
- Proyecto anterior `round-wind-94330652` fue creado inicialmente en `aws-sa-east-1`; Neon Object Storage no está disponible en esa región. Se conserva sin uso por ahora; no se eliminó.
- La rama GitHub `feat/storefront-admin-foundation` sigue siendo el único destino de desarrollo. `main` no se modifica.
- No se han creado aún tablas de negocio ni se ha conectado el frontend; son los siguientes pasos de implementación.
