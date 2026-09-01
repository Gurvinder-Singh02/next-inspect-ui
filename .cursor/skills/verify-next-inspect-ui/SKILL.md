---
name: verify-next-inspect-ui
description: Launch next-inspect-ui demo surfaces, verify InspectUI overlay interactions, capture evidence, and clean up
---

# verify-next-inspect-ui

Verification skill for next-inspect-ui surfaces. The overlay lets developers hover any element to see its source file, click to open it, and hold ⌥ to climb to the component that rendered it.

This is a **three-app** repo. Routes are **not** interchangeable on one port.

| Script | App | What it hosts |
| --- | --- | --- |
| `pnpm dev` | `site` | Marketing/docs (`/`, `/shortcuts`, `/usage`, `/source`, `/api-reference`) |
| `pnpm dev:example` | `apps/next-js-example` | Accuracy suite (`/` redirects to `/test`) |
| `pnpm dev:dashboard` | `apps/shadcn-dashboard-001-example` | Dashboard `/` and the component gallery `/components` |

Site `/test` and `/components` **404**. Footer links on the site that point at those paths are same-origin and dead; do not treat a 404 as a failed doctor on `site`.

## When to use this skill

Use when you need to:

- Verify InspectUI overlay toggle, hover tooltip, and Esc
- Prove marketing/docs pages render
- Prove the dashboard `/components` gallery renders
- Prove `/test` Run all accuracy (the product check for source resolution)

## Launch

Repo root is three directories above this file (`.cursor/skills/verify-next-inspect-ui` → repo).

### Build the library

```bash
cd "$(git rev-parse --show-toplevel)"
pnpm install
pnpm run build
```

### Start only the apps you will drive

Default port is 3000. When more than one app is up, assign `PORT`.

Leave each helper **running** (background the command). It waits on `pnpm` after printing ready so the server is not reaped when the launcher would otherwise exit.

```bash
# site (landing + shortcuts + overlay on docs) — APP=site PORT=3000 is the default
bash .cursor/skills/verify-next-inspect-ui/launch-server.sh

# accuracy suite
APP=example PORT=3001 bash .cursor/skills/verify-next-inspect-ui/launch-server.sh

# component gallery
APP=dashboard PORT=3002 bash .cursor/skills/verify-next-inspect-ui/launch-server.sh
```

**Ready signal**: stdout `Server ready on http://localhost:<port>` and log line `Ready in`. Then `curl` the doctor URL.

**No auth**. No seed data.

If Playwright complains that Chromium is missing, the environment likely set `PLAYWRIGHT_BROWSERS_PATH` to an empty cache. `unset PLAYWRIGHT_BROWSERS_PATH` (user cache) or `pnpm exec playwright install chromium`.

### Teardown

Kill **only** PIDs this run started (PID files `/tmp/dev-server-<app>.pid`). Do not `pkill -f "next dev"` — that murders unrelated Next apps on the machine.

```bash
APP=site PORT=3000 bash .cursor/skills/verify-next-inspect-ui/cleanup-server.sh
APP=example PORT=3001 bash .cursor/skills/verify-next-inspect-ui/cleanup-server.sh
APP=dashboard PORT=3002 bash .cursor/skills/verify-next-inspect-ui/cleanup-server.sh
```

## Doctor

Health check after launch, before driving. All checks are read-only. Doctor the **app you are about to drive**, not “whatever is on 3000”.

### Site (`pnpm dev`)

```bash
curl -I http://localhost:3000
curl -s http://localhost:3000 | grep -q "next-inspect-ui"
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/shortcuts   # 200
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/test        # 404
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/components  # 404
```

Home must be **200** (not a 307 to `/test`). A 307 means you are on the example app.

### Example (`pnpm dev:example`)

```bash
curl -sI http://localhost:3001 | grep -i location   # /test
curl -o /dev/null -s -w "%{http_code}" http://localhost:3001/test   # 200
curl -s http://localhost:3001/test | grep -q "Run all"
```

### Dashboard (`pnpm dev:dashboard`)

```bash
curl -o /dev/null -s -w "%{http_code}" http://localhost:3002/components   # 200
curl -s http://localhost:3002/components | grep -q "Inspect Components"
```

**If the check for that app fails**, do not drive it. Fix or report. A site 404 on `/components` is healthy.

## Drive

Playwright from the repo root. Prefer `data-slot`, visible text, and overlay attrs below — not `data-inspect-active` (that attribute does not exist).

Overlay markers (present after mount, hidden until hover while active):

- `[data-dev-inspector-overlay]`
- `[data-dev-inspector-tooltip]`
- `[data-dev-inspector-tooltip-label]`

Activation is a JS flag: `document.body.style.cursor === "crosshair"`. Overlay `display` stays `none` until hover. `window.__inspectUI` is an inspect **probe** (`inspect(el)`), not a toggle API. Toggle by dispatching Alt+X (`key: "x"`, `code: "KeyX"`, `altKey: true`) — headless `keyboard.press` is flaky.

Full pass (adjust URLs to the ports you launched):

```bash
SITE_URL=http://localhost:3000 \
EXAMPLE_URL=http://localhost:3001 \
DASHBOARD_URL=http://localhost:3002 \
node .cursor/skills/verify-next-inspect-ui/verify-surfaces.cjs
```

Landing-only:

```bash
SITE_URL=http://localhost:3000 node .cursor/skills/verify-next-inspect-ui/verify-landing-page.js
```

## Evidence

Store artifacts in `/tmp/verify-evidence/` (survives cleanup). Do not delete that directory.

Proof: user path + resulting state (screenshot or log). Overlay proof is cursor + overlay/tooltip `display !== none` after hover, not a class on `html`.

## Cleanup

Kill PIDs from `/tmp/dev-server-<app>.pid` and their children. Verify that app’s port is free. **Never** delete `/tmp/verify-evidence`.

## Helpers

All scripts live next to this file. Invocation is above. `launch-server.sh` and `cleanup-server.sh` take `APP=site|example|dashboard` and `PORT`.
