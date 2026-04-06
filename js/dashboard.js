// ================================================================
// DASHBOARD.JS — VERSIÓN REESTRUCTURADA
// ================================================================

injectShell("");

// Estado global
let currentUser = null;
let userRole = "lector";
let _esAdmin = false;
let _simulatedRole = null; // Para admin: rol que se está simulando

// Datos
let favorites = [],
  leidos = [],
  resenas = [],
  myBooks = [],
  collaborations = [],
  allBooks = [];

// Info de roles
const ROL_INFO = {
  lector: {
    emoji: "📖",
    titulo: "Lector",
    desc: "Guarda favoritos, escribe reseñas y descubre libros.",
    color: "#60a5fa",
  },
  escritor: {
    emoji: "✍️",
    titulo: "Escritor",
    desc: "Publica y gestiona tus libros. Conecta con bookstagramers.",
    color: "#4ade80",
  },
  bookstagramer: {
    emoji: "📸",
    titulo: "Bookstagramer",
    desc: "Gestiona colaboraciones y muestra tu perfil a autores.",
    color: "#f97316",
  },
};

// ════════════════════════════════════════════════
// NAVEGACIÓN DINÁMICA POR ROL
// ════════════════════════════════════════════════
function buildNavForRole(role) {
  const nav = document.getElementById("dashboard-nav");
  if (!nav) return;

  const items = getNavItemsForRole(role);

  nav.innerHTML = items
    .map(
      (item, i) => `
                <button class="dashboard-nav-btn${i === 0 ? " active" : ""}" data-section="${item.section}">
                  ${item.label}
                  ${item.count ? `<span class="count" id="fav-count">0</span>` : ""}
                  ${item.countId ? `<span class="count" id="${item.countId}" style="display:none">0</span>` : ""}
                </button>
              `,
    )
    .join("");

  // Activar primera sección
  document
    .querySelectorAll(".dashboard-section")
    .forEach((s) => s.classList.remove("active"));
  if (items[0]?.section) {
    const first = document.getElementById("section-" + items[0].section);
    if (first) first.classList.add("active");
  }

  // Event listeners
  nav.querySelectorAll(".dashboard-nav-btn").forEach((btn) => {
    btn.onclick = () => switchSection(btn.dataset.section);
  });
}

function getNavItemsForRole(role) {
  const common = [
    { section: "perfil", label: "Mi Perfil" },
    { section: "sugerir-libro", label: "Sugerir libro" },
    { section: "chat-adea", label: "Mensajes AdEA" },
    { section: "cambiar-rol", label: "Tipo de cuenta" },
    { section: "configuracion", label: "Configuración" },
  ];

  if (role === "admin") {
    return [
      { section: "admin-panel", label: "🛡️ Admin" },
      { section: "mis-libros", label: "Mis libros" },
      { section: "favoritos", label: "Favoritos", count: true },
      { section: "leidos", label: "Leídos" },
      { section: "resenas", label: "Reseñas" },
      { section: "mis-colaboraciones", label: "Colaboraciones" },
      {
        section: "solicitudes-recibidas",
        label: "Recibidas",
        countId: "count-solicitudes-recibidas",
      },
      { section: "solicitudes-enviadas", label: "Enviadas" },
      { section: "estadisticas-lector", label: "Estadísticas" },
      { section: "bookstagramers-match", label: "Bookstagramers" },
      { section: "autores-match", label: "Autores" },
      { section: "perfil-bs", label: "Mis Condiciones" },
      ...common,
    ];
  }
  if (role === "lector") {
    return [
      { section: "favoritos", label: "Favoritos", count: true },
      { section: "leidos", label: "Leídos" },
      { section: "resenas", label: "Reseñas" },
      { section: "estadisticas-lector", label: "Estadísticas" },
      ...common,
    ];
  }
  if (role === "escritor") {
    return [
      { section: "mis-libros", label: "Mis libros" },
      { section: "estadisticas-escritor", label: "Estadísticas" },
      { section: "bookstagramers-match", label: "Bookstagramers" },
      {
        section: "solicitudes-recibidas",
        label: "Recibidas",
        countId: "count-solicitudes-recibidas",
      },
      { section: "solicitudes-enviadas", label: "Enviadas" },
      ...common,
    ];
  }
  if (role === "bookstagramer") {
    return [
      { section: "favoritos", label: "Favoritos", count: true },
      { section: "leidos", label: "Leídos" },
      { section: "resenas", label: "Reseñas" },
      { section: "mis-colaboraciones", label: "Colaboraciones" },
      {
        section: "solicitudes-recibidas",
        label: "Recibidas",
        countId: "count-solicitudes-recibidas",
      },
      { section: "solicitudes-enviadas", label: "Enviadas" },
      { section: "autores-match", label: "Autores" },
      { section: "estadisticas-lector", label: "Estadísticas" },
      { section: "perfil-bs", label: "Mis Condiciones" },
      ...common,
    ];
  }
  return common;
}

// ════════════════════════════════════════════════
// CAMBIO DE SECCIÓN
// ════════════════════════════════════════════════
function switchSection(id) {
  // Quitar active de todos
  document
    .querySelectorAll(".dashboard-nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".dashboard-section")
    .forEach((s) => s.classList.remove("active"));

  // Activar sección y botón
  const sec = document.getElementById("section-" + id);
  if (sec) sec.classList.add("active");
  const btn = document.querySelector(
    `.dashboard-nav-btn[data-section="${id}"]`,
  );
  if (btn) btn.classList.add("active");

  // Cargas específicas
  if (id === "chat-adea") loadChatMessages();
  if (id === "cambiar-rol") renderRolCards(getCurrentRole());
  if (id === "admin-panel" && _esAdmin) renderAdminPanel();
}

function getCurrentRole() {
  return _simulatedRole || userRole;
}

// ════════════════════════════════════════════════
// TELEGRAM
// ════════════════════════════════════════════════
function setupTelegramLink() {
  setTimeout(() => {
    const linkEl = document.getElementById("telegram-link");
    const descEl = document.getElementById("telegram-desc");
    if (!linkEl || !descEl) return;
    const BS_GROUP = "https://t.me/+SpK_2-X0nHUwNDZk";
    const PUBLIC_CHANNEL = "https://t.me/+LsPSJ4CAql85ODc8";
    const role = getCurrentRole();
    if (role === "bookstagramer") {
      linkEl.href = BS_GROUP;
      linkEl.textContent = "Unirme al grupo BS →";
      descEl.innerHTML = `Grupo exclusivo para bookstagramers.<br><a href="${PUBLIC_CHANNEL}" target="_blank" rel="noopener" style="color:var(--red);text-decoration:underline;font-size:0.7rem">O unirte al canal público</a>`;
    } else {
      linkEl.href = PUBLIC_CHANNEL;
      linkEl.textContent = "Unirme al canal →";
      descEl.textContent = "Novedades, recomendaciones y comunidad lectora.";
    }
  }, 0);
}

// ════════════════════════════════════════════════
// CARGA INICIAL
// ════════════════════════════════════════════════
async function loadUserData() {
  currentUser = usuarioActual();
  if (!currentUser) {
    location.href = "auth.html";
    return;
  }

  _esAdmin = await esAdmin();
  userRole = currentUser.get("rol") || "lector";

  // UI Usuario
  document.getElementById("user-avatar").textContent = (currentUser.get(
    "username",
  ) || "U")[0].toUpperCase();
  document.getElementById("user-name").textContent =
    currentUser.get("nombre") || currentUser.get("username") || "Usuario";
  document.getElementById("user-rol").textContent = _esAdmin
    ? "ADMIN"
    : userRole.toUpperCase();
  document.getElementById("user-seguidores").textContent =
    currentUser.get("seguidoresAdEA") || 0;

  // Campos readonly
  document.getElementById("p-nombre").value = currentUser.get("nombre") || "";
  document.getElementById("p-email").value = currentUser.get("email") || "";
  document.getElementById("p-username").value =
    currentUser.get("username") || "";
  document.getElementById("p-rol").value = _esAdmin
    ? "ADMIN"
    : userRole.toUpperCase();
  document.getElementById("ver-mi-perfil").href =
    "perfil.html?id=" + currentUser.id;

  // Mostrar campos según rol
  const role = getCurrentRole();
  if (["bookstagramer", "escritor", "admin"].includes(role)) {
    document.getElementById("pp-instagram-group").style.display = "block";
  }
  if (["bookstagramer", "admin"].includes(role)) {
    document.getElementById("pp-tarifa-group").style.display = "block";
    document.getElementById("pp-condiciones-group").style.display = "block";
  }

  // Perfil público
  const perfil = await getPerfilPublico(currentUser.id);
  if (perfil) {
    document.getElementById("pp-bio").value = perfil.bio || "";
    document.getElementById("pp-web").value = perfil.web || "";
    const ig = document.getElementById("pp-instagram");
    const ge = document.getElementById("pp-genero");
    const ta = document.getElementById("pp-tarifa");
    const co = document.getElementById("pp-condiciones");
    if (ig) ig.value = perfil.instagram || "";
    if (ge) ge.value = perfil.generoFavorito || "";
    if (ta) ta.value = perfil.tarifa || "";
    if (co) co.value = perfil.condiciones || "";
    document.getElementById("user-seguidores").textContent =
      perfil.seguidoresAdEA || currentUser.get("seguidoresAdEA") || 0;
  }

  // Navegación
  buildNavForRole(_esAdmin ? "admin" : userRole);

  // Cargar libros globales
  allBooks = await loadBooks();

  // Cargar datos según rol real (no simulado)
  if (userRole === "lector" || _esAdmin) await loadLectorData();
  if (userRole === "escritor" || _esAdmin) {
    await loadEscritorData();
    await loadSolicitudesRecibidas();
    await loadSolicitudesEnviadas();
  }
  if (userRole === "bookstagramer" || _esAdmin) {
    if (userRole !== "escritor") await loadLectorData();
    await loadBookstagramerData();
    await loadSolicitudesRecibidas();
    await loadSolicitudesEnviadas();
  }

  // Sugerencias (SIEMPRE para todos)
  loadSuggestHistory();
  setupTelegramLink();
  renderRolCards(userRole);
  if (_esAdmin) renderAdminPanel();
}

// ════════════════════════════════════════════════
// CAMBIAR ROL
// ════════════════════════════════════════════════
function renderRolCards(rolActual) {
  const container = document.getElementById("rol-cards");
  if (!container) return;
  container.innerHTML = Object.entries(ROL_INFO)
    .map(([key, info]) => {
      const isActive = key === rolActual;
      return `<div style="background:var(--bg3);border:2px solid ${isActive ? info.color : "var(--border)"};border-radius:var(--radius-lg);padding:20px;text-align:center;transition:all var(--transition);${isActive ? `box-shadow:0 0 20px ${info.color}33` : ""}">
                  <div style="font-size:2rem;margin-bottom:8px">${info.emoji}</div>
                  <div style="font-weight:700;color:var(--text);margin-bottom:6px">${info.titulo}</div>
                  <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px">${info.desc}</div>
                  ${
                    isActive
                      ? `<span style="font-size:0.75rem;background:${info.color}22;color:${info.color};padding:4px 12px;border-radius:20px;font-weight:600">✓ Rol actual</span>`
                      : `<button class="btn btn-secondary btn-sm" onclick="handleCambiarRol('${key}')" style="width:100%;justify-content:center">Cambiar a ${info.titulo}</button>`
                  }
                </div>`;
    })
    .join("");
}

async function handleCambiarRol(nuevoRol) {
  const status = document.getElementById("cambiar-rol-status");

  // ✅ Reemplaza confirm() por modal personalizado
  mostrarModalConfirmacion(
    `Cambiar a ${ROL_INFO[nuevoRol]?.titulo}`,
    `¿Estás seguro de que quieres cambiar tu cuenta a <strong>"${ROL_INFO[nuevoRol]?.titulo}"</strong>?<br><br>Todas tus funcionalidades se actualizarán según el nuevo rol.`,
    async () => {
      if (status) {
        status.textContent = "⏳ Cambiando rol…";
        status.style.color = "var(--text-muted)";
      }
      const result = await cambiarRolCuenta(nuevoRol);
      if (result.ok) {
        showToast(`✅ Ahora eres ${ROL_INFO[nuevoRol]?.titulo}. Recargando…`);
        if (status) status.textContent = "✅ Rol actualizado. Recargando...";
        setTimeout(() => location.reload(), 1400);
      } else {
        if (status) {
          status.textContent = "❌ " + (result.error || "Error al cambiar");
          status.style.color = "#f87171";
        }
        showToast("❌ " + (result.error || "Error al cambiar rol"));
      }
    },
    "primary",
  );
}

// ════════════════════════════════════════════════
// ADMIN: SIMULAR ROL
// ════════════════════════════════════════════════
function renderAdminPanel() {
  const sec = document.getElementById("section-admin-panel");
  if (!sec) return;
  // Resetear botones
  ["lector", "escritor", "bookstagramer"].forEach((r) => {
    const btn = document.getElementById(`sim-${r}`);
    if (btn) btn.classList.remove("btn-primary");
  });
  const resetBtn = document.getElementById("sim-reset");
  if (resetBtn && !_simulatedRole) resetBtn.classList.add("btn-primary");
}

function adminSimularRol(rol) {
  _simulatedRole = rol; // null = volver a admin
  // Actualizar botones
  ["lector", "escritor", "bookstagramer"].forEach((r) => {
    const btn = document.getElementById(`sim-${r}`);
    if (btn) btn.classList.toggle("btn-primary", r === rol);
  });
  const resetBtn = document.getElementById("sim-reset");
  if (resetBtn) resetBtn.classList.toggle("btn-primary", !rol);

  // Reconstruir nav con el rol simulado
  buildNavForRole(rol || "admin");

  // Mensaje
  if (rol) {
    showToast(`👁️ Simulando: ${ROL_INFO[rol]?.titulo || rol}`);
  } else {
    showToast("🔁 Volviendo a vista de administrador");
  }
}

// ════════════════════════════════════════════════
// LECTOR
// ════════════════════════════════════════════════
async function loadLectorData() {
  favorites = await getFavoritos();
  leidos = await getLeidos();
  resenas = await getResenas();
  renderFavorites();
  renderLeidos();
  renderResenas();
  document.getElementById("stat-leidos").textContent =
    currentUser.get("leidos") || 0;
  document.getElementById("stat-matches").textContent =
    currentUser.get("guardado") || 0;
  document.getElementById("stat-descartados").textContent =
    currentUser.get("descartado") || 0;
  document.getElementById("stat-favoritos").textContent = resenas.filter(
    (r) => r.estrellas >= 4,
  ).length;
  const fc = document.getElementById("fav-count");
  if (fc) fc.textContent = favorites.length;
}

function renderFavorites() {
  const list = document.getElementById("favorites-list");
  const leidosIds = new Set(leidos.map((l) => String(l.libroId)));
  if (!favorites.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📚</div><p>No tienes libros guardados.</p><div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a href="catalogo.html" class="btn btn-primary btn-sm">Ver catálogo</a><a href="descubrir.html" class="btn btn-secondary btn-sm">Déjate sorprender</a></div></div>`;
    return;
  }
  list.innerHTML = favorites
    .map((fav) => {
      const book = allBooks.find((b) => String(b.id) === String(fav.libroId));
      const titulo = book?.titulo || fav.titulo || "Libro no disponible";
      const autor = book?.autor || fav.autor || "";
      const imagen =
        book?.imagen || fav.imagen || "assets/img/cover-placeholder.svg";
      const url = book?.afiliado_url || fav.afiliado_url || "#";
      const yaLeido = leidosIds.has(String(fav.libroId));
      const btnR = yaLeido
        ? `<button class="btn btn-ghost btn-sm" disabled style="color:var(--text-dim)">✓ Ya leído</button>`
        : `<button class="btn btn-ghost btn-sm" onclick="markAsRead(${fav.libroId})">Marcar leído</button>`;
      return `<div class="favorite-item">
                  <div class="favorite-item__cover"><img src="${imagen}" alt="${titulo}" onerror="this.src='assets/img/cover-placeholder.svg'"/></div>
                  <div class="favorite-item__info">
                    <div class="favorite-item__title">${titulo}</div>
                    <div class="favorite-item__author">${autor}</div>
                    <div class="favorite-item__actions">
                      <a href="${url}" target="_blank" rel="noopener sponsored" class="btn btn-amazon btn-sm">Comprar</a>
                      ${btnR}
                      <a href="libro.html?id=${fav.libroId}" class="btn btn-secondary btn-sm">Ver ficha</a>
                      <button class="btn btn-ghost btn-sm" style="color:#f87171" onclick="removeFav(${fav.libroId})">Eliminar</button>
                    </div>
                  </div>
                </div>`;
    })
    .join("");
}

function renderLeidos() {
  const list = document.getElementById("leidos-list");
  if (!leidos.length) {
    list.innerHTML = `<div class="empty-state"><p>No has marcado libros como leídos.</p></div>`;
    return;
  }
  list.innerHTML = leidos
    .map((l) => {
      const book = allBooks.find((b) => String(b.id) === String(l.libroId));
      if (!book) return "";
      return `<div class="favorite-item">
                  <div class="favorite-item__cover"><img src="${book.imagen || ""}" onerror="this.src='assets/img/cover-placeholder.svg'"/></div>
                  <div class="favorite-item__info">
                    <div class="favorite-item__title">${book.titulo || ""}</div>
                    <div class="favorite-item__author">${book.autor || ""}</div>
                    <div class="favorite-item__actions"><a href="libro.html?id=${book.id}" class="btn btn-secondary btn-sm">Ver ficha</a></div>
                  </div>
                </div>`;
    })
    .join("");
}

function renderResenas() {
  const list = document.getElementById("resenas-list");
  if (!resenas.length) {
    list.innerHTML = `<div class="empty-state"><p>No has escrito reseñas aún.</p></div>`;
    return;
  }
  list.innerHTML = resenas
    .map((r) => {
      const s =
        "★".repeat(Math.floor(r.estrellas || 0)) +
        "☆".repeat(5 - Math.floor(r.estrellas || 0));
      const book = allBooks.find((b) => String(b.id) === String(r.libroId));
      return `<div class="review-card">
                  <div class="review-card__header">
                    <div><span class="review-card__stars">${s}</span>${book ? `<span style="font-size:.85rem;color:var(--text-muted);margin-left:8px">— ${book.titulo}</span>` : ""}</div>
                    ${r.mood ? `<span class="review-card__mood">${r.mood}</span>` : ""}
                  </div>
                  <p class="review-card__text">"${r.texto || ""}"</p>
                  ${r.etiqueta ? `<span class="review-card__tag">${r.etiqueta}</span>` : ""}
                </div>`;
    })
    .join("");
}

async function removeFav(libroId) {
  const r = await removeFavorito(libroId);
  if (r.ok) {
    favorites = favorites.filter((f) => String(f.libroId) !== String(libroId));
    renderFavorites();
    showToast("Eliminado de favoritos");
  } else showToast("Error al eliminar");
}

async function markAsRead(libroId) {
  await addLeido(libroId);
  showToast("Marcado como leído");
  await loadLectorData();
}

// ════════════════════════════════════════════════
// ESCRITOR
// ════════════════════════════════════════════════
async function loadEscritorData() {
  myBooks = await getMisLibros(currentUser.id);
  renderWriterBooks();
  await loadBookstagramerMatchesForEscritor();
}

function renderWriterBooks() {
  const tbody = document.getElementById("writer-books-list");
  if (!myBooks.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No has publicado libros aún.</td></tr>`;
    return;
  }
  tbody.innerHTML = myBooks
    .map(
      (b) => `<tr class="book-row">
                <td><strong>${b.titulo || ""}</strong><br><small>${b.autor || ""}</small></td>
                <td>${b.guardado || 0}</td><td>${b.descartado || 0}</td><td>${b.clicks || 0}</td>
                <td><span class="book-row__status ${b.activo ? "book-row__status--active" : "book-row__status--inactive"}">${b.activo ? "Activo" : "Inactivo"}</span></td>
                <td><button class="btn btn-sm btn-secondary" onclick="editBook('${b.id}')">Editar</button></td>
              </tr>`,
    )
    .join("");
  document.getElementById("escritor-activos").textContent = myBooks.filter(
    (b) => b.activo !== false,
  ).length;
  document.getElementById("escritor-inactivos").textContent =
    myBooks.length - document.getElementById("escritor-activos").textContent;
  document.getElementById("escritor-total-guardados").textContent =
    myBooks.reduce((s, b) => s + (b.guardado || 0), 0);
  document.getElementById("escritor-total-descartados").textContent =
    myBooks.reduce((s, b) => s + (b.descartado || 0), 0);
  document.getElementById("escritor-total-clicks").textContent = myBooks.reduce(
    (s, b) => s + (b.clicks || 0),
    0,
  );
}

function showAddBookForm() {
  document.getElementById("add-book-form").style.display = "block";
  document
    .getElementById("add-book-form")
    .scrollIntoView({ behavior: "smooth" });
}

async function submitBook() {
  const titulo = document.getElementById("book-titulo").value.trim();
  const autor = document.getElementById("book-autor").value.trim();
  const genero = document.getElementById("book-genero").value;
  const imagen = document.getElementById("book-imagen").value.trim();
  const mood = document.getElementById("book-mood").value;
  const paginas = parseInt(document.getElementById("book-paginas").value) || 0;
  const precio = parseFloat(document.getElementById("book-precio").value) || 0;
  const sCorta = document.getElementById("book-sinopsis-corta").value.trim();
  const sLarga = document.getElementById("book-sinopsis-larga").value.trim();
  const colabF = document.getElementById("book-colabF").checked;
  const colabE = document.getElementById("book-colabE").checked;
  const activo = document.getElementById("book-activo").checked;
  if (!titulo || !autor || !imagen || !sCorta || !sLarga) {
    showToast("Completa los campos obligatorios");
    return;
  }
  const url = `https://www.amazon.es/s?k=${encodeURIComponent(titulo + " " + autor)}&tag=adea-21`;
  const result = await addLibro({
    titulo,
    autor,
    genero: [genero],
    mood: [mood],
    imagen,
    paginas,
    precio,
    sinopsis_corta: sCorta,
    sinopsis_larga: sLarga,
    colabF,
    colabE,
    activo,
    afiliado_url: url,
    escritorId: currentUser.id,
  });
  if (result.ok) {
    showToast("Libro publicado");
    document.getElementById("add-book-form").style.display = "none";
    await loadEscritorData();
  } else showToast("Error: " + result.error);
  location.reload();
}

function editBook(bookId) {
  const book = myBooks.find((b) => b.id === bookId);
  if (!book) {
    showToast("Libro no encontrado");
    return;
  }
  document.getElementById("edit-book-id").value = bookId;
  document.getElementById("edit-titulo").value = book.titulo || "";
  document.getElementById("edit-autor").value = book.autor || "";
  document.getElementById("edit-paginas").value = book.paginas || "";
  document.getElementById("edit-precio").value = book.precio || "";
  document.getElementById("edit-sinopsis").value = book.sinopsis_corta || "";
  document.getElementById("edit-sinopsis-larga").value =
    book.sinopsis_larga || "";
  document.getElementById("edit-colabF").checked = book.colabF || false;
  document.getElementById("edit-colabE").checked = book.colabE || false;
  document.getElementById("edit-activo").checked = book.activo !== false;
  document.getElementById("edit-book-modal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("edit-book-modal").style.display = "none";
}

async function saveEditBook() {
  const bookId = document.getElementById("edit-book-id").value;
  const updates = {
    titulo: document.getElementById("edit-titulo").value.trim(),
    autor: document.getElementById("edit-autor").value.trim(),
    paginas: parseInt(document.getElementById("edit-paginas").value) || 0,
    precio: parseFloat(document.getElementById("edit-precio").value) || 0,
    sinopsis_corta: document.getElementById("edit-sinopsis").value.trim(),
    sinopsis_larga: document.getElementById("edit-sinopsis-larga").value.trim(),
    colabF: document.getElementById("edit-colabF").checked,
    colabE: document.getElementById("edit-colabE").checked,
    activo: document.getElementById("edit-activo").checked,
  };
  const result = await updateLibro(bookId, updates);
  if (result.ok) {
    showToast("Libro actualizado");
    closeEditModal();
    await loadEscritorData();
  } else showToast("Error: " + (result.error || "desconocido"));
}

async function loadBookstagramerMatchesForEscritor() {
  try {
    const bs = await getBookstagramersParaMatch("");
    const list = document.getElementById("bookstagramers-list");
    if (!bs.length) {
      list.innerHTML = `<div class="empty-state"><p>No hay bookstagramers disponibles aún.</p></div>`;
      return;
    }
    list.innerHTML = bs
      .map(
        (b) => `<div class="favorite-item">
                  <div class="favorite-item__info" style="flex:1">
                    <div class="favorite-item__title">${b.nombre}</div>
                    <div class="favorite-item__author">${b.instagram ? "📸 @" + b.instagram.replace("@", "") + " · " : ""}Géneros: ${b.generosResenados.join(", ")}${b.tarifa ? " · Tarifa: " + b.tarifa + "€" : ""}</div>
                  </div>
                  <div class="favorite-item__actions"><a href="perfil.html?id=${b.id}" class="btn btn-secondary btn-sm">Ver perfil →</a></div>
                </div>`,
      )
      .join("");
  } catch {
    document.getElementById("bookstagramers-list").innerHTML =
      `<div class="empty-state"><p>Error al cargar.</p></div>`;
  }
}

// ════════════════════════════════════════════════
// BOOKSTAGRAMER
// ════════════════════════════════════════════════
async function loadBookstagramerData() {
  const perfil = await getPerfilPublico(currentUser.id);
  const tarifaActual = perfil?.tarifa || currentUser.get("tarifa") || 0;
  collaborations = await getColaboraciones(currentUser.id);
  renderCollaborations();
  renderBSEarnings(tarifaActual);
  document.getElementById("bs-instagram").value =
    perfil?.instagram || currentUser.get("instagram") || "";
  document.getElementById("bs-tarifa-input").value = tarifaActual;
  document.getElementById("bs-condiciones").value =
    perfil?.condiciones || currentUser.get("condiciones") || "";
  document.getElementById("bs-tarifa").textContent = tarifaActual + "€";
}

// Modal para reseñar desde colaboración
function abrirModalResenaCollab(collabId, tituloLibro, autorLibro, libroId) {
  const modalHTML = `
  <div id="modal-resena-collab" class="modal-overlay" style="display:flex;z-index:2000">
    <div class="modal" style="max-width:520px">
      <button class="modal__close" onclick="document.getElementById('modal-resena-collab').remove()">×</button>
      <h3 class="modal__title">Reseñar: ${tituloLibro}</h3>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px">${autorLibro}</p>
      <form id="form-resena-collab">
        <input type="hidden" id="resena-collab-id" value="${collabId}">
        <input type="hidden" id="resena-collab-libroId" value="${libroId || ""}">
        <div class="form-group">
          <label>Tu valoración (0-5) *</label>
          <div style="display:flex;align-items:center;gap:12px">
            <input type="text" id="resena-collab-rating" placeholder="4.5" maxlength="3" required style="width:80px;text-align:center;font-size:1.1rem;font-weight:700">
            <span style="font-size:0.8rem;color:var(--text-dim)">estrellas</span>
          </div>
          <small style="color:var(--text-dim)">Ej: 4, 4.5, 5 - Se aceptan coma o punto</small>
        </div>
        <div class="form-group">
          <label>Tu reseña *</label>
          <textarea id="resena-collab-texto" placeholder="¿Qué te ha parecido? Sé sincero/a..." required style="min-height:120px"></textarea>
        </div>
        <div class="form-group">
          <label>Mood al leerlo</label>
          <select id="resena-collab-mood">
            <option value="">Selecciona...</option>
            <option value="adictivo">⚡ Adictivo</option>
            <option value="devastador">💔 Devastador</option>
            <option value="spicy">🌶️ Spicy</option>
            <option value="reflexivo">💭 Reflexivo</option>
            <option value="épico">🐉 Épico</option>
            <option value="oscuro">🖤 Oscuro</option>
            <option value="ligero">☀️ Ligero</option>
            <option value="emotivo">😭 Emotivo</option>
            <option value="esperanzador">🌟 Esperanzador</option>
            <option value="melancólico">🌧️ Melancólico</option>
            <option value="nostalgico">🕰️ Nostálgico</option>
            <option value="divertido">😄 Divertido</option>
            <option value="intrigante">🔍 Intrigante</option>
            <option value="reconfortante">🫂 Reconfortante</option>
            <option value="slow-burn">🕯️ Slow Burn</option>
            <option value="enemies-to-lovers">⚔️ Enemies to Lovers</option>
            <option value="aburrido">😴 Aburrido</option>
          </select>
        </div>
        <div class="form-group">
          <label>Etiqueta resumen *sin SPOILERS</label>
          <input type="text" id="resena-collab-etiqueta" placeholder="Ej: No te esperas el final" maxlength="50">
        </div>
        <div class="modal__actions" style="border-top:none;padding-top:0">
          <button type="submit" class="btn btn-primary" style="flex:1">Publicar reseña</button>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-resena-collab').remove()" style="flex:1">Cancelar</button>
        </div>
      </form>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Validación de rating (igual que en libro.html)
  document
    .getElementById("resena-collab-rating")
    .addEventListener("input", (e) => {
      e.target.value = e.target.value
        .replace(",", ".")
        .replace(/[^0-5.]/g, "")
        .slice(0, 3);
    });

  // Submit (igual que en libro.html)
  document
    .getElementById("form-resena-collab")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const collabId = document.getElementById("resena-collab-id").value;
      const libroId = document.getElementById("resena-collab-libroId").value;
      let rating = parseFloat(
        document.getElementById("resena-collab-rating").value.replace(",", "."),
      );
      const texto = document.getElementById("resena-collab-texto").value.trim();
      const mood = document.getElementById("resena-collab-mood").value;
      const etiqueta = document
        .getElementById("resena-collab-etiqueta")
        .value.trim();

      if (isNaN(rating) || rating < 0 || rating > 5) {
        showToast("⚠️ Valoración entre 0 y 5");
        return;
      }
      if (!texto) {
        showToast("⚠️ Escribe tu reseña");
        return;
      }
      rating = Math.round(rating * 2) / 2; // Redondear a 0.5

      const btn = e.target.querySelector("button[type='submit']");
      btn.disabled = true;
      btn.textContent = "Publicando…";

      // ✅ Guardar en Colaboraciones
      const result = await updateColaboracionResena(
        collabId,
        rating,
        texto,
        mood,
        etiqueta,
      );

      if (result.ok) {
        showToast("✅ Reseña publicada y colaboración marcada como terminada");
        document.getElementById("modal-resena-collab").remove();
        // Recargar colaboraciones y earnings
        const perfil = await getPerfilPublico(currentUser.id);
        const tarifaActual = perfil?.tarifa || currentUser.get("tarifa") || 0;
        collaborations = await getColaboraciones(currentUser.id);
        renderCollaborations();
        await renderBSEarnings(currentUser.id);
      } else {
        showToast("❌ Error: " + (result.error || "No se pudo publicar"));
        btn.disabled = false;
        btn.textContent = "Publicar reseña";
      }
    });
}

// Marcar colaboración como terminada (sin reseñar aún)
async function marcarColaboracionTerminada(collabId) {
  mostrarModalConfirmacion(
    "Marcar como terminada",
    "¿Confirmas que has finalizado esta colaboración? Podrás reseñar más tarde si lo deseas.",
    async () => {
      try {
        const Colaboracion = Parse.Object.extend("Colaboraciones");
        const q = new Parse.Query(Colaboracion);
        const collab = await q.get(collabId);
        collab.set("estado", "terminada");
        await collab.save();
        showToast("✅ Colaboración marcada como terminada");
        // Recargar
        const perfil = await getPerfilPublico(currentUser.id);
        const tarifaActual = perfil?.tarifa || currentUser.get("tarifa") || 0;
        collaborations = await getColaboraciones(currentUser.id);
        renderCollaborations();
        renderBSEarnings(tarifaActual);
      } catch (err) {
        showToast("❌ Error: " + err.message);
      }
    },
    "primary",
  );
}

// Estado de paginación para colaboraciones
let collabsCurrentPage = 1;
const COLLABS_PER_PAGE = 10;

function renderCollaborations() {
  const container = document.getElementById("collabs-container");
  const list = document.getElementById("collabs-list");
  const pagination = document.getElementById("collabs-pagination");

  if (!collaborations.length) {
    list.innerHTML = `<div class="empty-state"><p>No tienes colaboraciones aún.</p></div>`;
    if (pagination) pagination.style.display = "none";
    return;
  }

  // ✅ Paginación: calcular rango
  const totalPages = Math.ceil(collaborations.length / COLLABS_PER_PAGE);
  const start = (collabsCurrentPage - 1) * COLLABS_PER_PAGE;
  const end = start + COLLABS_PER_PAGE;
  const pageCollabs = collaborations.slice(start, end);

  list.innerHTML = pageCollabs
    .map((c) => {
      const libro =
        allBooks.find((b) => String(b.libroId) === String(c.libroId)) || {};
      const imagen =
        c.imagen || libro.imagen || "assets/img/cover-placeholder.svg";
      const titulo = c.nombreLibro || libro.titulo || c.libro || "Libro";
      const autor = c.nombreAutor || libro.autor || c.autor || "";
      const url = libro.afiliado_url || "#";

      const yaFavorito = favorites.some(
        (f) => String(f.libroId) === String(c.libroId),
      );
      const yaLeido = leidos.some(
        (l) => String(l.libroId) === String(c.libroId),
      );

      // Color dinámico según estado
      const estadoColor =
        c.estado === "terminada"
          ? "#4ade80"
          : c.estado === "enviado"
            ? "#60a5fa"
            : c.estado === "pendiente"
              ? "#facc15"
              : "#94a3b8";
      const estadoTexto = (c.estado || "PENDIENTE").toUpperCase();

      // Botones condicionales
      let btnReseña = "";
      let btnTerminar = "";

      if (c.estado === "pendiente" || c.estado === "enviado") {
        btnTerminar = `<button class="btn btn-ghost btn-sm" style="color:#60a5fa" onclick="marcarColaboracionTerminada('${c.id}')">✓ Terminar</button>`;
        btnReseña = `<button class="btn btn-primary btn-sm" onclick="abrirModalResenaCollab('${c.id}', '${titulo.replace(/'/g, "\\'")}', '${autor.replace(/'/g, "\\'")}', ${c.libroId})">Reseñar</button>`;
      } else if (c.estado === "terminada") {
        btnReseña = `<span class="btn btn-ghost btn-sm">✓ Reseñada: ★${c.puntuacion || 0}</span>`;
      }

      return `<div class="collab-card">
        <div style="display:flex;gap:16px;align-items:start">
          <div class="favorite-item__cover" style="width:70px;height:100px;flex-shrink:0">
            <img src="${imagen}" alt="${titulo}" onerror="this.src='assets/img/cover-placeholder.svg'" style="width:100%;height:100%;object-fit:cover;border-radius:6px"/>
          </div>
          <div style="flex:1;min-width:0">
            <div class="collab-card__author">${c.nombreAutor || "—"}</div>
            <div class="collab-card__book"><strong>${titulo}</strong></div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin:4px 0 8px">
              ${c.tarifa || 0}€ · ${c.modalidad || "—"} ·
              <span style="color:${estadoColor};font-weight:600">${estadoTexto}</span>
            </div>
            ${c.resena ? `<p style="font-size:0.85rem;color:var(--text);margin:8px 0;padding:8px;background:var(--bg3);border-radius:4px">"${c.resena}"</p>` : ""}
            <div class="favorite-item__actions" style="flex-wrap:wrap;gap:8px">
              <a href="${url}" target="_blank" rel="noopener sponsored" class="btn btn-amazon btn-sm">Comprar</a>
              <a href="libro.html?id=${c.libroId}" class="btn btn-secondary btn-sm">Ver ficha</a>
              ${!yaLeido ? `<button class="btn btn-ghost btn-sm" onclick="markAsRead(${c.libroId}); renderCollaborations()">Leer</button>` : `<button class="btn btn-ghost btn-sm" disabled style="color:var(--text-dim)">✓ Leído</button>`}
              ${!yaFavorito ? `<button class="btn btn-ghost btn-sm" onclick="addFavFromCollab(${c.libroId}, ${JSON.stringify(libro).replace(/"/g, "&quot;")}); renderCollaborations()">Guardar</button>` : `<button class="btn btn-ghost btn-sm" disabled style="color:var(--text-dim)">✓ Guardado</button>`}
              ${btnReseña}
              ${btnTerminar}
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  // ✅ Renderizar paginación
  if (pagination) {
    if (totalPages <= 1) {
      pagination.style.display = "none";
    } else {
      pagination.style.display = "flex";
      pagination.innerHTML = `
        <button class="collab-page-btn" onclick="changeCollabsPage(${collabsCurrentPage - 1})" ${collabsCurrentPage === 1 ? "disabled" : ""}>←</button>
        <span class="collab-page-info">Página ${collabsCurrentPage} de ${totalPages}</span>
        <button class="collab-page-btn" onclick="changeCollabsPage(${collabsCurrentPage + 1})" ${collabsCurrentPage === totalPages ? "disabled" : ""}>→</button>
      `;
    }
  }
}

// Función auxiliar para cambiar página de colaboraciones
function changeCollabsPage(newPage) {
  const totalPages = Math.ceil(collaborations.length / COLLABS_PER_PAGE);
  if (newPage < 1 || newPage > totalPages) return;
  collabsCurrentPage = newPage;
  renderCollaborations();
  // Scroll suave hacia la lista
  const list = document.getElementById("collabs-list");
  if (list) list.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Helper para añadir favorito desde colaboración
async function addFavFromCollab(libroId, libroData) {
  const result = await addFavorito(libroId, libroData);
  if (result.ok) {
    if (!result.duplicado) {
      favorites.push({ libroId, ...libroData });
      showToast("✅ Añadido a favoritos");
      const fc = document.getElementById("fav-count");
      if (fc) fc.textContent = favorites.length;
    }
  } else {
    showToast("❌ Error: " + (result.error || "desconocido"));
  }
}

async function marcarColaboracionEnviado(solicitudId) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No autorizado" };

  try {
    const Solicitud = Parse.Object.extend("SolicitudesColaboracion");
    const q = new Parse.Query(Solicitud);
    const sol = await q.get(solicitudId);

    // Verificar permisos: solo el solicitante puede marcar como enviado
    if (sol.get("solicitanteId") !== user.id) {
      return {
        ok: false,
        error: "Solo el escritor puede marcar el libro como enviado",
      };
    }

    sol.set("estado", "enviado");
    sol.set("fechaEnvio", new Date());
    await sol.save();

    // Actualizar colaboración relacionada si existe
    const Colaboracion = Parse.Object.extend("Colaboraciones");
    const collabQ = new Parse.Query(Colaboracion);
    collabQ.equalTo("solicitudId", solicitudId);
    const collab = await collabQ.first();

    if (collab) {
      collab.set("estado", "enviado");
      collab.set("fechaEnvio", new Date());
      await collab.save();
    }

    return { ok: true };
  } catch (err) {
    console.error("Error en marcarColaboracionEnviado:", err.message);
    return { ok: false, error: err.message };
  }
}

async function renderBSEarnings(userId) {
  try {
    const uid = userId || currentUser?.id || "";
    if (!uid) {
      document.getElementById("bs-total-earned").textContent = "0€";
      document.getElementById("bs-total-collabs").textContent = "0";
      document.getElementById("bs-tarifa").textContent = "0€";
      return;
    }

    // ✅ Consultar TODAS las colaboraciones del usuario desde la DB
    const Colaboracion = Parse.Object.extend("Colaboraciones");
    const q = new Parse.Query(Colaboracion);
    q.equalTo("bookstagramerId", uid);
    q.limit(1000); // Máximo permitido por consulta en Parse
    const collabs = await q.find();

    // ✅ Sumar todas las tarifas (incluso si estado no es "terminada")
    const totalGanado = collabs.reduce((sum, c) => {
      const tarifa = c.get("tarifa") || 0;
      return sum + tarifa;
    }, 0);

    const totalCollabs = collabs.length;
    const tarifaActual = currentUser?.get("tarifa") || 0;

    // ✅ Actualizar UI
    const elTotal = document.getElementById("bs-total-earned");
    const elCollabs = document.getElementById("bs-total-collabs");
    const elTarifa = document.getElementById("bs-tarifa");

    if (elTotal) elTotal.textContent = totalGanado.toFixed(2) + "€";
    if (elCollabs) elCollabs.textContent = totalCollabs;
    if (elTarifa) elTarifa.textContent = tarifaActual + "€";
  } catch (err) {
    console.error("❌ Error calculando ganancias:", err.message);
    document.getElementById("bs-total-earned").textContent = "0€";
    document.getElementById("bs-total-collabs").textContent = "0";
  }
}

async function loadAuthorMatches() {
  const genero = document.getElementById("bs-filter-genero").value;
  if (genero === "0") return;
  const authors = await getAutoresParaMatch(genero);
  const list = document.getElementById("authors-match-list");
  if (!authors.length) {
    list.innerHTML = `<div class="empty-state"><p>No hay autores disponibles.</p></div>`;
    return;
  }
  list.innerHTML = authors
    .map(
      (a) => `<div class="favorite-item">
                <div class="favorite-item__info" style="flex:1">
                  <div class="favorite-item__title">${a.nombre}</div>
                  <div class="favorite-item__author">📚 ${a.totalLibros} libro(s) · Género: ${a.generoPrincipal}</div>
                </div>
                <div class="favorite-item__actions"><a href="perfil.html?id=${a.id}" class="btn btn-secondary btn-sm">Ver perfil →</a></div>
              </div>`,
    )
    .join("");
}

// ════════════════════════════════════════════════
// SOLICITUDES
// ════════════════════════════════════════════════
const ESTADO_LABELS = {
  pendiente: { cls: "pendiente", txt: "⏳ PENDIENTE" },
  aceptada: { cls: "aceptada", txt: "ACEPTADA" },
  rechazada: { cls: "rechazada", txt: "RECHAZADA" },
  pago_pendiente: { cls: "pago_pendiente", txt: "💳 PAGO PENDIENTE" },
  enviado: { cls: "enviado", txt: "ENVIADO" },
};

async function loadSolicitudesRecibidas(userId) {
  try {
    const uid = userId || currentUser.id;
    const solicitudes = await getSolicitudesRecibidas(uid);
    const list = document.getElementById("solicitudes-recibidas-list");
    const badge = document.getElementById("count-solicitudes-recibidas");
    const pendientes = (solicitudes || []).filter(
      (s) => (s.estado || "").toLowerCase().trim() === "pendiente",
    );
    if (badge) {
      badge.textContent = pendientes.length;
      badge.style.display = pendientes.length > 0 ? "inline-block" : "none";
    }
    if (!solicitudes?.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📬</div><p>No tienes solicitudes recibidas.</p></div>`;
      return;
    }

    const userInfoMap = {};
    const bookInfoMap = {};
    const uniqueUserIds = [
      ...new Set(solicitudes.map((s) => s.solicitanteId).filter(Boolean)),
    ];
    const uniqueBookIds = [
      ...new Set(solicitudes.map((s) => s.libroId).filter(Boolean)),
    ];

    for (const uid of uniqueUserIds) {
      if (!userInfoMap[uid])
        userInfoMap[uid] = await getUserInfo(uid).catch(() => null);
    }
    for (const bid of uniqueBookIds) {
      if (!bookInfoMap[bid]) {
        try {
          const Book = Parse.Object.extend("Books");
          const book = await new Parse.Query(Book)
            .equalTo("libroId", bid)
            .first();
          if (book) {
            bookInfoMap[bid] = {
              titulo: book.get("titulo"),
              autor: book.get("autor"),
              imagen: book.get("imagen"),
              colabF: book.get("colabF"),
              colabE: book.get("colabE"),
            };
          }
        } catch (e) {
          /* ignorar */
        }
      }
    }

    list.innerHTML = solicitudes
      .map((s) => {
        const solicitante = userInfoMap[s.solicitanteId] || {};
        const nombrePersona =
          s.solicitanteNombre ||
          solicitante.nombre ||
          solicitante.displayName ||
          "Usuario";
        const instagram = s.solicitanteInstagram || solicitante.instagram || "";
        const libro = bookInfoMap[s.libroId];
        const estado = (s.estado || "").toLowerCase().trim();
        const lbl = ESTADO_LABELS[estado] || ESTADO_LABELS.pendiente;
        const esBSaE = s.tipo === "bookstagramer_a_escritor";
        const fecha = s.fecha
          ? new Date(s.fecha).toLocaleDateString("es-ES")
          : "";
        const tituloLibro = libro?.titulo || `Libro #${s.libroId || "?"}`;
        const autorLibro = libro?.autor ? ` de ${libro.autor}` : "";
        const instagramLink = instagram
          ? `<a href="https://instagram.com/${instagram.replace("@", "")}" target="_blank" rel="noopener" style="color:var(--red);text-decoration:none">@${instagram.replace("@", "")}</a>`
          : "";
        const perfilLink = s.solicitanteId
          ? `<a href="perfil.html?id=${s.solicitanteId}" target="_blank" rel="noopener" style="color:var(--text);font-weight:600">${nombrePersona}</a>`
          : nombrePersona;

        // Botones de acción (solo si está pendiente)
        const botones =
          estado === "pendiente"
            ? `<div class="solicitud-actions">
            <button class="btn btn-success btn-sm" onclick="responderSolicitudUI('${s.id}','aceptada')">Aceptar</button>
            <button class="btn btn-danger btn-sm" onclick="responderSolicitudUI('${s.id}','rechazada')">Denegar</button>
          </div>`
            : "";

        // 📦 GESTIÓN DE ENVÍO (solo para aceptada + BSaE) - SIN FORMULARIO DE DIRECCIÓN
        let gestionEnvioBox = "";
        if (estado === "aceptada" && esBSaE) {
          if (estado !== "enviado") {
            let html = `<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border);">
            <div style="font-size:0.8rem;font-weight:600;color:var(--text);margin-bottom:8px">Gestión de envío</div>`;

            // Dirección (si físico/ambos) - SOLO LECTURA, SIN FORMULARIO
            if (s.modalidad === "fisico" || s.modalidad === "ambos") {
              if (s.direccionEnvio) {
                const addr = s.direccionEnvio;
                html += `<div style="margin-bottom:10px;padding:8px;background:var(--bg3);border-radius:4px;border-left:2px solid #4ade80;">
                <div style="font-size:0.75rem;color:var(--text-muted)">📬 Dirección registrada:</div>
                <p style="font-size:0.82rem;color:var(--text);margin:4px 0 0">${addr.calle || ""}<br>${addr.ciudad || ""} (${addr.pais || ""})</p>
              </div>`;
              } else {
                html += `<div style="margin-bottom:10px;padding:8px;background:var(--bg3);border-radius:4px;border-left:2px solid #facc15;">
                <div style="font-size:0.75rem;color:var(--text-muted)">⚠️ Sin dirección registrada. Contacta con el bookstagramer para solicitarla.</div>
              </div>`;
              }
            }
            // Email (si ebook/ambos)
            if (s.modalidad === "ebook" || s.modalidad === "ambos") {
              const destinatarioEmail =
                s.destinatarioEmail || solicitante.email || "";
              if (destinatarioEmail) {
                const subject = encodeURIComponent(
                  `Colaboración AdEA: ${tituloLibro}`,
                );
                const body = encodeURIComponent(
                  `Hola,\nAdjunto encontrarás el ebook/link para '${tituloLibro}'.\nSaludos`,
                );
                html += `<div style="margin-bottom:10px;">
                <a href="mailto:${destinatarioEmail}?bcc=elevatestarmkt@gmail.com&subject=${subject}&body=${body}" class="btn btn-ghost btn-sm" style="color:var(--red);padding:6px 10px;width:100%;justify-content:center;">Enviar ebook por email</a>
              </div>`;
              }
            }
            // ✅ BOTÓN PRINCIPAL
            html += `<button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;margin-top:8px" onclick="mostrarModalConfirmacion('Confirmar envío', '¿Confirmas que has enviado el libro? Esta acción marcará la colaboración como completada.', () => marcarComoEnviado('${s.id}'))">Marcar como Enviado</button>`;
            html += `</div>`;
            gestionEnvioBox = html;
          } else {
            gestionEnvioBox = `<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius);border:1px solid #4ade80;text-align:center;">
            <span style="color:#4ade80;font-weight:600;font-size:0.9rem">✅ Libro enviado correctamente</span>
          </div>`;
          }
        }

        // 💳 Caja de pago pendiente
        const showPagoBox =
          (estado === "aceptada" || estado === "pago_pendiente") &&
          userRole === "escritor" &&
          (s.tarifa || 0) > 0;
        const pagoBox = showPagoBox
          ? `<div class="pago-pendiente-box">
            <span style="font-size:1.4rem">💳</span>
            <div><strong style="color:#fb923c">Pago pendiente</strong><p style="font-size:.82rem;color:var(--text-muted);margin:4px 0 0">Contacta con AdEA en Telegram para gestionar el pago de <strong>${s.tarifa || 0}€</strong>.</p></div>
            <a href="https://t.me/adea_oficial" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="flex-shrink:0">Ir a Telegram →</a>
          </div>`
          : "";

        // 📬 DIRECCIÓN DEL BOOKSTAGRAMER (visible para el escritor, SOLO LECTURA)
        let direccionParaVer = "";
        if (
          userRole === "escritor" &&
          s.estado === "aceptada" &&
          s.tipo === "bookstagramer_a_escritor" &&
          s.direccionEnvio &&
          (s.modalidad === "fisico" || s.modalidad === "ambos")
        ) {
          const addr = s.direccionEnvio;
          direccionParaVer = `<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius);border-left:3px solid var(--red)">
          <div style="font-size:0.8rem;font-weight:600;color:var(--text);margin-bottom:8px">📬 Dirección de ${perfilLink} para envío:</div>
          <p style="font-size:0.85rem;color:var(--text);line-height:1.5">${addr.calle || ""}<br>${addr.ciudad || ""}<br>${addr.pais || ""}</p>
          ${addr.referencia ? `<small style="color:var(--text-muted)">📍 ${addr.referencia}</small>` : ""}
          ${addr.fecha ? `<small style="color:var(--text-dim);display:block;margin-top:4px">Actualizada: ${new Date(addr.fecha).toLocaleDateString("es-ES")}</small>` : ""}
        </div>`;
        }

        // ✅ ELIMINADO: direccionBox (formulario para rellenar dirección) - NO debe aparecer en Recibidas

        return `<div class="solicitud-card solicitud-card--${lbl.cls}">
        <div style="position:absolute;top:12px;right:12px;font-size:.75rem;color:var(--text-dim)">${fecha}</div>
        <span class="solicitud-badge solicitud-badge--${lbl.cls}">${lbl.txt}</span>
        <div class="collab-card__author">${perfilLink} | ${instagramLink}</div>
        <div class="collab-card__book">
          ${
            esBSaE
              ? `📖 Solicita reseñar: <strong>${tituloLibro}</strong>${autorLibro}<br><small style="color:var(--text-dim)">Modalidad: ${s.modalidad || "—"}</small>`
              : `📚 Te invita a reseñar: <strong>${tituloLibro}</strong>${autorLibro}<br><small style="color:var(--text-dim)">Tarifa: ${s.tarifa || 0}€</small>`
          }
        </div>
        ${s.mensaje ? `<p style="font-size:.85rem;color:var(--text-muted);margin:8px 0;font-style:italic">"${s.mensaje}"</p>` : ""}
        ${botones}${pagoBox}${direccionParaVer}${gestionEnvioBox}
      </div>`;
      })
      .join("");
  } catch (error) {
    console.error("❌ Error cargando solicitudes recibidas:", error);
    document.getElementById("solicitudes-recibidas-list").innerHTML =
      `<div class="empty-state" style="color:#f87171"><p>Error al cargar.<br><small>${error.message || ""}</small></p></div>`;
  }
}

async function loadSolicitudesEnviadas(userId) {
  try {
    const uid = userId || currentUser.id;
    const solicitudes = await getSolicitudesEnviadas(uid);
    const list = document.getElementById("solicitudes-enviadas-list");

    if (!solicitudes?.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📤</div><p>No has enviado solicitudes aún.</p></div>`;
      return;
    }

    const userInfoMap = {};
    const bookInfoMap = {};
    const uniqueUserIds = [
      ...new Set(solicitudes.map((s) => s.destinatarioId).filter(Boolean)),
    ];
    const uniqueBookIds = [
      ...new Set(solicitudes.map((s) => s.libroId).filter(Boolean)),
    ];

    for (const uid of uniqueUserIds) {
      if (!userInfoMap[uid]) {
        const info = await getUserInfo(uid).catch(() => null);
        userInfoMap[uid] = info;
      }
    }
    for (const bid of uniqueBookIds) {
      if (!bookInfoMap[bid]) {
        try {
          const Book = Parse.Object.extend("Books");
          const book = await new Parse.Query(Book)
            .equalTo("libroId", bid)
            .first();
          if (book) {
            bookInfoMap[bid] = {
              titulo: book.get("titulo"),
              autor: book.get("autor"),
              colabF: book.get("colabF"),
              colabE: book.get("colabE"),
            };
          }
        } catch (e) {
          /* ignorar */
        }
      }
    }

    list.innerHTML = solicitudes
      .map((s) => {
        const destinatario = userInfoMap[s.destinatarioId] || {};
        const nombrePersona =
          s.destinatarioNombre ||
          destinatario.nombre ||
          destinatario.displayName ||
          "Usuario";
        const instagram =
          s.destinatarioInstagram || destinatario.instagram || "";
        const libro = bookInfoMap[s.libroId];
        const lbl = ESTADO_LABELS[s.estado] || ESTADO_LABELS.pendiente;
        const fecha = s.fecha
          ? new Date(s.fecha).toLocaleDateString("es-ES")
          : "";
        const tituloLibro = libro?.titulo || `Libro #${s.libroId || "?"}`;

        // Instagram clicable
        const instagramLink = instagram
          ? `<a href="https://instagram.com/${instagram.replace("@", "")}" target="_blank" rel="noopener" style="color:var(--red);text-decoration:none">@${instagram.replace("@", "")}</a>`
          : "";

        // Perfil clicable
        const perfilLink = s.destinatarioId
          ? `<a href="perfil.html?id=${s.destinatarioId}" target="_blank" rel="noopener" style="color:var(--text);font-weight:600">${nombrePersona}</a>`
          : nombrePersona;

        // 💳 Caja de pago pendiente
        const showPagoBox =
          (s.estado === "aceptada" || s.estado === "pago_pendiente") &&
          userRole === "escritor" &&
          (s.tarifa || 0) > 0;
        const pagoBox = showPagoBox
          ? `
        <div class="pago-pendiente-box">
          <span style="font-size:1.4rem">💳</span>
          <div><strong style="color:#fb923c">Pago pendiente</strong><p style="font-size:.82rem;color:var(--text-muted);margin:4px 0 0">Contacta con AdEA en Telegram para gestionar el pago de <strong>${s.tarifa || 0}€</strong>.</p></div>
          <a href="https://t.me/adea_oficial" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="flex-shrink:0">Ir a Telegram →</a>
        </div>`
          : "";

        // 📬 DIRECCIÓN DEL BOOKSTAGRAMER
        let direccionParaVer = "";
        if (
          userRole === "escritor" &&
          s.estado === "aceptada" &&
          s.direccionEnvio &&
          (s.modalidad === "fisico" || s.modalidad === "ambos")
        ) {
          const addr = s.direccionEnvio;
          direccionParaVer = `
        <div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius);border-left:3px solid var(--red)">
          <div style="font-size:0.8rem;font-weight:600;color:var(--text);margin-bottom:8px">📬 Dirección de ${perfilLink} para envío:</div>
          <p style="font-size:0.85rem;color:var(--text);line-height:1.5">
            ${addr.calle || ""}<br>
            ${addr.ciudad || ""}<br>
            ${addr.pais || ""}
          </p>
          ${addr.referencia ? `<small style="color:var(--text-muted)">${addr.referencia}</small>` : ""}
          ${addr.fecha ? `<small style="color:var(--text-dim);display:block;margin-top:4px">Actualizada: ${new Date(addr.fecha).toLocaleDateString("es-ES")}</small>` : ""}
        </div>`;
        }

        // 📦 FORMULARIO DE DIRECCIÓN para BOOKSTAGRAMER
        let direccionBox = "";
        if (
          userRole === "bookstagramer" &&
          s.estado === "aceptada" &&
          s.tipo === "bookstagramer_a_escritor" &&
          (s.modalidad === "fisico" || s.modalidad === "ambos")
        ) {
          if (s.direccionEnvio) {
            const addr = s.direccionEnvio;
            direccionBox = `
          <div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius);border-left:3px solid #4ade80">
            <div style="font-size:0.8rem;font-weight:600;color:var(--text);margin-bottom:8px">Dirección registrada:</div>
            <p style="font-size:0.85rem;color:var(--text);line-height:1.5">
              ${addr.calle || ""}<br>${addr.ciudad || ""}<br>${addr.pais || ""}
            </p>
            ${addr.fecha ? `<small style="color:var(--text-dim)">Actualizada: ${new Date(addr.fecha).toLocaleDateString("es-ES")}</small>` : ""}
          </div>`;
          } else {
            direccionBox = `
          <div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius);">
            <div style="font-size:0.8rem;font-weight:600;color:var(--text);margin-bottom:8px">Tu dirección de envío</div>
            <form id="addr-form-${s.id}" onsubmit="guardarDireccion('${s.id}', event); return false;">
              <input type="text" id="addr-calle-${s.id}" placeholder="Calle y número *" required style="width:100%;padding:8px;margin-bottom:6px;border-radius:4px;border:1px solid var(--border);">
              <input type="text" id="addr-ciudad-${s.id}" placeholder="Ciudad, CP *" required style="width:100%;padding:8px;margin-bottom:6px;border-radius:4px;border:1px solid var(--border);">
              <input type="text" id="addr-pais-${s.id}" placeholder="País *" required style="width:100%;padding:8px;margin-bottom:6px;border-radius:4px;border:1px solid var(--border);">
              <div class="check-row" style="margin:8px 0 12px">
                <input type="checkbox" id="addr-guardar-default-${s.id}" style="width:18px;height:18px" checked>
                <label for="addr-guardar-default-${s.id}" style="font-size:0.8rem;color:var(--text-muted);cursor:pointer">Guardar como predeterminada</label>
              </div>
              <button type="submit" class="btn btn-primary btn-sm" style="width:100%;justify-content:center">Guardar dirección</button>
            </form>
          </div>`;
          }
        }

        // Estado "Enviado" badge
        const estadoEnviado =
          s.estado === "enviado"
            ? `<span style="margin-left:8px;color:#4ade80;font-size:0.75rem">Enviado</span>`
            : "";

        return `<div class="solicitud-card solicitud-card--${lbl.cls}">
        <div style="position:absolute;top:12px;right:12px;font-size:.75rem;color:var(--text-dim)">${fecha}</div>
        <span class="solicitud-badge solicitud-badge--${lbl.cls}">${lbl.txt}${estadoEnviado}</span>
        <div class="collab-card__author">Para: ${perfilLink}${instagramLink ? ` 📸 ${instagramLink}` : ""}</div>
        <div class="collab-card__book">📖 <strong>${tituloLibro}</strong> ${s.tarifa ? `· 💰 ${s.tarifa}€` : ""}</div>
        ${pagoBox}${direccionBox}${direccionParaVer}
      </div>`;
      })
      .join("");

    setTimeout(() => {
      solicitudes.forEach((s) => {
        if (
          s.estado === "aceptada" &&
          s.tipo === "bookstagramer_a_escritor" &&
          !s.direccionEnvio
        ) {
          mostrarFormularioDireccion(s.id);
        }
      });
    }, 100);
  } catch (err) {
    console.error("❌ Error cargando solicitudes enviadas:", err);
    document.getElementById("solicitudes-enviadas-list").innerHTML =
      `<div class="empty-state" style="color:#f87171"><p>Error al cargar.<br><small>${err.message || ""}</small></p></div>`;
  }
}

// ✅ NUEVA FUNCIÓN: Guardar dirección de envío
async function guardarDireccion(solicitudId, event) {
  event.preventDefault();
  const calle = document
    .getElementById(`addr-calle-${solicitudId}`)
    .value.trim();
  const ciudad = document
    .getElementById(`addr-ciudad-${solicitudId}`)
    .value.trim();
  const pais = document.getElementById(`addr-pais-${solicitudId}`).value.trim();

  if (!calle || !ciudad || !pais) {
    showToast("⚠️ Completa todos los campos de dirección");
    return;
  }

  const btn = event.target.querySelector("button[type='submit']");
  btn.disabled = true;
  btn.textContent = "Guardando…";

  try {
    // Guardar en la solicitud
    const Solicitud = Parse.Object.extend("SolicitudesColaboracion");
    const q = new Parse.Query(Solicitud);
    const sol = await q.get(solicitudId);
    // Guardar en la solicitud (siempre)
    sol.set("direccionEnvio", { calle, ciudad, pais, fecha: new Date() });

    // Preguntar si quiere actualizar su dirección por defecto
    if (
      document.getElementById(`addr-guardar-default-${solicitudId}`).checked
    ) {
      currentUser.set("direccionEnvio_default", { calle, ciudad, pais });
      currentUser.set("usarDireccionPorDefecto", true);
      await currentUser.save();
    }

    await sol.save();
    showToast("✅ Dirección guardada. El escritor podrá verla en su panel.");

    // También notificar al escritor vía mensaje (opcional)
    // Aquí podrías añadir lógica para enviar notificación
  } catch (err) {
    showToast("❌ Error al guardar dirección");
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Guardar dirección";
  }
}

async function mostrarFormularioDireccion(solicitudId) {
  const user = currentUser;
  const defaultAddr = user.get("direccionEnvio_default");

  if (defaultAddr && user.get("usarDireccionPorDefecto")) {
    const calleEl = document.getElementById(`addr-calle-${solicitudId}`);
    const ciudadEl = document.getElementById(`addr-ciudad-${solicitudId}`);
    const paisEl = document.getElementById(`addr-pais-${solicitudId}`);

    if (calleEl) calleEl.value = defaultAddr.calle || "";
    if (ciudadEl) ciudadEl.value = defaultAddr.ciudad || "";
    if (paisEl) paisEl.value = defaultAddr.pais || "";
  }
}

async function responderSolicitudUI(solicitudId, respuesta) {
  const texto = respuesta === "aceptada" ? "Aceptar" : "Rechazar";
  const color = respuesta === "aceptada" ? "primary" : "danger";
  const msg =
    respuesta === "aceptada"
      ? "¿Estás seguro de que quieres <strong>aceptar</strong> esta solicitud? El escritor recibirá la notificación y podrás gestionar el envío."
      : "¿Estás seguro de que quieres <strong>rechazar</strong> esta solicitud? Esta acción no se puede deshacer.";

  mostrarModalConfirmacion(
    `Confirmar ${texto}`,
    msg,
    async () => {
      const result = await responderSolicitud(solicitudId, respuesta);
      if (result.ok) {
        showToast(
          `✅ Solicitud ${respuesta === "aceptada" ? "aceptada" : "rechazada"}`,
        );
        await loadSolicitudesRecibidas();
      } else {
        showToast("❌ Error: " + (result.error || "No se pudo procesar"));
      }
    },
    color,
  );
}

async function marcarComoEnviado(solicitudId) {
  try {
    // 1️⃣ Actualizar la Solicitud original
    const Solicitud = Parse.Object.extend("SolicitudesColaboracion");
    const qSol = new Parse.Query(Solicitud);
    const sol = await qSol.get(solicitudId);
    sol.set("estado", "enviado");
    sol.set("fechaEnvio", new Date());
    await sol.save();

    // 2️⃣ Actualizar la Colaboración vinculada (ahora sí encontrará el registro)
    const Colaboracion = Parse.Object.extend("Colaboraciones");
    const collabQ = new Parse.Query(Colaboracion);
    collabQ.equalTo("solicitudId", solicitudId);
    const collab = await collabQ.first();

    if (collab) {
      collab.set("estado", "enviado");
      collab.set("fechaEnvio", new Date());
      await collab.save();
    } else {
      console.warn(
        "⚠️ No se encontró la Colaboración vinculada. Se actualizará solo la solicitud.",
      );
    }

    showToast("✅ Libro marcado como enviado correctamente");

    // 3️⃣ Refrescar UI según el rol activo
    const currentRole = getCurrentRole();
    if (currentRole === "escritor") {
      await Promise.all([
        loadSolicitudesRecibidas(),
        loadSolicitudesEnviadas(),
        loadEscritorData(),
      ]);
    } else if (currentRole === "bookstagramer" || currentRole === "admin") {
      await Promise.all([
        loadSolicitudesRecibidas(),
        loadSolicitudesEnviadas(),
        loadBookstagramerData(),
      ]);
    }
  } catch (err) {
    console.error("❌ Error marcando como enviado:", err.message);
    showToast("❌ Error al marcar como enviado: " + err.message);
  }
}

// ════════════════════════════════════════════════
// CHAT ADEA
// ════════════════════════════════════════════════
async function loadChatMessages() {
  const container = document.getElementById("chat-messages");
  const empty = document.getElementById("chat-empty");
  container.innerHTML = "";
  try {
    const Mensaje = Parse.Object.extend("MensajesAdEA");
    const q = new Parse.Query(Mensaje);
    q.equalTo("usuarioId", currentUser.id);
    q.ascending("createdAt");
    q.limit(100);
    const msgs = await q.find();
    if (!msgs.length) {
      if (empty) empty.style.display = "flex";
      return;
    }
    if (empty) empty.style.display = "none";
    msgs.forEach((m) => {
      const fecha =
        m.get("createdAt")?.toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }) || "";
      const divUser = document.createElement("div");
      divUser.className = "chat-msg chat-msg--user";
      divUser.innerHTML = `${m.get("mensaje")}<div class="chat-msg__meta">${fecha}</div>`;
      container.appendChild(divUser);
      const respuesta = m.get("respuesta");
      if (respuesta) {
        const divAdea = document.createElement("div");
        divAdea.className = "chat-msg chat-msg--adea";
        divAdea.innerHTML = `<strong style="font-size:.75rem;color:var(--red);display:block;margin-bottom:4px">AdEA</strong>${respuesta}<div class="chat-msg__meta">${fecha}</div>`;
        container.appendChild(divAdea);
      }
    });
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error("Error cargando chat:", err);
    container.innerHTML = `<div class="chat-empty"><p>Error al cargar mensajes.</p></div>`;
  }
}

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const texto = input.value.trim();
  if (!texto) return;
  const btn = document.getElementById("btn-send-chat");
  btn.disabled = true;
  try {
    const Mensaje = Parse.Object.extend("MensajesAdEA");
    const msg = new Mensaje();
    msg.set("usuarioId", currentUser.id);
    msg.set(
      "nombreUsuario",
      currentUser.get("nombre") || currentUser.get("username") || "Usuario",
    );
    msg.set("email", currentUser.get("email") || "");
    msg.set("rol", getCurrentRole());
    msg.set("mensaje", texto);
    msg.set("respondido", false);
    msg.set("leido", false);
    const acl = new Parse.ACL(currentUser);
    acl.setPublicReadAccess(false);
    acl.setWriteAccess(currentUser, true);
    msg.setACL(acl);
    await msg.save();
    input.value = "";
    await loadChatMessages();
    showToast("✅ Mensaje enviado");
  } catch (err) {
    showToast("❌ Error al enviar: " + err.message);
  }
  btn.disabled = false;
}

// ════════════════════════════════════════════════
// SUGERIR LIBRO (PARA TODOS)
// ════════════════════════════════════════════════
async function loadSuggestHistory() {
  try {
    const Sugerencia = Parse.Object.extend("SugerenciasLibros");
    const q = new Parse.Query(Sugerencia);
    q.equalTo("usuario", currentUser);
    q.descending("createdAt");
    q.limit(10);
    const results = await q.find();
    const list = document.getElementById("suggest-history-list");
    if (!results.length) {
      list.innerHTML = `<p style="color:var(--text-dim);font-style:italic">Aún no has sugerido libros.</p>`;
      return;
    }
    const statusLabels = {
      pendiente: '<span style="color:#facc15">⏳ Pendiente</span>',
      aceptada: '<span style="color:#4ade80">✅ Aceptada</span>',
      rechazada: '<span style="color:#f87171">❌ Rechazada</span>',
    };
    list.innerHTML = results
      .map(
        (
          s,
        ) => `<div style="padding:12px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:12px">
                  <div><strong style="color:var(--text)">${s.get("titulo") || "Sin título"}</strong><span style="color:var(--text-muted);font-size:.85rem"> — ${s.get("autor") || ""}</span><span style="color:var(--text-dim);font-size:.75rem;display:block;margin-top:2px">${s.get("createdAt")?.toLocaleDateString("es-ES") || ""}</span></div>
                  ${statusLabels[s.get("estado")] || statusLabels.pendiente}
                </div>`,
      )
      .join("");
  } catch (err) {
    document.getElementById("suggest-history-list").innerHTML =
      `<p style="color:#f87171">Error al cargar.</p>`;
  }
}

// ════════════════════════════════════════════════
// LOGOUT / ELIMINAR
// ════════════════════════════════════════════════
async function eliminarCuenta() {
  // ✅ Reemplaza los dos confirm() anidados por un modal con mensaje reforzado
  mostrarModalConfirmacion(
    "⚠️ Eliminar cuenta",
    `¿Estás <strong>absolutamente seguro</strong> de que quieres eliminar tu cuenta?<br><br>
    <span style="color:#f87171;font-weight:600">⚠️ Esta acción NO se puede deshacer.</span><br><br>
    Se eliminarán permanentemente:
    <ul style="text-align:left;margin:12px 0 0 20px;font-size:0.85rem;color:var(--text-muted)">
      <li>Tu perfil público</li>
      <li>Tus libros, reseñas y favoritos</li>
      <li>Tus colaboraciones y solicitudes</li>
    </ul>`,
    async () => {
      // Segundo nivel de confirmación (opcional, pero recomendado para acciones críticas)
      mostrarModalConfirmacion(
        "Última confirmación",
        "Escribe <strong>ELIMINAR</strong> para confirmar:",
        async () => {
          try {
            await currentUser.destroy();
            await logoutUsuario();
            showToast("Cuenta eliminada");
            setTimeout(() => (location.href = "index.html"), 1000);
          } catch {
            showToast("Error al eliminar cuenta");
          }
        },
        "danger",
      );
      // Nota: El modal interno manejará su propio input si lo necesitas
    },
    "danger",
  );
}

// ════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await logoutUsuario();
    location.href = "index.html";
  });

  document
    .getElementById("edit-book-modal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeEditModal();
    });

  document
    .getElementById("btn-send-chat")
    .addEventListener("click", sendChatMessage);
  document.getElementById("chat-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  document
    .getElementById("public-profile-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      let web = document.getElementById("pp-web").value.trim();

      // ✅ Normalizar URL: añadir https:// si falta protocolo
      if (web && !/^https?:\/\//i.test(web)) {
        web = "https://" + web;
      }

      const updates = {
        bio: document.getElementById("pp-bio").value.trim(),
        web: web, // ← Usar la URL normalizada
      };
      const ig = document.getElementById("pp-instagram"),
        ge = document.getElementById("pp-genero"),
        ta = document.getElementById("pp-tarifa"),
        co = document.getElementById("pp-condiciones");
      if (ig) updates.instagram = ig.value.trim();
      if (ge) updates.generoFavorito = ge.value;
      if (ta) updates.tarifa = parseFloat(ta.value) || 0;
      if (co) updates.condiciones = co.value.trim();
      const result = await updatePerfilPublico(updates);
      if (result.ok) showToast("✅ Perfil público actualizado");
      else showToast("Error: " + (result.error || "desconocido"));
    });

  document
    .getElementById("bs-profile-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      currentUser.set(
        "instagram",
        document.getElementById("bs-instagram").value.trim(),
      );
      currentUser.set(
        "tarifa",
        parseFloat(document.getElementById("bs-tarifa-input").value) || 0,
      );
      currentUser.set(
        "condiciones",
        document.getElementById("bs-condiciones").value.trim(),
      );
      await currentUser.save();
      await updatePerfilPublico({
        instagram: document.getElementById("bs-instagram").value.trim(),
        tarifa:
          parseFloat(document.getElementById("bs-tarifa-input").value) || 0,
        condiciones: document.getElementById("bs-condiciones").value.trim(),
      });
      showToast("Perfil actualizado");
      await loadBookstagramerData();
    });

  document
    .getElementById("suggest-book-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("btn-suggest-submit"),
        status = document.getElementById("suggest-status");
      const data = {
        titulo: document.getElementById("suggest-titulo").value,
        autor: document.getElementById("suggest-autor").value,
        amazonUrl: document.getElementById("suggest-amazon").value,
        motivo: document.getElementById("suggest-motivo").value,
      };
      btn.disabled = true;
      btn.textContent = "Enviando…";
      status.textContent = "";
      const result = await sugerirLibro(data);
      if (result.ok) {
        status.textContent = "✅ ¡Sugerencia enviada!";
        status.style.color = "#4ade80";
        e.target.reset();
        await loadSuggestHistory();
        setTimeout(() => {
          status.textContent = "";
        }, 3000);
      } else {
        status.textContent = "❌ Error: " + (result.error || "desconocido");
        status.style.color = "#f87171";
      }
      btn.disabled = false;
      btn.textContent = "Enviar sugerencia →";
    });
  // Sidebar móvil: toggle
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const sidebar = document.querySelector(".dashboard-sidebar");

  if (sidebarToggle && sidebar && sidebarOverlay) {
    // Mostrar botón solo en móvil
    const checkMobile = () => {
      sidebarToggle.style.display = window.innerWidth <= 768 ? "flex" : "none";
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Abrir sidebar
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.add("open");
      sidebarOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    // Cerrar sidebar
    const closeSidebar = () => {
      sidebar.classList.remove("open");
      sidebarOverlay.classList.remove("active");
      document.body.style.overflow = "";
    };
    sidebarOverlay.addEventListener("click", closeSidebar);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("open"))
        closeSidebar();
    });

    // Cerrar al hacer clic en un enlace del nav
    sidebar.querySelectorAll(".dashboard-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (window.innerWidth <= 768) closeSidebar();
      });
    });
  }
});
