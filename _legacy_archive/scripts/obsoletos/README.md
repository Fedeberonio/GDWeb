# Scripts Obsoletos Archivados

Este directorio contiene scripts que han sido archivados porque:

1. **Ya no son necesarios**: Scripts de corrección puntual que ya fueron ejecutados
2. **Reemplazados**: Scripts que fueron reemplazados por versiones más nuevas
3. **Temporales**: Scripts de reporte o verificación que eran temporales
4. **Deprecados**: Scripts que requieren flags especiales o están marcados como archivados

## Scripts Archivados

### Scripts de Corrección Puntual (Ya Ejecutados)
- `fixEncodingInCatalog.ts` - Corrección de encoding en catálogo
- `fixImageNames.ts` - Corrección de nombres de imágenes
- `copyCatalogToStaging.ts` - Migración de catálogo a staging
- `markBabyProductsHidden.ts` - Actualización puntual de productos baby

### Scripts Reemplazados
- `seed-pro.ts` - Archivado, requiere ALLOW_CSV_SEED=true (reemplazado por seedCatalog.ts)
- `sync_images.ts` - Reemplazado por updateProductImagesFromAssets.ts
- `updateFruitDescriptionsEnV2.ts` - Versión 2 obsoleta
- `generateBoxRulesFromCsv.js` - JavaScript mezclado, reemplazado por TypeScript

### Scripts de Reporte Temporal
- `reportBabyProducts.ts` - Reporte temporal de productos baby
- `reportFruitDescriptions.ts` - Reporte temporal de descripciones de frutas
- `checkProductImages.ts` - Verificación temporal de imágenes
- `cleanProductNames.ts` - Limpieza temporal de nombres

## Nota

Estos scripts se mantienen aquí para referencia histórica. Si necesitas alguno de estos scripts, verifica primero si existe una versión actualizada en `apps/api/src/scripts/`.
