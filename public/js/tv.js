// tv.js - listens for live updates, animates list and shows top (with top3 animations)
(function(){
  const listEl = document.getElementById('tvList');
  const leaderPoints = document.getElementById('leader-points');
  const leaderTeam = document.getElementById('leader-team');
  const leaderName = document.getElementById('leader-name');
  const lastUpdated = document.getElementById('last-updated');
  const tvTime = document.getElementById('tv-time');

  function nowString(){
    const d = new Date();
    return d.toLocaleString('nb-NO', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'});
  }

  // Render list (array of {name, team, points})
  function renderList(data){
    data.sort((a,b)=>b.points - a.points);

    const top = data[0] || {points:0, team:'-', name:'-'};
    leaderPoints.textContent = top.points.toLocaleString('nb-NO');
    leaderTeam.textContent = top.team || '-';
    leaderName.textContent = top.name || '-';
    lastUpdated.textContent = nowString();
    tvTime.textContent = (new Date()).toLocaleTimeString('nb-NO');

    // Build new elements but compare with previous to add animations
    const prev = (listEl.dataset.current) ? JSON.parse(listEl.dataset.current) : [];
    const prevMap = new Map(prev.map(p=>[p.name, p.points]));
    const prevOrder = prev.map(p=>p.name);

    // detect entrants to top3 => attach entrance animation
    const newOrder = data.map(d=>d.name);
    const top3Entrants = [];
    for(let i=0;i<3 && i<data.length;i++){
      const nm = data[i].name;
      if(prevOrder.indexOf(nm) === -1 || prevOrder.indexOf(nm) >= 3){
        // new in top3 or promoted from below
        top3Entrants.push(nm);
      }
    }

    // compose HTML
    const items = data.map((p, idx) => {
      const rankNum = idx + 1;
      const rankClass = (rankNum === 1) ? 'rank top1' : (rankNum === 2) ? 'rank top2' : (rankNum === 3) ? 'rank top3' : 'rank';
      return {
        html: `<li data-name="${escapeHtml(p.name)}" data-points="${p.points}">
          <div style="display:flex;align-items:center">
            <div class="${rankClass}">${rankNum}</div>
            <div>
              <div>${escapeHtml(p.name)}</div>
              <div class="meta">${escapeHtml(p.team)}</div>
            </div>
          </div>
          <div class="points">${p.points.toLocaleString('nb-NO')}</div>
        </li>`,
        name: p.name,
        points: p.points
      };
    });

    // replace DOM quickly (we will add classes after to animate)
    listEl.innerHTML = items.map(it=>it.html).join('');

    // add updated class if changed
    Array.from(listEl.children).forEach((li, i)=>{
      const name = li.dataset.name;
      const points = Number(li.dataset.points);
      const old = prevMap.get(name);
      if(old === undefined){
        // new: if in top3, mark entrance
        if(i < 3) li.classList.add('top-entrance');
      } else if(points !== old){
        li.classList.add('updated');
      }

      // if this is in top3 entrants list, add entrance animation
      if(top3Entrants.includes(name)){
        li.classList.add('top-entrance');
      }

      // remove entrance highlight after animation
      setTimeout(()=>li.classList.remove('top-entrance'), 2000);
      // remove updated after its animation
      setTimeout(()=>li.classList.remove('updated'), 1800);
    });

    // store current
    listEl.dataset.current = JSON.stringify(data.map(d=>({name:d.name,points:d.points})));
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }

  // Socket/polling fallback (same as before)
  if(typeof io !== 'undefined'){
    try{
      const socket = io();
      socket.on('connect', ()=>console.log('socket connected'));
      socket.on('score:update', data=>{
        renderList(data);
      });
      socket.emit('score:request');
      socket.on('score:snapshot', data=>{
        renderList(data);
      });
      setTimeout(()=>fetchSnapshotIfEmpty(),4000);
    }catch(e){
      console.warn('Socket init failed', e);
      fetchSnapshotIfEmpty();
    }
  } else {
    fetchSnapshotIfEmpty();
  }

  function fetchSnapshotIfEmpty(){
    fetch('/salg.json?tv=1&_=' + Date.now())
      .then(r=>r.json())
      .then(data=>{
        if(Array.isArray(data)) renderList(data);
        else if(data.persons) renderList(data.persons);
        else if(data.results) renderList(data.results);
      }).catch(err=>console.warn('Snapshot fetch failed', err));

    setInterval(()=>fetch('/salg.json?tv=1&_=' + Date.now())
      .then(r=>r.json())
      .then(data=>{ if(Array.isArray(data)) renderList(data); else if(data.persons) renderList(data.persons);} )
      .catch(()=>{}), 8000);
  }

})();
