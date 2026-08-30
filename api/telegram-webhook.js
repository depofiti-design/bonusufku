const WEBAPP_URL = 'https://bonusufku.vercel.app';
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

async function logEvent(eventType, telegramUserId, source){
  try{
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/events`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields({
        event_type: eventType,
        telegram_user_id: telegramUserId ?? null,
        source: source ?? null,
        created_at: new Date().toISOString(),
      })}),
    });
  }catch(e){ /* analitik hatası bot akışını kesmesin */ }
}

const START_MESSAGE = [
  "👋 *BonusUfku'ya hoş geldin!*",
  '',
  '🎁 Ödülleri ve fırsatları görebilmek için ilk adımın, aşağıdaki butona basıp siteye giriş yapmak ve hesap oluşturmak olmalı. Kayıt olduğunda:',
  '✅ Güncel deneme bonuslarına',
  '✅ Özel hediyelere ve kampanyalara',
  '✅ Sadece üyelere özel fırsatlara',
  'erişebilirsin.',
  '',
  '🔞 İçerik +18 yaş sınırlıdır. Lütfen sorumlu oyun ilkelerine uygun hareket et.',
  '',
  '👇 Hemen başlamak için butona bas:',
].join('\n');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(200).send('ok');
    return;
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret && req.headers['x-telegram-bot-api-secret-token'] !== expectedSecret) {
    res.status(401).send('unauthorized');
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const message = req.body && req.body.message;
  const text = message && message.text;

  if (token && message && text && text.split(' ')[0] === '/start') {
    const source = text.split(' ')[1] || null;
    await logEvent('bot_start', message.from && message.from.id, source);

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: START_MESSAGE,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 Siteye Gir', web_app: { url: WEBAPP_URL } },
          ]],
        },
      }),
    });
  }

  res.status(200).send('ok');
};
