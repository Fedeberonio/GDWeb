# Estructura de Datos

Este directorio contiene todos los datos maestros y backups del proyecto GreenDolio.

## Estructura

```
data/
├── master/          # Versiones maestras de datos (fuente de verdad)
│   └── products.csv # Catálogo maestro de productos
├── backups/         # Backups históricos con timestamps
└── imports/         # Datos temporales para importar
```

## Uso

### Versión Maestra
- `master/products.csv` - Esta es la versión maestra del catálogo de productos
- **NO modificar directamente** - Usar scripts de importación/actualización
- Esta es la fuente de verdad para el catálogo

### Backups
- Todos los backups históricos se almacenan en `backups/`
- Incluyen timestamps en el nombre cuando es posible
- Se mantienen para referencia histórica

### Imports
- Colocar archivos CSV/Excel aquí antes de importar
- Los scripts de importación buscarán archivos en este directorio
- Limpiar después de importar exitosamente

## Scripts Relacionados

- `apps/api/src/scripts/importCatalogFromExcel.ts` - Importa desde Excel
- `apps/api/src/scripts/importFromNewCSV.ts` - Importa desde CSV
- `apps/api/src/scripts/exportCatalogToCsv.ts` - Exporta catálogo a CSV

## Notas

- Los archivos en `master/` son la fuente de verdad
- Siempre hacer backup antes de modificar datos maestros
- Los backups se mantienen para auditoría y recuperación
