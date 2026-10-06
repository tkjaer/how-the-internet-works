---
applyTo: "content/**/locales/**"
---

# Translations

- A language file (`locales/<lang>.json`, `content/locales/<lang>/ui.json`) mirrors the keys of `en.json`. Missing keys fall back to English per string, so a partial translation is fine.
- Translate prose and labels. Keep in English: protocol and product names, header field values, codes, addresses and units (`HTTP/1.0`, `TTL 64`, `192.168.x.x`, `Content-Length`), and `{placeholders}` exactly as written.
- A few strings stay English on purpose: header field names as the standards write them, router output, engineers' jargon, and sounds. Each language lists its own, by folder and key, in `KEEP_ENGLISH` in `src/translations.test.ts`. Don't flag those as untranslated, and don't ask to translate them. A language may translate a term another keeps English.
- `src/translations.test.ts` fails on any other translated string that is still the English text, so don't report those one by one; the test lists them all.
- When unsure about a term, check what the other shipped translations (for example `da.json`) did with it, and keep the same term for the same thing within a language.
- Labels are drawn in small boxes on a phone: prefer a short wording.
