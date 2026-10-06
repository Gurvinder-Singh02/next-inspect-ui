"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export const CodeBlock = ({
  code,
  html,
  className,
}: {
  code: string;
  html: string;
  className?: string;
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), 1600);
    } catch {
      setHasCopied(false);
    }
  };

  return (
    <div className={cn("landing-code relative rounded-xl bg-card px-4 py-3.5", className)}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3.5 right-4 z-10 font-inter text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline"
        aria-label={hasCopied ? "Copied" : "Copy code"}
      >
        {hasCopied ? "Copied" : "Copy"}
      </button>
      <div className="overflow-x-auto pr-14">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};
