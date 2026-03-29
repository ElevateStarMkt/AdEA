/* ===================================================
   AdEA — Componentes compartidos (components.js)
   =================================================== */

function getNav(prefix = "") {
  return `
  <nav class="nav">
    <div class="nav__inner">
      <a href="${prefix}index.html" class="nav__logo">Ad<span>EA</span></a>
      <ul class="nav__links">
        <li><a href="${prefix}index.html">Inicio</a></li>
        <li><a href="${prefix}auth.html">Cuenta</a></li>
        <li><a href="${prefix}catalogo.html">Catálogo</a></li>
        <li><a href="${prefix}comunidad.html">Comunidad</a></li>
        <li><a href="${prefix}bookstagramers.html">Bookstagramers</a></li>
        <li><a href="${prefix}contacto.html">Contacto</a></li>
        <li><a href="${prefix}descubrir.html" class="nav__cta">Déjate sorprender</a></li>
      </ul>
      <div class="nav__hamburger" aria-label="Menú" role="button" tabindex="0">
        <span></span><span></span><span></span>
      </div>
    </div>
  </nav>`;
}

function getFooter(prefix = "") {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div>
          <div class="footer__logo">Ad<span>EA</span></div>
          <p class="footer__desc">Motor de descubrimiento emocional de libros. Encuentra tu próxima obsesión literaria.</p>
        </div>
        <div class="footer__col">
          <h4>Explorar</h4>
          <ul>
            <li><a href="${prefix}descubrir.html">Déjate sorprender</a></li>
            <li><a href="${prefix}catalogo.html">Todo el catálogo</a></li>
            <li><a href="${prefix}catalogo.html?mood=adictivo">Libros adictivos</a></li>
            <li><a href="${prefix}catalogo.html?mood=spicy">Romance spicy</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>Comunidad</h4>
          <ul>
            <li><a href="${prefix}comunidad.html">Comunidad lectora</a></li>
            <li><a href="${prefix}bookstagramers.html">Bookstagramers</a></li>
            <li><a href="${prefix}contacto.html">Colaboraciones</a></li>
            <li><a href="${prefix}contacto.html">Editoriales</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>Legal</h4>
          <ul>
            <li><a href="${prefix}aviso-legal.html">Aviso legal</a></li>
            <li><a href="${prefix}privacidad.html">Privacidad</a></li>
            <li><a href="${prefix}cookies.html">Cookies</a></li>
            <li><a href="${prefix}blogs_otros/como-funciona.html">Cómo funciona</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span class="footer__legal">© 2026 AdEA · Participante en el Programa de Afiliados de Amazon. Como Asociado de Amazon, obtenemos ingresos por las compras adscritas que cumplen los requisitos aplicables.</span>
        <div class="footer__social">
          <a href="https://www.instagram.com/adea_libros/" target="_blank" rel="noopener">Instagram</a>
          <a href="https://www.t.me/adea_oficial" target="_blank" rel="noopener">Telegram</a>
        </div>
      </div>
    </div>
  </footer>`;
}

function injectShell(prefix = "") {
  const navPlaceholder = document.getElementById("nav-placeholder");
  const footerPlaceholder = document.getElementById("footer-placeholder");
  if (navPlaceholder) navPlaceholder.outerHTML = getNav(prefix);
  if (footerPlaceholder) footerPlaceholder.outerHTML = getFooter(prefix);
}
