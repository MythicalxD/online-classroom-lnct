const express = require("express");
const multer = require("multer");
const db = require("../database");
const path = require("path");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Fetch Assignments Endpoint
router.get("/", (req, res) => {
  const role = req.query.role;
  const userId = req.query.userId;

  if (!role || !userId) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  const query =
    role === "teacher"
      ? `SELECT id, title, status FROM assignments WHERE created_by = ?`
      : `SELECT id, title, status FROM assignments WHERE classroom_id IN (
           SELECT classroom_id FROM classroom_members WHERE user_id = ?
         )`;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.json(rows);
  });
});

// Upload Assignment Document Endpoint
router.post("/upload", upload.array("files"), (req, res) => {
  const { userId, assignmentId } = req.body;
  const files = req.files;

  if (!userId || !assignmentId || !files.length) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  const insertQuery = `
    INSERT INTO submissions (assignment_id, user_id, file_path)
    VALUES (?, ?, ?)
  `;

  const updateStatusQuery = `
    UPDATE assignments SET status = 'graded'
    WHERE id = ? AND status = 'pending'
  `;

  const dbTasks = files.map(
    (file) =>
      new Promise((resolve, reject) => {
        db.run(insertQuery, [assignmentId, userId, file.path], (err) => {
          if (err) reject(err);
          else resolve();
        });
      })
  );

  Promise.all(dbTasks)
    .then(() => {
      // Update assignment status
      db.run(updateStatusQuery, [assignmentId], (err) => {
        if (err) {
          console.error("Error updating assignment status:", err.message);
          return res
            .status(500)
            .json({ message: "Error updating assignment status." });
        }

        res.status(201).json({
          message: "Documents uploaded successfully, and status updated.",
        });
      });
    })
    .catch((err) => {
      console.error("Database error during submission:", err.message);
      res.status(500).json({ message: "Internal server error." });
    });
});

// View Submissions for Teachers
router.get("/submissions", (req, res) => {
  const { assignmentId } = req.query;

  if (!assignmentId) {
    return res
      .status(400)
      .json({ message: "Missing required parameter: assignmentId." });
  }

  const query = `
    SELECT s.id, s.file_path, u.name AS student_name
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    WHERE s.assignment_id = ?
  `;

  db.all(query, [assignmentId], (err, rows) => {
    if (err) {
      console.error("Database error during fetching submissions:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.json(rows);
  });
});

// Create a New Assignment
router.post("/create", (req, res) => {
  const { title, status, classroomId, createdBy } = req.body;

  if (!title || !status || !classroomId || !createdBy) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const query = `
    INSERT INTO assignments (title, status, classroom_id, created_by)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [title, status, classroomId, createdBy], function (err) {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.status(201).json({
      id: this.lastID,
      title,
      status,
      classroom_id: classroomId,
      created_by: createdBy,
    });
  });
});

module.exports = router;
