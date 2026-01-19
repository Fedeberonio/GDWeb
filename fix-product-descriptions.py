#!/usr/bin/env python3
"""
Script para corregir descripciones incorrectas de productos y agregar traducciones al inglés.
"""

import pandas as pd
import sys
from pathlib import Path

# Mapeo de correcciones según el reporte del usuario
CORRECCIONES_DESCRIPCIONES = {
    "GD-FRUT-024": {  # Aguacate
        "es": "Aguacate maduro cremoso. Ideal para guacamole o ensaladas.",
        "en": "Creamy ripe avocado. Perfect for guacamole or salads."
    },
    "GD-FRUT-033": {  # Banana
        "es": "Banana madura dulce. Perfecta para batidos y snacks.",
        "en": "Sweet ripe banana. Perfect for smoothies and snacks."
    },
    "GD-FRUT-034": {  # Cerezas
        "es": "Cereza local de temporada. Dulce y jugosa.",
        "en": "Seasonal local cherry. Sweet and juicy."
    },
    "GD-FRUT-026": {  # Chinola
        "es": "Chinola aromática para jugos y postres.",
        "en": "Aromatic passion fruit for juices and desserts."
    },
    "GD-FRUT-031": {  # Coco
        "es": "Coco seco para rallar o agua de coco.",
        "en": "Dry coconut for grating or coconut water."
    },
    "GD-FRUT-029": {  # Fresas (aprox 14-15)
        "es": "Fresa roja aromática. Ideal para batidos.",
        "en": "Aromatic red strawberry. Perfect for smoothies."
    },
    "GD-FRUT-032": {  # Lechosa
        "es": "Lechosa madura lista para consumir.",
        "en": "Ripe papaya ready to eat."
    },
    "GD-FRUT-025": {  # Mandarina
        "es": "Mandarina dulce fácil de pelar.",
        "en": "Sweet mandarin easy to peel."
    },
    "GD-FRUT-035": {  # Manzana
        "es": "Manzana roja importada crujiente.",
        "en": "Crispy imported red apple."
    },
    "GD-FRUT-037": {  # Melón
        "es": "Melón dulce refrescante de pulpa naranja.",
        "en": "Refreshing sweet melon with orange flesh."
    },
    "GD-FRUT-038": {  # Melón francés
        "es": "Melón francés aromático y dulce. Ideal para desayunos.",
        "en": "Aromatic and sweet French melon. Perfect for breakfasts."
    },
    "GD-FRUT-028": {  # Piña pequeña
        "es": "Piña pequeña jugosa y dulce. Perfecta para una persona.",
        "en": "Juicy and sweet small pineapple. Perfect for one person."
    },
    "GD-FRUT-027": {  # Plátano maduro
        "es": "Plátano maduro para dulces o maduros fritos.",
        "en": "Ripe plantain for sweets or fried ripe plantains."
    },
    "GD-FRUT-036": {  # Sandía
        "es": "Sandía roja jugosa. Perfecta para jugos.",
        "en": "Juicy red watermelon. Perfect for juices."
    },
    "GD-FRUT-040": {  # Uvas blancas
        "es": "Uvas blancas sin semilla. Snack saludable.",
        "en": "Seedless white grapes. Healthy snack."
    },
    "GD-FRUT-041": {  # Uvas moradas
        "es": "Uvas moradas dulces sin semilla. Perfectas para snacks.",
        "en": "Sweet seedless purple grapes. Perfect for snacks."
    },
}

# Productos que ya tienen descripciones correctas (solo necesitan traducción)
DESCRIPCIONES_CORRECTAS = {
    "GD-FRUT-043": {  # Carambola
        "es": "Carambola (fruta estrella) exótica y refrescante.",
        "en": "Exotic and refreshing starfruit."
    },
    "GD-FRUT-030": {  # Mango
        "es": "Mango de temporada seleccionado por madurez.",
        "en": "Seasonal mango selected for ripeness."
    },
    "GD-FRUT-042": {  # Naranja
        "es": "Naranja dulce jugosa para exprimir o comer.",
        "en": "Sweet juicy orange for juicing or eating."
    },
    "GD-FRUT-039": {  # Pitahaya
        "es": "Pitahaya de pulpa blanca. Fruta exótica.",
        "en": "White-fleshed dragon fruit. Exotic fruit."
    },
}

def corregir_descripciones(archivo_csv: str, archivo_salida: str = None):
    """
    Corrige las descripciones incorrectas en el CSV y agrega traducciones al inglés.
    """
    if archivo_salida is None:
        archivo_salida = archivo_csv.replace('.csv', '_CORREGIDO.csv')
    
    print(f"Leyendo archivo: {archivo_csv}")
    df = pd.read_csv(archivo_csv)
    
    print(f"Total de productos: {len(df)}")
    
    # Contadores
    corregidos = 0
    traducidos = 0
    
    # Verificar si existe columna para descripción en inglés
    tiene_desc_en = 'Descripcion_Corta_EN' in df.columns
    
    # Si no existe, crear columna para descripción en inglés
    if not tiene_desc_en:
        df['Descripcion_Corta_EN'] = ''
        print("Columna 'Descripcion_Corta_EN' creada para traducciones al inglés.")
    
    # Aplicar correcciones
    for sku, descripciones in CORRECCIONES_DESCRIPCIONES.items():
        mask = df['SKU'] == sku
        if mask.any():
            df.loc[mask, 'Descripcion_Corta'] = descripciones['es']
            df.loc[mask, 'Descripcion_Corta_EN'] = descripciones['en']
            nombre = df.loc[mask, 'Nombre_Producto'].iloc[0] if mask.any() else sku
            print(f"✓ Corregido: {nombre} ({sku})")
            corregidos += 1
        else:
            print(f"⚠ No encontrado: {sku}")
    
    # Agregar traducciones a productos con descripciones correctas
    for sku, descripciones in DESCRIPCIONES_CORRECTAS.items():
        mask = df['SKU'] == sku
        if mask.any():
            # Verificar que la descripción en español sea correcta
            desc_actual = df.loc[mask, 'Descripcion_Corta'].iloc[0] if mask.any() else ''
            if desc_actual == descripciones['es']:
                df.loc[mask, 'Descripcion_Corta_EN'] = descripciones['en']
                nombre = df.loc[mask, 'Nombre_Producto'].iloc[0] if mask.any() else sku
                print(f"✓ Traducido: {nombre} ({sku})")
                traducidos += 1
    
    # Guardar archivo corregido
    df.to_csv(archivo_salida, index=False)
    print(f"\n✅ Archivo guardado: {archivo_salida}")
    print(f"📊 Resumen:")
    print(f"   - Descripciones corregidas: {corregidos}")
    print(f"   - Traducciones agregadas: {traducidos + corregidos}")
    print(f"   - Total de productos procesados: {len(df)}")
    
    return archivo_salida

if __name__ == "__main__":
    archivo_csv = sys.argv[1] if len(sys.argv) > 1 else "data/GreenDolio_Productos_25nov.csv"
    archivo_salida = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not Path(archivo_csv).exists():
        print(f"❌ Error: No se encontró el archivo {archivo_csv}")
        sys.exit(1)
    
    corregir_descripciones(archivo_csv, archivo_salida)
