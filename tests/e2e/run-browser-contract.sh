#!/bin/sh
set -eu

if [ ! -f dist/server/main.js ] || [ ! -f dist/client/index.html ]; then
  echo "Browser tests require a production build. Run npm run build first." >&2
  exit 1
fi

PORT="${CEDULJICA_E2E_PORT:-43123}"
BASE_URL="http://127.0.0.1:${PORT}"
SESSION="${CEDULJICA_E2E_SESSION:-ceduljica-e2e}"
SCRIPT="${CEDULJICA_E2E_SCRIPT:-tests/e2e/browser-contract.js}"
# Refuse an occupied port rather than accidentally testing an unrelated runtime.
node --input-type=module -e "import net from 'node:net'; const server = net.createServer(); server.on('error', error => { console.error(error.message); process.exit(1); }); server.listen(${PORT}, '127.0.0.1', () => server.close());"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ceduljica-e2e.XXXXXX")"
SERVER_PID=""

cleanup() {
  playwright-cli -s="$SESSION" close >/dev/null 2>&1 || true
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

CEDULJICA_DB_PATH="$TMP_DIR/ceduljica.sqlite" HOST=127.0.0.1 PORT="$PORT" \
  node dist/server/main.js >"$TMP_DIR/server.log" 2>&1 &
SERVER_PID=$!

attempt=0
until node -e "fetch('${BASE_URL}/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 50 ]; then
    echo "Ceduljica E2E server did not become healthy." >&2
    cat "$TMP_DIR/server.log" >&2
    exit 1
  fi
  sleep 0.2
done

playwright-cli -s="$SESSION" open "$BASE_URL" >/dev/null
playwright-cli -s="$SESSION" run-code --filename="$SCRIPT"
