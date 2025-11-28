#!/bin/bash
# Build wrapper para Vercel
set -e

export NEXT_DISABLE_LIGHTNINGCSS=1

echo "🔨 Running Next.js build (webpack) with lightningcss disabled..."
npx next build
echo "✅ Build completed successfully"
