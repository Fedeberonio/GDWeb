# Scripts del Proyecto - GreenDolio Pro

Esta sección documenta todos los scripts activos disponibles en el proyecto.

## Ubicación

Los scripts se encuentran en: `apps/api/src/scripts/`

## Scripts de Importación

### Importar Catálogo desde Excel
```bash
npm --workspace apps/api run import:catalog [ruta_excel]
```
- **Script:** `importCatalogFromExcel.ts`
- **Descripción:** Importa el catálogo completo de productos desde un archivo Excel
- **Uso:** `npm --workspace apps/api run import:catalog data/master/products.xlsx`
- **Dependencias:** Archivo Excel con formato correcto

### Importar Combos desde Excel
```bash
npm --workspace apps/api run import:combos [ruta_excel]
```
- **Script:** `importCombosFromExcel.ts`
- **Descripción:** Importa combos de almuerzo desde Excel
- **Uso:** `npm --workspace apps/api run import:combos data/master/combos.xlsx`

### Importar desde CSV
```bash
npm --workspace apps/api run import:new-csv [ruta_csv]
```
- **Script:** `importFromNewCSV.ts`
- **Descripción:** Importa productos desde un archivo CSV
- **Uso:** `npm --workspace apps/api run import:new-csv data/imports/products.csv`

### Importar Contenidos de Cajas
```bash
npm --workspace apps/api run import:box-contents [ruta_csv]
```
- **Script:** `importBoxContents.ts`
- **Descripción:** Importa contenidos de cajas desde CSV
- **Uso:** `npm --workspace apps/api run import:box-contents data/imports/box-contents.csv`

### Importar Reglas de Cajas
```bash
npm --workspace apps/api run import:box-rules [ruta_json]
```
- **Script:** `importBoxRulesFromJson.ts`
- **Descripción:** Importa reglas de construcción de cajas desde JSON
- **Uso:** `npm --workspace apps/api run import:box-rules apps/api/src/data/boxRules.json`

### Importar Metadata de Productos
```bash
npm --workspace apps/api run import:product-metadata [ruta_json]
```
- **Script:** `importProductMetadataToCatalog.ts`
- **Descripción:** Importa metadata adicional de productos desde JSON
- **Uso:** `npm --workspace apps/api run import:product-metadata apps/api/src/data/productMetadata.json`

## Scripts de Actualización

### Actualizar Contenido del Catálogo
```bash
npm --workspace apps/api run update:catalog-content
```
- **Script:** `updateCatalogContent.ts`
- **Descripción:** Actualiza contenido del catálogo (productos y cajas)
- **Uso:** Ejecutar sin parámetros

### Actualizar Detalles de Cajas
```bash
npm --workspace apps/api run update:box-details
```
- **Script:** `updateBoxDisplayDetails.ts`
- **Descripción:** Actualiza detalles de visualización de cajas
- **Uso:** Ejecutar sin parámetros

### Actualizar Descripciones de Vegetales
```bash
npm --workspace apps/api run update:vegetable-descriptions
```
- **Script:** `updateVegetableDescriptions.ts`
- **Descripción:** Actualiza descripciones de productos vegetales
- **Uso:** Ejecutar sin parámetros

### Actualizar Imágenes de Jugos
```bash
npm --workspace apps/api run update:juice-images
```
- **Script:** `updateJuiceImages.ts`
- **Descripción:** Actualiza imágenes de productos de jugos
- **Uso:** Ejecutar sin parámetros

## Scripts de Sincronización de Imágenes

### Sincronizar Imágenes de Productos
```bash
npm --workspace apps/api run images:sync
```
- **Script:** `updateProductImagesFromAssets.ts`
- **Descripción:** Sincroniza imágenes locales con productos en Firestore
- **Uso:** Ejecutar sin parámetros
- **Nota:** Busca imágenes en `apps/web/public/assets/images/`

### Sincronizar Imágenes de Cajas
```bash
npm --workspace apps/api run boxes:sync
```
- **Script:** `updateBoxImagesFromAssets.ts`
- **Descripción:** Sincroniza imágenes de cajas desde assets locales
- **Uso:** Ejecutar sin parámetros

## Scripts de Exportación

### Exportar Metadata de Productos
```bash
npm --workspace apps/api run export:metadata
```
- **Script:** `exportProductMetadata.ts`
- **Descripción:** Exporta metadata de productos a JSON
- **Uso:** Ejecutar sin parámetros
- **Output:** Genera archivo JSON con metadata

### Exportar Backup del Catálogo
```bash
npm --workspace apps/api run export:catalog-backup
```
- **Script:** `exportCatalogBackup.ts`
- **Descripción:** Exporta backup completo del catálogo
- **Uso:** Ejecutar sin parámetros
- **Output:** Genera backup con timestamp

## Scripts de Backup

### Backup y Validación de Firestore
```bash
npm --workspace apps/api run backup:catalog
```
- **Script:** `firestoreBackupAndValidate.ts`
- **Descripción:** Hace backup de Firestore y valida datos
- **Uso:** Ejecutar sin parámetros
- **Output:** Genera backup y reporte de validación

## Scripts de Seed

### Seed del Catálogo
```bash
npm --workspace apps/api run seed:catalog
```
- **Script:** `seedCatalog.ts`
- **Descripción:** Pobla el catálogo inicial con datos base
- **Uso:** Ejecutar sin parámetros
- **Nota:** Solo usar en desarrollo o staging inicial

## Scripts Adicionales

### Exportar Catálogo a CSV
- **Script:** `exportCatalogToCsv.ts`
- **Descripción:** Exporta el catálogo completo a CSV
- **Uso:** Ejecutar directamente con ts-node

### Actualizar Descripciones de Frutas
- **Script:** `updateFruitDescriptions.ts`
- **Descripción:** Actualiza descripciones de productos de frutas
- **Uso:** Ejecutar directamente con ts-node

### Actualizar Descripciones de Frutas (EN)
- **Script:** `updateFruitDescriptionsEn.ts`
- **Descripción:** Actualiza descripciones en inglés de productos de frutas
- **Uso:** Ejecutar directamente con ts-node

## Notas Generales

### Requisitos
- Node.js >= 18.18.0
- Variables de entorno configuradas (Firebase)
- Acceso a Firestore

### Ejecución Directa
Si necesitas ejecutar un script directamente (no listado en package.json):
```bash
cd apps/api
npx ts-node-dev --transpile-only src/scripts/nombre-script.ts
```

### Scripts Archivados
Los scripts obsoletos han sido movidos a `_legacy_archive/scripts/obsoletos/` para referencia histórica.

## Orden Recomendado de Ejecución

1. **Importar datos maestros:**
   ```bash
   npm --workspace apps/api run import:catalog data/master/products.xlsx
   npm --workspace apps/api run import:box-rules apps/api/src/data/boxRules.json
   ```

2. **Sincronizar imágenes:**
   ```bash
   npm --workspace apps/api run images:sync
   npm --workspace apps/api run boxes:sync
   ```

3. **Actualizar contenido:**
   ```bash
   npm --workspace apps/api run update:catalog-content
   ```

4. **Hacer backup:**
   ```bash
   npm --workspace apps/api run backup:catalog
   ```
