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
- QA y producción: proyectos Neon separados. Secretos fuera del repositorio; nunca exponer credenciales de base de datos ni claves privilegiadas en frontend.

## 4. Modelo de datos propuesto

- `admin_profiles`: usuarios administradores autorizados y rol.
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
- Crear proyecto Neon QA, rama `qa`, habilitar Neon Auth y Object Storage. **Completado.**
- Configurar región, URL y claves públicas; secretos en GitHub/Vercel secrets o entorno local, nunca en código.
- Configurar cliente Neon Auth y variables de entorno; acceso SQL de negocio a través de backend confiable.
- Definir migraciones versionadas y separación QA/producción.
**Aceptación:** aplicación conecta al proyecto QA; no hay secretos en Git; producción no cambia.

### Fase 1 — Datos, autenticación y Storage
- Crear esquema, índices, restricciones y RLS. **Esquema base aplicado en QA; faltan políticas de escritura de administrador ligadas a identidad verificada en backend.**
- Configurar bucket `laus-product-images` y permisos de lectura pública/escritura backend. **Bucket creado; permisos de escritura backend pendientes de implementar.**
- Configurar máximo tres administradores autorizados: primera cuenta por bootstrap y dos invitaciones privadas. **Pendiente para etapa final de seguridad.**
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

La rama de trabajo contiene React/TypeScript/Vite y una experiencia inicial de tienda, carrito, panel administrativo y ficha visual. Sin embargo, la implementación inspeccionada aún usa datos de demostración y `localStorage`; el formulario actual de producto no es una carga real de archivos a Storage. El PDF actual invoca impresión del navegador, no un generador editorial de catálogo. El proyecto incluye integración inicial de Neon Auth en frontend; la API segura de negocio y la conexión controlada a PostgreSQL/Object Storage siguen pendientes.

Por tanto, estas funciones se consideran base/prototipo, no integraciones de producción. La siguiente tarea técnica es completar la capa backend segura, migraciones versionadas, políticas de acceso y conexión de frontend a una fuente de datos centralizada.

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


## 12. Acceso privado a LAU'S STUDIO (QA)

- Proveedor: Neon Auth con Better Auth sobre la rama Neon `qa`.
- Método de acceso: correo y contraseña; verificación de correo obligatoria.
- UI: pantalla propia de Log in / Sign Up con estética blush y Glassmorphism, sin acceso social.
- Flujo acordado: primera cuenta registrada y autorizada como administradora principal; dos cuentas posteriores mediante invitaciones privadas.
- La interfaz comprueba el rol administrativo antes de renderizar el panel. Una cuenta autenticada sin rol `admin` o `owner` no accede al panel.
- SDK integrado en el frontend: `@neondatabase/neon-js/auth`.
- Variable frontend QA: `VITE_NEON_AUTH_URL`.
- Estado parcial: pantalla e integración inicial de login/registro incorporadas a `feat/storefront-admin-foundation`; falta probar instalación/build y flujo real de correo.
- Pendiente antes de declarar seguridad completa: aplicar límite autoritativo de tres administradores en backend/base de datos, cerrar registro abierto después del bootstrap inicial, implementar emisión y aceptación de invitaciones privadas, asignar rol de administrador a la primera cuenta y validar rechazo de una cuarta cuenta. El control visual de roles del frontend no sustituye estas medidas de backend.


## 13. Bloque 1 — Fundación y arquitectura: avance de implementación

### Infraestructura QA verificada
- Proyecto Neon QA: `dawn-cherry-24723488`.
- Rama Neon: `qa` / `br-broad-block-bc99rqv7`, estado `ready`.
- Neon Auth Better Auth habilitado.
- Bucket `laus-product-images` creado con lectura pública.
- No se han creado usuarios administradores ni se ha ejecutado el bootstrap; se aplaza hasta completar la plataforma por decisión del usuario.

### Esquema de negocio aplicado en QA
Migración versionada: `db/migrations/0001_laus_foundation.sql`.

Tablas:
- `categories`, `products`, `product_images`, `product_variants`.
- `inventory`, `inventory_movements`.
- `collections`, `collection_products`.
- `promotions`, `product_promotions`.
- `catalog_events`, `admin_profiles`.

Reglas implementadas:
- Referencia de producto única.
- Precio COP entero no negativo.
- Estados de producto draft/published/archived.
- Inventario no negativo, con soporte de variante y movimientos auditables.
- Promociones con vigencia y validación de porcentajes.
- RLS activado en todas las tablas de negocio.
- Lectura pública limitada a categorías visibles, productos publicados, colecciones y promociones activas.
- Trigger transaccional con advisory lock que impide insertar un cuarto perfil administrador.

Pendiente de seguridad antes de usar datos reales:
- Verificar cómo el backend establece de forma confiable el contexto de identidad después de validar JWT.
- Añadir políticas de escritura administrativa con ese contexto.
- Separar un rol SQL de runtime sin privilegios de propietario/bypass RLS.
- Proteger el bucket contra escritura directa pública y generar cargas firmadas desde backend.
- Completar pruebas negativas de lectura y escritura.

### Diseño de interfaz — fundación
Documento: `docs/DESIGN_SYSTEM.md`.
- Paleta blush, rose, coral, grafito y blanco cálido.
- Tipografías Sora y DM Sans.
- Tokens, radios, superficies, botones, campos y estados compartidos.
- Glassmorphism reservado para capas de enfoque; se prioriza legibilidad en paneles de datos.

### Criterios de cierre del Bloque 1
1. Migración versionada reproducible en QA.
2. API backend verifica JWT de Neon Auth y aplica autorización por rol.
3. RLS impide escritura anónima y escritura de usuarios no autorizados.
4. Upload de imágenes sólo desde backend autorizado.
5. Variables/secretos QA separados y ausentes del repositorio.
6. Pruebas de acceso público, administrador y usuario no autorizado.
7. Diseño base responsive validado antes de pasar al Bloque 2.


## 14. Estado de verificación actualizado

La inspección directa de `pg_policies` en Neon QA confirmó nueve políticas de lectura pública y una política de lectura propia en `admin_profiles`. No hay políticas de escritura administrativa. RLS está habilitado en las doce tablas; esto no equivale a una autorización administrativa completa. El bucket `laus-product-images` existe con acceso `public_read`.

El workflow `.github/workflows/quality-checks.yml` fue actualizado para instalar dependencias, ejecutar Vitest, compilar y generar un artefacto ZIP de fuente en pushes a ramas `feat/**`. La configuración del workflow no demuestra que una ejecución haya terminado correctamente: debe comprobarse el run y descargar el artefacto antes de declarar la entrega ZIP verificada.

La pantalla de administración comprueba una URL `VITE_ADMIN_SESSION_CHECK_URL` y bloquea el panel cuando falta autorización del servidor. Esa URL está vacía en `.env.example` hasta desplegar la API. Por tanto, el panel administrativo no se considera operativo ni seguro para gestión real todavía.

El siguiente paso no es habilitar escrituras desde el navegador: es seleccionar el runtime de despliegue de la API, confirmar la validación de sesión Neon Auth y el mecanismo de carga firmada de Neon Object Storage, implementar y probar ambos en QA.


## 15. Decisión de alojamiento del backend

La API del proyecto se alojará en **Neon Functions**, sobre la rama Neon QA, junto a PostgreSQL. No se usará Vercel para el backend. Neon Functions ofrece runtime serverless Node.js 24, URL HTTPS de invocación y despliegue de bundles; Hono será el router HTTP recomendado. La consulta de funciones en la rama QA devolvió una lista vacía: aún no hay API desplegada.

El frontend React se ejecuta localmente durante diseño y QA, y consumirá la URL de la Neon Function mediante una variable pública de configuración que sólo contiene la URL. Los secretos, credenciales de base de datos y permisos de Storage se mantienen en variables privadas de la función. La API se versiona en el repositorio y se despliega a QA por separado de la interfaz.
