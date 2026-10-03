"use client";

import * as React from "react";
import * as LucideIcons from "lucide-react";

export function IconPlaceholder({
  lucide,
  className,
  ...props
}: {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
} & React.ComponentProps<"svg">) {
  if (!lucide) {
    return null;
  }

  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<React.ComponentProps<"svg">> | undefined
  >;
  const Icon = icons[lucide];

  if (!Icon) {
    return null;
  }

  return <Icon className={className} {...props} />;
}
