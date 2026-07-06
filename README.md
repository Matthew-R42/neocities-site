# neocities-site

A Y2K/cyber-styled personal homepage template: glitch title, scanline/CRT
overlay, retro window chrome, marquee ticker, 88x31-style interest badges,
a links list, and a localStorage-backed guestbook + visitor counter (both
per-browser only, since Neocities is static hosting with no backend).

Everything is self-contained — no external fonts, images, or scripts, so it
uploads as-is with nothing else to fetch.

## Files
- `index.html` — structure/content
- `style.css` — all styling
- `script.js` — typing effect, visitor counter, guestbook

## Before you publish
Search for `[EDIT ME]` in `index.html` and swap in your real bio, interests,
and links — everything else is ready to go as styled.

## Publishing to Neocities

**Easiest — web dashboard:**
1. Create a free account at https://neocities.org if you don't have one.
2. Open your site dashboard → drag `index.html`, `style.css`, and `script.js`
   into the upload area.

**CLI (if you want repeatable deploys):**
```
brew install neocities   # or: npm install -g neocities-cli
neocities push . --api-key YOUR_API_KEY
```
Your API key is under Settings → API on your Neocities site dashboard. Don't
commit it to git — export it as an env var or pass it inline instead.
