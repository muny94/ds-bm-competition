// dashboard.js - show leaderboard, teams summary and chart
const socket = io();

function computePoints(m){
  const salg=Number(m.salg||0);
  const tilbud=Number(m.tilbud||0);
  const minutter=Number(m.ringeminutter||0);
  return Math.round(((salg/1000)*10 + (tilbud/1000)*2 + minutter*0.5)*100)/100;
}

function renderLeader(members){
  const ul=document.getElementById('leaderList');
  ul.innerHTML='';
  members.sort((a,b)=>b.points-a.points);
  members.forEach((m,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`<span class="name">${m.name}</span><span class="points">${m.points}</span>`;
    ul.appendChild(li);
  });
}

function renderTeams(members){
  const grouped={};
  members.forEach(m=>{
    if(!grouped[m.team]) grouped[m.team]={total:0,count:0};
    grouped[m.team].total+=m.points; grouped[m.team].count+=1;
  });
  const container=document.getElementById('teamsSummary');
  container.innerHTML='';
  const labels=[]; const data=[];
  let best=null; let bestAvg=-Infinity;
  for(const k in grouped){
    const avg=grouped[k].total/grouped[k].count;
    if(avg>bestAvg){bestAvg=avg;best=k}
    container.innerHTML+=`<div class="${k===best?'leader':''}"><strong>${k}</strong> — Totalt ${grouped[k].total.toFixed(2)} — Snitt ${avg.toFixed(2)}</div>`;
    labels.push(k); data.push(grouped[k].total);
  }
  // chart
  const ctx=document.getElementById('teamChart').getContext('2d');
  if(window._teamChart) window._teamChart.destroy();
  window._teamChart = new Chart(ctx, {type:'bar', data:{labels, datasets:[{label:'Poeng', data, backgroundColor:['#ff6a00','#ffb380']}]}, options:{responsive:true,maintainAspectRatio:false}});
}

function fetchAndRender(){
  fetch('/api/members').then(r=>r.json()).then(members=>{
    members.forEach(m=>m.points=computePoints(m));
    renderLeader(members);
    renderTeams(members);
  });
}

socket.on('full', members => { members.forEach(m=>m.points=computePoints(m)); renderLeader(members); renderTeams(members); });
socket.on('update', ()=> fetchAndRender());
fetchAndRender();
