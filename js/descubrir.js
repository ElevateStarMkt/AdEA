injectShell("");
/* =====================================================
STATE
===================================================== */
let allBooks = [];
let deck = [];
let deckIndex = 0;
let history = [];
let cart = [];
let discarded = new Set();
let favoritesIds = new Set(); // NUEVO: IDs de favoritos
let isDragging = false;
let startX = 0,
  startY = 0,
  currentX = 0;
let activeCard = null;
/* =====================================================
HELPERS
===================================================== */
// Función para truncar texto a un máximo de caracteres
function truncateText(text, limit) {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "...";
}
/* =====================================================
INIT
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  allBooks = await loadBooks();
  // ✅ CORRECCIÓN: Usar funciones de Parse en lugar de localStorage
  const user = usuarioActual();
  if (user) {
    // Cargar favoritos desde Parse
    const favoritos = await getFavoritos();
    favoritos.forEach((f) => {
      if (!cart.find((c) => c.libroId === f.libroId)) {
        cart.push({
          libroId: f.libroId,
          sinopsis: f.sinopsis,
          paginas: f.paginas,
          precio: f.precio,
          afiliado_url: f.afiliado_url,
          etiquetas: f.etiquetas,
          mood: f.mood,
          titulo: f.titulo,
          autor: f.autor,
          imagen: f.imagen,
        });
      }
      favoritesIds.add(f.libroId);
    });
    // Cargar descartados desde Parse
    const descartados = await getDescartados();
    descartados.forEach((id) => discarded.add(id));
  } else {
    // ✅ Fallback: Si no hay sesión, usar localStorage (para usuarios no registrados)
    const d = localStorage.getItem("adea_descartados");
    if (d) JSON.parse(d).forEach((id) => discarded.add(id));
    const s = localStorage.getItem("adea_favoritos");
    if (s) {
      const saved = JSON.parse(s);
      saved.forEach((f) => {
        if (!cart.find((c) => c.libroId === f.libroId)) cart.push(f);
        favoritesIds.add(f.libroId);
      });
    }
  }
  renderCart();
  applyFiltersAndBuildDeck();
  bindFilters();
  bindButtons();
});
/* =====================================================
FILTERS → DECK
===================================================== */
function applyFiltersAndBuildDeck() {
  const genero = document.getElementById("f-genero").value;
  const mood = document.getElementById("f-mood").value;
  const maxPag = parseInt(document.getElementById("f-pages").value);
  let books = allBooks.filter((b) => {
    if (b.activo === false) return false;
    if (discarded.has(b.id)) return false;
    if (cart.find((c) => c.libroId === b.id)) return false;
    if (favoritesIds.has(b.id)) return false; // NUEVO: Excluir favoritos
    if (genero && !b.genero.includes(genero)) return false;
    if (mood && !b.mood.includes(mood)) return false;
    if (b.paginas && b.paginas > maxPag) return false;
    return true;
  });
  // Shuffle
  books = books.sort(() => Math.random() - 0.5);
  deck = books;
  deckIndex = 0;
  history = [];
  renderStack();
  updateCounter();
}
function bindFilters() {
  document
    .getElementById("f-genero")
    .addEventListener("change", applyFiltersAndBuildDeck);
  document
    .getElementById("f-mood")
    .addEventListener("change", applyFiltersAndBuildDeck);
  document.getElementById("f-pages").addEventListener("input", (e) => {
    const v = parseInt(e.target.value);
    document.getElementById("pages-label").textContent =
      v >= 600 ? "Todas" : `<= ${v} págs.`;
    applyFiltersAndBuildDeck();
  });
  document.getElementById("btn-reset-filters").addEventListener("click", () => {
    document.getElementById("f-genero").value = "";
    document.getElementById("f-mood").value = "";
    document.getElementById("f-pages").value = 600;
    document.getElementById("pages-label").textContent = "Todas";
    applyFiltersAndBuildDeck();
  });
}
/* =====================================================
RENDER STACK
===================================================== */
function renderStack() {
  const stack = document.getElementById("card-stack");
  const empty = document.getElementById("swipe-empty");
  const actions = document.getElementById("swipe-actions");
  const remaining = deck.slice(deckIndex);
  if (!remaining.length) {
    stack.innerHTML = "";
    empty.classList.add("show");
    actions.style.opacity = ".3";
    actions.style.pointerEvents = "none";
    updateCounter();
    return;
  }
  empty.classList.remove("show");
  actions.style.opacity = "1";
  actions.style.pointerEvents = "auto";
  // Render up to 4 cards (top = last in DOM = highest z-index)
  const visible = remaining.slice(0, 4);
  stack.innerHTML = "";
  visible
    .slice()
    .reverse()
    .forEach((book, revIdx) => {
      const idx = visible.length - 1 - revIdx; // 0 = top card
      const card = buildSwipeCard(book, idx);
      stack.appendChild(card);
      if (idx === 0) attachDragHandlers(card, book);
    });
  // Undo button state
  document.getElementById("btn-undo").disabled = history.length === 0;
  updateCounter();
}
function buildSwipeCard(book, stackPos) {
  const el = document.createElement("div");
  el.className = `swipe-card ${stackPos === 0 ? "is-top" : `behind-${stackPos}`}`;
  el.dataset.id = book.id;
  const tagsHTML = book.etiquetas
    .slice(0, 2)
    .map((t) => `<span class="tag" style="font-size:.7rem;">${t}</span>`)
    .join("");
  const moodsHTML = book.mood
    .slice(0, 3)
    .map((m) => `<span class="swipe-card__mood-badge">${m}</span>`)
    .join("");
  // TRUNCAMIENTO DE SINOPSIS (Máximo 425 caracteres)
  const sinopsisTruncada = truncateText(book.sinopsis_larga, 300);
  el.innerHTML = `
<div class="swipe-card__like-label" id="like-label">✓ Guardado</div>
<div class="swipe-card__pass-label" id="pass-label">X Descartar</div>
<div class="swipe-card__moods">${moodsHTML}</div>
<p class="swipe-card__synopsis">${sinopsisTruncada}</p>
<div class="swipe-card__tags">${tagsHTML}</div>
<div class="swipe-card__meta">
<div class="swipe-card__meta-item">
<span class="swipe-card__meta-label">Páginas</span>
<span class="swipe-card__meta-value">${book.paginas || "—"}</span>
</div>
<div class="swipe-card__meta-item">
<span class="swipe-card__meta-label">Precio aprox.</span>
<span class="swipe-card__meta-value">${book.precio ? book.precio.toFixed(2) + " EUR" : "—"}</span>
</div>
<div class="swipe-card__meta-item">
<span class="swipe-card__meta-label">Valoración</span>
<span class="swipe-card__meta-value">${renderStars(book.valoracion)}</span>
</div>
</div>
`;
  return el;
}
function updateCounter() {
  const remaining = deck.length - deckIndex;
  document.getElementById("count-current").textContent =
    deckIndex + 1 > deck.length ? deck.length : deckIndex + 1;
  document.getElementById("count-total").textContent = deck.length;
}
/* =====================================================
DRAG HANDLERS
===================================================== */
function attachDragHandlers(card, book) {
  // Mouse
  card.addEventListener("mousedown", (e) =>
    startDrag(e.clientX, e.clientY, card),
  );
  document.addEventListener("mousemove", (e) =>
    moveDrag(e.clientX, card, book),
  );
  document.addEventListener("mouseup", (e) => endDrag(e.clientX, card, book));
  // Touch
  card.addEventListener(
    "touchstart",
    (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY, card),
    { passive: true },
  );
  card.addEventListener(
    "touchmove",
    (e) => moveDrag(e.touches[0].clientX, card, book),
    { passive: true },
  );
  card.addEventListener("touchend", (e) =>
    endDrag(e.changedTouches[0].clientX, card, book),
  );
}
function startDrag(x, y, card) {
  isDragging = true;
  activeCard = card;
  startX = x;
  startY = y;
  card.style.transition = "none";
}
function moveDrag(x, card, book) {
  if (!isDragging || activeCard !== card) return;
  currentX = x - startX;
  const rotate = currentX * 0.08;
  card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
  // Feedback labels
  const likeLabel = card.querySelector(".swipe-card__like-label");
  const passLabel = card.querySelector(".swipe-card__pass-label");
  const ratio = Math.min(Math.abs(currentX) / 100, 1);
  if (currentX > 20) {
    likeLabel.style.opacity = ratio;
    passLabel.style.opacity = 0;
    card.style.borderColor = `rgba(34,197,94,${ratio * 0.6})`;
  } else if (currentX < -20) {
    passLabel.style.opacity = ratio;
    likeLabel.style.opacity = 0;
    card.style.borderColor = `rgba(239,68,68,${ratio * 0.6})`;
  } else {
    likeLabel.style.opacity = 0;
    passLabel.style.opacity = 0;
    card.style.borderColor = "";
  }
}
function endDrag(x, card, book) {
  if (!isDragging || activeCard !== card) return;
  isDragging = false;
  activeCard = null;
  const delta = x - startX;
  card.style.transition = "transform .3s ease, opacity .3s ease";
  if (delta > 90) {
    flyOut(card, "right", book);
  } else if (delta < -90) {
    flyOut(card, "left", book);
  } else {
    // Snap back
    card.style.transform = "";
    card.style.borderColor = "";
    const likeLabel = card.querySelector(".swipe-card__like-label");
    const passLabel = card.querySelector(".swipe-card__pass-label");
    if (likeLabel) likeLabel.style.opacity = 0;
    if (passLabel) passLabel.style.opacity = 0;
  }
}
/* =====================================================
SWIPE ACTIONS
===================================================== */
function flyOut(card, dir, book) {
  const x = dir === "right" ? window.innerWidth : -window.innerWidth;
  card.style.transform = `translateX(${x}px) rotate(${dir === "right" ? 20 : -20}deg)`;
  card.style.opacity = "0";
  card.style.borderColor = "";
  setTimeout(() => {
    if (dir === "right") saveBook(book);
    else discardBook(book);
  }, 280);
}
async function saveBook(book) {
  history.push({ action: "save", book });
  // ✅ CORRECCIÓN: Usar backend si hay sesión
  const user = usuarioActual();
  if (user) {
    await addFavorito(book.id, {
      libroId: book.id,
      titulo: book.titulo,
      autor: book.autor,
      imagen: book.imagen,
      sinopsis_corta: book.sinopsis_corta,
      sinopsis: book.sinopsis_larga,
      paginas: book.paginas,
      precio: book.precio,
      afiliado_url: book.afiliado_url,
      etiquetas: book.etiquetas,
      mood: book.mood,
    });
  } else {
    // Fallback localStorage
    let saved = JSON.parse(localStorage.getItem("adea_favoritos") || "[]");
    if (!saved.find((f) => f.libroId === book.id)) {
      saved.push({
        libroId: book.id,
        sinopsis: book.sinopsis_corta,
        paginas: book.paginas,
        precio: book.precio,
        afiliado_url: book.afiliado_url,
        etiquetas: book.etiquetas,
        mood: book.mood,
        titulo: book.titulo,
        autor: book.autor,
        imagen: book.imagen,
      });
      localStorage.setItem("adea_favoritos", JSON.stringify(saved));
    }
  }
  cart.unshift({
    libroId: book.id,
    sinopsis: book.sinopsis_corta,
    paginas: book.paginas,
    precio: book.precio,
    afiliado_url: book.afiliado_url,
    etiquetas: book.etiquetas,
    mood: book.mood,
    titulo: book.titulo,
    autor: book.autor,
    imagen: book.imagen,
  });
  favoritesIds.add(book.id);
  deckIndex++;
  renderStack();
  renderCart();
  showToast("Guardado en tu lista secreta");
}
async function discardBook(book) {
  history.push({ action: "discard", book });
  // ✅ CORRECCIÓN: Usar backend si hay sesión
  const user = usuarioActual();
  if (user) {
    await descartarLibro(book.id);
  } else {
    // Fallback localStorage
    let d = JSON.parse(localStorage.getItem("adea_descartados") || "[]");
    if (!d.includes(book.id)) {
      d.push(book.id);
      localStorage.setItem("adea_descartados", JSON.stringify(d));
    }
  }
  discarded.add(book.id);
  deckIndex++;
  renderStack();
}
function undoLast() {
  if (!history.length) return;
  const last = history.pop();
  if (last.action === "save") {
    cart = cart.filter((c) => c.libroId !== last.book.id);
    removeFavorito(last.book.id);
    renderCart();
  } else {
    discarded.delete(last.book.id);
  }
  deckIndex = Math.max(0, deckIndex - 1);
  renderStack();
  showToast("Accion deshecha");
}
/* =====================================================
BUTTON BINDINGS
===================================================== */
function bindButtons() {
  document.getElementById("btn-pass").addEventListener("click", () => {
    const topCard = document.querySelector(".swipe-card.is-top");
    const book = deck[deckIndex];
    if (!topCard || !book) return;
    flyOut(topCard, "left", book);
  });
  document.getElementById("btn-save").addEventListener("click", () => {
    const topCard = document.querySelector(".swipe-card.is-top");
    const book = deck[deckIndex];
    if (!topCard || !book) return;
    flyOut(topCard, "right", book);
  });
  document.getElementById("btn-undo").addEventListener("click", undoLast);
}
/* =====================================================
CART RENDER
===================================================== */
function renderCart() {
  const list = document.getElementById("cart-list");
  const empty = document.getElementById("cart-empty");
  const footer = document.getElementById("cart-footer");
  const count = cart.length;
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-count-mobile").textContent = count;
  if (!count) {
    empty.style.display = "flex";
    footer.style.display = "none";
    // Remove items but keep empty state
    list.querySelectorAll(".cart-item").forEach((el) => el.remove());
    return;
  }
  empty.style.display = "none";
  footer.style.display = "flex";
  // Full re-render
  list.querySelectorAll(".cart-item").forEach((el) => el.remove());
  cart.forEach((item) => {
    const el = document.createElement("div");
    el.className = "cart-item";
    el.dataset.id = item.libroId;
    const tagsHTML = (item.etiquetas || [])
      .slice(0, 1)
      .map((t) => `<span class="cart-item__meta-pill">${t}</span>`)
      .join("");
    el.innerHTML = `
<button class="cart-item__remove" onclick="removeFromCart(${item.libroId}); event.stopPropagation();" title="Quitar">X</button>
<p class="cart-item__synopsis">"${item.sinopsis}"</p>
<div class="cart-item__meta">
${item.paginas ? `<span class="cart-item__meta-pill">📄 ${item.paginas} págs.</span>` : ""}
${item.precio ? `<span class="cart-item__meta-pill cart-item__price">💶 ${item.precio.toFixed(2)} EUR</span>` : ""}
${tagsHTML}
</div>
<a href="${item.afiliado_url}" target="_blank" rel="noopener sponsored"
class="cart-item__buy"
onclick="if(typeof trackClick==='function') trackClick(${item.libroId});">
Comprar en Amazon
</a>
`;
    list.insertBefore(el, list.firstChild);
  });
}
async function removeFromCart(libroId) {
  cart = cart.filter((c) => c.libroId !== libroId);
  favoritesIds.delete(libroId);
  // ✅ CORRECCIÓN: Usar backend si hay sesión
  const user = usuarioActual();
  if (user) {
    await removeFavorito(libroId);
  } else {
    // Fallback localStorage
    let saved = JSON.parse(localStorage.getItem("adea_favoritos") || "[]");
    saved = saved.filter((f) => f.libroId !== libroId);
    localStorage.setItem("adea_favoritos", JSON.stringify(saved));
  }
  renderCart();
  showToast("Eliminado de tu lista");
}
async function clearCart() {
  if (!confirm("¿Vaciar toda la lista?")) return;
  const user = usuarioActual();
  for (const c of cart) {
    favoritesIds.delete(c.libroId);
    if (user) {
      await removeFavorito(c.libroId);
    }
  }
  if (!user) {
    localStorage.removeItem("adea_favoritos");
  }
  cart = [];
  renderCart();
}
function resetDescartados() {
  discarded.clear();
  localStorage.removeItem("adea_descartados");
  applyFiltersAndBuildDeck();
}
/* =====================================================
MOBILE PANEL TOGGLE
===================================================== */
function toggleCartPanel() {
  document.getElementById("cart-panel").classList.toggle("open");
}
