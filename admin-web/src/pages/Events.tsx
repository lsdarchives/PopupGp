import type { EventWithId } from '../../../shared/types/event'

interface EventsProps {
  events: EventWithId[]
  busyId: string | null
  updateStatus: (eventId: string, nextStatus: EventWithId['status']) => void
}

function Events({ events, busyId, updateStatus }: EventsProps) {
  return (
    <div className="page-content">
      <div className="panel panel-full">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Events</p>
            <h3>Moderate submitted events</h3>
          </div>
          <p className="section-copy">Approve, reject, or cancel events from the hosts in a single workflow.</p>
        </div>

        <div className="event-list">
          {events.length === 0 ? (
            <div className="empty-state">
              <p>There are no events to review yet.</p>
            </div>
          ) : (
            events.map((event) => (
              <article key={event.id} className="event-card event-card-wide">
                <div>
                  <p className="status-text">{event.status.toUpperCase()}</p>
                  <h4>{event.title}</h4>
                  <p className="event-copy">{event.description}</p>
                  <div className="meta-row">
                    <span>{event.category}</span>
                    <span>{event.location.address}</span>
                    <span>{event.rsvpCount} RSVPs</span>
                  </div>
                </div>
                <div className="actions actions-vertical">
                  <button
                    className="approve"
                    disabled={busyId === event.id}
                    onClick={() => updateStatus(event.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="reject"
                    disabled={busyId === event.id}
                    onClick={() => updateStatus(event.id, 'rejected')}
                  >
                    Reject
                  </button>
                  <button
                    className="cancel"
                    disabled={busyId === event.id}
                    onClick={() => updateStatus(event.id, 'cancelled')}
                  >
                    Cancel
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Events
