const jwt = require("jsonwebtoken")

const secret = process.env.JWT_SECRET || "change-this-secret-in-production"

function createToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, secret, { expiresIn: "7d" })
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: "Authentication required" })
  try {
    req.user = jwt.verify(token, secret)
    return next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null
  if (token) {
    try {
      req.user = jwt.verify(token, secret)
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" })
    }
  }
  return next()
}

module.exports = { createToken, requireAuth, optionalAuth }
