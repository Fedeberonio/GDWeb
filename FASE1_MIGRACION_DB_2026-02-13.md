# Fase 1 Ejecutada: Migración DB Segura

Fecha: 2026-02-13  
Proyecto Firestore afectado: `greendolio-staging`  
Colección: `catalog_products`

## Objetivo aplicado

1. `GD-CASE-007` (`Chimichurri`): `categoryId` de `productos-caseros` a `otros`.
2. Producto en `legumbres`: `categoryId` de `legumbres` a `otros`.

## Script creado (con guardrails)

Archivo:
- `scripts/migrations/phase1-category-migration.mjs`

Características de seguridad:
- `dry-run` por defecto (no escribe sin `--apply --yes`).
- Verificación de proyecto (evita escribir en proyecto equivocado si se define `--project` o env).
- Backup automático antes de escribir.
- Soporte de rollback desde backup.

## Ejecución realizada

Dry-run:
```bash
node scripts/migrations/phase1-category-migration.mjs
```

Apply:
```bash
node scripts/migrations/phase1-category-migration.mjs --apply --yes
```

Resultado:
- Docs en scope: `2`
- Docs actualizados: `2`

## Evidencia post-migración

Estado final verificado:
- `GD-CASE-007` -> `categoryId: "otros"`
- `GD-PROD-001` (`sku: GD-LEGU-001`) -> `categoryId: "otros"`
- Conteo `legumbres`: `0`

Impacto agregado en categorías:
- `otros`: sube a `16`
- `productos-caseros`: baja a `5`

## Backup y rollback

Backup generado:
- `data/backups/phase1-category-migration/phase1-backup-greendolio-staging-2026-02-13T02-35-16-796Z.json`

Comando de rollback:
```bash
node scripts/migrations/phase1-category-migration.mjs --rollback data/backups/phase1-category-migration/phase1-backup-greendolio-staging-2026-02-13T02-35-16-796Z.json --yes
```

