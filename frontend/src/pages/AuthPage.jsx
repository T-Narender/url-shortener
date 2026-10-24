import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import { request } from "../api"

function isValidEmail(value) {
  const email = value.trim()
  if (email.length > 254) return false

  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(email)
}

function AuthPage({ initialMode, pendingUrl, onAuthenticated, onShorten, onNavigate }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => setMode(initialMode), [initialMode])

  const submit = async (event) => {
    event.preventDefault()
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address, such as name@gmail.com")
      return
    }
    setBusy(true)
    setError("")
    try {
      const data = await request(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(form) })
      const url = await onAuthenticated(data)
      if (url) await onShorten(url)
      onNavigate("dashboard")
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="app-shell auth-shell">
      <Navbar onNavigate={onNavigate} />
      <section className="auth-layout">
        <div className="auth-message">
          <div className="eyebrow"><span className="eyebrow-dot" /> Your links, organized</div>
          <h1>{pendingUrl ? "One quick step to your shorter link." : "Welcome to a better way to share."}</h1>
          <p>{pendingUrl ? "Create your free profile or sign in and we’ll shorten your URL right away." : "Create a profile to save every link and see how it performs."}</p>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError("") }}>Sign in</button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError("") }}>Create account</button>
          </div>
          <h2>{mode === "signin" ? "Welcome back" : "Start for free"}</h2>
          <p className="card-subtitle">{mode === "signin" ? "Enter your details to continue." : "Save links, track clicks, and share smarter."}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" && <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" required /></label>}
            <label>Email address<input type="email" value={form.email} onChange={(event) => { setForm({ ...form, email: event.target.value }); setError("") }} placeholder="you@example.com" autoComplete="email" maxLength="254" required /></label>
            <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" minLength="8" required /></label>
            <button className="button button-primary full-width" disabled={busy}>{busy ? "Please wait..." : mode === "signin" ? "Sign in →" : "Create account →"}</button>
          </form>
          {error && <p className="error-message">{error}</p>}
          <p className="privacy-note">By continuing, you agree to our Terms and Privacy Policy.</p>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
