# NAMCHI VISTA

## 10-line sitemap
1. `/` — Home and full project overview
2. `/#about` — About Namchi Vista and home features
3. `/#apartments` — Floor selector, layouts and apartment enquiries
4. `/#gallery` — Architectural impressions gallery
5. `/#location` — Map, address and nearby places
6. `/#enquiry` — WhatsApp enquiry form
7. Footer — address, contact links and image disclaimer
8. `/robots.txt` — Search-crawler instructions
9. `/sitemap.xml` — XML sitemap for `https://namchivista.in/`
10. `/assets/images/` — Local illustrations and site icon

## Design system
- **Palette:** forest charcoal `#1c2520`, warm taupe `#b8a58c`, mist `#f1f2ee`, amber `#d98a2b`; theme-aware paper, ink and muted text tokens support light and dark modes.
- **Typography:** Cormorant Garamond for editorial headings and the letter-spaced wordmark; Hanken Grotesk for interface and body text.
- **Layout:** responsive, mobile-first editorial sections; constrained wide content; stacked floor selector; large architectural-image mosaic.
- **Interaction:** amber calls to action, restrained hover motion, keyboard-operable controls, accessible dialogs, mobile navigation and persistent theme selection.
- **Accessibility:** semantic landmarks, skip link, visible focus, labels, descriptive image text, live form status, reduced-motion support and keyboard-operable tabs.

## Project structure

```text
NV website/
├── index.html
├── styles.css
├── script.js
├── site-config.js
├── robots.txt
├── sitemap.xml
├── CNAME
└── assets/
    └── images/
        ├── favicon.svg
        ├── namchi-vista-sunset.jpg
        ├── namchi-vista-retreat.jpg
        ├── namchi-vista-residence.jpg
        ├── namchi-floor-1-2d.jpg
        ├── namchi-floor-1-3d.png
        ├── namchi-floor-2-2d.jpg
        ├── namchi-floor-2-3d.png
        ├── namchi-floor-3-2d.jpg
        ├── namchi-floor-3-3d.png
        ├── namchi-floor-4-2d.jpg
        └── namchi-floor-4-3d.png
```

The JPG architectural renders are from the images supplied in the Namchi Vista folder. They are used for the hero, visit banner and gallery. Floor-specific 2D plans and 3D views were extracted from the paired floor brochure PDFs. The transparent brochure views move in a slow, subtle wave, with a slight side-to-side tilt and vertical float; motion pauses while hovered, focused, dragged or zoomed. Drag to rotate manually. Use the on-screen controls or mouse wheel to zoom, then drag the zoomed view to pan. Open a full-screen preview for additional zoom and pan controls. Reduced-motion preferences disable the animation. The original brochure artwork is raster imagery, so zooming reveals its available source detail rather than creating new detail. All image views are labelled as artist’s impressions in the page content.

Apartment pricing is shown at ₹5,000 per sq ft. Each displayed estimate multiplies that rate by the listed apartment area; the areas and resulting estimates are indicative and should be confirmed before quoting a final price.

## Setup

1. Put the project files at the root of your static website.
2. Verify the `whatsapp`, `email`, `facebookUrl` and `instagramUrl` values in `site-config.js`, and replace `[LAT]` and `[LNG]` with confirmed coordinates. Use an international number for WhatsApp (country code included, for example `91...`). Social links must be full HTTP or HTTPS URLs. Use decimal coordinates for latitude and longitude.
3. Replace `YOUR_API_KEY` in `site-config.js` with a Google Maps JavaScript API key. The key is necessarily visible in browser code; protect it with restrictions rather than treating it as a secret:
   - In Google Cloud Console, select or create a project, enable billing, and enable **Maps JavaScript API** and **Geocoding API** (the latter is used to position the nearby-place markers by their place names).
   - Under **APIs & Services → Credentials**, create an API key and restrict it to **Maps JavaScript API** and **Geocoding API** under API restrictions.
   - Under website/application restrictions, choose **Websites (HTTP referrers)** and add `https://namchivista.in/*`. Add `https://www.namchivista.in/*` too if the `www` domain will be active, and add local development origins only while testing.
   - Keep `YOUR_API_KEY` and the `[LAT]` / `[LNG]` values in place until the real values are ready. Without valid coordinates or a configured key, the address-based Google Maps embed and directions link remain available. If the Maps API cannot load, the embed remains as the fallback.
4. The canonical URL, Open Graph URLs, sitemap and robots file are configured for `https://namchivista.in/`. If you choose a different canonical domain, update those values before launch.
5. Confirm the supplied architectural images are approved for publication; update their descriptive alt text if the selected gallery images change.
6. Preview locally from a local web server (for example `python -m http.server 8000`) and open `http://localhost:8000`. A server is recommended for the Maps API and reliable browser asset loading.

## Deployment

- **GitHub Pages:** create a GitHub repository and upload the contents of this folder to its root (keep `index.html` at the root). In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select the `main` branch and `/ (root)`, then save. In the Pages custom-domain field, enter `namchivista.in` and save; the included `CNAME` file already contains this domain. At your domain registrar's DNS settings, point the apex domain to GitHub Pages using the A records shown in GitHub's current Pages documentation, and optionally set `www` as a CNAME to `<your-github-username>.github.io`. Wait for DNS to propagate, enable **Enforce HTTPS** in Pages settings once available, and test `https://namchivista.in/`. Do not change nameservers unless you intend to move all DNS management away from your registrar.
- **Hostinger:** connect `namchivista.in` to your hosting plan and enable SSL/HTTPS in hPanel. In **Files → File Manager**, open `public_html` and upload the contents of the upload ZIP so `index.html` is directly inside `public_html` and `assets/` sits beside it. Do not upload the ZIP as a nested folder. After DNS and SSL are active, test `https://namchivista.in/`.
- **Netlify:** create a new site from the project directory or connect its Git repository. Set the publish directory to the project root; no build command is needed. Add the final custom domain in **Domain management**, configure the DNS records Netlify provides, enable HTTPS, and add the resulting HTTPS origin to the Google Maps key's referrer restrictions.
- **Vercel:** import the project or deploy the project root with the Vercel CLI. No build command or output directory is required for this static site. Add the custom domain in project settings, configure the shown DNS records, enable HTTPS and allow that domain in the Maps key referrers.
- **cPanel:** upload the complete project contents, including `assets/`, to the domain's document root (commonly `public_html`). Point the domain DNS at the hosting provider, enable its SSL certificate, and add the HTTPS domain and any active `www` variant to the Maps key restrictions.

## Pre-launch checklist

- [ ] Verify all contact details (including Facebook and Instagram URLs), map key and coordinates.
- [ ] Confirm the floor schedule, address, copy and approved project imagery with the project team.
- [ ] Test enquiry form on a phone with WhatsApp installed and in a desktop browser; verify the message text and recipient before sending.
- [ ] Test email, WhatsApp, social links, map directions, map/satellite controls and the fallback embed.
- [ ] Test floor selection, both plan views, unit preselection and enlarged image lightboxes with keyboard and touch.
- [ ] Check the mobile layout, light/dark theme, focus visibility and reduced-motion behavior.
- [ ] Confirm `https://namchivista.in/` is the canonical domain; validate the sitemap, robots file, page metadata and schema.org data.
- [ ] Restrict the Google Maps key to production HTTP referrers and the Maps JavaScript API; verify billing and API loading.
- [ ] Deploy over HTTPS and submit `https://namchivista.in/sitemap.xml` to Google Search Console.
