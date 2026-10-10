import overlayCss from "../styles/overlay.css"
import { ensureInspectorStyles } from "../styles/styles.ts"

/** Inject the inspector overlay/tooltip stylesheet once (for demos and custom hosts). */
export const ensureInspectOverlayStyles = (doc = document) =>
  ensureInspectorStyles(overlayCss, doc)
