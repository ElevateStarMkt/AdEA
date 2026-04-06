/* ===================================================
AdEA — JS compartido (utils.js)
=================================================== */

// ── CONSTANTES GLOBALES DE MOODS Y GÉNEROS ──
const ADEA_MOODS = [
  { value: "adictivo", emoji: "⚡", label: "Adictivo" },
  { value: "devastador", emoji: "💔", label: "Devastador" },
  { value: "spicy", emoji: "🌶️", label: "Spicy" },
  { value: "reflexivo", emoji: "💭", label: "Reflexivo" },
  { value: "épico", emoji: "🐉", label: "Épico" },
  { value: "oscuro", emoji: "🖤", label: "Oscuro" },
  { value: "ligero", emoji: "☀️", label: "Ligero" },
  { value: "emotivo", emoji: "😭", label: "Emotivo" },
  { value: "esperanzador", emoji: "🌟", label: "Esperanzador" },
  { value: "melancólico", emoji: "🌧️", label: "Melancólico" },
  { value: "nostalgico", emoji: "🕰️", label: "Nostálgico" },
  { value: "divertido", emoji: "😄", label: "Divertido" },
  { value: "intrigante", emoji: "🔍", label: "Intrigante" },
  { value: "reconfortante", emoji: "🫂", label: "Reconfortante" },
  { value: "slow-burn", emoji: "🕯️", label: "Slow Burn" },
  { value: "enemies-to-lovers", emoji: "⚔️", label: "Enemies to Lovers" },
];

const ADEA_GENEROS = [
  { value: "romance", label: "Romance" },
  { value: "thriller", label: "Thriller" },
  { value: "fantasia", label: "Fantasía" },
  { value: "romantasy", label: "Romantasy" },
  { value: "dark-romance", label: "Dark Romance" },
  { value: "ficción", label: "Ficción" },
  { value: "histórica", label: "Histórica" },
  { value: "drama", label: "Drama" },
  { value: "new-adult", label: "New Adult" },
  { value: "young-adult", label: "Young Adult" },
  { value: "literaria", label: "Literaria" },
  { value: "cozy-mystery", label: "Cozy Mystery" },
  { value: "misterio", label: "Misterio" },
  { value: "ciencia ficción", label: "Ciencia ficción" },
  { value: "terror", label: "Terror" },
  { value: "distopia", label: "Distopía" },
  { value: "poesia", label: "Poesía" },
  { value: "erotica", label: "Erótica" },
  { value: "policiaca", label: "Policíaca" },
];

// Moods sugeridos por género (para filtros dinámicos)
const MOODS_POR_GENERO = {
  romance: [
    "spicy",
    "emotivo",
    "slow-burn",
    "enemies-to-lovers",
    "reconfortante",
    "devastador",
  ],
  romantasy: [
    "épico",
    "spicy",
    "slow-burn",
    "enemies-to-lovers",
    "adictivo",
    "emotivo",
  ],
  "dark-romance": [
    "oscuro",
    "spicy",
    "enemies-to-lovers",
    "adictivo",
    "devastador",
  ],
  thriller: ["adictivo", "oscuro", "intrigante", "melancólico"],
  fantasia: ["épico", "adictivo", "slow-burn", "emotivo", "oscuro"],
  ficción: ["reflexivo", "emotivo", "melancólico", "reconfortante"],
  histórica: ["reflexivo", "emotivo", "épico", "nostalgico", "slow-burn"],
  drama: ["emotivo", "devastador", "melancólico", "reflexivo"],
  "new-adult": ["emotivo", "spicy", "slow-burn", "reconfortante", "divertido"],
  "young-adult": ["adictivo", "épico", "emotivo", "esperanzador"],
  terror: ["oscuro", "adictivo", "intrigante"],
  misterio: ["intrigante", "adictivo", "oscuro"],
  "cozy-mystery": ["ligero", "reconfortante", "divertido", "intrigante"],
  distopia: ["épico", "oscuro", "reflexivo", "adictivo"],
  literaria: ["reflexivo", "melancólico", "emotivo"],
  "ciencia ficción": ["épico", "reflexivo", "adictivo", "oscuro"],
};

function initNav() {
  const hamburger = document.querySelector(".nav__hamburger");
  const links = document.querySelector(".nav__links");
  if (!hamburger || !links) return;
  hamburger.addEventListener("click", () => {
    links.classList.toggle("open");
    hamburger.classList.toggle("open");
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("open");
      hamburger.classList.remove("open");
    }),
  );
  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove("open");
      hamburger.classList.remove("open");
    }
  });
}

function setActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__links a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const hrefFile = href.split("/").pop();
    if (hrefFile === path || (path === "" && hrefFile === "index.html")) {
      a.classList.add("active");
    }
  });
}

function initFadeIn() {
  const els = document.querySelectorAll(".fade-in");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

function showToast(msg, duration = 2800) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

function trackClick(libroId) {
  console.log("Click afiliado libro:", libroId);
  if (typeof Parse !== "undefined") {
    try {
      const Book = Parse.Object.extend("Books");
      const q = new Parse.Query(Book);
      q.equalTo("libroId", libroId);
      q.first()
        .then((book) => {
          if (book) {
            book.increment("clicks", 1);
            book
              .save(null, { useMasterKey: false })
              .catch((e) =>
                console.warn("No se pudo incrementar clicks:", e.message),
              );
          }
        })
        .catch((e) =>
          console.warn("Error buscando libro para clicks:", e.message),
        );
    } catch (e) {
      /* ignorar */
    }
  }
}

async function loadBooks() {
  if (typeof Parse !== "undefined") {
    try {
      const Book = Parse.Object.extend("Books");
      const q = new Parse.Query(Book);
      q.limit(200);
      const results = await q.find();
      if (results.length > 0) {
        return results.map((b) => ({
          id: b.get("libroId"),
          titulo: b.get("titulo"),
          autor: b.get("autor"),
          imagen: b.get("imagen"),
          genero: b.get("genero") || [],
          mood: b.get("mood") || [],
          sinopsis_corta: b.get("sinopsis_corta"),
          sinopsis_larga: b.get("sinopsis_larga"),
          etiquetas: b.get("etiquetas") || [],
          destacado: b.get("destacado") || false,
          afiliado_url: b.get("afiliado_url"),
          valoracion: b.get("valoracion") || 4.5,
          paginas: b.get("paginas") || 0,
          precio: b.get("precio") || 0,
          parseId: b.id,
          clicks: b.get("clicks") || 0,
          activo: b.get("activo") !== false,
          escritorId: b.get("escritorId") || "",
          colabF: b.get("colabF") === true,
          colabE: b.get("colabE") === true,
        }));
      }
    } catch (e) {
      console.warn("Parse no disponible, usando JSON local:", e.message);
    }
  }
  const paths = [
    "data/libros.json",
    "../data/libros.json",
    "/data/libros.json",
  ];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        const books = await res.json();
        return books.map((b) => ({ ...b, activo: b.activo !== false }));
      }
    } catch {
      /* intentar siguiente */
    }
  }
  console.error("No se pudo cargar libros.json desde ninguna ruta");
  return [];
}

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, rating || 0));
  const full = Math.floor(r);
  const half = r % 1 >= 0.5 ? 1 : 0;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - half);
}

function buildBookCard(book, linkPrefix = "") {
  const rating = book.valoracion_review || book.valoracion || 4.5;
  const tagsToShow = book.topEtiquetas?.length
    ? book.topEtiquetas.slice(0, 2)
    : (book.etiquetas || []).slice(0, 2);
  const tagsHTML = tagsToShow
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");
  const sinopsisRaw = book.sinopsis_corta || "";
  const sinopsisCorta =
    sinopsisRaw.length > 80
      ? sinopsisRaw.substring(0, 80) + "..."
      : sinopsisRaw;
  const precioDisplay = book.precio
    ? `${Number(book.precio).toFixed(2)} €`
    : "—";
  const ratingDisplay = Number(rating).toFixed(1);

  return `
<article class="book-card fade-in" onclick="location.href='${linkPrefix}libro.html?id=${book.id}'">
  <div class="book-card__cover">
    <img src="${book.imagen || ""}" alt="${book.titulo || ""}" loading="lazy"
      onerror="this.src='${linkPrefix}assets/img/cover-placeholder.svg'">
    ${book.destacado ? '<span class="book-card__badge">Destacado</span>' : ""}
  </div>
  <div class="book-card__body">
    <div>
      <div class="book-card__title">${book.titulo || ""}</div>
      <div class="book-card__author">${book.autor || ""}</div>
    </div>
    <p class="book-card__synopsis">${sinopsisCorta}</p>
    <div class="book-card__tags">${tagsHTML}</div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <div class="stars">${renderStars(rating)}</div>
      <span style="font-size:0.75rem;color:var(--text-dim)">${ratingDisplay}</span>
      <span style="font-size:0.75rem;color:var(--gold);font-weight:600;margin-left:4px;">${precioDisplay}</span>
    </div>
  </div>
  <div class="book-card__footer">
    <a href="${book.afiliado_url || "#"}" target="_blank" rel="noopener sponsored" class="btn btn-amazon"
      onclick="event.stopPropagation(); trackClick(${book.id});">
      Comprar
    </a>
  </div>
</article>`;
}

/**
 * Genera opciones <option> de moods para un <select>,
 * opcionalmente filtradas por género para mostrar los más relevantes primero.
 */
function buildMoodOptions(generoActivo = "", incluirVacio = true) {
  let moods = [...ADEA_MOODS];

  // Si hay género activo, reordenar: relevantes primero
  if (generoActivo && MOODS_POR_GENERO[generoActivo]) {
    const relevantes = MOODS_POR_GENERO[generoActivo];
    moods.sort((a, b) => {
      const ia = relevantes.indexOf(a.value);
      const ib = relevantes.indexOf(b.value);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  let html = incluirVacio
    ? '<option value="">Todos los moods</option>'
    : '<option value="">Selecciona...</option>';
  moods.forEach((m) => {
    html += `<option value="${m.value}">${m.emoji} ${m.label}</option>`;
  });
  return html;
}

/**
 * Genera opciones <option> de géneros para un <select>
 */
function buildGeneroOptions(incluirTodos = true) {
  let html = incluirTodos
    ? '<option value="">Todos los géneros</option>'
    : '<option value="">Selecciona...</option>';
  ADEA_GENEROS.forEach((g) => {
    html += `<option value="${g.value}">${g.label}</option>`;
  });
  return html;
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  setActiveNav();
  initFadeIn();
});

function mostrarModalConfirmacion(
  titulo,
  mensaje,
  onConfirm,
  tipo = "primary",
) {
  // Eliminar modal previo si existe
  const existente = document.getElementById("custom-confirm-modal");
  if (existente) existente.remove();

  const modalHTML = `
  <div id="custom-confirm-modal" class="modal-overlay" style="display:flex; z-index: 2000;">
    <div class="modal" style="max-width: 480px;">
      <button class="modal__close" onclick="this.closest('.modal-overlay').remove()">×</button>
      <h3 class="modal__title" style="padding-right:0">${titulo}</h3>
      <p style="color:var(--text-muted); margin-bottom:24px; line-height:1.5; font-size:0.9rem;">${mensaje}</p>
      <div style="display:flex; gap:12px; justify-content:flex-end; flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn ${tipo === "danger" ? "btn-danger" : "btn-primary"}" id="modal-confirm-btn">Confirmar</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("modal-confirm-btn").onclick = () => {
    document.getElementById("custom-confirm-modal").remove();
    if (onConfirm) onConfirm();
  };
}

function mostrarModalInput(
  titulo,
  mensaje,
  placeholder = "",
  onConfirm,
  onCancel = null,
) {
  // Eliminar modal previo si existe
  const existente = document.getElementById("custom-input-modal");
  if (existente) existente.remove();

  const modalHTML = `
  <div id="custom-input-modal" class="modal-overlay" style="display:flex; z-index: 2000;">
    <div class="modal" style="max-width: 480px;">
      <button class="modal__close" onclick="document.getElementById('custom-input-modal').remove()">×</button>
      <h3 class="modal__title" style="padding-right:0">${titulo}</h3>
      <p style="color:var(--text-muted); margin-bottom:16px; line-height:1.5; font-size:0.9rem;">${mensaje}</p>
      <input type="text" id="custom-input-field" placeholder="${placeholder}" 
             style="width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font-size:0.9rem;margin-bottom:20px;" 
             autofocus />
      <div style="display:flex; gap:12px; justify-content:flex-end; flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="document.getElementById('custom-input-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" id="modal-input-confirm">Confirmar</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const input = document.getElementById("custom-input-field");
  const confirmBtn = document.getElementById("modal-input-confirm");

  const handleConfirm = () => {
    const value = input.value.trim();
    document.getElementById("custom-input-modal").remove();
    if (onConfirm) onConfirm(value);
  };

  confirmBtn.onclick = handleConfirm;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape")
      document.getElementById("custom-input-modal").remove();
  });

  // Focus en el input
  setTimeout(() => input.focus(), 100);
}
