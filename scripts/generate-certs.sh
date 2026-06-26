#!/usr/bin/env bash
# Generate a self-signed TLS certificate for local development.
#
# Output:
#   nginx/certs/localhost.crt
#   nginx/certs/localhost.key
#
# Browsers will warn about the self-signed cert — accept the exception
# for localhost. Re-run this script if the cert expires (default 365
# days) or if you want to rotate the key.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CERT_DIR="${REPO_ROOT}/nginx/certs"

mkdir -p "${CERT_DIR}"

CERT_PATH="${CERT_DIR}/localhost.crt"
KEY_PATH="${CERT_DIR}/localhost.key"

if [[ -f "${CERT_PATH}" && -f "${KEY_PATH}" && "${1:-}" != "--force" ]]; then
    echo "Cert already exists at ${CERT_PATH}. Use --force to regenerate."
    exit 0
fi

openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "${KEY_PATH}" \
    -out "${CERT_PATH}" \
    -days 365 \
    -subj "/C=US/ST=Dev/L=Local/O=gps-tracker/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "${KEY_PATH}"

echo "Generated self-signed cert:"
echo "  cert: ${CERT_PATH}"
echo "  key:  ${KEY_PATH}"
echo ""
echo "Trust it in your browser, or add the cert to your OS trust store to"
echo "silence the warning."