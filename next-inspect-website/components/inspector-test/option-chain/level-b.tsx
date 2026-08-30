"use client"

import { LevelA } from "./level-a"

/** Direct child composite — ⌥+⇧ climb from LevelA succeeds. */
export const LevelB = () => <LevelA />
