# Privacy

How the Internet Works is a static web page. It has no accounts, no cookies, no third-party scripts and nothing loaded
from other sites. The one thing it sends is an anonymous count of each visit, with the language, to the author's own
server, so we know roughly how much it's used and where; you can turn that off in About, and your browser's "don't
track me" setting turns it off too. Only totals are kept, and they're published.

## What the app itself does

- **One anonymous count per visit.** See [Counting visits](#counting-visits) below: what is sent, what is kept, and
  how to turn it off. There are no other counters, pixels, beacons or third-party scripts.
- **No cookies.** The app sets none, and the count sends none.
- **No third-party requests.** The fonts (Baloo 2 and JetBrains Mono, from Fontsource) and every other asset are
  bundled and served from the same site as the page. Nothing is fetched from a CDN, font service or other site.
- **Where you are in the app is in the address.** The language, place, activity and scene are in the URL (e.g.
  `#/da/on-the-go/watch-video/internet`), and a few settings can be in its query (`?level=technical`, `?mode=night`,
  `?sound=off`, `?style=…`). The part after `#` never leaves your browser. The query is sent to the web server with the
  page request, like any address.

## Counting visits

To know whether anyone uses the app, in which language and from roughly where, it counts visits on the author's own
small server (`stats.irq.dk`), not with an analytics company.

**What your browser sends.** Once each time the app is loaded (opening it, reloading, a new tab), after the page has
settled, one request: `https://stats.irq.dk/how-the-internet-works/count?lang=da`. The only data in it is the
language the app opened in (`en` or `da`). Moving around in the app sends nothing more. The request carries no cookie,
no identifier, no referrer (not even which page you were on), nothing from `localStorage` and nothing about your device
beyond what every request has: your IP address and the browser's standard headers. The answer is ignored, and if the
server is down, slow or blocked, nothing changes for you.

**What the server keeps.** The server ([GoatCounter](https://www.goatcounter.com), self-hosted, behind nginx) does not
log the requests it counts. It uses your IP address only in memory to look up the country, with a database on the
server itself, and then adds one to two totals: page loads per language per hour, and per country per day. Your IP
address, the browser details and the time of your visit are not stored, and no record of the single visit is kept.
Those totals are deleted after 31 days. The server also hosts other sites, and a connection that fails before it says
it is for `stats.irq.dk` may end up in their logs instead; the app's own requests never do. The
[open-stats README](https://github.com/tkjaer/open-stats#limits-what-this-can-and-cant-promise) lists this and
the counts' other limits.

**What is published.** Once a week, totals for the week are published in
[tkjaer/open-stats](https://github.com/tkjaer/open-stats) (CC0), as three separate tables: page loads per day,
language per day, and countries per day. A country with fewer than 5 page loads on a day is counted under "other" for
that day, so a single visit from a small country can't be picked out, and no weekly country numbers are published that
the hidden days could be worked out from. Days are in UTC. The server's setup and the export script are in the same
repo.

**Turning it off.** Any of these stops it:

- **"Count my visit"** in About (⋯ → About). Turning it off is remembered in this browser (`count` below).
- **Global Privacy Control or Do Not Track** in your browser. The app then sends nothing, and the server also ignores
  any count that arrives with either signal.
- **A content blocker** that blocks `stats.irq.dk`.

Copies of the app anywhere but its published address (`npm run dev`, a fork, your own server) never count.

**On what basis.** The count is for the author's own audience measurement of this site and nothing else: no
profiling, no advertising, no sharing beyond the published totals. Under the GDPR the basis is legitimate interest. EU
rules on access to your device (the ePrivacy Directive, article 5(3)) are read strictly by the European Data Protection
Board, which counts a request like this as needing consent; France's CNIL and the EU's proposed "digital omnibus"
exempt first-party, aggregated audience measurement like this. We've chosen the latter reading, with an easy off switch
and the browser's signals respected, rather than a consent banner. If you think that's wrong, please
[open an issue](https://github.com/tkjaer/how-the-internet-works/issues). This is not legal advice.

## What it remembers in your browser

A few settings are kept in your browser's `localStorage`, so the app looks the same next time. They stay on your device,
are never sent anywhere, and you can delete them by clearing the site's data in your browser.

| Key | Value | What it is |
| --- | --- | --- |
| `level` | `simple` or `technical` | The level you picked |
| `style` | a theme id, e.g. `storybook` | The art style |
| `mode` | `day` or `night` | Day or night, only when you picked the one your system doesn't prefer |
| `paused` | `1` | The packets are paused (removed when you play them again) |
| `speech` | `1` | Read aloud is on (removed when you turn it off) |
| `sound` | `off` | You muted the sound (removed when you turn it back on) |
| `coached` | `1` | The first-visit tips were shown, so they aren't shown again |
| `count` | `off` | You turned off "Count my visit" in About (removed when you turn it back on) |

Nothing else is stored: the language comes from the address.

## What the browser and the host may do

- **Hosting.** When the app is served from GitHub Pages, GitHub receives each page request like any web server does,
  and may log your IP address and other request details. See the
  [GitHub General Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
  If you run it yourself (`npm run dev`, or the `dist/` build on your own server), only your own server sees requests.
- **Read aloud** uses your browser's own speech (`speechSynthesis`). The app prefers voices that run on your device,
  but on some browsers and systems the only voice for a language is an online one, and then the browser's maker
  turns the text into speech on its servers.
- **Learn-more links** open other sites (mostly Wikipedia) in a new tab only when you click one. That site then gets
  your request like any visit, and your browser usually tells it which site the link was on (just the address of
  this site, not the page you were on).
