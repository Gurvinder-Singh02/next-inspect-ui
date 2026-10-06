"use client";

import { useSuite } from "@/components/accuracy/suite-context";
import { cn } from "@/lib/utils";

/** One suite group — sticky title + timeline rail on the left, cases on the right. */
export const SuiteGroup = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { isGroupVisible } = useSuite();
  if (!isGroupVisible(title)) return null;

  return (
    <section
      data-suite-group={title}
      className={cn(
        "relative flex scroll-mt-[calc(var(--suite-header-height,4.5rem)+1rem)] items-stretch gap-5 sm:gap-8 md:gap-10",
        // Fade the timeline rail only on the last SuiteGroup sibling.
        "last:[&_[data-suite-rail]]:mask-b-from-0",
        className,
      )}
    >
      <div className="relative w-28 shrink-0 sm:w-36">
        <div
          aria-hidden
          data-suite-rail=""
          className="absolute top-2 left-[4px] h-full w-px bg-border"
        />

        <div className="sticky top-[calc(var(--suite-header-height,4.5rem)+2rem)] z-10 flex items-start gap-2">
          <span
            aria-hidden
            className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-amber-300"
          />
          <h2 className="text-[15px] font-medium tracking-tight capitalize">{title}</h2>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-10 pb-14">{children}</div>
    </section>
  );
};
