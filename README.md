# Villa Serena: Vacation Rental Website (Demo)

A premium, single-page website preview for an 8-bedroom, 8-bathroom family villa in
Orlando, Florida. **This is a demo for client review.** It is not deployed, has no
domain or hosting, and takes no payments.

## Preview locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

No build step: plain HTML, CSS and JavaScript.

## Structure

```
index.html            page markup (all sections)
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

The website currently uses the **original** Google Drive photos, only resized and
compressed (no tonal changes). The 6 lower-resolution images (about 1200px wide) are
screenshots in the source folder; the other 20 are full-resolution iPhone photos.

After the enhancement samples in `photo-review/` are approved, apply the same edit to
all photos and rebuild:

```bash
mkdir -p photos/enhanced
for f in photos/original/*.jpg; do
  python3 tools/enhance.py "$f" "photos/enhanced/$(basename "$f")" --max 2560 --quality 92
done
python3 tools/build_images.py photos/enhanced
```

(`photos/` holds the source files named `01.jpg` … `26.jpg` and is not committed.)
