# 🛒 Instrucciones de Uso - Sistema de Productos Dinámicos

## ✅ ¿Qué hemos solucionado?

**Problema anterior:** Los productos estaban hardcodeados en el HTML, por lo que cambiar precios requería editar código.

**Solución:** Ahora todos los productos se cargan dinámicamente desde el archivo `products.js`, lo que permite cambiar precios y productos sin tocar el HTML.

## 🚀 Cómo usar el sistema

### 1. **Cambiar Precios (FÁCIL)**

#### Opción A: Usando el Panel de Administración
1. Abre `admin-panel.html` en tu navegador
2. Busca el producto que quieres cambiar
3. Haz clic en "Editar"
4. Cambia el precio
5. Guarda los cambios
6. Recarga la página principal (`index.html`)

#### Opción B: Editando directamente el archivo
1. Abre `products.js` en tu editor
2. Busca el producto (ej: "aguacate")
3. Cambia el valor de `precio: 100` a `precio: 150`
4. Guarda el archivo
5. Recarga la página principal

### 2. **Agregar Nuevos Productos**

#### Usando el Panel de Administración (RECOMENDADO)
1. Abre `admin-panel.html`
2. Haz clic en "Agregar Producto"
3. Completa los datos:
   - **ID:** Nombre único (ej: "nuevoProducto")
   - **Nombre ES:** Nombre en español
   - **Nombre EN:** Nombre en inglés
   - **Precio:** Precio en DOP
   - **Categoría:** frutas, verduras, hierbas, etc.
   - **Imagen:** Ruta de la imagen
4. Guarda el producto
5. Recarga la página principal

### 3. **Verificar que los cambios funcionan**

#### Usando el archivo de prueba
1. Abre `test-sistema.html` en tu navegador
2. Verifica que:
   - El número total de productos es correcto
   - Los precios se muestran correctamente
   - Las categorías están bien organizadas

#### Usando la consola del navegador
1. Abre `index.html`
2. Presiona **F12** para abrir las herramientas de desarrollador
3. Ve a la pestaña **Console**
4. Escribe estos comandos:
   ```javascript
   // Ver todos los productos
   console.log(getAllProductos());
   
   // Ver un producto específico
   console.log(getProducto('aguacate'));
   
   // Ver productos por categoría
   console.log(getProductosPorCategoria('frutas'));
   ```

## 📁 Archivos importantes

- **`index.html`** - Página principal de la tienda
- **`products.js`** - Configuración central de productos
- **`admin-panel.html`** - Panel para gestionar productos
- **`admin-tools.js`** - Herramientas adicionales
- **`test-sistema.html`** - Página de prueba del sistema

## 🔧 Funciones útiles disponibles

### Cambiar precios
```javascript
actualizarPrecio('aguacate', 150); // Cambia precio del aguacate a 150
```

### Agregar productos
```javascript
agregarProducto('frutas', 'nuevoProducto', {
    id: 'nuevoProducto',
    nombre: { es: 'Nuevo Producto', en: 'New Product' },
    precio: 100,
    imagen: 'assets/images/products/nuevo.jpg',
    categoria: 'frutas'
});
```

### Buscar productos
```javascript
const resultados = buscarProductos('aguacate');
console.log(resultados);
```

### Generar reportes
```javascript
const reporte = generarReporteProductos();
console.log(reporte);
```

## 🎯 Flujo de trabajo recomendado

1. **Para cambios semanales de precios:**
   - Usa el panel de administración
   - Cambia los precios necesarios
   - Guarda los cambios
   - Recarga la página principal

2. **Para agregar nuevos productos:**
   - Prepara la imagen del producto
   - Usa el panel de administración
   - Completa todos los datos
   - Verifica que aparece en la tienda

3. **Para mantenimiento:**
   - Usa `test-sistema.html` para verificar el estado
   - Revisa la consola del navegador para errores
   - Haz respaldos regulares del archivo `products.js`

## ⚠️ Consejos importantes

1. **Siempre haz respaldos** antes de hacer cambios importantes
2. **Verifica los cambios** recargando la página después de cada modificación
3. **Usa IDs únicos** para cada producto
4. **Mantén las imágenes** en la carpeta `assets/images/products/`
5. **Prueba en ambos idiomas** (español e inglés)

## 🆘 Solución de problemas

### Los cambios no se ven reflejados
- Recarga la página (F5)
- Limpia la caché del navegador (Ctrl+F5)
- Verifica que el archivo `products.js` se guardó correctamente

### Los productos no aparecen
- Verifica que el archivo `products.js` está incluido en `index.html`
- Revisa la consola del navegador para errores
- Asegúrate de que las categorías coinciden con los `data-categoria` del HTML

### Error en la consola
- Verifica que todos los archivos JavaScript están cargados
- Revisa que no hay errores de sintaxis en `products.js`
- Asegúrate de que las rutas de las imágenes son correctas

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Usa `test-sistema.html` para diagnosticar
3. Verifica que todos los archivos están en su lugar
4. Haz una copia de seguridad antes de hacer cambios grandes

---

**¡El sistema está listo para usar! 🎉** 