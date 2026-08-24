# mtw4244.work

Personal homepage. Monochrome, dark, minimal: a short intro and a grid of
project cards, with each project on its own page.

Everything is self-contained. No external fonts, images, or scripts, so it
deploys as-is with nothing else to fetch.

## Files
- `index.html` landing page, intro and project card grid
- `roller.html` RollerMap project page, served at `/roller`
- `minesweeper.html` playable Minesweeper, served at `/minesweeper`
- `sudoku.html` playable Sudoku, served at `/sudoku`
- `riichi/` Riichi mahjong trainer, served at `/riichi`
- `404.html` not-found page
- `style.css` all styling, shared by every page
- `theme.js` site-wide theme picker, injected into every page

Cloudflare Pages serves `roller.html` at the clean URL `/roller`, same for
`minesweeper.html` at `/minesweeper` and `sudoku.html` at `/sudoku`. Adding a
new project means adding a page, a card in `index.html`, and an entry in
`sitemap.xml`.

The games carry their own JavaScript inline; the rest of the site is markup
and CSS plus `theme.js`.

`sudoku.html` generates each puzzle in the browser: fill a grid by randomised
backtracking, then remove clues one at a time, keeping a removal only when the
puzzle still has exactly one solution. That check is what makes the difficulty
levels honest, and it runs in a few milliseconds.

## Hosting

Live at https://mtw4244.work, served by Cloudflare Pages.

- Pages project: `mtw4244-site` (direct upload, not git-connected)
- Default URL: https://mtw4244-site.pages.dev
- Custom domains: `mtw4244.work` and `www.mtw4244.work`, both proxied CNAMEs
  to `mtw4244-site.pages.dev` in the Cloudflare zone

## Deploying

Uploads the files as-is. No build step, but stamp the asset versions first.

```sh
python3 tools/stamp-asset-versions.py
export CLOUDFLARE_ACCOUNT_ID=<account id>
export CLOUDFLARE_API_TOKEN=<scoped token with Pages:Edit>
npx wrangler pages deploy . --project-name=mtw4244-site --branch=main
```

`_headers` sets pages to revalidate on every request, so a deploy is live
straight away. It cannot do the same for css and js: Pages applies its own
four hour Cache-Control to those and it wins over `_headers`. Instead each
asset URL carries a hash of the file, which the stamp script keeps current.
Skip the script after editing css or js and returning visitors keep the old
one for up to four hours. `--check` exits 1 when a page is out of date.

Use a scoped API token, not the account-wide Global API Key. Create one at
Cloudflare → My Profile → API Tokens with the "Cloudflare Pages: Edit"
permission. Never commit it.
