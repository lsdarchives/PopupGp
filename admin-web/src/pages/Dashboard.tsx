import type { EventWithId } from '../../../shared/types/event'

interface DashboardProps {
  events: EventWithId[]
}

function Dashboard({ events }: DashboardProps) {
  const totalRsvps = events.reduce((sum, event) => sum + (event.rsvpCount ?? 0), 0)
  const upcomingEvents = events.filter((event) => event.startAt > new Date()).length
  const categories = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const categoryEntries = Object.entries(categories) as Array<[string, number]>

  return (
    <div className="page-content">
      <div className="section-grid">
        <article className="metric-card">
          <p className="metric-label">Total events</p>
          <h2>{events.length}</h2>
        </article>
        <article className="metric-card">
          <p className="metric-label">RSVPs across events</p>
          <h2>{totalRsvps}</h2>
        </article>
        <article className="metric-card">
          <p className="metric-label">Upcoming events</p>
          <h2>{upcomingEvents}</h2>
        </article>
        <article className="metric-card">
          <p className="metric-label">Event categories</p>
          <h2>{Object.keys(categories).length}</h2>
        </article>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Insights</p>
            <h3>Category breakdown</h3>
          </div>
        </div>

        <div className="analytics-grid">
          {categoryEntries.length === 0 ? (
            <div className="empty-state">
              <p>Category data will appear here once hosts submit events.</p>
            </div>
          ) : (
            categoryEntries.map(([category, count]) => (
              <div key={category} className="analytics-bar-card">
                <span>{category}</span>
                <div className="analytics-bar">
                  <div className="analytics-fill" style={{ width: `${Math.min(100, count * 20)}%` }} />
                </div>
                <strong>
                  {count} event{count !== 1 ? 's' : ''}
                </strong>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
