// server.js – DS BM Competition (Storebrand–style)

// --- Importer moduler ---
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// --- Serve STATIC files (viktig for salg.json i public/) ---
app.use(express.static("public"));


// --- DATA FIL (brukes av admin) ---
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "salg.json");


// Sørger for at data/salg.json finnes
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      members: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

ensureDataFile();


// --- API: HENT DATA (til TV-skjerm) ---
app.get("/api/salg", (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE);
    const json = JSON.parse(raw);
    res.json(json.members);
  } catch (err) {
    res.status(500).json({ error: "Kunne ikke lese data" });
  }
});


// --- SOCKET.IO (live oppdatering) ---
io.on("connection", socket => {
  console.log("Ny klient koblet til");

  socket.on("update", data => {
    console.log("Mottatt oppdatering:", data);

    const raw = fs.readFileSync(DATA_FILE);
    const db = JSON.parse(raw);

    db.members = data; // Oppdaterer hele lista

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

    io.emit("refresh", db.members);
  });
});


// --- START SERVER ---
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
