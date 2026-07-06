# Bonus Ufku — Canlıya Alma Adımları

BonusRota'dan farklı olarak bu site **Firebase Firestore** kullanıyor (Supabase org'unda
free plan proje limiti dolduğu için Gezicorn'daki gibi Firebase'e geçildi).

## 1. Firebase projesi

Zaten kurulu: proje adı `bonusufku`, Firestore veritabanı `eur3` (Avrupa) bölgesinde,
Native mode, kurallar test modunda (`firestore.rules` — herkes okuyup yazabiliyor).

`index.html` ve `admin/index.html` içindeki `firebaseConfig` zaten doğru değerlerle dolu,
elle bir şey doldurman gerekmiyor.

## 2. Firestore koleksiyonu (`sites`)

```
sites (
  name string,
  bonus string,
  type string,
  tag string,           -- 'trend' | 'popular'
  link string,
  logo string,
  display_order number,
  active boolean
)
```

Belge ID'leri Firestore'un otomatik ürettiği string ID'ler (Supabase'deki gibi sayısal
`id` yok). Admin panel bunu otomatik yönetiyor.

## 3. GitHub'a it

```
cd ~/bonus-sites/bonusufku
git init
git add .
git commit -m "Bonus Ufku ilk sürüm (Firebase)"
gh repo create depofiti-design/bonusufku --public --source=. --push
```

## 4. Vercel'e deploy et

- vercel.com → Add New Project → GitHub reposunu seç → Deploy
- Framework: **Other** / **Static**
- Adres: `bonusufku.vercel.app`

## 5. Site ekleme / düzenleme

`bonusufku.vercel.app/admin/` → şifre (`bonusufku2025`) → siteleri yönet.

---
**Not:** Firestore'a bağlanılamazsa sayfa dosya içindeki yedek listeye düşer, site boş görünmez.
**Not 2:** Firestore kuralları test modunda (herkes okuyup yazabilir) — admin panel şifre
korumalı ama veritabanı seviyesinde ekstra kilit yok, Gezicorn/BonusRota ile aynı risk toleransı.
