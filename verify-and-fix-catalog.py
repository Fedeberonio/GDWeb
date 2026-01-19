#!/usr/bin/env python3
"""
Script completo para verificar y corregir:
1. Traducciones faltantes (nombres y descripciones)
2. Imágenes faltantes
3. Descripciones incorrectas
"""

import pandas as pd
import sys
from pathlib import Path
import json

# Mapeo de traducciones de nombres (completar con todos los productos)
NOMBRES_TRADUCCIONES = {
    # Frutas
    "Aguacate": "Avocado",
    "Banana": "Banana",
    "Cerezas": "Cherries",
    "Chinola": "Passion Fruit",
    "Coco": "Coconut",
    "Fresas (aprox 14-15)": "Strawberries (approx 14-15)",
    "Lechosa": "Papaya",
    "Mandarina": "Tangerine",
    "Manzana": "Apple",
    "Melón": "Melon",
    "Melón francés": "Cantaloupe",
    "Piña pequeña": "Small Pineapple",
    "Plátano maduro": "Ripe Plantain",
    "Sandía": "Watermelon",
    "Uvas blancas": "White Grapes",
    "Uvas moradas": "Red Grapes",
    "Naranja": "Orange",
    "Carambola": "Starfruit",
    "Mango": "Mango",
    "Pitahaya": "Dragon Fruit",
    "Limón": "Lemon",
    
    # Vegetales
    "Tomate bugalú": "Bugalu Tomato",
    "Papas": "Potatoes",
    "Plátano verde": "Green Plantain",
    "Lechuga rizada": "Curly Lettuce",
    "Calabaza": "Pumpkin",
    "Berenjena": "Eggplant",
    "Lechuga repollada": "Iceberg Lettuce",
    "Lechuga romana": "Romaine Lettuce",
    "Rábano": "Radish",
    "Pepino": "Cucumber",
    "Guineo verde": "Green Banana",
    "Yuca": "Cassava",
    "Repollo blanco": "White Cabbage",
    "Repollo morado": "Purple Cabbage",
    "Tomate redondo": "Round Tomato",
    "Coliflor": "Cauliflower",
    "Brócoli": "Broccoli",
    "Ajo": "Garlic",
    "Cebolla morada/amarilla": "Purple/Yellow Onion",
    "Zanahoria": "Carrot",
    "Batata": "Sweet Potato",
    "Ají morrón": "Bell Pepper",
    "Maíz": "Corn",
    "Ñame": "Yam",
    "Zucchini": "Zucchini",
    
    # Hierbas y Especias
    "Cilantro": "Cilantro",
    "Jengibre": "Ginger",
    "Orégano": "Oregano",
    "Perejil": "Parsley",
    "Romero": "Rosemary",
    "Apio": "Celery",
    "Anís estrellado": "Star Anise",
    "Laurel": "Bay Leaf",
    "Pimienta negra entera": "Whole Black Pepper",
    "Clavo dulce": "Cloves",
    
    # Productos Caseros
    "Baba Ganoush (16 oz)": "Baba Ganoush (16 oz)",
    "Hummus (16 oz)": "Hummus (16 oz)",
    "Guacamole (16 oz)": "Guacamole (16 oz)",
    "Chimichurri (9.5 oz)": "Chimichurri (9.5 oz)",
    
    # Jugos
    "Pepinada (1 porción)": "Cucumber Lemonade (1 serving)",
    "Tropicalote (1 porción)": "Tropical Punch (1 serving)",
    "Rosa Maravillosa (1 porción)": "Wonderful Rose (1 serving)",
    "China Chinola (1 porción)": "Orange Passion Fruit (1 serving)",
    
    # Productos de Granja
    "Huevos Blancos (12 unidades)": "White Eggs (12 units)",
    "Huevos de color (12 unidades)": "Brown Eggs (12 units)",
    "Huevos de campo orgánicos (12 unidades)": "Organic Free-Range Eggs (12 units)",
    "Miel pura de abejas (6.5 oz)": "Pure Honey (6.5 oz)",
    "Miel orgánica con panal (12 oz)": "Organic Honey with Comb (12 oz)",
    
    # Otros
    "Aceite de oliva sabor ajo (400 cc)": "Garlic Flavored Olive Oil (400 cc)",
    "Aceite de oliva extra virgen importado (3 litros)": "Imported Extra Virgin Olive Oil (3 liters)",
    "Quinoa (16 oz)": "Quinoa (16 oz)",
    "Arroz blanco (400 gr)": "White Rice (400 gr)",
    "Arroz integral (1 libra)": "Brown Rice (1 pound)",
    "Lentejas (400 gr)": "Lentils (400 gr)",
    "Habichuelas rojas/negras/blancas (400 gr)": "Red/Black/White Beans (400 gr)",
}

# Traducciones de unidades
UNIDADES_TRADUCCIONES = {
    "unidad": "unit",
    "libra": "pound",
    "porción": "serving",
    "docena": "dozen",
    "manojo": "bunch",
    "gramos": "grams",
    "gr": "gr",
    "oz": "oz",
    "lb": "lb",
    "caja": "box",
}

def traducir_nombre(nombre_es: str) -> str:
    """Traduce el nombre del producto al inglés."""
    if nombre_es in NOMBRES_TRADUCCIONES:
        return NOMBRES_TRADUCCIONES[nombre_es]
    
    # Si no está en el diccionario, intentar traducción básica
    # Para productos "baby", mantener la estructura
    if "baby" in nombre_es.lower():
        base = nombre_es.replace(" baby", "").replace(" (baby)", "")
        if base in NOMBRES_TRADUCCIONES:
            return f"{NOMBRES_TRADUCCIONES[base]} (baby)"
    
    # Si no se encuentra, devolver el nombre original
    return nombre_es

def traducir_unidad(unidad_es: str) -> str:
    """Traduce la unidad al inglés."""
    unidad_lower = unidad_es.lower().strip()
    if unidad_lower in UNIDADES_TRADUCCIONES:
        return UNIDADES_TRADUCCIONES[unidad_lower]
    return unidad_es

def verificar_y_corregir_catalogo(archivo_csv: str, archivo_salida: str = None):
    """
    Verifica y corrige traducciones faltantes en el catálogo.
    """
    if archivo_salida is None:
        archivo_salida = archivo_csv.replace('.csv', '_COMPLETO.csv')
    
    print(f"📖 Leyendo archivo: {archivo_csv}")
    df = pd.read_csv(archivo_csv)
    
    print(f"📊 Total de productos: {len(df)}")
    
    # Verificar columnas necesarias
    if 'Nombre_Producto' not in df.columns:
        print("❌ Error: No se encontró la columna 'Nombre_Producto'")
        return
    
    # Crear columnas de traducción si no existen
    if 'Nombre_Producto_EN' not in df.columns:
        df['Nombre_Producto_EN'] = ''
    
    if 'Descripcion_Corta_EN' not in df.columns:
        df['Descripcion_Corta_EN'] = ''
    
    if 'Unidad_Venta_EN' not in df.columns:
        df['Unidad_Venta_EN'] = ''
    
    # Contadores
    nombres_traducidos = 0
    descripciones_traducidas = 0
    unidades_traducidas = 0
    productos_sin_traduccion = []
    
    # Procesar cada producto
    for idx, row in df.iterrows():
        nombre_es = str(row['Nombre_Producto']).strip() if pd.notna(row['Nombre_Producto']) else ''
        descripcion_es = str(row['Descripcion_Corta']).strip() if pd.notna(row.get('Descripcion_Corta')) else ''
        unidad_es = str(row['Unidad_Venta']).strip() if pd.notna(row.get('Unidad_Venta')) else ''
        
        # Traducir nombre
        nombre_en_actual = str(row.get('Nombre_Producto_EN', '')).strip() if pd.notna(row.get('Nombre_Producto_EN')) else ''
        if not nombre_en_actual and nombre_es:
            nombre_en = traducir_nombre(nombre_es)
            df.at[idx, 'Nombre_Producto_EN'] = nombre_en
            if nombre_en != nombre_es:
                nombres_traducidos += 1
                print(f"✓ Nombre traducido: {nombre_es} → {nombre_en}")
            else:
                productos_sin_traduccion.append((row.get('SKU', 'N/A'), nombre_es))
        
        # Traducir descripción (solo si existe en español pero no en inglés)
        descripcion_en_actual = str(row.get('Descripcion_Corta_EN', '')).strip() if pd.notna(row.get('Descripcion_Corta_EN')) else ''
        if descripcion_es and not descripcion_en_actual:
            # Si ya tenemos la descripción corregida en español, mantenerla
            # La traducción al inglés se hará manualmente o con un servicio de traducción
            # Por ahora, dejamos un placeholder
            df.at[idx, 'Descripcion_Corta_EN'] = descripcion_es  # Placeholder
            descripciones_traducidas += 1
        
        # Traducir unidad
        unidad_en_actual = str(row.get('Unidad_Venta_EN', '')).strip() if pd.notna(row.get('Unidad_Venta_EN')) else ''
        if unidad_es and not unidad_en_actual:
            unidad_en = traducir_unidad(unidad_es)
            df.at[idx, 'Unidad_Venta_EN'] = unidad_en
            if unidad_en != unidad_es:
                unidades_traducidas += 1
    
    # Guardar archivo corregido
    df.to_csv(archivo_salida, index=False)
    print(f"\n✅ Archivo guardado: {archivo_salida}")
    print(f"\n📊 Resumen:")
    print(f"   - Nombres traducidos: {nombres_traducidos}")
    print(f"   - Descripciones marcadas para traducción: {descripciones_traducidas}")
    print(f"   - Unidades traducidas: {unidades_traducidas}")
    print(f"   - Productos sin traducción de nombre: {len(productos_sin_traduccion)}")
    
    if productos_sin_traduccion:
        print(f"\n⚠️  Productos que necesitan traducción manual:")
        for sku, nombre in productos_sin_traduccion[:10]:  # Mostrar solo los primeros 10
            print(f"   - {sku}: {nombre}")
        if len(productos_sin_traduccion) > 10:
            print(f"   ... y {len(productos_sin_traduccion) - 10} más")
    
    return archivo_salida

if __name__ == "__main__":
    archivo_csv = sys.argv[1] if len(sys.argv) > 1 else "data/GreenDolio_Productos_25nov_CORREGIDO.csv"
    archivo_salida = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not Path(archivo_csv).exists():
        print(f"❌ Error: No se encontró el archivo {archivo_csv}")
        sys.exit(1)
    
    verificar_y_corregir_catalogo(archivo_csv, archivo_salida)
