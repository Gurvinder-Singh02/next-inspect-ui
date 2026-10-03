import { Component, forwardRef, memo } from "react"

export function Button() {
  return <button data-target="button">Shared button</button>
}

export const MemoLabel = memo(function MemoLabel() {
  return <span data-target="memo">Memo label</span>
})

export const ForwardedInput = forwardRef<HTMLInputElement>(function ForwardedInput(_, ref) {
  return <input data-target="forward-ref" ref={ref} placeholder="Forwarded input" />
})

export class ClassBox extends Component {
  render() {
    return <div data-target="class">Class component</div>
  }
}

export function NestedButton() {
  return <div><Button /></div>
}

MemoLabel.displayName = "MemoLabel"
ForwardedInput.displayName = "ForwardedInput"

;(MemoLabel as unknown as { type: { displayName: string } }).type.displayName = "MemoLabel"
