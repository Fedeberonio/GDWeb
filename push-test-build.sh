#!/bin/bash

# Script para hacer push de la rama test-build
# Ejecuta: bash push-test-build.sh

cd "$(dirname "$0")"

echo "🚀 Haciendo push de la rama test-build a GitHub..."
echo ""

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "test-build" ]; then
    echo "⚠️  Estás en la rama: $CURRENT_BRANCH"
    echo "Cambiando a test-build..."
    git checkout test-build
fi

# Verificar commits pendientes
COMMITS_AHEAD=$(git rev-list --count origin/test-build..HEAD 2>/dev/null || echo "0")
if [ "$COMMITS_AHEAD" = "0" ]; then
    echo "✅ No hay commits nuevos para pushear"
    echo "La rama test-build ya está actualizada en GitHub"
    exit 0
fi

echo "📦 Hay $COMMITS_AHEAD commit(s) para pushear:"
git log --oneline origin/test-build..HEAD 2>/dev/null || git log --oneline -5
echo ""

echo "Haciendo push..."
echo "Si te pide credenciales:"
echo "  - Usuario: tu usuario de GitHub"
echo "  - Contraseña: usa un Personal Access Token (no tu contraseña)"
echo "  - Crear token: https://github.com/settings/tokens"
echo ""

git push origin test-build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Push exitoso!"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Ve a: https://github.com/Fedeberonio/GDWeb/branches"
    echo "2. Verifica que la rama 'test-build' aparezca"
    echo "3. Luego configura Vercel (ver GreenDolio-Pro/INSTRUCCIONES-RAPIDAS.md)"
else
    echo ""
    echo "❌ Error en el push"
    echo ""
    echo "Si necesitas un token de GitHub:"
    echo "1. Ve a: https://github.com/settings/tokens"
    echo "2. Click en 'Generate new token (classic)'"
    echo "3. Nombre: 'GDWeb Push'"
    echo "4. Permisos: marca 'repo'"
    echo "5. Click en 'Generate token'"
    echo "6. Copia el token y úsalo como contraseña"
fi




