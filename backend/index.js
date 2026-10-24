require("dotenv").config()

const path = require("path")
const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const { nanoid } = require("nanoid")
const { pool, initializeDatabase } = require("./db")
const { createToken, requireAuth, optionalAuth } = require("./auth")

const app = express()
const PORT = process.env.PORT || 3000
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"

app.use(cors({ origin: frontendUrl }))
app.use(express.json())

function validateUrl(value) {
  try {
    const parsed = new URL(value)
    return ["http:", "https:"].includes(parsed.protocol)
  } catch (error) {
    return false
  }
}

function validateEmail(value) {
  if (typeof value !== "string") return false
  const email = value.trim()
  if (email.length > 254) return false

  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(email)
}

function validateAlias(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{3,32}$/.test(value.trim())
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

app.post("/api/auth/signup", async (req, res, next) => {
  const { name, email, password } = req.body
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: "Name, email, and a password of at least 8 characters are required" })
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address, such as name@gmail.com" })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail])
    if (existing.length) {
      return res.status(409).json({ error: "An account with that email already exists" })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name.trim(), normalizedEmail, passwordHash]
    )
    const user = { id: result.insertId, name: name.trim(), email: normalizedEmail }
    return res.status(201).json({ user, token: createToken(user) })
  } catch (error) {
    return next(error)
  }
})

app.post("/api/auth/signin", async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address, such as name@gmail.com" })
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" })
    }
    const safeUser = publicUser(user)
    return res.json({ user: safeUser, token: createToken(safeUser) })
  } catch (error) {
    return next(error)
  }
})

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [req.user.id])
    if (!rows.length) return res.status(404).json({ error: "User not found" })
    return res.json({ user: rows[0] })
  } catch (error) {
    return next(error)
  }
})

app.post("/shorten", optionalAuth, async (req, res, next) => {
  const { url } = req.body
  if (!url || !validateUrl(url)) {
    return res.status(400).json({ error: "A valid http(s) URL is required" })
  }

  try {
    let shortId
    let inserted = false
    while (!inserted) {
      shortId = nanoid(8)
      try {
        await pool.query(
          "INSERT INTO urls (short_id, original_url, user_id) VALUES (?, ?, ?)",
          [shortId, url.trim(), req.user ? req.user.id : null]
        )
        inserted = true
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") throw error
      }
    }
    return res.status(201).json({ shortId, shortUrl: `${req.protocol}://${req.get("host")}/${shortId}` })
  } catch (error) {
    return next(error)
  }
})

app.get("/api/urls", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT short_id AS shortId, original_url AS originalUrl, clicks, created_at AS createdAt FROM urls WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    )
    return res.json(rows.map((row) => ({ ...row, shortUrl: `${req.protocol}://${req.get("host")}/${row.shortId}` })))
  } catch (error) {
    return next(error)
  }
})

app.patch("/api/urls/:shortId", requireAuth, async (req, res, next) => {
  const { alias } = req.body
  const normalizedAlias = typeof alias === "string" ? alias.trim().toLowerCase() : ""
  if (!validateAlias(alias) || ["api", "auth", "dashboard"].includes(normalizedAlias)) {
    return res.status(400).json({ error: "Alias must be 3-32 characters using only letters, numbers, hyphens, or underscores" })
  }

  try {
    const nextAlias = alias.trim()
    const [ownedRows] = await pool.query(
      "SELECT id FROM urls WHERE short_id = ? AND user_id = ?",
      [req.params.shortId, req.user.id]
    )
    if (!ownedRows.length) {
      return res.status(404).json({ error: "Link not found" })
    }
    await pool.query("UPDATE urls SET short_id = ? WHERE id = ?", [nextAlias, ownedRows[0].id])
    return res.json({
      shortId: nextAlias,
      shortUrl: `${req.protocol}://${req.get("host")}/${nextAlias}`
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "That alias is already in use" })
    }
    return next(error)
  }
})

app.delete("/api/urls/:shortId", requireAuth, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM urls WHERE short_id = ? AND user_id = ?",
      [req.params.shortId, req.user.id]
    )
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Link not found" })
    }
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

app.get("/all/urls", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT short_id AS shortId, original_url AS originalUrl, clicks FROM urls ORDER BY created_at DESC")
    return res.json(rows)
  } catch (error) {
    return next(error)
  }
})

const frontendPath = path.join(__dirname, "..", "frontend", "dist")

app.use(express.static(frontendPath))

app.get(["/", "/auth", "/dashboard"], (req, res) => {
  return res.sendFile(path.join(frontendPath, "index.html"))
})

app.get("/:shortId", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, original_url AS originalUrl FROM urls WHERE short_id = ?", [req.params.shortId])
    if (!rows.length) return res.status(404).json({ error: "Short URL not found" })
    await pool.query("UPDATE urls SET clicks = clicks + 1 WHERE id = ?", [rows[0].id])
    return res.redirect(rows[0].originalUrl)
  } catch (error) {
    return next(error)
  }
})

app.get("*splat", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next()
  return res.sendFile(path.join(frontendPath, "index.html"))
})

app.use((error, req, res, next) => {
  console.error(error)
  return res.status(500).json({ error: "Internal server error" })
})

initializeDatabase()
  .then(() => app.listen(PORT, () => console.log(`URL Shortener running at http://localhost:${PORT}`)))
  .catch((error) => {
    console.error("Unable to initialize MySQL database:", error.message)
    process.exitCode = 1
  })
