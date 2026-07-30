import type { UserProfile } from '../../../shared/types/user'

interface AdminSession extends UserProfile {
  uid: string
}

interface ProfileProps {
  admin: AdminSession
  onSignOut: () => Promise<void> | void
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function Profile({ admin, onSignOut }: ProfileProps) {
  return (
    <div className="page-content profile-page">
      <div className="panel panel-full">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h3>Admin account</h3>
          </div>
          <p className="section-copy">
            Admin access is controlled by Firebase Auth and the matching Firestore user profile.
          </p>
        </div>

        <div className="profile-grid">
          <div className="profile-card">
            <p className="profile-label">Signed in as</p>
            <h2>{admin.displayName}</h2>
            <p className="profile-role">{admin.role}</p>
            <p className="profile-email">{admin.email}</p>
            <p className="profile-meta">User ID: {admin.uid}</p>
          </div>

          <div className="profile-card profile-select">
            <p className="profile-label">Account details</p>
            <p className="section-copy">
              The profile was created on {formatDate(admin.createdAt)}. To test another admin, sign
              out and sign in with a different Firebase Auth account.
            </p>
            <button type="button" className="ghost-button" onClick={() => void onSignOut()}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
