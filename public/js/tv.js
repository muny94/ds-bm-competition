const socket = io();
const list = document.getElementById("tvList");

function render(data) {
  if (!Array.isArray(data)) {
    if (data && data.persons) data = data.persons;
    else return;
  }

  data.sort((a,b) => b.points - a.points);
  list.innerHTML = "";

  data.forEach((p, i) => {
    let li = document.createElement("li");

    if (i === 0) li.classList.add("top1");
    else if (i === 1) li.classList.add("top2");
    else if (i === 2) li.classList.add("top3");

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = p.name || "";

    const points = document.createElement("span");
    points.className = "points";
    points.textContent = p.points != null ? p.points : "";

    li.appendChild(name);
    li.appendChild(points);

    list.appendChild(li);
  });
}

socket.on("update", data => render(data));

// initial fetch fallback
fetch("/salg.json").then(r=>r.json()).then(render).catch(()=>{});
