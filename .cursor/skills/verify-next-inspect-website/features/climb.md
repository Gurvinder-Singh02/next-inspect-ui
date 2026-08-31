# Climb

Climb holds Option (Alt) while inspect mode is on so the overlay moves from the DOM host to the component that rendered it, then Option+Shift walks further up the owner chain.

## Sub-features

- `climb-hold` shows the usage site while Option is held on a hovered host.
- `climb-shift` walks one owner further with Option+Shift.
- `climb-release` returns to the host tooltip when Option is released.
- `climb-blocked` shakes and logs when there is no owner to climb to.

## How to get to it (user POV)

- On `/test/source-open/shadcn-host`, inspect a `<Button>`, then hold Option. Expected: hover is `components/ui/button.tsx`; Option climb is this case file.
- On `/components`, hover any composed card control and hold Option.
- While holding Option, press Shift to climb again; press Control to walk back down.

## Driving it with agent-browser

Preconditions:

- Doctor reports healthy at `http://127.0.0.1:4173`.
- Named `AGENT_BROWSER_SESSION` is set.
- Inspect mode is on (Debug log contains `inspect mode on`).

- **Open the shadcn case.** Run `agent-browser open http://127.0.0.1:4173/test/source-open/shadcn-host`. Wait until `--text "Send code"` is visible. Press `Alt+x` if inspect mode is off.
- **Hover host.** Run `agent-browser find role button hover --name "Send code"`. Tooltip / debug hover line names `<button>` and `button.tsx`. Overlay `display` is `block`.
- **Hold Option.** Run `agent-browser keydown Alt`. Tooltip switches to a component tag (`<Button/>`) and the case file (`shadcn-host/page.tsx` or equivalent). Debug log records the climb, not `⌥: HTML wrapper or no owner — can't climb`.
- **Walk up.** While Option is held, run `agent-browser press Shift`. Tooltip / log moves to the next owner, or log shows `⇧: top of tree` / `⇧: can't climb` if already at the top.
- **Release.** Run `agent-browser keyup Alt`. Host tooltip returns to `<button>` · `button.tsx`. Do not press Escape until the proof is captured. Escape also exits inspect mode.
- **Proof.** Screenshot `./.cursor/skills/verify-next-inspect-website/artifacts/climb/held.png` while Option is held, plus eval of tooltip text and the Debug log excerpt, into `./.cursor/skills/verify-next-inspect-website/artifacts/climb/held.eval.txt`.

## Gotchas

- Release Option resets climb. A screenshot taken after keyup proves the host, not the climb.
- HTML wrappers that are not a direct component child refuse to climb: overlay shakes and the log says `⌥: HTML wrapper or no owner — can't climb`. That is a pass for the blocked path, a fail on `Send code`.
- Click still opens the editor. Do not click the hovered host.
- Blur deactivates inspect mode and drops the climb.
