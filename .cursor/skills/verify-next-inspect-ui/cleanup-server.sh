#!/usr/bin/env bash
# Kill the app started by launch-server.sh for this APP. Does not pkill unrelated Next servers.
set -u

APP="${APP:-site}"
PORT="${PORT:-3000}"
PIDFILE="/tmp/dev-server-${APP}.pid"

if [ -f "$PIDFILE" ]; then
  PID="$(cat "$PIDFILE")"
  if kill -0 "$PID" 2>/dev/null; then
    pkill -P "$PID" 2>/dev/null || true
    kill "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
    echo "Killed $APP PID $PID"
  else
    echo "PID $PID from $PIDFILE is not running"
  fi
  rm -f "$PIDFILE"
else
  echo "No $PIDFILE — nothing to kill for APP=$APP"
fi

if lsof -i ":$PORT" >/dev/null 2>&1; then
  echo "WARNING: Port $PORT still in use"
  lsof -i ":$PORT" || true
  exit 1
fi

echo "Port $PORT is free"
