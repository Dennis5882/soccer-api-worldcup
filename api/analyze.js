const MIDAS_BASE = {
  gen:   'https://moa-engineers.midasit.com:443/gen',
  civil: 'https://moa-engineers.midasit.com:443/civil'
};

async function midasDb(base, key, method, ep, body) {
  const res = await fetch(`${base}/db/${ep}`, {
    method,
    headers: { 'MAPI-Key': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function midasRaw(base, key, method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'MAPI-Key': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  'https://resource.midasuser.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { product, apiKey, lcNames } = req.body || {};
  const base = MIDAS_BASE[product];
  if (!base || !apiKey || !lcNames) return res.status(400).json({ ok: false, error: 'Missing fields' });

  const logs = [];
  const log  = (msg, type='ok') => logs.push({ msg, type });

  try {
    // 1. Set units
    log('Setting units (N, MM)...', 'info');
    await midasDb(base, apiKey, 'PUT', 'unit', {
      Assign: { 1: { FORCE:'N', DIST:'MM', HEAT:'KJ', TEMPER:'C' } }
    });
    log('Units set');

    // 2. Run analysis
    log('Running analysis...', 'info');
    const analRes = await midasRaw(base, apiKey, 'POST', '/doc/anal', {});
    if (analRes?.error) throw new Error(analRes.error.message || 'Analysis failed');
    log('Analysis complete');

    // 3. Fetch result tables
    log(`Fetching results (${lcNames.length} load cases)...`, 'info');

    async function fetchTable(tableType, extra={}) {
      return midasRaw(base, apiKey, 'POST', '/post/table', {
        Argument: {
          TABLE_NAME: 'SS_Table',
          TABLE_TYPE: tableType,
          STYLES: { FORMAT:'Fixed', PLACE:4 },
          LOAD_CASE_NAMES: lcNames,
          ...extra
        }
      });
    }

    function parseTable(json) {
      if (!json?.SS_Table?.HEAD || !json?.SS_Table?.DATA) return null;
      return { head: json.SS_Table.HEAD, data: json.SS_Table.DATA };
    }

    // Reactions
    log('Fetching reactions...', 'info');
    const react = parseTable(await fetchTable('REACTIONG'));
    if (react) log(`Reactions: ${react.data.length} rows`);
    else       log('No reaction data', 'info');

    // Displacements
    log('Fetching displacements...', 'info');
    const disp = parseTable(await fetchTable('DISPLACEMENTG'));
    if (disp) log(`Displacements: ${disp.data.length} rows`);
    else      log('No displacement data', 'info');

    // Internal forces
    log('Fetching internal forces...', 'info');
    const force = parseTable(await fetchTable('BEAMFORCE', { PARTS:['PartI','PartJ'] }));
    if (force) log(`Internal forces: ${force.data.length} rows`);
    else       log('No internal force data', 'info');

    // Stress ratio
    log('Fetching stress ratio...', 'info');
    let stress = null;
    try {
      stress = parseTable(await fetchTable('BEAMSTRESS'));
      if (stress) log(`Stress ratio: ${stress.data.length} rows`);
      else        log('No stress ratio data', 'info');
    } catch (se) {
      log(`Stress ratio skipped (${se.message})`, 'info');
    }

    log('🎉 Analysis and result retrieval complete!');
    return res.json({ ok: true, logs, react, disp, force, stress, lcNames });

  } catch (e) {
    log(`Error: ${e.message}`, 'err');
    return res.json({ ok: false, error: e.message, logs });
  }
}
