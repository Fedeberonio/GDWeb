#!/bin/bash

# Script para hacer push y preparar deploy en Vercel
# Ejecuta: bash push-and-deploy.sh

cd "$(dirname "$0")/.."

echo "🚀 Preparando push de rama test-build..."
echo ""

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "test-build" ]; then
    echo "⚠️  Estás en la rama: $CURRENT_BRANCH"
    echo "¿Quieres cambiar a test-build? (s/n)"
    read -r response
    if [ "$response" = "s" ]; then
        git checkout test-build
    else
        echo "❌ Cancelado"
        exit 1
    fi
fi

# Verificar commits pendientes
COMMITS_AHEAD=$(git rev-list --count origin/test-build..HEAD 2>/dev/null || echo "0")
if [ "$COMMITS_AHEAD" = "0" ]; then
    echo "✅ No hay commits nuevos para pushear"
else
    echo "📦 Hay $COMMITS_AHEAD commit(s) para pushear"
    echo ""
    echo "Haciendo push a origin/test-build..."
    git push origin test-build
    
    if [ $? -eq 0 ]; then
        echo "✅ Push exitoso!"
    else
        echo "❌ Error en el push. Verifica tus credenciales de GitHub."
        echo ""
        echo "Si necesitas un token:"
        echo "1. Ve a: https://github.com/settings/tokens"
        echo "2. Genera un token con permisos 'repo'"
        echo "3. Úsalo como contraseña cuando Git te lo pida"
        exit 1
    fi
fi

echo ""
echo "✅ Listo para deploy en Vercel!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ve a: https://vercel.com/gds-projects-1bbb6204"
echo "2. Inicia sesión"
echo "3. Importa el proyecto Fedeberonio/GDWeb"
echo "4. Configura:"
echo "   - Root Directory: GreenDolio-Pro/apps/web"
echo "   - Branch: test-build"
echo "5. Agrega las variables de entorno (ver VERCEL-DEPLOY-GUIDE.md)"
echo ""










