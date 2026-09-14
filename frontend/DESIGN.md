---
name: Serene Botanical Sanctuary
colors:
  surface: '#f9faf6'
  surface-dim: '#d9dad7'
  surface-bright: '#f9faf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f0'
  surface-container: '#edeeea'
  surface-container-high: '#e7e9e5'
  surface-container-highest: '#e2e3df'
  on-surface: '#1a1c1a'
  on-surface-variant: '#424843'
  inverse-surface: '#2e312f'
  inverse-on-surface: '#f0f1ed'
  outline: '#727973'
  outline-variant: '#c2c8c1'
  surface-tint: '#476553'
  primary: '#072517'
  on-primary: '#ffffff'
  primary-container: '#1e3b2b'
  on-primary-container: '#85a590'
  inverse-primary: '#adceb8'
  secondary: '#4a6454'
  on-secondary: '#ffffff'
  secondary-container: '#ccead5'
  on-secondary-container: '#506a5a'
  tertiary: '#2d1d02'
  on-tertiary: '#ffffff'
  tertiary-container: '#453213'
  on-tertiary-container: '#b69a73'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9ebd3'
  primary-fixed-dim: '#adceb8'
  on-primary-fixed: '#032112'
  on-primary-fixed-variant: '#304d3c'
  secondary-fixed: '#ccead5'
  secondary-fixed-dim: '#b1cdb9'
  on-secondary-fixed: '#072013'
  on-secondary-fixed-variant: '#334c3d'
  tertiary-fixed: '#fedeb2'
  tertiary-fixed-dim: '#e0c298'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#584323'
  background: '#f9faf6'
  on-background: '#1a1c1a'
  surface-variant: '#e2e3df'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.12em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  space-4xl: 6rem
  gutter-mobile: 1rem
  gutter-desktop: 2rem
  container-max: 1280px
---

## Brand & Style

### Brand Personality & Emotional Tone
This design system captures an **Organic Luxury** ethos tailored for holistic wellness and prestige spa hospitality. It balances grounding earthy calm with refined contemporary precision. The aesthetic evokes sensory restoration, deep breathing, tactile serenity, and understated indulgence. Users should feel welcomed into a quiet, sunlit sanctuary free of visual noise, clinical stiffness, or gaudy excess.

### Design Movement & Aesthetic Direction
- **Organic Luxury Minimalism:** Generous breathing room, deliberate typography interplay, balanced asymmetry, and muted natural tones inspired by forest canopies, warm stones, and herbal botanicals.
- **Atmospheric Contrast:** Alternating soft warm ecru backgrounds (`#F8F9F5`) with rich forest green anchor canvases (`#14271C` and `#1E3B2B`) creates natural zoning between immersive storytelling, interactive booking workflows, and crisp transaction surfaces.
- **Architectural Framing:** Subtle arched radii, hairline tone-on-tone borders, and whisper-soft diffused shadows recreate the physical experience of private wellness suites.

### Cross-Flow Cohesion
1. **Landing Page (`/`):** Editorial hero sections, arched imagery frames, fluid narrative pacing, customer testimonial carousels, and atmospheric deep-green conversion anchors.
2. **Authentication (`/auth`):** Distraction-free split-screen layout pairing meditative botanical photography with an uncluttered, high-legibility login and registration portal.
3. **Spa Appointment Booking (`/booking`):** Visual calendar grids with unambiguous state differentiation (e.g., booked vs. available slots), multi-step treatment customization cards, and therapist curation.
4. **Instant QR Checkout (`/checkout`):** A secure, elevated two-column layout highlighting an elegant dynamic QR container, countdown indicators, and transparent order breakdown.

## Colors

### Palette System & Functional Roles
The color architecture derives directly from biophilic and botanical references:
- **Primary Deep Forest Green (`#1E3B2B`, `#14271C`):** Used for primary buttons, prominent title typography on light surfaces, key brand containers, navigation bars, and immersive contrast blocks.
- **Secondary Sage Green (`#8EAA97`, `#D9E5DC`):** Used for serene accents, sub-badges, active date/time selection pills, interactive focus indicators, and subtle divider strokes.
- **Tertiary Warm Gold / Ochre (`#C5A880`, `#D8BA8E`):** Reserved for luxury cues, rating stars, premium package badges, VIP indicators, and delicate accent dividers.
- **Neutral Foundations:**
  - **Ecru / Soft Linen (`#F8F9F5`):** The standard app canvas providing warmth and reducing eye strain compared to harsh optical white.
  - **Crisp Cream Surface (`#FFFFFF`):** High-elevation surfaces such as cards, popovers, and input containers.
  - **Muted Stone (`#6B726C`):** High-readability secondary typography and captions.
- **Operational Slot Statuses:**
  - **Available / Open Slot (`#2E7D32`, background `#E8F5E9`):** Indicates open time slots and successful verification.
  - **Unavailable / Fully Booked Slot (`#D32F2F`, background `#FFEBEE`):** Disables unbookable slots with subdued, high-clarity warning styling.

### Surface Color Contrast Matrix
- On `#F8F9F5` (Ecru): Primary text uses `#14271C`, secondary text uses `#526056`.
- On `#14271C` / `#1E3B2B` (Deep Green): Primary text uses `#FFFFFF`, secondary text uses `#D9E5DC`, accent calls use `#D8BA8E`.

## Typography

### Editorial & Modern Hierarchy
- **Primary Display & Headlines (Playfair Display):** Conveys the prestige of heritage apothecary and high-end retreats. It features delicate high contrast between thick stems and thin serifs. Use italic styling sparingly for accent words within major titles (e.g., *"Glow Skin Naturally"* or *"Mindful Touch"*).
- **Body & Interface Controls (Plus Jakarta Sans):** A humanist sans-serif with open apertures and clean geometric contours. It maintains crisp legibility across scheduling grids, pricing breakdowns, form fields, and QR instructional badges.

### Typographic Principles
1. **Title Case & Restraint:** Headlines remain in sentence case or selective title case; full caps are restricted exclusively to `label-caps` for eyebrows and category tags.
2. **Line Height Comfort:** Body copy employs an expansive 1.55-1.6x line-height ratio to preserve the relaxed, unhurried cadence of the brand experience.

## Layout & Spacing

### Layout Model
- **12-Column Desktop Grid:** Standard max-width container of `1280px` centered with dynamic outer margins. Columns use flexible proportions with a consistent `2rem` (32px) gutter.
- **Reflow Rules:**
  - **Desktop (1024px+):** 12 columns. Two-column booking setups (step progression on left 7 cols, sticky live summary card on right 5 cols). Two-column checkout setups (QR presentation on left 6 cols, payment steps on right 6 cols).
  - **Tablet (768px - 1023px):** 8 columns, 24px gutters. Interactive components reflow into single columns with floating sticky bottom action sheets.
  - **Mobile (< 768px):** 4 columns, 16px margins and gutters. Calendars switch from multi-column tables to horizontally scrollable week carousels.

### Spacing Philosophy
White space is an active design element that reinforces luxury and tranquility. Content groups maintain tight internal cohesion (`space-xs` to `space-md`), while sections are separated by expansive vertical pauses (`space-3xl` to `space-4xl`).

## Elevation & Depth

### Atmospheric Layering
Rather than using heavy, dark drop shadows, depth is achieved via soft botanical tints and layered surface colors:
- **Surface Elevation 0 (Base Canvas):** `#F8F9F5` (Ecru) or `#14271C` (Deep Forest Green).
- **Surface Elevation 1 (Card & Module Layer):** `#FFFFFF` with a `1px` low-contrast border (`#E4EBE5`) and an ambient, diffused shadow: `box-shadow: 0 10px 30px -10px rgba(30, 59, 43, 0.05)`.
- **Surface Elevation 2 (Hover States & Popovers):** Elevated cards gain subtle buoyancy: `box-shadow: 0 16px 40px -12px rgba(30, 59, 43, 0.10)`.
- **Surface Elevation 3 (Sticky Booking Drawers & Modals):** `box-shadow: 0 24px 48px -12px rgba(20, 39, 28, 0.18)` accompanied by a backdrop blur (`backdrop-filter: blur(8px)` with `background: rgba(248, 249, 245, 0.85)`).

### Outlines & Borders
Borders remain ethereal: `1px solid rgba(142, 170, 151, 0.25)` on light surfaces, or `1px solid rgba(217, 229, 220, 0.15)` on deep green containers.

## Shapes

### Organic Curves & Proportions
Elements use a balanced roundedness tier (`roundedness: 2`), reflecting organic river stones and smooth botanical silhouettes:
- **Small Controls (Buttons, Inputs, Time Pills):** `0.5rem` (8px) to `0.75rem` (12px) for structured usability.
- **Card Containers & Modules:** `1rem` (16px) to `1.25rem` (20px) to impart a welcoming feel.
- **Hero Image Masks & Highlight Tiles:** Generous `1.5rem` (24px) to `2rem` (32px), with selective architectural arch styling (`border-radius: 120px 120px 16px 16px`) for signature treatment and imagery displays.
- **Selection Pills & Badges:** Full circular caps (`rounded-full` / 9999px) for category tags, promo badges, and interactive step markers.

## Components

### Buttons
- **Primary Button:** Filled deep green (`#1E3B2B`) with crisp white typography, subtle hover transition to `#14271C`, and soft lift. Radius: `12px`. Padding: `14px 28px`.
- **Secondary Button:** Outline with border `#1E3B2B`, text `#1E3B2B`, background transparent. Hover: background `#1E3B2B` with 5% opacity.
- **Luxury Accent Button:** Filled `#C5A880` with dark forest text (`#14271C`) for highlighted checkout and special booking conversions.

### Input Fields & Selects
- Background `#FFFFFF`, border `1px solid #D9E5DC`, rounded-xl (`12px`).
- Text color `#14271C`, placeholder color `#8EAA97`.
- Focus state: border color `#1E3B2B`, outline `2px solid rgba(142, 170, 151, 0.25)`, background `#FFFFFF`.

### Booking Time-Slot Pills (The Calendar Grid)
- **Available State:** Background `#FFFFFF`, border `1.5px solid #2E7D32`, text `#2E7D32`, font-weight 600. Includes an active subtle pulsing green indicator dot. Hover changes background to `#E8F5E9`.
- **Selected State:** Background `#1E3B2B`, border `1.5px solid #1E3B2B`, text `#FFFFFF` with slight elevation.
- **Booked / Unavailable State:** Background `#F5F5F3`, border `1px solid #E0E0E0`, text `#A0A5A1`, cursor `not-allowed`. Struck-through or marked with a mini red badge `#D32F2F` ("Hết chỗ").

### Cards (Services, Therapists, & Checkout Summaries)
- Clean card architecture with white surfaces (`#FFFFFF`), rounded-2xl (`16px`), and `1px solid rgba(228, 235, 229, 0.8)`.
- Cards incorporate top-corner badges (e.g., "Bán chạy", "Liệu trình 90 phút") with pill shapes and soft sage backgrounds.

### QR Code Payment Container (`/checkout`)
- Pristine white card positioned within a warm ecru canvas or deep forest framing.
- The QR graphic is framed by an inner soft ecru border (`#F8F9F5`) with custom corner bracket accents in gold (`#C5A880`).
- Features a floating status pill at the bottom: dynamic live countdown timer (e.g., "Mã QR hết hạn sau 14:59") and a clear copy button for payment details.

### Selection Chips & Toggles
- Rounded-full pill chips used for selecting therapy scents, room types (VIP Single / Couple Suite), and add-on oils.
- Unselected: Surface `#FFFFFF`, border `1px solid #D9E5DC`, text `#526056`.
- Selected: Surface `#D9E5DC`, border `1px solid #8EAA97`, text `#14271C`, font-weight 600.