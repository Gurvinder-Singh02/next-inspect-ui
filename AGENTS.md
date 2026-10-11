# Flow documentation

Read [flow.md](flow.md) before changing source resolution, editor opening, inspector interactions, keyboard shortcuts, or component navigation. Update `flow.md` in the same change whenever that behavior changes. Keep its diagrams and control table consistent with the implementation, using short labels and simple language.

# Test app UI

Keep every test app’s suite interface identical to `apps/test-next-js`. After changing its accuracy components, shared UI primitives, theme, or styles, run `bun run sync:test-ui`. Keep fixtures and exact source expectations local to each app; Next.js alone runs Server Component cases.

# Fallow

Code intelligence for dead code, cycles, and changed-code risk. Config: `.fallowrc.jsonc`. Baseline: `fallow-baselines/dead-code.json`.

```bash
bun run fallow                 # full dead-code report
bun run fallow:baseline        # fail only on NEW findings vs committed baseline
bun run fallow:audit           # changed-code audit vs main (pre-commit uses this)
bunx fallow dead-code --workspace next-inspect-ui
bunx fallow architecture       # cycles / boundaries after structural edits
bunx fallow dead-code --trace path/to/file.ts:exportName
```

Prefer `--format json --quiet` in agent pipelines. Always `--dry-run` before `fallow fix --yes`. Do not delete exports from `next-inspect-ui` without tracing consumers — it is a `publicPackages` library. After clearing baseline findings, refresh with `fallow dead-code --save-baseline fallow-baselines/dead-code.json`.
