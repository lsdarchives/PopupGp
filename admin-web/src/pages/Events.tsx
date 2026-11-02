import type { EventWithId } from '../../../shared/types/event'

interface EventsProps {
  events: EventWithId[]
  busyId: string | null
  updateStatus: (eventId: string, currentStatus: EventWithId['status'], nextStatus: EventWithId['status']) => void
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
                {event.imageUrl ? (
                  <img className="event-image" src={event.imageUrl} alt={`Photo for ${event.title}`} />
                ) : (
                  <div className="event-image event-image-placeholder" aria-hidden="true">PG</div>
                )}
                <div className="event-main">
                  <div className="event-topline">
                    <span className={`status-pill ${event.status}`}>{event.status}</span>
                    <span className="category-pill">{event.category}</span>
                  </div>
                  <h4>{event.title}</h4>
                  <p className="event-copy">{event.description}</p>
                  <div className="meta-row">
                    <span>{event.location.address}</span>
                    <span>{new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(event.startAt)}</span>
                    <span>{event.rsvpCount} RSVPs</span>
                    <span>{(event.ticketPrice ?? 0) > 0 ? `R${event.ticketPrice}` : 'Free'}</span>
                  </div>
                </div>
                {event.status === 'cancelled' ? (
                  <p className="section-copy">No further actions available.</p>
                ) : (
                  <div className="actions actions-vertical">
                    {event.status !== 'approved' ? (
                      <button
                        className="approve"
                        disabled={busyId === event.id}
                        onClick={() => updateStatus(event.id, event.status, 'approved')}
                      >
                        Approve
                      </button>
                    ) : null}
                    {event.status === 'pending' ? (
                      <button
                        className="reject"
                        disabled={busyId === event.id}
                        onClick={() => updateStatus(event.id, event.status, 'rejected')}
                      >
                        Reject
                      </button>
                    ) : null}
                    <button
                      className="cancel"
                      disabled={busyId === event.id}
                      onClick={() => updateStatus(event.id, event.status, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Events
