#!/usr/bin/env python3
"""
Script para actualizar el archivo Excel con las correcciones del CSV.
"""

import pandas as pd
import sys
from pathlib import Path

def actualizar_excel_desde_csv(archivo_excel: str, archivo_csv_corregido: str):
    """
    Actualiza el archivo Excel con las descripciones corregidas del CSV.
    """
    if not Path(archivo_excel).exists():
        print(f"❌ Error: No se encontró el archivo Excel {archivo_excel}")
        return False
    
    if not Path(archivo_csv_corregido).exists():
        print(f"❌ Error: No se encontró el archivo CSV corregido {archivo_csv_corregido}")
        return False
    
    print(f"Leyendo Excel: {archivo_excel}")
    df_excel = pd.read_excel(archivo_excel)
    
    print(f"Leyendo CSV corregido: {archivo_csv_corregido}")
    df_csv = pd.read_csv(archivo_csv_corregido)
    
    print(f"Total de productos en Excel: {len(df_excel)}")
    print(f"Total de productos en CSV: {len(df_csv)}")
    
    # Crear un diccionario con las correcciones del CSV
    correcciones = {}
    for _, row in df_csv.iterrows():
        sku = row['SKU']
        if pd.notna(row.get('Descripcion_Corta')):
            correcciones[sku] = {
                'Descripcion_Corta': row['Descripcion_Corta'],
                'Descripcion_Corta_EN': row.get('Descripcion_Corta_EN', '')
            }
    
    # Actualizar el Excel
    actualizados = 0
    for idx, row in df_excel.iterrows():
        sku = row['SKU']
        if sku in correcciones:
            df_excel.at[idx, 'Descripcion_Corta'] = correcciones[sku]['Descripcion_Corta']
            # Si existe la columna en el Excel, actualizarla
            if 'Descripcion_Corta_EN' in df_excel.columns:
                df_excel.at[idx, 'Descripcion_Corta_EN'] = correcciones[sku]['Descripcion_Corta_EN']
            else:
                # Si no existe, agregarla
                if actualizados == 0:
                    df_excel['Descripcion_Corta_EN'] = ''
                df_excel.at[idx, 'Descripcion_Corta_EN'] = correcciones[sku]['Descripcion_Corta_EN']
            
            nombre = row.get('Nombre_Producto', sku)
            print(f"✓ Actualizado: {nombre} ({sku})")
            actualizados += 1
    
    # Guardar el Excel actualizado
    archivo_salida = archivo_excel.replace('.xlsx', '_CORREGIDO.xlsx')
    df_excel.to_excel(archivo_salida, index=False)
    print(f"\n✅ Archivo Excel actualizado guardado: {archivo_salida}")
    print(f"📊 Total de productos actualizados: {actualizados}")
    
    return True

if __name__ == "__main__":
    archivo_excel = sys.argv[1] if len(sys.argv) > 1 else "data/GreenDolio_Maestro_COMPLETO_25nov.xlsx"
    archivo_csv = sys.argv[2] if len(sys.argv) > 2 else "data/GreenDolio_Productos_25nov_CORREGIDO.csv"
    
    actualizar_excel_desde_csv(archivo_excel, archivo_csv)
