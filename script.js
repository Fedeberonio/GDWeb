/* ====== preferencias de la caja (global) ====== */
window.preferenciasCaja = { like: [], dislike: [] };
const estadoCajas = {};   /* boxId -> { variedad:null, like:[], dislike:[], ok:false } */
let cajaActual = null;
window.carrito = window.carrito || [];
// ====== Estado del flujo del carrito ====== //
window.estadoFlujoCarrito = "lista";

/* ----------  PLANTILLA ORIGINAL DEL DIÁLOGO  ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const dlgCarrito = document.getElementById('dlg-carrito');
  if (!dlgCarrito) return;
  const plantillaCarrito = dlgCarrito.innerHTML;

  /*  NUEVO  ➜  restaura + re-engancha el botón "X"  */
  window.resetCarritoDialog = () => {
    dlgCarrito.innerHTML = plantillaCarrito;             // 1°  clona HTML

    // 2°  vuelve a conectar el botón "X" recién clonado
    dlgCarrito.querySelector('#dlg-carrito-cerrar')
              ?.addEventListener('click', () => {
        dlgCarrito.close();
        window.estadoFlujoCarrito = 'lista';
        renderCarrito();
    });
  };
});

/* ====== Contenido estático de las cajas ====== */
const BOX_CONTENT = {
  1: {
    es: `🥥 **Caribbean fresh pack** (3 días)\n\n📦 Contenido referencia:\n1 ajo, 2 cebollas, 1 ají, 2 papas/batatas, 1 brócoli chico, 2 tomates, 1 lechuga/repollo, 1 plátano, 2 chinolas, 1 mango, 1 piña, 3 limones, apio + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
    en: `🥥 **Caribbean fresh pack** (3 days)\n\n📦 Reference content:\n1 garlic, 2 onions, 1 pepper, 2 potatoes/sweet potatoes, 1 small broccoli, 2 tomatoes, 1 lettuce/cabbage, 1 plantain, 2 passion fruits, 1 mango, 1 pineapple, 3 lemons, celery + surprises (parsley, cilantro, rosemary, oregano, cinnamon, etc.)`
  },
  2: {
    es: `🍍 **Weekssential** (1 semana)\n\n📦 Contenido referencia:\n1 ajo, 4 cebollas, 1 ají, 6 papas/batatas, 1 calabaza, 1 brócoli grande, 4 tomates, 1 lechuga, 1 repollo, 2 plátanos, 5 guineos verdes, 4 guineos maduros, fresas, 2 mangos, 1 piña, 1 lechosa, apio, 2 berenjenas + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
    en: `🍍 **Weekssential** (1 week)\n\n📦 Reference content:\n1 garlic, 4 onions, 1 pepper, 6 potatoes/sweet potatoes, 1 pumpkin, 1 large broccoli, 4 tomatoes, 1 lettuce, 1 cabbage, 2 plantains, 5 green bananas, 4 ripe bananas, strawberries, 2 mangos, 1 pineapple, 1 papaya, celery, 2 eggplants + surprises (parsley, cilantro, rosemary, oregano, cinnamon, etc.)`
  },
  3: {
    es: `🥑 **All greenxclusive** (2 semanas)\n\n📦 Contenido referencia:\n2 ajos, 6 cebollas, 2 ajíes, 8 papas/batatas, 1 brócoli grande, 1 coliflor mediana, 8 tomates, 2 lechugas, 1 repollo entero, apio, 2 plátanos grandes, 10 guineos verdes, 4 mangos, 2 piñas, 10 limones, 5 zanahorias, 4 pepinos, 4 berenjenas + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
    en: `🥑 **All greenxclusive** (2 weeks)\n\n📦 Reference content:\n2 garlic, 6 onions, 2 peppers, 8 potatoes/sweet potatoes, 1 large broccoli, 1 medium cauliflower, 8 tomatoes, 2 lettuces, 1 whole cabbage, celery, 2 large plantains, 10 green bananas, 4 mangos, 2 pineapples, 10 lemons, 5 carrots, 4 cucumbers, 4 eggplants + surprises (parsley, cilantro, rosemary, oregano, cinnamon, etc.)`
  }
};

/* ====== Funcionalidad del modal de cajas ====== */
function mostrarContenidoCaja(boxId) {
  const modal = document.getElementById('modal-box-content');
  const modalText = document.getElementById('modal-box-text');
  if (modal && modalText) {
    const lang = document.documentElement.lang || 'es';
    modalText.textContent = BOX_CONTENT[boxId][lang];
    modal.showModal();
  }
}

// Extrae el número del texto de precio, manejando comas
function parsePrecio(txt){
  const m = (txt||'').match(/\d+(?:,\d+)?/);
  return m ? parseFloat(m[0].replace(',', '')) : 0;
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
  const cont = document.getElementById('carrito-contenido');
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito)) carrito = [];
  if (!cont) return;
  let html = '';
  let total = 0;
  const lang = document.documentElement.lang || 'es';

  if (carrito.length === 0) {
    html = `
      <div class="text-center text-gray-500 my-8">
        ${lang === 'es' ? 'El carrito está vacío' : 'The cart is empty'}
      </div>
    `;
    cont.innerHTML = html;
    return;
  }

  carrito.forEach((item, index) => {
    const subtotal = item.precio * (item.cantidad || 1);
    total += subtotal;
    html += `
      <div class="bg-white rounded-lg shadow p-4 flex flex-col gap-2 mb-4">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-bold text-green-800 text-lg">${item.nombre}</div>
            ${item.variedad ? `<div class="text-sm text-gray-600">
              ${lang === 'es' ? 'Variedad:' : 'Variety:'} ${item.variedad}
            </div>` : ''}
            ${item.preferencias ? `
              <div class="ml-2 text-sm bg-green-50 rounded-lg p-2">
                <div>
                  <b>👍</b> 
                  ${lang === 'es' ? 'Me gusta:' : 'Likes:'} ${item.preferencias.like.map(n => {
                    const en = PRODUCTOS_TRADUCCIONES[n] || n;
                    return lang === 'es' ? n : en;
                  }).join(', ') || '-'}
                </div>
                <div>
                  <b>👎</b> 
                  ${lang === 'es' ? 'No me gusta:' : 'Dislikes:'} ${item.preferencias.dislike.map(n => {
                    const en = PRODUCTOS_TRADUCCIONES[n] || n;
                    return lang === 'es' ? n : en;
                  }).join(', ') || '-'}
                </div>
              </div>` : ''}
          </div>
          <div class="text-right">
            <div class="flex items-center gap-2">
              <button onclick="cambiarCantidad(${index}, -1)"
                      class="w-7 h-7 bg-red-500 text-white rounded-full text-lg leading-none flex items-center justify-center">−</button>
              <span class="min-w-[32px] text-center font-semibold">${item.cantidad || 1}</span>
              <button onclick="cambiarCantidad(${index},  1)"
                      class="w-7 h-7 bg-green-600 text-white rounded-full text-lg leading-none flex items-center justify-center">+</button>
            </div>
            <p class="text-sm font-semibold text-green-800">DOP ${subtotal.toFixed(2)}</p>
            <button onclick="eliminarDelCarrito(${index})"
                    class="mt-2 text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ${lang === 'es' ? 'Eliminar' : 'Remove'}
            </button>
          </div>
        </div>
      </div>`;
  });

  // Agregar el total y el botón de continuar
  html += `
    <div class="mt-6 p-6 bg-green-50 rounded-lg">
      <div class="flex justify-between items-center mb-6">
        <span class="text-xl font-bold text-green-800">
          ${lang === 'es' ? 'Total:' : 'Total:'}
        </span>
        <span class="text-xl font-bold text-green-800">DOP ${total.toFixed(2)}</span>
      </div>
      <button id="btn-continuar-pedido" 
              class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
        ${lang === 'es' ? 'Continuar con el pedido' : 'Continue with order'}
      </button>
    </div>`;

  cont.innerHTML = html;

  // Actualizar el contador del icono del carrito
  const headerCount = document.getElementById('carrito-cantidad-header');
  if (headerCount) {
    headerCount.textContent = carrito.reduce((total, item) => total + (item.cantidad || 1), 0);
  }
  // Listener para el botón de continuar
  document.getElementById('btn-continuar-pedido')?.addEventListener('click', handleContinuarPedido);
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

function cambiarCantidad(index, delta) {
  playWaterDrop();
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito) || !carrito[index]) return;

  carrito[index].cantidad = (carrito[index].cantidad || 1) + delta;
  if (carrito[index].cantidad < 1) carrito[index].cantidad = 1; // nunca < 1
  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
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
  setLanguage(localStorage.getItem('lang') || 'es');
  document.getElementById('configurar-caja').classList.remove('hidden');
  requestAnimationFrame(() =>
    document.getElementById('configurar-caja').scrollIntoView({ behavior: 'smooth' })
  );
  refrescarPreferenciasUI();

  const btnSave = document.getElementById('btn-guardar-preferencias');
  if (btnSave) {
    btnSave.classList.remove('hidden');
    btnSave.style.display = '';
    btnSave.disabled = true;
  }

  // Oculta la lista hasta que el usuario marque algo
  document.getElementById('lista-preferencias')?.classList.add('hidden');

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

// Definir traducciones de productos
const PRODUCTOS_TRADUCCIONES = {
  'Banana': 'Banana',
  'Piña': 'Pineapple',
  'Fresas': 'Strawberries',
  'Lechosa': 'Papaya',
  'Cerezas': 'Cherries',
  'Manzanas': 'Apples',
  'Sandía': 'Watermelon',
  'Melón': 'Melon',
  'Melón Francés': 'French Melon',
  'Pitahaya': 'Dragon Fruit',
  'Naranjas': 'Oranges',
  'Carambola': 'Star Fruit',
  'Cilantro': 'Cilantro',
  'Genjibre': 'Ginger',
  'Orégano': 'Oregano',
  'Perejil': 'Parsley',
  'Romero': 'Rosemary',
  'Cebollín': 'Chives',
  'Calabaza': 'Pumpkin',
  'Pepino': 'Cucumber',
  'Guineo verde': 'Green Banana',
  'Yuca': 'Cassava',
  'Repollo blanco': 'White Cabbage',
  'Coliflor': 'Cauliflower',
  'Brocoli': 'Broccoli',
  'Cebolla amarilla': 'Yellow Onion',
  'Zanahoria': 'Carrot',
  'Batata': 'Sweet Potato',
  'Aji morrones': 'Bell Pepper',
  'Maíz': 'Corn',
  'Limón': 'Lemon',
  'Cebolla morada': 'Red Onion',
  'Ajo': 'Garlic',
  'Uvas moradas': 'Purple Grapes'
};

function clonarProductosSiHaceFalta() {
  const gridFrutas = document.getElementById('config-productos-frutas');
  const gridVegetales = document.getElementById('config-productos-vegetales');
  const gridHierbas = document.getElementById('config-productos-hierbas');
  
  if (gridFrutas.dataset.ready) return;

  // Definir categorías
  const frutas = [
    // Frutas tropicales
    'Banana', 'Piña', 'Mango', 'Lechosa', 'Pitahaya', 'Carambola',
    // Frutas cítricas
    'Naranjas', 'Limón', 'Mandarinas',
    // Frutas de temporada
    'Fresas', 'Cerezas', 'Manzanas', 'Sandía', 'Melón', 'Melón Francés',
    // Frutas secas
    'Uvas blancas', 'Uvas moradas',
    // Otras frutas
    'Coco', 'Aguacates'
  ];

  const vegetales = [
    // Tubérculos y raíces
    'Yuca', 'Ñame', 'Batata',
    // Verduras de hoja
    'Repollo blanco', 'Lechuga',
    // Verduras crucíferas
    'Coliflor', 'Brocoli',
    // Verduras de bulbo
    'Cebolla amarilla', 'Cebolla morada', 'Ajo',
    // Verduras de fruto
    'Tomate bugalú', 'Tomate redondo', 'Pepino', 'Calabaza', 'Maíz',
    // Legumbres
    'Lentejas', 'Habichuelas rojas', 'Habichuelas negras',
    // Granos
    'Quinoa', 'Arroz blanco', 'Arroz integral'
  ];

  const hierbas = [
    // Hierbas aromáticas
    'Cilantro', 'Perejil', 'Romero', 'Orégano',
    // Hierbas medicinales
    'Genjibre',
    // Hierbas de cocina
    'Cebollín'
  ];

  document.querySelectorAll('#alacarta .producto-hover').forEach(card => {
    const clon = card.cloneNode(true);
    const nombre = clon.querySelector('.font-bold').textContent.trim();
    clon.dataset.nombre = nombre;
    
    // Remover todos los precios y el botón de agregar
    clon.querySelectorAll('.text-green-800').forEach(e => e.remove());
    const btnAgregar = clon.querySelector('.agregar-carrito');
    if (btnAgregar) btnAgregar.remove();

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

    // Agregar traducciones
    const titulo = clon.querySelector('.font-bold');
    const nombreEn = PRODUCTOS_TRADUCCIONES[nombre] || nombre;
    
    // Crear elementos span para cada idioma
    const spanEs = document.createElement('span');
    spanEs.className = 'lang-es';
    spanEs.textContent = nombre;
    
    const spanEn = document.createElement('span');
    spanEn.className = 'lang-en';
    spanEn.textContent = nombreEn;
    
    // Reemplazar el contenido del título
    titulo.innerHTML = '';
    titulo.appendChild(spanEs);
    titulo.appendChild(spanEn);

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
            resetCarritoDialog();
            window.estadoFlujoCarrito = "lista";
            renderCarrito();
            document.getElementById('dlg-carrito').showModal();
          });
          
  document.getElementById('dlg-carrito-cerrar')
          ?.addEventListener('click', () => {
            playWaterDrop();
            document.getElementById('dlg-carrito').close();
            window.estadoFlujoCarrito = "lista"; // Resetear flujo al cerrar
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
    resetCarritoDialog();
    window.estadoFlujoCarrito = "lista";
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

  actualizarBotonesAgregar();
});

/* ----------  RESETEAR OTRAS CAJAS (al cambiar de variedad) ---------- */
function resetearCajasExcepto(boxIdKeep) {
  Object.keys(estadoCajas).forEach(boxId => {
    if (boxId !== boxIdKeep) {
      estadoCajas[boxId] = { variedad: null, like: [], dislike: [], ok: false };
      actualizarBotonAgregar(boxId);
    }
  });

  /* 4‒ Quita marcas visuales de productos */
  document.querySelectorAll('#configurar-caja .producto-hover')
          .forEach(card => {
            card.classList.remove(
              'seleccion-like','seleccion-dislike',
              'ring-4','ring-green-400','ring-red-400'
            );
          });
}

/* ----------  SELECCIONAR VARIEDAD ---------- */
function seleccionarVariedad(btn) {
  playWaterDrop();
  const card  = btn.closest('.caja-hover');
  if (!card) return;
  const boxId = card.dataset.box;

  resetearCajasExcepto(boxId);

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
  const likes = estadoCajas[cajaActual].like.map(n => {
    const en = PRODUCTOS_TRADUCCIONES[n] || n;
    return `👍 ${n} / ${en}`;
  }).join('<br>');
  const dislikes = estadoCajas[cajaActual].dislike.map(n => {
    const en = PRODUCTOS_TRADUCCIONES[n] || n;
    return `👎 ${n} / ${en}`;
  }).join('<br>');
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
  // Solo permitir mostrar el formulario si el flujo fue iniciado por el botón de continuar
  if (window.estadoFlujoCarrito !== 'formulario') {
    // Si no fue iniciado correctamente, forzar la lista
    window.estadoFlujoCarrito = 'lista';
    renderCarrito();
    return;
  }
  const dialog = document.getElementById('dlg-carrito');
  const lang = document.documentElement.lang || 'es';
  dialog.innerHTML = `
    <div class="p-6">
      <h3 class="text-xl font-bold text-green-800 mb-6 text-center">
        ${lang === 'es' ? 'Completar pedido' : 'Complete order'}
      </h3>
      
      <form id="form-pedido" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ${lang === 'es' ? 'Nombre' : 'Name'}
          </label>
          <input type="text" name="nombre" required
                 placeholder="${lang === 'en' ? 'Your name' : 'Tu nombre'}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp
          </label>
          <input type="tel" name="whatsapp" required
                 placeholder="${lang === 'en' ? 'Your WhatsApp number' : 'Tu número de WhatsApp'}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ${lang === 'es' ? 'Día de entrega' : 'Delivery day'}
          </label>
          <select name="dia" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">${lang === 'en' ? 'Select day' : 'Seleccionar día'}</option>
            <option value="Lunes">${lang === 'en' ? 'Monday (12:30-20:00) - Free' : 'Lunes (12:30-20:00) - Gratis'}</option>
            <option value="Martes">${lang === 'en' ? 'Tuesday (12:30-20:00) - DOP 100' : 'Martes (12:30-20:00) - DOP 100'}</option>
            <option value="Miércoles">${lang === 'en' ? 'Wednesday (12:30-20:00) - Free' : 'Miércoles (12:30-20:00) - Gratis'}</option>
            <option value="Jueves">${lang === 'en' ? 'Thursday (12:30-20:00) - DOP 100' : 'Jueves (12:30-20:00) - DOP 100'}</option>
            <option value="Viernes">${lang === 'en' ? 'Friday (12:30-20:00) - Free' : 'Viernes (12:30-20:00) - Gratis'}</option>
            <option value="Sábado">${lang === 'en' ? 'Saturday (12:30-20:00) - DOP 100' : 'Sábado (12:30-20:00) - DOP 100'}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ${lang === 'es' ? 'Dirección de entrega' : 'Delivery address'}
          </label>
          <textarea name="direccion" required rows="3"
                    placeholder="${lang === 'en' ? 'Delivery address' : 'Dirección de entrega'}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ${lang === 'es' ? 'Observaciones (opcional)' : 'Notes (optional)'}
          </label>
          <textarea name="observaciones" rows="2"
                    placeholder="${lang === 'en' ? 'Notes (optional)' : 'Observaciones (opcional)'}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ${lang === 'es' ? 'Modo de pago' : 'Payment method'}
          </label>
          <select name="pago" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">${lang === 'en' ? 'Select method' : 'Seleccionar método'}</option>
            <option value="Cash">${lang === 'en' ? 'Cash' : 'Efectivo'}</option>
            <option value="Transferencia">${lang === 'en' ? 'Bank Transfer' : 'Transferencia'}</option>
            <option value="PayPal">PayPal (+10%)</option>
          </select>
        </div>

        <div class="flex justify-end gap-4 mt-6">
          <button type="button" onclick="resetCarritoDialog(); document.getElementById('dlg-carrito').close(); window.estadoFlujoCarrito = 'lista'; renderCarrito();"
                  class="px-4 py-2 text-gray-600 hover:text-gray-800">
            ${lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button type="submit"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            ${lang === 'es' ? 'Enviar pedido' : 'Send order'}
          </button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('form-pedido')?.addEventListener('submit', enviarPedido);
}

// Función para enviar el pedido por WhatsApp
function enviarPedido(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const lang = document.documentElement.lang || 'es';
  // Obtener el carrito actual
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito) || carrito.length === 0) {
    alert(lang === 'en' ? 'The cart is empty' : 'El carrito está vacío');
    return;
  }

  // Construir el mensaje usando el mismo formato que se muestra en el checkout
  let mensaje = lang === 'en' ? `*New GreenDolio Order*\n\n` : `*Nuevo Pedido GreenDolio*\n\n`;
  mensaje += lang === 'en' ? `*Customer:* ${formData.get('nombre')}\n` : `*Cliente:* ${formData.get('nombre')}\n`;
  mensaje += `*WhatsApp:* ${formData.get('whatsapp')}\n`;
  mensaje += lang === 'en' ? `*Delivery day:* ${formData.get('dia')}\n` : `*Día de entrega:* ${formData.get('dia')}\n`;
  mensaje += lang === 'en' ? `*Address:* ${formData.get('direccion')}\n` : `*Dirección:* ${formData.get('direccion')}\n`;
  if (formData.get('observaciones')) {
    mensaje += lang === 'en' ? `*Notes:* ${formData.get('observaciones')}\n` : `*Observaciones:* ${formData.get('observaciones')}\n`;
  }
  mensaje += lang === 'en' ? `*Payment method:* ${formData.get('pago')}\n\n` : `*Método de pago:* ${formData.get('pago')}\n\n`;
  
  mensaje += lang === 'en' ? `*Products:*\n` : `*Productos:*\n`;
  carrito.forEach(item => {
    const subtotal = item.precio * (item.cantidad || 1);
    mensaje += `\n*${item.nombre}*\n`;
    mensaje += lang === 'en' ? `Quantity: ${item.cantidad || 1}\n` : `Cantidad: ${item.cantidad || 1}\n`;
    mensaje += lang === 'en' ? `Unit price: DOP ${item.precio.toFixed(2)}\n` : `Precio unitario: DOP ${item.precio.toFixed(2)}\n`;
    mensaje += lang === 'en' ? `Subtotal: DOP ${subtotal.toFixed(2)}\n` : `Subtotal: DOP ${subtotal.toFixed(2)}\n`;
    if (item.variedad) {
      mensaje += lang === 'en' ? `Variety: ${item.variedad}\n` : `Variedad: ${item.variedad}\n`;
    }
    if (item.preferencias) {
      if (item.preferencias.like.length > 0) {
        mensaje += lang === 'en' ? `👍 Likes: ${item.preferencias.like.join(', ')}\n` : `👍 Me gusta: ${item.preferencias.like.join(', ')}\n`;
      }
      if (item.preferencias.dislike.length > 0) {
        mensaje += lang === 'en' ? `👎 Dislikes: ${item.preferencias.dislike.join(', ')}\n` : `👎 No me gusta: ${item.preferencias.dislike.join(', ')}\n`;
      }
    }
  });

  // Calcular totales
  let subtotal = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
  let total = subtotal;
  
  mensaje += lang === 'en' ? `\n*Cost summary:*\n` : `\n*Resumen de costos:*\n`;
  mensaje += lang === 'en' ? `Products subtotal: DOP ${subtotal.toFixed(2)}\n` : `Subtotal productos: DOP ${subtotal.toFixed(2)}\n`;
  
  // Agregar costo de delivery si aplica
  if ([lang === 'en' ? 'Tuesday' : 'Martes', lang === 'en' ? 'Thursday' : 'Jueves', lang === 'en' ? 'Saturday' : 'Sábado'].includes(formData.get('dia'))) {
    total += 100;
    mensaje += lang === 'en' ? `Delivery cost: DOP 100.00\n` : `Costo de delivery: DOP 100.00\n`;
  }
  
  // Agregar comisión PayPal si aplica
  if (formData.get('pago') === 'PayPal') {
    const comisionPayPal = total * 0.1;
    total += comisionPayPal;
    mensaje += lang === 'en' ? `PayPal fee (10%): DOP ${comisionPayPal.toFixed(2)}\n` : `Comisión PayPal (10%): DOP ${comisionPayPal.toFixed(2)}\n`;
  }
  
  mensaje += lang === 'en' ? `*Final total:* DOP ${total.toFixed(2)}` : `*Total final:* DOP ${total.toFixed(2)}`;

  // Crear y mostrar el diálogo de confirmación
  const dialogConfirm = document.createElement('dialog');
  dialogConfirm.className = 'p-6 rounded-lg shadow-xl max-w-lg w-full';
  dialogConfirm.innerHTML = `
    <div class="space-y-4">
      <h3 class="text-xl font-bold text-green-800 mb-4">
        <span class="lang-es">Confirmar pedido</span>
        <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Confirm order</span>
      </h3>
      
      <div class="bg-gray-50 p-4 rounded-lg">
        <pre class="whitespace-pre-wrap font-mono text-sm">${mensaje}</pre>
      </div>
      
      <div class="flex justify-end gap-4 mt-6">
        <button type="button" onclick="this.closest('dialog').close()"
                class="px-4 py-2 text-gray-600 hover:text-gray-800">
          <span class="lang-es">Cancelar</span>
          <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Cancel</span>
        </button>
        <button type="button" onclick="enviarPedidoWhatsApp(this.closest('dialog'))"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <span class="lang-es">Enviar por WhatsApp</span>
          <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Send via WhatsApp</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialogConfirm);
  dialogConfirm.showModal();
}

function enviarPedidoWhatsApp(dialog) {
  const formData = new FormData(document.getElementById('form-pedido'));
  const lang = document.documentElement.lang || 'es';
  const numeroWhatsApp = '18493757338';

  let mensaje = lang === 'en' ? 'Hello! I want to place an order:\n\n' : '¡Hola! Quiero hacer un pedido:\n\n';

  // Agregar items del carrito
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  carrito.forEach((item, index) => {
    mensaje += `${index + 1}. ${item.nombre}\n`;
    if (item.variedad) {
      mensaje += lang === 'en' ? `   Variety: ${item.variedad}\n` : `   Variedad: ${item.variedad}\n`;
    }
    if (item.preferencias) {
      if (item.preferencias.like.length > 0) {
        mensaje += lang === 'en' ? `   👍 Likes: ${item.preferencias.like.join(', ')}\n` : `   👍 Me gusta: ${item.preferencias.like.join(', ')}\n`;
      }
      if (item.preferencias.dislike.length > 0) {
        mensaje += lang === 'en' ? `   👎 Dislikes: ${item.preferencias.dislike.join(', ')}\n` : `   👎 No me gusta: ${item.preferencias.dislike.join(', ')}\n`;
      }
    }
    mensaje += lang === 'en' ? `   Quantity: ${item.cantidad || 1}\n` : `   Cantidad: ${item.cantidad || 1}\n`;
    mensaje += `   DOP ${(item.precio * (item.cantidad || 1)).toFixed(2)}\n\n`;
  });

  // Agregar total
  const total = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
  mensaje += lang === 'en' ? `Total: DOP ${total.toFixed(2)}\n\n` : `Total: DOP ${total.toFixed(2)}\n\n`;

  // Agregar datos de entrega
  mensaje += lang === 'en' ? 'Delivery Information:\n' : 'Datos de entrega:\n';
  mensaje += lang === 'en' ? `Name: ${formData.get('nombre')}\n` : `Nombre: ${formData.get('nombre')}\n`;
  mensaje += `WhatsApp: ${formData.get('whatsapp')}\n`;
  mensaje += lang === 'en' ? `Address: ${formData.get('direccion')}\n` : `Dirección: ${formData.get('direccion')}\n`;
  mensaje += lang === 'en' ? `Delivery day: ${formData.get('dia')}\n` : `Día de entrega: ${formData.get('dia')}\n`;
  mensaje += lang === 'en' ? `Payment method: ${formData.get('pago')}\n` : `Método de pago: ${formData.get('pago')}\n`;
  if (formData.get('observaciones')) {
    mensaje += lang === 'en' ? `Notes: ${formData.get('observaciones')}\n` : `Observaciones: ${formData.get('observaciones')}\n`;
  }

  // Abrir WhatsApp con el mensaje
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
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

function actualizarBotonesAgregar() {
  document.querySelectorAll('.agregar-carrito').forEach(btn => {
    if (!btn.querySelector('.lang-es')) {
      const spanEs = document.createElement('span');
      spanEs.className = 'lang-es';
      spanEs.textContent = 'Agregar';
      
      const spanEn = document.createElement('span');
      spanEn.className = 'lang-en';
      spanEn.textContent = 'Add';
      
      btn.innerHTML = '<i class="fas fa-cart-plus"></i>';
      btn.appendChild(spanEs);
      btn.appendChild(spanEn);
    }
  });
}

// Refuerzo: Solo abrir el formulario si el usuario presiona continuar
function handleContinuarPedido() {
  window.estadoFlujoCarrito = 'formulario';
  mostrarFormularioPedido();
}