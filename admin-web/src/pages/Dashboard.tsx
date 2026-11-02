import type { EventWithId } from '../../../shared/types/event'

interface DashboardProps {
  events: EventWithId[]
  onOpenQueue: () => void
}

function Dashboard({ events, onOpenQueue }: DashboardProps) {
  const totalRsvps = events.reduce((sum, event) => sum + (event.rsvpCount ?? 0), 0)
  const now = new Date()
  const upcomingEvents = events.filter((event) => event.startAt > now && event.status === 'approved').length
  const pendingEvents = events.filter((event) => event.status === 'pending')
  const categories = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const categoryEntries = Object.entries(categories) as Array<[string, number]>
  const recentEvents = [...events].sort((a, b) => b.startAt.getTime() - a.startAt.getTime()).slice(0, 5)

  return (
    <div className="page-content">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Admin overview</p>
          <h2>Community activity</h2>
          <p className="section-copy">A live snapshot of events and guest interest.</p>
        </div>
        <button type="button" className="queue-button" onClick={onOpenQueue}>
          Review submissions <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="section-grid dashboard-metrics">
        <article className="metric-card metric-total">
          <div className="metric-topline"><span className="metric-icon">✳</span><span className="metric-trend">All time</span></div>
          <p className="metric-label">Total events</p>
          <h2>{events.length}</h2>
          <p className="metric-foot">Submitted to the community</p>
        </article>
        <article className="metric-card metric-rsvps">
          <div className="metric-topline"><span className="metric-icon">↗</span><span className="metric-trend">Community</span></div>
          <p className="metric-label">RSVPs across events</p>
          <h2>{totalRsvps}</h2>
          <p className="metric-foot">Guest interest so far</p>
        </article>
        <article className="metric-card metric-upcoming">
          <div className="metric-topline"><span className="metric-icon">◷</span><span className="metric-trend">Approved</span></div>
          <p className="metric-label">Upcoming events</p>
          <h2>{upcomingEvents}</h2>
          <p className="metric-foot">Ready for guests to discover</p>
        </article>
        <article className="metric-card metric-categories">
          <div className="metric-topline"><span className="metric-icon">◇</span><span className="metric-trend">Diverse</span></div>
          <p className="metric-label">Event categories</p>
          <h2>{Object.keys(categories).length}</h2>
          <p className="metric-foot">Different ways to get together</p>
        </article>
      </div>

      <div className="dashboard-content-grid">
        <section className="panel dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">The latest</p>
              <h3>Recent events</h3>
            </div>
            <button type="button" className="text-button" onClick={onOpenQueue}>View all events</button>
          </div>

          {recentEvents.length === 0 ? (
            <div className="empty-state dashboard-empty">
              <span className="empty-icon" aria-hidden="true">✳</span>
              <strong>It’s quiet for now</strong>
              <p>Submitted events will appear here as hosts join the community.</p>
            </div>
          ) : (
            <div className="recent-event-list">
              {recentEvents.map((event) => (
                <article className="recent-event" key={event.id}>
                  <div className="recent-event-date">
                    <strong>{event.startAt.toLocaleDateString('en-ZA', { day: '2-digit' })}</strong>
                    <span>{event.startAt.toLocaleDateString('en-ZA', { month: 'short' })}</span>
                  </div>
                  <div className="recent-event-main">
                    <strong>{event.title}</strong>
                    <span>{event.location.address} · {event.rsvpCount} RSVPs</span>
                  </div>
                  <span className={`status-pill ${event.status}`}>{event.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel dashboard-panel insights-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Needs attention</p>
              <h3>Review queue</h3>
            </div>
            <span className="queue-count">{pendingEvents.length}</span>
          </div>
          {pendingEvents.length === 0 ? (
            <div className="queue-clear">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>All caught up</strong>
                <p>No events are waiting for review.</p>
              </div>
            </div>
          ) : (
            <div className="queue-callout">
              <strong>{pendingEvents.length} {pendingEvents.length === 1 ? 'event needs' : 'events need'} review</strong>
              <p>Help hosts get their events in front of the community.</p>
              <button type="button" className="approve" onClick={onOpenQueue}>Open review queue</button>
            </div>
          )}

          <div className="category-summary">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Explore</p>
                <h3>Categories</h3>
              </div>
            </div>
            {categoryEntries.length === 0 ? (
              <p className="section-copy">Category insights will appear when events are submitted.</p>
            ) : (
              <div className="analytics-grid">
                {categoryEntries.map(([category, count]) => (
                  <div key={category} className="analytics-bar-card">
                    <div className="chart-row"><span>{category}</span><strong>{count}</strong></div>
                    <div className="analytics-bar">
                      <div className="analytics-fill" style={{ width: `${(count / events.length) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
