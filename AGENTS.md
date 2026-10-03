# Flow documentation

Read [flow.md](flow.md) before changing source resolution, editor opening, inspector interactions, keyboard shortcuts, or component navigation. Update `flow.md` in the same change whenever that behavior changes. Keep its diagrams and control table consistent with the implementation, using short labels and simple language.

# Test app UI

Keep every test app’s suite interface identical to `apps/test-next-js`. After changing its accuracy components, shared UI primitives, theme, or styles, run `bun run sync:test-ui`. Keep fixtures and exact source expectations local to each app; Next.js alone runs Server Component cases.
