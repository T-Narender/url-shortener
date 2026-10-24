import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import { request } from "../api"

function DashboardPage({ user, initialUrl, onShorten, onSignOut, onNavigate }) {
  const [url, setUrl] = useState("")
  const [links, setLinks] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [alias, setAlias] = useState("")

  const loadLinks = () => request("/api/urls").then(setLinks).catch(() => setError("Could not load your links"))
  useEffect(() => { loadLinks() }, [])
  useEffect(() => {
    if (!initialUrl) return
    setUrl(initialUrl)
    setBusy(true)
    onShorten(initialUrl)
      .then((data) => {
        setResult(data)
        setUrl("")
        return loadLinks()
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false))
  }, [initialUrl])

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    setResult(null)
    try {
      const data = await onShorten(url.trim())
      setResult(data)
      setUrl("")
      await loadLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const totalClicks = links.reduce((sum, link) => sum + Number(link.clicks || 0), 0)
  const filteredLinks = links.filter((link) => {
    const searchText = search.trim().toLowerCase()
    const matchesSearch = !searchText ||
      link.shortId.toLowerCase().includes(searchText) ||
      link.originalUrl.toLowerCase().includes(searchText)
    const matchesFilter = filter === "all" ||
      (filter === "clicked" && Number(link.clicks) > 0) ||
      (filter === "not-clicked" && Number(link.clicks) === 0)
    return matchesSearch && matchesFilter
  })

  const saveAlias = async (link) => {
    setBusy(true)
    setError("")
    try {
      await request(`/api/urls/${encodeURIComponent(link.shortId)}`, {
        method: "PATCH",
        body: JSON.stringify({ alias })
      })
      setEditingId(null)
      await loadLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteLink = async (link) => {
    if (!window.confirm(`Delete ${link.shortUrl}? This cannot be undone.`)) return
    setBusy(true)
    setError("")
    try {
      await request(`/api/urls/${encodeURIComponent(link.shortId)}`, { method: "DELETE" })
      await loadLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="app-shell dashboard-shell">
      <Navbar user={user} onNavigate={onNavigate} onSignOut={onSignOut} />
      <section className="dashboard-content">
        <div className="dashboard-heading"><div><p className="eyebrow">Your workspace</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p>Keep your best links close and see what’s getting attention.</p></div><div className="avatar-large">{user.name.charAt(0).toUpperCase()}</div></div>
        <form className="shorten-form dashboard-form" onSubmit={submit}>
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a URL to shorten it..." type="url" required />
          <button className="button button-primary" disabled={busy}>{busy ? "Shortening..." : "Shorten link →"}</button>
        </form>
        {result && <div className="success-message">Your link is ready: <a href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a></div>}
        {error && <p className="error-message">{error}</p>}
        <div className="stats-grid"><div className="stat-card"><span>Total links</span><strong>{links.length}</strong><small>All your shortened URLs</small></div><div className="stat-card"><span>Total clicks</span><strong>{totalClicks}</strong><small>Across all your links</small></div><div className="stat-card"><span>Account</span><strong>Active</strong><small>Created for you</small></div></div>
        <div className="links-panel">
          <div className="panel-heading">
            <div><h2>Your links</h2><p>Every link you create, in one place.</p></div>
            <span className="count-badge">{links.length} links</span>
          </div>
          {links.length === 0 ? <div className="empty-state"><span>✦</span><h3>Your link library is empty</h3><p>Paste a URL above to create your first short link.</p></div> : (
            <>
              <div className="link-tools">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search links..." aria-label="Search links" />
                <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter links">
                  <option value="all">All links</option>
                  <option value="clicked">Clicked</option>
                  <option value="not-clicked">Not clicked</option>
                </select>
              </div>
              {filteredLinks.length === 0 ? <div className="empty-state compact"><span>⌕</span><h3>No matching links</h3><p>Try a different search or filter.</p></div> : <div className="links-list">{filteredLinks.map((link) => (
                <div className="link-row" key={link.shortId}>
                  <div className="link-row-icon">↗</div>
                  <div className="link-row-body">
                    {editingId === link.shortId ? (
                      <div className="alias-editor">
                        <input value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="custom-alias" autoFocus />
                        <button className="row-action save" disabled={busy} onClick={() => saveAlias(link)}>Save</button>
                        <button className="row-action" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : <a href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl}</a>}
                    <p>{link.originalUrl}</p>
                  </div>
                  <div className="link-clicks"><strong>{link.clicks}</strong><span>clicks</span></div>
                  <div className="link-actions">
                    <button title="Edit custom alias" onClick={() => { setEditingId(link.shortId); setAlias(link.shortId) }}>Edit</button>
                    <button className="delete-action" title="Delete link" onClick={() => deleteLink(link)}>Delete</button>
                  </div>
                </div>
              ))}</div>}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
