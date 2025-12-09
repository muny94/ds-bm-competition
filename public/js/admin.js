// admin.js
const socket = io();

const jsonArea = document.getElementById("jsonArea");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const prettyBtn = document.getElementById("prettyBtn");
const tvOpenBtn = document.getElementById("tvOpenBtn");
const tokenInput = document.getElementById("token");
const status = document.getElementById("status");

async function loadData() {
  const res = await fetch("/api/salg");
  if (!res.ok) return alert("Kunne ikke laste data");
  const data = await res.json();
  jsonArea.value = JSON.stringify(data, null, 2);
}

async function saveData() {
  let arr;
  try {
    arr = JSON.parse(jsonArea.value);
  } catch (e) {
    return alert("Ugyldig JSON");
  }
  const token = tokenInput.value || "changeme";
  const res = await fetch("/api/update?token=" + encodeURIComponent(token), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arr)
  });
  const r = await res.json();
  if (res.ok) {
    status.textContent = "Saved & pushed ✔";
    setTimeout(()=> status.textContent = "", 3000);
  } else {
    alert("Feil: " + JSON.stringify(r));
  }
}

// Format JSON
prettyBtn.onclick = ()=>{
  try {
    const obj = JSON.parse(jsonArea.value);
    jsonArea.value = JSON.stringify(obj, null, 2);
  } catch (e) {
    alert("Ugyldig JSON");
  }
};

loadBtn.onclick = loadData;
saveBtn.onclick = saveData;
tvOpenBtn.onclick = ()=> window.open("/tv.html", "_blank");

// Optional: respond to socket refresh
socket.on("refresh", (data) => {
  status.textContent = "TV oppdatert (live)";
  setTimeout(()=> status.textContent = "", 2000);
});

// auto load on open
loadData();
