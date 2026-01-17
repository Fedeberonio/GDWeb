#!/bin/bash

# Script para configurar variables de entorno en Vercel con cuenta correcta
TOKEN=BlHxzfmDnnCzS6vEXvEh5HbA
SCOPE=gds-projects-1bbb6204

cd "/Users/aimac/Documents/GreenDolio-Pro copy 5/apps/web"

echo "🔧 Configurando variables de entorno en Vercel (Cuenta: greendolioexpress)"
echo ""

# Función para agregar variable a los 3 ambientes
add_env_var() {
    local key=$1
    local value=$2
    echo "Agregando $key..."
    
    echo "$value" | vercel env add "$key" production --token "$TOKEN" --scope "$SCOPE" 2>&1 | grep -E "(Added|already)" || true
    echo "$value" | vercel env add "$key" preview --token "$TOKEN" --scope "$SCOPE" 2>&1 | grep -E "(Added|already)" || true
    echo "$value" | vercel env add "$key" development --token "$TOKEN" --scope "$SCOPE" 2>&1 | grep -E "(Added|already)" || true
    
    echo "✅ $key configurada"
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

echo "✅ Todas las variables configuradas"
echo ""
echo "🔄 Listando variables configuradas:"
vercel env ls --token "$TOKEN" --scope "$SCOPE" 2>&1 | head -30
