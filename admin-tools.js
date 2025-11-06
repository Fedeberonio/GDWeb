// ====== HERRAMIENTAS DE ADMINISTRACIÓN ======
// Funciones adicionales para facilitar la gestión de productos

// Función para actualizar precios en lote
function actualizarPreciosEnLote(actualizaciones) {
    const resultados = [];
    let exitosos = 0;
    let fallidos = 0;
    
    actualizaciones.forEach(update => {
        if (actualizarPrecio(update.id, update.nuevoPrecio)) {
            exitosos++;
            resultados.push({ id: update.id, estado: 'exitoso', precio: update.nuevoPrecio });
        } else {
            fallidos++;
            resultados.push({ id: update.id, estado: 'fallido', error: 'Producto no encontrado' });
        }
    });
    
    console.log(`Actualización en lote completada: ${exitosos} exitosos, ${fallidos} fallidos`);
    return { exitosos, fallidos, resultados };
}

// Función para aplicar descuento porcentual a una categoría
function aplicarDescuentoCategoria(categoria, porcentajeDescuento) {
    const productos = getProductosPorCategoria(categoria);
    const actualizaciones = [];
    
    Object.keys(productos).forEach(id => {
        const producto = productos[id];
        const nuevoPrecio = producto.precio * (1 - porcentajeDescuento / 100);
        actualizaciones.push({
            id: id,
            precioOriginal: producto.precio,
            nuevoPrecio: Math.round(nuevoPrecio * 100) / 100
        });
    });
    
    return actualizarPreciosEnLote(actualizaciones);
}

// Función para aplicar inflación a todos los productos
function aplicarInflacion(porcentajeInflacion) {
    const todos = getAllProductos();
    const actualizaciones = [];
    
    todos.forEach(producto => {
        const nuevoPrecio = producto.precio * (1 + porcentajeInflacion / 100);
        actualizaciones.push({
            id: producto.id,
            precioOriginal: producto.precio,
            nuevoPrecio: Math.round(nuevoPrecio * 100) / 100
        });
    });
    
    return actualizarPreciosEnLote(actualizaciones);
}

// Función para generar reporte de productos
function generarReporteProductos() {
    const todos = getAllProductos();
    const reporte = {
        fecha: new Date().toISOString(),
        totalProductos: todos.length,
        valorTotal: todos.reduce((sum, p) => sum + (p.precio || 0), 0),
        porCategoria: {},
        productosSinPrecio: [],
        productosSinImagen: []
    };
    
    // Agrupar por categoría
    todos.forEach(producto => {
        if (!reporte.porCategoria[producto.categoria]) {
            reporte.porCategoria[producto.categoria] = {
                cantidad: 0,
                valorTotal: 0,
                productos: []
            };
        }
        
        reporte.porCategoria[producto.categoria].cantidad++;
        reporte.porCategoria[producto.categoria].valorTotal += producto.precio || 0;
        reporte.porCategoria[producto.categoria].productos.push({
            id: producto.id,
            nombre: producto.nombre.es,
            precio: producto.precio
        });
        
        // Verificar problemas
        if (!producto.precio || producto.precio === 0) {
            reporte.productosSinPrecio.push(producto.id);
        }
        if (!producto.imagen) {
            reporte.productosSinImagen.push(producto.id);
        }
    });
    
    return reporte;
}

// Función para validar integridad de datos
function validarIntegridadProductos() {
    const todos = getAllProductos();
    const errores = [];
    const advertencias = [];
    
    todos.forEach(producto => {
        // Verificar campos requeridos
        if (!producto.id) errores.push(`${producto.id}: Falta ID`);
        if (!producto.nombre?.es) errores.push(`${producto.id}: Falta nombre en español`);
        if (!producto.nombre?.en) errores.push(`${producto.id}: Falta nombre en inglés`);
        if (producto.precio === undefined || producto.precio === null) errores.push(`${producto.id}: Falta precio`);
        
        // Verificar tipos de datos
        if (producto.precio && typeof producto.precio !== 'number') errores.push(`${producto.id}: Precio debe ser número`);
        if (producto.precio && producto.precio < 0) errores.push(`${producto.id}: Precio no puede ser negativo`);
        
        // Advertencias
        if (!producto.imagen) advertencias.push(`${producto.id}: Sin imagen`);
        if (producto.precio === 0) advertencias.push(`${producto.id}: Precio en cero`);
        if (producto.precio > 10000) advertencias.push(`${producto.id}: Precio muy alto (${producto.precio})`);
    });
    
    return { errores, advertencias, totalProductos: todos.length };
}

// Función para crear backup de configuración
function crearBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        config: PRODUCTOS_CONFIG,
        metadata: {
            version: '1.0',
            totalProductos: getAllProductos().length,
            categorias: Object.keys(PRODUCTOS_CONFIG).length
        }
    };
    
    return backup;
}

// Función para restaurar desde backup
function restaurarDesdeBackup(backup) {
    try {
        if (!backup.config || !backup.timestamp) {
            throw new Error('Formato de backup inválido');
        }
        
        // Limpiar configuración actual
        Object.keys(PRODUCTOS_CONFIG).forEach(categoria => {
            delete PRODUCTOS_CONFIG[categoria];
        });
        
        // Restaurar configuración
        Object.assign(PRODUCTOS_CONFIG, backup.config);
        
        console.log(`Backup restaurado desde: ${backup.timestamp}`);
        return true;
    } catch (error) {
        console.error('Error al restaurar backup:', error);
        return false;
    }
}

// Función para sincronizar con Firebase (si está disponible)
async function sincronizarConFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase no está disponible');
        return false;
    }
    
    try {
        const db = firebase.firestore();
        const config = PRODUCTOS_CONFIG;
        
        // Guardar en Firebase
        await db.collection('configuracion').doc('productos').set({
            config: config,
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
            version: '1.0'
        });
        
        console.log('Configuración sincronizada con Firebase');
        return true;
    } catch (error) {
        console.error('Error al sincronizar con Firebase:', error);
        return false;
    }
}

// Función para cargar desde Firebase
async function cargarDesdeFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase no está disponible');
        return false;
    }
    
    try {
        const db = firebase.firestore();
        const doc = await db.collection('configuracion').doc('productos').get();
        
        if (doc.exists) {
            const data = doc.data();
            Object.assign(PRODUCTOS_CONFIG, data.config);
            console.log('Configuración cargada desde Firebase');
            return true;
        } else {
            console.log('No hay configuración guardada en Firebase');
            return false;
        }
    } catch (error) {
        console.error('Error al cargar desde Firebase:', error);
        return false;
    }
}

// Función para generar plantilla de productos
function generarPlantillaProductos() {
    const plantilla = {
        id: 'nuevoProducto',
        nombre: {
            es: 'Nombre en Español',
            en: 'Name in English'
        },
        precio: 0,
        imagen: 'assets/images/products/producto.jpg',
        categoria: 'categoria',
        descripcion: {
            es: 'Descripción en español',
            en: 'Description in English'
        }
    };
    
    return plantilla;
}

// Función para duplicar producto
function duplicarProducto(idOriginal, nuevoId) {
    const productoOriginal = getProducto(idOriginal);
    if (!productoOriginal) {
        console.error('Producto original no encontrado');
        return false;
    }
    
    const productoDuplicado = JSON.parse(JSON.stringify(productoOriginal));
    productoDuplicado.id = nuevoId;
    productoDuplicado.nombre.es = `${productoOriginal.nombre.es} (Copia)`;
    productoDuplicado.nombre.en = `${productoOriginal.nombre.en} (Copy)`;
    
    agregarProducto(productoOriginal.categoria, nuevoId, productoDuplicado);
    console.log(`Producto duplicado: ${idOriginal} -> ${nuevoId}`);
    return true;
}

// Función para mover producto entre categorías
function moverProducto(id, nuevaCategoria) {
    const producto = getProducto(id);
    if (!producto) {
        console.error('Producto no encontrado');
        return false;
    }
    
    // Eliminar de categoría actual
    eliminarProducto(id);
    
    // Agregar a nueva categoría
    producto.categoria = nuevaCategoria;
    agregarProducto(nuevaCategoria, id, producto);
    
    console.log(`Producto movido: ${id} -> ${nuevaCategoria}`);
    return true;
}

// Función para buscar productos por texto
function buscarProductos(texto) {
    const todos = getAllProductos();
    const busqueda = texto.toLowerCase();
    
    return todos.filter(producto => 
        producto.nombre.es.toLowerCase().includes(busqueda) ||
        producto.nombre.en.toLowerCase().includes(busqueda) ||
        producto.id.toLowerCase().includes(busqueda) ||
        (producto.descripcion?.es && producto.descripcion.es.toLowerCase().includes(busqueda)) ||
        (producto.descripcion?.en && producto.descripcion.en.toLowerCase().includes(busqueda))
    );
}

// Función para obtener estadísticas avanzadas
function obtenerEstadisticasAvanzadas() {
    const todos = getAllProductos();
    const stats = {
        totalProductos: todos.length,
        valorTotal: todos.reduce((sum, p) => sum + (p.precio || 0), 0),
        precioPromedio: 0,
        precioMinimo: Infinity,
        precioMaximo: 0,
        porCategoria: {},
        productosSinPrecio: 0,
        productosSinImagen: 0
    };
    
    if (todos.length > 0) {
        stats.precioPromedio = stats.valorTotal / todos.length;
    }
    
    todos.forEach(producto => {
        // Estadísticas de precios
        if (producto.precio) {
            stats.precioMinimo = Math.min(stats.precioMinimo, producto.precio);
            stats.precioMaximo = Math.max(stats.precioMaximo, producto.precio);
        } else {
            stats.productosSinPrecio++;
        }
        
        // Estadísticas por categoría
        if (!stats.porCategoria[producto.categoria]) {
            stats.porCategoria[producto.categoria] = {
                cantidad: 0,
                valorTotal: 0,
                precioPromedio: 0
            };
        }
        
        stats.porCategoria[producto.categoria].cantidad++;
        stats.porCategoria[producto.categoria].valorTotal += producto.precio || 0;
        
        // Verificar imagen
        if (!producto.imagen) {
            stats.productosSinImagen++;
        }
    });
    
    // Calcular promedios por categoría
    Object.keys(stats.porCategoria).forEach(categoria => {
        const cat = stats.porCategoria[categoria];
        cat.precioPromedio = cat.cantidad > 0 ? cat.valorTotal / cat.cantidad : 0;
    });
    
    if (stats.precioMinimo === Infinity) stats.precioMinimo = 0;
    
    return stats;
}

// Exportar funciones si estamos en Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        actualizarPreciosEnLote,
        aplicarDescuentoCategoria,
        aplicarInflacion,
        generarReporteProductos,
        validarIntegridadProductos,
        crearBackup,
        restaurarDesdeBackup,
        sincronizarConFirebase,
        cargarDesdeFirebase,
        generarPlantillaProductos,
        duplicarProducto,
        moverProducto,
        buscarProductos,
        obtenerEstadisticasAvanzadas
    };
} 