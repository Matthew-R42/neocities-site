# mtw4244.work

Personal homepage. Monochrome, dark, minimal: a short intro and a grid of
project cards, with each project on its own page.

Everything is self-contained. No external fonts, images, or scripts, and no
JavaScript at all, so it deploys as-is with nothing else to fetch.

## Files
- `index.html` landing page, intro and project card grid
- `roller.html` RollerMap project page, served at `/roller`
- `404.html` not-found page
- `style.css` all styling, shared by every page

Cloudflare Pages serves `roller.html` at the clean URL `/roller`. Adding a new
project means adding a page and a card in `index.html`.

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
