# 🛒 Sistema de Administración de Productos - Green Dolio

## 📋 Descripción General

Este sistema permite gestionar de forma centralizada todos los productos, precios y configuraciones de la tienda Green Dolio. Está diseñado para facilitar las actualizaciones periódicas de productos y precios sin necesidad de modificar código HTML.

## 🚀 Características Principales

- ✅ **Gestión centralizada** de productos y precios
- ✅ **Panel de administración** visual e intuitivo
- ✅ **Actualización en tiempo real** de precios
- ✅ **Soporte multiidioma** (Español/Inglés)
- ✅ **Backup y restauración** de configuraciones
- ✅ **Validación de integridad** de datos
- ✅ **Reportes y estadísticas** avanzadas
- ✅ **Sincronización con Firebase** (opcional)

## 📁 Estructura de Archivos

```
├── products.js              # Configuración centralizada de productos
├── admin-panel.html         # Panel de administración visual
├── admin-tools.js           # Herramientas adicionales de administración
├── script.js               # Lógica principal de la tienda
├── index.html              # Página principal de la tienda
└── README-ADMIN.md         # Este archivo
```

## 🛠️ Instalación y Configuración

### 1. Incluir archivos en el proyecto

Agrega los siguientes scripts a tu `index.html`:

```html
<!-- Después de firebase.js -->
<script src="products.js"></script>
<script src="admin-tools.js"></script>
```

### 2. Acceder al panel de administración

Abre `admin-panel.html` en tu navegador para acceder al panel de administración.

## 📊 Uso del Sistema

### Panel de Administración

1. **Abrir el panel**: Navega a `admin-panel.html`
2. **Ver productos**: Todos los productos se muestran en tarjetas
3. **Editar precios**: Haz clic en el campo de precio y actualiza
4. **Agregar productos**: Usa el botón "Agregar Producto"
5. **Buscar productos**: Usa la barra de búsqueda
6. **Filtrar por categoría**: Usa el selector de categorías

### Funciones Principales

#### 🔍 Buscar Productos
```javascript
// Buscar por nombre, ID o descripción
const resultados = buscarProductos('aguacate');
```

#### 💰 Actualizar Precios
```javascript
// Actualizar precio individual
actualizarPrecio('aguacate', 120);

// Actualizar precios en lote
const actualizaciones = [
    { id: 'aguacate', nuevoPrecio: 120 },
    { id: 'banana', nuevoPrecio: 15 }
];
actualizarPreciosEnLote(actualizaciones);
```

#### 📈 Aplicar Cambios Masivos
```javascript
// Aplicar inflación del 5% a todos los productos
aplicarInflacion(5);

// Aplicar descuento del 10% a una categoría
aplicarDescuentoCategoria('frutas', 10);
```

#### 📊 Generar Reportes
```javascript
// Reporte completo de productos
const reporte = generarReporteProductos();

// Estadísticas avanzadas
const stats = obtenerEstadisticasAvanzadas();

// Validar integridad de datos
const validacion = validarIntegridadProductos();
```

## 🗂️ Estructura de Productos

### Formato de Producto
```javascript
{
    id: 'identificadorUnico',
    nombre: {
        es: 'Nombre en Español',
        en: 'Name in English'
    },
    precio: 100.00,
    imagen: 'assets/images/products/producto.jpg',
    categoria: 'frutas',
    descripcion: {
        es: 'Descripción en español',
        en: 'Description in English'
    }
}
```

### Categorías Disponibles
- `cajas` - Cajas de productos
- `productosElaborados` - Productos elaborados
- `jugos` - Jugos naturales
- `productosCampo` - Productos de campo
- `otros` - Otros productos
- `frutas` - Frutas (a la carta)
- `vegetales` - Vegetales (a la carta)

## 🔧 Funciones de Administración

### Gestión de Productos

```javascript
// Obtener producto por ID
const producto = getProducto('aguacate');

// Obtener productos por categoría
const frutas = getProductosPorCategoria('frutas');

// Agregar nuevo producto
agregarProducto('frutas', 'nuevaFruta', {
    id: 'nuevaFruta',
    nombre: { es: 'Nueva Fruta', en: 'New Fruit' },
    precio: 50,
    imagen: 'assets/images/products/nueva-fruta.jpg',
    categoria: 'frutas'
});

// Eliminar producto
eliminarProducto('productoId');

// Duplicar producto
duplicarProducto('originalId', 'nuevoId');

// Mover producto entre categorías
moverProducto('productoId', 'nuevaCategoria');
```

### Backup y Restauración

```javascript
// Crear backup
const backup = crearBackup();

// Restaurar desde backup
restaurarDesdeBackup(backup);

// Exportar configuración
const configJSON = exportarConfiguracion();

// Importar configuración
importarConfiguracion(configJSON);
```

### Sincronización con Firebase

```javascript
// Sincronizar con Firebase
await sincronizarConFirebase();

// Cargar desde Firebase
await cargarDesdeFirebase();
```

## 📋 Flujo de Trabajo Recomendado

### Actualización Semanal de Precios

1. **Abrir el panel de administración**
2. **Revisar productos sin precio** (se muestran en rojo)
3. **Actualizar precios individuales** o usar actualización en lote
4. **Validar integridad** de los datos
5. **Generar reporte** de cambios
6. **Crear backup** antes de publicar
7. **Sincronizar con Firebase** (si está configurado)

### Agregar Nuevos Productos

1. **Preparar imagen** del producto
2. **Usar el botón "Agregar Producto"**
3. **Completar todos los campos** requeridos
4. **Verificar traducciones** (español e inglés)
5. **Guardar producto**
6. **Validar que aparece** en la tienda

## ⚠️ Validaciones y Errores Comunes

### Validaciones Automáticas
- ✅ Precios deben ser números positivos
- ✅ Nombres en español e inglés son obligatorios
- ✅ IDs deben ser únicos
- ✅ Categorías deben ser válidas

### Errores Comunes
- ❌ **Precio negativo**: No se permite
- ❌ **ID duplicado**: Causa conflictos
- ❌ **Imagen inexistente**: Se muestra imagen por defecto
- ❌ **Categoría inválida**: Producto no aparece

## 🔍 Troubleshooting

### Problema: Productos no aparecen en la tienda
**Solución**: Verificar que el archivo `products.js` esté incluido en `index.html`

### Problema: Precios no se actualizan
**Solución**: Verificar que la función `actualizarPrecio()` esté disponible

### Problema: Panel de administración no carga
**Solución**: Verificar que todos los archivos JS estén en la misma carpeta

### Problema: Imágenes no se muestran
**Solución**: Verificar rutas de imágenes y que los archivos existan

## 📈 Reportes y Estadísticas

### Reporte Básico
```javascript
const reporte = generarReporteProductos();
console.log(`Total productos: ${reporte.totalProductos}`);
console.log(`Valor total: DOP ${reporte.valorTotal}`);
```

### Estadísticas Avanzadas
```javascript
const stats = obtenerEstadisticasAvanzadas();
console.log(`Precio promedio: DOP ${stats.precioPromedio}`);
console.log(`Precio mínimo: DOP ${stats.precioMinimo}`);
console.log(`Precio máximo: DOP ${stats.precioMaximo}`);
```

## 🔐 Seguridad

### Recomendaciones
- ✅ Hacer backup antes de cambios masivos
- ✅ Validar datos antes de publicar
- ✅ Usar IDs únicos para productos
- ✅ Verificar precios antes de actualizar

### Backup Automático
El sistema permite crear backups automáticos antes de cambios importantes.

## 📞 Soporte

### Comandos Útiles en Consola

```javascript
// Ver todos los productos
console.log(getAllProductos());

// Ver estadísticas
console.log(obtenerEstadisticasAvanzadas());

// Validar datos
console.log(validarIntegridadProductos());

// Crear backup
console.log(crearBackup());
```

### Logs del Sistema
El sistema registra todas las operaciones en la consola del navegador para facilitar el debugging.

## 🚀 Próximas Mejoras

- [ ] **Interfaz de usuario mejorada**
- [ ] **Sistema de versionado** de productos
- [ ] **Historial de cambios** de precios
- [ ] **Notificaciones automáticas** de cambios
- [ ] **API REST** para integración externa
- [ ] **Dashboard con gráficos** de ventas
- [ ] **Sistema de inventario** automático

---

## 📝 Notas Importantes

1. **Siempre hacer backup** antes de cambios importantes
2. **Validar datos** antes de publicar
3. **Mantener IDs únicos** para evitar conflictos
4. **Verificar traducciones** en ambos idiomas
5. **Probar cambios** en un entorno de desarrollo primero

---

**Desarrollado para Green Dolio** 🌱  
*Sistema de gestión de productos y precios* 