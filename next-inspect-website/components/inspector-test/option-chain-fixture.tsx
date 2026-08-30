"use client"

import { PageComp } from "./option-chain/page-comp"
import { WrappedLeaf } from "./option-chain/wrapped-leaf"

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="font-mono text-[11px]">{children}</kbd>
)

const Scenario = ({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) => (
  <li className="flex flex-col gap-0.5">
    <span className="font-mono text-[11px] text-foreground">
      {id} · {title}
    </span>
    <span className="text-[12px] text-muted-foreground">{children}</span>
  </li>
)

/**
 * Live fixtures for the locked inspect model (manual — use InspectUI ⌥X).
 */
export const OptionChainFixture = () => (
  <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
    <div className="flex flex-col gap-1">
      <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
        Live climb scenarios
      </h2>
      <p className="text-[13px] text-muted-foreground">
        Activate inspect (<Kbd>⌥X</Kbd>), then run each scenario. Click always
        opens whatever the tooltip shows. Press <Kbd>I</Kbd> for the info
        panel (tracks ⌥ live — release resets to DOM).
      </p>
    </div>

    <ol className="flex list-none flex-col gap-2.5 border-t border-border pt-3">
      <Scenario id="S1" title="Hover DOM">
        Orange button → tooltip{" "}
        <span className="font-mono text-foreground">
          {"<button> · leaf-comp.tsx:…"}
        </span>
      </Scenario>
      <Scenario id="S2" title="⌥ climb">
        Hold <Kbd>⌥</Kbd> →{" "}
        <span className="font-mono text-foreground">{"<LeafComp/>"}</span> +
        usage path (rendered by). Info: rendered by + source + 2-node tree.
      </Scenario>
      <Scenario id="S3" title="⌥+⇧ climb">
        Still holding <Kbd>⌥</Kbd>, press <Kbd>⇧</Kbd> → LevelA → LevelB →
        LevelC → PageComp. Top of tree → shake, stay.
      </Scenario>
      <Scenario id="S4" title="Release ⌥">
        Tooltip + info snap back to DOM (
        <span className="font-mono text-foreground">{"<button>"}</span>).
      </Scenario>
      <Scenario id="S5" title="HTML wrapper blocks">
        Red button + <Kbd>⌥</Kbd> → shake; tooltip stays on DOM line.
      </Scenario>
      <Scenario id="S6" title="Info only via I">
        Shake never opens info. <Kbd>I</Kbd> toggles the panel.
      </Scenario>
    </ol>

    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        Climb chain (direct children, no HTML wrappers)
      </h3>
      <div className="rounded-lg bg-[#0b0b0c] p-3">
        <PageComp />
      </div>
    </div>

    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        Wrapper block
      </h3>
      <div className="rounded-lg bg-[#0b0b0c] p-3">
        <WrappedLeaf />
      </div>
    </div>
  </section>
)
