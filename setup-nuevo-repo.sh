#!/bin/bash

# Script para configurar el nuevo repositorio de GitHub
# Ejecutar después de crear el repositorio en GitHub

echo "🚀 Configurando nuevo repositorio para Green Dolio Test"
echo ""

# Solicitar la URL del nuevo repositorio
read -p "📋 Pega la URL del nuevo repositorio de GitHub (ej: https://github.com/greendolioexpress/greendolio-test.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Debes proporcionar la URL del repositorio"
    exit 1
fi

echo ""
echo "📦 Cambiando remote del repositorio..."
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"

# Cambiar el remote
git remote set-url origin "$REPO_URL"

echo "✅ Remote actualizado"
echo ""
echo "🔍 Verificando configuración:"
git remote -v
echo ""

# Preguntar si hacer push
read -p "¿Hacer push de la rama test-build ahora? (s/n): " PUSH_NOW

if [ "$PUSH_NOW" = "s" ] || [ "$PUSH_NOW" = "S" ]; then
    echo ""
    echo "📤 Haciendo push de test-build..."
    git push -u origin test-build
    
    echo ""
    read -p "¿También hacer push de main? (s/n): " PUSH_MAIN
    
    if [ "$PUSH_MAIN" = "s" ] || [ "$PUSH_MAIN" = "S" ]; then
        echo ""
        echo "📤 Haciendo push de main..."
        git checkout main
        git push -u origin main
        git checkout test-build
    fi
    
    echo ""
    echo "✅ ¡Push completado!"
    echo ""
    echo "🎯 Siguiente paso:"
    echo "   1. Ve a https://vercel.com"
    echo "   2. Click en 'Add New...' → 'Project'"
    echo "   3. Importa el repositorio: $(basename -s .git $REPO_URL)"
    echo "   4. Configura Root Directory: apps/web"
    echo "   5. Agrega las variables de entorno"
    echo "   6. Deploy!"
else
    echo ""
    echo "📝 Para hacer push manualmente más tarde:"
    echo "   git push -u origin test-build"
fi

echo ""
echo "✅ Configuración completada!"
