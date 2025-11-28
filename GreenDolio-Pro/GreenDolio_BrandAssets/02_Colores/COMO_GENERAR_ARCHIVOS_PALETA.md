# GREENDOLIO - GENERACIÓN DE ARCHIVOS DE PALETA
## Guía para Crear ASE, ACO y Otros Formatos

**Versión:** 1.0 | **Noviembre 2025**

---

## 📦 ARCHIVOS DE PALETA NECESARIOS

1. ✅ **GreenDolio_Paleta.ase** (Adobe Swatch Exchange) - Para Illustrator, Photoshop, InDesign
2. ✅ **GreenDolio_Paleta.aco** (Adobe Color) - Para Photoshop
3. ✅ **GreenDolio_Paleta.sketchpalette** - Para Sketch
4. ✅ **GreenDolio_Paleta.xml** - Para GIMP
5. ✅ **GreenDolio_Paleta.gpl** - Para GIMP (alternativo)

---

## MÉTODO 1: ADOBE COLOR (Recomendado - Más Fácil)

### Paso 1: Acceder a Adobe Color
1. Ir a: https://color.adobe.com
2. Iniciar sesión con cuenta Adobe (gratuita)

### Paso 2: Crear Nueva Paleta
1. Click en "Crear" o "Create"
2. Seleccionar "Personalizado" / "Custom"

### Paso 3: Ingresar Colores

**COLORES PRIMARIOS (Obligatorios):**
```
1. #2D5016 - Verde Bosque Oscuro
2. #7DB835 - Verde Medio Vibrante
3. #D4E5B8 - Verde Pastel Claro
4. #FFFFFF - Blanco Puro
5. #1A1A1A - Negro Texto
```

**COLORES SECUNDARIOS (Adicionales):**
```
6. #7DD3C0 - Azul Cielo Turquesa
7. #F5F1E8 - Beige Natural
```

**COLORES DE ACENTO (Opcionales pero recomendados):**
```
8. #E63946 - Rojo Manzana
9. #C1121F - Rojo Fresa
10. #F77F00 - Naranja Cítrico
11. #6A994E - Verde Aguacate
```

### Paso 4: Nombrar y Guardar
1. Nombrar paleta: "GreenDolio Oficial"
2. Click en "Guardar" / "Save"
3. Marcar como "Favorita" para acceso rápido

### Paso 5: Exportar Formatos
1. Click en los tres puntos (⋮) de la paleta
2. Seleccionar "Descargar" / "Download"
3. Elegir formato:
   - **ASE** para Adobe Suite
   - **ACO** solo para Photoshop

### Paso 6: Importar en Adobe Apps

**En Photoshop:**
1. Ventana → Muestras / Window → Swatches
2. Click en menú hamburguesa (☰)
3. Importar muestras → Seleccionar archivo .ase o .aco

**En Illustrator:**
1. Ventana → Muestras / Window → Swatches
2. Click en menú hamburguesa (☰)
3. Abrir biblioteca de muestras → Otra biblioteca
4. Seleccionar archivo .ase

**En InDesign:**
1. Ventana → Color → Muestras
2. Click en menú panel
3. Cargar muestras → Seleccionar archivo .ase

---

## MÉTODO 2: ADOBE ILLUSTRATOR (Profesional)

### Crear Archivo ASE desde Illustrator

1. **Abrir Illustrator**
2. **Crear nuevo documento** (cualquier tamaño)
3. **Abrir panel Muestras** (Window → Swatches / Ventana → Muestras)
4. **Crear nueva muestra** por cada color:
   - Click en "Nueva muestra" (+)
   - Modo de color: **CMYK** (para impresión) o **RGB** (para web)
   - Ingresar valores según tabla abajo
   - Nombrar correctamente
   - Tipo de muestra: **Color de proceso**
5. **Seleccionar todas las muestras creadas**
6. **Exportar:**
   - Panel Muestras → Menú → Guardar biblioteca de muestras como ASE
   - Nombre: `GreenDolio_Paleta.ase`
   - Guardar en carpeta `02_Colores/`

### Valores para Crear Muestras

```
MUESTRA 1:
Nombre: GD Verde Bosque Oscuro
CMYK: C72% M38% Y100% K49%
RGB: R45 G80 B22

MUESTRA 2:
Nombre: GD Verde Medio Vibrante
CMYK: C48% M0% Y92% K0%
RGB: R125 G184 B53

MUESTRA 3:
Nombre: GD Verde Pastel Claro
CMYK: C15% M0% Y32% K0%
RGB: R212 G229 B184

MUESTRA 4:
Nombre: GD Azul Cielo Turquesa
CMYK: C46% M0% Y25% K0%
RGB: R125 G211 B192

MUESTRA 5:
Nombre: GD Beige Natural
CMYK: C3% M3% Y8% K0%
RGB: R245 G241 B232

MUESTRA 6:
Nombre: GD Rojo Manzana
CMYK: C0% M88% Y78% K0%
RGB: R230 G57 B70

MUESTRA 7:
Nombre: GD Rojo Fresa
CMYK: C10% M100% Y95% K5%
RGB: R193 G18 B31

MUESTRA 8:
Nombre: GD Naranja Cítrico
CMYK: C0% M58% Y100% K0%
RGB: R247 G127 B0

MUESTRA 9:
Nombre: GD Verde Aguacate
CMYK: C52% M18% Y82% K4%
RGB: R106 G153 B78

MUESTRA 10:
Nombre: GD Blanco Puro
CMYK: C0% M0% Y0% K0%
RGB: R255 G255 B255

MUESTRA 11:
Nombre: GD Negro Texto
CMYK: C0% M0% Y0% K90%
RGB: R26 G26 B26

MUESTRA 12:
Nombre: GD Gris Claro
CMYK: C0% M0% Y0% K10%
RGB: R229 G229 B229

MUESTRA 13:
Nombre: GD Gris Medio
CMYK: C0% M0% Y0% K58%
RGB: R108 G108 B108
```

---

## MÉTODO 3: PHOTOSHOP (Crear ACO)

### Crear Archivo ACO

1. **Abrir Photoshop**
2. **Panel Muestras** (Window → Swatches)
3. **Crear nueva muestra por cada color:**
   - Click en espacio vacío del panel con color seleccionado
   - O: Click en + y crear nueva
4. **Guardar muestras:**
   - Menú panel → Guardar muestras / Save Swatches
   - Formato: **ACO** (Color Swatches)
   - Nombre: `GreenDolio_Paleta.aco`
5. **Guardar en:** `02_Colores/`

---

## MÉTODO 4: SKETCH (Mac)

### Crear Archivo .sketchpalette

1. **Instalar plugin:** Sketch Palettes
   - https://github.com/andrewfiorillo/sketch-palettes
2. **En Sketch:**
   - Plugins → Sketch Palettes → Load Palette
3. **Crear archivo manualmente:**
   - Archivo de texto con extensión .sketchpalette
   - Formato JSON con colores

**Contenido del archivo `GreenDolio_Paleta.sketchpalette`:**
```json
{
  "compatibleVersion": "2.0",
  "pluginVersion": "2.0",
  "colors": [
    "#2D5016",
    "#7DB835",
    "#D4E5B8",
    "#7DD3C0",
    "#F5F1E8",
    "#E63946",
    "#C1121F",
    "#F77F00",
    "#6A994E",
    "#FFFFFF",
    "#1A1A1A",
    "#E5E5E5",
    "#6C6C6C"
  ],
  "gradients": [],
  "images": []
}
```

4. **Importar:**
   - Plugins → Sketch Palettes → Load Palette
   - Seleccionar archivo .sketchpalette

---

## MÉTODO 5: GIMP (Gratuito)

### Crear Archivo .gpl

1. **Crear archivo de texto:** `GreenDolio_Paleta.gpl`
2. **Contenido:**

```
GIMP Palette
Name: GreenDolio Oficial
Columns: 4
#
45  80  22   GD Verde Bosque Oscuro
125 184 53   GD Verde Medio Vibrante
212 229 184  GD Verde Pastel Claro
125 211 192  GD Azul Cielo Turquesa
245 241 232  GD Beige Natural
230 57  70   GD Rojo Manzana
193 18  31   GD Rojo Fresa
247 127 0    GD Naranja Cítrico
106 153 78   GD Verde Aguacate
255 255 255  GD Blanco Puro
26  26  26   GD Negro Texto
229 229 229  GD Gris Claro
108 108 108  GD Gris Medio
```

3. **Guardar en:** 
   - Windows: `C:\Users\[Usuario]\.gimp-2.8\palettes\`
   - Mac: `~/Library/Application Support/GIMP/2.8/palettes/`
   - Linux: `~/.gimp-2.8/palettes/`

4. **Reiniciar GIMP**
5. **Acceder:** Ventanas → Diálogos empotrables → Paletas

---

## MÉTODO 6: FIGMA (Online)

### Crear Paleta en Figma

1. **No requiere archivo externo**
2. **Crear estilos de color:**
   - Seleccionar objeto con color #2D5016
   - Panel derecho → Fill → Crear estilo
   - Nombrar: "GD/Verde Bosque Oscuro"
3. **Repetir para cada color**
4. **Organizar con "/" para jerarquía:**
   - GD/Primarios/Verde Oscuro
   - GD/Primarios/Verde Medio
   - GD/Acentos/Rojo Manzana
   - etc.

### Compartir Biblioteca
1. Crear nuevo archivo "GreenDolio Colors"
2. Agregar todos los estilos de color
3. Publicar como biblioteca
4. Compartir con equipo

---

## MÉTODO 7: CANVA (Para no diseñadores)

### Crear Paleta en Canva

1. **Canva Pro requerido** para paletas personalizadas
2. **Ir a:** Brand Kit
3. **Paletas de marca:**
   - Click en "Agregar paleta"
   - Ingresar códigos HEX uno por uno
   - Nombrar: "GreenDolio Oficial"
4. **Usar en diseños:**
   - La paleta aparece automáticamente en selector de color

**Códigos para copiar/pegar rápido:**
```
#2D5016
#7DB835
#D4E5B8
#7DD3C0
#F5F1E8
#E63946
#F77F00
```

---

## MÉTODO 8: CSS/WEB (Variables)

### Archivo CSS de Paleta

**Crear archivo:** `greendolio-colors.css`

```css
:root {
  /* Colores Primarios */
  --gd-verde-oscuro: #2D5016;
  --gd-verde-medio: #7DB835;
  --gd-verde-claro: #D4E5B8;
  
  /* Colores Secundarios */
  --gd-azul-cielo: #7DD3C0;
  --gd-beige: #F5F1E8;
  
  /* Colores de Acento */
  --gd-rojo-manzana: #E63946;
  --gd-rojo-fresa: #C1121F;
  --gd-naranja: #F77F00;
  --gd-verde-aguacate: #6A994E;
  
  /* Neutros */
  --gd-negro: #1A1A1A;
  --gd-blanco: #FFFFFF;
  --gd-gris-claro: #E5E5E5;
  --gd-gris-medio: #6C6C6C;
  
  /* Aliases por función */
  --color-primario: var(--gd-verde-oscuro);
  --color-fondo: var(--gd-blanco);
  --color-texto: var(--gd-negro);
  --color-acento: var(--gd-verde-medio);
}
```

**Uso:**
```css
.boton-primario {
  background-color: var(--color-primario);
  color: var(--gd-blanco);
}

.titulo {
  color: var(--gd-verde-oscuro);
}
```

---

## ✅ CHECKLIST DE ARCHIVOS A CREAR

- [ ] `GreenDolio_Paleta.ase` (Adobe Suite)
- [ ] `GreenDolio_Paleta.aco` (Photoshop)
- [ ] `GreenDolio_Paleta.sketchpalette` (Sketch)
- [ ] `GreenDolio_Paleta.gpl` (GIMP)
- [ ] `GreenDolio_Paleta.json` (Figma export)
- [ ] `greendolio-colors.css` (Web)
- [ ] Paleta en Canva Brand Kit (si Pro)
- [ ] Documentación completa (✅ Ya creada)

---

## 📁 ESTRUCTURA FINAL DE CARPETA 02_Colores/

```
02_Colores/
├── GreenDolio_Paleta_Colores_Oficial.md (Documentación completa)
├── GreenDolio_Guia_Rapida_Colores.md (Referencia rápida)
├── COMO_GENERAR_ARCHIVOS_PALETA.md (Este documento)
├── GreenDolio_Paleta.ase (Adobe Swatch Exchange)
├── GreenDolio_Paleta.aco (Adobe Color - Photoshop)
├── GreenDolio_Paleta.sketchpalette (Sketch)
├── GreenDolio_Paleta.gpl (GIMP)
├── greendolio-colors.css (Variables CSS)
└── README.txt (Instrucciones de uso)
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "No puedo exportar desde Adobe Color"
- Verificar que sesión esté iniciada
- Probar desde navegador diferente
- Usar método de Illustrator/Photoshop directo

### "Los colores se ven diferentes en impresión"
- Normal: RGB vs CMYK tienen diferente gama
- Usar valores CMYK del documento oficial
- Solicitar prueba de color antes de tirada
- Referencia Pantone para colores corporativos

### "No tengo Adobe Suite"
- Usar Adobe Color (gratuito, solo cuenta)
- Usar GIMP (gratuito y open source)
- Usar Figma (gratuito con cuenta)
- Usar Canva (versión gratuita limitada)

---

## 📞 RECURSOS ADICIONALES

**Adobe Color:**
https://color.adobe.com

**Sketch Palettes Plugin:**
https://github.com/andrewfiorillo/sketch-palettes

**GIMP:**
https://www.gimp.org

**Figma:**
https://www.figma.com

**Verificador de Contraste:**
https://webaim.org/resources/contrastchecker/

---

**Documento creado:** Noviembre 2025  
**Para:** Diseñadores y desarrolladores GreenDolio  
**Próximo paso:** Generar archivos y guardar en carpeta 02_Colores/

¡Mantén la consistencia de color en todos los canales! 🎨
