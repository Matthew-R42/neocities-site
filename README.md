# mtw4244.work

Personal homepage, Y2K/cyber styled: glitch title, scanline/CRT overlay, retro
window chrome, marquee ticker, 88x31-style interest badges, a links list, and a
localStorage-backed guestbook plus visitor counter (both per-browser only, since
this is static hosting with no backend).

The main content is **RollerMap**, a mobile-first web app for rating street
pavement quality for rollerblading. The page covers the six-point rating scale,
what the app does, and the stack.

Everything is self-contained. No external fonts, images, or scripts, so it
deploys as-is with nothing else to fetch.

## Files
- `index.html` structure and content
- `style.css` all styling
- `script.js` typing effect, visitor counter, guestbook

## Hosting

Live at https://mtw4244.work, served by Cloudflare Pages.

- Pages project: `mtw4244-site` (direct upload, not git-connected)
- Default URL: https://mtw4244-site.pages.dev
- Custom domains: `mtw4244.work` and `www.mtw4244.work`, both proxied CNAMEs
  to `mtw4244-site.pages.dev` in the Cloudflare zone

## Deploying

Uploads the three files as-is. No build step.

```sh
export CLOUDFLARE_ACCOUNT_ID=<account id>
export CLOUDFLARE_API_TOKEN=<scoped token with Pages:Edit>
npx wrangler pages deploy . --project-name=mtw4244-site --branch=main
```

Use a scoped API token, not the account-wide Global API Key. Create one at
Cloudflare → My Profile → API Tokens with the "Cloudflare Pages: Edit"
permission. Never commit it.
