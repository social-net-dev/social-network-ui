#!/bin/sh
set -e

# Path to the config file in the container
CONFIG_FILE="/srv/config.js"

# Default value if not set
API_URL="${VITE_API_BASE_URL:-/api}"

echo "Generating runtime config..."
echo "VITE_API_BASE_URL=${API_URL}"

# Create the config.js file
cat <<EOF > "$CONFIG_FILE"
window.__ENV__ = {
  VITE_API_BASE_URL: "${API_URL}"
};
EOF

echo "Config generated at $CONFIG_FILE"

# Execute the CMD passed to the container
exec "$@"
