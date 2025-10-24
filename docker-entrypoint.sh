#!/bin/sh
set -e

# Replace environment variables in runtime config if config.json exists
if [ -f /usr/share/nginx/html/assets/config.json ]; then
    cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "apiUrl": "${API_URL:-/api}",
  "apiBaseUrl": "${API_BASE_URL:-/api}"
}
EOF
    echo "Runtime configuration updated with API_URL=${API_URL:-/api}"
fi

# Execute CMD
exec "$@"
