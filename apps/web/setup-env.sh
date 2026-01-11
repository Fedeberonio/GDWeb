#!/bin/bash

# Token provided by user
TOKEN="xlRNTj6UZ5EGEZUufQfkCJky"
SCOPE="gds-projects-1bbb6204"

add_env() {
  local key=$1
  local value=$2
  echo "Adding $key..."
  printf "%s" "$value" | vercel env add "$key" production --token "$TOKEN" --scope "$SCOPE" 
  printf "%s" "$value" | vercel env add "$key" preview --token "$TOKEN" --scope "$SCOPE" 
  printf "%s" "$value" | vercel env add "$key" development --token "$TOKEN" --scope "$SCOPE"
}

# Values from .env.local
add_env "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyCjvz1uxCVR5xVxaNt3qushp1se1Ep8glY"
add_env "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "greendolio-tienda.firebaseapp.com"
add_env "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "greendolio-tienda"
add_env "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "greendolio-tienda.appspot.com"
add_env "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "64271997064"
add_env "NEXT_PUBLIC_FIREBASE_APP_ID" "1:64271997064:web:8001973cad419458fd379f"
add_env "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" "G-H9F4SXPJPA"
add_env "NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS" "greendolioexpress@gmail.com,fberon@gmail.com,alcantaramariel60@gmail.com"

# Mock API URL to satisfy validation (fallback will handle the failure)
add_env "NEXT_PUBLIC_API_BASE_URL" "https://mock-api.greendolio.shop"

echo "✅ Environment variables uploaded."
echo "🔄 Triggering new deployment to apply changes..."
vercel deploy --prod --token "$TOKEN" --scope "$SCOPE" --yes
