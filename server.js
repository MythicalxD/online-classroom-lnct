const express = require("express");
const http = require("http");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const classroomRoutes = require("./routes/classroomRoutes"); // Include the new classroom routes
const liveFeedSocket = require("./routes/liveFeedRoutes");

// Initialize Express app
const app = express();
const PORT = 8000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/classrooms", classroomRoutes); // Register classroom routes

// HTTP Server
const server = http.createServer(app);

// Live Feed Socket
liveFeedSocket(server);

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
