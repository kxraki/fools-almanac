# The Fool's Almanac — installable web app

A tarot learning app built around one idea: you learn the cards by looking at them and
deriving their meaning, not by memorising 78 definitions.

No framework, no build step, no dependencies. Plain HTML, CSS and JavaScript. If you can
copy a folder onto a web host, you can ship it.

---

## Put it online in about five minutes

The app needs to be served over **HTTPS** (or `localhost`). Service workers — the thing that
makes it installable and offline-capable — are disabled on `file://`, so opening `index.html`
by double-clicking will *mostly* work but won't install and won't cache.

Pick whichever is easiest:

**Netlify Drop** — go to `app.netlify.com/drop` and drag this whole folder onto the page.
It's live on an HTTPS URL in seconds. No account needed to start.

**Cloudflare Pages** — `Create project → Direct Upload`, drag the folder. Free, fast, good
global performance.

**GitHub Pages** — create a repo, push these files, then `Settings → Pages → Deploy from
branch → main / (root)`. Your URL will be `username.github.io/reponame/`. All paths in this
app are relative, so a subdirectory works fine.

**Vercel** — `vercel` in this folder, or drag-and-drop in the dashboard.

### Testing locally first

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Service workers are allowed on localhost, so installation
and offline mode both work here.

---

## Installing it on your phone

**Android / Chrome / Edge** — an "Install" bar appears at the bottom of the app. Or use the
browser menu → *Install app* / *Add to Home screen*.

**iPhone / iPad** — iOS doesn't support the install prompt, so it has to be done by hand:
open the site in **Safari** (not Chrome — on iOS only Safari can install web apps), tap the
**Share** button, then **Add to Home Screen**.

Once installed it opens full-screen with its own icon, no browser chrome, and works offline.

---

## Offline

Everything except the full-size card images is cached on first visit: all the text, the
grammar, the spreads, and 140px thumbnails of all 78 cards. That's about 700 KB.

The full-size images are 5 MB, which is too much to force on someone on mobile data, so
they're downloaded on demand and cached as you view them. To grab the whole deck at once,
open the **Deck** tab and press **Download all cards**. After that the app is fully offline.

---

## Where your journal lives

In `localStorage`, in that browser, on that device. Nothing is sent anywhere — there's no
server, no account, no analytics.

The tradeoff is that it's genuinely fragile: clearing site data, "reset browser", or moving
to a new phone will lose it. So the Journal tab has **Export journal** (downloads a `.json`
file) and **Restore from file**. Export occasionally. If you ever want real sync across
devices, that's the point where you'd need a backend and accounts.

iOS note: Safari may evict `localStorage` for web apps left unused for a long stretch.
Another reason to export now and then.

---

## Making changes

| I want to change… | Edit |
|---|---|
| Card meanings, scenes, symbols | `data.js` |
| Suit / number / rank grammar | `data.js` (top of file) |
| Screens, flow, journal logic | `app.js` |
| Colours, type, layout | `styles.css` |
| Name, icon, install behaviour | `manifest.json`, `index.html` |

**Important:** after changing *any* file, bump `VERSION` in `sw.js` (`almanac-v1` →
`almanac-v2`). The service worker serves cached copies, so without a version bump your
returning users keep seeing the old app. This trips up everyone once.

The card images are named by card ID: `img/m0.webp` is The Fool, `img/swords8.webp` is the
Eight of Swords, `img/cupsqueen.webp` is the Queen of Cups. Majors are `m0`–`m21`.

---

## Credits and licensing

Card artwork by **Pamela Colman Smith**, published by Rider & Company, 1909. Public domain:
Smith died in 1951, so copyright expired in life+70 jurisdictions in 2021, and the deck was
already public domain in the US by publication date. Scans via
`github.com/mixvlad/TarotCards`.

Two things to know if you publish this publicly:

1. **"Rider-Waite" is a registered trademark of U.S. Games Systems, Inc.** The artwork is
   free; the brand name is not. Use "Waite-Smith" or "the 1909 deck" in any public listing.
2. What's still under copyright is U.S. Games' modern **recoloured** editions. These are the
   original plates, not those.

---

## Not built yet

Things a daily-use version would eventually want, roughly in the order I'd add them:

- Recording an actual 3-card spread as a journal entry (spreads are currently taught, not logged)
- Filtering your journal by card — seeing how one card's meaning shifted for you over months
- Search across cards and entries
- A reversals toggle on the daily draw
- Daily reminder notifications — the one feature that genuinely needs a native wrapper
  (Capacitor), since web push on iOS is unreliable

---

## Keeping the two builds in sync

`build_artifact.py` regenerates the single-file version (the one that runs inside Claude)
from this same source, so a feature only ever needs writing once:

```bash
python3 build_artifact.py
```

The two builds differ in exactly three places, each marked in `app.js`:
`STORAGE` (localStorage vs Claude's storage API), `IMGSRC` (image files vs inline base64),
and the `BUILD` flag (hides the offline downloader where there's no service worker).
If you edit anything inside those markers, edit both sides.
