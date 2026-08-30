"use client"

import Link from "next/link"
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
}: {
  asChild?: boolean
  children: React.ReactNode
}) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]">
      {children}
    </Comp>
  )
}

export const SlotFixtures = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Clickable>Renders its own button</Clickable>

    <Clickable asChild>
      <a href="#slot" className="no-underline">
        Slot renders this anchor
      </a>
    </Clickable>

    <Clickable asChild>
      <Link href="/algo-test">Slot renders a next/link</Link>
    </Clickable>
  </div>
)

/** A real Radix primitive, with portalled content. */
export const RadixMenu = () => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]">
      Open menu
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={6}
        className="z-50 min-w-40 rounded-lg border border-border bg-background p-1 shadow-lg"
      >
        <DropdownMenu.Item className="cursor-default rounded px-2 py-1.5 font-inter text-[14px] outline-none data-highlighted:bg-muted">
          First item
        </DropdownMenu.Item>
        <DropdownMenu.Item className="cursor-default rounded px-2 py-1.5 font-inter text-[14px] outline-none data-highlighted:bg-muted">
          Second item
        </DropdownMenu.Item>
        <DropdownMenu.Separator className="my-1 h-px bg-border" />
        <DropdownMenu.Item className="cursor-default rounded px-2 py-1.5 font-inter text-[14px] outline-none data-highlighted:bg-muted">
          Third item
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)

/** Trigger using asChild — the trigger's DOM comes from the child. */
export const RadixAsChildTrigger = () => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <span className="cursor-default rounded-md bg-muted px-3 py-1.5 font-mono text-[13px]">
        Trigger rendered as a span
      </span>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={6}
        className="z-50 rounded-lg border border-border bg-background p-2 font-inter text-[14px] shadow-lg"
      >
        Portalled content
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)
