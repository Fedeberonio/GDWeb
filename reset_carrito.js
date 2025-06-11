// Este script se asegura de que el carrito de compras se reinicie cada vez que un usuario visita la página.
window.addEventListener('load', () => {
  // Elimina cualquier dato del carrito guardado de una sesión anterior en el almacenamiento local.
  localStorage.removeItem('carrito');

  // Vuelve a inicializar el carrito como un array vacío en el almacenamiento local.
  localStorage.setItem('carrito', JSON.stringify([]));

  // Si la función para renderizar el carrito está disponible, la llama para actualizar la interfaz de usuario.
  // Esto asegura que el ícono del carrito muestre '0' al inicio.
  if (typeof renderCarrito === 'function') {
    renderCarrito();
    console.log('Carrito reiniciado para la nueva sesión.');
  }
});
