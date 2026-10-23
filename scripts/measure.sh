#!/usr/bin/env bash
# Phase 0 baseline: backend latency measurement.
#
#   BACKEND_URL=https://<service>.onrender.com/api/v1 TOKEN=<jwt> ./scripts/measure.sh
#
# BACKEND_URL  (required) API base, including /api or /api/v1 (same as VITE_API_URL).
# TOKEN        (optional) JWT; without it only the unauthenticated probe runs.
# RUNS         (optional) requests per endpoint, default 5.
# COLD_ONLY=1  (optional) run only the unauthenticated probe (cold-start test).
#
# Times are in milliseconds: connect / first byte (TTFB) / total.
set -u

: "${BACKEND_URL:?Set BACKEND_URL, e.g. https://your-service.onrender.com/api/v1}"
BASE="${BACKEND_URL%/}"
RUNS="${RUNS:-5}"
TOKEN="${TOKEN:-}"

# one request -> "connect_ms ttfb_ms total_ms http_code"
timed() {
  local url="$1"; shift
  curl -s -o /dev/null --max-time 90 "$@" \
    -w '%{time_connect} %{time_starttransfer} %{time_total} %{http_code}\n' "$url" |
    awk '{printf "%.0f %.0f %.0f %s\n", $1*1000, $2*1000, $3*1000, $4}'
}

median() { sort -n | awk '{a[NR]=$1} END{print (NR%2)? a[(NR+1)/2] : int((a[NR/2]+a[NR/2+1])/2)}'; }

echo "Backend: $BASE"
echo "Date:    $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo

# Unauthenticated probe: Spring rejects it (401/403) without touching the DB,
# so this isolates server wake-up + network (cold start) from query time.
echo "== Unauthenticated probe (cold start) =="
read -r c f t code < <(timed "$BASE/memories/folders")
printf 'GET /memories/folders (no token)  connect=%sms  ttfb=%sms  total=%sms  http=%s\n' "$c" "$f" "$t" "$code"
echo

[ "${COLD_ONLY:-0}" = "1" ] && exit 0

if [ -z "$TOKEN" ]; then
  echo "TOKEN not set - skipping authenticated Home page endpoints."
  exit 0
fi

# Endpoints HomePage.jsx loads in parallel on mount.
ENDPOINTS=(
  "/memories/folders?includeArchived=false"
  "/dates?includeArchived=false"
  "/love-board/notes"
)

echo "== Home page endpoints ($RUNS runs each, median ms) =="
printf '%-42s %8s %8s %8s  %s\n' endpoint connect ttfb total http
for ep in "${ENDPOINTS[@]}"; do
  cs=(); fs=(); ts=(); code=""
  for _ in $(seq "$RUNS"); do
    read -r c f t code < <(timed "$BASE$ep" -H "Authorization: Bearer $TOKEN")
    cs+=("$c"); fs+=("$f"); ts+=("$t")
  done
  printf '%-42s %8s %8s %8s  %s\n' "$ep" \
    "$(printf '%s\n' "${cs[@]}" | median)" \
    "$(printf '%s\n' "${fs[@]}" | median)" \
    "$(printf '%s\n' "${ts[@]}" | median)" "$code"
done
