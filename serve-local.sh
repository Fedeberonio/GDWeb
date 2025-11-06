#!/bin/sh
set -e

PORT="${PORT:-8000}"

echo "Sirviendo Green Dolio en http://localhost:${PORT}"
echo "Presiona Ctrl+C para detener el servidor."

python3 -m http.server "${PORT}"
