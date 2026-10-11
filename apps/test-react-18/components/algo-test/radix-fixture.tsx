"use client"

import Link from "../../src/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Slot } from "@radix-ui/react-slot"

/**
 * Radix fixtures.
 *
 * Radix retargets differently from Base UI. `asChild` makes a component render
 * *its child* instead of its own host, merging props onto it — so the DOM node
 * that appears was authored at the child's JSX, not the parent's, and the
 * parent contributes only props. Base UI's `useRender` instead builds a fresh
 * host inside the library.
 *
 * Both end with DOM the caller never literally wrote, by different routes.
 */

/** A wrapper using Slot directly — the shadcn `asChild` pattern. */
const Clickable = ({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean
  children: React.ReactNode
  "data-accuracy-target"?: string
}) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className="border-border rounded-md border px-3 py-1.5 font-mono text-[13px]"
      {...props}
    >
      {children}
    </Comp>
  )
}

export const SlotFixtures = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Clickable data-accuracy-target="button">Renders its own button</Clickable>

    <Clickable asChild data-accuracy-target="anchor">
      <a href="#slot" className="no-underline">
        Slot renders this anchor
      </a>
    </Clickable>

    <Clickable asChild data-accuracy-target="link">
      <Link href="/test">Slot renders a link</Link>
    </Clickable>
  </div>
)

/** A real Radix primitive, with portalled content. */
const RadixMenu = () => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger className="border-border rounded-md border px-3 py-1.5 font-mono text-[13px]">
      Open menu
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={6}
        className="border-border bg-background z-50 min-w-40 rounded-lg border p-1 shadow-lg"
      >
        <DropdownMenu.Item className="font-inter data-highlighted:bg-muted cursor-default rounded px-2 py-1.5 text-[14px] outline-none">
          First item
        </DropdownMenu.Item>
        <DropdownMenu.Item className="font-inter data-highlighted:bg-muted cursor-default rounded px-2 py-1.5 text-[14px] outline-none">
          Second item
        </DropdownMenu.Item>
        <DropdownMenu.Separator className="bg-border my-1 h-px" />
        <DropdownMenu.Item className="font-inter data-highlighted:bg-muted cursor-default rounded px-2 py-1.5 text-[14px] outline-none">
          Third item
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)

/** Trigger using asChild — the trigger's DOM comes from the child. */
const RadixAsChildTrigger = () => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <span className="bg-muted cursor-default rounded-md px-3 py-1.5 font-mono text-[13px]">
        Trigger rendered as a span
      </span>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={6}
        className="border-border bg-background font-inter z-50 rounded-lg border p-2 text-[14px] shadow-lg"
      >
        Portalled content
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)
