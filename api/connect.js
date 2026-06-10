const MIDAS_BASE = {
  gen:   'https://moa-engineers.midasit.com:443/gen',
  civil: 'https://moa-engineers.midasit.com:443/civil'
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { product, apiKey } = req.body || {};
  const base = MIDAS_BASE[product];
  if (!base || !apiKey) return res.status(400).json({ ok: false, error: 'Missing product or apiKey' });

  try {
    const r = await fetch(`${base}/db/node`, { headers: { 'MAPI-Key': apiKey } });
    if (r.ok) return res.json({ ok: true });
    return res.json({ ok: false, error: `HTTP ${r.status}` });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
}
