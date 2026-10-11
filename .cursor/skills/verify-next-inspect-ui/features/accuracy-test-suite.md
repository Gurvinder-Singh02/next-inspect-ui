# Accuracy suite

Use `bun run dev:test-next-js`, normally `http://localhost:3001/test`. Doctor the route first; a 5xx or blank page is a product gap, not a skill pass. Verify group visibility controls, Show source, Test, Run all, then open Logs and compare expected/result entries. A loaded fixture is not a passing test. Report actual pass/fail results; use `match-expected-case` for exact-line expectations.

Use compatibility apps when relevant (`bun run dev:test` ports in `SKILL.md`). Next.js includes Server Component cases; Vite runs browser cases. Read current fixture metadata rather than hardcoding counts.
