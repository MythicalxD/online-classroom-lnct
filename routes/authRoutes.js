const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../database");

const router = express.Router();

// Signup Endpoint
router.post("/signup", async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const checkUserQuery = `SELECT id FROM users WHERE username = ?`;
    db.get(checkUserQuery, [username], async (err, row) => {
      if (err) return res.status(500).json({ message: "Internal server error." });
      if (row) return res.status(409).json({ message: "Username already exists." });

      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUserQuery = `
        INSERT INTO users (name, username, password, role)
        VALUES (?, ?, ?, ?)
      `;
      db.run(insertUserQuery, [name, username, hashedPassword, role], (err) => {
        if (err) return res.status(500).json({ message: "Internal server error." });
        res.status(201).json({ message: "Signup successful!" });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

// Login Endpoint
router.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const query = `
    SELECT id, name, username, password, role FROM users
    WHERE username = ? AND role = ?
  `;

  db.get(query, [username, role], async (err, user) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials or role." });
    }

    // Compare hashed passwords (if hashing is used)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials or role." });
    }

    // Respond with user details (excluding sensitive data like password)
    return res.status(200).json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      message: "Login successful!",
    });
  });
});


module.exports = router;
