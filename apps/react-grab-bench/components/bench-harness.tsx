"use client";
import { useEffect, useState, type ComponentType } from "react";
export default function BenchHarness() {
  const [Tool, setTool] = useState<ComponentType | null>(null);
  useEffect(() => {
    let disposed = false;
    const load = async () => {
      const tool = window.location.search.includes("library=open")
        ? (await import("next-inspect-ui")).InspectUI
        : (await import("./comparison-harness")).default;
      if (!disposed) setTool(() => tool);
    };
    void load();
    return () => {
      disposed = true;
    };
  }, []);
  return Tool ? <Tool /> : null;
}
