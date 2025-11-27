# GreenDolio - Paquete de Datos para Web
**Fecha:** 25 noviembre 2025  
**Versión:** 2.0

---

## 📦 ARCHIVOS INCLUIDOS

| Archivo | Descripción |
|---------|-------------|
| `GreenDolio_Maestro_COMPLETO_25nov.xlsx` | Excel con 3 hojas (ver abajo) |
| `GreenDolio_Productos_25nov.csv` | 98 productos para importar |
| `GreenDolio_Contenidos_Cajas_25nov.csv` | 116 líneas de contenidos de cajas |

---

## 📊 ESTRUCTURA DEL EXCEL

### Hoja 1: `Productos` (98 filas)
Base de datos completa de productos.

**Columnas principales:**
- `SKU` - Identificador único (ej: GD-FRUT-001)
- `Nombre_Producto` - Nombre para mostrar
- `Categoria` - Frutas, Vegetales, Hierbas, etc.
- `Precio_DOP` - Precio de venta
- `Precio_Compra` - Costo de compra
- `Peso_En_Libras` - Peso por unidad
- `Activo` - Sí/No

**Productos BABY (19 nuevos):**
- SKUs del GD-VEGE-080 al GD-FRUT-098
- Son versiones pequeñas (mitad peso/costo) para Box 1
- Ejemplo: `Mango baby` = mitad de `Mango`

### Hoja 2: `Contenidos_Cajas` (116 filas)
Qué productos incluye cada caja.

**Columnas:**
- `Caja_ID` - GD-CAJA-001, 002, 003
- `Variante` - MIX, FRUTAL, VEGGIE
- `Producto` - Nombre exacto (debe coincidir con Productos)
- `Cantidad` - Unidades incluidas
- `Costo_Unitario` - Costo por unidad
- `Peso_Unit_Lb` - Peso por unidad
- `Costo_Total` - Costo × Cantidad
- `Peso_Total_Lb` - Peso × Cantidad

### Hoja 3: `Resumen_Cajas` (9 filas)
Totales por caja/variante.

**Columnas:**
- `Caja` - BOX 1, 2, 3
- `Variante` - MIX, FRUTAL, VEGGIE
- `Precio_caja` - Precio de venta (650, 990, 1990)
- `Costo_total` - Suma de costos
- `Margen` - Ganancia bruta
- `Margen_%` - Porcentaje de ganancia
- `Peso_total_lb` - Peso total de la caja

---

## 🔗 CÓMO RELACIONAR LAS TABLAS

```
Productos.Nombre_Producto ←→ Contenidos_Cajas.Producto
Productos.SKU (GD-CAJA-001, 002, 003) ←→ Contenidos_Cajas.Caja_ID
```

### Ejemplo de consulta:
```sql
-- Obtener todos los productos de Box 1 MIX
SELECT p.*, c.Cantidad 
FROM Productos p
JOIN Contenidos_Cajas c ON p.Nombre_Producto = c.Producto
WHERE c.Caja_ID = 'GD-CAJA-001' AND c.Variante = 'MIX'
```

---

## 🛒 LÓGICA DEL SELECTOR DE CAJAS

### Flujo del usuario:
1. Elige tamaño → Box 1, 2 o 3
2. Elige variante → MIX, FRUTAL o VEGGIE
3. Ve contenido predeterminado
4. (Opcional) Hace swaps de productos

### Reglas de swap:
- Solo dentro de la misma variante
- Producto de reemplazo debe tener peso/precio similar (±20%)
- Consultar tabla Productos para validar

---

## 📋 CAJAS Y PRECIOS

| Caja | Duración | Precio DOP | Peso aprox |
|------|----------|------------|------------|
| Box 1 | 3 días | 650 | 7.7 lb |
| Box 2 | 1 semana | 990 | 13.2 lb |
| Box 3 | 2 semanas | 1,990 | 26.5 lb |

**Variantes:** MIX (frutas+vegetales), FRUTAL (solo frutas), VEGGIE (solo vegetales)

---

## ⚠️ NOTAS IMPORTANTES

1. **Productos baby** solo se usan en Box 1 (caja pequeña de 3 días)
2. **Nombres exactos** - Los nombres en Contenidos_Cajas deben coincidir exactamente con Productos
3. **Lechosa baby** también aparece en Box 2 MIX y FRUTAL
4. **Precios en DOP** (Pesos Dominicanos)

---

## ✅ CHECKLIST DE IMPORTACIÓN

- [ ] Importar tabla Productos (98 filas)
- [ ] Importar tabla Contenidos_Cajas (116 filas)
- [ ] Verificar que todos los productos en Contenidos_Cajas existan en Productos
- [ ] Configurar 3 cajas × 3 variantes = 9 combinaciones
- [ ] Probar selector de cajas en frontend

---

**Contacto:** info@greendolio.shop
