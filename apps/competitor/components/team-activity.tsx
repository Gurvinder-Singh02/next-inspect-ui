import { Avatar } from "./primitives"

const activity = [
  { name: "Maya Chen", action: "published the Studio refresh", time: "12 min ago" },
  { name: "Leo Martin", action: "updated the mobile prototype", time: "48 min ago" },
  { name: "Nina Patel", action: "finished the checkout review", time: "2 hours ago" },
]
function ActivityItem({ item }: { item: typeof activity[number] }) {
  return <li><Avatar name={item.name} /><div><p><strong>{item.name}</strong> {item.action}</p><span>{item.time}</span></div></li>
}
export function TeamActivity() {
  return <section className="panel activity-panel"><div className="panel-heading"><div><h2>Team activity</h2><p>Small updates. Real progress.</p></div><span className="eyebrow">SERVER COMPONENT</span></div><ul>{activity.map(item => <ActivityItem key={item.name} item={item} />)}</ul><p className="activity-note">Three people, one shared workspace.</p></section>
}
