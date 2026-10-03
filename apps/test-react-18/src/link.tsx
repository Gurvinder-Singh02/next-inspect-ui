import type { ComponentProps } from "react";

export default function LinkComponent(props: ComponentProps<"a">) {
  return <a {...props} />;
}
