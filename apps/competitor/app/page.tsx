import { ArrowUpRight, Layers, Sparkles } from "lucide-react"
import { MetricCard } from "@/components/primitives"
import { ProjectTable } from "@/components/project-table"
import { RevenueChart } from "@/components/revenue-chart"
import { TeamActivity } from "@/components/team-activity"

function WorkspaceNav() {
  return (
    <nav className="workspace-nav" aria-label="Workspace navigation">
      <a className="wordmark" href="#overview">
        <Layers size={20} strokeWidth={1.6} />
        atelier<span>/ workspace</span>
      </a>
      <div>
        <a href="#overview">Overview</a>
        <a href="#projects">Projects</a>
        <a href="#activity">Activity</a>
      </div>
      <span className="workspace-user" aria-label="Signed in as Alex">
        AL
      </span>
    </nav>
  )
}
function PageHeading() {
  return (
    <header className="page-heading" id="overview">
      <div>
        <p className="eyebrow">YOUR WORKSPACE, AT A GLANCE</p>
        <h1>Good work starts here.</h1>
        <p>Everything you’re building, in one little place.</p>
      </div>
      <a className="quiet-link" href="#projects">
        View projects <ArrowUpRight size={16} />
      </a>
    </header>
  )
}
export default function CompetitorPage() {
  return (
    <div className="workspace">
      <WorkspaceNav />
      <main>
        <PageHeading />
        <div className="metrics">
          <MetricCard
            label="Total revenue"
            value="$24,680"
            change="↗ 18.6% from last month"
          >
            <ArrowUpRight size={18} />
          </MetricCard>
          <MetricCard
            label="Active projects"
            value="12"
            change="3 ready for review"
          >
            <Layers size={18} />
          </MetricCard>
          <MetricCard
            label="Team happiness"
            value="98%"
            change="Good things happen together"
          >
            <Sparkles size={18} />
          </MetricCard>
        </div>
        <div className="overview-grid">
          <RevenueChart />
          <div id="activity">
            <TeamActivity />
          </div>
        </div>
        <ProjectTable />
        <footer className="workspace-footer">
          <span>atelier / made for making.</span>
          <span>
            Client components · server components · SVG · lists · dialogs
          </span>
        </footer>
      </main>
    </div>
  )
}
