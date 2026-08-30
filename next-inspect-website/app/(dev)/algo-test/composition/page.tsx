import { CaseLayout, Fixture } from "@/components/algo-test/case-layout"

const ITEMS = ["alpha", "beta", "gamma"]

const Panel = ({
  header,
  children,
}: {
  header: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="rounded-lg border border-border p-4">
    <div className="mb-2 font-inter text-[14px] font-medium">{header}</div>
    {children}
  </div>
)

const WithRenderProp = ({
  render,
}: {
  render: (value: string) => React.ReactNode
}) => <div className="flex gap-2">{render("from a render prop")}</div>

export default function CompositionCase() {
  const showConditional = ITEMS.length > 0

  return (
    <CaseLayout
      title="Composition patterns"
      reproduces="The ordinary ways JSX nests. None of these has ever been reported broken — they are here so a change that breaks them is caught by hovering rather than by a user."
      expected={
        <>
          every element on this page → <code>this file</code>
        </>
      }
    >
      <Fixture label="children">
        <Panel header="Passed as children">
          <p className="font-inter text-[14px] text-muted-foreground">
            This paragraph is a child.
          </p>
        </Panel>
      </Fixture>

      <Fixture label="element passed as a prop">
        <Panel
          header={<span className="text-muted-foreground">Header is JSX</span>}
        >
          <p className="font-inter text-[14px]">Body</p>
        </Panel>
      </Fixture>

      <Fixture label="render prop">
        <WithRenderProp
          render={(value) => (
            <span className="font-mono text-[13px]">{value}</span>
          )}
        />
      </Fixture>

      <Fixture label="map over a list">
        <ul className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <li key={item} className="font-mono text-[13px]">
              {item}
            </li>
          ))}
        </ul>
      </Fixture>

      <Fixture label="conditional and fragment">
        <>
          {showConditional ? (
            <p className="font-inter text-[14px]">Rendered by a ternary.</p>
          ) : null}
          {showConditional && (
            <p className="font-inter text-[14px] text-muted-foreground">
              Rendered by a logical AND.
            </p>
          )}
        </>
      </Fixture>
    </CaseLayout>
  )
}
