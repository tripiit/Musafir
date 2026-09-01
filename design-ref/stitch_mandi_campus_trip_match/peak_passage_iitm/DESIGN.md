---
name: Peak Passage IITM
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F3F4F5'
  surface-container: '#EDEEEF'
  surface-container-high: '#E7E8E9'
  surface-container-highest: '#E1E3E4'
  on-surface: '#191C1D'
  on-surface-variant: '#444650'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#757681'
  outline-variant: '#c5c6d2'
  surface-tint: '#465b9d'
  primary: '#000c32'
  on-primary: '#ffffff'
  primary-container: '#001f60'
  on-primary-container: '#7489ce'
  inverse-primary: '#b4c5ff'
  secondary: '#785900'
  on-secondary: '#ffffff'
  secondary-container: '#fdc003'
  on-secondary-container: '#6c5000'
  tertiary: '#000c33'
  on-tertiary: '#ffffff'
  tertiary-container: '#011f60'
  on-tertiary-container: '#7489cf'
  error: '#BA1A1A'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174c'
  on-primary-fixed-variant: '#2d4384'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#fabd00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b5c4ff'
  on-tertiary-fixed: '#00174d'
  on-tertiary-fixed-variant: '#2d4384'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  success: '#2E7D32'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  gutter: 1rem
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 48px
---

## Brand & Style

The design system is a high-performance framework tailored for the student community of IIT Mandi. It balances the institutional prestige of a premier engineering institute with the rugged, adventurous spirit of the Himalayas. The brand personality is **authoritative, resilient, and logistics-focused**, ensuring users feel a sense of security and precision while managing travel in complex terrains.

The visual direction follows a **Corporate / Modern** aesthetic with **Tactile** influences. It utilizes a sophisticated surface-container architecture to handle data-heavy administrative views, paired with high-impact visual discovery for trip browsing. The interface prioritizes "functional depth"—using layers to organize complex information hierarchies without visual clutter.

## Colors

The palette is anchored by the **IIT Mandi Navy** and **Mountain Amber**, creating a trustworthy institutional foundation with high-visibility accents.

- **Primary (Deep Navy):** Represents stability and the academic backbone. Used for structural navigation, primary branding, and definitive actions.
- **Secondary (Mountain Amber):** Inspired by the golden hour on Himalayan peaks. Used exclusively for high-priority calls to action, active status indicators, and urgent highlights.
- **Surface Tiering:** A sophisticated "Surface-Container" system is employed to manage information density. The `lowest` (white) surface is reserved for primary content cards, while higher tiers (grays) define the dashboard background and nested UI elements like search bars and filters.
- **Functional Semantics:** Use `on-surface-variant` for secondary metadata and `outline` for non-critical borders to maintain a professional, de-cluttered dashboard environment.

## Typography

This system transitions to **Hanken Grotesk** for body and label text to provide a sharper, more technical feel for data-heavy sections, while retaining **Montserrat** for bold, impactful headers.

- **Headlines:** Use Montserrat for all major page titles and trip destination headers. Its geometric weight provides the "discovery" impact needed for travel browsing.
- **Data & Body:** Hanken Grotesk offers superior legibility in dashboard views, tables, and trip detail lists. Its modern, precise character suits the IIT environment.
- **Information Density:** For management views (like "My Bookings" or "Admin Panels"), prioritize `body-sm` and `label-sm` to allow for more data on screen without sacrificing readability.
- **Labels:** Labels use a higher letter-spacing and uppercase styling where necessary to distinguish metadata (e.g., "LICENSE PLATE") from user-generated content.

## Layout & Spacing

The layout is built on a **Fluid-Fixed Hybrid Grid** to accommodate both wide-screen management tools and mobile-first trip discovery.

- **Desktop (Management):** A 12-column grid with a fixed max-width of 1440px. Use a 240px persistent sidebar for navigation in functional views.
- **Mobile (Discovery):** A 4-column fluid grid with 16px margins. 
- **The 8px Rhythm:** All spacing (padding, gaps, margins) must be a multiple of 8px. Use `stack-lg` (32px) to separate distinct sections (e.g., "Active Trips" from "Past History") and `stack-sm` (8px) for internal card content.
- **Data Densification:** In management tables, vertical padding can be reduced to 4px (`stack-xs`) to ensure high information density.

## Elevation & Depth

Elevation is used to distinguish interactable content from the structural background, following a "Soft Tactile" philosophy.

- **Level 0 (Background):** `surface-container-low` (#F3F4F5). No shadows.
- **Level 1 (Cards/Inputs):** `surface-container-lowest` (#FFFFFF). Small, diffused shadow: `0 4px 12px rgba(0, 12, 50, 0.05)`.
- **Level 2 (Hover/Active):** `surface-container-lowest` (#FFFFFF). Medium diffused shadow: `0 8px 24px rgba(0, 12, 50, 0.10)`.
- **Level 3 (Modals/Overlays):** `surface-container-lowest` (#FFFFFF). Large shadow: `0 12px 32px rgba(0, 12, 50, 0.15)`.

Avoid harsh, black shadows. Use a primary-tinted navy for shadow colors to maintain a sophisticated, professional aesthetic.

## Shapes

The design system utilizes a **Rounded (0.5rem / 8px)** base to soften the professional dashboard, making it feel modern and approachable.

- **Cards & Containers:** All primary trip and data cards use `rounded-lg` (1rem / 16px) as requested for a refined aesthetic.
- **Buttons & Inputs:** Use the base `rounded` (0.5rem / 8px) for consistent form styling.
- **Selection Elements:** Chips and small status badges use `rounded-xl` or "pill" shapes to differentiate them from actionable buttons.

## Components

### Buttons
- **Primary:** Deep Navy background, White text. Heavy weight, 8px radius.
- **Action/Secondary:** Mountain Amber background, Navy text. Reserved for "Join Trip" or "Book."
- **Dashboard Action:** `surface-container-high` background with Navy icon/text for lower-priority management actions.

### Refined Trip Cards
Cards are the centerpiece of the platform.
- **Visuals:** 16px radius, Level 1 shadow, White background.
- **Layout:** High-impact destination image on the left (or top on mobile), followed by a clear information grid on the right.
- **Data Points:** Use `label-sm` for "Seats Left" and `headline-md` for "Price."

### Management Tables
For functional views, use a simplified row structure:
- **Rows:** Alternate between `surface-container-lowest` and `surface-container-low`.
- **Borders:** 1px `outline-variant` on the bottom of each row only.

### Inputs & Search
Search bars in dashboard views should use `surface-container` backgrounds with no border, becoming White with a Navy `outline` when focused. This "recessed" look keeps the dashboard clean until interaction is required.

### Status Chips
- **Confirmed:** Green background (10% opacity) with Dark Green text.
- **Pending/Amber:** Mountain Amber (10% opacity) with Navy text.
- **Cancelled/Full:** Asphalt Gray background with White text.