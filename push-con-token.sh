#!/bin/bash

# Script para hacer push usando token directamente
# Uso: bash push-con-token.sh TU_TOKEN_AQUI

cd "$(dirname "$0")"

TOKEN=$1

if [ -z "$TOKEN" ]; then
    echo "❌ Necesitas pasar el token como argumento"
    echo ""
    echo "Uso:"
    echo "  bash push-con-token.sh ghp_tu_token_aqui"
    echo ""
    echo "O ejecuta manualmente:"
    echo "  git push https://TU_TOKEN@github.com/Fedeberonio/GDWeb.git test-build"
    exit 1
fi

echo "🚀 Haciendo push de test-build con token..."
echo ""

# Usar el token en la URL del remote temporalmente
git push https://${TOKEN}@github.com/Fedeberonio/GDWeb.git test-build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Push exitoso!"
    echo ""
    echo "📋 Verifica en GitHub:"
    echo "https://github.com/Fedeberonio/GDWeb/branches"
else
    echo ""
    echo "❌ Error en el push"
    echo "Verifica que el token sea correcto y tenga permisos 'repo'"
fi




