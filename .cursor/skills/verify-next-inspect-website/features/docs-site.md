# Docs site

The docs site is the public documentation chrome: Overview, Usage, Source Code, API Reference, and Shortcuts, plus the live demo link to `/components`.

## Sub-features

- `docs-overview` renders the Overview h1 and install section.
- `docs-usage` renders the Usage page.
- `docs-source` renders Source Code (placeholder is acceptable).
- `docs-api` renders API Reference.
- `docs-shortcuts` renders the shortcut list including Alt+X / Option+X.
- `docs-demo-link` exposes `Try the live demo →` to `/components`.

## How to get to it (user POV)

- Open `/` for Overview.
- Use the sticky nav: `Overview`, `Usage`, `Source Code`, `API Reference`, `Shortcuts`.
- From Overview, follow `Try the live demo →` to `/components`.

## Driving it with agent-browser

Preconditions:

- Doctor reports healthy at `http://127.0.0.1:4173`.
- Named `AGENT_BROWSER_SESSION` is set.

- **Overview.** Run `agent-browser open http://127.0.0.1:4173/`. Wait until `--text "next-inspect-ui"` is visible. Snapshot shows heading `next-inspect-ui`, nav link `Overview`, and `Try the live demo →`.
- **Usage.** Run `agent-browser find role link click --name "Usage"`. Wait until `--text "See next-inspect-ui in action."` URL is `/usage`.
- **Source Code.** Run `agent-browser find role link click --name "Source Code"`. Wait until heading `Source Code`. URL is `/source`.
- **API Reference.** Run `agent-browser find role link click --name "API Reference"`. Wait until heading `API Reference`. URL is `/api-reference`.
- **Shortcuts.** Run `agent-browser find role link click --name "Shortcuts"`. Wait until `--text "Keyboard and pointer controls"`. The page lists the toggle shortcut (Option + x / Alt+X) and Escape.
- **Live demo link.** Return to `/` and run `agent-browser find role link click --name "Try the live demo →"`. URL is `/components`. Wait until `--text "Inspect Components"`.
- **Proof.** For each visited route, run `agent-browser screenshot ./.cursor/skills/verify-next-inspect-website/artifacts/docs-site/<route>.png` and `agent-browser snapshot > ./.cursor/skills/verify-next-inspect-website/artifacts/docs-site/<route>.aria.txt`.

## Gotchas

- `/test` and `/variant-test` are not docs. They 404 in production and are covered by other feature files.
- Overview quotes the current `next-inspect-ui` package version from `package.json`. Assert the heading and sections, not a hard-coded version.
- The Debug overlay is present on docs pages in this verification build. It is not a docs failure.
