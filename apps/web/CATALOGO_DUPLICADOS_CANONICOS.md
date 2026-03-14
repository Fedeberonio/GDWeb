# Catalogo duplicados canonicos

Este archivo resume el criterio canonico que ahora usa el storefront y la busqueda de cajas en admin.

- El storefront muestra el SKU canonico.
- Los aliases legacy siguen existiendo en Firestore para no romper recetas ni referencias viejas.
- El editor de cajas en admin prefiere automaticamente el SKU canonico, incluso si escribes un alias viejo.

## Reglas de prioridad

- `active` gana sobre `inactive`.
- SKU comercial (`GD-VEGE`, `GD-FRUT`, `GD-HIER`, `GD-OTRO`, etc.) gana sobre `GD-ING` y `GD-INGR`.
- Producto vendible gana sobre alias internos de ingredientes.

## Mapa actual

- Aguacate: canonico `GD-FRUT-024`; alias `GD-INGR-005`
- Ajo: canonico `GD-VEGE-061`; alias `GD-INGR-039`
- Apio: canonico `GD-HIER-075`; alias `GD-INGR-032`
- Arroz integral: canonico `GD-OTRO-021`; alias `GD-INGR-031`
- Auyama: canonico `GD-VEGE-048`; alias `GD-ING-005` archivado
- Cebolla morada: canonico `GD-VEGE-012`; alias `GD-INGR-009`
- Cilantro: canonico `GD-HIER-070`; alias `GD-INGR-030`
- Guayaba: canonico `GD-FRUT-038`; alias `GD-ING-013`
- Jengibre: canonico `GD-HIER-071`; alias `GD-INGR-013`
- Lechuga repollada: canonico `GD-VEGE-050`; alias `GD-ING-006`, `GD-INGR-001` archivados
- Lechuga rizada: canonico `GD-VEGE-047`; alias `GD-INGR-041`
- Limon: canonico `GD-VEGE-067`; alias `GD-INGR-022`
- Mango: canonico `GD-FRUT-030`; alias `GD-INGR-026`
- Oregano: canonico `GD-HIER-072`; alias `GD-INGR-040`
- Pepino: canonico `GD-VEGE-053`; alias `GD-INGR-006`
- Pimiento verde: canonico `GD-ING-020`; alias `GD-INGR-017`
- Pitahaya: canonico `GD-FRUT-039`; alias `GD-INGR-027`
- Tomate bugalu: canonico `GD-VEGE-044`; alias `GD-INGR-045`

## Pendiente manual

- Revisar `Pimiento verde`: ambos duplicados estan inactivos. El sistema deja `GD-ING-020` como canonico interno y `GD-INGR-017` como alias archivado.
