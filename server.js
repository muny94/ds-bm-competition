// server.js - DS BM Competition (complete)

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "salg.json");

// Ensure data folder + file exist
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(DATA_FILE)) {
    const initial = [
      // optional initial array. Leave empty if you prefer.
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}
ensureDataFile();

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// Body parser for JSON
app.use(express.json());

// API: get data (for tv or anyone)
app.get("/api/salg", (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE);
    const json = JSON.parse(raw);
    // Return either array or object with persons as requested by your tv.js
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: "Could not read data" });
  }
});

// API: update data (admin posts new array)
// Optional: add a simple token check as q param or header (ADMIN_TOKEN env)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";
app.post("/api/update", (req, res) => {
  const token = req.headers["x-admin-token"] || req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const newData = req.body;
  if (!Array.isArray(newData)) {
    return res.status(400).json({ error: "Expected JSON array of persons" });
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
    io.emit("refresh", newData);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Could not write data" });
  }
});

// Websocket for real-time updates (also support admin pushing via socket)
io.on("connection", (socket) => {
  // Optional: send current data on connect
  try {
    const raw = fs.readFileSync(DATA_FILE);
    const json = JSON.parse(raw);
    socket.emit("refresh", json);
  } catch (e) {}

  socket.on("push", (data) => {
    // expecting an array
    const token = data && data.token;
    if (token !== ADMIN_TOKEN) return socket.emit("error", "Unauthorized");
    const members = data.members;
    if (!Array.isArray(members)) return socket.emit("error", "Invalid payload");
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(members, null, 2));
      io.emit("refresh", members);
    } catch (e) {
      socket.emit("error", "Could not save");
    }
  });
});

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
