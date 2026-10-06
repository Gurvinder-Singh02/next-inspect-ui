"use client"

import { useId, useState } from "react"

import { CodeBlock } from "@/components/landing/code-block"
import { CopyableText } from "@/components/landing/copyable-text"
import { cn } from "@/lib/utils"

export type UsageTab = {
  id: string
  label: string
  description: string
  code: string
  html: string
  prompt: string
}

const FrameworkIcon = ({ framework }: { framework: string }) => {
  if (framework === "vite") return (
    <svg aria-hidden="true" width="14" height="14" className="shrink-0" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style={{"fill": "color(display-p3 .5252 .23 1)", "fillOpacity": "1"}}/><mask id="vite__mask0_2002_17158" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style={{"maskType": "alpha"}}><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style={{"fill": "#000", "fillOpacity": "1"}}/></mask><g mask="url(#vite__mask0_2002_17158)"><g filter="url(#vite__filter0_f_2002_17158)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style={{"fill": "color(display-p3 .9275 .9033 1)", "fillOpacity": "1"}} transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#vite__filter1_f_2002_17158)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style={{"fill": "color(display-p3 .9275 .9033 1)", "fillOpacity": "1"}} transform="matrix(.00324 1 1 -.00324 -39.328 7.883)"/></g><g filter="url(#vite__filter2_f_2002_17158)"><ellipse cx="5.508" cy="30.487" fill="#7e14ff" rx="5.508" ry="30.487" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(89.814 -25.913 -14.639)scale(1 -1)"/></g><g filter="url(#vite__filter3_f_2002_17158)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(89.814 -32.644 -3.334)scale(1 -1)"/></g><g filter="url(#vite__filter4_f_2002_17158)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(89.814 -32.454 -1.99)scale(1 -1)"/></g><g filter="url(#vite__filter5_f_2002_17158)"><ellipse cx="14.072" cy="22.078" fill="#ede6ff" rx="14.072" ry="22.078" style={{"fill": "color(display-p3 .9275 .9033 1)", "fillOpacity": "1"}} transform="rotate(93.35 24.506 48.493)scale(-1 1)"/></g><g filter="url(#vite__filter6_f_2002_17158)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#vite__filter7_f_2002_17158)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#vite__filter8_f_2002_17158)"><ellipse cx=".387" cy="8.972" fill="#7e14ff" rx="4.407" ry="29.108" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(39.51 .387 8.972)"/></g><g filter="url(#vite__filter9_f_2002_17158)"><ellipse cx="47.523" cy="-6.092" fill="#7e14ff" rx="4.407" ry="29.108" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(37.892 47.523 -6.092)"/></g><g filter="url(#vite__filter10_f_2002_17158)"><ellipse cx="41.412" cy="6.333" fill="#47bfff" rx="5.971" ry="9.665" style={{"fill": "color(display-p3 .2799 .748 1)", "fillOpacity": "1"}} transform="rotate(37.892 41.412 6.333)"/></g><g filter="url(#vite__filter11_f_2002_17158)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#vite__filter12_f_2002_17158)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#vite__filter13_f_2002_17158)"><ellipse cx="35.651" cy="29.907" fill="#7e14ff" rx="4.407" ry="29.108" style={{"fill": "color(display-p3 .4922 .0767 1)", "fillOpacity": "1"}} transform="rotate(37.892 35.651 29.907)"/></g><g filter="url(#vite__filter14_f_2002_17158)"><ellipse cx="38.418" cy="32.4" fill="#47bfff" rx="5.971" ry="15.297" style={{"fill": "color(display-p3 .2799 .748 1)", "fillOpacity": "1"}} transform="rotate(37.892 38.418 32.4)"/></g></g><defs><filter id="vite__filter0_f_2002_17158" width="60.045" height="41.654" x="-19.77" y="16.149" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="vite__filter1_f_2002_17158" width="90.34" height="51.437" x="-54.613" y="-7.533" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="vite__filter2_f_2002_17158" width="79.355" height="29.4" x="-49.64" y="2.03" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter3_f_2002_17158" width="79.579" height="29.4" x="-45.045" y="20.029" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter4_f_2002_17158" width="79.579" height="29.4" x="-43.513" y="21.178" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter5_f_2002_17158" width="74.749" height="58.852" x="15.756" y="-17.901" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="vite__filter6_f_2002_17158" width="61.377" height="25.362" x="23.548" y="2.284" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter7_f_2002_17158" width="61.377" height="25.362" x="23.548" y="2.284" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter8_f_2002_17158" width="56.045" height="63.649" x="-27.636" y="-22.853" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter9_f_2002_17158" width="54.814" height="64.646" x="20.116" y="-38.415" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter10_f_2002_17158" width="33.541" height="35.313" x="24.641" y="-11.323" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter11_f_2002_17158" width="54.814" height="64.646" x="-29.286" y="6.009" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter12_f_2002_17158" width="54.814" height="64.646" x="-29.286" y="6.009" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter13_f_2002_17158" width="54.814" height="64.646" x="8.244" y="-2.416" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="vite__filter14_f_2002_17158" width="39.409" height="43.623" x="18.713" y="10.588" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter></defs></svg>
  )
  return (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
    {framework === "nextjs" ? (
      <>
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M8 16V8l8 10M16 8v6" stroke="var(--background)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <g stroke="currentColor" strokeWidth="1.3" className="text-sky-400">
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
      </g>
    )}
  </svg>
  )
}

export const UsageTabs = ({ tabs }: { tabs: UsageTab[] }) => {
  const [selected, setSelected] = useState(0)
  const id = useId()
  const active = tabs[selected]
  if (!active) return null
  const entryFile =
    active.id === "nextjs"
      ? "app/layout.tsx"
      : active.id === "react"
        ? "src/index.js"
        : "src/main.tsx"
  const details = active.description
    .replace(`Add this to ${entryFile}. `, "")
    .replace("For Create React App, update src/index.js. ", "")

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Framework"
        className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-xl bg-muted/50 p-1"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${id}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected === index}
            aria-controls={`${id}-panel`}
            tabIndex={selected === index ? 0 : -1}
            data-cuelume-toggle="tick"
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next = index
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length
              else if (event.key === "ArrowLeft")
                next = (index + tabs.length - 1) % tabs.length
              else if (event.key === "Home") next = 0
              else if (event.key === "End") next = tabs.length - 1
              else return
              event.preventDefault()
              setSelected(next)
              document.getElementById(`${id}-${tabs[next].id}`)?.focus()
            }}
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 font-inter text-[13px] tracking-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
              selected === index
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
            )}
          >
            <FrameworkIcon framework={tab.id} />
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${active.id}`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3">
          <p>Tell your agent</p>
          <CopyableText text={active.prompt} />
        </div>
        <div className="my-3 flex items-center gap-4" aria-label="Or">
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
        <p>
          Do it manually. Add this to <code>{entryFile}</code>. {details}
        </p>
        <CodeBlock code={active.code} html={active.html} />
      </div>
    </div>
  )
}
