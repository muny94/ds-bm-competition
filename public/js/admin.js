const socket = io();
const box = document.getElementById("jsonBox");

document.getElementById("loadBtn").onclick = async () => {
  const token = document.getElementById("token").value;
  try {
    let res = await fetch("/admin/load?token=" + encodeURIComponent(token));
    if (!res.ok) throw new Error("Kunne ikke laste");
    box.value = await res.text();
  } catch (e) {
    alert("Feil ved lasting: " + e.message);
  }
};

document.getElementById("saveBtn").onclick = async () => {
  const token = document.getElementById("token").value;
  try {
    let payload = JSON.parse(box.value);
    let res = await fetch("/admin/save?token=" + encodeURIComponent(token), {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    alert("Lagret og sendt til TV!");
  } catch (e) {
    alert("Feil ved lagring: " + e.message);
  }
};
