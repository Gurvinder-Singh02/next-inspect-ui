"use client"

import { useEffect, useRef, useState } from "react"
import { ActionButton, Avatar, StatusBadge } from "./primitives"

type Project = { id: number; name: string; category: string; owner: string; status: "Live" | "In review" | "Draft"; progress: number }
const initialProjects: Project[] = [
  { id: 1, name: "Studio refresh", category: "Website", owner: "Maya Chen", status: "Live", progress: 100 },
  { id: 2, name: "Mobile workspace", category: "Product design", owner: "Leo Martin", status: "In review", progress: 82 },
  { id: 3, name: "Checkout, simplified", category: "Experience", owner: "Nina Patel", status: "In review", progress: 68 },
  { id: 4, name: "Autumn campaign", category: "Brand", owner: "Maya Chen", status: "Draft", progress: 35 },
  { id: 5, name: "Help center", category: "Website", owner: "Leo Martin", status: "Live", progress: 100 },
]
function ProjectRow({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false)
  return <><tr><td><button className="project-name" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{project.name}<span>{project.category}</span></button></td><td><div className="owner"><Avatar name={project.owner} />{project.owner}</div></td><td><StatusBadge status={project.status} /></td><td><div className="progress-cell"><progress value={project.progress} max={100} aria-label={`${project.name} progress`} /><span>{project.progress}%</span></div></td><td><button className="row-toggle" aria-label={`Details for ${project.name}`} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "−" : "+"}</button></td></tr>{expanded && <tr className="detail-row"><td colSpan={5}>{project.name} is owned by {project.owner}. Current stage: {project.status.toLowerCase()}. Click the project name to close this detail.</td></tr>}</>
}
function NewProjectDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal(); ref.current?.querySelector("input")?.focus() }, [])
  return <dialog ref={ref} onClose={onClose} aria-labelledby="new-project-title"><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); onCreate(String(data.get("name")).trim()) }}><div className="dialog-heading"><h2 id="new-project-title">A new beginning.</h2><button type="button" aria-label="Close new project" onClick={onClose}>×</button></div><p>Give your next project a name.</p><label htmlFor="project-name">Project name</label><input id="project-name" name="name" placeholder="Something worth making" required maxLength={80} autoFocus /><div className="dialog-actions"><ActionButton type="button" className="secondary" onClick={onClose}>Cancel</ActionButton><ActionButton type="submit">Create project</ActionButton></div></form></dialog>
}
export function ProjectTable() {
  const [projects, setProjects] = useState(initialProjects)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("All statuses")
  const [sort, setSort] = useState(false)
  const [creating, setCreating] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const rows = projects.filter(project => project.name.toLowerCase().includes(query.toLowerCase()) && (status === "All statuses" || project.status === status))
  if (sort) rows.sort((a, b) => a.name.localeCompare(b.name))
  function create(name: string) {
    if (!name) return
    setProjects(prev => [...prev, { id: Date.now(), name, category: "New project", owner: "You", status: "Draft", progress: 0 }])
    setQuery(""); setStatus("All statuses"); setCreating(false); setAnnouncement(`${name} created.`)
  }
  return <section id="projects" className="panel projects-panel"><div className="panel-heading"><div><h2>Projects</h2><p>A few things we’re working on.</p></div><ActionButton onClick={() => setCreating(true)}>+ New project</ActionButton></div><div className="table-controls"><label className="search-field"><span>⌕</span><input aria-label="Search projects" placeholder="Search projects…" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}>{["All statuses", "Live", "In review", "Draft"].map(value => <option key={value}>{value}</option>)}</select><span className="result-count" role="status">{rows.length} projects</span></div><div className="table-scroll" role="region" aria-label="Projects table" tabIndex={0}><table><caption className="sr-only">Workspace projects, owners, status, and progress</caption><thead><tr><th scope="col" aria-sort={sort ? "ascending" : "none"}><button onClick={() => setSort(!sort)}>Project {sort ? "↑" : "↕"}</button></th><th scope="col">Owner</th><th scope="col">Status</th><th scope="col">Progress</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{rows.map(project => <ProjectRow key={project.id} project={project} />)}{rows.length === 0 && <tr><td colSpan={5} className="empty-state">No projects found. Try another search.</td></tr>}</tbody></table></div><div className="table-footer"><span>Showing {rows.length} of {projects.length} projects</span><span role="status">{announcement || "Click a project to see its details."}</span></div>{creating && <NewProjectDialog onClose={() => setCreating(false)} onCreate={create} />}</section>
}
