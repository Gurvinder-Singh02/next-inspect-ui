export type InspectDebugFlags = {
  debug: boolean
  verify: boolean
}

let flags: InspectDebugFlags = { debug: false, verify: false }

export const setInspectDebugFlags = (next: Partial<InspectDebugFlags>) => {
  flags = { ...flags, ...next }
}

export const getInspectDebugFlags = () => flags
