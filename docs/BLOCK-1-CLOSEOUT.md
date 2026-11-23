# Bloque 1 — cierre técnico y criterios de aceptación

**Fecha de corte:** 2026-11-18  
**Rama:** `feat/storefront-admin-foundation`  
**Producción:** `main` sin modificaciones.

## Estado verificado

| Área | Estado | Evidencia / límite |
|---|---|---|
| Proyecto y rama QA de Neon | Preparado | Proyecto `laus-accesorios-qa`, rama `qa`. |
| PostgreSQL y modelo de negocio | Aplicado | Migración `db/migrations/0001_laus_foundation.sql`; 12 tablas de negocio. |
| RLS | Parcial | Activado en las 12 tablas. Políticas públicas de lectura; faltan políticas administrativas de escritura enlazadas a una identidad verificada por backend. |
| Neon Auth | Habilitado | Better Auth activo. No hay usuarios administradores creados, de acuerdo con la decisión del propietario de aplazar el registro. |
| Object Storage | Preparado | Bucket `laus-product-images`, lectura pública. No existe todavía un endpoint seguro de carga firmada. |
| Sistema visual | Base creada | Tokens y estilos compartidos en `docs/DESIGN_SYSTEM.md` y `src/foundation.css`. La revisión visual completa en navegador sigue pendiente. |
| QA automatizado | Pipeline actualizado | Instala dependencias, ejecuta Vitest y build; genera ZIP de fuente como artefacto en pushes a ramas `feat/**`. |
| ZIP local | Automatizado, pendiente de recoger | GitHub Actions debe terminar correctamente y publicar el artefacto `laus-accesorios-qa`. No declarar ZIP disponible hasta descargar y verificar el artefacto. |

## Bloqueadores reales para declarar Bloque 1 cerrado al 100 %

1. **Backend confiable:** no hay todavía API desplegable que valide la sesión/JWT de Neon Auth y autorice operaciones con privilegio mínimo.
2. **RLS de escritura:** no se deben habilitar escrituras administrativas hasta definir y probar el contexto de identidad que el backend establece tras verificar el token. No confiar en claims enviados libremente por el navegador.
3. **Carga de imágenes:** implementar endpoint autenticado que valide rol, MIME, tamaño y clave de objeto, y emita una carga limitada para el bucket.
4. **Pruebas de seguridad:** probar anónimo, usuario autenticado sin rol, administrador autorizado y rechazo de una cuarta cuenta. La restricción de tres administradores en la base es sólo una parte del control.
5. **Validación visual:** ejecutar la aplicación en móvil, tableta y escritorio y corregir errores observados.
6. **Entrega local:** comprobar que el artefacto ZIP se descarga, se descomprime y arranca en localhost con las instrucciones del README.

## Regla de seguridad

No incluir credenciales de base de datos, secretos de Neon, tokens, archivos `.env` ni claves privadas en el repositorio o ZIP. Las variables `VITE_*` son visibles en el navegador y nunca deben contener secretos privilegiados.

## Cómo ejecutar localmente

Requisitos: Node.js 20 o superior.

1. Descomprimir el ZIP.
2. Abrir la carpeta en VS Code o terminal.
3. Ejecutar `npm install`.
4. Copiar `.env.example` a `.env.local` y completar únicamente variables públicas de QA que correspondan. No añadir una cadena de conexión privilegiada de PostgreSQL ni secretos de Storage al frontend.
5. Ejecutar `npm run dev`.
6. Abrir la URL local que indique Vite (habitualmente `http://localhost:5173`).

## Decisión de cierre

El modelo de datos y la infraestructura están preparados, pero **Bloque 1 sigue en estado “en cierre”, no “cerrado al 100 %”** hasta superar los seis puntos anteriores. No conectar el panel actual a datos reales ni habilitar escritura pública como atajo. La siguiente entrega técnica debe resolver primero la API segura y el flujo de carga firmado; después se integra el frontend y se prueba el ciclo completo.
