# Image Locations - Replace Manually

## Home Page Hero (main banner)
- **File:** src/app/Home.module.css
- **Line:** ~41 inside .hero
- **Property:** background url(...)
- **Current:** Unsplash URL
- **To replace:** Edit the URL in background, or add public/hero.jpg and use url('/hero.jpg')
- **Size:** 1200x800 or similar landscape

## Logo
- **File:** public/Vorton_Logo.png
- **Used in:** src/components/Layout.tsx
- **To replace:** Overwrite public/Vorton_Logo.png

## Favicon
- **File:** public/vorton_web_favicon.png
- **Used in:** src/app/layout.tsx metadata
- **To replace:** Overwrite public/vorton_web_favicon.png

## Article Images
- **File:** src/data.ts
- **To replace:** Edit image URL in each article object (lines 11 21 31 41)

## Product Images
- **Source:** Cloudinary via API - not in repo
