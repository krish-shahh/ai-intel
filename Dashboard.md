```dataviewjs
/* Hallmark · macrostructure: Workbench (rail + reading canvas) · genre: editorial
 * theme: Quiet-editorial (Obsidian vars + system serif display, single accent)
 * pre-emit critique: P5 H5 E4 S4 R5 V4
 */
const C = `
.markdown-preview-view:has(.aii) .markdown-preview-sizer{max-width:100%!important;padding:0 4px!important;}
.aii{--rail:266px;--line:var(--background-modifier-border);--muted:var(--text-muted);
  --accent:var(--interactive-accent);--serif:ui-serif,"Iowan Old Style",Georgia,Cambria,serif;
  display:grid;grid-template-columns:var(--rail) minmax(0,1fr);height:calc(100vh - 132px);
  min-height:540px;border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:var(--background-primary);font-size:14px;line-height:1.55;}
.aii ::-webkit-scrollbar{width:9px;height:9px}
.aii ::-webkit-scrollbar-thumb{background:var(--background-modifier-border);border-radius:6px}
.aii .rail{border-right:1px solid var(--line);background:var(--background-secondary);overflow-y:auto;display:flex;flex-direction:column;}
.aii .rblk{padding:17px 20px;border-bottom:1px solid var(--line);}
.aii .rblk.foot{margin-top:auto;border-bottom:none;}
.aii .logo{font-family:var(--serif);font-size:1.7em;font-weight:600;letter-spacing:-.01em;line-height:1;}
.aii .logo i{color:var(--accent);font-style:normal;}
.aii .tag{font-size:.72em;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-top:8px;}
.aii .lbl{font-size:.68em;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:11px;}
.aii .next{font-family:var(--serif);font-size:1.5em;line-height:1.1;display:flex;align-items:center;gap:10px;}
.aii .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%,transparent);flex:none;}
.aii .cad{color:var(--muted);font-size:.9em;margin-top:7px;}
.aii .stat{display:flex;gap:18px;}
.aii .stat b{font-family:var(--serif);font-size:1.55em;font-weight:600;display:block;line-height:1;}
.aii .stat span{font-size:.68em;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);}
.aii .blist{display:flex;flex-direction:column;gap:1px;}
.aii .brow{display:flex;justify-content:space-between;gap:8px;padding:6px 8px;margin:0 -8px;border-radius:7px;cursor:pointer;}
.aii .brow:hover{background:var(--background-modifier-hover);}
.aii .brow .d{font-variant-numeric:tabular-nums;}
.aii .brow .s{color:var(--muted);font-size:.85em;text-transform:capitalize;}
.aii .how{display:flex;flex-direction:column;gap:9px;color:var(--muted);font-size:.9em;}
.aii .how div{display:flex;gap:9px;}
.aii .main{overflow-y:auto;padding:30px 38px 44px;}
.aii .eyebrow{font-size:.74em;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);font-weight:600;}
.aii .title{font-family:var(--serif);font-size:2.15em;font-weight:600;letter-spacing:-.015em;line-height:1.1;margin:7px 0 3px;}
.aii .meta{color:var(--muted);margin-bottom:20px;}
.aii .body{border-top:1px solid var(--line);padding-top:22px;}
.aii .body>p:first-child{font-size:1.08em;color:var(--text-normal);}
.aii .body h2{font-family:var(--serif);font-weight:600;font-size:1.15em;margin:26px 0 11px;}
.aii .body ul{padding-left:18px;margin:0 0 6px;}
.aii .body li{margin:7px 0;}
.aii .browse{margin-top:34px;border-top:1px solid var(--line);padding-top:20px;}
.aii .chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px;}
.aii .chip{background:var(--background-secondary);border:1px solid var(--line);border-radius:999px;padding:3px 11px;font-size:.86em;cursor:pointer;}
.aii .chip:hover{border-color:var(--accent);}
.aii .chip b{color:var(--muted);font-weight:600;margin-left:6px;}
.aii .empty{color:var(--muted);font-style:italic;padding:48px 0;}
@media(max-width:700px){.aii{grid-template-columns:1fr;height:auto}.aii .rail{border-right:none;border-bottom:1px solid var(--line)}}
`;
const st=document.createElement('style');st.textContent=C;dv.container.appendChild(st);

const briefs=dv.pages('"briefs"').sort(b=>b.date,'desc').array();
const people=dv.pages('"people"').array();
const topics=dv.pages('"topics"').array();
const latest=briefs.length?briefs[0]:null;

const now=new Date();let nx=null;
for(let d=0;d<2&&!nx;d++)for(const h of[8,20]){const c=new Date(now);c.setDate(now.getDate()+d);c.setHours(h,0,0,0);if(c>now){nx=c;break;}}
const nextStr=nx.toLocaleString([],{weekday:'short',hour:'numeric',minute:'2-digit'});

const tally=f=>{const m={};for(const b of briefs)for(const x of(b[f]||[]))m[x]=(m[x]||0)+1;return m;};
const pc=tally('people'),tc=tally('topics');
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):'';
const recent=briefs.slice(0,10).map(b=>`<div class="brow" data-h="${b.file.name}"><span class="d">${b.date?b.date.toFormat('LLL d'):b.file.name}</span><span class="s">${b.session||''}</span></div>`).join('')||'<div class="how">No briefs yet.</div>';

const sortByMentions=(arr,counts)=>[...arr].sort((a,b)=>(counts[b.file.name]||0)-(counts[a.file.name]||0)||a.file.name.localeCompare(b.file.name));
const chips=(arr,counts)=>sortByMentions(arr,counts).map(p=>{const n=p.file.name,c=counts[n]||0;return`<span class="chip" data-h="${n}">${n}${c?`<b>${c}</b>`:''}</span>`;}).join('');

const root=dv.el('div','',{cls:'aii'});
root.innerHTML=`
<aside class="rail">
  <div class="rblk"><div class="logo">ai<i>·</i>intel</div><div class="tag">self-writing AI intel</div></div>
  <div class="rblk"><div class="lbl">Next brief</div><div class="next"><span class="dot"></span>${nextStr}</div><div class="cad">Runs 8:00 AM &amp; 8:00 PM EST</div></div>
  <div class="rblk"><div class="stat"><div><b>${briefs.length}</b><span>briefs</span></div><div><b>${people.length}</b><span>people</span></div><div><b>${topics.length}</b><span>topics</span></div></div></div>
  <div class="rblk"><div class="lbl">Recent briefs</div><div class="blist">${recent}</div></div>
  <div class="rblk foot"><div class="how"><div>👀&nbsp; Read in Reading mode</div><div>🔄&nbsp; Syncs via Obsidian Git</div><div>🔔&nbsp; Alerts via ntfy · ai-intel</div></div></div>
</aside>
<main class="main">${latest?`
  <div class="eyebrow">${latest.date?latest.date.toFormat('cccc, LLLL d'):''} · ${cap(latest.session)}</div>
  <div class="title">${cap(latest.session)} brief</div>
  <div class="meta">${(latest.people||[]).length} people · ${(latest.topics||[]).length} topics covered</div>
  <div class="body" id="aii-body"></div>
  <div class="browse">
    <div class="lbl">People (${people.length})</div><div class="chips">${chips(people,pc)}</div>
    <div class="lbl">Topics (${topics.length})</div><div class="chips">${chips(topics,tc)}</div>
  </div>`:`<div class="empty">No briefs yet — the first one lands ${nextStr}.</div>`}</main>`;

if(latest){
  let txt=await dv.io.load(latest.file.path);
  txt=txt.replace(/^---[\s\S]*?---\s*/,'');
  const bodyEl=root.querySelector('#aii-body');
  try{const {MarkdownRenderer}=require('obsidian');await MarkdownRenderer.render(app,txt,bodyEl,latest.file.path,dv.component);}
  catch(e){bodyEl.innerHTML='<pre style="white-space:pre-wrap">'+txt.replace(/</g,'&lt;')+'</pre>';}
}

const src=latest?latest.file.path:'';
root.querySelectorAll('[data-h]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();app.workspace.openLinkText(a.getAttribute('data-h'),src,false);}));
```
