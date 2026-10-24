import { useEffect, useState } from "react"

import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import LandingPage from "./pages/LandingPage"
import { request, tokenKey } from "./api"

function getPage() {
  const path = window.location.pathname
  if (path === "/auth") return "auth"
  if (path === "/dashboard") return "dashboard"
  return "landing"
}

function navigate(page) {
  const path = page === "landing" ? "/" : `/${page}`
  window.history.pushState({}, "", path)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function App() {
  const [page, setPage] = useState(getPage)
  const [user, setUser] = useState(null)
  const [pendingUrl, setPendingUrl] = useState("")
  const [authMode, setAuthMode] = useState("signup")

  useEffect(() => {
    const onPopState = () => setPage(getPage())
    window.addEventListener("popstate", onPopState)

    if (localStorage.getItem(tokenKey)) {
      request("/api/auth/me")
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem(tokenKey))
    }

    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const openAuth = (url = "", mode = "signup") => {
    setPendingUrl(url)
    setAuthMode(mode)
    navigate("auth")
  }

  const handleShortenRequest = (url) => {
    if (user) {
      setPendingUrl(url)
      navigate("dashboard")
    } else {
      openAuth(url)
    }
  }

  const handleAuth = async (data) => {
    localStorage.setItem(tokenKey, data.token)
    setUser(data.user)
    return pendingUrl
  }

  const signOut = () => {
    localStorage.removeItem(tokenKey)
    setUser(null)
    setPendingUrl("")
    navigate("landing")
  }

  const shorten = async (url) => {
    const data = await request("/shorten", {
      method: "POST",
      body: JSON.stringify({ url })
    })
    setPendingUrl("")
    return data
  }

  if (page === "auth") {
    return (
      <AuthPage
        initialMode={authMode}
        pendingUrl={pendingUrl}
        onAuthenticated={handleAuth}
        onShorten={shorten}
        onNavigate={navigate}
      />
    )
  }

  if (page === "dashboard") {
    if (!user) {
      return <AuthPage initialMode="signin" onAuthenticated={handleAuth} onShorten={shorten} onNavigate={navigate} />
    }
    return <DashboardPage user={user} initialUrl={pendingUrl} onShorten={shorten} onSignOut={signOut} onNavigate={navigate} />
  }

  return <LandingPage user={user} onShortenRequest={handleShortenRequest} onNavigate={navigate} />
}

export default App
