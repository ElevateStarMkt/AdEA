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

injectShell("");

let currentBook = null;
let currentReviews = [];
let activeFilter = { stars: null, mood: null };
let defaultBookData = null;
let currentPage = 1;
const REVIEWS_PER_PAGE = 10;

async function loadAndRenderReviews(bookId) {
  currentReviews = await getResenasPorLibro(bookId);
  currentPage = 1;
  renderReviewFilters();
  renderReviews();
  renderPagination();
  updateBookStats();
}

function renderReviewFilters() {
  const container = document.getElementById("reviews-filters");
  const starCounts = [5, 4, 3, 2, 1, 0].map((s) => ({
    stars: s,
    count: currentReviews.filter((r) => Math.round(r.estrellas) === s).length,
  }));
  const moodCounts = {};
  currentReviews.forEach((r) => {
    if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
  });

  let html = `<button class="review-filter ${!activeFilter.stars && !activeFilter.mood ? "active" : ""}" data-filter="all">Todas <span class="count">(${currentReviews.length})</span></button>`;
  starCounts.forEach((s) => {
    if (s.count > 0)
      html += `<button class="review-filter stars-filter ${activeFilter.stars === s.stars ? "active" : ""}" data-filter="star" data-value="${s.stars}">★${s.stars} <span class="count">(${s.count})</span></button>`;
  });
  const MOOD_EMOJIS = {
    adictivo: "⚡",
    devastador: "💔",
    spicy: "🌶️",
    reflexivo: "💭",
    épico: "🐉",
    oscuro: "🖤",
    ligero: "☀️",
    emotivo: "😭",
    aburrido: "😴",
  };
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > 0) {
      const emoji = MOOD_EMOJIS[mood] || "";
      html += `<button class="review-filter ${activeFilter.mood === mood ? "active" : ""}" data-filter="mood" data-value="${mood}">${emoji} ${mood} <span class="count">(${count})</span></button>`;
    }
  });
  container.innerHTML = html;
  container.querySelectorAll(".review-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.filter,
        value = btn.dataset.value;
      if (type === "all") activeFilter = { stars: null, mood: null };
      else if (type === "star")
        activeFilter = { stars: parseInt(value), mood: null };
      else if (type === "mood") activeFilter = { stars: null, mood: value };
      currentPage = 1;
      renderReviewFilters();
      renderReviews();
      renderPagination();
    });
  });
}

function getFilteredReviews() {
  let filtered = [...currentReviews];
  if (activeFilter.stars !== null)
    filtered = filtered.filter(
      (r) => Math.round(r.estrellas) === activeFilter.stars,
    );
  if (activeFilter.mood)
    filtered = filtered.filter((r) => r.mood === activeFilter.mood);
  filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return filtered;
}

function renderReviews() {
  const list = document.getElementById("reviews-list");
  const user = usuarioActual();
  const filtered = getFilteredReviews();
  const start = (currentPage - 1) * REVIEWS_PER_PAGE;
  const pageItems = filtered.slice(start, start + REVIEWS_PER_PAGE);

  if (!pageItems.length) {
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px 0;">${activeFilter.stars !== null || activeFilter.mood ? "No hay reseñas con esos filtros." : "No hay reseñas aún. ¡Sé el primero!"}</p>`;
    return;
  }

  list.innerHTML = pageItems
    .map((r) => {
      const name =
        r.displayName ||
        r.usuario?.get?.("displayName") ||
        r.usuario?.get?.("username") ||
        "A";
      const initial = name.charAt(0).toUpperCase() + ".";
      const isOwner = user && r.usuarioId === user.id;
      const fullText = r.texto || "";
      const shortText =
        fullText.length > 150 ? fullText.substring(0, 150) + "…" : fullText;
      const utiles = r.utiles || 0,
        noUtiles = r.noUtiles || 0;
      const userVote = r.votos?.[user?.id] || null;
      const starsStr =
        "★".repeat(Math.floor(r.estrellas)) +
        (r.estrellas % 1 >= 0.5 ? "½" : "") +
        "☆".repeat(5 - Math.ceil(r.estrellas));
      return `
            <div class="review-card" onclick="toggleReviewText(this)">
              <div class="review-card__header">
                <div class="review-card__author">
                  <div class="review-card__avatar">${initial}</div>
                  <!-- <span class="review-card__name">${name}</span> -->
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <span class="review-card__stars">${starsStr}</span>
                  ${r.mood ? `<span class="review-card__mood">${r.mood}</span>` : ""}
                </div>
              </div>
              <p class="review-card__text" data-full="${fullText.replace(/"/g, "&quot;")}">${shortText}</p>
              ${r.etiqueta ? `<span class="review-card__tag">${r.etiqueta}</span>` : ""}
              <div class="review-card__actions">
                <div class="review-card__actions-left">
                  <button class="review-card__btn helpful ${userVote === "up" ? "active" : ""}" onclick="voteReview('${r.id}','up',event)">👍 Útil <span class="review-card__helpful-count">(${utiles})</span></button>
                  <button class="review-card__btn not-helpful ${userVote === "down" ? "active" : ""}" onclick="voteReview('${r.id}','down',event)">👎 No útil <span class="review-card__helpful-count">(${noUtiles})</span></button>
                </div>
                <div class="review-card__actions-right">
                  ${isOwner ? `<button class="review-card__btn edit" onclick="editReview('${r.id}',event)">✏️ Editar</button>` : ""}
                  ${isOwner ? `<button class="review-card__btn delete" onclick="deleteReview('${r.id}',event)">🗑️ Eliminar</button>` : ""}
                </div>
              </div>
            </div>`;
    })
    .join("");
}

function renderPagination() {
  const container = document.getElementById("reviews-pagination");
  const filtered = getFilteredReviews();
  const totalPages = Math.ceil(filtered.length / REVIEWS_PER_PAGE);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let html = `<button class="review-page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>←</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      html += `<button class="review-page-btn ${i === currentPage ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="color:var(--text-dim)">…</span>`;
    }
  }
  html += `<button class="review-page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>→</button>`;
  container.innerHTML = html;
}

function changePage(page) {
  const filtered = getFilteredReviews();
  const totalPages = Math.ceil(filtered.length / REVIEWS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderReviews();
  renderPagination();
  const sec = document.querySelector(".reviews-section");
  if (sec) window.scrollTo({ top: sec.offsetTop - 100, behavior: "smooth" });
}

function toggleReviewText(card) {
  const textEl = card.querySelector(".review-card__text");
  if (!textEl) return;
  const isExpanded = textEl.classList.contains("expanded");
  const fullText = textEl.dataset.full || "";
  if (isExpanded) {
    textEl.textContent =
      fullText.length > 150 ? fullText.substring(0, 150) + "…" : fullText;
    textEl.classList.remove("expanded");
  } else {
    textEl.textContent = fullText;
    textEl.classList.add("expanded");
  }
}

function updateBookStats() {
  if (!currentReviews.length && defaultBookData) {
    document.getElementById("book-rating-stars").innerHTML = renderStars(
      defaultBookData.valoracion,
    );
    document.getElementById("book-rating-value").textContent =
      `${defaultBookData.valoracion.toFixed(1)} / 5`;
    document.getElementById("book-rating-count").textContent = "";
    return;
  }
  if (!currentReviews.length) return;
  const avg =
    currentReviews.reduce((sum, r) => sum + r.estrellas, 0) /
    currentReviews.length;
  const rounded = Math.round(avg * 10) / 10;
  document.getElementById("book-rating-stars").innerHTML = renderStars(rounded);
  document.getElementById("book-rating-value").textContent =
    `${rounded.toFixed(1)} / 5`;
  document.getElementById("book-rating-count").textContent =
    `(${currentReviews.length})`;
}

function getRandomTags(allTags, count = 6) {
  if (!allTags?.length)
    return (defaultBookData?.etiquetas || []).slice(0, count);
  const shuffled = [...allTags].sort(() => Math.random() - 0.5);
  return [...new Set(shuffled)].slice(0, count);
}

function openResenaModalForEdit(review) {
  document.getElementById("modal-title").textContent = "Editar tu reseña";
  document.getElementById("m-resena-edit-id").value = review.id;
  document.getElementById("m-resena-rating").value = review.estrellas;
  document.getElementById("m-resena-texto").value = review.texto;
  document.getElementById("m-resena-mood").value = review.mood || "";
  document.getElementById("m-resena-etiqueta").value = review.etiqueta || "";
  document.getElementById("btn-submit-modal").textContent = "Guardar cambios";
  document.getElementById("resena-modal").style.display = "flex";
}

function closeResenaModal() {
  document.getElementById("resena-modal").style.display = "none";
  document.getElementById("modal-resena-form").reset();
  document.getElementById("m-resena-edit-id").value = "";
  document.getElementById("modal-title").textContent = "Escribe tu reseña";
  document.getElementById("btn-submit-modal").textContent = "Publicar reseña";
}

async function submitResenaForm(source) {
  const prefix = source === "modal" ? "m-" : "";
  const editId = document.getElementById(`${prefix}resena-edit-id`).value;
  let rating = parseFloat(
    document.getElementById(`${prefix}resena-rating`).value.replace(",", "."),
  );
  const texto = document.getElementById(`${prefix}resena-texto`).value.trim();
  const mood = document.getElementById(`${prefix}resena-mood`).value;
  const etiqueta = document
    .getElementById(`${prefix}resena-etiqueta`)
    .value.trim();

  if (isNaN(rating) || rating < 0 || rating > 5) {
    showToast("⚠️ Valoración entre 0 y 5");
    return;
  }
  if (!texto) {
    showToast("⚠️ Escribe tu reseña");
    return;
  }
  rating = Math.round(rating * 2) / 2;

  const user = usuarioActual();
  if (!user) {
    showToast("⚠️ Debes iniciar sesión");
    return;
  }

  const result = editId
    ? await updateResena(editId, {
        estrellas: rating,
        texto,
        mood,
        etiqueta,
      })
    : await addResenaLibro(currentBook.id, {
        estrellas: rating,
        texto,
        mood,
        etiqueta,
        usuarioId: user.id,
        displayName: user.get("displayName") || user.get("username"),
      });

  if (result.ok) {
    showToast(editId ? "✅ Reseña actualizada" : "✅ Reseña publicada");
    closeResenaModal();
    document.getElementById("expandable-resena-form").classList.remove("show");
    document.getElementById("inline-resena-form").reset();
    await loadAndRenderReviews(currentBook.id);
  } else {
    showToast("❌ " + (result.error || "Error"));
  }
}

async function editReview(reviewId, event) {
  event.stopPropagation();
  const review = currentReviews.find((r) => r.id === reviewId);
  if (!review) return;
  openResenaModalForEdit(review);
}

async function deleteReview(reviewId, event) {
  event.stopPropagation();
  
  // ✅ Reemplaza confirm() por modal personalizado
  mostrarModalConfirmacion(
    "Eliminar reseña",
    "¿Estás seguro de que quieres eliminar esta reseña?<br><br>Esta acción no se puede deshacer.",
    async () => {
      const result = await deleteResena(reviewId);
      if (result.ok) {
        showToast("✅ Reseña eliminada");
        await loadAndRenderReviews(currentBook.id);
      } else {
        showToast("❌ Error al eliminar: " + (result.error || "desconocido"));
      }
    },
    "danger"
  );
}

async function voteReview(reviewId, vote, event) {
  event.stopPropagation();
  const user = usuarioActual();
  if (!user) {
    showToast("⚠️ Debes iniciar sesión para votar");
    return;
  }
  const result = await voteResena(reviewId, vote, user.id);
  if (result.ok) {
    showToast(
      vote === "up" ? "✅ Gracias por tu voto 👍" : "✅ Gracias por tu voto 👎",
    );
    await loadAndRenderReviews(currentBook.id);
  } else {
    showToast("❌ Error al votar");
  }
}
/* ═══════════════════════════════════════
COLABORACIONES - MODAL & FORM
═══════════════════════════════════════ */

// Mostrar/ocultar CTA en libro.html
function initCollabCTA() {
  const user = usuarioActual();
  const collabCta = document.getElementById("collab-cta");
  const collabHint = document.getElementById("collab-hint");
  const btnRequest = document.getElementById("btn-request-collab");

  if (!currentBook || !collabCta || !collabHint || !btnRequest) return;

  // ✅ Solo mostrar si el libro acepta al menos una modalidad de colaboración
  const aceptaFisico = currentBook.colabF === true;
  const aceptaEbook = currentBook.colabE === true;
  const aceptaColab = aceptaFisico || aceptaEbook;
  const esAutor =
    user && currentBook.escritorId && user.id === currentBook.escritorId;

  if (aceptaColab && user && !esAutor) {
    collabCta.style.display = "block";

    if (user.get("rol") === "bookstagramer") {
      collabHint.textContent =
        "Como bookstagramer, puedes solicitar reseñar este libro. No hay coste para el autor.";
      btnRequest.onclick = () =>
        openCollabModal(
          "bookstagramer_a_escritor",
          currentBook,
          aceptaFisico,
          aceptaEbook,
        );
    } else if (user.get("rol") === "escritor") {
      collabHint.textContent =
        "Como escritor, puedes invitar a un bookstagramer a reseñar este libro. Se aplicará su tarifa.";
      btnRequest.onclick = () =>
        openCollabModal(
          "escritor_a_bookstagramer",
          currentBook,
          aceptaFisico,
          aceptaEbook,
        );
    }
  } else {
    collabCta.style.display = "none";
  }
}

// Abrir modal de colaboración
function openCollabModal(tipo, book, aceptaFisico = true, aceptaEbook = true) {
  document.getElementById("collab-tipo").value = tipo;
  document.getElementById("collab-libroId").value = book.id;
  document.getElementById("collab-destinatarioId").value = book.escritorId;

  const fields = document.getElementById("collab-fields");
  const note = document.getElementById("collab-note");
  const title = document.getElementById("collab-modal-title");

  if (tipo === "bookstagramer_a_escritor") {
    title.textContent = "Solicitar reseñar este libro";

    // ✅ Construir opciones de modalidad según lo que acepte el libro
    let optionsHTML = "";
    if (aceptaFisico) {
      optionsHTML += `<option value="fisico">Envío físico del libro</option>`;
    }
    if (aceptaEbook) {
      optionsHTML += `<option value="ebook">Ebook / PDF</option>`;
    }
    if (aceptaFisico && aceptaEbook) {
      optionsHTML += `<option value="ambos">Ambos formatos</option>`;
    }

    // Si solo hay una opción, seleccionarla por defecto y mostrar mensaje
    const optionsCount = (aceptaFisico ? 1 : 0) + (aceptaEbook ? 1 : 0);
    const defaultOption =
      optionsCount === 1 ? (aceptaFisico ? "fisico" : "ebook") : "";

    fields.innerHTML = `
      <div class="form-group">
        <label>Modalidad de colaboración</label>
        <select id="collab-modalidad" required>
          ${optionsHTML}
        </select>
        ${defaultOption ? `<small style="color:var(--text-dim)">Este libro solo acepta ${defaultOption === "fisico" ? "envío físico" : "ebook"}.</small>` : ""}
      </div>
    `;
    // Si hay solo una opción, forzar su selección
    if (defaultOption) {
      setTimeout(() => {
        document.getElementById("collab-modalidad").value = defaultOption;
      }, 0);
    }

    note.innerHTML =
      "✅ <strong>Sin coste:</strong> Esta solicitud no genera ningún pago para el autor.";
  } else if (tipo === "escritor_a_bookstagramer") {
    title.textContent = "Invitar bookstagramer a colaborar";
    fields.innerHTML = `
      <div class="form-group">
        <label>Tarifa a pagar (€)</label>
        <input type="number" id="collab-tarifa" step="0.01" placeholder="Ej: 25.00" required />
        <small style="color:var(--text-dim)">Esta tarifa se cobrará a tu cuenta si el bookstagramer acepta.</small>
      </div>
    `;
    note.innerHTML =
      "⚠️ <strong>Con coste:</strong> Si el bookstagramer acepta, se cobrará la tarifa indicada a tu cuenta.";
  }

  document.getElementById("collab-modal").style.display = "flex";
}

function closeCollabModal() {
  document.getElementById("collab-modal").style.display = "none";
  document.getElementById("collab-form").reset();
  document.getElementById("collab-fields").innerHTML = "";
}

// Submit del formulario
document
  .getElementById("collab-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const tipo = document.getElementById("collab-tipo").value;
    const libroId = parseInt(document.getElementById("collab-libroId").value);
    const destinatarioId = document.getElementById(
      "collab-destinatarioId",
    ).value;
    const mensaje = document.getElementById("collab-mensaje").value.trim();

    const data = {
      tipo,
      libroId,
      destinatarioId,
      mensaje: mensaje || "Hola, me gustaría colaborar contigo en este libro.",
    };

    if (tipo === "bookstagramer_a_escritor") {
      data.modalidad = document.getElementById("collab-modalidad").value;
    } else if (tipo === "escritor_a_bookstagramer") {
      const tarifa = parseFloat(document.getElementById("collab-tarifa").value);
      if (isNaN(tarifa) || tarifa <= 0) {
        showToast("⚠️ Introduce una tarifa válida");
        return;
      }
      data.tarifa = tarifa;
    }

    const btn = document.getElementById("btn-submit-collab");
    const originalText = btn.textContent;

    // ✅ Usar modal personalizado en lugar de confirm()
    mostrarModalConfirmacion(
      "Confirmar envío de solicitud",
      tipo === "bookstagramer_a_escritor"
        ? "¿Estás seguro de que quieres solicitar reseñar este libro? El autor recibirá tu solicitud y podrá aceptarla o rechazarla."
        : `¿Estás seguro de que quieres invitar a un bookstagramer con una tarifa de <strong>${data.tarifa}€</strong>? Si acepta, se generará una colaboración pendiente de pago.`,
      async () => {
        btn.disabled = true;
        btn.textContent = "Enviando…";

        const result = await solicitarColaboracion(data);

        if (result.ok) {
          showToast(
            "✅ Solicitud enviada. Te avisaremos cuando haya respuesta.",
          );
          closeCollabModal();
        } else {
          showToast("❌ Error: " + (result.error || "No se pudo enviar"));
        }

        btn.disabled = false;
        btn.textContent = originalText;
      },
      "primary",
    );
  });

// Cerrar modal al hacer clic fuera
document.getElementById("collab-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "collab-modal") closeCollabModal();
});

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const bookId = parseInt(params.get("id"));
  const books = await loadBooks();
  const book = books.find((b) => b.id === bookId);
  currentBook = book;

  defaultBookData = book
    ? {
        valoracion: book.valoracion || 4.5,
        mood: book.mood || [],
        etiquetas: book.etiquetas || [],
      }
    : null;

  if (!book) {
    document.getElementById("book-content").innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 0;">
              <div style="font-size:3rem;margin-bottom:16px;">📚</div>
              <h2>Libro no encontrado</h2>
              <p style="margin:16px 0 24px;">Ese libro no existe en nuestro catálogo.</p>
              <a href="catalogo.html" class="btn btn-primary">Ver catálogo</a>
            </div>`;
    return;
  }

  document.getElementById("page-title").textContent = `${book.titulo} - AdEA`;
  document.getElementById("page-desc").content = book.sinopsis_corta || "";

  document.getElementById("book-content").innerHTML = `
          <div class="book-cover-wrap">
            <div class="book-cover">
              <img src="${book.imagen || ""}" alt="${book.titulo || ""}"
                onerror="this.src='assets/img/cover-placeholder.svg'">
            </div>
          </div>
          <div class="book-info">
            <div class="book-info__generos">
              ${(book.genero || []).map((g) => `<span class="badge badge-gold">${g}</span>`).join("")}
            </div>
            <h1 class="book-info__title">${book.titulo || ""}</h1>
            <div class="book-info__author">${book.autor || ""}</div>
            <div class="book-info__rating">
              <span class="stars" id="book-rating-stars">${renderStars(book.valoracion || 4.5)}</span>
              <span id="book-rating-value">${(book.valoracion || 4.5).toFixed(1)} / 5</span>
              <span id="book-rating-count" style="font-size:0.8rem;color:var(--text-dim);margin-left:8px;"></span>
            </div>
            <p class="book-info__sinopsis" style="text-align:justify;">${book.sinopsis_larga || ""}</p>
            <div class="book-info__tags" id="book-tags">
              ${getRandomTags(book.etiquetas || [])
                .map((t) => `<span class="book-info__tag">${t}</span>`)
                .join("")}
            </div>
            <div id="collab-cta" style="display:none; margin-top:24px; padding:20px; background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius-lg);">
  <div style="font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
    <span>🤝</span>
    <span>¿Quieres colaborar en este libro?</span>
  </div>
  <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;" id="collab-hint"></p>
  <button class="btn btn-amazon btn-lg buy-box__btn" id="btn-request-collab" style="
    background: #beb6b7;
    color: #852121;">
    Solicitar colaboración
  </button>
</div><br>
            <div class="buy-box">
              <div class="buy-box__label">¿Dónde comprarlo?</div>
              <div class="buy-box__main">
                <a href="${book.afiliado_url || "#"}" target="_blank" rel="noopener sponsored"
                  class="btn btn-amazon btn-lg buy-box__btn">👉 Amazon</a>
                <p class="affiliate-note">Muy recomendado esta semana · Entrega rápida con Prime</p>
                <p class="affiliate-note">*AdEA participa en el programa de afiliados de Amazon. Tu precio no cambia.</p>
              </div>
            </div>
            <a href="catalogo.html?mood=${(book.mood || [])[0] || ""}" class="btn btn-secondary">
              Ver más libros ${(book.mood || [])[0] || "similares"} →
            </a><br><br>
            <a href="catalogo.html" class="book-info__back" style="justify-content: center;">← Volver al catálogo</a>
          </div>`;

  const related = books
    .filter(
      (b) =>
        b.id !== book.id &&
        (b.mood || []).some((m) => (book.mood || []).includes(m)),
    )
    .slice(0, 4);
  document.getElementById("related-grid").innerHTML = related
    .map((b) => buildBookCard(b, ""))
    .join("");
  initFadeIn();
  // Botones de favoritos y leído

  document
    .getElementById("btn-mark-read")
    ?.addEventListener("click", async () => {
      const user = usuarioActual();
      if (!user) {
        showToast("⚠️ Debes iniciar sesión");
        location.href = "auth.html";
        return;
      }
      const result = await addLeido(currentBook.id);
      if (result.ok) {
        showToast(
          result.duplicado ? "✓ Ya marcado como leído" : "✓ Marcado como leído",
        );
      } else {
        showToast("❌ Error al guardar");
      }
    });

  await loadAndRenderReviews(book.id);

  document.getElementById("btn-add-resena").addEventListener("click", () => {
    const form = document.getElementById("expandable-resena-form");
    form.classList.toggle("show");
    if (form.classList.contains("show")) {
      document.getElementById("inline-resena-form").reset();
      document.getElementById("resena-edit-id").value = "";
      document.getElementById("btn-submit-resena").textContent =
        "Publicar reseña";
    }
  });
  document.getElementById("btn-cancel-inline").addEventListener("click", () => {
    document.getElementById("expandable-resena-form").classList.remove("show");
    document.getElementById("inline-resena-form").reset();
  });
  document
    .getElementById("inline-resena-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      submitResenaForm("inline");
    });
  const btnFav = document.getElementById("btn-add-fav");
  const btnRead = document.getElementById("btn-mark-read");

  // Verificar estado inicial si hay sesión
  async function initButtonStates() {
    const user = usuarioActual();
    if (!user || !currentBook) return;
    try {
      const [favs, leidosList] = await Promise.all([
        getFavoritos(),
        getLeidos(),
      ]);
      const esFav = favs.some(
        (f) => String(f.libroId) === String(currentBook.id),
      );
      const esLeido = leidosList.some(
        (l) => String(l.libroId) === String(currentBook.id),
      );
      if (esFav) {
        btnFav.textContent = "✓ Ya en favoritos";
        btnFav.classList.replace("btn-secondary", "btn-primary");
        btnFav.dataset.state = "saved";
      }
      if (esLeido) {
        btnRead.textContent = "✓ Leído";
        btnRead.classList.replace("btn-secondary", "btn-primary");
        btnRead.dataset.state = "read";
      }
    } catch (e) {
      /* ignorar */
    }
  }

  btnFav?.addEventListener("click", async () => {
    const user = usuarioActual();
    if (!user) {
      showToast("⚠️ Debes iniciar sesión");
      location.href = "auth.html";
      return;
    }

    // Toggle: si ya está guardado, quitar
    if (btnFav.dataset.state === "saved") {
      const result = await removeFavorito(currentBook.id);
      if (result.ok) {
        btnFav.textContent = "♥ Agregar a favoritos";
        btnFav.classList.replace("btn-primary", "btn-secondary");
        btnFav.dataset.state = "idle";
        showToast("❌ Eliminado de favoritos");
      }
      return;
    }

    btnFav.textContent = "⏳ Guardando…";
    btnFav.disabled = true;
    const result = await addFavorito(currentBook.id, {
      titulo: currentBook.titulo,
      autor: currentBook.autor,
      imagen: currentBook.imagen,
      sinopsis_corta: currentBook.sinopsis_corta,
      paginas: currentBook.paginas,
      precio: currentBook.precio,
      afiliado_url: currentBook.afiliado_url,
      etiquetas: currentBook.etiquetas || [],
      mood: currentBook.mood || [],
    });
    btnFav.disabled = false;
    if (result.ok) {
      btnFav.textContent = "✓ Ya en favoritos";
      btnFav.classList.replace("btn-secondary", "btn-primary");
      btnFav.dataset.state = "saved";
      showToast(
        result.duplicado
          ? "✓ Ya estaba en favoritos"
          : "♥ Guardado en favoritos",
      );
    } else {
      btnFav.textContent = "♥ Agregar a favoritos";
      showToast("❌ Error al guardar");
    }
  });

  btnRead?.addEventListener("click", async () => {
    const user = usuarioActual();
    if (!user) {
      showToast("⚠️ Debes iniciar sesión");
      location.href = "auth.html";
      return;
    }

    if (btnRead.dataset.state === "read") {
      showToast("✓ Ya lo tienes marcado como leído");
      return;
    }

    btnRead.textContent = "⏳ Guardando…";
    btnRead.disabled = true;
    const result = await addLeido(currentBook.id);
    btnRead.disabled = false;
    if (result.ok) {
      btnRead.textContent = "✓ Leído";
      btnRead.classList.replace("btn-secondary", "btn-primary");
      btnRead.dataset.state = "read";
      showToast(
        result.duplicado ? "✓ Ya marcado como leído" : "✓ Marcado como leído",
      );
    } else {
      btnRead.textContent = "📖 Marcar como leído";
      showToast("❌ Error al guardar");
    }
  });

  // Inicializar estados de botones
  await initButtonStates();

  await loadAndRenderReviews(book.id);
  document
    .getElementById("modal-close")
    .addEventListener("click", closeResenaModal);
  document
    .getElementById("modal-cancel")
    .addEventListener("click", closeResenaModal);
  document.getElementById("resena-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("resena-modal"))
      closeResenaModal();
  });
  document
    .getElementById("modal-resena-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      submitResenaForm("modal");
    });

  ["resena-rating", "m-resena-rating"].forEach((id) => {
    document.getElementById(id).addEventListener("input", (e) => {
      e.target.value = e.target.value
        .replace(",", ".")
        .replace(/[^0-5.]/g, "")
        .slice(0, 3);
    });
  });
  initCollabCTA();
});
