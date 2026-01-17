#!/bin/bash

# Script para configurar variables de entorno en Vercel
# Siempre usa la cuenta correcta: greendolioexpress

set -e

# Configuración
TOKEN="BlHxzfmDnnCzS6vEXvEh5HbA"
SCOPE="gds-projects-1bbb6204"
PROJECT_DIR="/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Configurando Variables de Entorno${NC}"
echo "=========================================="
echo ""

# Verificar cuenta
CURRENT_USER=$(vercel whoami --token "$TOKEN" 2>&1)
if [[ "$CURRENT_USER" != *"greendolioexpress"* ]]; then
    echo -e "${RED}❌ ERROR: Cuenta incorrecta!${NC}"
    echo -e "${RED}Cuenta actual: $CURRENT_USER${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cuenta correcta: $CURRENT_USER${NC}"
echo ""

cd "$PROJECT_DIR" || exit 1

# Función para agregar variable
add_env_var() {
    local key=$1
    local value=$2
    echo -e "${YELLOW}Agregando $key...${NC}"
    
    echo "$value" | vercel env add "$key" production --token "$TOKEN" --scope "$SCOPE" 2>&1 | grep -E "(Added|already)" || true
    echo "$value" | vercel env add "$key" preview --token "$TOKEN" --scope "$SCOPE" 2>&1 | grep -E "(Added|already)" || true
    echo "$value" | vercel env add "$key" development --token "$TOKEN" --scope "$SCOPE" 2>&1 | grep -E "(Added|already)" || true
    
    echo -e "${GREEN}✅ $key configurada${NC}"
    echo ""
}

# Variables de Firebase
add_env_var "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyCjvz1uxCVR5xVxaNt3qushp1se1Ep8glY"
add_env_var "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "greendolio-tienda.firebaseapp.com"
add_env_var "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "greendolio-tienda"
add_env_var "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "greendolio-tienda.appspot.com"
add_env_var "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "64271997064"
add_env_var "NEXT_PUBLIC_FIREBASE_APP_ID" "1:64271997064:web:8001973cad419458fd379f"
add_env_var "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" "G-H9F4SXPJPA"
add_env_var "NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS" "greendolioexpress@gmail.com"
add_env_var "NEXT_PUBLIC_API_BASE_URL" "http://localhost:5001/api"

echo -e "${GREEN}✅ Todas las variables configuradas${NC}"
echo ""
echo -e "${YELLOW}📋 Variables configuradas:${NC}"
vercel env ls --token "$TOKEN" --scope "$SCOPE" 2>&1 | head -30
