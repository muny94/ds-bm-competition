// tv.js
const socket = io();

const top3El = document.getElementById("top3");
const listEl = document.getElementById("list");

function render(data) {
  // data expected to be array of {name,team,points}
  const arr = (Array.isArray(data) ? data : []);
  // sort by points desc
  arr.sort((a,b)=> (b.points||0) - (a.points||0));

  // Top3
  top3El.innerHTML = "";
  const top3 = arr.slice(0,3);
  top3.forEach((p,i)=>{
    const div = document.createElement("div");
    div.className = "card" + (i===0 ? " pulse" : "");
    div.innerHTML = `<h3>#${i+1} ${p.name}</h3>
                     <div style="opacity:.7">${p.team || ""}</div>
                     <div class="points">${p.points || 0}</div>`;
    top3El.appendChild(div);
  });

  // Full list
  listEl.innerHTML = "";
  arr.forEach((p, idx)=>{
    const li = document.createElement("li");
    li.innerHTML = `<div><span class="name">${p.name}</span><div style="font-size:12px;color:rgba(255,255,255,0.6)">${p.team||""}</div></div>
                    <div style="font-weight:700">${p.points||0}</div>`;
    listEl.appendChild(li);
  });
}

// initial fetch
async function fetchData() {
  try {
    const res = await fetch("/api/salg");
    if (!res.ok) throw new Error("no");
    const data = await res.json();
    render(data);
  } catch (e) {
    console.error("Could not fetch data", e);
  }
}
fetchData();

// poll fallback every 20s
setInterval(fetchData, 20000);

// socket live updates
socket.on("refresh", (data) => {
  render(data);
});
