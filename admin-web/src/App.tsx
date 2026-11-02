import { useEffect, useState, type FormEvent } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import type { EventWithId } from '../../shared/types/event'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Profile from './pages/Profile'
import './App.css'

type EventStatus = EventWithId['status']
type AdminView = 'dashboard' | 'events' | 'analytics' | 'profile'
type AuthStage = 'loading' | 'signed-out' | 'checking' | 'ready'

interface AdminSession {
  uid: string
  displayName: string
  email: string
  role: 'admin'
  createdAt: Date
}

interface EventDocument {
  title?: string
  description?: string
  category?: string
  hostId?: string
  status?: EventStatus
  location?: {
    lat?: number
    lng?: number
    address?: string
    suburb?: string
  }
  geohash?: string
  startAt?: { toDate?: () => Date }
  endAt?: { toDate?: () => Date }
  rsvpCount?: number
  imageUrl?: string
  capacity?: number
  ticketPrice?: number
}

interface UserDocument {
  email?: string
  displayName?: string
  role?: string
  createdAt?: { toDate?: () => Date }
}

const tabs: Array<{ id: AdminView; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'events', label: 'Events' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'profile', label: 'Profile' },
]

const PROMOTE_ADMIN_HINT =
  'From PopupGp/functions run: npm run promote-admin -- --email you@example.com --password your-password'

function mapSignInError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : ''

  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found')
  ) {
    return 'Wrong email or password. If this account does not exist yet, create and promote it with npm run promote-admin in functions.'
  }
  if (code.includes('invalid-email')) return 'Enter a valid email address.'
  if (code.includes('too-many-requests')) {
    return 'Too many failed attempts. Wait a minute and try again.'
  }
  if (code.includes('network-request-failed')) {
    return 'Network error. Check your connection and that admin-web points at the same Firebase project as your accounts.'
  }

  return error instanceof Error ? error.message : 'Could not sign in.'
}

function mapEventDocument(id: string, data: EventDocument): EventWithId {
  const location = data.location ?? {}

  return {
    id,
    title: data.title ?? 'Untitled event',
    description: data.description ?? 'No description available yet.',
    category: data.category ?? 'Uncategorised',
    hostId: data.hostId ?? 'Unknown host',
    status: data.status ?? 'pending',
    location: {
      lat: typeof location.lat === 'number' ? location.lat : 0,
      lng: typeof location.lng === 'number' ? location.lng : 0,
      address: location.address ?? 'Location not set',
      suburb: location.suburb,
    },
    geohash: data.geohash ?? '',
    startAt: data.startAt?.toDate?.() ?? new Date(),
    endAt: data.endAt?.toDate?.() ?? new Date(),
    rsvpCount: data.rsvpCount ?? 0,
    imageUrl: data.imageUrl,
    capacity: data.capacity,
    ticketPrice: data.ticketPrice,
  }
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="shell auth-shell">
      <section className="auth-card loading-card">
        <p className="eyebrow">PopupGP admin</p>
        <h1>Preparing your dashboard</h1>
        <p className="hero-copy">{message}</p>
        <div className="loading-spinner" aria-hidden="true" />
      </section>
    </div>
  )
}

interface AuthGateProps {
  authMessage: string
  authBusy: boolean
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function AuthGate({
  authMessage,
  authBusy,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthGateProps) {
  return (
    <div className="shell auth-shell">
      <div className="auth-layout">
        <div className="auth-brand auth-brand-centered">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span>PopupGp <span className="brand-divider">/</span> Admin</span>
        </div>

        <section className="auth-card">
          <div className="auth-card-heading">
            <p className="eyebrow">Admin workspace</p>
            <h1>Welcome back</h1>
            <p>Sign in to manage local events.</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" className="approve auth-submit" disabled={authBusy}>
              {authBusy ? 'Signing you in...' : 'Sign in to dashboard'}
              {!authBusy && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {authMessage ? (
            <p className="auth-message" role="alert" aria-live="polite">{authMessage}</p>
          ) : null}
          <p className="auth-note">
            Administrator access only. There is no self-service admin signup. Create or promote an
            admin from <code>PopupGp/functions</code> with <code>npm run promote-admin</code>, then
            sign in here with that email and password. See <code>admin-web/README.md</code>.
          </p>
        </section>
      </div>
    </div>
  )
}

interface AdminConsoleProps {
  admin: AdminSession
  onSignOut: () => Promise<void>
}

function AdminConsole({ admin, onSignOut }: AdminConsoleProps) {
  const [events, setEvents] = useState<EventWithId[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('Listening for new submissions from the mobile app.')
  const [view, setView] = useState<AdminView>('dashboard')

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextEvents = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as EventDocument
          return mapEventDocument(docSnapshot.id, data)
        })

        setEvents(nextEvents)
        setMessage(`Loaded ${snapshot.size} event${snapshot.size === 1 ? '' : 's'} from Firestore.`)
      },
      (error) => {
        setMessage(error.message || 'Could not load the event queue.')
      },
    )

    return () => unsubscribe()
  }, [])

  async function updateStatus(eventId: string, currentStatus: EventStatus, nextStatus: EventStatus) {
    const allowedTransitions: Record<EventStatus, EventStatus[]> = {
      pending: ['approved', 'rejected', 'cancelled'],
      rejected: ['approved', 'cancelled'],
      approved: ['cancelled'],
      cancelled: [],
    }
    if (!allowedTransitions[currentStatus].includes(nextStatus)) {
      setMessage(`An event marked ${currentStatus} cannot be changed to ${nextStatus}.`)
      return
    }

    setBusyId(eventId)
    setMessage(`Updating event to ${nextStatus}...`)

    try {
      await updateDoc(doc(db, 'events', eventId), { status: nextStatus })
      setMessage(`Event marked as ${nextStatus}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the event.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>PopupGp <span className="brand-divider">/</span> Admin</span>
        </div>
        <div className="admin-account">
          <span className="account-avatar" aria-hidden="true">{admin.displayName.slice(0, 1).toUpperCase()}</span>
          <span className="account-name">{admin.displayName}</span>
          <button type="button" className="ghost-button" onClick={() => void onSignOut()}>
            Sign out
          </button>
        </div>
      </div>
      <header className="hero-card hero-card-admin">
        <div className="hero-copy-block">
          <p className="eyebrow">Your community at a glance</p>
          <h1>Operations overview</h1>
          <p className="hero-copy">Review event submissions and follow activity across your local events.</p>
        </div>
        <div className="hero-summary">
          <span className="live-indicator" aria-hidden="true" />
          <span>Live event overview</span>
          <strong>{events.length} {events.length === 1 ? 'event' : 'events'}</strong>
        </div>
      </header>

      <nav className="admin-nav" aria-label="Admin sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={view === tab.id ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <p className="message admin-message">{message}</p>

      <section className="workspace">
        {view === 'dashboard' ? <Dashboard events={events} onOpenQueue={() => setView('events')} /> : null}
        {view === 'events' ? (
          <Events events={events} busyId={busyId} updateStatus={updateStatus} />
        ) : null}
        {view === 'analytics' ? <Analytics events={events} /> : null}
        {view === 'profile' ? <Profile admin={admin} onSignOut={onSignOut} /> : null}
      </section>
    </div>
  )
}

function App() {
  const [authStage, setAuthStage] = useState<AuthStage>('loading')
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setAdmin(null)
        setAuthStage('signed-out')
        setAuthMessage('')
        return
      }

      setAuthStage('checking')
      setAuthMessage('Checking admin access...')

      void (async () => {
        try {
          const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))

          if (!profileSnap.exists()) {
            await signOut(auth)
            setAdmin(null)
            setAuthStage('signed-out')
            setAuthMessage(
              `This account has no Firestore profile yet. ${PROMOTE_ADMIN_HINT}`,
            )
            return
          }

          const data = profileSnap.data() as UserDocument

          if (data.role !== 'admin') {
            await signOut(auth)
            setAdmin(null)
            setAuthStage('signed-out')
            setAuthMessage(
              `This account exists but role is "${data.role ?? 'missing'}", not admin. ${PROMOTE_ADMIN_HINT}`,
            )
            return
          }

          setAdmin({
            uid: firebaseUser.uid,
            displayName: data.displayName ?? firebaseUser.displayName ?? 'Admin',
            email: data.email ?? firebaseUser.email ?? '',
            role: 'admin',
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          })
          setAuthStage('ready')
          setAuthMessage(`Welcome back, ${data.displayName ?? firebaseUser.displayName ?? 'Admin'}.`)
        } catch (error) {
          setAdmin(null)
          setAuthStage('signed-out')
          setAuthMessage(error instanceof Error ? error.message : 'Could not load your admin profile.')
        }
      })()
    })

    return () => unsubscribe()
  }, [])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthMessage('')

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (error) {
      setAuthMessage(mapSignInError(error))
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    setAuthMessage('Signing you out...')
    setEmail('')
    setPassword('')
    setAdmin(null)
    setAuthStage('signed-out')
    await signOut(auth)
  }

  if (authStage === 'loading' || authStage === 'checking') {
    return <LoadingState message={authMessage} />
  }

  if (authStage === 'ready' && admin) {
    return <AdminConsole admin={admin} onSignOut={handleSignOut} />
  }

  return (
    <AuthGate
      authMessage={authMessage}
      authBusy={authBusy}
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSignIn}
    />
  )
}

export default App
