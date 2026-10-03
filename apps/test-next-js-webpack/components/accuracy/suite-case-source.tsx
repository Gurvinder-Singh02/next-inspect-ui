"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon, ChevronsUpDown, CodeIcon } from "lucide-react";

import { CodeBlock } from "@/components/accuracy/code-block";
import type { SuiteSourceFile } from "@/components/accuracy/types";
import { cn } from "@/lib/utils";

const tabLabel = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.startsWith("used")) return "Used";
  if (lower.includes("defined")) return "Defined";
  return label;
};

export const SuiteCaseSource = ({ sources }: { sources: SuiteSourceFile[] }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = useMemo(
    () =>
      sources.map((source, index) => ({
        index,
        key: `${source.label}:${source.file}`,
        name: tabLabel(source.label),
        file: source.file,
        code: source.code,
        html: source.html,
      })),
    [sources],
  );

  const active = tabs[activeIndex] ?? tabs[0];

  if (sources.length === 0 || !active) return null;

  return (
    <div className="flex flex-col gap-2 px-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "mb-2 inline-flex w-fit items-center gap-1.5",
          "font-mono text-[10px] tracking-wide text-muted-foreground uppercase",
          "transition-colors hover:text-foreground",
        )}
      >
        <ChevronsUpDown className="size-3" aria-hidden />
        {open ? "Hide source" : "Show source"}
      </button>

      {open ? (
        <div className="flex flex-col overflow-hidden rounded-xl bg-muted/30">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-1">
            <div role="tablist" aria-label="Source view" className="flex min-w-0">
              {tabs.map((tab) => {
                const isActive = tab.index === active.index;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveIndex(tab.index)}
                    className={cn(
                      "relative inline-flex min-h-9 items-center px-3",
                      "font-mono text-[10px] tracking-wide uppercase",
                      "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.name}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-colors",
                        isActive ? "bg-foreground" : "bg-transparent",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <span
              className="min-w-0 shrink truncate pr-3 text-right font-mono text-[11px] text-muted-foreground"
              title={active.file}
            >
              {active.file}
            </span>
          </div>

          <CodeBlock
            code={active.code}
            html={active.html}
            className="rounded-none bg-transparent px-3 py-3 shadow-none"
          />
        </div>
      ) : null}
    </div>
  );
};
