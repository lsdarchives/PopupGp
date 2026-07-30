import type { EventWithId } from '../../../shared/types/event'

interface AnalyticsProps {
  events: EventWithId[]
}

function Analytics({ events }: AnalyticsProps) {
  const approved = events.filter((event) => event.status === 'approved').length
  const pending = events.filter((event) => event.status === 'pending').length
  const rejected = events.filter((event) => event.status === 'rejected').length
  const cancelled = events.filter((event) => event.status === 'cancelled').length
  const totalEvents = events.length

  return (
    <div className="page-content">
      <div className="section-grid">
        <article className="metric-card">
          <p className="metric-label">Approved</p>
          <h2>{approved}</h2>
        </article>
        <article className="metric-card">
          <p className="metric-label">Pending</p>
          <h2>{pending}</h2>
        </article>
        <article className="metric-card">
          <p className="metric-label">Rejected</p>
          <h2>{rejected}</h2>
        </article>
        <article className="metric-card">
          <p className="metric-label">Cancelled</p>
          <h2>{cancelled}</h2>
        </article>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Analytics</p>
            <h3>Status distribution</h3>
          </div>
        </div>

        <div className="chart-card">
          {totalEvents === 0 ? (
            <div className="empty-state">
              <p>Status analytics will appear here once events exist in Firestore.</p>
            </div>
          ) : (
            <>
              <div className="chart-row">
                <span>Approved</span>
                <strong>{approved}</strong>
              </div>
              <div className="chart-bar">
                <div className="chart-fill approved" style={{ width: `${(approved / totalEvents) * 100}%` }} />
              </div>
              <div className="chart-row">
                <span>Pending</span>
                <strong>{pending}</strong>
              </div>
              <div className="chart-bar">
                <div className="chart-fill pending" style={{ width: `${(pending / totalEvents) * 100}%` }} />
              </div>
              <div className="chart-row">
                <span>Rejected</span>
                <strong>{rejected}</strong>
              </div>
              <div className="chart-bar">
                <div className="chart-fill rejected" style={{ width: `${(rejected / totalEvents) * 100}%` }} />
              </div>
              <div className="chart-row">
                <span>Cancelled</span>
                <strong>{cancelled}</strong>
              </div>
              <div className="chart-bar">
                <div className="chart-fill cancelled" style={{ width: `${(cancelled / totalEvents) * 100}%` }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
