// ====== EJEMPLOS DE USO DEL SISTEMA DE ADMINISTRACIÓN ======
// Este archivo contiene ejemplos prácticos de cómo usar el sistema

console.log('🌱 Sistema de Administración Green Dolio - Ejemplos de Uso');

// ====== EJEMPLO 1: ACTUALIZACIÓN SEMANAL DE PRECIOS ======
function ejemploActualizacionSemanal() {
    console.log('\n📅 EJEMPLO 1: Actualización Semanal de Precios');
    
    // 1. Verificar productos sin precio
    const validacion = validarIntegridadProductos();
    console.log('Productos sin precio:', validacion.advertencias.filter(w => w.includes('Precio en cero')));
    
    // 2. Aplicar inflación del 3% a todos los productos
    const resultadoInflacion = aplicarInflacion(3);
    console.log(`Inflación aplicada: ${resultadoInflacion.exitosos} productos actualizados`);
    
    // 3. Aplicar descuento especial a frutas (5%)
    const resultadoDescuento = aplicarDescuentoCategoria('frutas', 5);
    console.log(`Descuento en frutas: ${resultadoDescuento.exitosos} productos actualizados`);
    
    // 4. Generar reporte de cambios
    const reporte = generarReporteProductos();
    console.log('Reporte generado:', reporte);
    
    // 5. Crear backup
    const backup = crearBackup();
    console.log('Backup creado:', backup.timestamp);
}

// ====== EJEMPLO 2: AGREGAR NUEVOS PRODUCTOS ======
function ejemploAgregarProductos() {
    console.log('\n🆕 EJEMPLO 2: Agregar Nuevos Productos');
    
    // Agregar nueva fruta
    const nuevaFruta = {
        id: 'guayaba',
        nombre: {
            es: 'Guayaba',
            en: 'Guava'
        },
        precio: 45,
        imagen: 'assets/images/products/Guayaba.jpg',
        categoria: 'frutas',
        descripcion: {
            es: 'Guayaba fresca y dulce',
            en: 'Fresh and sweet guava'
        }
    };
    
    agregarProducto('frutas', 'guayaba', nuevaFruta);
    console.log('Nueva fruta agregada: Guayaba');
    
    // Agregar nuevo jugo
    const nuevoJugo = {
        id: 'jugoVerde',
        nombre: {
            es: 'Jugo Verde Detox',
            en: 'Green Detox Juice'
        },
        precio: 200,
        imagen: 'assets/images/products/jugo-verde.jpg',
        categoria: 'jugos',
        descripcion: {
            es: 'Espinaca, manzana, limón y jengibre',
            en: 'Spinach, apple, lemon and ginger'
        }
    };
    
    agregarProducto('jugos', 'jugoVerde', nuevoJugo);
    console.log('Nuevo jugo agregado: Jugo Verde Detox');
}

// ====== EJEMPLO 3: GESTIÓN DE INVENTARIO ======
function ejemploGestionInventario() {
    console.log('\n📦 EJEMPLO 3: Gestión de Inventario');
    
    // 1. Obtener estadísticas
    const stats = obtenerEstadisticasAvanzadas();
    console.log('Estadísticas del inventario:', {
        totalProductos: stats.totalProductos,
        valorTotal: `DOP ${stats.valorTotal.toLocaleString()}`,
        precioPromedio: `DOP ${stats.precioPromedio.toFixed(2)}`,
        precioMinimo: `DOP ${stats.precioMinimo}`,
        precioMaximo: `DOP ${stats.precioMaximo}`
    });
    
    // 2. Buscar productos específicos
    const productosAguacate = buscarProductos('aguacate');
    console.log('Productos con "aguacate":', productosAguacate.map(p => p.nombre.es));
    
    // 3. Mover producto entre categorías
    moverProducto('aguacate', 'vegetales');
    console.log('Aguacate movido a categoría vegetales');
    
    // 4. Duplicar producto
    duplicarProducto('banana', 'bananaOrganica');
    console.log('Banana duplicada como orgánica');
}

// ====== EJEMPLO 4: VALIDACIÓN Y LIMPIEZA ======
function ejemploValidacionLimpieza() {
    console.log('\n🔍 EJEMPLO 4: Validación y Limpieza');
    
    // 1. Validar integridad
    const validacion = validarIntegridadProductos();
    console.log('Errores encontrados:', validacion.errores.length);
    console.log('Advertencias:', validacion.advertencias.length);
    
    // 2. Corregir productos sin precio
    const productosSinPrecio = getAllProductos().filter(p => !p.precio || p.precio === 0);
    productosSinPrecio.forEach(producto => {
        console.log(`Asignando precio por defecto a ${producto.nombre.es}`);
        actualizarPrecio(producto.id, 50); // Precio por defecto
    });
    
    // 3. Verificar productos sin imagen
    const productosSinImagen = getAllProductos().filter(p => !p.imagen);
    console.log('Productos sin imagen:', productosSinImagen.map(p => p.nombre.es));
}

// ====== EJEMPLO 5: BACKUP Y RESTAURACIÓN ======
function ejemploBackupRestauracion() {
    console.log('\n💾 EJEMPLO 5: Backup y Restauración');
    
    // 1. Crear backup
    const backup = crearBackup();
    console.log('Backup creado:', backup.timestamp);
    
    // 2. Exportar configuración
    const configJSON = exportarConfiguracion();
    console.log('Configuración exportada (primeros 100 caracteres):', configJSON.substring(0, 100) + '...');
    
    // 3. Simular restauración (comentado para evitar cambios accidentales)
    // restaurarDesdeBackup(backup);
    // console.log('Backup restaurado');
}

// ====== EJEMPLO 6: SINCRONIZACIÓN CON FIREBASE ======
async function ejemploSincronizacionFirebase() {
    console.log('\n☁️ EJEMPLO 6: Sincronización con Firebase');
    
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.log('Firebase no está disponible en este entorno');
        return;
    }
    
    try {
        // 1. Sincronizar con Firebase
        const resultadoSync = await sincronizarConFirebase();
        console.log('Sincronización exitosa:', resultadoSync);
        
        // 2. Cargar desde Firebase
        const resultadoCarga = await cargarDesdeFirebase();
        console.log('Carga desde Firebase exitosa:', resultadoCarga);
        
    } catch (error) {
        console.error('Error en sincronización:', error);
    }
}

// ====== EJEMPLO 7: REPORTES AVANZADOS ======
function ejemploReportesAvanzados() {
    console.log('\n📊 EJEMPLO 7: Reportes Avanzados');
    
    // 1. Reporte por categoría
    const reporte = generarReporteProductos();
    Object.keys(reporte.porCategoria).forEach(categoria => {
        const cat = reporte.porCategoria[categoria];
        console.log(`${categoria}: ${cat.cantidad} productos, DOP ${cat.valorTotal.toLocaleString()}`);
    });
    
    // 2. Productos más caros
    const todos = getAllProductos();
    const masCaros = todos
        .filter(p => p.precio)
        .sort((a, b) => b.precio - a.precio)
        .slice(0, 5);
    
    console.log('Productos más caros:');
    masCaros.forEach((producto, index) => {
        console.log(`${index + 1}. ${producto.nombre.es}: DOP ${producto.precio}`);
    });
    
    // 3. Productos más baratos
    const masBaratos = todos
        .filter(p => p.precio)
        .sort((a, b) => a.precio - b.precio)
        .slice(0, 5);
    
    console.log('Productos más baratos:');
    masBaratos.forEach((producto, index) => {
        console.log(`${index + 1}. ${producto.nombre.es}: DOP ${producto.precio}`);
    });
}

// ====== EJEMPLO 8: ACTUALIZACIÓN EN LOTE ======
function ejemploActualizacionLote() {
    console.log('\n🔄 EJEMPLO 8: Actualización en Lote');
    
    // Simular actualización de precios de proveedor
    const actualizaciones = [
        { id: 'aguacate', nuevoPrecio: 120 },
        { id: 'banana', nuevoPrecio: 15 },
        { id: 'mango', nuevoPrecio: 45 },
        { id: 'pina', nuevoPrecio: 85 },
        { id: 'fresas', nuevoPrecio: 150 }
    ];
    
    const resultado = actualizarPreciosEnLote(actualizaciones);
    console.log(`Actualización en lote: ${resultado.exitosos} exitosos, ${resultado.fallidos} fallidos`);
    
    // Mostrar resultados detallados
    resultado.resultados.forEach(r => {
        if (r.estado === 'exitoso') {
            console.log(`✅ ${r.id}: DOP ${r.precio}`);
        } else {
            console.log(`❌ ${r.id}: ${r.error}`);
        }
    });
}

// ====== FUNCIÓN PRINCIPAL PARA EJECUTAR TODOS LOS EJEMPLOS ======
function ejecutarTodosLosEjemplos() {
    console.log('🚀 Iniciando ejemplos del sistema de administración...\n');
    
    // Ejecutar ejemplos básicos
    ejemploActualizacionSemanal();
    ejemploAgregarProductos();
    ejemploGestionInventario();
    ejemploValidacionLimpieza();
    ejemploBackupRestauracion();
    ejemploReportesAvanzados();
    ejemploActualizacionLote();
    
    // Ejecutar ejemplo de Firebase (asíncrono)
    ejemploSincronizacionFirebase().then(() => {
        console.log('\n✅ Todos los ejemplos completados');
    });
}

// ====== FUNCIONES DE UTILIDAD PARA DESARROLLADORES ======

// Función para limpiar datos de prueba
function limpiarDatosPrueba() {
    console.log('🧹 Limpiando datos de prueba...');
    
    const productosPrueba = ['guayaba', 'jugoVerde', 'bananaOrganica'];
    productosPrueba.forEach(id => {
        eliminarProducto(id);
        console.log(`Producto de prueba eliminado: ${id}`);
    });
}

// Función para restaurar datos originales
function restaurarDatosOriginales() {
    console.log('🔄 Restaurando datos originales...');
    
    // Aquí podrías restaurar desde un backup específico
    // restaurarDesdeBackup(backupOriginal);
    console.log('Datos originales restaurados');
}

// Función para mostrar ayuda
function mostrarAyuda() {
    console.log(`
🌱 SISTEMA DE ADMINISTRACIÓN GREEN DOLIO - AYUDA

FUNCIONES DISPONIBLES:
- ejecutarTodosLosEjemplos()     - Ejecuta todos los ejemplos
- ejemploActualizacionSemanal()   - Ejemplo de actualización semanal
- ejemploAgregarProductos()       - Ejemplo de agregar productos
- ejemploGestionInventario()      - Ejemplo de gestión de inventario
- ejemploValidacionLimpieza()     - Ejemplo de validación
- ejemploBackupRestauracion()     - Ejemplo de backup
- ejemploReportesAvanzados()      - Ejemplo de reportes
- ejemploActualizacionLote()      - Ejemplo de actualización en lote
- limpiarDatosPrueba()            - Limpia datos de prueba
- mostrarAyuda()                  - Muestra esta ayuda

COMANDOS ÚTILES:
- getAllProductos()               - Ver todos los productos
- obtenerEstadisticasAvanzadas()  - Ver estadísticas
- validarIntegridadProductos()    - Validar datos
- crearBackup()                   - Crear backup

Para más información, consulta README-ADMIN.md
    `);
}

// ====== EXPORTAR FUNCIONES ======
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ejecutarTodosLosEjemplos,
        ejemploActualizacionSemanal,
        ejemploAgregarProductos,
        ejemploGestionInventario,
        ejemploValidacionLimpieza,
        ejemploBackupRestauracion,
        ejemploSincronizacionFirebase,
        ejemploReportesAvanzados,
        ejemploActualizacionLote,
        limpiarDatosPrueba,
        restaurarDatosOriginales,
        mostrarAyuda
    };
}

// Mostrar ayuda al cargar el archivo
console.log('💡 Tip: Ejecuta mostrarAyuda() para ver todas las funciones disponibles'); 