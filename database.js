const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("classroom_platform.db", (err) => {
  if (err) {
    console.error("Could not connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

module.exports = db;
