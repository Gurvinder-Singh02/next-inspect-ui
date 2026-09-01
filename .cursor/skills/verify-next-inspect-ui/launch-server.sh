#!/usr/bin/env bash
# Launch one demo app and wait for Ready in.
# APP=site|example|dashboard  PORT=3000
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP="${APP:-site}"
PORT="${PORT:-3000}"
LOG="/tmp/dev-server-${APP}.log"
PIDFILE="/tmp/dev-server-${APP}.pid"

case "$APP" in
  site) FILTER="site" ;;
  example) FILTER="next-js-example" ;;
  dashboard) FILTER="shadcn-dashboard-001-example" ;;
  *)
    echo "APP must be site, example, or dashboard (got: $APP)"
    exit 1
    ;;
esac

if [ -f "$PIDFILE" ]; then
  OLD="$(cat "$PIDFILE")"
  if kill -0 "$OLD" 2>/dev/null; then
    echo "Already running $APP as PID $OLD (remove $PIDFILE if stale)"
    exit 1
  fi
  rm -f "$PIDFILE"
fi

cd "$ROOT"
: > "$LOG"
# Stay in the foreground after ready so process-group-killing runners
# (and `bash launch-server.sh &`) keep pnpm alive. Do not detach.
PORT="$PORT" pnpm --filter "$FILTER" dev >> "$LOG" 2>&1 &
PID=$!
echo "$PID" > "$PIDFILE"

ready=0
for _ in $(seq 1 120); do
  if grep -q "Ready in" "$LOG" 2>/dev/null; then
    ready=1
    break
  fi
  if ! kill -0 "$PID" 2>/dev/null; then
    break
  fi
  sleep 0.5
done

if [ "$ready" -ne 1 ]; then
  echo "Server failed to start ($APP on :$PORT)"
  cat "$LOG"
  exit 1
fi

echo "Server ready on http://localhost:${PORT} (APP=$APP PID $PID)"
wait "$PID"
