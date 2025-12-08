// admin.js - store admin token in localStorage and call protected API
function getAdminToken(){ return localStorage.getItem('adminToken')||''; }
function setAdminToken(t){ localStorage.setItem('adminToken', t); }
document.getElementById('saveTokenBtn').addEventListener('click', ()=>{
  const t=document.getElementById('adminTokenInput').value;
  if(!t){ document.getElementById('tokenMsg').innerText='Skriv inn nøkkel'; return; }
  setAdminToken(t); document.getElementById('tokenMsg').innerText='Nøkkel lagret.';
  loadMembers();
});

async function loadMembers(){
  const res=await fetch('/api/members'); const members=await res.json();
  const sel=document.getElementById('memberSelect'); const selAdd=document.getElementById('memberSelectAdd');
  sel.innerHTML=''; selAdd.innerHTML='';
  members.forEach(m=>{ const opt=document.createElement('option'); opt.value=m.id; opt.text=`${m.team} - ${m.name}`; sel.appendChild(opt); selAdd.appendChild(opt.cloneNode(true)); });
}
async function adminFetch(body){
  const token=getAdminToken(); if(!token){ alert('Sett admin-nøkkel først'); return; }
  const res=await fetch('/api/update',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':token},body:JSON.stringify(body)});
  return res.json();
}
document.getElementById('updateBtn').addEventListener('click', async ()=>{
  const id=Number(document.getElementById('memberSelect').value);
  const salg=Number(document.getElementById('salg').value)||0; const tilbud=Number(document.getElementById('tilbud').value)||0; const ring=Number(document.getElementById('ring').value)||0;
  const j=await adminFetch({id,salg,tilbud,ringeminutter:ring});
  document.getElementById('msg').innerText=j.success?'Oppdatert':(j.error||'Feil');
});
document.getElementById('addBtn').addEventListener('click', async ()=>{
  const id=Number(document.getElementById('memberSelectAdd').value); const addS=Number(document.getElementById('addSalg').value)||0;
  const addT=Number(document.getElementById('addTilbud').value)||0; const addR=Number(document.getElementById('addRing').value)||0;
  const current=await fetch('/api/members').then(r=>r.json()); const member=current.find(m=>m.id===id);
  if(!member){ document.getElementById('addMsg').innerText='Medlem ikke funnet'; return; }
  const newS=(Number(member.salg)||0)+addS; const newT=(Number(member.tilbud)||0)+addT; const newR=(Number(member.ringeminutter)||0)+addR;
  const j=await adminFetch({id,salg:newS,tilbud:newT,ringeminutter:newR}); document.getElementById('addMsg').innerText=j.success?'Lagt til':(j.error||'Feil');
});
loadMembers();
