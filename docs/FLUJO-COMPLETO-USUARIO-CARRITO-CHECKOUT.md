# REPORTE COMPLETO: FLUJO DE USUARIO - GREEN DOLIO WEB

## ÍNDICE
1. [Sistema de Autenticación](#1-sistema-de-autenticación)
2. [Registro y Perfil de Usuario](#2-registro-y-perfil-de-usuario)
3. [Sistema de Carrito](#3-sistema-de-carrito)
4. [Configuración de Cajas](#4-configuración-de-cajas)
5. [Proceso de Checkout](#5-proceso-de-checkout)
6. [Estructura de Datos](#6-estructura-de-datos)
7. [Flujo Visual Completo](#7-flujo-visual-completo)

---

## 1. SISTEMA DE AUTENTICACIÓN

### 1.1 Proveedor de Autenticación
- **Tecnología**: Firebase Authentication con Google OAuth
- **Archivo**: `script.js` (líneas 1-120)
- **Configuración**: `firebase.js`

### 1.2 Flujo de Login

#### Paso 1: Usuario hace clic en "Iniciar sesión"
```javascript
// script.js:16-27
const login = () => {
  auth.signInWithPopup(provider)
    .then((result) => {
      console.log("¡Inicio de sesión exitoso!", result.user);
      mostrarNotificacion('¡Bienvenid@ de vuelta!');
    })
    .catch((error) => {
      console.error("Error en el inicio de sesión:", error);
      mostrarNotificacion('Error al iniciar sesión.');
    });
};
```

#### Paso 2: Firebase procesa la autenticación
- Se abre popup de Google
- Usuario selecciona cuenta de Google
- Firebase valida credenciales

#### Paso 3: Listener de cambio de estado (onAuthStateChanged)
```javascript
// script.js:57-99
auth.onAuthStateChanged((user) => {
  if (user) {
    // Usuario autenticado
    const db = firebase.firestore();
    const userRef = db.collection("users").doc(user.uid);

    userRef.get().then((doc) => {
      if (doc.exists) {
        // USUARIO RECURRENTE
        window.userProfile = doc.data();
        // Cargar carrito desde Firebase
        if (window.userProfile.carrito) {
          localStorage.setItem('carrito', JSON.stringify(window.userProfile.carrito));
          renderCarrito();
        }
      } else {
        // USUARIO NUEVO
        guardarPerfilDeUsuario(user);
      }
    });

    // Actualizar UI
    btnLogin.style.display = 'none';
    userInfoContainer.style.display = 'flex';
    userPic.src = user.photoURL;
    userName.textContent = user.displayName;
  }
});
```

### 1.3 Datos Obtenidos del Login
```javascript
{
  uid: "firebase_user_id",          // ID único del usuario
  displayName: "Nombre del Usuario", // Nombre completo
  email: "usuario@gmail.com",        // Email
  photoURL: "https://...",           // Foto de perfil de Google
}
```

---

## 2. REGISTRO Y PERFIL DE USUARIO

### 2.1 Detección de Usuario Nuevo
**Ubicación**: `script.js:76-79`

Cuando un usuario inicia sesión por primera vez, Firebase no encuentra un documento en la colección `users` con su UID, por lo que se ejecuta la función `guardarPerfilDeUsuario(user)`.

### 2.2 Formulario de Perfil

#### HTML del Formulario
**Ubicación**: `index.html:72-169`

**Campos del formulario**:
1. **Nombre** (readonly, pre-llenado de Google)
2. **Teléfono** (requerido)
3. **Dirección** (requerida)
4. **Método de pago preferido** (opcional)
   - Efectivo / Cash
   - Transferencia Bancaria / Bank Transfer
   - PayPal (+10%)
5. **¿Cómo nos conociste?** (requerido)
   - WhatsApp
   - Flyer
   - Instagram
   - TikTok
   - YouTube
   - Google
   - IA
   - Recomendación
   - ¡Lo soñé!
6. **Gustos** (opcional) - Productos que SIEMPRE quiere recibir
7. **Disgustos** (opcional) - Productos que NUNCA quiere recibir

#### JavaScript del Formulario
**Ubicación**: `script.js:1176-1229`

```javascript
function guardarPerfilDeUsuario(user) {
  const seccionFormulario = document.getElementById('profile-setup');
  const formulario = document.getElementById('profile-form');

  // Mostrar el formulario
  seccionFormulario.classList.remove('hidden');
  document.getElementById('nombre').value = user.displayName;

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const db = firebase.firestore();

    // Guardar en Firestore
    db.collection("users").doc(user.uid).set({
      displayName: user.displayName,
      email: user.email,
      telefono: document.getElementById('telefono').value,
      direccion: document.getElementById('direccion').value,
      pagoPreferido: document.getElementById('pago-preferido').value,
      likes: document.getElementById('likes').value,
      dislikes: document.getElementById('dislikes').value,
      comoNosConocio: document.getElementById('como-nos-conocio').value,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      seccionFormulario.classList.add('hidden');
      mostrarNotificacion("¡Gracias! Tu perfil ha sido guardado.");
      // Guardar en variable global
      window.userProfile = { /* datos */ };
    });
  });
}
```

### 2.3 Estructura de Datos en Firestore

**Colección**: `users`
**Documento ID**: `{user.uid}`

```javascript
{
  displayName: "Juan Pérez",
  email: "juan@gmail.com",
  telefono: "809-123-4567",
  direccion: "Calle Principal #123, Santo Domingo",
  pagoPreferido: "Transferencia",
  likes: "Aguacates, mangos, fresas",
  dislikes: "Repollo, brócoli",
  comoNosConocio: "Instagram",
  fechaCreacion: Timestamp,
  carrito: []  // Se añade al guardar el primer item
}
```

---

## 3. SISTEMA DE CARRITO

### 3.1 Almacenamiento Dual
El carrito se guarda en **DOS** lugares:
1. **localStorage** (navegador) - Para acceso rápido
2. **Firebase Firestore** - Para persistencia en la nube

### 3.2 Estructura del Carrito

#### LocalStorage
**Key**: `'carrito'`
**Value**: JSON string de un array

```javascript
[
  {
    tipo: 'caja',
    nombre: 'BOX 1 "Caribbean Fresh Pack"',
    precio: 650,
    variedad: 'Mix',
    preferencias: {
      like: ['Banana', 'Piña', 'Aguacates'],
      dislike: ['Repollo blanco', 'Coliflor']
    },
    cantidad: 1,
    autoMode: false
  },
  {
    tipo: 'producto',
    nombre: 'Fresas',
    precio: 180,
    cantidad: 2
  }
]
```

### 3.3 Función para Agregar al Carrito

**Ubicación**: `script.js:1077-1113`

```javascript
function agregarAlCarrito(item) {
  // Limpiar si no existe
  if (!localStorage.getItem('carrito')) {
    localStorage.setItem('carrito', '[]');
  }

  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  // Buscar item existente
  const itemExistente = carrito.find(i =>
    i.nombre === item.nombre &&
    i.variedad === item.variedad &&
    i.autoMode === item.autoMode
  );

  if (itemExistente) {
    // Actualizar cantidad
    itemExistente.cantidad = (itemExistente.cantidad || 1) + 1;
    mostrarNotificacion('Cantidad actualizada en el carrito');
  } else {
    // Agregar nuevo item
    item.cantidad = 1;
    carrito.push(item);
    mostrarNotificacion('Producto agregado al carrito');
  }

  // Guardar
  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
  guardarCarritoEnFirebase();
}
```

### 3.4 Sincronización con Firebase

**Ubicación**: `script.js:1122-1133`

```javascript
function guardarCarritoEnFirebase() {
  const user = firebase.auth().currentUser;
  if (user) {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const db = firebase.firestore();

    db.collection("users").doc(user.uid).update({
      carrito: carrito
    }).catch((error) => {
      console.error("Error al sincronizar el carrito con Firebase:", error);
    });
  }
}
```

### 3.5 Renderizado del Carrito

**Ubicación**: `script.js:208-311`

```javascript
function renderCarrito() {
  const cont = document.getElementById('carrito-contenido');
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  let html = '';
  let total = 0;

  if (carrito.length === 0) {
    html = '<div>El carrito está vacío</div>';
    cont.innerHTML = html;
    return;
  }

  // Generar HTML para cada item
  carrito.forEach((item, index) => {
    const subtotal = item.precio * (item.cantidad || 1);
    total += subtotal;

    html += `
      <div class="bg-white rounded-lg shadow p-4">
        <div class="font-bold">${item.nombre}</div>
        ${item.variedad ? `<div>Variedad: ${item.variedad}</div>` : ''}
        ${item.preferencias ? `
          <div>
            <b>👍</b> Me gusta: ${item.preferencias.like.join(', ')}
            <b>👎</b> No me gusta: ${item.preferencias.dislike.join(', ')}
          </div>
        ` : ''}
        <div>
          <button onclick="cambiarCantidad(${index}, -1)">−</button>
          <span>${item.cantidad || 1}</span>
          <button onclick="cambiarCantidad(${index}, 1)">+</button>
        </div>
        <p>DOP ${subtotal.toFixed(2)}</p>
        <button onclick="eliminarDelCarrito(${index})">Eliminar</button>
      </div>
    `;
  });

  // Botón continuar
  html += `
    <div>
      <span>Total: DOP ${total.toFixed(2)}</span>
      <button id="btn-continuar-pedido">Continuar con el pedido</button>
    </div>
  `;

  cont.innerHTML = html;

  // Actualizar contador del header
  document.getElementById('carrito-cantidad-header').textContent =
    carrito.reduce((total, item) => total + (item.cantidad || 1), 0);

  // Listener para continuar
  document.getElementById('btn-continuar-pedido')
    ?.addEventListener('click', handleContinuarPedido);
}
```

### 3.6 Funciones de Gestión del Carrito

#### Eliminar Producto
**Ubicación**: `script.js:313-324`

```javascript
function eliminarDelCarrito(index) {
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
  guardarCarritoEnFirebase();
  mostrarNotificacion('Producto eliminado del carrito');
}
```

#### Cambiar Cantidad
**Ubicación**: `script.js:326-335`

```javascript
function cambiarCantidad(index, delta) {
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  carrito[index].cantidad = (carrito[index].cantidad || 1) + delta;
  if (carrito[index].cantidad < 1) carrito[index].cantidad = 1;
  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
  guardarCarritoEnFirebase();
}
```

---

## 4. CONFIGURACIÓN DE CAJAS

### 4.1 Tipos de Cajas

**Ubicación**: `index.html:456-500+`

```javascript
BOX 1: "Caribbean Fresh Pack" (3 días) - $650
BOX 2: "Weekssential" (1 semana) - $1,150
BOX 3: "All greenxclusive" (2 semanas) - $1,850
```

Cada caja tiene **3 variedades**:
- Mix (Mezcla)
- Fruitty (Frutas)
- Veggie (Vegetales)

### 4.2 Flujo de Configuración de Caja

#### Paso 1: Seleccionar Variedad
**Ubicación**: `script.js:1048-1075`

```javascript
function iniciarConfiguracionCaja(btn) {
  const boxId = btn.dataset.box;
  const variedad = btn.dataset.variedad;

  // Resetear otras cajas
  resetearCajasExcepto(boxId);

  // Crear estado si no existe
  if (!estadoCajas[boxId]) {
    estadoCajas[boxId] = { variedad: null, like: [], dislike: [], ok: false };
  }

  // Guardar variedad
  estadoCajas[boxId].variedad = variedad;
  cajaActual = boxId;

  // Actualizar UI del botón
  btn.classList.add('selected', 'bg-green-600', 'text-white');

  // Abrir sección de configuración
  abrirConfig(boxId);
}
```

#### Paso 2: Configurar Preferencias
**Ubicación**: `script.js:338-370`

```javascript
function abrirConfig(boxId) {
  // Cargar preferencias previas
  preferenciasCaja.like = [...(estadoCajas[boxId]?.like || [])];
  preferenciasCaja.dislike = [...(estadoCajas[boxId]?.dislike || [])];

  // Clonar productos si no se han clonado
  clonarProductosSiHaceFalta();

  // Mostrar sección
  const configSection = document.getElementById('configurar-caja');
  configSection.classList.remove('hidden');
  configSection.scrollIntoView({ behavior: 'smooth' });

  // Mostrar botón guardar
  const btnSave = document.getElementById('btn-guardar-preferencias');
  btnSave.classList.remove('hidden');
  btnSave.disabled = true; // Se activa al marcar preferencias

  // Resaltar selecciones previas
  document.querySelectorAll('#configurar-caja .producto-hover').forEach(card => {
    const nombre = card.dataset.nombre;
    if (estadoCajas[boxId]?.like.includes(nombre)) {
      card.classList.add('ring-4', 'ring-green-400');
    } else if (estadoCajas[boxId]?.dislike.includes(nombre)) {
      card.classList.add('ring-4', 'ring-red-400');
    }
  });
}
```

#### Paso 3: Marcar Productos (Like/Dislike)
**Ubicación**: `script.js:517-532`

```javascript
function marcar(card, esLike) {
  const nombre = card.dataset.nombre;

  // Remover de ambas listas
  preferenciasCaja.like = preferenciasCaja.like.filter(x => x !== nombre);
  preferenciasCaja.dislike = preferenciasCaja.dislike.filter(x => x !== nombre);

  // Agregar a la lista correspondiente
  (esLike ? preferenciasCaja.like : preferenciasCaja.dislike).push(nombre);

  // Actualizar UI
  card.classList.remove('seleccion-like', 'seleccion-dislike');
  card.classList.add(esLike ? 'seleccion-like' : 'seleccion-dislike');

  // Guardar en estado de la caja
  if (cajaActual) {
    estadoCajas[cajaActual].like = [...preferenciasCaja.like];
    estadoCajas[cajaActual].dislike = [...preferenciasCaja.dislike];
  }

  refrescarPreferenciasUI();
  document.getElementById('btn-guardar-preferencias').disabled = false;
}
```

#### Paso 4: Guardar Preferencias y Agregar al Carrito
**Ubicación**: `script.js:725-762`

```javascript
function guardarPreferencias() {
  if (!cajaActual || !estadoCajas[cajaActual]) {
    alert('Error: No se ha seleccionado ninguna caja.');
    return;
  }

  // Guardar preferencias
  estadoCajas[cajaActual].like = [...preferenciasCaja.like];
  estadoCajas[cajaActual].dislike = [...preferenciasCaja.dislike];
  estadoCajas[cajaActual].ok = true;

  // Obtener datos de la tarjeta
  const card = document.querySelector(`.caja-hover[data-box="box${cajaActual}"]`);
  const nombre = card.querySelector('.text-3xl, .text-4xl')?.textContent.trim();
  const precio = parsePrecio(card.querySelector('.inline-block.bg-white')?.textContent);
  const estado = estadoCajas[cajaActual];

  // Crear item del carrito
  const item = {
    tipo: 'caja',
    nombre: nombre,
    precio: precio,
    variedad: estado.variedad,
    preferencias: {
      like: [...estado.like],
      dislike: [...estado.dislike]
    },
    cantidad: 1
  };

  // Agregar al carrito
  agregarAlCarrito(item);

  // Ocultar configuración y volver a cajas
  document.getElementById('configurar-caja').classList.add('hidden');
  document.querySelector('#cajas')?.scrollIntoView({ behavior: 'smooth' });
}
```

### 4.3 Modo AUTO (Sin Preferencias)

**Ubicación**: `script.js:1136-1174`

```javascript
function agregarCajaAutoMode() {
  const card = document.querySelector(`.caja-hover[data-box="box${cajaActual}"]`);
  const nombre = card.querySelector('.text-3xl, .text-4xl')?.textContent.trim();
  const precio = parsePrecio(card.querySelector('.inline-block.bg-white')?.textContent);
  const variedad = card.querySelector('.variedad-btn.selected')?.textContent.trim() || 'Mix';

  const item = {
    tipo: 'caja',
    nombre: nombre,
    precio: precio,
    variedad: variedad,
    preferencias: { like: [], dislike: [] },
    cantidad: 1,
    autoMode: true
  };

  agregarAlCarrito(item);
  document.getElementById('configurar-caja').classList.add('hidden');
  document.querySelector('#cajas')?.scrollIntoView({ behavior: 'smooth' });
}
```

### 4.4 Productos Disponibles para Configuración

**Ubicación**: `script.js:373-455`

```javascript
// FRUTAS
const frutas = [
  'Banana', 'Piña', 'Mango', 'Lechosa', 'Pitahaya', 'Carambola',
  'Naranjas', 'Limón', 'Mandarinas',
  'Fresas', 'Cerezas', 'Manzanas', 'Sandía', 'Melón', 'Melón Francés',
  'Uvas blancas', 'Uvas moradas',
  'Coco', 'Aguacates'
];

// VEGETALES
const vegetales = [
  'Yuca', 'Ñame', 'Batata',
  'Repollo blanco', 'Lechuga',
  'Coliflor', 'Brocoli',
  'Cebolla amarilla', 'Cebolla morada', 'Ajo',
  'Tomate bugalú', 'Tomate redondo', 'Pepino', 'Calabaza', 'Maíz',
  'Lentejas', 'Habichuelas rojas', 'Habichuelas negras',
  'Quinoa', 'Arroz blanco', 'Arroz integral'
];

// HIERBAS
const hierbas = [
  'Cilantro', 'Perejil', 'Romero', 'Orégano',
  'Genjibre',
  'Cebollín'
];
```

---

## 5. PROCESO DE CHECKOUT

### 5.1 Validación del Pedido Mínimo

**Ubicación**: `script.js:1030-1046`

```javascript
function handleContinuarPedido() {
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  const lang = document.documentElement.lang || 'es';

  const tieneCajas = carrito.some(item => item.tipo === 'caja');
  const subtotal = carrito.reduce((sum, item) =>
    sum + (item.precio * (item.cantidad || 1)), 0);

  // Validar pedido mínimo de DOP 500 (solo si no hay cajas)
  if (!tieneCajas && subtotal < 500) {
    const faltante = 500 - subtotal;
    alert(`Pedido mínimo: DOP 500. Te faltan DOP ${faltante.toFixed(2)}.`);
    return;
  }

  window.estadoFlujoCarrito = 'formulario';
  mostrarFormularioPedido();
}
```

### 5.2 Formulario de Pedido

**Ubicación**: `script.js:797-932`

#### Campos del Formulario:
1. **Nombre** (pre-llenado del perfil)
2. **Teléfono** (pre-llenado del perfil)
3. **Dirección de entrega** (pre-llenada del perfil)
4. **Día de entrega** (requerido)
   - Lunes (12:30-20:00) - Gratis
   - Martes (12:30-20:00) - DOP 100
   - Miércoles (12:30-20:00) - Gratis
   - Jueves (12:30-20:00) - DOP 100
   - Viernes (12:30-20:00) - Gratis
   - Sábado (12:30-20:00) - DOP 100
5. **Observaciones** (opcional, pre-llenado con preferencias del perfil)
6. **Modo de pago** (requerido, pre-seleccionado del perfil)
   - Efectivo / Cash
   - Transferencia / Bank Transfer
   - PayPal (+10%)

```javascript
function mostrarFormularioPedido() {
  const user = firebase.auth().currentUser;
  const profile = window.userProfile || {};

  const nombre = user ? user.displayName : '';
  const telefono = profile.telefono || '';
  const direccion = profile.direccion || '';
  const pagoPreferido = profile.pagoPreferido || '';

  // Crear notas a partir de preferencias
  let notasPreferidas = '';
  if (profile.likes || profile.dislikes) {
    let notasArray = [];
    if (profile.likes) notasArray.push(`👍 Preferencias: ${profile.likes}`);
    if (profile.dislikes) notasArray.push(`👎 Evitar: ${profile.dislikes}`);
    notasPreferidas = notasArray.join('\n');
  }

  // Renderizar formulario con campos pre-llenados
  dialog.innerHTML = `
    <form id="form-pedido">
      <input type="text" name="nombre" value="${nombre}" required>
      <input type="tel" name="telefono" value="${telefono}" required>
      <select name="dia" required>
        <option value="Lunes">Lunes (12:30-20:00) - Gratis</option>
        <!-- ... más opciones ... -->
      </select>
      <textarea name="direccion" required>${direccion}</textarea>
      <textarea name="observaciones">${notasPreferidas}</textarea>
      <select name="pago" required>
        <option value="Cash" ${pagoPreferido === 'Cash' ? 'selected' : ''}>Efectivo</option>
        <option value="Transferencia" ${pagoPreferido === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
        <option value="PayPal" ${pagoPreferido === 'PayPal' ? 'selected' : ''}>PayPal (+10%)</option>
      </select>
      <button type="submit">Enviar pedido</button>
    </form>
  `;

  document.getElementById('form-pedido')
    ?.addEventListener('submit', finalizarPedido);
}
```

### 5.3 Finalización del Pedido

**Ubicación**: `script.js:1231-1333`

```javascript
function finalizarPedido(event) {
  event.preventDefault();

  const user = firebase.auth().currentUser;
  if (!user) {
    mostrarNotificacion('Debes iniciar sesión para completar el pedido.');
    return;
  }

  const form = document.getElementById('form-pedido');
  const formData = new FormData(form);
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  const lang = localStorage.getItem('lang') || 'es';

  // Generar detalle del pedido
  let detallePedido = carrito.map(item => {
    let linea = `• ${item.nombre} (x${item.cantidad || 1}) - DOP ${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}`;

    if (item.variedad) {
      linea += `\n  - Variedad: ${item.variedad}`;
    }

    if (item.preferencias && (item.preferencias.like.length > 0 || item.preferencias.dislike.length > 0)) {
      linea += `\n  - Gustos: 👍 ${item.preferencias.like.join(', ') || 'ninguno'}`;
      linea += `\n  - Disgustos: 👎 ${item.preferencias.dislike.join(', ') || 'ninguno'}`;
    }

    return linea;
  }).join('\n');

  // Calcular totales
  const subtotal = carrito.reduce((sum, item) =>
    sum + (item.precio || 0) * (item.cantidad || 1), 0);

  let totalFinal = subtotal;
  let desgloseTotal = `Subtotal: DOP ${subtotal.toFixed(2)}`;

  // Cargo por envío (días específicos)
  const diaSeleccionado = formData.get('dia');
  const diasConCargo = ['Martes', 'Jueves', 'Sábado'];
  if (diasConCargo.includes(diaSeleccionado)) {
    totalFinal += 100;
    desgloseTotal += `\nEnvío: DOP 100.00`;
  }

  // Cargo de PayPal
  const metodoPago = formData.get('pago');
  if (metodoPago === 'PayPal') {
    const cargoPaypal = totalFinal * 0.10;
    totalFinal += cargoPaypal;
    desgloseTotal += `\nCargo PayPal (10%): DOP ${cargoPaypal.toFixed(2)}`;
  }

  desgloseTotal += `\n*Total a Pagar: DOP ${totalFinal.toFixed(2)}*`;

  // Crear mensaje para WhatsApp
  let mensajeWhatsApp = `
¡Hola Green Dolio! 👋 Quisiera confirmar mi pedido:

*👤 DATOS DEL CLIENTE:*
- Nombre: ${formData.get('nombre')}
- Teléfono: ${formData.get('telefono')}
- Dirección: ${formData.get('direccion')}
- Día de entrega: ${diaSeleccionado}

*🛒 RESUMEN DEL PEDIDO:*
${detallePedido}

*💰 TOTAL:*
${desgloseTotal}

*💳 MÉTODO DE PAGO:*
${metodoPago}

*📝 OBSERVACIONES:*
${formData.get('observaciones') || 'Sin observaciones.'}
  `.trim();

  // Crear objeto del pedido para Firebase
  const pedidoData = {
    userId: user.uid,
    fecha: firebase.firestore.FieldValue.serverTimestamp(),
    cliente: formData.get('nombre'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    diaEntrega: diaSeleccionado,
    observaciones: formData.get('observaciones'),
    metodoPago: metodoPago,
    items: carrito,
    total: totalFinal,
    estado: 'Recibido'
  };

  // Mostrar modal de resumen
  const modalResumen = document.getElementById('modal-resumen');
  document.getElementById('detalle-resumen').innerText = mensajeWhatsApp;
  document.getElementById('total-resumen').innerText = `DOP ${totalFinal.toFixed(2)}`;
  modalResumen.dataset.fullMessage = mensajeWhatsApp;
  modalResumen.classList.remove('hidden');

  // Configurar botón de enviar a WhatsApp
  document.getElementById('enviar-whatsapp').onclick = () => {
    enviarPedidoWhatsApp(pedidoData, modalResumen);
  };
}
```

### 5.4 Envío por WhatsApp y Guardado en Firebase

**Ubicación**: `script.js:935-980`

```javascript
function enviarPedidoWhatsApp(pedidoData, dialog) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Error: Debes iniciar sesión para registrar tu pedido.");
    return;
  }

  const mensajeCompleto = dialog.dataset.fullMessage;
  const numeroWhatsApp = '18493757338';
  const db = firebase.firestore();

  // 1. Abrir WhatsApp inmediatamente
  const mensajeCodificado = encodeURIComponent(mensajeCompleto);
  const url = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
  window.open(url, '_blank');

  // 2. Mostrar mensaje de éxito
  mostrarNotificacion('¡Pedido enviado con éxito! Revisa WhatsApp para confirmar.');

  // 3. Guardar en Firebase en segundo plano
  db.collection("orders").add(pedidoData)
    .then((docRef) => {
      console.log("¡Pedido guardado en Firebase con ID: ", docRef.id);

      // 4. Limpiar interfaz
      dialog.classList.add('hidden');
      document.getElementById('dlg-carrito').close();
      localStorage.setItem('carrito', '[]');
      renderCarrito();
      guardarCarritoEnFirebase();
    })
    .catch((error) => {
      console.error("Error al guardar el pedido en Firebase: ", error);
      mostrarNotificacion("Tu pedido se abrió en WhatsApp, pero hubo un error al guardarlo.");
    });
}
```

---

## 6. ESTRUCTURA DE DATOS

### 6.1 Firebase Firestore

#### Colección: `users`
```javascript
users/{uid}/
{
  displayName: "Juan Pérez",
  email: "juan@gmail.com",
  telefono: "809-123-4567",
  direccion: "Calle Principal #123, Santo Domingo",
  pagoPreferido: "Transferencia",
  likes: "Aguacates, mangos, fresas",
  dislikes: "Repollo, brócoli",
  comoNosConocio: "Instagram",
  fechaCreacion: Timestamp,
  carrito: [
    {
      tipo: 'caja',
      nombre: 'BOX 1 "Caribbean Fresh Pack"',
      precio: 650,
      variedad: 'Mix',
      preferencias: {
        like: ['Banana', 'Piña'],
        dislike: ['Repollo blanco']
      },
      cantidad: 1
    }
  ]
}
```

#### Colección: `orders`
```javascript
orders/{orderId}/
{
  userId: "firebase_user_id",
  fecha: Timestamp,
  cliente: "Juan Pérez",
  telefono: "809-123-4567",
  direccion: "Calle Principal #123, Santo Domingo",
  diaEntrega: "Lunes",
  observaciones: "Sin cebolla por favor",
  metodoPago: "Transferencia",
  items: [
    {
      tipo: 'caja',
      nombre: 'BOX 1 "Caribbean Fresh Pack"',
      precio: 650,
      variedad: 'Mix',
      preferencias: {
        like: ['Banana', 'Piña'],
        dislike: ['Repollo blanco']
      },
      cantidad: 1
    },
    {
      tipo: 'producto',
      nombre: 'Fresas',
      precio: 180,
      cantidad: 2
    }
  ],
  total: 1010,
  estado: 'Recibido'
}
```

### 6.2 LocalStorage

```javascript
// Carrito
localStorage.getItem('carrito')
// => JSON string del array de items

// Idioma
localStorage.getItem('lang')
// => 'es' o 'en'

// Estado del formulario de perfil
localStorage.getItem('profileSetupClosed')
// => '1' si el usuario cerró el formulario
```

### 6.3 Variables Globales (JavaScript)

```javascript
// Perfil del usuario actual
window.userProfile = {
  displayName: "Juan Pérez",
  email: "juan@gmail.com",
  telefono: "809-123-4567",
  direccion: "...",
  pagoPreferido: "Transferencia",
  likes: "...",
  dislikes: "...",
  carrito: [...]
}

// Carrito (redundante con localStorage)
window.carrito = []

// Preferencias temporales durante configuración
window.preferenciasCaja = {
  like: ['Banana', 'Piña'],
  dislike: ['Repollo']
}

// Estado de cada caja durante configuración
const estadoCajas = {
  '1': {
    variedad: 'Mix',
    like: ['Banana', 'Piña'],
    dislike: ['Repollo'],
    ok: true
  }
}

// ID de la caja que se está configurando actualmente
let cajaActual = null // '1', '2', o '3'

// Estado del flujo del carrito
window.estadoFlujoCarrito = "lista" // "lista" o "formulario"
```

---

## 7. FLUJO VISUAL COMPLETO

### 7.1 FLUJO DE LOGIN Y REGISTRO

```
┌─────────────────────────────────────────────┐
│  Usuario hace clic en "Iniciar sesión"     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Popup de Google OAuth                      │
│  - Usuario selecciona cuenta               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Firebase valida credenciales               │
│  - Obtiene: uid, nombre, email, foto       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  onAuthStateChanged se activa               │
│  - Busca documento en Firestore            │
│    users/{uid}                              │
└────────────────┬────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    ¿Existe?          ¿No existe?
         │               │
         │               ▼
         │     ┌─────────────────────────┐
         │     │  USUARIO NUEVO          │
         │     │  - Mostrar formulario   │
         │     │    de perfil            │
         │     └──────────┬──────────────┘
         │                │
         │                ▼
         │     ┌─────────────────────────┐
         │     │  Usuario completa:      │
         │     │  - Teléfono             │
         │     │  - Dirección            │
         │     │  - Pago preferido       │
         │     │  - Cómo nos conoció     │
         │     │  - Gustos (opcional)    │
         │     │  - Disgustos (opcional) │
         │     └──────────┬──────────────┘
         │                │
         │                ▼
         │     ┌─────────────────────────┐
         │     │  Guardar en Firestore   │
         │     │  users/{uid}            │
         │     └──────────┬──────────────┘
         │                │
         └────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  USUARIO RECURRENTE                         │
│  - Cargar perfil: window.userProfile        │
│  - Cargar carrito desde Firebase            │
│  - Sincronizar con localStorage             │
│  - Renderizar carrito                       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Actualizar UI del header                   │
│  - Ocultar botón "Iniciar sesión"          │
│  - Mostrar foto y nombre                    │
│  - Mostrar botón "Salir"                    │
└─────────────────────────────────────────────┘
```

### 7.2 FLUJO DE AGREGAR CAJA AL CARRITO

```
┌─────────────────────────────────────────────┐
│  Usuario ve las 3 cajas disponibles         │
│  - BOX 1 ($650)                             │
│  - BOX 2 ($1,150)                           │
│  - BOX 3 ($1,850)                           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Usuario hace clic en un botón de variedad  │
│  - Mix / Mezcla                             │
│  - Fruitty / Frutas                         │
│  - Veggie / Vegetales                       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  iniciarConfiguracionCaja(btn)              │
│  - Guardar variedad seleccionada            │
│  - Resetear otras cajas                     │
│  - Actualizar UI del botón (verde)          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  abrirConfig(boxId)                         │
│  - Scroll a sección "configurar-caja"       │
│  - Mostrar productos en 3 categorías:       │
│    * Frutas (19 productos)                  │
│    * Vegetales (21 productos)               │
│    * Hierbas (6 productos)                  │
│  - Cada producto tiene botones 👍 / 👎      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Usuario marca productos                    │
│  - Click en 👍 = agregar a "like"           │
│  - Click en 👎 = agregar a "dislike"        │
│  - El producto se resalta visualmente       │
│  - Botón "Guardar" se activa                │
└────────────────┬────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
   "AUTO-MODE"    "Guardar preferencias"
         │               │
         │               ▼
         │     ┌─────────────────────────┐
         │     │  guardarPreferencias()  │
         │     │  - Crear item:          │
         │     │    {                    │
         │     │      tipo: 'caja',      │
         │     │      nombre: '...',     │
         │     │      precio: 650,       │
         │     │      variedad: 'Mix',   │
         │     │      preferencias: {    │
         │     │        like: [...],     │
         │     │        dislike: [...]   │
         │     │      },                 │
         │     │      cantidad: 1        │
         │     │    }                    │
         │     └──────────┬──────────────┘
         │                │
         ▼                │
┌────────────────────────────┐│
│  agregarCajaAutoMode()     ││
│  - Crear item con          ││
│    preferencias vacías     ││
│    y autoMode: true        ││
└─────────────┬──────────────┘│
              │                │
              └────────┬───────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  agregarAlCarrito(item)      │
        │  - Verificar si ya existe    │
        │  - Si existe: cantidad++     │
        │  - Si no: push al array      │
        │  - Guardar en localStorage   │
        │  - Sincronizar con Firebase  │
        │  - Renderizar carrito        │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Notificación de éxito       │
        │  "Caja agregada al carrito"  │
        └──────────────────────────────┘
```

### 7.3 FLUJO DE AGREGAR PRODUCTO INDIVIDUAL

```
┌─────────────────────────────────────────────┐
│  Usuario navega a sección "A la carta"      │
│  o "Agrega a tu pedido"                     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Usuario ve productos individuales          │
│  - Cada producto tiene:                     │
│    * Imagen                                 │
│    * Nombre                                 │
│    * Precio                                 │
│    * Botón "Agregar"                        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Usuario hace clic en "Agregar"             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  agregarAlCarritoDesdeTarjeta(btn)          │
│  - Obtener nombre del producto              │
│  - Obtener precio (parsear texto)           │
│  - Crear item: {                            │
│      tipo: 'producto',                      │
│      nombre: 'Fresas',                      │
│      precio: 180,                           │
│      cantidad: 1                            │
│    }                                        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  agregarAlCarrito(item)                     │
│  (mismo proceso que las cajas)              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Notificación de éxito                      │
│  "Producto agregado al carrito"             │
└─────────────────────────────────────────────┘
```

### 7.4 FLUJO DE REVISAR Y MODIFICAR CARRITO

```
┌─────────────────────────────────────────────┐
│  Usuario hace clic en ícono de carrito      │
│  (en header, muestra cantidad de items)     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Abrir dialog modal del carrito             │
│  - resetCarritoDialog()                     │
│  - renderCarrito()                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Mostrar lista de items en el carrito       │
│  Para cada item:                            │
│  ┌──────────────────────────────────────┐  │
│  │ Nombre del producto/caja             │  │
│  │ Variedad (si es caja)                │  │
│  │ Preferencias like/dislike (si tiene) │  │
│  │ ───────────────────────────────────  │  │
│  │ [−] Cantidad [+]                     │  │
│  │ Precio: DOP X.XX                     │  │
│  │ [Eliminar]                           │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Total: DOP XXX.XX                    │  │
│  │ [Continuar con el pedido]            │  │
│  └──────────────────────────────────────┘  │
└────────────────┬────────────────────────────┘
                 │
         ┌───────┼───────┬───────┐
         │       │       │       │
         ▼       ▼       ▼       ▼
    [Cerrar] [−][+] [Eliminar] [Continuar]
         │       │       │       │
         │       │       │       └──────────┐
         │       │       │                  │
         │       ▼       ▼                  │
         │   cambiar  eliminar              │
         │   Cantidad DelCarrito            │
         │       │       │                  │
         │       ▼       ▼                  │
         │   Actualizar localStorage        │
         │   Sincronizar Firebase           │
         │   renderCarrito()                │
         │                                  │
         └──────────────────────────────────┘
                                 │
                                 ▼
                     handleContinuarPedido()
```

### 7.5 FLUJO DE CHECKOUT COMPLETO

```
┌─────────────────────────────────────────────┐
│  handleContinuarPedido()                    │
│  - Validar pedido mínimo (DOP 500)          │
│    (solo si no hay cajas)                   │
└────────────────┬────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
   Válido           No válido
         │               │
         │               ▼
         │     ┌─────────────────────────┐
         │     │  Mostrar alert:         │
         │     │  "Te faltan DOP X.XX"   │
         │     └─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  mostrarFormularioPedido()                  │
│  - Cargar datos del perfil:                 │
│    * Nombre (user.displayName)              │
│    * Teléfono (profile.telefono)            │
│    * Dirección (profile.direccion)          │
│    * Pago preferido (profile.pagoPreferido) │
│    * Observaciones (profile.likes/dislikes) │
│  - Renderizar formulario pre-llenado        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Usuario revisa/modifica datos              │
│  - Nombre (pre-llenado, editable)           │
│  - Teléfono (pre-llenado, editable)         │
│  - Dirección (pre-llenada, editable)        │
│  - Día de entrega (seleccionar)             │
│    * Lunes/Miércoles/Viernes: Gratis        │
│    * Martes/Jueves/Sábado: +DOP 100         │
│  - Observaciones (pre-llenadas, editables)  │
│  - Método de pago (pre-seleccionado)        │
│    * Cash / Transferencia / PayPal (+10%)   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Usuario hace clic en "Enviar pedido"       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  finalizarPedido(event)                     │
│  1. Validar usuario autenticado             │
│  2. Generar detalle del pedido:             │
│     • Producto 1 (x2) - DOP 360             │
│       - Variedad: Mix                       │
│       - Gustos: 👍 Banana, Piña             │
│       - Disgustos: 👎 Repollo               │
│     • Producto 2 (x1) - DOP 650             │
│  3. Calcular subtotal                       │
│  4. Agregar cargo de envío (si aplica)      │
│  5. Agregar cargo de PayPal (si aplica)     │
│  6. Calcular total final                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Crear mensaje para WhatsApp:               │
│  ┌──────────────────────────────────────┐  │
│  │ ¡Hola Green Dolio! 👋                │  │
│  │ Quisiera confirmar mi pedido:        │  │
│  │                                      │  │
│  │ *👤 DATOS DEL CLIENTE:*              │  │
│  │ - Nombre: Juan Pérez                 │  │
│  │ - Teléfono: 809-123-4567             │  │
│  │ - Dirección: Calle Principal #123    │  │
│  │ - Día de entrega: Lunes              │  │
│  │                                      │  │
│  │ *🛒 RESUMEN DEL PEDIDO:*             │  │
│  │ • BOX 1 (x1) - DOP 650.00            │  │
│  │   - Variedad: Mix                    │  │
│  │   - Gustos: 👍 Banana, Piña          │  │
│  │   - Disgustos: 👎 Repollo            │  │
│  │                                      │  │
│  │ *💰 TOTAL:*                          │  │
│  │ Subtotal: DOP 650.00                 │  │
│  │ *Total a Pagar: DOP 650.00*          │  │
│  │                                      │  │
│  │ *💳 MÉTODO DE PAGO:*                 │  │
│  │ Transferencia                        │  │
│  │                                      │  │
│  │ *📝 OBSERVACIONES:*                  │  │
│  │ Sin cebolla por favor                │  │
│  └──────────────────────────────────────┘  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Crear objeto pedidoData para Firebase:     │
│  {                                          │
│    userId: "firebase_uid",                  │
│    fecha: Timestamp,                        │
│    cliente: "Juan Pérez",                   │
│    telefono: "809-123-4567",                │
│    direccion: "Calle Principal #123",       │
│    diaEntrega: "Lunes",                     │
│    observaciones: "Sin cebolla",            │
│    metodoPago: "Transferencia",             │
│    items: [...],                            │
│    total: 650,                              │
│    estado: 'Recibido'                       │
│  }                                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Mostrar modal de resumen                   │
│  - Mensaje completo (para copiar)           │
│  - Total a pagar                            │
│  - Botones:                                 │
│    [Enviar por WhatsApp]  [Cerrar]          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Usuario hace clic en "Enviar por WhatsApp" │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  enviarPedidoWhatsApp(pedidoData, dialog)   │
│  ┌──────────────────────────────────────┐  │
│  │ 1. Codificar mensaje para URL        │  │
│  │ 2. Abrir WhatsApp inmediatamente     │  │
│  │    window.open(url, '_blank')        │  │
│  │ 3. Mostrar notificación de éxito     │  │
│  │ 4. Guardar en Firebase (async)       │  │
│  │    db.collection("orders").add(...)  │  │
│  │ 5. Limpiar carrito                   │  │
│  │    localStorage.setItem('carrito',[])|  │
│  │ 6. Sincronizar con Firebase          │  │
│  │ 7. Cerrar modales                    │  │
│  │ 8. Renderizar carrito vacío          │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  PROCESO        │
        │  COMPLETO ✓     │
        └────────────────┘
```

### 7.6 FLUJO DE LOGOUT

```
┌─────────────────────────────────────────────┐
│  Usuario hace clic en "Salir"               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  logout()                                   │
│  - firebase.auth().signOut()                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Limpiar datos locales                      │
│  - localStorage.setItem('carrito', '[]')    │
│  - renderCarrito() (mostrar vacío)          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Limpiar carrito en Firebase                │
│  - db.collection("users").doc(uid).update({ │
│      carrito: []                            │
│    })                                       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  onAuthStateChanged se activa               │
│  - user = null                              │
│  - window.userProfile = null                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Actualizar UI                              │
│  - Mostrar botón "Iniciar sesión"           │
│  - Ocultar foto y nombre                    │
│  - Ocultar botón "Salir"                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Mostrar notificación                       │
│  "Has cerrado sesión. ¡Vuelve pronto!"      │
└─────────────────────────────────────────────┘
```

---

## 8. RESUMEN DE ARCHIVOS CLAVE

### 8.1 Archivos Principales
- **index.html**: Estructura HTML de la página (58,741 tokens)
- **script.js**: Lógica de la aplicación (1,334 líneas)
- **firebase.js**: Configuración de Firebase (14 líneas)
- **main.css**: Estilos personalizados

### 8.2 Funciones Críticas a Replicar

#### Autenticación
- `login()` - script.js:16-27
- `logout()` - script.js:30-54
- `auth.onAuthStateChanged()` - script.js:57-99
- `guardarPerfilDeUsuario()` - script.js:1176-1229

#### Carrito
- `agregarAlCarrito()` - script.js:1077-1113
- `renderCarrito()` - script.js:208-311
- `eliminarDelCarrito()` - script.js:313-324
- `cambiarCantidad()` - script.js:326-335
- `guardarCarritoEnFirebase()` - script.js:1122-1133

#### Configuración de Cajas
- `iniciarConfiguracionCaja()` - script.js:1048-1075
- `abrirConfig()` - script.js:338-370
- `marcar()` - script.js:517-532
- `guardarPreferencias()` - script.js:725-762
- `agregarCajaAutoMode()` - script.js:1136-1174

#### Checkout
- `handleContinuarPedido()` - script.js:1030-1046
- `mostrarFormularioPedido()` - script.js:797-932
- `finalizarPedido()` - script.js:1231-1333
- `enviarPedidoWhatsApp()` - script.js:935-980

---

## 9. CONSIDERACIONES PARA LA NUEVA VERSIÓN

### 9.1 Puntos Fuertes a Mantener
1. ✅ Sincronización dual (localStorage + Firebase)
2. ✅ Pre-llenado de formularios con datos del perfil
3. ✅ Validación de pedido mínimo
4. ✅ Cálculo automático de cargos (envío, PayPal)
5. ✅ Integración directa con WhatsApp
6. ✅ Guardado asíncrono en Firebase (no bloquea UX)
7. ✅ Sistema de preferencias detallado para cajas
8. ✅ Modo AUTO para usuarios que no quieren personalizar

### 9.2 Posibles Mejoras
1. 🔄 Separar lógica de negocio de renderizado
2. 🔄 Crear componentes reutilizables
3. 🔄 Mejorar manejo de errores
4. 🔄 Añadir loading states
5. 🔄 Implementar retry logic para Firebase
6. 🔄 Validación de formularios más robusta
7. 🔄 Optimizar sincronización de carrito
8. 🔄 Implementar sistema de notificaciones más avanzado

### 9.3 Datos Críticos a Migrar
- Colección `users` en Firebase
- Colección `orders` en Firebase
- Configuración de Firebase (apiKey, projectId, etc.)
- Número de WhatsApp: `18493757338`
- Precios de cajas: BOX 1 ($650), BOX 2 ($1,150), BOX 3 ($1,850)
- Días con cargo de envío: Martes, Jueves, Sábado (+DOP 100)
- Cargo de PayPal: +10%
- Pedido mínimo: DOP 500 (solo sin cajas)

---

## CONCLUSIÓN

Este reporte documenta el flujo completo de la aplicación Green Dolio, desde la autenticación hasta la finalización del pedido. Toda la lógica está centralizada en `script.js` y utiliza Firebase como backend. El carrito se mantiene sincronizado entre localStorage y Firestore, y el proceso de checkout está optimizado para minimizar fricción, pre-llenando datos del perfil del usuario.

Para replicar este flujo en una nueva versión, se recomienda mantener la misma estructura de datos y flujos de usuario, pero considerar una arquitectura más modular y mantenible.

---

**Generado**: 2026-01-12
**Versión**: 1.0
**Autor**: Análisis del código fuente de GDWeb Publicado 6 Nov copy
