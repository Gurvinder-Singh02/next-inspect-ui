import { Button } from "@/components/ui/button"

/**
 * Nested server component rendering the shared client Button.
 * Church-site pattern: MinistryCard (server) → <Button/> → Base UI primitive.
 */
const MinistryCard = ({
  label,
  ...props
}: {
  label: string
  "data-accuracy-target"?: string
}) => (
  <div className="border-border rounded-lg border p-3">
    <Button data-accuracy-target={props["data-accuracy-target"]} size="sm">
      {label}
    </Button>
  </div>
)

export const ServerButtonCard = (props: {
  "data-accuracy-target"?: string
}) => <MinistryCard label="Learn More" {...props} />
