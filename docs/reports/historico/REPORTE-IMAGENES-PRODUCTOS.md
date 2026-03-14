# 📊 Reporte de Imágenes de Productos

**Última actualización:** Después de correcciones

## Resumen General

- **Total productos en Firestore:** 76
- **Total imágenes en assets:** 90 (después de correcciones)
- **Total imágenes en public:** 60
- **Productos con imagen correcta:** 52 ✅
- **Productos con diferencias menores de nombre:** 8 ⚠️ (no crítico, el script las maneja)
- **Productos sin imagen:** 16 ❌ (productos que realmente no tienen imagen en assets)

---

## ❌ Productos SIN Imagen en Assets (0 productos)

> Actualización 10-nov: todos los slugs tienen archivo en `GreenDolio_BrandAssets/04_Fotografia/Productos` y fueron sincronizados con `npm --workspace apps/api run images:sync`.
> 
> Nuevas fotos añadidas hoy (fuente: Wikimedia Commons, licencia CC BY-SA compatible):
> - Apio → `Apio.jpg` (`Chinese_celery_-_Arlington,_MA.jpg`)
> - Laurel → `Laurel.jpg` (`Bay_leaf_2016.jpg`)
> - Pimienta negra entera → `Pimienta negra entera.jpg` (`Black_Peppercorns.jpg`)
> - Clavo dulce → `Clavo dulce.jpg` (`Cloves.JPG`)
> - Jugos: Pepinada (`pepinada.jpg`), Tropicalote (`tropicalote.jpg`), Rosa Maravillosa (`rosa-maravillosa.jpg`) y China Chinola (`china-chinola.jpg`) ahora usan nombres públicos sin sufijos de porción.
> 
> Los jugos continúan correctos; la validación previa fallaba porque el matcher buscaba el texto entre paréntesis en los nombres de archivo.

---

## ⚠️ Productos con Diferencias de Nombre (8 productos) - NO CRÍTICO

**Nota:** Estas diferencias son menores y no causan problemas. El script de sincronización las maneja correctamente. Son solo advertencias porque el nombre del asset no coincide exactamente con el slug del producto, pero el script encuentra la imagen correctamente.

Estos productos tienen imagen en assets, pero el nombre del archivo no coincide exactamente con el slug del producto:

1. **Baba Ganoush (16 oz)** - `baba-ganoush-16-oz`
   - Asset: `Baba Ganoush.jpg` (tiene mayúsculas y no incluye "16 oz")
   - Problema: Espacios y mayúsculas en el nombre del asset

2. **Hummus (16 oz)** - `hummus-16-oz`
   - Asset: `Hummus.jpg` (tiene mayúsculas y no incluye "16 oz")
   - Problema: Mayúsculas en el nombre del asset

3. **Fresas (aprox 14-15)** - `fresas-aprox-14-15`
   - Asset: `Fresas.jpg` (tiene mayúsculas y no incluye "aprox 14-15")
   - Problema: Mayúsculas en el nombre del asset

4. ~~**Sandía** - `sandia`~~ ✅ **CORREGIDO**
   - ~~Asset: `Sandi a.jpg` (tiene espacio y mayúsculas)~~ → Ahora: `Sandia.jpg`

5. ~~**Melón** - `melon`~~ ✅ **CORREGIDO**
   - ~~Asset: `Melo n.jpg` (tiene espacio y mayúsculas)~~ → Ahora: `Melon.jpg`

6. **Huevos Blancos (12 unidades)** - `huevos-blancos-12-unidades`
   - Asset: `Huevos blancos.jpg` (tiene espacios y mayúsculas, no incluye "12 unidades")
   - Problema: Espacios y mayúsculas en el nombre del asset

7. **Huevos de color (12 unidades)** - `huevos-de-color-12-unidades`
   - Asset: `Huevos de color.jpg` (tiene espacios y mayúsculas, no incluye "12 unidades")
   - Problema: Espacios y mayúsculas en el nombre del asset

8. **Huevos de campo orgánicos (12 unidades)** - `huevos-de-campo-organicos-12-unidades`
   - Asset: `Huevos de campo organicos.jpg` (tiene espacios y mayúsculas, no incluye "12 unidades", falta acento en "orgánicos")
   - Problema: Espacios, mayúsculas y falta de acento en el nombre del asset

9. ~~**Orégano** - `oregano`~~ ✅ **CORREGIDO**
   - ~~Asset: `Ore gano.jpg` (tiene espacio y mayúsculas)~~ → Ahora: `Oregano.jpg`

10. **Lentejas (400 gr)** - `lentejas-400-gr`
    - Asset: `Lentejas.jpg` (tiene mayúsculas y no incluye "400 gr")
    - Problema: Mayúsculas en el nombre del asset

11. ~~**Maíz** - `maiz`~~ ✅ **CORREGIDO**
    - ~~Asset: `Mai z.jpg` (tiene espacio y mayúsculas)~~ → Ahora: `Maiz.jpg`

12. ~~**Limón** - `limon`~~ ✅ **CORREGIDO**
    - ~~Asset: `Limo n.jpg` (tiene espacio y mayúsculas)~~ → Ahora: `Limon.jpg`

13. ~~**Ñame** - `name`~~ ✅ **CORREGIDO**
    - ~~Asset: `N ame.jpg` (tiene espacio y mayúsculas)~~ → Ahora: `Name.jpg`

---

## 📦 Imágenes en Assets SIN Producto Asociado (29 imágenes)

Estas imágenes están en el directorio de assets pero no tienen un producto correspondiente en Firestore:

1. `Aji gustoso.jpg` - Podría ser para "Ají gustoso" (no existe en catálogo)
2. `Auyama.jpg` - Podría ser para "Auyama" (no existe en catálogo)
3. `Bock Choy.jpg` - Podría ser para "Bok Choy" (no existe en catálogo)
4. `Cebolla amarilla.jpg` - Podría ser para "Cebolla amarilla" (existe "Cebolla morada/amarilla")
5. `Cebolla morada.jpg` - Podría ser para "Cebolla morada" (existe "Cebolla morada/amarilla")
6. `Cebolli n.jpg` - **Problema de nombre:** tiene espacio (debería ser "Cebollin.jpg")
7. `Genjibre.jpg` - **Error de ortografía:** debería ser "Jengibre.jpg" (ya existe "Jengibre.jpg")
8. `Guayaba.jpg` - Podría ser para "Guayaba" (no existe en catálogo)
9. `Huevos de campo.jpg` - Podría ser para "Huevos de campo" (existe "Huevos de campo orgánicos")
10. `Huevos marrones.jpg` - Podría ser para "Huevos marrones" (no existe en catálogo)
11. `Levadura instantanea.jpg` - Podría ser para "Levadura instantánea" (no existe en catálogo)
12. `Menta.jpg` - Podría ser para "Menta" (no existe en catálogo)
13. `Okra.jpg` - Podría ser para "Okra" (no existe en catálogo)
14. `Pimiento amarilo.jpg` - **Error de ortografía:** debería ser "Pimiento amarillo.jpg"
15. `Pimiento rojo.jpg` - Podría ser para "Pimiento rojo" (no existe en catálogo)
16. `Pimiento verde.jpg` - Podría ser para "Pimiento verde" (no existe en catálogo)
17. `Pin a.jpg` - **Problema de nombre:** tiene espacio (debería ser "Pina.jpg")
18. `Rabanitos.jpg` - Podría ser para "Rabanitos" (existe "Rábano")
19. `Remolacha.jpg` - Podría ser para "Remolacha" (no existe en catálogo)
20. `Semillas de chi a.jpg` - **Problema de nombre:** tiene espacio (debería ser "Semillas de chia.jpg")
21. `Semillas de se samo.jpg` - **Problema de nombre:** tiene espacio (debería ser "Semillas de sesamo.jpg")
22. `Tamarindo.jpg` - Podría ser para "Tamarindo" (no existe en catálogo)
23. `Tayota.jpg` - Podría ser para "Tayota" (no existe en catálogo)
24. `Tomates bugalu.jpg` - Variante plural de "Tomate bugalú" (existe "Tomate bugalú")
25. `Tomates redondos.jpg` - Variante plural de "Tomate redondo" (existe "Tomate redondo")
26. `Tomillo.jpg` - Podría ser para "Tomillo" (no existe en catálogo)
27. `Vainitas.jpg` - Podría ser para "Vainitas" (no existe en catálogo)
28. `Zapote.jpg` - Podría ser para "Zapote" (no existe en catálogo)
29. `Zuccini.jpg` - **Error de ortografía:** debería ser "Zucchini.jpg" (ya existe "Zucchini.jpg")

---

## 🔍 Problemas de Nombres Detectados

### ✅ Problemas Críticos RESUELTOS (Espacios en nombres de archivos)

**TODOS CORREGIDOS:**
- ✅ `Sandi a.jpg` → `Sandia.jpg`
- ✅ `Melo n.jpg` → `Melon.jpg`
- ✅ `Ore gano.jpg` → `Oregano.jpg`
- ✅ `Mai z.jpg` → `Maiz.jpg`
- ✅ `Limo n.jpg` → `Limon.jpg`
- ✅ `N ame.jpg` → `Name.jpg`
- ✅ `Cebolli n.jpg` → `Cebollin.jpg`
- ✅ `Pin a.jpg` → `Pina.jpg`
- ✅ `Semillas de chi a.jpg` → `Semillas de chia.jpg`
- ✅ `Semillas de se samo.jpg` → `Semillas de sesamo.jpg`

### ✅ Errores de Ortografía RESUELTOS

- ✅ `Genjibre.jpg` → Eliminado (ya existe `Jengibre.jpg`)
- ✅ `Pimiento amarilo.jpg` → `Pimiento amarillo.jpg`
- ✅ `Zuccini.jpg` → Eliminado (ya existe `Zucchini.jpg`)

### Problemas de Mayúsculas

Todos los archivos tienen mayúsculas en la primera letra. Aunque esto no es un error crítico, sería mejor usar nombres en minúsculas para consistencia.

---

## ✅ Estado de Correcciones

1. ✅ **Archivos con espacios:** TODOS CORREGIDOS (11 archivos renombrados)

2. ✅ **Errores de ortografía:** TODOS CORREGIDOS (1 renombrado, 2 eliminados)

3. ⚠️ **Imágenes faltantes:** 16 productos sin imagen en assets (estos productos realmente no tienen imagen disponible)

## ✅ Recomendaciones Pendientes

1. **Agregar imágenes faltantes:** Crear o buscar imágenes para los 16 productos que no tienen imagen en assets

4. **Estandarizar nombres:** Considerar renombrar todos los archivos a minúsculas con guiones (ej: `Aguacate.jpg` → `aguacate.jpg`)

5. **Revisar assets sin producto:** Decidir si se deben agregar estos productos al catálogo o eliminar las imágenes

6. **Actualizar script de sincronización:** El script actual maneja bien las diferencias de nombres, pero sería mejor tener nombres consistentes

---

## 📝 Notas

- El script de sincronización (`updateProductImagesFromAssets.ts`) maneja bien las diferencias de nombres usando normalización y simplificación de claves
- Los problemas de espacios en nombres pueden causar problemas en algunos sistemas operativos
- Los errores de ortografía pueden causar confusión y dificultar la búsqueda de imágenes
