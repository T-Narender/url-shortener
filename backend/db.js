const mysql = require("mysql2/promise")

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "url_shortener",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function initializeDatabase() {
  const connection = await pool.getConnection()
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        short_id VARCHAR(32) NOT NULL UNIQUE,
        original_url TEXT NOT NULL,
        user_id INT UNSIGNED NULL,
        clicks INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT urls_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `)
  } finally {
    connection.release()
  }
}

module.exports = { pool, initializeDatabase }
