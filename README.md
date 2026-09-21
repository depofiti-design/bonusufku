# Bonus Ufku

Deneme bonusu listeleme sitesi + Telegram Mini App botu (`@bonusufku_webbot`). Statik HTML, Vercel'de yayında, veri Firebase Firestore'da.

- Site: https://bonusufku.vercel.app
- Admin: `/admin/` (site ekle/düzenle/sil, şifre: `bonusufku2025`)
- İstatistik: `/admin/stats.html` (aynı şifre; bot /start, site açılışı, kaynak dağılımı)
- Gizlilik/sorumlu oyun: `/privacy.html`
- Bot: https://t.me/bonusufku_webbot (Mini App: `t.me/bonusufku_webbot/appweb`)

## Mimari

- `index.html`, `admin/*.html`: Firebase compat SDK ile Firestore'a doğrudan bağlanır (`firebaseConfig`, proje `bonusufku`, veritabanı `eur3`)
- `api/telegram-webhook.js`: Vercel serverless, Telegram webhook. `/start` gelince karşılama mesajı + "Siteye Gir" butonu gönderir, `events` koleksiyonuna `bot_start` yazar (Firestore REST)
- `firestore.rules`: açık kurallar (test modu), koruma sadece admin şifre ekranı

## Firestore koleksiyonları

- `sites`: `name, bonus, type, tag (trend|popular), link, logo, display_order, active`
- `events`: `event_type (bot_start|site_open), telegram_user_id, source, created_at`

Belge ID'leri Firestore'un otomatik ürettiği string ID'ler.

## Vercel ortam değişkenleri

- `TELEGRAM_BOT_TOKEN`: BotFather token
- `TELEGRAM_WEBHOOK_SECRET`: webhook doğrulama gizli anahtarı

Değiştirince redeploy gerekir.

## Webhook kurulumu

```
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://bonusufku.vercel.app/api/telegram-webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

## Firestore kuralları deploy

```
npx firebase deploy --only firestore:rules --project bonusufku
```

## Kaynak takibi

Reklam/link başına `t.me/bonusufku_webbot?start=<kaynak>` kullan. `<kaynak>` stats sayfasında ayrı satır olarak görünür.

## Not

Firestore'a bağlanılamazsa `index.html` içindeki yedek `SITES` listesi gösterilir. Admin'den yapılan değişiklikler yedek listeye yansımaz. Kurallar test modunda (herkes okuyup yazabilir), BonusRota ile aynı risk toleransı.
