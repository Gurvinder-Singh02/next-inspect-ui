#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json, os, pathlib, signal, subprocess, time
state = pathlib.Path('/tmp') / ('next-inspect-verify-' + str(os.getuid())) / 'server.json'
if not state.exists(): print('No owned server recorded'); raise SystemExit(0)
record = json.loads(state.read_text())
pid = record['pid']
command = subprocess.run(['ps', '-p', str(pid), '-o', 'command='], capture_output=True, text=True).stdout.strip()
if not command: state.unlink(); print('Owned launcher already stopped'); raise SystemExit(0)
if record['command'] not in command or os.getpgid(pid) != pid:
    raise SystemExit('Process identity changed; refusing to stop an unrelated process')
os.killpg(pid, signal.SIGTERM)
for _ in range(50):
    try: os.killpg(pid, 0)
    except ProcessLookupError: break
    time.sleep(.1)
else: raise SystemExit('Owned process group is still running; keep the record for inspection')
state.unlink()
print('Stopped owned server group', pid, '; evidence preserved')
PY
