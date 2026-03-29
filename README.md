# AdEA — Motor de Descubrimiento Emocional de Libros
## Documentación del proyecto · Fase 1 completa

---

## 📁 ESTRUCTURA DE CARPETAS

```
adea/
├── index.html              ← Home principal
├── catalogo.html           ← Catálogo con filtros
├── libro.html              ← Ficha individual de libro (recibe ?id=N)
├── bookstagramers.html     ← Captación de creadores
├── contacto.html           ← Formulario de contacto y partnerships
│
├── css/
│   └── main.css            ← CSS compartido (variables, nav, footer, cards, botones)
│
├── js/
│   ├── utils.js            ← Funciones reutilizables (loadBooks, buildBookCard, etc.)
│   └── components.js       ← Nav y footer dinámicos (injectShell)
│
├── data/
│   └── libros.json         ← 20 libros reales con datos, etiquetas, mood, links afiliados
│
└── assets/
    └── img/
        └── cover-placeholder.svg  ← Imagen de fallback
```

---

## 🚀 HOJA DE RUTA

### ✅ FASE 1 — Completada (lo que tienes ahora)

| Entregable | Estado |
|---|---|
| Home con hero, mood selector, libros destacados, CTA bookstagramer | ✅ |
| Catálogo con filtros por género, mood, orden y búsqueda libre | ✅ |
| Ficha de libro individual con sinopsis larga y CTA de compra | ✅ |
| Página bookstagramers con formulario de captación | ✅ |
| Página de contacto con form y datos de email | ✅ |
| CSS editorial oscuro con rojo como acento | ✅ |
| 20 libros reales con etiquetas emocionales y links de afiliado | ✅ |
| Mobile-first responsive | ✅ |
| Efectos fade-in, hover, animaciones | ✅ |

---

### 🔧 FASE 2 — Lo siguiente a implementar

#### 2.1 Configura tus links de afiliado (URGENTE)
- Entra en `data/libros.json`
- Reemplaza `TUAFILIADO` en todos los `afiliado_url` por tu ID de afiliado de Amazon
- Ejemplo: `?tag=miid-21` (España) o `?tag=miid-20` (USA)
- Registro: https://afiliados.amazon.es

#### 2.2 Deploy gratuito
**Opción A — GitHub Pages (recomendado):**
1. Sube toda la carpeta `adea/` a un repo de GitHub
2. Settings → Pages → Branch: main → Folder: / (root)
3. URL gratuita: `https://tuusuario.github.io/adea`

**Opción B — Netlify:**
1. Arrastra la carpeta a netlify.com/drop
2. URL gratuita inmediata + dominio personalizado fácil

#### 2.3 Dominio propio
- Registra `adea.es` o `adea-libros.com` (~12€/año)
- Conecta al hosting elegido

#### 2.4 Más libros al catálogo
- Edita `data/libros.json`
- Añade libros siguiendo la misma estructura JSON
- Para las portadas usa Open Library: `https://covers.openlibrary.org/b/isbn/ISBN-L.jpg`

---

### 📱 FASE 3 — Crecimiento y SEO

#### 3.1 SEO básico (sin backend)
Crea páginas HTML estáticas para keywords long-tail:
```
/libros-romance.html
/libros-fantasía.html  
/libros-adictivos.html
/libros-tipo-colleen-hoover.html
/mejores-libros-2026.html
```
Cada una carga el catálogo prefiltrado vía URL params.

#### 3.2 Blog (carpeta `/blog/`)
```
blog/
├── 10-libros-que-no-podras-dejar.html
├── libros-tipo-colleen-hoover.html
├── mejores-libros-romantasy-2026.html
└── libros-para-llorar.html
```
Artículos de 800-1200 palabras con libros afiliados embebidos.

#### 3.3 Newsletter
- Crea cuenta en Mailchimp o Brevo (gratis hasta 500 suscriptores)
- Añade formulario de captura en el footer y en el home
- Copy: "Cada lunes, el libro que necesitas esta semana"

---

### 🔌 FASE 4 — Backend (cuando escales)

#### Stack recomendado
- **Backend:** Supabase (PostgreSQL + Auth + Storage, gratis hasta 500MB)
- **Frontend:** Mismo HTML/JS, pero fetch a la API en vez de JSON local
- **Features a añadir:**
  - Login de usuarios
  - Lista de favoritos
  - Panel de bookstagramers (ver estadísticas de sus posts)
  - Sistema de reseñas de usuarios
  - Newsletter integrado

#### Migración de datos
Tu JSON actual es compatible directamente. Solo necesitas:
1. Crear tabla `libros` en Supabase con los mismos campos
2. Importar el JSON
3. Cambiar `fetch('data/libros.json')` por `fetch('https://TU_SUPABASE_URL/rest/v1/libros')`

---

## 💰 MONETIZACIÓN — Checklist

- [ ] **Amazon Afiliados:** Registrarse en afiliados.amazon.es, conseguir ID, actualizar JSON
- [ ] **Verificación:** Comprobar que los links de afiliado funcionan en producción
- [ ] **Analytics:** Añadir Google Analytics o Plausible para ver qué libros convierten más
- [ ] **Heatmaps:** Hotjar gratuito para ver qué hacen los usuarios con los botones de compra
- [ ] **A/B Testing (fase 3):** Probar distintos copies en los botones ("Comprar en Amazon" vs "Ver precio" vs "Lo quiero →")

---

## 📊 MÉTRICAS A SEGUIR

| Métrica | Herramienta | Frecuencia |
|---|---|---|
| Clics en botones de afiliado | Amazon Associates + GA4 | Semanal |
| Tráfico por libro | GA4 | Semanal |
| Conversión por mood/género | GA4 Custom Events | Quincenal |
| Formularios bookstagramers | Manual | Mensual |
| Posicionamiento SEO | Search Console | Mensual |

---

## 🐛 CÓMO AÑADIR UN LIBRO

Abre `data/libros.json` y añade un objeto al array siguiendo este template:

```json
{
  "id": 21,
  "titulo": "Título del libro",
  "autor": "Nombre Apellido",
  "imagen": "https://covers.openlibrary.org/b/isbn/ISBN-L.jpg",
  "genero": ["romance"],
  "mood": ["adictivo", "spicy"],
  "sinopsis_corta": "Una frase que engancha sin spoilers.",
  "sinopsis_larga": "Descripción de 3-5 frases. Emocional, no técnica. Vende el sentimiento, no el argumento.",
  "etiquetas": ["🔥 Viral en BookTok", "🌶️ Romance spicy"],
  "destacado": false,
  "afiliado_url": "https://www.amazon.es/dp/ASIN?tag=TUAFILIADO",
  "valoracion": 4.6
}
```

**IDs de Open Library por ISBN:**
`https://covers.openlibrary.org/b/isbn/9780000000000-L.jpg`

---

## ✅ CHECKLIST DE LANZAMIENTO

- [ ] Actualizar todos los links de afiliado en `data/libros.json`
- [ ] Subir a GitHub / Netlify
- [ ] Conectar dominio propio
- [ ] Activar Google Analytics (GA4)
- [ ] Registrar en Google Search Console
- [ ] Enviar sitemap a Search Console
- [ ] Crear perfil de Instagram @adea_libros
- [ ] Crear perfil de TikTok @adea_libros
- [ ] Primera publicación: "Estos son los 5 libros más adictivos del momento"
- [ ] DM a 10 bookstagramers pequeñas para colaborar

---

*AdEA — No vendemos libros. Vendemos lo que te hacen sentir.*
