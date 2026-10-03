import type { ButtonHTMLAttributes, ReactNode } from "react"

export function ActionButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`action-button ${className}`} {...props}>{children}</button>
}
export function StatusBadge({ status }: { status: "Live" | "In review" | "Draft" }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(" ", "-")}`}><span />{status}</span>
}
export function Avatar({ name }: { name: string }) {
  return <span className="avatar" aria-label={name}>{name.split(" ").map(part => part[0]).join("")}</span>
}
export function MetricCard({ label, value, change, children }: { label: string; value: string; change: string; children?: ReactNode }) {
  return <article className="metric-card"><p>{label}</p><div className="metric-value">{value}</div><div className="metric-footer"><span>{change}</span>{children}</div></article>
}
