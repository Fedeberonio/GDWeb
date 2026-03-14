# Corrección de Descripciones de Productos

## Resumen

Se corrigieron **16 descripciones incorrectas** y se agregaron **traducciones al inglés** para todos los productos de frutas.

## Problemas Identificados

1. **Descripciones mezcladas**: Las descripciones estaban asignadas a productos incorrectos (ej: Aguacate tenía la descripción de Plátano verde).
2. **Falta de traducciones**: Todas las descripciones estaban solo en español, incluso en la versión en inglés del sitio.

## Solución Implementada

### 1. Script de Corrección (`fix-product-descriptions.py`)
- Corrige las 16 descripciones incorrectas según el mapeo definido.
- Agrega traducciones al inglés para todos los productos corregidos.
- Crea una nueva columna `Descripcion_Corta_EN` en el CSV.

### 2. Actualización del Script de Importación
- Modificado `apps/api/src/scripts/importCatalogFromExcel.ts` para:
  - Leer la columna `Descripcion_Corta_EN` si existe.
  - Usar la descripción en inglés cuando esté disponible.
  - Fallback a la descripción en español si no hay traducción.

### 3. Actualización del Excel
- Script `update-excel-from-csv.py` actualiza el archivo Excel maestro con las correcciones.

## Productos Corregidos

| SKU | Producto | Descripción Anterior (Incorrecta) | Descripción Corregida (ES) |
|-----|----------|-----------------------------------|---------------------------|
| GD-FRUT-024 | Aguacate | Plátano verde para mangú o frito. | Aguacate maduro cremoso. Ideal para guacamole o ensaladas. |
| GD-FRUT-033 | Banana | Limón verde ácido. Ideal para aderezos. | Banana madura dulce. Perfecta para batidos y snacks. |
| GD-FRUT-034 | Cerezas | Mandarina dulce fácil de pelar. | Cereza local de temporada. Dulce y jugosa. |
| GD-FRUT-026 | Chinola | Piña dorada jugosa y dulce de temporada. | Chinola aromática para jugos y postres. |
| GD-FRUT-031 | Coco | Chinola aromática para jugos y postres. | Coco seco para rallar o agua de coco. |
| GD-FRUT-029 | Fresas | Sandía roja jugosa. Perfecta para jugos. | Fresa roja aromática. Ideal para batidos. |
| GD-FRUT-032 | Lechosa | Naranja dulce jugosa para exprimir. | Lechosa madura lista para consumir. |
| GD-FRUT-025 | Mandarina | Plátano maduro para dulces o maduros fritos. | Mandarina dulce fácil de pelar. |
| GD-FRUT-035 | Manzana | Coco seco para rallar o agua de coco. | Manzana roja importada crujiente. |
| GD-FRUT-037 | Melón | Cereza local de temporada. Dulce y jugosa. | Melón dulce refrescante de pulpa naranja. |
| GD-FRUT-038 | Melón francés | Fresa roja aromática. Ideal para batidos. | Melón francés aromático y dulce. Ideal para desayunos. |
| GD-FRUT-028 | Piña pequeña | Melón dulce refrescante de pulpa naranja. | Piña pequeña jugosa y dulce. Perfecta para una persona. |
| GD-FRUT-027 | Plátano maduro | Lechosa madura lista para consumir. | Plátano maduro para dulces o maduros fritos. |
| GD-FRUT-036 | Sandía | Tamarindo natural para jugos y dulces. | Sandía roja jugosa. Perfecta para jugos. |
| GD-FRUT-040 | Uvas blancas | Uvas rojas sin semilla. Snack saludable. | Uvas blancas sin semilla. Snack saludable. |
| GD-FRUT-041 | Uvas moradas | Manzana roja importada crujiente. | Uvas moradas dulces sin semilla. Perfectas para snacks. |

## Archivos Generados

1. `data/GreenDolio_Productos_25nov_CORREGIDO.csv` - CSV con descripciones corregidas y traducciones
2. `data/GreenDolio_Maestro_COMPLETO_25nov_CORREGIDO.xlsx` - Excel maestro actualizado

## Próximos Pasos

1. **Importar el catálogo corregido**:
   ```bash
   cd apps/api
   npm run import:catalog data/GreenDolio_Maestro_COMPLETO_25nov_CORREGIDO.xlsx
   ```

2. **Verificar en el sitio**:
   - Revisar que las descripciones sean correctas en español
   - Verificar que las descripciones se muestren en inglés en la versión en inglés del sitio

3. **Reemplazar archivos originales** (opcional):
   - Si todo está correcto, reemplazar los archivos originales con los corregidos
   - O mantener ambos y usar los corregidos para futuras importaciones

## Notas Técnicas

- El script de importación ahora soporta la columna `Descripcion_Corta_EN` opcional.
- Si no existe la traducción, se usa la descripción en español como fallback.
- Las descripciones se almacenan en Firestore con el formato `{ es: "...", en: "..." }`.
