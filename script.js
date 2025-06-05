function enviarPedido() {
    const boxSeleccionada = document.querySelector('input[name="box"]:checked');
    if (!boxSeleccionada) {
      alert("Por favor, selecciona una opción de Box antes de hacer el pedido.");
      return;
    }
    const box = boxSeleccionada.value;
  
    const productos = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map(el => el.value)
      .join(", ");
  
    const notas = document.getElementById("notas").value;
  
    const mensaje = `Hola! Quiero hacer un pedido de ${box}. Mis productos preferidos son: ${productos}. Notas: ${notas}`;
    const mensajeEncoded = encodeURIComponent(mensaje);
  
    const numero = "18493757338"; // Tu número de WhatsApp en formato internacional sin símbolos
  
    window.open(`https://wa.me/${numero}?text=${mensajeEncoded}`, "_blank");
  }
  
// Parallax para el banner principal
window.addEventListener('scroll', function() {
  const banner = document.querySelector('.parallax-banner');
  if (banner) {
    const scrolled = window.scrollY;
    banner.style.transform = `translateY(${scrolled * 0.3}px)`;
  }
});
  
// Wizard de pedido online
(function() {
  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4')
  ];
  let currentStep = 0;

  function showStep(n) {
    steps.forEach((step, i) => step.classList.toggle('hidden', i !== n));
    currentStep = n;
  }

  // Paso 1 -> 2
  document.getElementById('next-1').onclick = function() {
    const box = document.querySelector('input[name="box"]:checked');
    if (!box) { alert('Selecciona una caja para continuar.'); return; }
    showStep(1);
  };
  // Paso 2 -> 3
  document.getElementById('next-2').onclick = function() {
    showStep(2);
  };
  // Paso 3 -> 4
  document.getElementById('next-3').onclick = function() {
    const nombre = document.getElementById('nombre').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const zona = document.getElementById('zona').value;
    const dia = document.getElementById('dia').value;
    if (!nombre || !whatsapp || !direccion || !zona || !dia) {
      alert('Completa todos los datos obligatorios.');
      return;
    }
    // Mostrar resumen
    const box = document.querySelector('input[name="box"]:checked').value;
    const extras = Array.from(document.querySelectorAll('input[name="extra"]:checked')).map(e => e.value);
    let resumen = `<b>Caja:</b> ${box}<br>`;
    if (extras.length) resumen += `<b>Extras:</b> ${extras.join(', ')}<br>`;
    resumen += `<b>Nombre:</b> ${nombre}<br>`;
    resumen += `<b>WhatsApp:</b> ${whatsapp}<br>`;
    resumen += `<b>Dirección:</b> ${direccion}<br>`;
    resumen += `<b>Zona:</b> ${zona}<br>`;
    resumen += `<b>Día:</b> ${dia}<br>`;
    document.getElementById('resumen-pedido').innerHTML = resumen;
    showStep(3);
  };
  // Botones atrás
  document.getElementById('back-2').onclick = function() { showStep(0); };
  document.getElementById('back-3').onclick = function() { showStep(1); };
  document.getElementById('back-4').onclick = function() { showStep(2); };
  // Enviar pedido por WhatsApp
  document.getElementById('enviar-pedido').onclick = function() {
    const box = document.querySelector('input[name="box"]:checked').value;
    const extras = Array.from(document.querySelectorAll('input[name="extra"]:checked')).map(e => e.value);
    const nombre = document.getElementById('nombre').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const email = document.getElementById('email').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const zona = document.getElementById('zona').value;
    const dia = document.getElementById('dia').value;
    let mensaje = `¡Hola! Quiero pedir la caja: ${box}`;
    if (extras.length) mensaje += `\nExtras: ${extras.join(', ')}`;
    mensaje += `\nNombre: ${nombre}`;
    mensaje += `\nWhatsApp: ${whatsapp}`;
    if (email) mensaje += `\nEmail: ${email}`;
    mensaje += `\nDirección: ${direccion}`;
    mensaje += `\nZona: ${zona}`;
    mensaje += `\nDía de entrega: ${dia}`;
    const url = `https://wa.me/18493757338?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };
  // Mostrar primer paso al cargar
  showStep(0);
})();
  