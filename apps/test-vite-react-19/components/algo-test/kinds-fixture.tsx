"use client";

import {
  Component,
  createContext,
  forwardRef,
  lazy,
  memo,
  Suspense,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * The declaration styles a component can have.
 *
 * Every one of these produces a differently-shaped fiber — class fibers, memo
 * and forwardRef wrappers, context providers and consumers — and resolution
 * walks fibers. None of them had a fixture before, so a regression in any would
 * have been invisible.
 */

/** Class component — still valid React, and a distinct fiber tag. */
export class ClassBox extends Component<{ label: string }> {
  render() {
    return (
      <div className="rounded-lg border border-border p-4 font-inter text-[14px]">
        {this.props.label}
      </div>
    );
  }
}

/** Class error boundary — the only place a class is still unavoidable. */
export class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="font-inter text-[14px]">Caught.</p>;
    }
    return this.props.children;
  }
}

export const ForwardedInput = forwardRef<
  HTMLInputElement,
  { hint: string; "data-accuracy-target"?: string }
>(function ForwardedInput({ hint, ...props }, ref) {
  return (
    <input
      ref={ref}
      placeholder={hint}
      className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
      {...props}
    />
  );
});

export const MemoPill = memo(function MemoPill({
  label,
  ...props
}: {
  label: string;
  "data-accuracy-target"?: string;
}) {
  return (
    <span className="rounded-full border border-border px-3 py-1 font-mono text-[12px]" {...props}>
      {label}
    </span>
  );
});

/** Higher-order component — the wrapper renders the wrapped one. */
export const withBorder = <P extends object>(Wrapped: React.ComponentType<P>) => {
  const WithBorder = (props: P) => (
    <div className="rounded-lg border border-dashed border-border p-3">
      <Wrapped {...props} />
    </div>
  );
  WithBorder.displayName = `withBorder(${Wrapped.displayName ?? Wrapped.name})`;
  return WithBorder;
};

const PlainNote = ({ text }: { text: string }) => <p className="font-inter text-[14px]">{text}</p>;

export const BorderedNote = withBorder(PlainNote);

/** Compound component — dot notation, a JSXMemberExpression at the call site. */
export const Panel = ({
  children,
  ...props
}: {
  children: ReactNode;
  "data-accuracy-target"?: string;
}) => (
  <div className="rounded-lg border border-border" {...props}>
    {children}
  </div>
);

Panel.Header = function PanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-border px-4 py-2 font-inter text-[14px] font-medium">
      {children}
    </div>
  );
};

Panel.Body = function PanelBody({ children }: { children: ReactNode }) {
  return <div className="px-4 py-3 font-inter text-[14px]">{children}</div>;
};

/**
 * Dot notation has to be exercised *inside* this client module. Next turns each
 * export of a "use client" file into a client-reference proxy, and property
 * access on a proxy yields undefined — so a Server Component writing
 * `<Panel.Header>` renders nothing and React throws "Element type is invalid".
 */
export const CompoundDemo = (props: { "data-accuracy-target"?: string }) => (
  <Panel {...props}>
    <Panel.Header>Header</Panel.Header>
    <Panel.Body>Body</Panel.Body>
  </Panel>
);

const ToneContext = createContext("muted");

export const ToneProvider = ({ children }: { children: ReactNode }) => (
  <ToneContext.Provider value="loud">{children}</ToneContext.Provider>
);

export const ToneReader = () => {
  const tone = useContext(ToneContext);
  return <span className="font-mono text-[13px]">tone: {tone}</span>;
};

/** Portal — DOM rendered outside this subtree entirely. */
export const PortalBox = () => {
  const [mounted, setMounted] = useState(false);

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() => setMounted((value) => !value)}
        className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
      >
        {mounted ? "close portal" : "open portal"}
      </button>

      {mounted &&
        createPortal(
          <div className="fixed right-6 bottom-6 z-50 rounded-lg border border-border bg-background px-4 py-3 font-inter text-[14px] shadow-lg">
            Rendered through a portal, attached to document.body.
          </div>,
          document.body,
        )}
    </div>
  );
};

/** Lazy — the element only exists after a dynamic import resolves. */
const LazyNote = lazy(async () => ({
  default: () => <p className="font-inter text-[14px]">Loaded lazily.</p>,
}));

export const LazyBox = () => (
  <Suspense fallback={<p className="font-inter text-[14px] text-muted-foreground">…</p>}>
    <LazyNote />
  </Suspense>
);

ForwardedInput.displayName = "ForwardedInput";
MemoPill.displayName = "MemoPill";
