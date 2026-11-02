import { useState } from 'react'
import type { EventWithId } from '../../../shared/types/event'

interface AnalyticsProps {
  events: EventWithId[]
}

function Analytics({ events }: AnalyticsProps) {
  const [reportMessage, setReportMessage] = useState('')
  const approved = events.filter((event) => event.status === 'approved').length
  const pending = events.filter((event) => event.status === 'pending').length
  const rejected = events.filter((event) => event.status === 'rejected').length
  const cancelled = events.filter((event) => event.status === 'cancelled').length
  const totalEvents = events.length

  function downloadReport() {
    try {
      const columns = [
        'event_id',
        'title',
        'status',
        'category',
        'venue',
        'start_at',
        'end_at',
        'rsvp_count',
        'capacity',
        'ticket_price_zar',
      ]
      const escapeCsv = (value: string | number) => {
        const text = String(value)
        const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
        return `"${safeText.replaceAll('"', '""')}"`
      }
      const rows = events.map((event) => [
        event.id,
        event.title,
        event.status,
        event.category,
        event.location.address,
        event.startAt.toISOString(),
        event.endAt.toISOString(),
        event.rsvpCount,
        event.capacity ?? '',
        event.ticketPrice ?? 0,
      ])
      const csv = [columns, ...rows]
        .map((row) => row.map(escapeCsv).join(','))
        .join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `popupgp-events-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setReportMessage(`Downloaded a report with ${events.length} event${events.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Could not generate the events report.')
    }
  }

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
          <button type="button" className="approve" onClick={downloadReport}>
            Download events CSV
          </button>
        </div>
        <p className="section-copy" role="status" aria-live="polite">
          {reportMessage || `Includes all ${totalEvents} events currently loaded in the admin console.`}
        </p>

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
