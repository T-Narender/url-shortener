function Navbar({ user, onNavigate, onSignOut }) {
  return (
    <nav className="page-nav">
      <button className="brand" onClick={() => onNavigate("landing")} aria-label="Go to Linkly home">
        linkly<span>.</span>
      </button>
      <div className="nav-actions">
        {user ? (
          <>
            <button className="nav-link" onClick={() => onNavigate("dashboard")}>Dashboard</button>
            <span className="user-chip">{user.name.charAt(0).toUpperCase()}</span>
            <button className="button button-ghost" onClick={onSignOut}>Sign out</button>
          </>
        ) : (
          <button className="button button-dark" onClick={() => onNavigate("auth")}>Sign in</button>
        )}
      </div>
    </nav>
  )
}

export default Navbar
