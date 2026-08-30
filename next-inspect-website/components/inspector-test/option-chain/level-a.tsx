"use client"

import { LeafComp } from "./leaf-comp"

/** Direct child composite — ⌥ climb from LeafComp succeeds. */
export const LevelA = () => <LeafComp />
