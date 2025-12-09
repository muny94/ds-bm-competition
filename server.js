const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "salg.json");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";

// create data dir / file if missing
function ensureData() {
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initial = [
      {"name":"Emmanuel Muny.","team":"BM Tromsø","points":2500},
      {"name":"Even Grønbech-Hope","team":"BM Tromsø","points":2100},
      {"name":"Mats Solem","team":"BM Tromsø","points":1800}
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}
ensureData();

app.use(express.static("public"));
app.use(express.json({ limit: "2mb" }));

app.get("/salg.json", (req, res) => {
  res.sendFile(DATA_FILE);
});

app.get("/admin/load", (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(403).send("Forbidden");
  res.sendFile(DATA_FILE);
});

app.post("/admin/save", (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(403).send("Forbidden");
  const body = req.body;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(body, null, 2));
    io.emit("update", body);
    res.send("OK");
  } catch (e) {
    res.status(500).send(e.message);
  }
});

server.listen(PORT, () => console.log("Server running on " + PORT));

io.on("connection", socket => {
  try {
    let raw = fs.readFileSync(DATA_FILE, "utf8");
    socket.emit("update", JSON.parse(raw));
  } catch (e) {
    socket.emit("update", []);
  }
});
