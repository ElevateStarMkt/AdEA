# AdEA — Especificación de Base de Datos (Back4App)
## Clases a crear en el Dashboard de Back4App

---

> **Cómo usarlo:** En Back4App → tu App → Database → Create a class.  
> Copia exactamente los nombres. Las columnas marcadas como **requeridas** deben tener "Required" activo.  
> Parse añade automáticamente `objectId`, `createdAt`, `updatedAt` y `ACL` a todas las clases.

---

## 1. `_User` (clase nativa de Parse — ya existe, solo añade columnas)

**Tipo:** Protected mode (Parse gestiona auth automáticamente)  
**Nombre:** `_User` *(no crear, ya existe — solo añadir campos extra)*

| Tipo | Nombre | Default | Required | Notas |
|---|---|---|---|---|
| String | `rol` | `"lector"` | ✅ | `"lector"` o `"bookstagramer"` |
| Boolean | `activo` | `true` | ✅ | Para desactivar cuentas sin borrarlas |
| String | `instagram` | `""` | ❌ | Solo bookstagramers |
| Number | `seguidores` | `0` | ❌ | Solo bookstagramers |
| String | `generoFavorito` | `""` | ❌ | Solo bookstagramers |
| String | `estadoSolicitud` | `"pendiente"` | ❌ | `"pendiente"` / `"aprobado"` / `"rechazado"` — solo bookstagramers |

---

## 2. `Books`

**¿Qué tipo de clase necesitas?** → **Custom class**  
**¿Cómo se llama?** → `Books`  
**Modo:** Add in **Public mode** (lectura pública; escritura solo para Cloud Code / admin)

| Tipo | Nombre | Default | Required | Notas |
|---|---|---|---|---|
| Number | `libroId` | — | ✅ | ID numérico del JSON (1–20, único) |
| String | `titulo` | — | ✅ | Título del libro |
| String | `autor` | — | ✅ | Nombre del autor |
| String | `imagen` | `""` | ❌ | URL portada (OpenLibrary u otro) |
| Array | `genero` | `[]` | ✅ | Ej: `["romance", "drama"]` |
| Array | `mood` | `[]` | ✅ | Ej: `["adictivo", "spicy"]` |
| String | `sinopsis_corta` | — | ✅ | 1 frase gancho |
| String | `sinopsis_larga` | — | ✅ | 3–5 frases emocionales |
| Array | `etiquetas` | `[]` | ❌ | Ej: `["🔥 Viral en BookTok"]` |
| Boolean | `destacado` | `false` | ❌ | Aparece en home |
| String | `afiliado_url` | — | ✅ | URL Amazon con `?tag=` |
| Number | `valoracion` | `4.5` | ❌ | De 0 a 5 |
| Number | `paginas` | `0` | ❌ | Total de páginas |
| Number | `precio` | `0` | ❌ | Precio aprox. en euros |
| Number | `clicks` | `0` | ❌ | Contador de clics en afiliado |

**ACL recomendada:**
- Public Read: ✅
- Public Write: ❌ (solo Cloud Code o admin)

---

## 3. `Favoritos`

**¿Qué tipo de clase necesitas?** → **Custom class**  
**¿Cómo se llama?** → `Favoritos`  
**Modo:** Add in **Protected mode** (cada usuario solo ve los suyos)

| Tipo | Nombre | Default | Required | Notas |
|---|---|---|---|---|
| Pointer → `_User` | `usuario` | — | ✅ | Referencia al usuario dueño |
| Number | `libroId` | — | ✅ | ID numérico del libro |
| String | `sinopsis` | `""` | ❌ | Copia de sinopsis_corta en el momento del guardado |
| Number | `paginas` | `0` | ❌ | Copia del número de páginas |
| Number | `precio` | `0` | ❌ | Copia del precio |
| String | `afiliado_url` | — | ✅ | URL de afiliado directa |
| Array | `etiquetas` | `[]` | ❌ | Etiquetas emocionales |
| Array | `mood` | `[]` | ❌ | Moods del libro |

**ACL recomendada:**
- Public Read: ❌
- Public Write: ❌
- User (owner): Read ✅ Write ✅

**Índice recomendado:** `usuario` + `libroId` (compuesto, para evitar duplicados rápido)

---

## 4. `Descartados`

**¿Qué tipo de clase necesitas?** → **Custom class**  
**¿Cómo se llama?** → `Descartados`  
**Modo:** Add in **Protected mode**

| Tipo | Nombre | Default | Required | Notas |
|---|---|---|---|---|
| Pointer → `_User` | `usuario` | — | ✅ | Quién descartó |
| Number | `libroId` | — | ✅ | Qué libro |
| Date | `expiraEn` | — | ✅ | Timestamp de expiración (36h desde el descarte) |

**ACL recomendada:** igual que `Favoritos` — solo el usuario dueño

**Nota:** Crear un **Job programado** en Back4App (Background Jobs) que limpie filas donde `expiraEn < now()` cada 12h para no acumular registros.

---

## 5. `SolicitudesBookstagramer`

**¿Qué tipo de clase necesitas?** → **Custom class**  
**¿Cómo se llama?** → `SolicitudesBookstagramer`  
**Modo:** Add in **Protected mode** (solo admin + el propio usuario pueden leer)

| Tipo | Nombre | Default | Required | Notas |
|---|---|---|---|---|
| Pointer → `_User` | `usuario` | — | ✅ | Usuario recién creado |
| String | `nombre` | — | ✅ | Nombre real |
| String | `email` | — | ✅ | Email de contacto |
| String | `instagram` | — | ✅ | Handle de Instagram |
| Number | `seguidores` | `0` | ❌ | Nº seguidores declarados |
| String | `generoFavorito` | `""` | ❌ | Género principal de su contenido |
| String | `mensaje` | `""` | ❌ | Texto libre del formulario |
| String | `estado` | `"pendiente"` | ✅ | `"pendiente"` / `"aprobado"` / `"rechazado"` |
| Pointer → `_User` | `revisadoPor` | `null` | ❌ | Admin que gestionó la solicitud |

**ACL recomendada:**
- Public Read: ❌
- Public Write: ❌
- Role "Admin": Read ✅ Write ✅
- User (solicitante): Read ✅ Write ❌

---

## Roles a crear en Back4App

Ve a **Database → _Role → Create row**:

| Nombre del rol | Para qué sirve |
|---|---|
| `Admin` | Acceso total al dashboard de solicitudes de bookstagramers |
| `Bookstagramer` | Acceso al panel de colaboradora (fase 2) |

---

## Índices recomendados

| Clase | Campo(s) | Tipo | Motivo |
|---|---|---|---|
| `Books` | `libroId` | Unique | Búsqueda rápida por ID |
| `Books` | `clicks` | Descending | Para `getTopLibros()` |
| `Favoritos` | `usuario` + `libroId` | Compound | Evitar duplicados |
| `Descartados` | `usuario` + `expiraEn` | Compound | Query de descartados vigentes |
| `SolicitudesBookstagramer` | `estado` | — | Filtrar pendientes en panel admin |

---

## Background Jobs (Back4App Scheduled Jobs)

Ve a **App Settings → Background Jobs → Schedule a Job**:

### Job 1: Limpiar descartados expirados
```javascript
// Cloud Code → main.js
Parse.Cloud.job("limpiarDescartados", async (request) => {
  const Descartado = Parse.Object.extend("Descartados");
  const q = new Parse.Query(Descartado);
  q.lessThan("expiraEn", new Date());
  q.limit(1000);
  const expired = await q.find({ useMasterKey: true });
  await Parse.Object.destroyAll(expired, { useMasterKey: true });
  return `Eliminados ${expired.length} descartados expirados`;
});
```
**Frecuencia:** Cada 12 horas

---

## Resumen rápido de creación en Back4App

```
1. _User        → Añadir columnas extra (rol, activo, instagram, etc.)
2. Books        → Public mode + columnas indicadas
3. Favoritos    → Protected mode + ACL por usuario
4. Descartados  → Protected mode + ACL por usuario
5. SolicitudesBookstagramer → Protected mode + ACL Admin + usuario
6. Roles        → Admin, Bookstagramer
7. Índices      → Los listados arriba
8. Job          → limpiarDescartados cada 12h
```