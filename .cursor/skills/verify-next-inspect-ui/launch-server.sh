#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
# A separate process group lets cleanup stop this launch without touching others.
python3 - "$root" "${1:-dev}" <<'PY'
import json, os, pathlib, subprocess, sys, time
root, script = sys.argv[1:]
allowed = {'dev', 'dev:test-next-js', 'dev:nextjs', 'dev:test'}
if script not in allowed: raise SystemExit('Choose a dev script listed in SKILL.md')
state_dir = pathlib.Path('/tmp') / ('next-inspect-verify-' + str(os.getuid()))
state_dir.mkdir(exist_ok=True)
state = state_dir / 'server.json'
if state.exists(): raise SystemExit('An owned launch is recorded; run cleanup-server.sh first')
log = state_dir / 'server.log'
with log.open('w') as output:
    process = subprocess.Popen(['bun', 'run', script], cwd=root, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
state.write_text(json.dumps({'pid': process.pid, 'command': 'bun run ' + script, 'root': root}))
for _ in range(120):
    text = log.read_text()
    if 'Ready in' in text or 'ready in' in text:
        print(text); print('Owned server PID:', process.pid); break
    if process.poll() is not None: raise SystemExit('Launch failed; inspect ' + str(log) + ' and run cleanup-server.sh')
    time.sleep(.5)
else: raise SystemExit('Readiness timed out; inspect ' + str(log) + ' and run cleanup-server.sh')
PY
