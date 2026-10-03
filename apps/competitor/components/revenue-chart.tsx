"use client"

import { useState } from "react"

export function RevenueChart() {
  const [period, setPeriod] = useState("Week")
  const weekly = [36, 48, 43, 65, 56, 80, 91]
  const monthly = [65, 52, 72, 48, 88, 76, 96]
  const values = period === "Week" ? weekly : monthly
  return (
    <section className="panel chart-panel" aria-label="Revenue chart">
      <div className="panel-heading"><div><h2>Revenue over time</h2><p>A little better, every day.</p></div><div className="segmented" aria-label="Chart period">{["Week", "Month"].map(item => <button key={item} aria-pressed={period === item} onClick={() => setPeriod(item)}>{item}</button>)}</div></div>
      <div className="chart-total">$24,680 <span>+18.6% this {period.toLowerCase()}</span></div>
      <svg className="revenue-chart" viewBox="0 0 620 150" role="img" aria-label={`${period} revenue: ${values.join(", ")}`}>
        {[25, 65, 105, 145].map(y => <line key={y} x1="0" x2="620" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.09" />)}
        {values.map((value, i) => <g key={i}><rect x={i * 87 + 19} y={145 - value * 1.3} width="47" height={value * 1.3} rx="5" fill={i === 6 ? "#da5b32" : "#efc6b8"} /><title>{`${value} units`}</title></g>)}
      </svg>
      <div className="chart-labels">{(period === "Week" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]).map(day => <span key={day}>{day}</span>)}</div>
    </section>
  )
}
