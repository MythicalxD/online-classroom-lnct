const express = require("express");
const db = require("../database");
const crypto = require("crypto");

const router = express.Router();

// Create a new classroom (teacher only)
router.post("/create", (req, res) => {
  const { name, createdBy } = req.body;

  if (!name || !createdBy) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Generate a random classroom code
  const classroomCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  const query = `
    INSERT INTO classrooms (name, created_by, code)
    VALUES (?, ?, ?)
  `;
  db.run(query, [name, createdBy, classroomCode], function (err) {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.status(201).json({
      id: this.lastID,
      name,
      code: classroomCode,
      createdBy,
    });
  });
});

// Join a classroom (student)
router.post("/join", (req, res) => {
  const { userId, classroomCode } = req.body;

  if (!userId || !classroomCode) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Find the classroom by code
  const query = `SELECT id FROM classrooms WHERE code = ?`;
  db.get(query, [classroomCode], (err, classroom) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found." });
    }

    // Add the student to the classroom
    const insertQuery = `
      INSERT INTO classroom_members (classroom_id, user_id)
      VALUES (?, ?)
    `;
    db.run(insertQuery, [classroom.id, userId], function (err) {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ message: "Internal server error." });
      }
      res.status(201).json({ message: "Joined classroom successfully!" });
    });
  });
});

// Get classrooms for a teacher
router.get("/teacher", (req, res) => {
  const { createdBy } = req.query;

  if (!createdBy) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const query = `
    SELECT id, name, code FROM classrooms WHERE created_by = ?
  `;
  db.all(query, [createdBy], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.json(rows);
  });
});

// Get classrooms for a student
router.get("/student", (req, res) => {
  const { createdBy } = req.query;

  if (!createdBy) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const query = `
    SELECT c.id, c.name, c.code
    FROM classrooms c
    JOIN classroom_members cm ON c.id = cm.classroom_id
    WHERE cm.user_id = ?
  `;
  db.all(query, [createdBy], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.json(rows);
  });
});

module.exports = router;
