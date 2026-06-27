// ──────────────────────────────────────────────────────────────
// 버전 관리 — 여기 2줄만 고치면 헤더의 모든 언어에 자동 반영됨.
// (i18n 문자열의 {ver}/{date} 토큰을 setLang 에서 치환)
// ──────────────────────────────────────────────────────────────
const APP_VERSION = '2.1.0';      // 시맨틱 버전 (vMAJOR.MINOR.PATCH)
const APP_UPDATED = '2026-06-27'; // 최신 업데이트 날짜
function fillTokens(s){ return s.replace(/\{ver\}/g, APP_VERSION).replace(/\{date\}/g, APP_UPDATED); }

// ──────────────────────────────────────────────────────────────
// 언어 설정 — 새 언어 추가는 여기 1줄 + STRINGS 에 객체 하나만 추가하면 끝.
// (버튼 생성·전환·html lang 속성이 모두 이 배열에서 자동으로 동작)
// ──────────────────────────────────────────────────────────────
const LANGS = [
  { code:'en', label:'English',  htmlLang:'en'    },
  { code:'ko', label:'한국어',    htmlLang:'ko'    },
  { code:'ja', label:'日本語',    htmlLang:'ja'    },
  { code:'sc', label:'简体中文',  htmlLang:'zh-CN' },
  { code:'tc', label:'繁體中文',  htmlLang:'zh-TW' },
  { code:'th', label:'ไทย',      htmlLang:'th'    },
];
const DEFAULT_LANG = 'en';

let currentLang = DEFAULT_LANG;
function t(key){ return (STRINGS[currentLang]||{})[key] || (STRINGS.en||{})[key] || key; }

function renderLangButtons(){
  const sw = document.getElementById('langSw');
  if(!sw) return;
  sw.innerHTML =
    `<select class="lang-select" id="langSelect" onchange="setLang(this.value)" aria-label="Language / 언어">`
    + LANGS.map(l => `<option value="${l.code}">${l.label}</option>`).join('')
    + `</select>`;
}

let badgeState = 'wait';

function setLang(lang) {
  const cfg = LANGS.find(l => l.code === lang) || LANGS[0];
  currentLang = cfg.code;
  document.documentElement.lang = cfg.htmlLang;
  document.title = t('pageTitle');
  // Update all tagged elements
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = fillTokens(t(el.dataset.i18n)); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = fillTokens(t(el.dataset.i18nHtml)); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  // Language selector state
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = cfg.code;
  // Dynamic elements
  setBadge(badgeState);
  const lb = document.getElementById('logBox');
  if(lb && lb.dataset.initial==='1') lb.innerHTML=`<span style="color:#f8c94f">${t('logInit')}</span>`;
  const al = document.getElementById('analysisLog');
  if(al && al.dataset.initial==='1') al.innerHTML=`<span style="color:#f8c94f">${t('alogInit')}</span>`;
  // Update apiTitle / genPageTitle if product already selected
  if(selectedProduct){
    const name = selectedProduct==='gen'?'Gen NX':'Civil NX';
    document.getElementById('apiTitle').textContent=`🔗 ${name} ${t('step2H2Suffix')}`;
    const gpt=document.getElementById('genPageTitle');
    if(gpt){gpt.textContent=`🚀 ${name} ${t('step7Suffix')}`;}
  }
  // Re-render load cases with current language (full rebuild preserving values)
  if(typeof lcCount!=='undefined'&&lcCount>0){
    const saves=[];
    for(let i=1;i<=lcCount;i++){
      if(!document.getElementById('lc'+i)) continue;
      saves.push({
        name:document.getElementById('lcName'+i)?.value||'LC'+i,
        type:document.getElementById('lcType'+i)?.value||'D',
        tab:document.getElementById('tagSW'+i)?.classList.contains('on')?'sw':'nl',
        swDir:document.getElementById('swDir'+i)?.value||'Z',
        swVal:document.getElementById('swVal'+i)?.value||'-1',
        nlMode:document.getElementById('nlTab1_'+i)?.classList.contains('on')?'all':
               document.getElementById('nlTab2_'+i)?.classList.contains('on')?'bottom':'manual',
        nlNodes:document.getElementById('nlNodes'+i)?.value||'',
        nlFx:document.getElementById('nlFx'+i)?.value||'0',
        nlFy:document.getElementById('nlFy'+i)?.value||'0',
        nlFz:document.getElementById('nlFz'+i)?.value||'-1000',
        nlMx:document.getElementById('nlMx'+i)?.value||'0',
        nlMy:document.getElementById('nlMy'+i)?.value||'0',
        nlMz:document.getElementById('nlMz'+i)?.value||'0',
      });
      document.getElementById('lc'+i).remove();
    }
    lcCount=0;
    saves.forEach(s=>{
      addLC();
      const id=lcCount;
      document.getElementById('lcName'+id).value=s.name;
      document.getElementById('lcType'+id).value=s.type;
      if(typeof setLCTab==='function') setLCTab(id,s.tab);
      document.getElementById('swDir'+id).value=s.swDir;
      document.getElementById('swVal'+id).value=s.swVal;
      if(typeof setNLMode==='function') setNLMode(id,s.nlMode);
      if(s.nlNodes) document.getElementById('nlNodes'+id).value=s.nlNodes;
      document.getElementById('nlFx'+id).value=s.nlFx;
      document.getElementById('nlFy'+id).value=s.nlFy;
      document.getElementById('nlFz'+id).value=s.nlFz;
      document.getElementById('nlMx'+id).value=s.nlMx;
      document.getElementById('nlMy'+id).value=s.nlMy;
      document.getElementById('nlMz'+id).value=s.nlMz;
    });
  }
  // Update boundary condition preview
  if(typeof updateSupPreview==='function') updateSupPreview();
  // Save preference
  try{localStorage.setItem('wizLang',lang);}catch(e){}
}

// ── D-Day countdown (2026 FIFA World Cup FINAL) ──
(function(){
  // 2026-07-19 15:00 ET (EDT, UTC-4) = 2026-07-19 19:00:00 UTC = 2026-07-20 04:00 KST
  const target = new Date('2026-07-19T19:00:00Z');
  function tick(){
    const el=document.getElementById('countdown-val'); if(!el) return;
    const diff=target-Date.now();
    if(diff<=0){ el.textContent=t('cdKickoff'); return; }
    const d=Math.floor(diff/864e5);
    const h=Math.floor((diff%864e5)/36e5);
    const m=Math.floor((diff%36e5)/6e4);
    const s=Math.floor((diff%6e4)/1e3);
    el.textContent=`D-${d}  ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  tick();
  setInterval(tick,1000);
})();

// ──────────────────────────────────────────────────────────────
// Product selection
// ──────────────────────────────────────────────────────────────
let selectedProduct = null;
let apiConnected = false;

// MIDAS API Base URL 기본값 (수정 가능 — 사용자가 입력칸에서 변경 가능)
const MIDAS_BASE_DEFAULT = {
  gen:   'https://moa-engineers.midasit.com:443/gen',
  civil: 'https://moa-engineers.midasit.com:443/civil'
};
function getBaseUrl() {
  const el = document.getElementById('baseUrl');
  const v = (el && el.value || '').trim().replace(/\/$/, '');
  return v || MIDAS_BASE_DEFAULT[selectedProduct] || '';
}

function selectProduct(prod) {
  selectedProduct = prod;
  document.getElementById('prodGen').classList.toggle('selected', prod === 'gen');
  document.getElementById('prodCivil').classList.toggle('selected', prod === 'civil');
  document.getElementById('prodAlert').classList.add('hidden');
}

function confirmProduct() {
  if (!selectedProduct) { showAlert('prodAlert','error',t('selectFirst')); return; }
  const name = selectedProduct === 'gen' ? 'Gen NX' : 'Civil NX';
  document.getElementById('apiTitle').textContent = `🔗 ${name} ${t('step2H2Suffix')}`;
  document.getElementById('genPageTitle').textContent = `🚀 ${name} ${t('step7Suffix')}`; document.getElementById('genPageTitle').dataset.dynamic='1';
  document.getElementById('noticeTitle').textContent = `${name}: ${t('noticeTitle')}`;
  // Base URL 기본값을 선택 제품 기준으로 채움 (이미 직접 수정한 값이 있으면 유지)
  const baseEl = document.getElementById('baseUrl');
  if (baseEl && (!baseEl.value.trim() || Object.values(MIDAS_BASE_DEFAULT).includes(baseEl.value.trim()))) {
    baseEl.value = MIDAS_BASE_DEFAULT[selectedProduct];
  }
  goTo(2);
}

// ──────────────────────────────────────────────────────────────
// Geometry calculation
// ──────────────────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;

function soccerVerts(radius, cx, cy, cz) {
  const raw = [];
  for (const s1 of [1,-1]) for (const s2 of [1,-1]) {
    raw.push([0,s1,s2*3*PHI],[s1,s2*3*PHI,0],[s2*3*PHI,0,s1]);
  }
  for (const s1 of [1,-1]) for (const s2 of [1,-1]) for (const s3 of [1,-1]) {
    raw.push([s1,s2*(2+PHI),s3*2*PHI],[s2*(2+PHI),s3*2*PHI,s1],[s3*2*PHI,s1,s2*(2+PHI)]);
    raw.push([s1*2,s2*(1+2*PHI),s3*PHI],[s2*(1+2*PHI),s3*PHI,s1*2],[s3*PHI,s1*2,s2*(1+2*PHI)]);
  }
  return raw.map(v => {
    const len = Math.sqrt(v[0]**2+v[1]**2+v[2]**2);
    return [v[0]/len*radius+cx, v[1]/len*radius+cy, v[2]/len*radius+cz];
  });
}

function soccerEdges(verts, tol=0.05) {
  const n = verts.length; let minD = Infinity;
  for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) { const d=dist3(verts[i],verts[j]); if(d<minD)minD=d; }
  const edges=[];
  for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) if(dist3(verts[i],verts[j])<minD*(1+tol)) edges.push([i,j]);
  return edges;
}

function dist3(a,b){ return Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2); }

function bottomNodeIndices(verts, tol=0.05) {
  const minZ = Math.min(...verts.map(v=>v[2]));
  const range = (+document.getElementById('radius').value || 5000) * tol;
  return verts.map((v,i)=>v[2]<=minZ+range?i:-1).filter(i=>i>=0);
}

// ──────────────────────────────────────────────────────────────
// Backend URL — 프론트/백엔드가 같은 Vercel 프로젝트이므로 상대경로 사용
// (도메인 이름이 바뀌어도 영향 없음, CORS 불필요)
// ──────────────────────────────────────────────────────────────
const BACKEND_URL = '';

// ──────────────────────────────────────────────────────────────
// STEP 2: Connection test (via backend)
// ──────────────────────────────────────────────────────────────
async function testConn() {
  const key = document.getElementById('mapiKey').value.trim();
  if (!key) { showAlert('connAlert','error',t('enterBothAlert')); return; }
  showAlert('connAlert','info',t('testingConn'));
  try {
    const r = await fetch(`${BACKEND_URL}/api/connect`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ product: selectedProduct, apiKey: key, baseUrl: getBaseUrl() })
    });
    const data = await r.json();
    if (data.ok) { apiConnected=true; showAlert('connAlert','success',t('connSuccess')); setTimeout(()=>goTo(3),800); }
    else {
      const prog = data.program === 'civil' ? 'Civil NX' : 'Gen NX';
      let msg;
      if (data.code === 'disconnected') msg = t('connDisconnected').replace('{prog}', prog);
      else if (data.code === 'mismatch') msg = t('connMismatch').replace('{key}', prog).replace('{sel}', selectedProduct === 'civil' ? 'Civil NX' : 'Gen NX');
      else msg = t('connFail').replace('{status}', data.error || `HTTP ${data.httpStatus||'?'}${data.status?` (${data.status})`:''}`);
      showAlert('connAlert','error', msg);
    }
  } catch(e) { showAlert('connAlert','error',t('connError').replace('{msg}',e.message)); }
}

function showAlert(id,type,msg) {
  const el=document.getElementById(id);
  el.className=`alert alert-${type}`; el.textContent=msg; el.classList.remove('hidden');
}

// ──────────────────────────────────────────────────────────────
// STEP 4: Boundary conditions
// ──────────────────────────────────────────────────────────────
let nodeMode='auto', supType='fix';

function setNodeMode(m) {
  nodeMode=m;
  document.getElementById('nodeTab1').className='node-tab'+(m==='auto'?' on':'');
  document.getElementById('nodeTab2').className='node-tab'+(m==='manual'?' on':'');
  document.getElementById('nodeAutoInfo').classList.toggle('hidden', m!=='auto');
  document.getElementById('nodeManualInput').classList.toggle('hidden', m!=='manual');
  updateSupPreview();
}

function setSup(t) {
  supType=t;
  ['Fix','Pin','RolZ','Cust'].forEach(k=>document.getElementById('sup'+k).classList.remove('selected'));
  document.getElementById('sup'+{fix:'Fix',pin:'Pin',rolz:'RolZ',custom:'Cust'}[t]).classList.add('selected');
  document.getElementById('dofPanel').classList.toggle('hidden', t!=='custom');
  if(t==='fix')  setDOF(true,true,true,true,true,true);
  if(t==='pin')  setDOF(true,true,true,false,false,false);
  if(t==='rolz') setDOF(false,false,true,false,false,false);
  updateSupPreview();
}

function setDOF(dx,dy,dz,rx,ry,rz) {
  ['dDx','dDy','dDz','dRx','dRy','dRz'].forEach((id,i)=>document.getElementById(id).checked=[dx,dy,dz,rx,ry,rz][i]);
}

function getDOFString() {
  return ['dDx','dDy','dDz','dRx','dRy','dRz'].map(id=>document.getElementById(id).checked?'1':'0').join('')+'0';
}

function getConstraint() {
  if(supType==='fix') return '1111110';
  if(supType==='pin') return '1110000';
  if(supType==='rolz') return '0010000';
  return getDOFString();
}

function getConstraintLabel() {
  if(supType==='fix') return t('supFixLabel');
  if(supType==='pin') return t('supPinLabel');
  if(supType==='rolz') return t('supRolLabel');
  const s=getDOFString();
  return t('supCustLabel')+['Dx','Dy','Dz','Rx','Ry','Rz'].filter((_,i)=>s[i]==='1').join(', ');
}

function updateSupPreview() {
  document.getElementById('supPreview').innerHTML =
    `${t('sumSupLabel')}${getConstraintLabel()}<br>`+
    `${t('sumNodeLabel')} ${nodeMode==='auto'?t('sumNodeAuto'):t('sumNodeManual')+document.getElementById('manualNodes').value}`;
}

document.addEventListener('change', e=>{ if(e.target.closest('#dofPanel')) updateSupPreview(); });
document.getElementById('manualNodes')?.addEventListener('input', updateSupPreview);
setSup('fix');

// ──────────────────────────────────────────────────────────────
// STEP 5: Load cases
// ──────────────────────────────────────────────────────────────
let lcCount=0;

function addLC() {
  lcCount++;
  const id=lcCount;
  const div=document.createElement('div');
  div.className='lc-row'; div.id=`lc${id}`;
  div.innerHTML=`
    <div class="lc-header">
      <span class="lc-badge">${t('lcBadgeLabel')} #${id}</span>
      <button class="btn btn-danger" onclick="removeLC(${id})">${t('deleteBtn')}</button>
    </div>
    <div class="form-grid">
      <div class="form-group">${t('lblLCName')}<input id="lcName${id}" type="text" value="LC${id}"></div>
      <div class="form-group">${t('lblLCType')}
        <select id="lcType${id}">
          <option value="USER">${t('lcOptUser')}</option>
          <option value="D" selected>${t('lcOptD')}</option>
          <option value="L">${t('lcOptL')}</option>
          <option value="W">${t('lcOptW')}</option>
          <option value="E">${t('lcOptE')}</option>
        </select>
      </div>
    </div>
    <div style="margin:12px 0 8px;font-size:.8rem;font-weight:600;color:#555">${t('lcLoadKind')}</div>
    <div class="tag-toggle">
      <div class="tag on" id="tagSW${id}" onclick="setLCTab(${id},'sw')">${t('tagSW')}</div>
      <div class="tag"   id="tagNL${id}" onclick="setLCTab(${id},'nl')">${t('tagNL')}</div>
    </div>
    <div id="swPanel${id}" style="margin-top:12px">
      <div class="form-grid">
        <div class="form-group">${t('lblDirection')}
          <select id="swDir${id}"><option value="Z" selected>${t('swDirZ')}</option><option value="X">-X</option><option value="Y">-Y</option></select>
        </div>
        <div class="form-group">${t('lblScale')}<input id="swVal${id}" type="number" value="-1" step="0.1"></div>
      </div>
    </div>
    <div id="nlPanel${id}" class="hidden" style="margin-top:12px">
      <div style="margin-bottom:8px">
        <div class="node-mode-tabs">
          <div class="node-tab on" id="nlTab1_${id}" onclick="setNLMode(${id},'all')">${t('nlAll')}</div>
          <div class="node-tab"   id="nlTab2_${id}" onclick="setNLMode(${id},'bottom')">${t('nlBottom')}</div>
          <div class="node-tab"   id="nlTab3_${id}" onclick="setNLMode(${id},'manual')">${t('nlManual')}</div>
        </div>
        <div id="nlManualWrap${id}" class="hidden" style="margin-top:6px">
          ${t('lblNLNodes')}
          <input id="nlNodes${id}" type="text" placeholder="1, 5, 9">
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Fx (N)</label><input id="nlFx${id}" type="number" value="0"></div>
        <div class="form-group"><label>Fy (N)</label><input id="nlFy${id}" type="number" value="0"></div>
        <div class="form-group"><label>Fz (N)</label><input id="nlFz${id}" type="number" value="-1000"></div>
        <div class="form-group"><label>Mx (N·mm)</label><input id="nlMx${id}" type="number" value="0"></div>
        <div class="form-group"><label>My (N·mm)</label><input id="nlMy${id}" type="number" value="0"></div>
        <div class="form-group"><label>Mz (N·mm)</label><input id="nlMz${id}" type="number" value="0"></div>
      </div>
    </div>`;
  document.getElementById('lcList').appendChild(div);
}

function removeLC(id){ document.getElementById(`lc${id}`)?.remove(); }

function setLCTab(id,tab) {
  document.getElementById(`tagSW${id}`).className='tag'+(tab==='sw'?' on':'');
  document.getElementById(`tagNL${id}`).className='tag'+(tab==='nl'?' on':'');
  document.getElementById(`swPanel${id}`).classList.toggle('hidden', tab!=='sw');
  document.getElementById(`nlPanel${id}`).classList.toggle('hidden', tab!=='nl');
}

function setNLMode(id,mode) {
  [`nlTab1_${id}`,`nlTab2_${id}`,`nlTab3_${id}`].forEach((tid,i)=>{
    document.getElementById(tid).className='node-tab'+(['all','bottom','manual'][i]===mode?' on':'');
  });
  document.getElementById(`nlManualWrap${id}`).classList.toggle('hidden', mode!=='manual');
}

// addLC() is called in the language-init IIFE so it runs after the correct language is set

// ──────────────────────────────────────────────────────────────
// STEP 6: 3D preview
// ──────────────────────────────────────────────────────────────
function renderPlot() {
  const radius=+v('radius'),cx=+v('cx'),cy=+v('cy'),cz=+v('cz');
  document.getElementById('radiusLabel').textContent=radius.toLocaleString();
  const verts=soccerVerts(radius,cx,cy,cz), edges=soccerEdges(verts);
  const ex=[],ey=[],ez=[];
  edges.forEach(([i,j])=>{ ex.push(verts[i][0],verts[j][0],null); ey.push(verts[i][1],verts[j][1],null); ez.push(verts[i][2],verts[j][2],null); });
  const traces=[
    {type:'scatter3d',x:ex,y:ey,z:ez,mode:'lines',line:{color:'#e07000',width:3},name:t('traceName3dEdge')},
    {type:'scatter3d',x:verts.map(v=>v[0]),y:verts.map(v=>v[1]),z:verts.map(v=>v[2]),mode:'markers',marker:{size:4,color:'#4361ee'},name:t('traceName3dNode')}
  ];
  const supIdx=getSupportNodeIndices(verts);
  if(supIdx.length>0) traces.push({type:'scatter3d',x:supIdx.map(i=>verts[i][0]),y:supIdx.map(i=>verts[i][1]),z:supIdx.map(i=>verts[i][2]),mode:'markers',marker:{size:8,color:'#ff6b6b',symbol:'diamond'},name:t('traceSup').replace('{n}',supIdx.length)});
  const nlNodes=getAllNodalLoadNodes(verts);
  if(nlNodes.length>0) traces.push({type:'scatter3d',x:nlNodes.map(i=>verts[i][0]),y:nlNodes.map(i=>verts[i][1]),z:nlNodes.map(i=>verts[i][2]),mode:'markers',marker:{size:8,color:'#2ec4b6',symbol:'square'},name:t('traceLoad').replace('{n}',nlNodes.length)});
  Plotly.newPlot('plot',traces,{scene:{xaxis:{title:'X'},yaxis:{title:'Y'},zaxis:{title:'Z'},aspectmode:'data'},margin:{l:0,r:0,t:10,b:0},legend:{x:0,y:1},paper_bgcolor:'#fafafa'},{responsive:true});
}

function getSupportNodeIndices(verts) {
  if(nodeMode==='auto') return bottomNodeIndices(verts);
  return document.getElementById('manualNodes').value.split(',').map(s=>parseInt(s.trim())-1).filter(i=>i>=0&&i<verts.length);
}

function getAllNodalLoadNodes(verts) {
  const set=new Set();
  for(let id=1;id<=lcCount;id++) {
    const el=document.getElementById(`lc${id}`); if(!el) continue;
    if(!document.getElementById(`tagNL${id}`)?.classList.contains('on')) continue;
    const m=document.getElementById(`nlTab1_${id}`).classList.contains('on')?'all':document.getElementById(`nlTab2_${id}`).classList.contains('on')?'bottom':'manual';
    if(m==='all') verts.forEach((_,i)=>set.add(i));
    else if(m==='bottom') bottomNodeIndices(verts).forEach(i=>set.add(i));
    else (document.getElementById(`nlNodes${id}`).value||'').split(',').map(s=>parseInt(s.trim())-1).filter(i=>i>=0&&i<verts.length).forEach(i=>set.add(i));
  }
  return [...set];
}

// ──────────────────────────────────────────────────────────────
// STEP 7 : Model Generation
// ──────────────────────────────────────────────────────────────
function v(id){ return document.getElementById(id)?.value||''; }
const logBox=()=>document.getElementById('logBox');
function log(msg,type='ok'){
  const d=document.createElement('div');
  d.style.color=type==='ok'?'#2ec4b6':type==='err'?'#ff6b6b':'#f8c94f';
  d.textContent=(type==='ok'?'✅ ':type==='err'?'❌ ':'⏳ ')+msg;
  logBox().appendChild(d); logBox().scrollTop=logBox().scrollHeight;
}
function setProgress(pct,label){
  document.getElementById('progressWrap').classList.remove('hidden');
  document.getElementById('progressBar').style.width=pct+'%';
  document.getElementById('progressLabel').textContent=label;
}

async function generate() {
  const btn=document.getElementById('genBtn'); btn.disabled=true;
  document.getElementById('toAnalBtn').disabled=true;
  const lb2=logBox(); lb2.innerHTML=''; delete lb2.dataset.initial; document.getElementById('fitNotice').classList.add('hidden');
  setProgress(10,t('logInit5'));

  // Collect load cases from UI
  const loadCases=[];
  for(let id=1;id<=lcCount;id++) {
    if(!document.getElementById(`lc${id}`)) continue;
    const isSW=document.getElementById(`tagSW${id}`)?.classList.contains('on');
    const nlMode=document.getElementById(`nlTab1_${id}`)?.classList.contains('on')?'all':
                 document.getElementById(`nlTab2_${id}`)?.classList.contains('on')?'bottom':'manual';
    loadCases.push({
      name:v(`lcName${id}`)||`LC${id}`, type:v(`lcType${id}`)||'D', isSW,
      swDir:v(`swDir${id}`)||'Z', swVal:parseFloat(v(`swVal${id}`)||'-1'),
      nlMode, nlNodes:v(`nlNodes${id}`)||'',
      nlFx:+v(`nlFx${id}`),nlFy:+v(`nlFy${id}`),nlFz:+v(`nlFz${id}`),
      nlMx:+v(`nlMx${id}`),nlMy:+v(`nlMy${id}`),nlMz:+v(`nlMz${id}`)
    });
  }

  try {
    const r=await fetch(`${BACKEND_URL}/api/generate`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        product:selectedProduct,
        apiKey:document.getElementById('mapiKey').value,
        baseUrl:getBaseUrl(),
        params:{
          radius:+v('radius'),cx:+v('cx'),cy:+v('cy'),cz:+v('cz'),
          matName:v('matName'),elast:+v('elast'),poisn:+v('poisn'),den:+v('den'),
          sectName:v('sectName'),sectH:+v('sectH'),sectB:+v('sectB'),
          clearModel:document.getElementById('clearModel').checked,
          nodeMode, manualNodes:document.getElementById('manualNodes').value,
          constraint:getConstraint(),
          loadCases
        }
      })
    });
    const data=await r.json();
    if(data.logs) data.logs.forEach(({msg,type})=>log(msg,type||'ok'));
    setProgress(100,t('logDone'));
    if(data.ok) {
      document.getElementById('fitNotice').classList.remove('hidden');
      document.getElementById('toAnalBtn').disabled=false;
    }
  } catch(e) { log(t('logError').replace('{msg}',e.message),'err');
  }
  btn.disabled=false;
}

// ──────────────────────────────────────────────────────────────
// STEP 8: Analysis & Results
// ──────────────────────────────────────────────────────────────
let analysisData = { react:null, disp:null, force:null, stress:null };
let resultLCList = [];
let currentResultTab = 'react';

function alog(msg, type='ok') {
  const el=document.getElementById('analysisLog');
  const d=document.createElement('div');
  d.style.color=type==='ok'?'#2ec4b6':type==='err'?'#ff6b6b':'#f8c94f';
  d.textContent=(type==='ok'?'✅ ':type==='err'?'❌ ':'⏳ ')+msg;
  el.appendChild(d); el.scrollTop=el.scrollHeight;
}

function setBadge(state) {
  badgeState=state;
  const el=document.getElementById('analysisBadge');
  const map={wait:['badge-wait',t('badgeWait')],run:['badge-run',t('badgeRun')],done:['badge-done',t('badgeDone')],err:['badge-err',t('badgeErr')]};
  el.className='analysis-badge '+map[state][0];
  el.textContent=map[state][1];
}

function getActiveLCNames() {
  const list=[];
  for(let id=1;id<=lcCount;id++) {
    if(!document.getElementById(`lc${id}`)) continue;
    const nm=v(`lcName${id}`)||`LC${id}`;
    list.push(nm+'(ST)');
  }
  return list.length>0?list:['LC1(ST)'];
}

async function runAnalysis() {
  const btn=document.getElementById('runAnalBtn');
  btn.disabled=true;
  const al2=document.getElementById('analysisLog'); al2.innerHTML=''; delete al2.dataset.initial;
  document.getElementById('resultCard').classList.add('hidden');
  setBadge('run');
  alog(t('alogRunning'),'info');

  try {
    const lcNames=getActiveLCNames();
    const r=await fetch(`${BACKEND_URL}/api/analyze`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        product:selectedProduct,
        apiKey:document.getElementById('mapiKey').value,
        baseUrl:getBaseUrl(),
        lcNames
      })
    });
    const data=await r.json();
    if(data.logs) data.logs.forEach(({msg,type})=>alog(msg,type||'ok'));

    if(data.ok) {
      analysisData={react:data.react,disp:data.disp,force:data.force,stress:data.stress};
      resultLCList=data.lcNames;
      buildLCSelector(data.lcNames);
      showResultTab('react');
      document.getElementById('resultCard').classList.remove('hidden');
      setBadge('done');
    } else {
      setBadge('err');
    }
  } catch(e) {
    setBadge('err');
    alog(t('alogError').replace('{msg}',e.message),'err');
  }
  btn.disabled=false;
}

function buildLCSelector(lcNames) {
  const sel=document.getElementById('resultLC');
  sel.innerHTML='';
  lcNames.forEach(nm=>{ const opt=document.createElement('option'); opt.value=nm; opt.textContent=nm; sel.appendChild(opt); });
}

const ALL_TABS = ['react','disp','member','shear','moment','torsion','stress'];

function showResultTab(tab) {
  currentResultTab=tab;
  ALL_TABS.forEach(t=>{
    document.getElementById(`rtab-${t}`).classList.toggle('on', t===tab);
    document.getElementById(`panel-${t}`).classList.toggle('hidden', t!==tab);
  });
  refreshResultDisplay();
}

function refreshResultDisplay() {
  const lc=document.getElementById('resultLC').value;
  if(currentResultTab==='react')   renderReact(lc);
  else if(currentResultTab==='disp')    renderDisp(lc);
  else if(currentResultTab==='member')  renderMember(lc);
  else if(currentResultTab==='shear')   renderShear(lc);
  else if(currentResultTab==='moment')  renderMoment(lc);
  else if(currentResultTab==='torsion') renderTorsion(lc);
  else if(currentResultTab==='stress')  renderStress(lc);
}

// ── Number format ──
function fmt(v){ if(v===null||v===undefined||v==='') return '-'; const n=parseFloat(v); if(isNaN(n)) return v; return n.toFixed(3); }
function fmtClass(v){ const n=parseFloat(v); if(isNaN(n)) return ''; return n>0?'hi-pos':n<0?'hi-neg':''; }
function colIdx(head,name){ return head.findIndex(h=>h.toLowerCase().includes(name.toLowerCase())); }

// ── Reactions ──
function renderReact(lc) {
  const d=analysisData.react; if(!d) return;
  const rows=d.data.filter(r=>String(r[1])===lc||String(r[colIdx(d.head,'load')])===lc);
  const hiReact=rows.length===0?d.data:rows;

  const fxi=colIdx(d.head,'FX'), fyi=colIdx(d.head,'FY'), fzi=colIdx(d.head,'FZ');
  const mxi=colIdx(d.head,'MX'), myi=colIdx(d.head,'MY'), mzi=colIdx(d.head,'MZ');
  const ni=0;

  const fzVals=hiReact.map(r=>parseFloat(r[fzi])||0);
  const sumFz=fzVals.reduce((a,b)=>a+b,0);
  const maxFz=Math.max(...fzVals.map(Math.abs));
  const maxFxy=Math.max(...hiReact.map(r=>Math.sqrt((parseFloat(r[fxi])||0)**2+(parseFloat(r[fyi])||0)**2)));

  document.getElementById('statReact').innerHTML=`
    <div class="stat-card"><div class="stat-val">${fmt(sumFz)}</div><div class="stat-lbl">ΣFz (N)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxFz)}</div><div class="stat-lbl">Max |Fz| (N)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxFxy)}</div><div class="stat-lbl">Max |Fxy| (N)</div></div>
    <div class="stat-card"><div class="stat-val">${hiReact.length}</div><div class="stat-lbl">Support node count</div></div>`;

  const nodes=hiReact.map(r=>r[ni]), fzs=hiReact.map(r=>parseFloat(r[fzi])||0);
  Plotly.newPlot('chart-react',[{type:'bar',x:nodes.map(String),y:fzs,marker:{color:fzs.map(v=>v>=0?'#4361ee':'#ff6b6b')},name:'Fz (N)'}],
    {title:{text:t('chartReact'),font:{size:13}},xaxis:{title:t('xaxisNode'),type:'category'},yaxis:{title:'Fz (N)'},margin:{t:40,b:50,l:70,r:20},height:300,paper_bgcolor:'#fafafa',plot_bgcolor:'#fafafa'},{responsive:true});

  renderTable('table-react', d.head, hiReact, [fxi,fyi,fzi,mxi,myi,mzi]);
}

// ── Displacements ──
function renderDisp(lc) {
  const d=analysisData.disp; if(!d) return;
  const rows=d.data.filter(r=>String(r[1])===lc||String(r[colIdx(d.head,'load')])===lc);
  const use=rows.length===0?d.data:rows;

  const dxi=colIdx(d.head,'DX'), dyi=colIdx(d.head,'DY'), dzi=colIdx(d.head,'DZ');
  const dxs=use.map(r=>parseFloat(r[dxi])||0), dys=use.map(r=>parseFloat(r[dyi])||0), dzs=use.map(r=>parseFloat(r[dzi])||0);
  const maxDz=Math.max(...dzs.map(Math.abs)), minDz=Math.min(...dzs), maxDxy=Math.max(...use.map((_,i)=>Math.sqrt(dxs[i]**2+dys[i]**2)));
  const maxD=Math.max(...use.map((_,i)=>Math.sqrt(dxs[i]**2+dys[i]**2+dzs[i]**2)));

  document.getElementById('statDisp').innerHTML=`
    <div class="stat-card"><div class="stat-val">${fmt(minDz)}</div><div class="stat-lbl">Min Dz (mm)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxDz)}</div><div class="stat-lbl">Max |Dz| (mm)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxDxy)}</div><div class="stat-lbl">Max |Dxy| (mm)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxD)}</div><div class="stat-lbl">Max resultant displacement (mm)</div></div>`;

  const nodes=use.map(r=>r[0]);
  const sorted=[...dzs.map((dz,i)=>({i,dz,node:nodes[i]}))].sort((a,b)=>a.dz-b.dz).slice(0,20);
  Plotly.newPlot('chart-disp',
    [{type:'bar',x:sorted.map(s=>String(s.node)),y:sorted.map(s=>s.dz),marker:{color:sorted.map(s=>s.dz>=0?'#4361ee':'#ff6b6b')},name:'Dz (mm)'}],
    {title:{text:t('chartDisp'),font:{size:13}},xaxis:{title:t('xaxisNode'),type:'category'},yaxis:{title:'Dz (mm)'},margin:{t:40,b:50,l:70,r:20},height:300,paper_bgcolor:'#fafafa',plot_bgcolor:'#fafafa'},{responsive:true});

  renderTable('table-disp', d.head, use, [dxi,dyi,dzi,colIdx(d.head,'RX'),colIdx(d.head,'RY'),colIdx(d.head,'RZ')]);
}

// ── Common: BEAMFORCE data — load case filter + column index ──
function getForceRows(lc) {
  const d=analysisData.force; if(!d) return null;
  const rows=d.data.filter(r=>String(r[2])===lc||String(r[colIdx(d.head,'load')])===lc);
  const all=rows.length===0?d.data:rows;
  const parti=colIdx(d.head,'Part');
  const partI=all.filter(r=>String(r[parti]||'').toLowerCase().includes('parti')||String(r[parti]||'')===('I'));
  const use=partI.length>0?partI:all;
  return {d, all, use,
    exi:  colIdx(d.head,'Elem')<0?0:colIdx(d.head,'Elem'),
    axli: d.head.findIndex(h=>h.toLowerCase().includes('axial')||h.toLowerCase()==='fx'),
    shyi: d.head.findIndex(h=>h.toLowerCase().includes('shear-y')||h.toLowerCase()==='fy'),
    shzi: d.head.findIndex(h=>h.toLowerCase().includes('shear-z')||h.toLowerCase()==='fz'),
    mxi:  d.head.findIndex(h=>h.toLowerCase().includes('torsion')||h.toLowerCase()==='mx'),
    myii: d.head.findIndex(h=>h.toLowerCase().includes('moment-y')||h.toLowerCase()==='my'),
    mzii: d.head.findIndex(h=>h.toLowerCase().includes('moment-z')||h.toLowerCase()==='mz')
  };
}

// ── Internal Force (Axial Force Fx) ──
function renderMember(lc) {
  const f=getForceRows(lc); if(!f) return;
  const {d,all,use,exi,axli,shyi,shzi}=f;
  const maxAxl=Math.max(...use.map(r=>Math.abs(parseFloat(r[axli])||0)));
  const minAxl=Math.min(...use.map(r=>parseFloat(r[axli])||0));
  const maxAxlV=Math.max(...use.map(r=>parseFloat(r[axli])||0));
  const n=use.length;
  document.getElementById('statMember').innerHTML=`
    <div class="stat-card"><div class="stat-val">${fmt(maxAxlV)}</div><div class="stat-lbl">Max Fx (N)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(minAxl)}</div><div class="stat-lbl">Min Fx (N)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxAxl)}</div><div class="stat-lbl">Max |Fx| (N)</div></div>
    <div class="stat-card"><div class="stat-val">${n}</div><div class="stat-lbl">Member count</div></div>`;
  const top20=[...use].sort((a,b)=>Math.abs(parseFloat(b[axli])||0)-Math.abs(parseFloat(a[axli])||0)).slice(0,20);
  const elems=top20.map(r=>String(r[exi])), fxs=top20.map(r=>parseFloat(r[axli])||0);
  Plotly.newPlot('chart-member',[{type:'bar',x:elems,y:fxs,marker:{color:fxs.map(v=>v>=0?'#4361ee':'#ff6b6b')},name:'Fx (N)'}],
    {title:{text:t('chartAxial'),font:{size:13}},xaxis:{title:t('xaxisElem'),type:'category'},yaxis:{title:'Fx (N)'},margin:{t:40,b:50,l:80,r:20},height:300,paper_bgcolor:'#fafafa',plot_bgcolor:'#fafafa'},{responsive:true});
  renderTable('table-member', d.head, all, [axli,shyi,shzi].filter(i=>i>=0));
}

// ── Shear Force ──
function renderShear(lc) {
  const f=getForceRows(lc); if(!f) return;
  const {d,all,use,exi,shyi,shzi}=f;
  const maxFy=Math.max(...use.map(r=>Math.abs(parseFloat(r[shyi])||0)));
  const maxFz=Math.max(...use.map(r=>Math.abs(parseFloat(r[shzi])||0)));
  const maxSh=Math.max(maxFy,maxFz);
  document.getElementById('statShear').innerHTML=`
    <div class="stat-card"><div class="stat-val">${fmt(maxFy)}</div><div class="stat-lbl">Max |Fy| (N)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxFz)}</div><div class="stat-lbl">Max |Fz| (N)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxSh)}</div><div class="stat-lbl">Max shear resultant (N)</div></div>
    <div class="stat-card"><div class="stat-val">${use.length}</div><div class="stat-lbl">Member count</div></div>`;
  const top20=[...use].sort((a,b)=>Math.abs(parseFloat(b[shyi])||0)-Math.abs(parseFloat(a[shyi])||0)).slice(0,20);
  const elems=top20.map(r=>String(r[exi]));
  Plotly.newPlot('chart-shear',[
    {type:'bar',name:'Fy (N)',x:elems,y:top20.map(r=>parseFloat(r[shyi])||0),marker:{color:'#2ec4b6'}},
    {type:'bar',name:'Fz (N)',x:elems,y:top20.map(r=>parseFloat(r[shzi])||0),marker:{color:'#ff6b6b'}}
  ],{title:{text:t('chartShear'),font:{size:13}},xaxis:{title:t('xaxisElem'),type:'category'},yaxis:{title:t('yaxisShear')},barmode:'group',margin:{t:40,b:50,l:80,r:20},height:300,paper_bgcolor:'#fafafa',plot_bgcolor:'#fafafa',legend:{x:0,y:1}},{responsive:true});
  renderTable('table-shear', d.head, all, [shyi,shzi].filter(i=>i>=0));
}

// ── Bending Moment ──
function renderMoment(lc) {
  const f=getForceRows(lc); if(!f) return;
  const {d,all,use,exi,myii,mzii}=f;
  const maxMy=Math.max(...use.map(r=>Math.abs(parseFloat(r[myii])||0)));
  const maxMz=Math.max(...use.map(r=>Math.abs(parseFloat(r[mzii])||0)));
  document.getElementById('statMoment').innerHTML=`
    <div class="stat-card"><div class="stat-val">${fmt(maxMy)}</div><div class="stat-lbl">Max |My| (N·mm)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxMz)}</div><div class="stat-lbl">Max |Mz| (N·mm)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(Math.max(maxMy,maxMz))}</div><div class="stat-lbl">Max |M| (N·mm)</div></div>
    <div class="stat-card"><div class="stat-val">${use.length}</div><div class="stat-lbl">Member count</div></div>`;
  const top20=[...use].sort((a,b)=>Math.abs(parseFloat(b[mzii])||0)-Math.abs(parseFloat(a[mzii])||0)).slice(0,20);
  const elems=top20.map(r=>String(r[exi]));
  Plotly.newPlot('chart-moment',[
    {type:'bar',name:'My (N·mm)',x:elems,y:top20.map(r=>parseFloat(r[myii])||0),marker:{color:'#7c3aed'}},
    {type:'bar',name:'Mz (N·mm)',x:elems,y:top20.map(r=>parseFloat(r[mzii])||0),marker:{color:'#4361ee'}}
  ],{title:{text:t('chartMoment'),font:{size:13}},xaxis:{title:t('xaxisElem'),type:'category'},yaxis:{title:t('yaxisMoment')},barmode:'group',margin:{t:40,b:50,l:80,r:20},height:300,paper_bgcolor:'#fafafa',plot_bgcolor:'#fafafa',legend:{x:0,y:1}},{responsive:true});
  renderTable('table-moment', d.head, all, [myii,mzii].filter(i=>i>=0));
}

// ── Torsion ──
function renderTorsion(lc) {
  const f=getForceRows(lc); if(!f) return;
  const {d,all,use,exi,mxi}=f;
  if(mxi<0){ document.getElementById('statTorsion').innerHTML='<div class="stat-card" style="grid-column:1/-1"><div class="stat-lbl">No torsion data (Mx)</div></div>'; return; }
  const maxMx=Math.max(...use.map(r=>Math.abs(parseFloat(r[mxi])||0)));
  const minMx=Math.min(...use.map(r=>parseFloat(r[mxi])||0));
  const maxMxV=Math.max(...use.map(r=>parseFloat(r[mxi])||0));
  document.getElementById('statTorsion').innerHTML=`
    <div class="stat-card"><div class="stat-val">${fmt(maxMxV)}</div><div class="stat-lbl">Max Mx (N·mm)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(minMx)}</div><div class="stat-lbl">Min Mx (N·mm)</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(maxMx)}</div><div class="stat-lbl">Max |Mx| (N·mm)</div></div>
    <div class="stat-card"><div class="stat-val">${use.length}</div><div class="stat-lbl">Member count</div></div>`;
  const top20=[...use].sort((a,b)=>Math.abs(parseFloat(b[mxi])||0)-Math.abs(parseFloat(a[mxi])||0)).slice(0,20);
  const elems=top20.map(r=>String(r[exi])), mxs=top20.map(r=>parseFloat(r[mxi])||0);
  Plotly.newPlot('chart-torsion',[{type:'bar',x:elems,y:mxs,marker:{color:mxs.map(v=>v>=0?'#f59e0b':'#ef4444')},name:'Mx (N·mm)'}],
    {title:{text:t('chartTorsion'),font:{size:13}},xaxis:{title:t('xaxisElem'),type:'category'},yaxis:{title:'Mx (N·mm)'},margin:{t:40,b:50,l:80,r:20},height:300,paper_bgcolor:'#fafafa',plot_bgcolor:'#fafafa'},{responsive:true});
  renderTable('table-torsion', d.head, all, [mxi]);
}

// ── Stress Ratio / DCR ──
function renderStress(lc) {
  const d=analysisData.stress;
  if(!d) {
    document.getElementById('statStress').innerHTML='<div class="stat-card" style="grid-column:1/-1"><div class="stat-lbl">No stress ratio data (design check not run or not supported)</div></div>';
    document.getElementById('chart-stress').innerHTML='';
    document.getElementById('table-stress').innerHTML='';
    return;
  }
  const rows=d.data.filter(r=>String(r[1])===lc||String(r[colIdx(d.head,'load')])===lc);
  const use=rows.length===0?d.data:rows;
  const exi=colIdx(d.head,'Elem')<0?0:colIdx(d.head,'Elem');
  const numCols=d.head.map((_,i)=>i).filter(i=>i>1);

  // Auto-detect max stress column (prefer columns containing ratio, dcr, stress)
  const ratioI=d.head.findIndex(h=>/ratio|dcr|sr/i.test(h));
  const dispI=ratioI>=0?ratioI:d.head.length-1;

  const vals=use.map(r=>parseFloat(r[dispI])||0);
  const maxV=Math.max(...vals), avgV=vals.reduce((a,b)=>a+b,0)/Math.max(vals.length,1);
  const over1=vals.filter(v=>v>1.0).length;
  document.getElementById('statStress').innerHTML=`
    <div class="stat-card"><div class="stat-val ${maxV>1?'hi-pos':''}">${fmt(maxV)}</div><div class="stat-lbl">${t('statMaxStress')}</div></div>
    <div class="stat-card"><div class="stat-val">${fmt(avgV)}</div><div class="stat-lbl">${t('statAvgStress')}</div></div>
    <div class="stat-card"><div class="stat-val ${over1>0?'hi-pos':''}">${over1}</div><div class="stat-lbl">${t('statOverStress')}</div></div>
    <div class="stat-card"><div class="stat-val">${use.length}</div><div class="stat-lbl">${t('statTotalMember')}</div></div>`;

  const top20=[...use].sort((a,b)=>(parseFloat(b[dispI])||0)-(parseFloat(a[dispI])||0)).slice(0,20);
  const elems=top20.map(r=>String(r[exi])), sv=top20.map(r=>parseFloat(r[dispI])||0);
  Plotly.newPlot('chart-stress',[{type:'bar',x:elems,y:sv,marker:{color:sv.map(v=>v>1?'#ef4444':v>0.8?'#f59e0b':'#2ec4b6')},name:t('stressName')}],
    {title:{text:t('chartStress'),font:{size:13}},xaxis:{title:t('xaxisElem'),type:'category'},yaxis:{title:t('yaxisStress'),range:[0,Math.max(1.2,...sv)*1.05]},shapes:[{type:'line',x0:-0.5,x1:top20.length-0.5,y0:1,y1:1,line:{color:'red',width:2,dash:'dash'}}],margin:{t:40,b:50,l:70,r:20},height:300,paper_bgcolor:'#fafafa',plot_bgcolor:'#fafafa'},{responsive:true});
  renderTable('table-stress', d.head, use, numCols);
}

// ── Common table rendering ──
function renderTable(tableId, head, data, numCols) {
  const numSet=new Set(numCols);
  let html=`<thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>`;
  for(const row of data) {
    html+=`<tr>${row.map((c,i)=>{
      if(numSet.has(i)) { const cl=fmtClass(c); return `<td class="${cl}">${fmt(c)}</td>`; }
      return `<td>${c}</td>`;
    }).join('')}</tr>`;
  }
  html+='</tbody>';
  document.getElementById(tableId).innerHTML=html;
}

// ──────────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────────
function goTo(step) {
  for(let i=1;i<=9;i++){
    document.getElementById(`page${i}`).classList.add('hidden');
    const si=document.getElementById(`s${i}`);
    si.classList.remove('active','done');
    if(i<step) si.classList.add('done');
  }
  document.getElementById(`page${step}`).classList.remove('hidden');
  document.getElementById(`s${step}`).classList.add('active');
  if(step===6) renderPlot();
  if(step===9) {
    const genImg = document.querySelector('#prodGen img.prod-icon');
    const civImg = document.querySelector('#prodCivil img.prod-icon');
    if(genImg) document.getElementById('tf-img-gen').src = genImg.src;
    if(civImg) document.getElementById('tf-img-civil').src = civImg.src;
    const btns = document.getElementById('page9Btns');
    btns.innerHTML = apiConnected
      ? `<button class="btn btn-secondary" onclick="goTo(8)" data-i18n="backBtn">← Back</button>
         <button class="btn btn-secondary" onclick="resetAll()" data-i18n="startOverBtn">🔄 Start Over</button>`
      : `<button class="btn btn-secondary" onclick="resetAll()" data-i18n="startOverBtn">🔄 Start Over</button>`;
  }
}

function resetAll() {
  document.getElementById('logBox').innerHTML=`<span style="color:#f8c94f">${t('logInit')}</span>`; document.getElementById('logBox').dataset.initial='1';
  document.getElementById('progressWrap').classList.add('hidden');
  document.getElementById('progressBar').style.width='0%';
  document.getElementById('fitNotice').classList.add('hidden');
  document.getElementById('genBtn').disabled=false;
  document.getElementById('toAnalBtn').disabled=true;
  document.getElementById('resultCard').classList.add('hidden');
  document.getElementById('analysisLog').innerHTML=`<span style="color:#f8c94f">${t('alogInit')}</span>`; document.getElementById('analysisLog').dataset.initial='1';
  setBadge('wait');
  analysisData={react:null,disp:null,force:null,stress:null};
  selectedProduct=null;
  apiConnected=false;
  document.getElementById('prodGen').classList.remove('selected');
  document.getElementById('prodCivil').classList.remove('selected');
  goTo(1);
}

function toggleKey() {
  const inp=document.getElementById('mapiKey');
  inp.type=inp.type==='password'?'text':'password';
}

// ── Language init ──────────────────────────────────────────────
(function(){
  renderLangButtons();
  let saved=DEFAULT_LANG;
  try{saved=localStorage.getItem('wizLang')||DEFAULT_LANG;}catch(e){}
  setLang(saved);
  addLC();
})();
