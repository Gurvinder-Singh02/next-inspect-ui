# nextjs

Dashboard example with InspectUI. Run `bun run dev:nextjs` and open http://localhost:3102.

The example serves `next-inspect-ui/script` through `/inspect-ui.js` only in development. Its production route returns 404 and the production layout omits the script tag. The script mounts the inspector itself. See [script setup](../../packages/next-inspect-ui/README.md#dev-only-script-like-react-grab).

Source resolution uses the library's internal stack reader and map decoder. For a smaller development download, use the guarded component import shown in [Usage](../../packages/next-inspect-ui/README.md).
