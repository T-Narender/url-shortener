import { useState } from "react"
import Navbar from "../components/Navbar"

function LandingPage({ user, onShortenRequest, onNavigate }) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")

  const submit = (event) => {
    event.preventDefault()
    if (!url.trim()) return
    setError("")
    onShortenRequest(url.trim())
    if (user) setUrl("")
  }

  return (
    <main className="app-shell">
      <Navbar user={user} onNavigate={onNavigate} />
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> The smarter way to share</div>
          <h1>Make every link <em>count.</em></h1>
          <p>Linkly turns long, complicated URLs into clean links you can share anywhere. Track them, manage them, and make an impact.</p>
          <form className="shorten-form hero-form" onSubmit={submit}>
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste your long URL here..." aria-label="Long URL" type="url" required />
            <button className="button button-primary" type="submit">Shorten link <span>→</span></button>
          </form>
          <p className="form-hint"><span>✦</span> Free to start · No credit card required</p>
          {error && <p className="error-message">{error}</p>}
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="link-card">
            <div className="link-card-top"><span className="mini-logo">l.</span><span className="status-dot" /></div>
            <p className="link-card-label">YOUR SHORT LINK</p>
            <strong>linkly.co/launch</strong>
            <div className="link-card-footer"><span>↗ 1,284 clicks</span><span className="sparkline">⌁⌁⌁</span></div>
          </div>
          <div className="floating-stat"><strong>+24.8%</strong><span>engagement</span></div>
        </div>
      </section>
      <section className="feature-strip">
        <div><span className="feature-icon">↗</span><div><strong>Built for sharing</strong><p>Links that look good everywhere.</p></div></div>
        <div><span className="feature-icon">◎</span><div><strong>Know your audience</strong><p>Simple insights, better decisions.</p></div></div>
        <div><span className="feature-icon">✦</span><div><strong>Always yours</strong><p>Secure, reliable, and ready to go.</p></div></div>
      </section>
    </main>
  )
}

export default LandingPage
