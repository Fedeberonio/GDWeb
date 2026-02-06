#!/bin/bash

# Script de deploy para Green Dolio
# Siempre usa la cuenta correcta: greendolioexpress

set -e

# Configuración
TOKEN="BlHxzfmDnnCzS6vEXvEh5HbA"
SCOPE="gds-projects-1bbb6204"
PROJECT_DIR="/Users/aimac/Documents/GreenDolio-Pro copy 14/apps/web"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploy Green Dolio${NC}"
echo "================================"
echo ""

# Verificar que estamos en el directorio correcto
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Error: No se pudo cambiar al directorio $PROJECT_DIR${NC}"
    exit 1
}

# Verificar cuenta
echo -e "${YELLOW}🔍 Verificando cuenta...${NC}"
CURRENT_USER=$(vercel whoami --token "$TOKEN" 2>&1)

if [[ "$CURRENT_USER" != *"greendolioexpress"* ]]; then
    echo -e "${RED}❌ ERROR: Cuenta incorrecta!${NC}"
    echo -e "${RED}Cuenta actual: $CURRENT_USER${NC}"
    echo -e "${RED}Debe ser: greendolioexpress-1091${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cuenta correcta: $CURRENT_USER${NC}"
echo ""

# Preguntar tipo de deploy
echo -e "${YELLOW}¿Tipo de deploy?${NC}"
echo "1) Preview (recomendado para pruebas)"
echo "2) Production"
read -p "Opción [1]: " DEPLOY_TYPE

if [ -z "$DEPLOY_TYPE" ] || [ "$DEPLOY_TYPE" = "1" ]; then
    PROD_FLAG="--prod=false"
    echo -e "${YELLOW}📦 Deploy Preview...${NC}"
else
    PROD_FLAG="--prod"
    echo -e "${YELLOW}📦 Deploy Production...${NC}"
    read -p "¿Estás seguro? (s/n): " CONFIRM
    if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
        echo -e "${YELLOW}Cancelado${NC}"
        exit 0
    fi
fi

echo ""

# Hacer deploy
echo -e "${YELLOW}🚀 Iniciando deploy...${NC}"
vercel --token "$TOKEN" --scope "$SCOPE" $PROD_FLAG --yes

echo ""
echo -e "${GREEN}✅ Deploy completado!${NC}"
echo ""
echo -e "${YELLOW}📋 Para ver los deployments:${NC}"
echo "   vercel ls --token $TOKEN --scope $SCOPE"
