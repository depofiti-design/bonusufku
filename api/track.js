const FIRESTORE_PROJECT_ID = 'bonusufku';

function toFirestoreFields(obj){
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === 'number') fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else fields[k] = { stringValue: String(v) };
  }
  return fields;
}

// Ziyaretçi/etkileşim takibi: index.html buraya POST atar, biz de Vercel'in
// gördüğü gerçek istemci IP'sini ve user-agent'ı ekleyip Firestore'a yazarız.
// Firestore client SDK'sından doğrudan yazımda IP bilgisi yoktu; bu yüzden
// site_open/site_click/wheel_spin/chest_open olayları artık bu endpoint
// üzerinden geçiyor. (bot_start hâlâ webhook'tan geliyor ve Telegram IP
// paylaşmadığı için o olayda IP olmayacak, bu platform kısıtı.)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('method not allowed');
    return;
  }

  const body = req.body || {};
  const eventType = typeof body.event_type === 'string' ? body.event_type.slice(0, 40) : null;
  if (!eventType) {
    res.status(400).send('event_type required');
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (forwarded ? forwarded.split(',')[0].trim() : (req.socket && req.socket.remoteAddress)) || null;

  const doc = {
    event_type: eventType,
    telegram_user_id: body.telegram_user_id ?? null,
    source: body.source ?? null,
    site_name: body.site_name ?? null,
    ip,
    user_agent: req.headers['user-agent'] || null,
    created_at: new Date().toISOString(),
  };

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/events`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(doc) }),
    });
  } catch (e) { /* analitik hatası kullanıcıyı etkilemesin */ }

  res.status(200).json({ ok: true });
};
