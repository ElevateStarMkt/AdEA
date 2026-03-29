/* ===================================================
AdEA — Backend (Back4App / Parse SDK)
Soporta 3 roles: lector, escritor, bookstagramer
=================================================== */
Parse.initialize(
  "rC20XbzdDEcDyMhkPp3NqSGCQvzobbmOZco0YMO5",
  "95IiJs4PlCBuKs0TkdXkllFlBPMgISAK1nrN90Pk",
);
Parse.serverURL = "https://parseapi.back4app.com";

/* =====================================================
AUTH
===================================================== */
async function registrarUsuario(
  email,
  password,
  displayName,
  rol = "lector",
  extras = {},
) {
  try {
    const user = new Parse.User();
    user.set("username", email.toLowerCase().trim());
    user.set("email", email.toLowerCase().trim());
    user.set("password", password);
    user.set("displayName", displayName || email.split("@")[0]);
    user.set("nombre", extras.nombre || displayName || email.split("@")[0]);
    user.set("rol", rol);
    user.set("activo", true);

    if (rol === "bookstagramer") {
      user.set("instagram", extras.instagram || "");
      user.set("seguidores", extras.seguidores || 0);
      user.set("generoFavorito", extras.genero || "");
      user.set("tarifa", extras.tarifa || 0);
      user.set("condiciones", extras.condiciones || "");
    }
    if (rol === "escritor") user.set("publicados", 0);
    if (rol === "lector") user.set("generoFavorito", extras.genero || "");

    user.set("leidos", 0);
    user.set("guardado", 0);
    user.set("descartado", 0);
    user.set("resenas", 0);
    user.set("seguidoresAdEA", 0); // ✅ Inicializado en 0
    user.set("following", []);

    await user.signUp();
    await crearPerfilPublico(user, extras);
    return { ok: true, user };
  } catch (err) {
    console.error("Error en registro:", err.message);
    let msg = err.message;
    if (err.code === 202) msg = "Este email ya tiene una cuenta registrada.";
    return { ok: false, error: msg };
  }
}

async function loginUsuario(email, password) {
  try {
    const user = await Parse.User.logIn(email.toLowerCase().trim(), password);
    return { ok: true, user };
  } catch (err) {
    let msg = "Email o contraseña incorrectos.";
    if (err.code === 101) msg = "Email o contraseña incorrectos.";
    if (err.code === 205)
      msg = "Este email no tiene cuenta. ¿Quieres registrarte?";
    return { ok: false, error: msg };
  }
}

async function logoutUsuario() {
  try {
    await Parse.User.logOut();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function usuarioActual() {
  return Parse.User.current();
}
function haySession() {
  return !!Parse.User.current();
}

/* =====================================================
BOOKSTAGRAMER — Solicitud
===================================================== */
async function enviarSolicitudBookstagramer(data) {
  try {
    const result = await registrarUsuario(
      data.email,
      data.password,
      data.instagram || data.nombre,
      "bookstagramer",
      {
        nombre: data.nombre,
        instagram: data.instagram,
        seguidores: data.seguidores,
        genero: data.genero,
      },
    );
    if (!result.ok) return result;

    try {
      const Solicitud = Parse.Object.extend("Solicitudes");
      const sol = new Solicitud();
      sol.set("nombre", data.nombre);
      sol.set("email", data.email);
      sol.set("instagram", data.instagram);
      sol.set("seguidores", data.seguidores);
      sol.set("genero", data.genero);
      sol.set("mensaje", data.mensaje || "");
      sol.set("estado", "pendiente");
      sol.set("usuario", result.user);
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setWriteAccess(result.user, true);
      sol.setACL(acl);
      await sol.save();
    } catch (e) {
      console.warn("No se pudo guardar solicitud adicional:", e.message);
      return { ok: true, user: result.user, warning: true };
    }
    return { ok: true, user: result.user };
  } catch (err) {
    console.error("Error en solicitud bookstagramer:", err.message);
    return { ok: false, error: err.message };
  }
}

/* =====================================================
PERFILES PÚBLICOS (PublicProfiles)
===================================================== */
async function crearPerfilPublico(user, extras = {}) {
  try {
    const Profile = Parse.Object.extend("PublicProfiles");
    const profile = new Profile();
    profile.set("userId", user.id);
    profile.set("rol", user.get("rol"));
    profile.set("displayName", user.get("displayName"));
    profile.set("nombre", user.get("nombre"));
    profile.set("bio", extras.bio || "");
    profile.set("web", extras.web || "");
    profile.set("seguidoresAdEA", 0);
    profile.set("email", user.get("email") || "");

    const rol = user.get("rol");
    if (rol === "bookstagramer") {
      profile.set("instagram", user.get("instagram") || extras.instagram || "");
      profile.set(
        "generoFavorito",
        user.get("generoFavorito") || extras.genero || "",
      );
      profile.set("tarifa", user.get("tarifa") || 0);
      profile.set("condiciones", user.get("condiciones") || "");
    }
    if (rol === "escritor") {
      profile.set("publicados", user.get("publicados") || 0);
      profile.set("generosPrincipales", []);
    }
    if (rol === "lector") profile.set("generoFavorito", extras.genero || "");

    // ✅ ACL: Lectura pública + Escritura para el dueño + Escritura para usuarios logueados (solo seguidoresAdEA)
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(true); // ✅ Todos pueden leer
    acl.setWriteAccess(user, true); // ✅ El dueño puede escribir todo
    // Nota: Parse no permite ACL por campo, pero al ser un contador público es aceptable
    profile.setACL(acl);

    await profile.save();
    return { ok: true, profile };
  } catch (err) {
    console.error("Error creando perfil público:", err.message);
    return { ok: false, error: err.message };
  }
}

async function getPerfilPublico(userId) {
  try {
    const Profile = Parse.Object.extend("PublicProfiles");
    const q = new Parse.Query(Profile);
    q.equalTo("userId", userId);
    const p = await q.first({ useMasterKey: false }); // ✅ Sin cache
    if (!p) return null;
    return {
      id: p.id,
      userId: p.get("userId"),
      rol: p.get("rol"),
      nombre: p.get("nombre"),
      displayName: p.get("displayName"),
      bio: p.get("bio") || "",
      web: p.get("web") || "",
      email: p.get("email") || "",
      seguidoresAdEA:
        typeof p.get("seguidoresAdEA") === "number"
          ? p.get("seguidoresAdEA")
          : 0, // ✅ Garantizar número
      instagram: p.get("instagram") || "",
      generoFavorito: p.get("generoFavorito") || "",
      tarifa: p.get("tarifa") || 0,
      condiciones: p.get("condiciones") || "",
      publicados: p.get("publicados") || 0,
      generosPrincipales: p.get("generosPrincipales") || [],
    };
  } catch (err) {
    console.error("Error cargando perfil público:", err.message);
    return null;
  }
}

async function updatePerfilPublico(updates) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No hay sesión" };
  try {
    const Profile = Parse.Object.extend("PublicProfiles");
    const q = new Parse.Query(Profile);
    q.equalTo("userId", user.id);
    let p = await q.first();
    if (!p) {
      p = new Profile();
      p.set("userId", user.id);
      p.set("rol", user.get("rol"));
      p.set("nombre", user.get("nombre"));
      p.set("displayName", user.get("displayName"));
      p.set("email", user.get("email") || "");
      p.set("seguidoresAdEA", 0);
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      acl.setWriteAccess(user, true);
      p.setACL(acl);
    }
    Object.keys(updates).forEach((k) => p.set(k, updates[k]));
    await p.save();

    // Sincronizar a _User
    const syncKeys = [
      "bio",
      "web",
      "instagram",
      "tarifa",
      "condiciones",
      "generoFavorito",
    ];
    let needsSave = false;
    syncKeys.forEach((k) => {
      if (updates[k] !== undefined) {
        user.set(k, updates[k]);
        needsSave = true;
      }
    });
    if (needsSave) await user.save();
    return { ok: true };
  } catch (err) {
    console.error("Error actualizando perfil público:", err.message);
    return { ok: false, error: err.message };
  }
}

async function getTodosLosPerfiles(filtroRol = "") {
  try {
    const Profile = Parse.Object.extend("PublicProfiles");
    const q = new Parse.Query(Profile);
    if (filtroRol) q.equalTo("rol", filtroRol);
    q.limit(200);
    q.descending("createdAt");
    const results = await q.find({ useMasterKey: false });
    return results.map((p) => ({
      id: p.id,
      userId: p.get("userId"),
      rol: p.get("rol"),
      nombre: p.get("nombre") || p.get("displayName") || "Usuario",
      bio: p.get("bio") || "",
      web: p.get("web") || "",
      seguidoresAdEA:
        typeof p.get("seguidoresAdEA") === "number"
          ? p.get("seguidoresAdEA")
          : 0,
      instagram: p.get("instagram") || "",
      generoFavorito: p.get("generoFavorito") || "",
      tarifa: p.get("tarifa") || 0,
      condiciones: p.get("condiciones") || "",
      publicados: p.get("publicados") || 0,
      generosPrincipales: p.get("generosPrincipales") || [],
    }));
  } catch (err) {
    console.error("Error cargando perfiles:", err.message);
    return [];
  }
}

/* =====================================================
SEGUIR — Lógica exclusiva para PublicProfiles
===================================================== */
async function toggleFollow(targetUserId) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "Debes iniciar sesión" };
  try {
    const result = await Parse.Cloud.run("toggleFollow", { targetUserId });
    // Refrescar el usuario local para que following esté actualizado
    await user.fetch();
    return result;
  } catch (err) {
    console.error("❌ Error en toggleFollow:", err.message);
    return { ok: false, error: err.message };
  }
}

/* =====================================================
LIBROS
===================================================== */
async function _actualizarGenerosPrincipales(escritorId) {
  try {
    const Book = Parse.Object.extend("Books");
    const q = new Parse.Query(Book);
    q.equalTo("escritorId", escritorId);
    q.equalTo("activo", true);
    q.limit(200);
    const libros = await q.find();
    const generoCount = {};
    libros.forEach((b) => {
      (b.get("genero") || []).forEach((g) => {
        generoCount[g] = (generoCount[g] || 0) + 1;
      });
    });
    const topGeneros = Object.entries(generoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);
    await updatePerfilPublico({
      generosPrincipales: topGeneros,
      publicados: libros.length,
    });
  } catch (err) {
    console.warn("No se pudo actualizar géneros:", err.message);
  }
}

async function addLibro(bookData) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No hay sesión" };
  try {
    const Book = Parse.Object.extend("Books");
    const book = new Book();
    book.set("titulo", bookData.titulo);
    book.set("autor", bookData.autor);
    book.set("genero", bookData.genero || []);
    book.set("mood", bookData.mood || []);
    book.set("imagen", bookData.imagen);
    book.set("paginas", bookData.paginas || 0);
    book.set("precio", bookData.precio || 0);
    book.set("sinopsis_corta", bookData.sinopsis_corta);
    book.set("sinopsis_larga", bookData.sinopsis_larga);
    book.set("colabF", bookData.colabF || false);
    book.set("colabE", bookData.colabE || false);
    book.set("activo", bookData.activo !== undefined ? bookData.activo : true);
    book.set("afiliado_url", bookData.afiliado_url);
    book.set("escritorId", user.id);
    book.set("guardado", 0);
    book.set("descartado", 0);
    book.set("clicks", 0);
    book.set("valoracion", bookData.valoracion || 4.5);
    book.set("libroId", bookData.libroId || Date.now());
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setWriteAccess(user, true);
    book.setACL(acl);
    await book.save();
    user.increment("publicados", 1);
    await user.save();
    await _actualizarGenerosPrincipales(user.id);
    return { ok: true, id: book.id, libroId: book.get("libroId") };
  } catch (err) {
    console.error("Error añadiendo libro:", err.message);
    return { ok: false, error: err.message };
  }
}

async function getMisLibros(escritorId) {
  try {
    const Book = Parse.Object.extend("Books");
    const q = new Parse.Query(Book);
    q.equalTo("escritorId", escritorId);
    q.descending("createdAt");
    q.limit(200);
    const results = await q.find();
    return results.map((b) => ({
      id: b.id,
      libroId: b.get("libroId"),
      titulo: b.get("titulo"),
      autor: b.get("autor"),
      genero: b.get("genero") || [],
      mood: b.get("mood") || [],
      imagen: b.get("imagen"),
      paginas: b.get("paginas") || 0,
      precio: b.get("precio") || 0,
      sinopsis_corta: b.get("sinopsis_corta") || "",
      sinopsis_larga: b.get("sinopsis_larga") || "",
      colabF: b.get("colabF") || false,
      colabE: b.get("colabE") || false,
      activo: b.get("activo") !== false,
      guardado: b.get("guardado") || 0,
      descartado: b.get("descartado") || 0,
      clicks: b.get("clicks") || 0,
    }));
  } catch (err) {
    console.error("Error cargando libros:", err.message);
    return [];
  }
}

async function updateLibro(libroId, updates) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No hay sesión" };
  try {
    const Book = Parse.Object.extend("Books");
    const q = new Parse.Query(Book);
    q.equalTo("objectId", libroId);
    const book = await q.first();
    if (!book) return { ok: false, error: "Libro no encontrado" };
    if (book.get("escritorId") !== user.id)
      return { ok: false, error: "No autorizado" };
    Object.keys(updates).forEach((key) => book.set(key, updates[key]));
    await book.save();
    await _actualizarGenerosPrincipales(user.id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* =====================================================
RESEÑAS
===================================================== */
async function addResenaLibro(libroId, resenaData) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "Debes iniciar sesión para reseñar" };
  try {
    let afiliadoUrl = "";
    try {
      const Book = Parse.Object.extend("Books");
      const bq = new Parse.Query(Book);
      bq.equalTo("libroId", libroId);
      const libro = await bq.first();
      if (libro) afiliadoUrl = libro.get("afiliado_url") || "";
    } catch (e) {
      /* ignorar */
    }

    const Resena = Parse.Object.extend("Resenas");
    const resena = new Resena();
    resena.set("usuario", user);
    resena.set("usuarioId", user.id);
    resena.set("libroId", libroId);
    resena.set("afiliadoUrl", afiliadoUrl);
    resena.set("estrellas", resenaData.estrellas);
    resena.set("texto", resenaData.texto);
    resena.set("mood", resenaData.mood || "");
    resena.set("etiqueta", resenaData.etiqueta || "");
    resena.set(
      "displayName",
      resenaData.displayName || user.get("displayName") || user.get("username"),
    );
    resena.set("fecha", new Date());
    resena.set("utiles", 0);
    resena.set("noUtiles", 0);
    resena.set("votos", {});
    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(true);
    acl.setWriteAccess(user, true);
    resena.setACL(acl);
    await resena.save();
    user.increment("resenas", 1);
    await user.save();
    await updateBookRating(libroId);
    return { ok: true, id: resena.id };
  } catch (err) {
    console.error("Error añadiendo reseña:", err.message);
    return { ok: false, error: err.message };
  }
}

async function updateResena(resenaId, updates) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No autorizado" };
  try {
    const Resena = Parse.Object.extend("Resenas");
    const q = new Parse.Query(Resena);
    q.equalTo("objectId", resenaId);
    const resena = await q.first();
    if (!resena || resena.get("usuarioId") !== user.id)
      return { ok: false, error: "No puedes editar esta reseña" };
    Object.keys(updates).forEach((key) => resena.set(key, updates[key]));
    await resena.save();
    await updateBookRating(resena.get("libroId"));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function getResenasPorLibro(libroId) {
  try {
    const Resena = Parse.Object.extend("Resenas");
    const q = new Parse.Query(Resena);
    q.equalTo("libroId", libroId);
    q.descending("fecha");
    q.limit(200);
    q.include("usuario");
    const results = await q.find();
    return results.map((r) => ({
      id: r.id,
      usuario: r.get("usuario"),
      usuarioId: r.get("usuarioId"),
      displayName: r.get("displayName"),
      estrellas: r.get("estrellas"),
      texto: r.get("texto"),
      mood: r.get("mood"),
      etiqueta: r.get("etiqueta"),
      afiliadoUrl: r.get("afiliadoUrl") || "",
      fecha: r.get("createdAt") || r.get("fecha"),
      utiles: r.get("utiles") || 0,
      noUtiles: r.get("noUtiles") || 0,
      votos: r.get("votos") || {},
    }));
  } catch (err) {
    console.error("Error cargando reseñas:", err.message);
    return [];
  }
}

async function getResenas() {
  const user = usuarioActual();
  if (!user) return [];
  try {
    const Resena = Parse.Object.extend("Resenas");
    const q = new Parse.Query(Resena);
    q.equalTo("usuario", user);
    q.descending("createdAt");
    q.limit(200);
    const results = await q.find();
    return results.map((r) => ({
      id: r.id,
      libroId: r.get("libroId"),
      estrellas: r.get("estrellas"),
      texto: r.get("texto"),
      mood: r.get("mood"),
      etiqueta: r.get("etiqueta"),
      fecha: r.get("createdAt"),
    }));
  } catch (err) {
    console.error("Error cargando reseñas:", err.message);
    return [];
  }
}

async function getUltimasResenas(limite = 30) {
  try {
    const Resena = Parse.Object.extend("Resenas");
    const q = new Parse.Query(Resena);
    q.descending("createdAt");
    q.limit(limite);
    const results = await q.find();
    return results.map((r) => ({
      id: r.id,
      libroId: r.get("libroId"),
      afiliadoUrl: r.get("afiliadoUrl") || "",
      estrellas: r.get("estrellas"),
      texto: r.get("texto"),
      mood: r.get("mood"),
      etiqueta: r.get("etiqueta"),
      fecha: r.get("createdAt") || r.get("fecha"),
      utiles: r.get("utiles") || 0,
      usuarioId: r.get("usuarioId"),
    }));
  } catch (err) {
    console.error("Error cargando últimas reseñas:", err.message);
    return [];
  }
}

async function contarResenasUsuario(userId) {
  try {
    const Resena = Parse.Object.extend("Resenas");
    const q = new Parse.Query(Resena);
    q.equalTo("usuarioId", userId);
    return await q.count();
  } catch (err) {
    return 0;
  }
}

async function deleteResena(resenaId) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No autorizado" };
  try {
    const Resena = Parse.Object.extend("Resenas");
    const q = new Parse.Query(Resena);
    q.equalTo("objectId", resenaId);
    const resena = await q.first();
    if (!resena) return { ok: false, error: "Reseña no encontrada" };
    if (resena.get("usuarioId") !== user.id)
      return { ok: false, error: "No puedes eliminar esta reseña" };
    const libroId = resena.get("libroId");
    await resena.destroy();
    await updateBookRating(libroId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function voteResena(resenaId, vote, userId) {
  try {
    const Resena = Parse.Object.extend("Resenas");
    const q = new Parse.Query(Resena);
    q.equalTo("objectId", resenaId);
    const resena = await q.first();
    if (!resena) return { ok: false, error: "Reseña no encontrada" };
    const votos = resena.get("votos") || {};
    if (votos[userId] === vote) {
      if (vote === "up") resena.increment("utiles", -1);
      else resena.increment("noUtiles", -1);
      delete votos[userId];
    } else {
      if (votos[userId] === "up") resena.increment("utiles", -1);
      if (votos[userId] === "down") resena.increment("noUtiles", -1);
      if (vote === "up") resena.increment("utiles", 1);
      else resena.increment("noUtiles", 1);
      votos[userId] = vote;
    }
    resena.set("votos", votos);
    await resena.save();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function updateBookRating(libroId) {
  try {
    const Resena = Parse.Object.extend("Resenas");
    const Book = Parse.Object.extend("Books");
    const q = new Parse.Query(Resena);
    q.equalTo("libroId", libroId);
    const reviews = await q.find();
    if (!reviews.length) return;
    const avg =
      reviews.reduce((sum, r) => sum + r.get("estrellas"), 0) / reviews.length;
    const rounded = Math.round(avg * 10) / 10;
    const bookQ = new Parse.Query(Book);
    bookQ.equalTo("libroId", libroId);
    const book = await bookQ.first();
    if (book) {
      book.set("valoracion", rounded);
      await book.save();
    }
  } catch (err) {
    console.error("Error actualizando rating:", err.message);
  }
}

/* =====================================================
COLABORACIONES
===================================================== */
async function addColaboracion(data) {
  const user = usuarioActual(); // Quien crea la collab (ej. Autor)
  if (!user) return { ok: false, error: "No hay sesión" };
  try {
    const Colaboracion = Parse.Object.extend("Colaboraciones");
    const collab = new Colaboracion();
    // CORRECCIÓN: Usar los IDs pasados en data, no el user actual
    collab.set("autorId", data.autorId || user.id);
    collab.set("bookstagramerId", data.bookstagramerId);
    // Guardar referencia Pointer también para compatibilidad
    if (data.bookstagramerId) {
      const BsUser = new Parse.User();
      BsUser.id = data.bookstagramerId;
      collab.set("bookstagramer", BsUser);
    }

    collab.set("libroId", data.libroId);
    collab.set("tarifa", data.tarifa);
    collab.set("estado", "pendiente");

    // CORRECCIÓN ACL: El bookstagramer debe poder leer esto
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setWriteAccess(user, true); // Autor escribe
    if (data.bookstagramerId) {
      acl.setReadAccess(data.bookstagramerId, true); // BS lee
      acl.setWriteAccess(data.bookstagramerId, true); // BS escribe (para aceptar)
    }
    collab.setACL(acl);

    await collab.save();
    return { ok: true, id: collab.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function getColaboraciones(bookstagramerId) {
  try {
    const Colaboracion = Parse.Object.extend("Colaboraciones");
    let q = new Parse.Query(Colaboracion);
    q.equalTo("bookstagramerId", bookstagramerId);
    q.descending("createdAt");
    q.limit(200);
    let results = await q.find();

    // CORRECCIÓN: Fallback si no encuentra por ID, buscar por Pointer
    if (!results.length) {
      q = new Parse.Query(Colaboracion);
      const userPointer = {
        __type: "Pointer",
        className: "_User",
        objectId: bookstagramerId,
      };
      q.equalTo("bookstagramer", userPointer);
      q.descending("createdAt");
      q.limit(200);
      results = await q.find();
    }

    return results.map((c) => ({
      id: c.id,
      autor: c.get("autor") || c.get("nombreAutor"),
      libro: c.get("libro") || c.get("nombreLibro"),
      tarifa: c.get("tarifa"),
      estado: c.get("estado"),
      fecha: c.get("createdAt"),
    }));
  } catch (err) {
    console.error("Error cargando colaboraciones:", err.message);
    return [];
  }
}

async function contarColaboracionesUsuario(userId) {
  try {
    const Colaboracion = Parse.Object.extend("Colaboraciones");
    const q = new Parse.Query(Colaboracion);
    q.equalTo("bookstagramerId", userId);
    return await q.count();
  } catch (err) {
    return 0;
  }
}

async function getAutoresParaMatch(genero = "") {
  try {
    const Profile = Parse.Object.extend("PublicProfiles");
    const Book = Parse.Object.extend("Books");
    const qProfile = new Parse.Query(Profile);
    qProfile.equalTo("rol", "escritor");
    const perfiles = await qProfile.find();
    const autores = [];
    for (const perfil of perfiles) {
      const escritorId = perfil.get("userId");
      const qBook = new Parse.Query(Book);
      qBook.equalTo("escritorId", escritorId);
      qBook.equalTo("activo", true);
      if (genero) qBook.containedIn("genero", [genero]);
      const libros = await qBook.find();
      if (libros.length > 0) {
        const generoCount = {};
        libros.forEach((libro) => {
          (libro.get("genero") || []).forEach((g) => {
            generoCount[g] = (generoCount[g] || 0) + 1;
          });
        });
        const topGenero =
          Object.entries(generoCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "Varios";
        autores.push({
          id: escritorId,
          nombre: perfil.get("nombre") || perfil.get("displayName"),
          instagram: perfil.get("instagram") || "",
          generoPrincipal: topGenero,
          totalLibros: libros.length,
          libros: libros.map((b) => ({
            id: b.get("libroId"),
            titulo: b.get("titulo"),
            genero: b.get("genero"),
          })),
        });
      }
    }
    return autores;
  } catch (err) {
    console.error("Error buscando autores:", err.message);
    return [];
  }
}

async function getBookstagramersParaMatch(genero = "") {
  try {
    const Profile = Parse.Object.extend("PublicProfiles");
    const q = new Parse.Query(Profile);
    q.equalTo("rol", "bookstagramer");
    if (genero) q.equalTo("generoFavorito", genero);
    const perfiles = await q.find();
    return perfiles.map((p) => ({
      id: p.get("userId"),
      nombre: p.get("nombre") || p.get("displayName"),
      instagram: p.get("instagram") || "",
      seguidoresAdEA:
        typeof p.get("seguidoresAdEA") === "number"
          ? p.get("seguidoresAdEA")
          : 0,
      generosResenados: p.get("generoFavorito")
        ? [p.get("generoFavorito")]
        : ["Romance", "Thriller"],
      tarifa: p.get("tarifa") || 0,
      condiciones: p.get("condiciones") || "",
    }));
  } catch (err) {
    console.error("Error buscando bookstagramers:", err.message);
    return [];
  }
}

/* =====================================================
FAVORITOS / LEIDOS / DESCARTADOS — SIN LOCALSTORAGE
===================================================== */
async function addFavorito(libroId, libroData) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "Debes iniciar sesión" };
  try {
    const Favorito = Parse.Object.extend("Favoritos");
    const q = new Parse.Query(Favorito);
    q.equalTo("usuario", user);
    q.equalTo("libroId", libroId);
    const existe = await q.first();
    if (existe) return { ok: true, duplicado: true };

    const fav = new Favorito();
    fav.set("usuario", user);
    fav.set("libroId", libroId);
    fav.set("titulo", libroData.titulo || "");
    fav.set("autor", libroData.autor || "");
    fav.set("imagen", libroData.imagen || "");
    fav.set("sinopsis", libroData.sinopsis_corta || libroData.sinopsis || "");
    fav.set("paginas", libroData.paginas || 0);
    fav.set("precio", libroData.precio || 0);
    fav.set("afiliado_url", libroData.afiliado_url || "");
    fav.set("etiquetas", libroData.etiquetas || []);
    fav.set("mood", libroData.mood || []);

    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(false);
    fav.setACL(acl);

    await fav.save();

    // ✅ CORRECCIÓN: Actualizar contadores
    try {
      const Book = Parse.Object.extend("Books");
      const bookQ = new Parse.Query(Book);
      bookQ.equalTo("libroId", libroId);
      const book = await bookQ.first();
      if (book) {
        book.increment("guardado", 1);
        await book.save(null, { useMasterKey: false });
      }
    } catch (e) {
      console.warn("No se pudo actualizar guardado en libro:", e.message);
    }

    try {
      user.increment("guardado", 1);
      await user.save(null, { useMasterKey: false });
    } catch (e) {
      console.warn("No se pudo actualizar guardado en usuario:", e.message);
    }

    return { ok: true };
  } catch (err) {
    console.error("Error guardando favorito:", err.message);
    return { ok: false, error: err.message };
  }
}

async function getFavoritos() {
  const user = usuarioActual();
  if (!user) return [];
  try {
    const Favorito = Parse.Object.extend("Favoritos");
    const q = new Parse.Query(Favorito);
    q.equalTo("usuario", user);
    q.descending("createdAt");
    q.limit(200);
    const results = await q.find();
    return results.map((f) => ({
      parseId: f.id,
      libroId: f.get("libroId"),
      sinopsis: f.get("sinopsis"),
      paginas: f.get("paginas"),
      precio: f.get("precio"),
      afiliado_url: f.get("afiliado_url"),
      etiquetas: f.get("etiquetas") || [],
      mood: f.get("mood") || [],
      savedAt: f.get("createdAt"),
      titulo: f.get("titulo"),
      autor: f.get("autor"),
      imagen: f.get("imagen"),
    }));
  } catch (err) {
    console.error("Error cargando favoritos:", err.message);
    return [];
  }
}

async function removeFavorito(libroId) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No hay sesión" };
  try {
    const Favorito = Parse.Object.extend("Favoritos");
    const q = new Parse.Query(Favorito);
    q.equalTo("usuario", user);
    q.equalTo("libroId", libroId);
    const obj = await q.first();
    if (obj) await obj.destroy();
    return { ok: true };
  } catch (err) {
    console.error("Error eliminando favorito:", err.message);
    return { ok: false, error: err.message };
  }
}

async function addLeido(libroId) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "Debes iniciar sesión" };
  try {
    const Leido = Parse.Object.extend("Leidos");
    const q = new Parse.Query(Leido);
    q.equalTo("usuario", user);
    q.equalTo("libroId", libroId);
    const existe = await q.first();
    if (existe) return { ok: true, duplicado: true };

    const leido = new Leido();
    leido.set("usuario", user);
    leido.set("libroId", libroId);
    leido.set("fecha", new Date());

    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(false);
    acl.setWriteAccess(user, true);
    leido.setACL(acl);

    await leido.save();

    // ✅ CORRECCIÓN: Actualizar contador de usuario con manejo de errores
    try {
      user.increment("leidos", 1);
      await user.save(null, { useMasterKey: false });
    } catch (e) {
      console.warn("No se pudo actualizar leidos en usuario:", e.message);
    }

    return { ok: true };
  } catch (err) {
    console.error("Error añadiendo leído:", err.message);
    return { ok: false, error: err.message };
  }
}

async function getLeidos() {
  const user = usuarioActual();
  if (!user) return [];
  try {
    const Leido = Parse.Object.extend("Leidos");
    const q = new Parse.Query(Leido);
    q.equalTo("usuario", user);
    q.descending("createdAt");
    q.limit(200);
    const results = await q.find();
    return results.map((l) => ({
      id: l.id,
      libroId: l.get("libroId"),
      fecha: l.get("createdAt") || l.get("fecha"),
    }));
  } catch (err) {
    console.error("Error cargando leídos:", err.message);
    return [];
  }
}

async function descartarLibro(libroId) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No hay sesión" };
  try {
    const Descartado = Parse.Object.extend("Descartados");
    const q = new Parse.Query(Descartado);
    q.equalTo("usuario", user);
    q.equalTo("libroId", libroId);
    let obj = await q.first();

    if (!obj) {
      obj = new Descartado();
      obj.set("usuario", user);
      obj.set("libroId", libroId);

      // ✅ CORRECCIÓN: Añadir campo expiraEn (36 horas desde ahora)
      const ahora = new Date();
      const expira = new Date(ahora.getTime() + 36 * 60 * 60 * 1000);
      obj.set("expiraEn", expira);

      const acl = new Parse.ACL(user);
      acl.setPublicReadAccess(false);
      obj.setACL(acl);
    }

    await obj.save();

    // ✅ CORRECCIÓN: Actualizar contadores con mejor manejo de errores
    try {
      const Book = Parse.Object.extend("Books");
      const bookQ = new Parse.Query(Book);
      bookQ.equalTo("libroId", libroId);
      const book = await bookQ.first();
      if (book) {
        book.increment("descartado", 1);
        await book.save(null, { useMasterKey: false });
      }
    } catch (e) {
      console.warn("No se pudo actualizar contador de libro:", e.message);
    }

    try {
      user.increment("descartado", 1);
      await user.save(null, { useMasterKey: false });
    } catch (e) {
      console.warn("No se pudo actualizar contador de usuario:", e.message);
    }

    return { ok: true };
  } catch (err) {
    console.error("Error descartando libro:", err.message);
    return { ok: false, error: err.message };
  }
}

async function getDescartados() {
  const user = usuarioActual();
  if (!user) return [];
  try {
    const Descartado = Parse.Object.extend("Descartados");
    const q = new Parse.Query(Descartado);
    q.equalTo("usuario", user);
    q.descending("createdAt");
    q.limit(500);
    const results = await q.find();
    return results.map((d) => d.get("libroId"));
  } catch (err) {
    console.error("Error cargando descartados:", err.message);
    return [];
  }
}

/* =====================================================
SUGERENCIAS DE LIBROS
===================================================== */
async function sugerirLibro(data) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "Debes iniciar sesión" };

  try {
    const Sugerencia = Parse.Object.extend("SugerenciasLibros");
    const sug = new Sugerencia();

    sug.set("usuario", user);
    sug.set("titulo", data.titulo?.trim());
    sug.set("autor", data.autor?.trim());
    sug.set("amazonUrl", data.amazonUrl?.trim() || "");
    sug.set("motivo", data.motivo?.trim() || "");
    sug.set("estado", "pendiente");

    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(false);
    acl.setWriteAccess(user, true);
    // Opcional: permitir que admin escriba
    // acl.setWriteAccess("ADMIN_USER_ID", true);

    sug.setACL(acl);
    await sug.save();

    return { ok: true, id: sug.id };
  } catch (err) {
    console.error("Error sugiriendo libro:", err.message);
    return { ok: false, error: err.message };
  }
}

// Opcional: Función para admin para aprobar sugerencias
async function aprobarSugerenciaLibro(sugerenciaId, libroData) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No autorizado" };

  try {
    // 1. Marcar sugerencia como aceptada
    const Sugerencia = Parse.Object.extend("SugerenciasLibros");
    const q = new Parse.Query(Sugerencia);
    const sug = await q.get(sugerenciaId);
    sug.set("estado", "aceptada");
    await sug.save();

    // 2. Crear el libro real si se pasan los datos
    if (libroData) {
      await addLibro({
        ...libroData,
        escritorId: user.id, // O el ID del autor real
        sugeridoPor: sugerenciaId, // Para tracking
      });
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* =====================================================
SOLICITUDES DE COLABORACIÓN
===================================================== */
async function solicitarColaboracion(data) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "Debes iniciar sesión" };

  try {
    const Solicitud = Parse.Object.extend("SolicitudesColaboracion");
    const sol = new Solicitud();

    sol.set("solicitante", user);
    sol.set("solicitanteId", user.id);
    sol.set("solicitanteRol", user.get("rol"));
    sol.set("destinatarioId", data.destinatarioId);

    const DestUser = new Parse.User();
    DestUser.id = data.destinatarioId;
    sol.set("destinatario", DestUser);

    sol.set("tipo", data.tipo); // "escritor_a_bookstagramer" | "bookstagramer_a_escritor"
    if (data.libroId) sol.set("libroId", data.libroId);
    if (data.modalidad) sol.set("modalidad", data.modalidad);
    if (data.tarifa !== undefined) sol.set("tarifa", data.tarifa); // Puede ser 0
    if (data.mensaje) sol.set("mensaje", data.mensaje);

    sol.set("estado", "pendiente");
    sol.set("fechaSolicitud", new Date());

    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setReadAccess(user, true);
    acl.setReadAccess(data.destinatarioId, true);
    acl.setWriteAccess(user, true);
    acl.setWriteAccess(data.destinatarioId, true);
    sol.setACL(acl);

    await sol.save();
    return { ok: true, id: sol.id };
  } catch (err) {
    console.error("Error creando solicitud:", err.message);
    return { ok: false, error: err.message };
  }
}

// Obtener solicitudes recibidas por un usuario
// Ejemplo de consulta Parse correcta
async function getSolicitudesRecibidas(userId) {
  const Solicitud = Parse.Object.extend("SolicitudesColaboracion");
  const q = new Parse.Query(Solicitud);

  // Filtrar por destinatario
  q.equalTo("destinatarioId", userId);
  q.descending("createdAt");

  // ✅ IMPORTANTE: Incluir el campo 'estado' en los resultados
  q.select([
    "estado",
    "tipo",
    "libroId",
    "solicitanteId",
    "tarifa",
    "modalidad",
    "mensaje",
    "fecha",
  ]);

  try {
    const results = await q.find();
    return results.map((r) => ({
      id: r.id,
      estado: r.get("estado"), // ← Este campo DEBE existir
      tipo: r.get("tipo"),
      libroId: r.get("libroId"),
      solicitanteId: r.get("solicitanteId"),
      destinatarioId: r.get("destinatarioId"),
      tarifa: r.get("tarifa"),
      modalidad: r.get("modalidad"),
      mensaje: r.get("mensaje"),
      fecha: r.get("createdAt"),
    }));
  } catch (error) {
    console.error("Error en getSolicitudesRecibidas:", error);
    return [];
  }
}

// Obtener solicitudes enviadas por un usuario
async function getSolicitudesEnviadas(userId) {
  try {
    const Solicitud = Parse.Object.extend("SolicitudesColaboracion");
    const q = new Parse.Query(Solicitud);
    q.equalTo("solicitanteId", userId);
    q.descending("fechaSolicitud");
    q.limit(50);

    const results = await q.find();
    return results.map((s) => ({
      id: s.id,
      tipo: s.get("tipo"),
      destinatarioId: s.get("destinatarioId"),
      libroId: s.get("libroId"),
      estado: s.get("estado"),
      tarifa: s.get("tarifa"),
      fecha: s.get("fechaSolicitud"),
    }));
  } catch (err) {
    console.error("Error cargando solicitudes enviadas:", err.message);
    return [];
  }
}

// Responder a una solicitud (aceptar/rechazar)
async function responderSolicitud(solicitudId, respuesta, datosExtra = {}) {
  const user = usuarioActual();
  if (!user) return { ok: false, error: "No autorizado" };

  try {
    const Solicitud = Parse.Object.extend("SolicitudesColaboracion");
    const q = new Parse.Query(Solicitud);
    const sol = await q.get(solicitudId);

    // Verificar que el usuario es el destinatario
    if (sol.get("destinatarioId") !== user.id) {
      return { ok: false, error: "No puedes responder esta solicitud" };
    }

    sol.set("estado", respuesta);
    sol.set("fechaRespuesta", new Date());

    // Si se acepta una solicitud de escritor→bookstagramer, crear la colaboración con pago
    if (
      respuesta === "aceptada" &&
      sol.get("tipo") === "escritor_a_bookstagramer"
    ) {
      const tarifa = sol.get("tarifa") || 0;
      const libroId = sol.get("libroId");
      const bookstagramerId = user.id; // El destinatario es el BS
      const autorId = sol.get("solicitanteId");

      // Crear la colaboración real
      await addColaboracion({
        autorId,
        bookstagramerId,
        libroId,
        tarifa,
        origen: "solicitud_aceptada",
        solicitudId: solicitudId,
      });
    }

    // Si se acepta bookstagramer→escritor, crear colaboración sin pago
    if (
      respuesta === "aceptada" &&
      sol.get("tipo") === "bookstagramer_a_escritor"
    ) {
      const libroId = sol.get("libroId");
      const bookstagramerId = user.id; // El destinatario es el autor, el solicitante es BS
      const autorId = sol.get("solicitanteId");

      await addColaboracion({
        autorId,
        bookstagramerId,
        libroId,
        tarifa: 0, // Sin coste
        modalidad: sol.get("modalidad"),
        origen: "solicitud_aceptada",
        solicitudId: solicitudId,
      });
    }

    await sol.save();
    return { ok: true };
  } catch (err) {
    console.error("Error respondiendo solicitud:", err.message);
    return { ok: false, error: err.message };
  }
}

// Obtener info básica de usuario para mostrar en solicitudes
async function getUserInfo(userId) {
  try {
    const User = Parse.Object.extend("_User");
    const user = await new Parse.Query(User).get(userId, {
      useMasterKey: false,
    });
    return {
      id: user.id,
      nombre: user.get("nombre") || user.get("displayName") || "Usuario",
      rol: user.get("rol"),
      instagram: user.get("instagram"),
    };
  } catch {
    return null;
  }
}
