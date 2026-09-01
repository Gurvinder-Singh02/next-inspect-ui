#!/usr/bin/env bash
# Kill dev server and verify port is free

if [ -f /tmp/dev-server.pid ]; then
  PID=$(cat /tmp/dev-server.pid)
  if kill -0 $PID 2>/dev/null; then
    kill $PID
    wait $PID 2>/dev/null || true
    echo "Killed PID $PID"
  fi
  rm /tmp/dev-server.pid
fi

# Also kill any remaining next dev processes
pkill -f "next dev" || true

# Wait a moment for processes to die
sleep 1

# Verify port is free
if lsof -i :3000 >/dev/null 2>&1; then
  echo "WARNING: Port 3000 still in use"
  lsof -i :3000
  exit 1
else
  echo "Port 3000 is free"
fi
