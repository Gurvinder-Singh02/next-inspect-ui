"use client";
import { useEffect } from "react";
import { getSourceForElement } from "@/lib/click-to-react-component/getSourceForElement";
import { InspectUI } from "next-inspect-ui";
import { ShowComponent, type ComponentHandle } from "show-component";
import { getElementContext } from "react-grab/primitives";

let showStarted = false;
let showComplete: ((value: unknown) => void) | undefined;
const captureShow = async (chain: ComponentHandle[]) => {
  showStarted = true;
  const sources = await Promise.all(
    chain.map(async (entry) => {
      const source = await entry.resolveSource();
      return { name: entry.componentName, filePath: source?.source ?? null };
    }),
  );
  showComplete?.({ filePath: sources[0]?.filePath ?? null, nodes: sources });
  // An out-of-range index suppresses editor navigation.
  return -1;
};
export default function BenchHarness() {
  useEffect(() => {
    (window as any).__SOURCE_BENCH__ = async (library: string, element: Element) => {
      if (library === "next-inspect-ui") {
        const result = await (window as any).__inspectUI.inspect(element, true);
        return { filePath: result.host.filePath, nodes: result.nodes, timings: result.timings };
      }
      if (library === "react-grab") {
        const result = await getElementContext(element);
        return { filePath: result.filePath, nodes: result.stack };
      }
      if (library === "show-component") {
        return new Promise((resolve) => {
          showStarted = false;
          showComplete = resolve;
          element.dispatchEvent(
            new MouseEvent("contextmenu", {
              bubbles: true,
              cancelable: true,
              altKey: true,
              button: 2,
            }),
          );
          if (!showStarted) resolve({ filePath: null, nodes: [] });
        });
      }
      const warn = console.warn;
      console.warn = () => {};
      try {
        const source = getSourceForElement(element as HTMLElement);
        return { filePath: source?.fileName ?? null, nodes: [] };
      } catch {
        return { filePath: null, nodes: [] };
      } finally {
        console.warn = warn;
      }
    };
    return () => {
      delete (window as any).__SOURCE_BENCH__;
    };
  }, []);
  return (
    <>
      <InspectUI />
      <ShowComponent getClickTarget={captureShow} />
    </>
  );
}
