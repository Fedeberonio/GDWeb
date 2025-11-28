# GREENDOLIO - GUÍA RÁPIDA TIPOGRÁFICA
## Referencia de Fuentes para Uso Diario

**Versión:** 1.0 | **Noviembre 2025**

---

## 🎯 REGLA DE ORO

**2 FUENTES, NO MÁS:**
1. **Patua One** (o Cooper Black) → Títulos grandes
2. **Montserrat** → Todo lo demás

---

## 🔤 LAS 2 FUENTES

### FUENTE 1: Patua One (Títulos)
```
Google Fonts: Patua One
Uso: H1, H2, títulos destacados
Peso: Solo uno disponible (bold)
Color: #2D5016 (verde oscuro)
```

**Copiar/pegar para web:**
```html
<link href="https://fonts.googleapis.com/css2?family=Patua+One&display=swap" rel="stylesheet">
```
```css
font-family: 'Patua One', serif;
```

---

### FUENTE 2: Montserrat (Todo lo demás)
```
Google Fonts: Montserrat
Uso: H3-H6, textos, botones, navegación
Pesos: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
Color: #1A1A1A (negro texto) o #2D5016 (verde)
```

**Copiar/pegar para web:**
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
```
```css
font-family: 'Montserrat', sans-serif;
```

---

## 📐 TAMAÑOS RÁPIDOS

### H1 - Título Principal
```
Fuente: Patua One
Tamaño: 48px (web) | 32px (móvil)
Color: #2D5016
```

### H2 - Subtítulo Grande
```
Fuente: Patua One
Tamaño: 36px (web) | 28px (móvil)
Color: #2D5016
```

### H3 - Subtítulo Medio
```
Fuente: Montserrat Bold
Tamaño: 24px (web) | 20px (móvil)
Color: #2D5016
```

### Body - Texto Normal
```
Fuente: Montserrat Regular
Tamaño: 16px ⭐ (BASE)
Color: #1A1A1A
Line-height: 1.6
```

### Botones
```
Fuente: Montserrat Bold
Tamaño: 16px
Uppercase: SÍ
Letter-spacing: 0.05em
```

### Precio
```
Fuente: Montserrat Bold
Tamaño: 24-32px
Color: #2D5016 o #E63946
```

---

## 💻 CSS LISTO PARA COPIAR

```css
/* Variables de fuentes */
:root {
  --font-display: 'Patua One', serif;
  --font-body: 'Montserrat', sans-serif;
  --color-text: #1A1A1A;
  --color-heading: #2D5016;
}

/* Base */
body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text);
}

/* Títulos grandes */
h1, h2 {
  font-family: var(--font-display);
  color: var(--color-heading);
  line-height: 1.1;
}

h1 { font-size: 48px; }
h2 { font-size: 36px; }

/* Títulos medianos/pequeños */
h3, h4, h5, h6 {
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--color-heading);
}

h3 { font-size: 24px; }
h4 { font-size: 18px; }

/* Botones */
.button {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Móvil */
@media (max-width: 768px) {
  h1 { font-size: 32px; }
  h2 { font-size: 28px; }
  h3 { font-size: 20px; }
}
```

---

## 📱 USO POR MEDIO

### WEB
- H1, H2: Patua One
- H3+, textos, botones: Montserrat

### REDES SOCIALES
- Títulos: Patua One (o bold de la app)
- Textos: Montserrat (o similar en la app)
- Mínimo 18px en imágenes

### IMPRESIÓN
- Igual que web
- Verificar licencias si usas Cooper Black

---

## ✅ USOS CORRECTOS

✅ Patua One para "Del Productor a tu Mesa"  
✅ Montserrat Regular para descripciones  
✅ Montserrat Bold para botones  
✅ Verde oscuro para títulos  
✅ Negro para textos largos

---

## ❌ NUNCA HACER

❌ Patua One para párrafos largos  
❌ Más de 2 fuentes diferentes  
❌ Textos menores a 14px  
❌ Gris sobre fondos de color  
❌ Títulos sin jerarquía clara

---

## 🔍 ALTERNATIVAS

**Si Patua One no funciona:**
- Abril Fatface (más elegante)
- Chunk Five (más bold)

**Si Montserrat no funciona:**
- Nunito (más amigable)
- Open Sans (más neutral)

---

## 📋 CHECKLIST RÁPIDO

- [ ] ¿Solo 2 fuentes?
- [ ] ¿Patua One para H1/H2?
- [ ] ¿Montserrat para el resto?
- [ ] ¿Tamaño base 16px?
- [ ] ¿Line-height 1.6 en textos?
- [ ] ¿Contraste suficiente?

---

**En caso de duda:** Patua One + Montserrat  
**Documento completo:** Ver GreenDolio_Tipografia_Oficial.md

🔤 **¡Mantén la consistencia tipográfica!**
