// Este script se asegura de que el carrito de compras se inicialice si no existe.
window.addEventListener('load', () => {
  // Solo inicializa el carrito si no existe
  if (!localStorage.getItem('carrito')) {
    localStorage.setItem('carrito', JSON.stringify([]));
  }

  // Si la función para renderizar el carrito está disponible, la llama para actualizar la interfaz de usuario.
  if (typeof renderCarrito === 'function') {
    renderCarrito();
    console.log('Carrito inicializado para la nueva sesión.');
  }
});
