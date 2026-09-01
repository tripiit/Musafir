---
name: Peak Passage
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
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
  tertiary: '#250500'
  on-tertiary: '#ffffff'
  tertiary-container: '#491100'
  on-tertiary-container: '#cc7457'
  error: '#ba1a1a'
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
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#390b00'
  on-tertiary-fixed-variant: '#77321a'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  deep-navy: '#001F60'
  mountain-amber: '#FFC107'
  ink-black: '#212529'
  snow-white: '#FFFFFF'
  asphalt-gray: '#6C757D'
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
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Open Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Open Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Open Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Open Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for the IIT Mandi student community, bridging the gap between rigorous academic life and the adventurous spirit of the Himalayas. The brand personality is **dependable yet spirited**, ensuring students feel secure when coordinating travel through mountainous terrain while maintaining the excitement of exploration.

The visual direction follows a **Modern Tactile** aesthetic. It moves away from flat, corporate interfaces toward a more physical, "touchable" UI that mirrors the gear used in outdoor adventure. This is achieved through subtle depth, soft-touch surfaces, and high-clarity information hierarchy. The interface prioritizes high legibility and quick scanning, essential for students on the move or coordinating logistics in low-connectivity areas.

## Colors

The palette is rooted in the official IIT Mandi identity to establish instant trust and institutional familiarity. 

- **Primary (Deep Navy):** Used for core branding, primary buttons, and navigational anchors. It provides a stable, academic foundation.
- **Secondary (Mountain Amber):** Reserved for high-priority actions, accents, and status indicators. It mimics the golden glow of Himalayan peaks at sunrise, injecting energy into the UI.
- **Neutral Surface:** A crisp "Snow White" background paired with "Asphalt Gray" borders ensures high contrast and clarity.
- **Semantic Logic:** Use Amber sparingly for "Active" trip states or "Booking" confirmations, while Navy handles "Static" information and structure.

## Typography

The typography system pairs the geometric strength of **Montserrat** with the humanist readability of **Open Sans**.

- **Headlines:** Montserrat is used for all headings to evoke a sense of bold adventure and structural integrity. Tighter letter-spacing is applied to larger display sizes to maintain impact.
- **Body & Data:** Open Sans handles all long-form text and trip details. Its open counters ensure maximum legibility even on smaller screens during outdoor use.
- **Labels:** Use bolded Open Sans for UI labels and metadata (e.g., "DEPARTURE TIME") to create a clear distinction from narrative body text.

## Layout & Spacing

This design system utilizes a **8px linear scaling system** to maintain rhythmic consistency. 

- **Grid:** A 4-column fluid grid for mobile and a 12-column fixed grid (max-width 1200px) for desktop.
- **Mobile Margins:** A strict 16px safe area is maintained on all mobile screens to ensure reachability and prevent content from hugging the edges of rugged phone cases.
- **Hierarchy:** Use larger vertical stacks (24px+) to separate distinct trip cards, while using tighter stacks (4px - 8px) for related metadata like "Driver Name" and "Vehicle Type."

## Elevation & Depth

Depth is used functionally to signify interactable elements and "stacking" of travel information.

- **Soft Shadows:** Interactive cards use a multi-layered shadow with low opacity (10-15%) and a large blur radius. This creates a "looming" effect rather than a harsh drop shadow, suggesting the card is a physical object.
- **Tonal Tiers:** The main background is `#F8F9FA`. Primary content cards are `#FFFFFF`. This subtle shift creates depth without needing heavy borders.
- **Active State:** When a user interacts with a card or button, the shadow should slightly decrease in blur and the element should scale down (98%), mimicking a physical press.

## Shapes

The shape language is defined by **Rounded (0.5rem)** corners. 

- **Containers:** All cards, input fields, and modals utilize the base 0.5rem (8px) radius.
- **Buttons:** Large action buttons (like "Book Trip") use the `rounded-lg` (1rem) setting to feel friendlier and more approachable.
- **Icons:** Transport icons should be housed within rounded-square enclosures to maintain a consistent silhouette across different vehicle shapes.

## Components

### Buttons
- **Primary:** Deep Navy background, White text. Use for "Post a Trip" or "Confirm."
- **Secondary:** Mountain Amber background, Ink Black text. Use for "Book Now" or "Join Group."
- **Ghost:** Transparent with Navy border. Use for "Cancel" or "Back."

### Travel Cards
Trip cards are the primary interface element. They should feature a "Tactile" white surface, 8px rounded corners, and a clear horizontal split:
- **Top Section:** Route details (Origin → Destination) using Montserrat Bold.
- **Bottom Section:** Metadata (Price, Seats Left, Transport Icon) using Open Sans.

### Transport Icons
Icons must be thick-stroked (2px) and rounded.
- **Bike:** Simplistic mountain bike silhouette.
- **Car/Cab:** Front-facing vehicle icon to distinguish between private and commercial.
- **Bus:** Tall, rectangular profile with multiple window segments.

### Inputs & Selection
- **Inputs:** Use a soft-gray border (1px) that turns Deep Navy on focus. 
- **Chips:** Small, pill-shaped tags for "Female Only," "Luggage Space," or "Pet Friendly," utilizing the Mountain Amber color at 10% opacity for the background.

### Status Indicators
- **Active/Confirmed:** Forest Green dots.
- **Full/Closed:** Asphalt Gray text.
- **Urgent/Leaving Soon:** Mountain Amber borders.