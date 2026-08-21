
/* ---------- build the 78 ---------- */
const SUITORDER=["wands","cups","swords","pentacles"];
const DECK=[];
MAJORS.forEach((m,i)=>DECK.push({id:"m"+i,name:m[0],arc:"major",roman:R[i],scene:m[1],syms:m[2],read:m[3],rev:m[4],look:m[5],ord:i}));
SUITORDER.forEach(s=>{
  PIPS[s].forEach((p,i)=>{const n=i+1;DECK.push({id:s+n,name:(n===1?"Ace":NUMS[n][0])+" of "+cap(s),arc:"pip",suit:s,n:n,scene:p[0],read:p[1],rev:p[2]});});
  ["page","knight","queen","king"].forEach(r=>{const c=COURTS[s][r];
    DECK.push({id:s+r,name:cap(r)+" of "+cap(s),arc:"court",suit:s,rank:r,scene:c[0],read:c[1],rev:c[2]});});
});
function cap(x){return x[0].toUpperCase()+x.slice(1)}
const byId=id=>DECK.find(c=>c.id===id);

/* ---------- state ---------- */
var S={met:{},entries:[],today:null};
var view="today",openId=null,depth=1;
function pullRandom(){setToday(DECK[Math.floor(Math.random()*78)].id)}

function load(){
  try{const r=localStorage.getItem(KEY); if(r)S=Object.assign(S,JSON.parse(r));}
  catch(e){/* first run, or storage blocked */}
  render();
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(S));}
  catch(e){toast("Couldn't save. If you're in private browsing, storage is blocked.");}
}
const KEY="foolsalmanac:state";
/* Export / import — your journal is yours, and localStorage is not forever. */
function exportData(){
  const blob=new Blob([JSON.stringify(S,null,1)],{type:"application/json"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download="fools-almanac-"+today()+".json";a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function importData(inp){
  const f=inp.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);
      if(!d||typeof d!=="object"||!("entries" in d))throw 0;
      S=Object.assign({met:{},entries:[],today:null},d); save(); render();
      toast("Journal restored — "+S.entries.length+" entries.");}
    catch(e){toast("That file isn't a journal backup.");}};
  r.readAsText(f);
}
function toast(m){const t=document.createElement("div");t.textContent=m;
  t.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:20px;background:#171B20;color:#EDEFE8;padding:10px 16px;font-family:var(--serif);font-size:14px;z-index:99;max-width:90%";
  document.body.appendChild(t);setTimeout(()=>t.remove(),3400);}
const today=()=>new Date().toISOString().slice(0,10);
const pretty=d=>new Date(d+"T12:00").toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});

/* ---------- the plate ---------- */
const SIG={
 wand:'<path d="M12 21V4" /><path d="M12 10c3-1 4-3 4-5" />',
 cup:'<path d="M6 5h12v3a6 6 0 0 1-12 0z" /><path d="M12 14v5" /><path d="M8 20h8" />',
 sword:'<path d="M12 3v15" /><path d="M7 15h10" /><circle cx="12" cy="20.5" r="1.6" />',
 pent:'<circle cx="12" cy="12" r="8.5" /><path d="M12 5.2 13.7 10.4 19.2 10.4 14.8 13.6 16.4 18.8 12 15.6 7.6 18.8 9.2 13.6 4.8 10.4 10.3 10.4Z" />'
};
function sig(kind,color,size){return `<svg class="sig" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${SIG[kind]}</svg>`}
function plate(c,px,thumb){
  return `<div class="plate" style="${px||""}"><div class="pin img"><img loading="lazy" decoding="async"
    width="400" height="667" alt="${c.name}" src="${thumb?"thumb":"img"}/${c.id}.webp"></div></div>`;
}

/* ---------- card detail: five depths, stop wherever you like ---------- */
const DEPTHS=["Look","The scene","Why it means that","The reading","Write it down"];
function stage(i){return i===0?"Stage 0 — The one who begins":i<8?"Stage I — Learning the outer world":i<15?"Stage II — Turning inward":"Stage III — Forces larger than you"}

function cardView(c,journalMode){
  let h=`<div class="panel"><div class="bar caps">${journalMode?"Today's card":"Card"}</div>`;
  h+=`<div class="hero">${plate(c)}<div><h2 style="font-size:24px;font-weight:400">${c.name}</h2>`;
  h+=`<div class="caps soft" style="margin-top:5px">${c.arc==="major"?stage(c.ord):SUITS[c.suit].el+" &nbsp;·&nbsp; "+SUITS[c.suit].dom}</div>`;
  h+=`<div class="step" style="margin-top:12px;border:0;padding:0">
    <div class="caps" style="color:var(--brick)">Step one — look, don't read</div>
    <p class="small" style="margin-top:7px">The picture is on the left, and nothing below it is explained yet. Spend a moment on it first: what is happening? Who is looking at whom? What's in the background that you'd normally skip? If your deck is to hand, hold the real card — it's bigger, and you'll notice more.</p>
    ${c.look?`<p class="small" style="margin-top:8px"><b style="font-weight:400;border-bottom:2px solid var(--chrome)">One thing to notice</b> — ${c.look.trim()}</p>`:
      `<p class="small" style="margin-top:8px"><b style="font-weight:400;border-bottom:2px solid var(--chrome)">Ask the suit's question</b> — ${SUITS[c.suit].q}</p>`}
  </div></div></div>`;

  if(depth>=2)h+=`<div class="step reveal"><div class="caps soft">${DEPTHS[1]}</div><p class="lead" style="margin-top:7px">${c.scene}</p></div>`;

  if(depth>=3){
    h+=`<div class="step reveal"><div class="caps soft">${DEPTHS[2]}</div>`;
    if(c.arc==="major"){
      h+=`<div class="sym">`+c.syms.map(s=>`<b>${s[0]}</b><span>${s[1]}</span>`).join("")+`</div>`;
      const prev=c.ord>0?MAJORS[c.ord-1][0]:null,next=c.ord<21?MAJORS[c.ord+1][0]:null;
      h+=`<p class="small soft" style="margin-top:11px">${stage(c.ord)}.${prev?" Follows <i>"+prev+"</i>":""}${next?", leads to <i>"+next+"</i>":""}. The order carries meaning — the Majors are one story, in sequence.</p>`;
    }else{
      const su=SUITS[c.suit];
      const part=c.arc==="pip"?NUMS[c.n]:RANKS[c.rank];
      h+=`<div class="derive">
        <div class="eq">
          <div><span class="caps soft">The suit</span><b style="margin-top:4px;font-size:16px">${cap(c.suit)} — ${su.el}</b><span class="small">${su.dom}</span></div>
          <span>+</span>
          <div><span class="caps soft">${c.arc==="pip"?"The number":"The rank"}</span><b style="margin-top:4px;font-size:16px">${part[0]} — ${part[1]}</b><span class="small">${part[2]}</span></div>
        </div>
        <p class="small"><b style="font-weight:400">Now assemble it yourself.</b> ${su.dom.split(",")[0].toLowerCase()} + ${part[1].toLowerCase()} = what? Say it out loud before you openId the next step. This is the whole skill — every one of the 56 Minor cards is built this way, so you only ever need 4 suits and 14 positions, not 56 definitions.</p>
        <p class="small soft" style="margin-top:8px">Pace: ${su.pace}</p></div>`;
    }
    h+=`</div>`;
  }

  if(depth>=4)h+=`<div class="step reveal"><div class="caps soft">${DEPTHS[3]}</div>
    <p class="lead" style="margin-top:7px">${c.read}</p>
    <p class="small soft" style="margin-top:9px"><b style="font-weight:400;color:var(--ink)">Reversed</b> — ${c.rev}</p>
    <p class="small soft" style="margin-top:9px">Hold this loosely. A card means what it means <i>in the question you asked</i>. If the reading above doesn't fit your situation, trust the picture over the sentence.</p></div>`;

  if(depth>=5){
    h+=`<div class="step reveal"><div class="caps soft">${DEPTHS[4]}</div>
      <label class="caps" style="margin-top:9px">Where did you meet this card today?</label>
      <textarea id="jt" placeholder="One honest sentence beats a paragraph you don't mean."></textarea>
      <div class="row" style="margin-top:9px"><button class="act" onclick="saveEntry('${c.id}')">Save entry</button>
      <span class="small soft">Saved entries stay here between sessions.</span></div></div>`;
  }

  h+=`<div class="row" style="margin-top:16px">`;
  if(depth<5)h+=`<button class="act" onclick="depth++;render()">${depth===4?"Write it down":"Go deeper"}</button>`;
  if(!journalMode)h+=`<button class="act ghost" onclick="openId=null;depth=1;render()">Close</button>`;
  h+=`<span class="caps soft">Depth ${depth} of 5 · ${DEPTHS[depth-1]}</span>`;
  if(depth<5)h+=`<span class="small soft" style="flex-basis:100%">Stop at any depth. A thirty-second look still counts as a session.</span>`;
  h+=`</div></div>`;
  return h;
}
function saveEntry(id){
  const t=(document.getElementById("jt")||{}).value||"";
  const c=byId(id);
  S.entries.unshift({id:id,name:c.name,date:today(),text:t.trim()});
  S.met[id]=true; save(); openId=null;depth=1;view="journal";render();
}


/* ---------- TODAY ---------- */
function todayView(){
  if(S.today&&S.today.date===today()){
    const done=S.entries.some(e=>e.date===today()&&e.id===S.today.id);
    if(!done)return cardView(byId(S.today.id),true);
    const c=byId(S.today.id);
    return `<div class="panel"><div class="bar caps">${pretty(today())}</div>
      <div class="hero">${plate(c)}<div><h2 style="font-size:23px;font-weight:400">${c.name}</h2>
      <p class="lead" style="margin-top:9px">Drawn and written down. That's today done.</p>
      <p class="small soft" style="margin-top:8px">Come back tomorrow for the next draw. If you want more now, study any card in the deck or work through the grammar — neither will overwrite today's entry.</p>
      <div class="row" style="margin-top:13px"><button class="act ghost" onclick="openId='${c.id}';depth=4;render()">Re-read this card</button>
      <button class="act ghost" onclick="view='deck';render()">Study another</button></div></div></div></div>`;
  }
  const opts=DECK.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  return `<div class="panel"><div class="bar caps">${pretty(today())}</div>
    <p class="lead">Shuffle your deck and pull one card. Don't look anything up yet.</p>
    <p class="small soft" style="margin-top:8px">Then tell me which card it was. If your deck isn't to hand, I'll pull one instead — but the physical draw is the part that builds the habit.</p>
    <div style="margin-top:16px"><label class="caps">The card I pulled</label>
      <select id="pick"><option value="">Choose…</option>${opts}</select></div>
    <div class="row" style="margin-top:11px">
      <button class="act" onclick="setToday(document.getElementById('pick').value)">That's my card</button>
      <button class="act ghost" onclick="pullRandom()">Pull one for me</button></div>
    ${S.entries.length?`<p class="small soft" style="margin-top:18px">Last entry: ${S.entries[0].name}, ${pretty(S.entries[0].date)}.</p>`:
      `<p class="small soft" style="margin-top:18px">Nothing drawn yet. Start with whatever comes up — there are no bad first cards.</p>`}</div>`;
}
function setToday(id){
  if(!id)return toast("Pick a card from the list first, or let me pull one.");
  S.today={date:today(),id:id};S.met[id]=true;depth=1;save();render();
}

/* ---------- GRAMMAR ---------- */
var bs="wands",bn="5",bshow=false;
function grammarView(){
  let h=`<div class="panel"><div class="bar caps">The grammar</div>
   <p class="lead">There are 78 cards and only 18 things to learn. Four suits, ten numbers, four ranks. Every Minor card is one suit multiplied by one position — so you derive it instead of recalling it.</p></div>`;

  h+=`<div class="suithead"><h3 style="font-weight:400;font-size:19px">The four suits</h3><span class="caps">what kind of thing is happening</span></div>
  <div class="stack">`;
  SUITORDER.forEach(s=>{const u=SUITS[s];
    h+=`<div class="panel" style="padding:13px 15px"><div class="row" style="gap:12px;align-items:flex-start">
      <div style="width:36px;flex:none;padding-top:2px">${sig(u.sig,"#171B20",30)}</div>
      <div style="flex:1;min-width:180px"><b style="font-weight:400;font-size:17px">${cap(s)} — ${u.el}</b>
      <div class="small" style="margin-top:3px">${u.dom}</div>
      <div class="small soft" style="margin-top:6px">Asks: ${u.q}<br>${u.pace}</div></div></div></div>`;});
  h+=`</div>`;

  h+=`<div class="suithead"><h3 style="font-weight:400;font-size:19px">The ten numbers</h3><span class="caps">what stage it's at</span></div><div class="panel"><div class="sym">`;
  for(let i=1;i<=10;i++)h+=`<b>${NUMS[i][0]} · ${NUMS[i][1]}</b><span class="small">${NUMS[i][2]}</span>`;
  h+=`</div></div>`;

  h+=`<div class="suithead"><h3 style="font-weight:400;font-size:19px">The four ranks</h3><span class="caps">a person, or a mode you're in</span></div><div class="panel"><div class="sym">`;
  ["page","knight","queen","king"].forEach(r=>h+=`<b>${RANKS[r][0]} · ${RANKS[r][1]}</b><span class="small">${RANKS[r][2]}</span>`);
  h+=`</div></div>`;

  /* the builder */
  const card=byId(bs+bn);
  h+=`<div class="suithead"><h3 style="font-weight:400;font-size:19px">Build a card</h3><span class="caps">the whole method, in one exercise</span></div>
  <div class="panel"><p class="small">Pick a suit and a position. Say the meaning out loud <i>before</i> you check it. When your guess and the card start agreeing, you've learned the system rather than the list.</p>
  <div class="row" style="margin-top:13px;align-items:flex-end">
    <div style="flex:1;min-width:130px"><label class="caps">Suit</label>
      <select onchange="bs=this.value;bshow=false;render()">${SUITORDER.map(s=>`<option value="${s}" ${s===bs?"selected":""}>${cap(s)}</option>`).join("")}</select></div>
    <div style="flex:1;min-width:130px"><label class="caps">Position</label>
      <select onchange="bn=this.value;bshow=false;render()">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${String(n)===bn?"selected":""}>${NUMS[n][0]}</option>`).join("")}${["page","knight","queen","king"].map(r=>`<option value="${r}" ${r===bn?"selected":""}>${RANKS[r][0]}</option>`).join("")}</select></div>
  </div>
  <div class="derive" style="margin-top:13px"><div class="eq">
    <div><span class="caps soft">Suit</span><b style="font-size:16px;margin-top:3px">${SUITS[bs].el}</b><span class="small">${SUITS[bs].dom}</span></div><span>+</span>
    <div><span class="caps soft">Position</span><b style="font-size:16px;margin-top:3px">${(NUMS[bn]||RANKS[bn])[1]}</b><span class="small">${(NUMS[bn]||RANKS[bn])[2]}</span></div></div>
    ${bshow?`<div class="reveal" style="border-top:1px solid var(--ink);padding-top:12px;margin-top:4px">
      <div class="hero" style="grid-template-columns:110px 1fr"><div>${plate(card)}</div>
      <div><b style="font-weight:400;font-size:17px">${card.name}</b>
      <p class="small" style="margin-top:6px">${card.scene}</p>
      <p style="margin-top:8px">${card.read}</p>
      <div class="row" style="margin-top:11px"><button class="act ghost" onclick="bshow=false;render()">Hide</button>
      <button class="act ghost" onclick="openId='${card.id}';depth=1;view='deck';render()">Study this card</button></div></div></div></div>`
    :`<button class="act" style="margin-top:4px" onclick="bshow=true;render()">Check my answer</button>`}
  </div></div>`;
  return h;
}

/* ---------- SPREADS ---------- */
function spreadsView(){
  return `<div class="panel"><div class="bar caps">Spreads</div>
  <p class="lead">A spread is a sentence. The cards are the words; the positions are the grammar. The same card means different things in "what's helping me" and "what I'm avoiding" — which is why position work matters more than card definitions.</p>
  <p class="small soft" style="margin-top:10px">Work down this page in order. Don't move to three cards until one card feels boring.</p></div>

  <div class="suithead"><h3 style="font-weight:400;font-size:19px">One card</h3><span class="caps">start here for a month</span></div>
  <div class="panel"><div class="spread"><div class="slot"><div class="caps">The card</div><p>What I need to see today.</p></div></div>
  <p class="small">A single card has no context, so the context has to come from your question. "What do I need to see today" gives a card something to answer. "Will it go well?" gives it nothing.</p>
  <p class="small soft" style="margin-top:8px">The daily draw is doing two jobs at once: teaching you the card, and teaching you that meaning depends on the question.</p></div>

  <div class="suithead"><h3 style="font-weight:400;font-size:19px">Three cards</h3><span class="caps">when one card feels thin</span></div>
  <div class="panel"><p class="small">Everyone starts with past / present / future. It's the weakest of the three below, because it asks the cards to predict instead of describe. Try this one instead:</p>
  <div class="spread">
    <div class="slot"><div class="caps">One</div><b style="font-weight:400">Situation</b><p>What's actually going on, stripped of your story about it.</p></div>
    <div class="slot"><div class="caps">Two</div><b style="font-weight:400">Obstacle</b><p>What's in the way. Often the most useful card of the three.</p></div>
    <div class="slot"><div class="caps">Three</div><b style="font-weight:400">Advice</b><p>What to do about it — an action, not an outcome.</p></div>
  </div>
  <p class="small soft">Other pairings worth trying: mind / heart / body, or what I'm holding onto / what it's costing / what to do instead.</p></div>

  <div class="suithead"><h3 style="font-weight:400;font-size:19px">Five cards</h3><span class="caps">for something you're stuck on</span></div>
  <div class="panel"><div class="spread cross"><div class="slot"><div class="caps">Centre</div><p>The situation</p></div>
  <div class="slot"><div class="caps">Left</div><p>What's helping</p></div><div class="slot"><div class="caps">Right</div><p>What's in the way</p></div></div>
  <div class="spread cross"><div class="slot"><div class="caps">Above</div><p>What you're not seeing</p></div><div class="slot"><div class="caps">Below</div><p>Where it's heading if nothing changes</p></div></div>
  <p class="small">Read the centre last, not first. Lay it down, read the four around it, then come back — the middle card usually changes meaning once the others have spoken.</p></div>

  <div class="suithead"><h3 style="font-weight:400;font-size:19px">How cards talk to each other</h3><span class="caps">the accuracy you asked about</span></div>
  <div class="panel"><p class="small">This is where reading gets accurate. Before interpreting a single card, look at the whole spread and ask:</p>
  <div class="sym" style="margin-top:12px">
    <b>Count the suits</b><span>Three Swords in five cards means the whole problem is happening in your head. Mostly Pentacles? It's a practical problem wearing an emotional costume.</span>
    <b>Repeated numbers</b><span>Two fives is the same crack showing up in two areas of your life. Repetition is the deck raising its voice.</span>
    <b>Majors vs Minors</b><span>Mostly Majors: this is bigger than your day-to-day choices. Mostly Minors: it's ordinary, and you can act on it.</span>
    <b>Where figures look</b><span>Two figures facing away from each other read differently than two facing in. Smith drew the gazes deliberately — use them.</span>
    <b>Court cards</b><span>A person involved, or a mode you're operating in. Ask which before you decide it's your colleague.</span>
    <b>The one you dislike</b><span>The card you flinch at is usually the reading. Start there.</span>
  </div></div>`;
}

/* ---------- DECK ---------- */
function deckView(){
  const groups=[["Major Arcana",DECK.filter(c=>c.arc==="major")]].concat(
    SUITORDER.map(s=>[cap(s),DECK.filter(c=>c.suit===s)]));
  let h=`<div class="panel"><div class="bar caps">The deck</div>
   <p class="lead">${Object.keys(S.met).length} of 78 met.</p>
   <p class="small soft" style="margin-top:6px">Cards come into focus once you've drawn or studied them. Tap any card to work through it at your own depth.</p></div>`;
  groups.forEach(g=>{
    h+=`<div class="suithead"><h3 style="font-weight:400;font-size:19px">${g[0]}</h3><span class="caps">${g[1].filter(c=>S.met[c.id]).length}/${g[1].length}</span></div><div class="grid">`;
    g[1].forEach(c=>h+=`<button class="${S.met[c.id]?"met":""}" onclick="openId='${c.id}';depth=1;render()" aria-label="${c.name}" title="${c.name}">${plate(c,"",true)}</button>`);
    h+=`</div>`;});
  h+=`<div class="offline"><div class="caps soft">Offline</div>
    <p class="small" style="margin-top:6px">Thumbnails and all the text work offline already. The full-size card images are 5 MB — download them once and the whole deck works with no connection.</p>
    <div class="bararea" id="dlbar" style="display:none"><i style="width:0"></i></div>
    <div class="row" style="margin-top:11px"><button class="act ghost" id="dlbtn" onclick="cacheAll()">Download all cards</button>
    <span class="small soft" id="dlmsg"></span></div></div>`;
  h+=`<div class="credit"><p>Card images by Pamela Colman Smith, published by Rider &amp; Co, 1909.<br>Public domain — Smith died in 1951, so the original plates are free of copyright worldwide.</p></div>`;
  return h;
}

/* ---------- JOURNAL ---------- */
function journalView(){
  let h=`<div class="panel"><div class="bar caps">Journal</div>`;
  if(!S.entries.length){h+=`<p class="lead">No entries yet.</p><p class="small soft" style="margin-top:7px">Draw a card on the Today tab and work down to the last step. Entries collect here, and re-reading old ones is how you notice a card meaning something different the second time.</p></div>`;
    h+=`<div class="offline"><div class="caps soft">Backup</div>
    <p class="small" style="margin-top:6px">Entries live in this browser only. Clearing site data, or switching phone, loses them. Export now and again.</p>
    <div class="row" style="margin-top:11px"><button class="act ghost" onclick="exportData()">Export journal</button>
    <button class="act ghost" onclick="document.getElementById('imp').click()">Restore from file</button>
    <input type="file" id="imp" accept="application/json" style="display:none" onchange="importData(this)"></div></div>`;
    return h;}
  h+=`<p class="lead">${S.entries.length} ${S.entries.length===1?"entry":"entries"}.</p>
  <p class="small soft" style="margin-top:6px">Read these back monthly. Patterns in what you draw matter less than patterns in what you write.</p></div>`;
  h+=`<div class="offline"><div class="caps soft">Backup</div>
    <p class="small" style="margin-top:6px">Entries live in this browser only. Clearing site data, or switching phone, loses them. Export now and again.</p>
    <div class="row" style="margin-top:11px"><button class="act ghost" onclick="exportData()">Export journal</button>
    <button class="act ghost" onclick="document.getElementById('imp').click()">Restore from file</button>
    <input type="file" id="imp" accept="application/json" style="display:none" onchange="importData(this)"></div></div>`;
  S.entries.forEach((e,i)=>{h+=`<div class="entry"><div class="row" style="justify-content:space-between">
    <span class="caps">${e.name} · ${pretty(e.date)}</span><button class="del" onclick="delEntry(${i})">Delete</button></div>
    ${e.text?`<p>${e.text.replace(/</g,"&lt;")}</p>`:`<p class="soft"><i>No note written.</i></p>`}</div>`;});
  return h;
}
async function cacheAll(){
  const btn=document.getElementById("dlbtn"),bar=document.getElementById("dlbar"),msg=document.getElementById("dlmsg");
  if(!("caches" in window))return toast("This browser can't store cards offline.");
  btn.disabled=true; btn.textContent="Downloading…"; bar.style.display="block";
  const c=await caches.open("almanac-img-v1"); let n=0,failed=0;
  for(const card of DECK){
    const u="img/"+card.id+".webp";
    try{ if(!(await c.match(u))) await c.add(u); }catch(e){ failed++; }
    n++; bar.firstElementChild.style.width=(n/DECK.length*100)+"%";
    msg.textContent=n+" of "+DECK.length;
  }
  btn.textContent=failed?"Retry ("+failed+" missing)":"Downloaded";
  btn.disabled=(failed===0);
  msg.textContent=failed?failed+" cards failed — check your connection.":"The full deck is available offline.";
}
function delEntry(i){S.entries.splice(i,1);save();render();}

/* ---------- render ---------- */
const TABS=[["today","Today"],["grammar","Grammar"],["spreads","Spreads"],["deck","Deck"],["journal","Journal"]];
function render(){
  const met=Object.keys(S.met).length,seg=26,on=Math.round(met/78*seg);
  let h=`<div class="mast"><h1>The Fool's Almanac</h1>
    <div class="caps">Learning the Rider–Waite–Smith deck by looking at it</div>
    <div class="meter" aria-label="${met} of 78 cards met">${Array.from({length:seg},(_,i)=>`<i class="${i<on?"on":""}"></i>`).join("")}</div>
    <div class="caps soft" style="margin-top:7px">${met}/78 met · ${S.entries.length} ${S.entries.length===1?"entry":"entries"}</div></div>`;
  h+=`<div class="tabs">`+TABS.map(t=>`<button class="caps ${view===t[0]&&!openId?"on":""}" onclick="openId=null;view='${t[0]}';render()">${t[1]}</button>`).join("")+`</div>`;
  if(openId)h+=cardView(byId(openId),false);
  else h+={today:todayView,grammar:grammarView,spreads:spreadsView,deck:deckView,journal:journalView}[view]();
  document.getElementById("app").innerHTML=h;
}
load();

