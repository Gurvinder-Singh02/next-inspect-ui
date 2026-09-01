#!/usr/bin/env bash
# Launch dev server and wait for ready signal

cd /workspace
pnpm run dev > /tmp/dev-server.log 2>&1 &
PID=$!
echo $PID > /tmp/dev-server.pid

# Wait for ready signal
timeout 30 bash -c '
  while ! grep -q "Ready in" /tmp/dev-server.log 2>/dev/null; do
    sleep 0.5
  done
'

if grep -q "Ready in" /tmp/dev-server.log; then
  echo "Server ready on http://localhost:3000 (PID $PID)"
  exit 0
else
  echo "Server failed to start"
  cat /tmp/dev-server.log
  exit 1
fi
