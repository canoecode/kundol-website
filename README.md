# Kundol Tangruthaiwanich: personal website

A one-page portfolio in a classic layout. A pine-green bar, then an introduction with the name, a one-line summary and the Mt. Fuji portrait, with the four main projects linked underneath. Below that, full-width sections alternate white and a pale tint: About, Leadership & Impact (MedLink), Featured Work (Pulma, EpivaScan, TeleSync, ReMemoCare), Debate, Research & Medicine, Beyond the Classroom, Awards & Recognition (by year, with certificates), Journey, and Contact. Each project also opens a side panel with photos, data and the full story.

Headings use Source Serif 4 (never italic) and text uses Host Grotesk. Colours are tokens at the top of the stylesheet, with a separate set for dark mode.

Plain HTML, CSS and JavaScript. No framework and no build step, so it deploys to GitHub Pages like the other project sites.

## Files

```
index.html             The page, all project panels, and the chart data (two JSON blocks at the end)
assets/css/styles.css  Tokens at the top: colours for light and dark, fonts, widths
assets/js/main.js      Phone menu, scroll reveal, panels, photo viewer, search (Ctrl/⌘ K), charts, live EpivaScan demo
assets/img/            Photos as WebP: name.webp is the large version, name-sm.webp the thumbnail
assets/img/world-dots.svg  Not used since the redesign; kept in case a map section comes back
```

## Run it locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000. A project can be linked directly, for example `index.html#pulma`.

## Interactive parts

- **Project panels.** Any element with `data-open="pulma"` opens `<dialog id="p-pulma">`. To add one, copy a panel and give it a new id. Section ids on the page (`about`, `impact`, `work`, `debating`, `medicine`, `school`, `awards`, `journey`, `contact`) must not match a panel name, or the link would open the panel. `data-scroll=".demo"` opens a panel at that part.
- **Photo sets.** A button with `data-photos="pulma"` opens the photo viewer with the photos listed in that project's panel, so each photo is only listed once. `data-start="1"` starts at the second photo.
- **Single photos and strips.** Anything with `data-full` (and an optional `data-caption`) opens in the photo viewer; items inside the same `data-gallery` box can be stepped through with the arrows.
- **Awards.** Grouped by year. An entry with a certificate or photo uses `data-full` and opens the viewer; an entry without one uses `data-open` and opens its project. Update the "entries" count and the totals underneath when adding one.
- **Scroll reveal.** Elements with the `reveal` class fade up once as they scroll into view (`style="--d:.08s"` delays one). People who turn on reduced motion get no animation.
- **Live EpivaScan demo.** The EpivaScan panel sends an uploaded photo to the `CanoeBoat/epivascan` Space on Hugging Face through `@gradio/client` and shows the top five matches. If the Space is switched to test mode, the panel says so.
- **Accuracy chart.** Per-condition and per-skin-tone results come from `eval/metrics.json` in the `CanoeBoat/epivascan-skin` model repo. Update the `data-epiva` JSON block in `index.html` after a new training run.
- **Fundraising chart.** Figures from the medlinkpathways.com impact table, in the `data-medlink` JSON block.
- Chart colours were checked for contrast and colour-blind safety in both themes.

## Before publishing

- `og:image` is the 1200×630 title card at `assets/img/og-image.jpg`, linked by its full URL on kundoltangruthaiwanich.com.
- The contact email is `kundol.tang@gmail.com`. Change it in the profile and Contact section if you want a different address public.

## Photos

Every photo was resized, converted to WebP and saved without EXIF or location data.

| Prefix | Source |
| --- | --- |
| `portrait`, `avatar` | `JapanFuji.JPG`, cropped to remove the camera watermark |
| `ml-` | medlinkpathways.com (`C:\MedlinkWebsite\assets\images`) |
| `pu-` | pulma.org (`C:\pulma-website\images`), plus the iCAN certificate from the MedLink awards album |
| `ep-` | epivascan.com (`C:\EpivaScan\assets\img`), plus the 2024 skin-AI trip from the MedLink site |
| `ts-` | telesync.fit field photos |
| `db-`, `mw-` | TCAS portfolio PDF, `C:\ImportantDocs`, and the TeleSync trophy photo from the MedLink site |
