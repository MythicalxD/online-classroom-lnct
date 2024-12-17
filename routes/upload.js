const multer = require("multer");
const express = require("express");
const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

app.post("/upload-document", upload.array("files", 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
    }

    res.status(200).json({
        message: "Files uploaded successfully.",
        files: req.files.map((file) => ({
            filename: file.filename,
            path: file.path,
        })),
    });
});

app.listen(8000, () => {
    console.log("Server is running on http://localhost:8000");
});
