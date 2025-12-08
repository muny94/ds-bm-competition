// tv.js - simple TV list
const socketTv = io();
function compute(m){ const salg=Number(m.salg||0); const tilbud=Number(m.tilbud||0); const min=Number(m.ringeminutter||0); return Math.round(((salg/1000)*10 + (tilbud/1000)*2 + min*0.5)*100)/100; }
function render(members){ const ul=document.getElementById('tvList'); ul.innerHTML=''; members.sort((a,b)=>b.points-a.points); members.forEach((m,i)=>{ const li=document.createElement('li'); if(i===0) li.style.color='#ff6a00'; li.innerHTML=`${i+1}. ${m.name} — ${m.points}`; ul.appendChild(li); }); }
socketTv.on('full', members => { members.forEach(m=>m.points=compute(m)); render(members); });
socketTv.on('update', ()=> fetch('/api/members').then(r=>r.json()).then(members=>{ members.forEach(m=>m.points=compute(m)); render(members); }));
// fallback refresh
setInterval(()=>fetch('/api/members').then(r=>r.json()).then(m=>{ m.forEach(x=>x.points=compute(x)); render(m); }),60000);
