/* ====== preferencias de la caja (global) ====== */
window.preferenciasCaja = { like: [], dislike: [] };
const estadoCajas = {};   /* boxId -> { variedad:null, like:[], dislike:[], ok:false } */
let cajaActual = null;
window.carrito = window.carrito || [];

/* ====== Contenido estático de las cajas ====== */
const BOX_CONTENT = {
  1: `🥥 **Caribbean fresh pack** (3 días)\n\n📦 Contenido referencia:\n1 ajo, 2 cebollas, 1 ají, 2 papas/batatas, 1 brócoli chico, 2 tomates, 1 lechuga/repollo, 1 plátano, 2 chinolas, 1 mango, 1 piña, 3 limones, apio + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
  2: `🍍 **Weekssential** (1 semana)\n\n📦 Contenido referencia:\n1 ajo, 4 cebollas, 1 ají, 6 papas/batatas, 1 calabaza, 1 brócoli grande, 4 tomates, 1 lechuga, 1 repollo, 2 plátanos, 5 guineos verdes, 4 guineos maduros, fresas, 2 mangos, 1 piña, 1 lechosa, apio, 2 berenjenas + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
  3: `🥑 **All greenxclusive** (2 semanas)\n\n📦 Contenido referencia:\n2 ajos, 6 cebollas, 2 ajíes, 8 papas/batatas, 1 brócoli grande, 1 coliflor mediana, 8 tomates, 2 lechugas, 1 repollo entero, apio, 2 plátanos grandes, 10 guineos verdes, 4 mangos, 2 piñas, 10 limones, 5 zanahorias, 4 pepinos, 4 berenjenas + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`
};

/* ====== Funcionalidad del modal de cajas ====== */
function mostrarContenidoCaja(boxId) {
  const modal = document.getElementById('modal-box-content');
  const modalText = document.getElementById('modal-box-text');
  if (modal && modalText) {
    modalText.textContent = BOX_CONTENT[boxId];
    modal.showModal();
  }
}

// Extrae sólo el primer número del texto de precio
function parsePrecio(txt){
  const m = (txt||'').match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

// Función para reproducir el sonido de gota
function playWaterDrop() {
  const audio = new Audio('water-drop.mp3');
  audio.volume = 0.3; // Ajustar volumen al 30%
  audio.play().catch(e => console.log('Error al reproducir sonido:', e));
}

// Función para manejar el modal de imágenes
function setupImagenModal() {
  const modal = document.getElementById('modal-imagen');
  const imagenModal = document.getElementById('imagen-modal');
  
  // Cerrar modal al hacer clic
  modal.addEventListener('click', () => {
    modal.classList.remove('activo');
  });

  // Agregar evento click a todas las imágenes de productos
  document.querySelectorAll('.paso-card img').forEach(img => {
    // Excluir imágenes del carrusel y de la sección de configuración
    if (!img.closest('.cinta-carrusel') && !img.closest('#config-productos')) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        imagenModal.src = img.src;
        modal.classList.add('activo');
      });
    }
  });
}

/* ----------  CARRITO  ---------- */
function renderCarrito() {
  const raw = localStorage.getItem('carrito');
  let carrito = JSON.parse(raw || '[]');
  if (!Array.isArray(carrito)) carrito = [];
  const cont = document.getElementById('carrito-contenido');

  if (!cont) return;

  if (carrito.length === 0) {
    cont.innerHTML =
      '<p class="text-center text-gray-500">El carrito está vacío</p>';
    document.getElementById('carrito-cantidad-header').textContent = '0';
    return;
  }

  let html = '';
  let total = 0;
  carrito.forEach((item, index) => {
    const subtotal = item.precio * (item.cantidad || 1);
    total += subtotal;
    html += `
      <div class="p-2 border-b border-green-200 relative group">
        <button onclick="eliminarDelCarrito(${index})" class="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
          <i class="fas fa-trash-alt text-sm"></i>
        </button>
        <div class="flex justify-between items-start pr-8">
          <div>
            <p class="font-semibold">${item.nombre}</p>
            ${item.variedad ? `<p class="text-xs text-gray-600">Variedad: ${item.variedad}</p>` : ''}
            ${item.preferencias ? `
              <div class="ml-2 text-sm bg-green-50 rounded-lg p-2">
                <div><b>👍</b> ${item.preferencias.like.join(', ') || '-'}</div>
                <div><b>👎</b> ${item.preferencias.dislike.join(', ') || '-'}</div>
              </div>` : ''}
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Cantidad: ${item.cantidad || 1}</p>
            <p class="text-sm font-semibold text-green-800">DOP ${subtotal.toFixed(2)}</p>
          </div>
        </div>
      </div>`;
  });

  // Agregar el total y el botón de continuar
  html += `
    <div class="mt-4 p-4 bg-green-50 rounded-lg">
      <div class="flex justify-between items-center mb-4">
        <span class="text-lg font-bold text-green-800">Total:</span>
        <span class="text-xl font-bold text-green-800">DOP ${total.toFixed(2)}</span>
      </div>
      <button id="btn-continuar-pedido" 
              class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
        <span class="lang-es">Continuar con el pedido</span>
        <span class="lang-en" style="display:none;">Continue with order</span>
      </button>
    </div>`;

  cont.innerHTML = html;
  document.getElementById('carrito-cantidad-header').textContent =
    carrito.reduce((total, item) => total + (item.cantidad || 1), 0);

  // Agregar el listener para el botón de continuar
  document.getElementById('btn-continuar-pedido')?.addEventListener('click', mostrarFormularioPedido);
}

// Función para eliminar un producto del carrito
function eliminarDelCarrito(index) {
  playWaterDrop();
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito)) return;
  
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
  mostrarNotificacion('Producto eliminado del carrito');
}

/* ----------  CONFIGURAR CAJA ---------- */
function abrirConfig(btn) {
  playWaterDrop();
  const boxId = btn.dataset.box;
  cajaActual = boxId;
  if (!estadoCajas[boxId]) estadoCajas[boxId] = { variedad: null, like: [], dislike: [], ok: false };

  preferenciasCaja.like = [...estadoCajas[boxId].like];
  preferenciasCaja.dislike = [...estadoCajas[boxId].dislike];

  clonarProductosSiHaceFalta();
  document.getElementById('configurar-caja').classList.remove('hidden');
  requestAnimationFrame(() =>
    document.getElementById('configurar-caja').scrollIntoView({ behavior: 'smooth' })
  );
  refrescarPreferenciasUI();

  const btnSave = document.getElementById('btn-guardar-preferencias');
  if (btnSave) { btnSave.classList.remove('hidden'); btnSave.disabled = true; }

  /* Borde de selección previo */
  const categorias = ['config-productos-frutas', 'config-productos-vegetales', 'config-productos-hierbas'];
  categorias.forEach(categoria => {
    document.querySelectorAll(`#${categoria} .producto-hover`).forEach(card => {
      const n = card.dataset.nombre;
      card.classList.remove('ring-4', 'ring-green-400', 'ring-red-400');
      if (estadoCajas[cajaActual].like.includes(n)) card.classList.add('ring-4', 'ring-green-400');
      else if (estadoCajas[cajaActual].dislike.includes(n)) card.classList.add('ring-4', 'ring-red-400');
    });
  });
}

function clonarProductosSiHaceFalta() {
  const gridFrutas = document.getElementById('config-productos-frutas');
  const gridVegetales = document.getElementById('config-productos-vegetales');
  const gridHierbas = document.getElementById('config-productos-hierbas');
  
  if (gridFrutas.dataset.ready) return;

  // Definir categorías
  const frutas = ['Banana', 'Piña', 'Fresas', 'Lechosa', 'Cerezas', 'Manzanas', 'Sandía', 'Melón', 'Melón Francés', 'Pitahaya', 'Naranjas', 'Carambola'];
  const hierbas = ['Cilantro', 'Genjibre', 'Orégano', 'Perejil', 'Romero', 'Cebollín'];

  document.querySelectorAll('#alacarta .producto-hover').forEach(card => {
    const clon = card.cloneNode(true);
    const nombre = clon.querySelector('.font-bold').textContent.trim();
    clon.dataset.nombre = nombre;
    
    // Remover precio y botón de agregar
    clon.querySelector('.text-green-800').remove();
    clon.querySelector('.agregar-carrito').remove();

    // Agregar botones de like/dislike
    const like = Object.assign(document.createElement('button'), { 
      textContent: '👍', 
      className: 'like-btn text-2xl px-3 py-1 bg-green-600 text-white rounded-full shadow-lg hover:scale-110 transition' 
    });
    const dislike = Object.assign(document.createElement('button'), { 
      textContent: '👎', 
      className: 'dislike-btn text-2xl px-3 py-1 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition' 
    });

    like.onclick = () => marcar(clon, true);
    dislike.onclick = () => marcar(clon, false);

    const contBtn = Object.assign(document.createElement('div'), { className: 'flex gap-2 justify-center mt-2' });
    contBtn.append(like, dislike);
    clon.appendChild(contBtn);

    // Distribuir en la categoría correspondiente
    if (frutas.includes(nombre)) {
      gridFrutas.appendChild(clon);
    } else if (hierbas.includes(nombre)) {
      gridHierbas.appendChild(clon);
    } else {
      gridVegetales.appendChild(clon);
    }
  });

  gridFrutas.dataset.ready = '1';
  gridVegetales.dataset.ready = '1';
  gridHierbas.dataset.ready = '1';
}

function marcar(card, esLike) {
  playWaterDrop();
  const n = card.dataset.nombre;
  preferenciasCaja.like    = preferenciasCaja.like.filter(x => x !== n);
  preferenciasCaja.dislike = preferenciasCaja.dislike.filter(x => x !== n);
  (esLike ? preferenciasCaja.like : preferenciasCaja.dislike).push(n);

  card.classList.remove('seleccion-like', 'seleccion-dislike');
  card.classList.add(esLike ? 'seleccion-like' : 'seleccion-dislike');

  if (cajaActual) {
    estadoCajas[cajaActual].like    = [...preferenciasCaja.like];
    estadoCajas[cajaActual].dislike = [...preferenciasCaja.dislike];
  }
  refrescarPreferenciasUI();
  document.getElementById('btn-guardar-preferencias').disabled = false;
}

function refrescarPreferenciasUI() {
  const ul = document.getElementById('lista-preferencias');
  ul.innerHTML = '';
  preferenciasCaja.like.forEach   (n => ul.innerHTML += `<li>👍 ${n}</li>`);
  preferenciasCaja.dislike.forEach(n => ul.innerHTML += `<li>👎 ${n}</li>`);
}

/* ----------  AGREGAR AL CARRITO ---------- */
function agregarAlCarritoDesdeTarjeta(btn) {
  playWaterDrop();
  if (btn.disabled) return;
  const card = btn.closest('.caja-hover, .paso-card');
  if (!card) return;

  const tipo = btn.dataset.tipo;
  let item;

  if (tipo === 'caja') {
    const boxId = card.dataset.box;
    const estado = estadoCajas[boxId];
    if (!estado || !estado.ok) { alert('Falta configurar la caja'); return; }

    const nombre = card.querySelector('.text-3xl, .text-4xl')?.textContent.trim() || 'Caja';
    const precio = parsePrecio(card.querySelector('.inline-block.bg-white')?.textContent);

    item = { tipo: 'caja', nombre, precio: isNaN(precio) ? 0 : precio,
             variedad: estado.variedad,
             preferencias: { like: [...estado.like], dislike: [...estado.dislike] },
             cantidad: 1 };
  } else {
    const nombre = card.querySelector('.font-bold, span')?.textContent.trim() || 'Producto';
    const precio = parsePrecio(card.querySelector('.text-green-800')?.textContent);
    item = { tipo: 'producto', nombre, precio: isNaN(precio) ? 0 : precio, cantidad: 1 };
  }

  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito)) carrito = [];

  // Buscar si el item ya existe en el carrito
  const itemExistente = carrito.find(i => 
    i.tipo === item.tipo && 
    i.nombre === item.nombre && 
    JSON.stringify(i.variedad || {}) === JSON.stringify(item.variedad || {}) &&
    JSON.stringify(i.preferencias || {}) === JSON.stringify(item.preferencias || {})
  );

  if (itemExistente) {
    // Si ya existe, incrementa la cantidad
    itemExistente.cantidad = (itemExistente.cantidad || 1) + 1;
    mostrarNotificacion('Cantidad actualizada en el carrito');
  } else {
    // Si no existe, lo agrega al carrito con cantidad 1
    item.cantidad = 1;
    carrito.push(item);
    mostrarNotificacion('Producto agregado al carrito');
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
}

/* ----------  INICIALIZACIÓN ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('lang');
  if(savedLang) setLanguage(savedLang);
  document.getElementById('btn-guardar-preferencias')
          ?.addEventListener('click', guardarPreferencias);

  /* --- NUEVO: cierra el popup de resumen --- */
  document.getElementById('dlg-resumen-cerrar')
          ?.addEventListener('click', () => {
            playWaterDrop();
            /* 1) Cierra el pop-up */
            document.getElementById('dlg-resumen').close();

            /* 2) Oculta la sección de configuración */
            document.getElementById('configurar-caja')
                    .classList.add('hidden');

            /* 3) Sube con scroll a la zona de cajas */
            document.querySelector('#cajas')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });

  document.getElementById('carrito-header-btn')
          ?.addEventListener('click', () => { 
            playWaterDrop();
            renderCarrito(); 
            document.getElementById('dlg-carrito').showModal(); 
          });
          
  document.getElementById('dlg-carrito-cerrar')
          ?.addEventListener('click', () => {
            playWaterDrop();
            document.getElementById('dlg-carrito').close();
          });

  /* Delegación global para todos los botones "Agregar" */
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('.agregar-carrito');
    if (btn) agregarAlCarritoDesdeTarjeta(btn);
  });

  // Agregar el sonido a todos los botones de variedad
  document.querySelectorAll('.variedad-btn').forEach(btn => {
    btn.addEventListener('click', playWaterDrop);
  });

  // Agregar el sonido a los botones de like/dislike
  document.querySelectorAll('.like-btn, .dislike-btn').forEach(btn => {
    btn.addEventListener('click', playWaterDrop);
  });

  // Agregar el sonido al botón de guardar preferencias
  document.getElementById('btn-guardar-preferencias')?.addEventListener('click', playWaterDrop);

  // Agregar el sonido a los botones de idioma
  document.getElementById('btn-es')?.addEventListener('click', playWaterDrop);
  document.getElementById('btn-en')?.addEventListener('click', playWaterDrop);
  document.getElementById('btn-es')?.addEventListener('click', () => setLanguage('es'));
  document.getElementById('btn-en')?.addEventListener('click', () => setLanguage('en'));

  // Agregar el sonido al botón del menú
  document.getElementById('menu-toggle')?.addEventListener('click', playWaterDrop);
  document.getElementById('menu-toggle')?.addEventListener('click', toggleMobileMenu);

  // Agregar el sonido a los botones de configuración
  document.getElementById('btn-config-si')?.addEventListener('click', playWaterDrop);
  document.getElementById('btn-config-no')?.addEventListener('click', playWaterDrop);

  // Agregar el sonido a los botones de configuración de caja
  document.querySelectorAll('.config-caja-btn').forEach(btn => {
    btn.addEventListener('click', playWaterDrop);
  });

  // Configurar el modal de imágenes
  setupImagenModal();

  /* ========= Infografía de Cajas (dialog API) ========= */
  const btnInfografia = document.getElementById('btn-infografia-cajas');
  const dlgInfografia = document.getElementById('dlg-infografia-cajas');

  if (btnInfografia && dlgInfografia) {
    btnInfografia.addEventListener('click', () => {
      const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
      const imgInfografia = dlgInfografia.querySelector('.infografia-img');
      if (imgInfografia) {
        imgInfografia.src =
          lang === 'en'
            ? 'assets/images/banners/InfografiaCajasENG.jpg'
            : 'assets/images/banners/InfografiaCajasESP.jpg';
      }
      dlgInfografia.showModal();
    });

    // Cerrar al hacer clic fuera o con el botón OK
    dlgInfografia.addEventListener('click', (e) => {
      if (e.target === dlgInfografia) dlgInfografia.close();
    });
  }
  /* ========= Fin Infografía de Cajas ========= */

  /* Footer actions */
  document.getElementById('btn-back').onclick = () => history.back();
  document.getElementById('btn-cart').onclick = () => {
    playWaterDrop();
    renderCarrito();
    document.getElementById('dlg-carrito').showModal();
  };
  document.getElementById('btn-home').onclick = () =>
    document.getElementById('inicio').scrollIntoView({behavior:'smooth'});

  /* Reubicar botón Guardar cuando está visible */
  const guardar = document.getElementById('btn-guardar-preferencias');
  const ajustePos = () => {
    const visible = !document.getElementById('configurar-caja').classList.contains('hidden');
    guardar.style.bottom = visible ? '96px' : '32px'; // = zócalo 64px + margen
  };
  ['click','scroll'].forEach(ev=>document.addEventListener(ev,ajustePos));
  ajustePos();

  /* Evento de tecla Escape para cerrar el modal de cajas */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-box-content');
      if (modal && modal.open) {
        modal.close();
      }
    }
  });
});

/* ----------  SELECCIONAR VARIEDAD ---------- */
function seleccionarVariedad(btn) {
  playWaterDrop();
  const card  = btn.closest('.caja-hover');
  if (!card) return;
  const boxId = card.dataset.box;

  // crea estado si no existe
  if (!estadoCajas[boxId])
      estadoCajas[boxId] = { variedad:null, like:[], dislike:[], ok:false };

  // guarda la variedad elegida
  estadoCajas[boxId].variedad = btn.dataset.variedad;

  /* Actualiza el estilo de todos los botones de esa tarjeta */
  card.querySelectorAll('.variedad-btn').forEach(b => {
    b.classList.remove('selected', 'bg-green-600', 'text-white');
    b.classList.add   ('bg-green-100', 'text-green-800');
  });
  btn.classList.remove('bg-green-100', 'text-green-800');
  btn.classList.add   ('selected', 'bg-green-600', 'text-white');

  // habilita "Agregar" si ya se guardaron las preferencias
  actualizarBotonAgregar(boxId);
}

/* Habilita/Deshabilita el botón Agregar de cada caja */
function actualizarBotonAgregar(boxId) {
  const card = document.querySelector(`.caja-hover[data-box="${boxId}"]`);
  if (!card) return;
  const btn = card.querySelector('.agregar-carrito');
  const ok  = estadoCajas[boxId]?.variedad && estadoCajas[boxId].ok;
  if (btn) {
    btn.disabled = !ok;
    btn.classList.toggle('opacity-50', !ok);
    btn.classList.toggle('cursor-not-allowed', !ok);
  }
}

/* --- NUEVA versión robusta --- */
function guardarPreferencias() {
  playWaterDrop();
  if (!cajaActual || !estadoCajas[cajaActual]) {
    alert('Elegí la caja primero'); return;
  }

  // Copia la selección actual al estado de la caja
  estadoCajas[cajaActual].like    = [...preferenciasCaja.like];
  estadoCajas[cajaActual].dislike = [...preferenciasCaja.dislike];
  estadoCajas[cajaActual].ok      = true;

  // Resumen en el diálogo
  const div = document.getElementById('resumen-contenido');
  const likes    = estadoCajas[cajaActual].like   .map(n => `👍 ${n}`).join('<br>');
  const dislikes = estadoCajas[cajaActual].dislike.map(n => `👎 ${n}`).join('<br>');
  div.innerHTML = (likes || dislikes) ? `${likes}<br>${dislikes}` : '<i>Sin preferencias</i>';

  // Habilita el botón "Agregar" de esa caja
  actualizarBotonAgregar(cajaActual);

  // Oculta el botón de guardar preferencias
  const btnSave = document.getElementById('btn-guardar-preferencias');
  if (btnSave) {
    btnSave.style.display = 'none';
  }

  // Muestra el popup de confirmación
  document.getElementById('dlg-resumen').showModal();
}

/* ----------  NOTIFICACIONES ---------- */
function mostrarNotificacion(mensaje) {
  // Crear el elemento de notificación si no existe
  let notificacion = document.getElementById('notificacion');
  if (!notificacion) {
    notificacion = document.createElement('div');
    notificacion.id = 'notificacion';
    notificacion.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background-color: #4CAF50;
      color: white;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(notificacion);
  }

  // Mostrar el mensaje
  notificacion.textContent = mensaje;
  notificacion.style.opacity = '1';

  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.style.opacity = '0';
  }, 3000);
}

// Función para mostrar el formulario de pedido
function mostrarFormularioPedido() {
  const dialog = document.getElementById('dlg-carrito');
  dialog.innerHTML = `
    <div class="p-6">
      <h3 class="text-xl font-bold text-green-800 mb-6 text-center">
        <span class="lang-es">Completar pedido</span>
        <span class="lang-en" style="display:none;">Complete order</span>
      </h3>
      
      <form id="form-pedido" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="lang-es">Nombre</span>
            <span class="lang-en" style="display:none;">Name</span>
          </label>
          <input type="text" name="nombre" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="lang-es">WhatsApp</span>
            <span class="lang-en" style="display:none;">WhatsApp</span>
          </label>
          <input type="tel" name="whatsapp" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="lang-es">Día de entrega</span>
            <span class="lang-en" style="display:none;">Delivery day</span>
          </label>
          <select name="dia" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Seleccionar día</option>
            <option value="Lunes">Lunes (12:30-20:00) - Gratis</option>
            <option value="Martes">Martes (12:30-20:00) - DOP 100</option>
            <option value="Miércoles">Miércoles (12:30-20:00) - Gratis</option>
            <option value="Jueves">Jueves (12:30-20:00) - DOP 100</option>
            <option value="Viernes">Viernes (12:30-20:00) - Gratis</option>
            <option value="Sábado">Sábado (12:30-20:00) - DOP 100</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="lang-es">Dirección de entrega</span>
            <span class="lang-en" style="display:none;">Delivery address</span>
          </label>
          <textarea name="direccion" required rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="lang-es">Observaciones (opcional)</span>
            <span class="lang-en" style="display:none;">Notes (optional)</span>
          </label>
          <textarea name="observaciones" rows="2"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <span class="lang-es">Modo de pago</span>
            <span class="lang-en" style="display:none;">Payment method</span>
          </label>
          <select name="pago" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Seleccionar método</option>
            <option value="Cash">Cash</option>
            <option value="Transferencia">Transferencia</option>
            <option value="PayPal">PayPal (+10%)</option>
          </select>
        </div>

        <div class="flex justify-end gap-4 mt-6">
          <button type="button" onclick="document.getElementById('dlg-carrito').close()"
                  class="px-4 py-2 text-gray-600 hover:text-gray-800">
            <span class="lang-es">Cancelar</span>
            <span class="lang-en" style="display:none;">Cancel</span>
          </button>
          <button type="submit"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <span class="lang-es">Enviar pedido</span>
            <span class="lang-en" style="display:none;">Send order</span>
          </button>
        </div>
      </form>
    </div>
  `;

  // Agregar el listener para el envío del formulario
  document.getElementById('form-pedido')?.addEventListener('submit', enviarPedido);
}

// Función para enviar el pedido por WhatsApp
function enviarPedido(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  // Obtener el carrito actual
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito) || carrito.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  // Construir el mensaje usando el mismo formato que se muestra en el checkout
  let mensaje = `*Nuevo Pedido GreenDolio*\n\n`;
  mensaje += `*Cliente:* ${formData.get('nombre')}\n`;
  mensaje += `*WhatsApp:* ${formData.get('whatsapp')}\n`;
  mensaje += `*Día de entrega:* ${formData.get('dia')}\n`;
  mensaje += `*Dirección:* ${formData.get('direccion')}\n`;
  if (formData.get('observaciones')) {
    mensaje += `*Observaciones:* ${formData.get('observaciones')}\n`;
  }
  mensaje += `*Método de pago:* ${formData.get('pago')}\n\n`;
  
  mensaje += `*Productos:*\n`;
  carrito.forEach(item => {
    const subtotal = item.precio * (item.cantidad || 1);
    mensaje += `\n*${item.nombre}*\n`;
    mensaje += `Cantidad: ${item.cantidad || 1}\n`;
    mensaje += `Precio unitario: DOP ${item.precio.toFixed(2)}\n`;
    mensaje += `Subtotal: DOP ${subtotal.toFixed(2)}\n`;
    
    if (item.variedad) {
      mensaje += `Variedad: ${item.variedad}\n`;
    }
    
    if (item.preferencias) {
      if (item.preferencias.like.length > 0) {
        mensaje += `👍 Me gusta: ${item.preferencias.like.join(', ')}\n`;
      }
      if (item.preferencias.dislike.length > 0) {
        mensaje += `👎 No me gusta: ${item.preferencias.dislike.join(', ')}\n`;
      }
    }
  });

  // Calcular totales
  let subtotal = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
  let total = subtotal;
  
  mensaje += `\n*Resumen de costos:*\n`;
  mensaje += `Subtotal productos: DOP ${subtotal.toFixed(2)}\n`;
  
  // Agregar costo de delivery si aplica
  const dia = formData.get('dia');
  if (['Martes', 'Jueves', 'Sábado'].includes(dia)) {
    total += 100;
    mensaje += `Costo de delivery: DOP 100.00\n`;
  }
  
  // Agregar comisión PayPal si aplica
  if (formData.get('pago') === 'PayPal') {
    const comisionPayPal = total * 0.1;
    total += comisionPayPal;
    mensaje += `Comisión PayPal (10%): DOP ${comisionPayPal.toFixed(2)}\n`;
  }
  
  mensaje += `*Total final:* DOP ${total.toFixed(2)}`;

  // Crear y mostrar el diálogo de confirmación
  const dialog = document.createElement('dialog');
  dialog.className = 'p-6 rounded-lg shadow-xl max-w-lg w-full';
  dialog.innerHTML = `
    <div class="space-y-4">
      <h3 class="text-xl font-bold text-green-800 mb-4">
        <span class="lang-es">Confirmar pedido</span>
        <span class="lang-en" style="display:none;">Confirm order</span>
      </h3>
      
      <div class="bg-gray-50 p-4 rounded-lg">
        <pre class="whitespace-pre-wrap font-mono text-sm">${mensaje}</pre>
      </div>
      
      <div class="flex justify-end gap-4 mt-6">
        <button type="button" onclick="this.closest('dialog').close()"
                class="px-4 py-2 text-gray-600 hover:text-gray-800">
          <span class="lang-es">Cancelar</span>
          <span class="lang-en" style="display:none;">Cancel</span>
        </button>
        <button type="button" onclick="enviarPedidoWhatsApp(this.closest('dialog'))"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <span class="lang-es">Enviar por WhatsApp</span>
          <span class="lang-en" style="display:none;">Send via WhatsApp</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();
}

function enviarPedidoWhatsApp(dialog) {
  const mensaje = dialog.querySelector('pre').textContent;
  const mensajeCodificado = encodeURIComponent(mensaje);
  const numeroWhatsApp = '18493757338';
  
  // Abrir WhatsApp
  window.open(`https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`, '_blank');
  
  // Cerrar todos los diálogos
  dialog.close();
  document.getElementById('dlg-carrito').close();
  
  // Limpiar el carrito
  localStorage.removeItem('carrito');
  renderCarrito();
}


/* ----------  MULTI‑IDIOMA ---------- */
function setLanguage(lang){
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('.lang-es').forEach(el => el.style.display = (lang === 'es' ? '' : 'none'));
  document.querySelectorAll('.lang-en').forEach(el => el.style.display = (lang === 'en' ? '' : 'none'));
  // resaltado del selector
  document.getElementById('btn-es')?.classList.toggle('ring-4', lang === 'es');
  document.getElementById('btn-en')?.classList.toggle('ring-4', lang === 'en');
}

/* ----------  HAMBURGER MENU ---------- */
function toggleMobileMenu(){
  const menu = document.getElementById('mobile-menu');
  if(menu) menu.classList.toggle('hidden');
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(event) {
  const menu = document.getElementById('mobile-menu');
  const menuToggle = document.getElementById('menu-toggle');
  
  if (menu && !menu.classList.contains('hidden') && 
      !menu.contains(event.target) && 
      !menuToggle.contains(event.target)) {
    menu.classList.add('hidden');
  }
});