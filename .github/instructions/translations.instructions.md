---
applyTo: "content/**/locales/**"
---

# Translations

- A language file (`locales/<lang>.json`, `content/locales/<lang>/ui.json`) mirrors the keys of `en.json`. Missing keys fall back to English per string, so a partial translation is fine.
- Translate prose and labels. Keep in English: protocol and product names, header field values, codes, addresses and units (`HTTP/1.0`, `TTL 64`, `192.168.x.x`, `Content-Length`), and `{placeholders}` exactly as written.
- A few strings stay English on purpose: header field names as the standards write them, router output, engineers' jargon, and sounds. Each language lists its own in `content/locales/<lang>/keep-english.json`, as `"<folder> <key>": "<the text>"` (for example `"layers/ethernet field.fcs.name": "Frame check sequence"`, or `"ui <key>"` for `ui.json`). Don't flag those as untranslated, and don't ask to translate them, but do flag a new entry that isn't one of those kinds (a sentence of prose, a label a reader should understand). A language may translate a term another keeps English.
- `src/translations.test.ts` fails on any other translated string that is still the English text, and on a `keep-english.json` entry that is no longer the string as written, so don't report those one by one; the test lists them all.
- A file's `"learnMore"` list holds its links to pages in that language (`{ "url", "title", "level", "eras"? }`), not translations of the English links, which every language gets as the fallback. The `title` is in the page's language; `level` and `eras` usually match the English link on the same subject. Flag a link to a page in another language; `src/model/content.test.ts` checks the rest (each link's shape, `https://`, known eras, and that the list is at the top of the file, not in an era's block).
- When unsure about a term, check what the other shipped translations (for example `da.json`) did with it, and keep the same term for the same thing within a language.
- Labels are drawn in small boxes on a phone: prefer a short wording.
