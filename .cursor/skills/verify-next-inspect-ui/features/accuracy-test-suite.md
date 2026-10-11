# Accuracy suite

Use `bun run dev:test-next-js`, normally `http://localhost:3001/test`. Verify group visibility controls, Show source, Test, Run all, and expected/result logs. A loaded fixture is not a passing test. Report actual pass/fail results; use `match-expected-case` for exact-line expectations.

Use compatibility apps when relevant. Next.js includes Server Component cases; Vite runs browser cases. Read current fixture metadata rather than hardcoding counts.
