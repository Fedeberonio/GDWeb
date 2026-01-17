#!/bin/bash

# Script completo para deploy en Vercel con cuenta greendolioexpress
# Ejecutar después de crear el repositorio en GitHub y autenticarse en Vercel

set -e

echo "🚀 Deploy Completo - Green Dolio Test"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Paso 1: Verificando estado del repositorio...${NC}"
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"

# Verificar si hay cambios sin commitear
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear. ¿Deseas hacer commit? (s/n)${NC}"
    read -r COMMIT_CHANGES
    if [ "$COMMIT_CHANGES" = "s" ] || [ "$COMMIT_CHANGES" = "S" ]; then
        git add -A
        echo -e "${YELLOW}Ingresa el mensaje del commit:${NC}"
        read -r COMMIT_MSG
        git commit -m "${COMMIT_MSG:-chore: cambios para deploy}"
    fi
fi

echo ""
echo -e "${YELLOW}📋 Paso 2: Configurando repositorio remoto...${NC}"
echo -e "${YELLOW}Ingresa la URL del nuevo repositorio de GitHub:${NC}"
echo -e "${YELLOW}(ej: https://github.com/greendolioexpress/greendolio-test.git)${NC}"
read -r REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Error: Debes proporcionar la URL del repositorio${NC}"
    exit 1
fi

# Cambiar el remote
git remote set-url origin "$REPO_URL"
echo -e "${GREEN}✅ Remote actualizado${NC}"

echo ""
echo -e "${YELLOW}📋 Paso 3: Verificando autenticación de Vercel...${NC}"
cd apps/web

VERCEL_USER=$(vercel whoami 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Autenticado en Vercel como: $VERCEL_USER${NC}"
    echo -e "${YELLOW}¿Es la cuenta correcta (greendolioexpress@gmail.com)? (s/n)${NC}"
    read -r CORRECT_ACCOUNT
    if [ "$CORRECT_ACCOUNT" != "s" ] && [ "$CORRECT_ACCOUNT" != "S" ]; then
        echo -e "${YELLOW}Por favor, cierra sesión y vuelve a autenticarte:${NC}"
        echo -e "${YELLOW}  vercel logout${NC}"
        echo -e "${YELLOW}  vercel login${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No estás autenticado en Vercel${NC}"
    echo -e "${YELLOW}Por favor, autentícate:${NC}"
    echo -e "${YELLOW}  vercel login${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Paso 4: Haciendo push al repositorio...${NC}"
cd "/Users/aimac/Documents/GreenDolio-Pro copy 5"

CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Rama actual: $CURRENT_BRANCH${NC}"
echo -e "${YELLOW}¿Hacer push de esta rama? (s/n)${NC}"
read -r PUSH_NOW

if [ "$PUSH_NOW" = "s" ] || [ "$PUSH_NOW" = "S" ]; then
    echo -e "${YELLOW}Haciendo push...${NC}"
    git push -u origin "$CURRENT_BRANCH" || {
        echo -e "${RED}❌ Error al hacer push. Verifica tus credenciales.${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Push completado${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Paso 5: Configurando variables de entorno...${NC}"
echo -e "${YELLOW}¿Tienes el archivo .env.local con las variables? (s/n)${NC}"
read -r HAS_ENV

if [ "$HAS_ENV" = "s" ] || [ "$HAS_ENV" = "S" ]; then
    ENV_FILE="apps/web/.env.local"
    if [ -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}Leyendo variables de $ENV_FILE...${NC}"
        
        # Leer y configurar variables en Vercel
        while IFS='=' read -r key value; do
            # Ignorar comentarios y líneas vacías
            [[ "$key" =~ ^#.*$ ]] && continue
            [[ -z "$key" ]] && continue
            
            # Remover espacios y comillas
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs | sed "s/^['\"]//; s/['\"]$//")
            
            # Solo procesar variables NEXT_PUBLIC_
            if [[ "$key" == NEXT_PUBLIC_* ]]; then
                echo -e "${YELLOW}Configurando: $key${NC}"
                echo "$value" | vercel env add "$key" production preview development 2>&1 || {
                    echo -e "${YELLOW}⚠️  Error al agregar $key, puede que ya exista${NC}"
                }
            fi
        done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
        
        echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
    else
        echo -e "${RED}❌ Archivo .env.local no encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Deberás configurar las variables manualmente en Vercel${NC}"
    echo -e "${YELLOW}Ve a: https://vercel.com/[tu-proyecto]/settings/environment-variables${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Paso 6: Haciendo deploy en Vercel...${NC}"
cd apps/web

echo -e "${YELLOW}¿Hacer deploy ahora? (s/n)${NC}"
read -r DEPLOY_NOW

if [ "$DEPLOY_NOW" = "s" ] || [ "$DEPLOY_NOW" = "S" ]; then
    echo -e "${YELLOW}Iniciando deploy...${NC}"
    vercel --prod=false || {
        echo -e "${RED}❌ Error en el deploy${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Deploy completado${NC}"
else
    echo -e "${YELLOW}⚠️  Puedes hacer deploy más tarde con:${NC}"
    echo -e "${YELLOW}  cd apps/web && vercel --prod=false${NC}"
fi

echo ""
echo -e "${GREEN}✅ ¡Proceso completado!${NC}"
echo ""
echo -e "${YELLOW}📝 Resumen:${NC}"
echo -e "  - Repositorio: $REPO_URL"
echo -e "  - Rama: $CURRENT_BRANCH"
echo -e "  - Vercel: $(vercel whoami)"
echo ""
