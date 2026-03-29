/* ===================================================
AdEA — JS compartido (utils.js)
=================================================== */

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
            // ✅ Usar save con opciones para evitar errores de ACL
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
          colabF: b.get("colabF") === true, // ← ASEGURAR QUE SEA BOOLEANO
          colabE: b.get("colabE") === true, // ← ASEGURAR QUE SEA BOOLEANO
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
        // En JSON local el campo activo puede no existir, asumir true
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

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  setActiveNav();
  initFadeIn();
});
