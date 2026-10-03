"use client"

import dynamic from "next/dynamic"

const Agentation = dynamic(() => import("agentation").then(module => module.Agentation), { ssr: false })
const InterfaceKit = dynamic(() => import("interface-kit/react").then(module => module.InterfaceKit), { ssr: false })

export function DesignTools() {
  return <><Agentation /><InterfaceKit /></>
}
