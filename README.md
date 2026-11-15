# Villa Serena: Vacation Rental Website (Demo)

A premium, single-page website preview for an 8-bedroom, 8-bathroom family villa in
Orlando, Florida. **This is a demo for client review.** It is not deployed, has no
domain or hosting, and takes no payments.

## Preview locally

Requires [Node.js](https://nodejs.org) 18.17 or newer. There are no packages to install.

```bash
npm run dev
```

Then open **http://localhost:3000**. The page reloads automatically when you save a
file (CSS changes apply instantly without a reload). Stop the server with `Ctrl+C`.
Use another port with `PORT=4000 npm run dev`.

## Deploying to Vercel (when approved)

The project is a static site, so Vercel needs no build step; `vercel.json` handles
the settings. Only the website files are uploaded: `.vercelignore` excludes `tools/`,
`scripts/`, `photo-review/` and the README.

- **From GitHub:** in Vercel choose *Add New → Project*, import this repository, keep
  the Framework Preset as **Other**, and deploy.
- **From the command line:** `npx vercel` (creates a preview URL) and, later,
  `npx vercel --prod`.

While it's a client preview, search engines are told not to index it
(`X-Robots-Tag: noindex` in `vercel.json` plus `robots.txt`). **Before the real launch**,
delete `robots.txt` and remove the `X-Robots-Tag` header.

## Structure

```
index.html            page markup (all sections)
package.json          npm scripts (dev server)
scripts/dev-server.mjs  local preview server with live reload
vercel.json           Vercel settings (static site, headers)
.vercelignore         files kept out of Vercel deployments
robots.txt            blocks search engines during the preview phase
css/styles.css        design system + responsive layout
js/main.js            nav, gallery, lightbox, booking placeholder
assets/img/           responsive WebP + JPEG photos (metadata/GPS stripped)
assets/favicon.svg
tools/enhance.py      natural photo enhancement (global corrections only)
tools/build_images.py resize/compress photos into assets/img
photo-review/         2 enhancement samples (before/after) for approval
```

## Before going live: placeholders to replace

| Item | Where | Notes |
|---|---|---|
| **Booking link** | `BOOKING_URL` at the top of `js/main.js` | Every "Book Now" / "Check Availability" button links to it automatically, and the dashed "Demo placeholder" box disappears. |
| **Villa name** | "Villa Serena" in `index.html` | Placeholder brand name. |
| Contact details | not included | No phone, email or address added (none provided). |

## Photos

All 26 photos have been enhanced with `tools/enhance.py`: global, natural corrections
only (white balance, exposure, gentle contrast, light vibrance and clarity, chroma
noise reduction, mild sharpening). Nothing is added, removed or reshaped. The 6
lower-resolution images (about 1200px wide) are screenshots in the source folder; the
other 20 are full-resolution iPhone photos.

To rebuild from the source photos (`photos/original/01.jpg` … `26.jpg`, not committed):

```bash
mkdir -p photos/enhanced
for f in photos/original/*.jpg; do
  python3 tools/enhance.py "$f" "photos/enhanced/$(basename "$f")" --max 2560 --quality 92
done
python3 tools/build_images.py photos/enhanced
```
