const MIDAS_BASE = {
  gen:   'https://moa-engineers.midasit.com:443/gen',
  civil: 'https://moa-engineers.midasit.com:443/civil'
};

// ── Geometry ────────────────────────────────────────────────────
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
    const len = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
    return [v[0]/len*radius+cx, v[1]/len*radius+cy, v[2]/len*radius+cz];
  });
}

function dist3(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function soccerEdges(verts, tol=0.05) {
  const n = verts.length;
  let minD = Infinity;
  for (let i=0; i<n; i++) for (let j=i+1; j<n; j++) {
    const d = dist3(verts[i], verts[j]);
    if (d < minD) minD = d;
  }
  const edges = [];
  for (let i=0; i<n; i++) for (let j=i+1; j<n; j++) {
    if (dist3(verts[i], verts[j]) < minD*(1+tol)) edges.push([i,j]);
  }
  return edges;
}

function bottomNodeIndices(verts, radius, tol=0.05) {
  const minZ  = Math.min(...verts.map(v => v[2]));
  const range = radius * tol;
  return verts.map((v,i) => v[2] <= minZ+range ? i : -1).filter(i => i >= 0);
}

// ── MIDAS API helper ────────────────────────────────────────────
async function midas(base, key, method, ep, body) {
  const res = await fetch(`${base}/db/${ep}`, {
    method,
    headers: { 'MAPI-Key': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

// ── CORS ────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Handler ─────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { product, apiKey, params } = req.body || {};
  const base = MIDAS_BASE[product];
  if (!base || !apiKey || !params) return res.status(400).json({ ok: false, error: 'Missing fields' });

  const logs = [];
  const log  = (msg, type='ok') => logs.push({ msg, type });

  try {
    const {
      radius, cx, cy, cz,
      matName, elast, poisn, den,
      sectName, sectH, sectB,
      clearModel, nodeMode, manualNodes, constraint,
      loadCases = []
    } = params;

    const verts = soccerVerts(+radius, +cx, +cy, +cz);
    const edges = soccerEdges(verts);

    // Clear existing model
    if (clearModel) {
      for (const ep of ['cons','CNLD','BODF','stld','elem','node','sect','matl'])
        await midas(base, apiKey, 'DELETE', ep);
      log('Existing data cleared');
    }

    // Material
    const mr = await midas(base, apiKey, 'PUT', 'matl', {
      Assign: { 1: { TYPE:'STEEL', NAME:matName, DAMP_RAT:0.05,
        PARAM:[{ P_TYPE:2, ELAST:+elast, POISN:+poisn, THERMAL:1.2e-5, DEN:+den, MASS:0 }] } }
    });
    mr?.error
      ? log(`Material failed: ${mr.error.message}`, 'err')
      : log(`Material: ${matName}`);

    // Section
    const sr = await midas(base, apiKey, 'PUT', 'sect', {
      Assign: { 1: { SECTTYPE:'DBUSER', SECT_NAME:sectName,
        SECT_BEFORE:{ SHAPE:'SB', DATATYPE:2,
          SECT_I:{ vSIZE:[+sectH,+sectB,0,0,0,0,0] },
          USE_SHEAR_DEFORM:true, USE_WARPING_EFFECT:false } } }
    });
    sr?.error
      ? log(`Section failed: ${sr.error.message}`, 'err')
      : log(`Section: ${sectName} (${sectH}×${sectB} mm)`);

    // Nodes
    const na = {};
    verts.forEach((pt, i) => na[i+1] = { X:+pt[0].toFixed(4), Y:+pt[1].toFixed(4), Z:+pt[2].toFixed(4) });
    const nr = await midas(base, apiKey, 'PUT', 'node', { Assign: na });
    nr?.error
      ? log(`Node creation failed: ${nr.error.message}`, 'err')
      : log(`Created ${verts.length} nodes`);

    // Elements
    const ea = {};
    edges.forEach(([i,j], idx) => ea[idx+1] = { TYPE:'BEAM', MATL:1, SECT:1, NODE:[i+1,j+1], ANGLE:0, STYPE:0 });
    const er = await midas(base, apiKey, 'PUT', 'elem', { Assign: ea });
    er?.error
      ? log(`Element creation failed: ${er.error.message}`, 'err')
      : log(`Created ${edges.length} beam elements`);

    // Boundary conditions
    const supIdx = nodeMode === 'auto'
      ? bottomNodeIndices(verts, +radius)
      : (manualNodes || '').split(',').map(s => parseInt(s.trim())-1).filter(i => i >= 0 && i < verts.length);

    if (supIdx.length > 0) {
      const ca = {};
      supIdx.forEach((i, k) => ca[i+1] = { ITEMS:[{ ID:k+1, CONSTRAINT:constraint, GROUP_NAME:'' }] });
      const cr = await midas(base, apiKey, 'PUT', 'cons', { Assign: ca });
      cr?.error
        ? log(`Boundary condition failed: ${cr.error.message}`, 'err')
        : log(`Boundary conditions: ${supIdx.length} nodes`);
    } else {
      log('Boundary conditions: none', 'info');
    }

    // Load cases
    let lcIdx = 1;
    for (const lc of loadCases) {
      await midas(base, apiKey, 'PUT', 'stld', {
        Assign: { [lcIdx]: { NO:lcIdx, NAME:lc.name, TYPE:lc.type, DESC:'' } }
      });
      log(`Load case: [${lc.type}] ${lc.name}`);

      if (lc.isSW) {
        const fv = lc.swDir==='X' ? [lc.swVal,0,0] : lc.swDir==='Y' ? [0,lc.swVal,0] : [0,0,lc.swVal];
        const wr = await midas(base, apiKey, 'PUT', 'BODF', {
          Assign: { [lcIdx]: { LCNAME:lc.name, GROUP_NAME:'', FV:fv } }
        });
        wr?.error
          ? log(`Self-weight failed: ${wr.error.message}`, 'err')
          : log(`  Self-weight (${lc.swDir} × ${lc.swVal})`);
      } else {
        let nlNodes;
        if      (lc.nlMode === 'all')    nlNodes = verts.map((_,i) => i);
        else if (lc.nlMode === 'bottom') nlNodes = bottomNodeIndices(verts, +radius);
        else    nlNodes = (lc.nlNodes||'').split(',').map(s => parseInt(s.trim())-1).filter(i => i >= 0 && i < verts.length);

        if (nlNodes.length > 0) {
          const nlA = {};
          nlNodes.forEach((ni,k) => nlA[ni+1] = {
            ITEMS:[{ ID:k+1, LCNAME:lc.name, GROUP_NAME:'',
              FX:lc.nlFx, FY:lc.nlFy, FZ:lc.nlFz, MX:lc.nlMx, MY:lc.nlMy, MZ:lc.nlMz }]
          });
          const nlr = await midas(base, apiKey, 'PUT', 'CNLD', { Assign: nlA });
          nlr?.error
            ? log(`Nodal load failed: ${nlr.error.message}`, 'err')
            : log(`  Nodal loads: ${nlNodes.length} nodes (Fz=${lc.nlFz} N)`);
        } else {
          log('  Nodal loads: no target nodes', 'info');
        }
      }
      lcIdx++;
    }

    const productName = product === 'gen' ? 'Gen NX' : 'Civil NX';
    log(`🎉 ${productName} model generated!`);
    return res.json({ ok: true, logs });

  } catch (e) {
    log(`Error: ${e.message}`, 'err');
    return res.json({ ok: false, error: e.message, logs });
  }
}
