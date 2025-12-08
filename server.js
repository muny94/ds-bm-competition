// server.js - DS BM Competition (Storebrand-inspired)
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const DATA_FILE = path.join(__dirname, 'data', 'salg.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

function ensureDataFile() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      members: [
        { id: 1, team: "BM Tromsø", name: "Emmanuel M.", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 2, team: "BM Tromsø", name: "Even Grønbech-Hope", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 3, team: "BM Tromsø", name: "Mats Solem", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 4, team: "BM Tromsø", name: "Ida Marie Korsberg", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 5, team: "BM Tromsø", name: "Kristin Mørch", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 6, team: "BM Tromsø", name: "Håkon T", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 7, team: "BM Tromsø", name: "Håkon Struve", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 8, team: "BM Tromsø", name: "Phanhu Khinkoe", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id: 9, team: "BM Oslo/Trondheim", name: "Daniel Krogh", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id:10, team: "BM Oslo/Trondheim", name: "Aron Aminezghi", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id:11, team: "BM Oslo/Trondheim", name: "Rizwan Ahmad", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id:12, team: "BM Oslo/Trondheim", name: "Jakob Pollestad", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id:13, team: "BM Oslo/Trondheim", name: "Frank Værnes", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id:14, team: "BM Oslo/Trondheim", name: "Joakim Grønvik", salg: 0, tilbud: 0, ringeminutter: 0 },
        { id:15, team: "BM Oslo/Trondheim", name: "Matias Meland", salg: 0, tilbud: 0, ringeminutter: 0 }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    console.log('Initial data written to', DATA_FILE);
  }
}
ensureDataFile();

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE)); }
  catch (e) { console.error('read error', e); return { members: [] }; }
}
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

function computePoints(member) {
  const salg = Number(member.salg||0);
  const tilbud = Number(member.tilbud||0);
  const minutter = Number(member.ringeminutter||0);
  const points = (salg/1000)*10 + (tilbud/1000)*2 + (minutter*0.5);
  return Math.round(points*100)/100;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/members', (req, res) => {
  const data = readData();
  const withPoints = data.members.map(m => ({ ...m, points: computePoints(m) }));
  res.json(withPoints);
});

function requireAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Ugyldig admin-nøkkel' });
  next();
}

app.post('/api/update', requireAdminToken, (req, res) => {
  const { id, salg, tilbud, ringeminutter } = req.body;
  const data = readData();
  const idx = data.members.findIndex(x => x.id === Number(id));
  if (idx === -1) return res.status(404).json({ error: 'Medlem ikke funnet' });
  if (salg !== undefined) data.members[idx].salg = Number(salg);
  if (tilbud !== undefined) data.members[idx].tilbud = Number(tilbud);
  if (ringeminutter !== undefined) data.members[idx].ringeminutter = Number(ringeminutter);
  writeData(data);
  const updated = { ...data.members[idx], points: computePoints(data.members[idx]) };
  io.emit('update', updated);
  const snapshot = data.members.map(m => ({ ...m, points: computePoints(m)}));
  io.emit('full', snapshot);
  res.json({ success: true, member: updated });
});

io.on('connection', socket => {
  console.log('client connected', socket.id);
  const snapshot = readData().members.map(m => ({ ...m, points: computePoints(m) }));
  socket.emit('full', snapshot);
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('server listening on', PORT, 'ADMIN_TOKEN=', ADMIN_TOKEN === 'changeme' ? 'changeme (change!)' : 'set'));
