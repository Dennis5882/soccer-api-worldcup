const MIDAS_BASE = {
  gen:   'https://moa-engineers.midasit.com:443/gen',
  civil: 'https://moa-engineers.midasit.com:443/civil'
};

// 연결 검증은 product 접두어를 뗀 루트의 /mapikey/verify (GET) 가 정석.
// (story/MAPI_FINDINGS.md 라이브 검증 결과 — keyVerified:true 가 성공 기준)
function mapiRoot(base) {
  return base.replace(/\/(gen|civil)\/?$/i, '');
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { product, apiKey, baseUrl } = req.body || {};
  const base = (baseUrl || '').trim().replace(/\/$/, '') || MIDAS_BASE[product];
  const key = (apiKey || '').trim();
  if (!base || !key) return res.status(400).json({ ok: false, error: 'Missing product or apiKey' });

  try {
    const r = await fetch(`${mapiRoot(base)}/mapikey/verify`, { headers: { 'MAPI-Key': key } });
    let data = null;
    try { data = await r.json(); } catch (_) {}

    if (r.ok && data && data.keyVerified === true && data.status === 'connected') {
      return res.json({ ok: true, program: data.program, user: data.user });
    }
    // 키는 유효하지만 제품이 연결돼 있지 않음 — 가장 흔한 케이스
    if (data && data.keyVerified === true && data.status === 'disconnected') {
      return res.json({ ok: false, code: 'disconnected', program: data.program });
    }
    // 제품 불일치 (gen 선택했는데 키는 civil 인 경우 등)
    if (data && data.program && data.program !== product) {
      return res.json({ ok: false, code: 'mismatch', program: data.program });
    }
    return res.json({ ok: false, code: 'http', httpStatus: r.status, status: data && data.status });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
};
