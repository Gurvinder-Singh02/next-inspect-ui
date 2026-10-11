# Overlay toggle

On the accuracy suite or dashboard demo, press Alt+X, hover a known fixture, and assert `[data-dev-inspector-overlay]` and `[data-dev-inspector-tooltip]` become visible with the expected bounds and label. Press Space and assert `[data-dev-inspector-info]` opens and closes. Press Escape and assert the inspector hides.

Use real keyboard events. Overlay DOM nodes can exist while inactive; existence alone does not prove activation. Follow `flow.md` for climb icons, tree previews, and navigation.
