import type { ReactNode } from "react"
import Link from "next/link"

import inspectUIPackage from "next-inspect-ui/package.json"

import { contentLinkClassName } from "@/lib/content-link"
import { AUTHOR_NAME, AUTHOR_URL, GITHUB_AVATAR, GITHUB_REPO } from "@/lib/site"
import { cn } from "@/lib/utils"

const FooterLink = ({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) => {
  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        className={contentLinkClassName}
        rel={href === "/lab" ? "nofollow" : undefined}
      >
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={contentLinkClassName} target="_blank">
      {children}
    </a>
  )
}

export const SiteFooter = ({ className }: { className?: string }) => (
  <footer className={cn("flex justify-between pb-16 text-center", className)}>
    <p className="flex flex-wrap items-center justify-center gap-2 font-inter text-[14px] text-muted-foreground">
      Built by
      <a
        href={AUTHOR_URL}
        target="_blank"
        className={cn(
          contentLinkClassName,
          "inline-flex min-h-6 items-center gap-2"
        )}
      >
        <img
          src={GITHUB_AVATAR}
          alt=""
          width={24}
          height={24}
          decoding="async"
          loading="lazy"
          className="size-4 rounded-full outline outline-black/10 dark:outline-white/10"
        />
        {AUTHOR_NAME}
      </a>
    </p>
    <nav
      aria-label="Footer"
      className="mt-3 flex flex-wrap items-center justify-center gap-x-2 font-inter text-[13px] text-muted-foreground"
    >
      <span>v{inspectUIPackage.version}</span>
      <span aria-hidden>·</span>
      <FooterLink href="/lab">Lab</FooterLink>
      <span aria-hidden>·</span>
      <FooterLink href={GITHUB_REPO}>GitHub</FooterLink>
    </nav>
  </footer>
)
