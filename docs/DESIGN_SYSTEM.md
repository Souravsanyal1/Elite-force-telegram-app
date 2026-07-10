# Elite Force (EFC) - Product Design System v2.0
> **Target Theme:** Premium • Futuristic • Web3 • Luxury • Cinematic
> **Avoid:** Oversaturated AI-style neon gradients, cheap gaming assets, and low-contrast flat structures.
> **Emphasize:** Layered glassmorphism, cinematic lighting, rich micro-animations, and clean, enterprise-grade layouts.

---

## 1. Brand Identity & Visual Rules

### Color System (Hex & RGBA / HSL)
| Token | Variable | Value | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| **Bg Primary** | `--bg-primary` | `#050816` | Main deep cinematic space background |
| **Bg Secondary** | `--bg-secondary` | `#0E1225` | Nested sections, sidebars, dashboard blocks |
| **Surface** | `--surface` | `#12182D` | Cards, popups, and solid inputs |
| **Glass** | `--glass` | `rgba(255, 255, 255, 0.05)` | Frosting layer (requires 30px backdrop-filter blur) |
| **Glass Border** | `--glass-border` | `rgba(255, 255, 255, 0.08)` | Subtly frames glass components |
| **Overlay** | `--overlay` | `rgba(0, 0, 0, 0.35)` | Behind popups, drawers, and loaders |
| **Primary Accent** | `--accent-primary` | `#00E5FF` | Cyan - Primary actions, active highlights, key values |
| **Secondary Accent**| `--accent-secondary` | `#4D8CFF` | Cool Blue - Progress lines, informational badges |
| **Premium Purple** | `--accent-purple` | `#B388FF` | Lavender/Violet - Referrals, Premium status highlights |
| **Success** | `--accent-success` | `#00FF88` | Emerald - Claim statuses, success checkmarks |
| **Warning** | `--accent-warning` | `#FFC857` | Amber - Cautionary warnings, pending items |
| **Danger** | `--accent-danger` | `#FF4D6D` | Crimson - Errors, delete, risk scores, ban actions |
| **USDT** | `--accent-usdt` | `#26A17B` | Teal - Tether balance and transactions |
| **Gold** | `--accent-gold` | `#FFD700` | Golden Yellow - Achievements, Trophies, Rank |

### Glow Effects (Box Shadows)
Use glows sparingly (mostly on hover/active or high-importance alerts) to maintain enterprise visual hierarchy:
- **Cyan Glow:** `0 0 40px rgba(0, 229, 255, 0.12)`
- **Purple Glow:** `0 0 40px rgba(179, 136, 255, 0.12)`
- **Green Glow:** `0 0 40px rgba(0, 255, 136, 0.08)`
- **Gold Glow:** `0 0 40px rgba(255, 215, 0, 0.08)`

---

## 2. Tailwind CSS v4 Configuration & Base Styles

In Tailwind CSS v4, theme properties are configured directly in your entry CSS file using the `@theme` directive.

```css
@theme {
  --color-bg-primary: #050816;
  --color-bg-secondary: #0E1225;
  --color-surface: #12182D;
  --color-glass: rgba(255, 255, 255, 0.05);
  --color-glass-border: rgba(255, 255, 255, 0.08);
  --color-overlay: rgba(0, 0, 0, 0.35);

  --color-accent-cyan: #00E5FF;
  --color-accent-blue: #4D8CFF;
  --color-accent-purple: #B388FF;
  --color-accent-success: #00FF88;
  --color-accent-warning: #FFC857;
  --color-accent-danger: #FF4D6D;
  --color-accent-usdt: #26A17B;
  --color-accent-gold: #FFD700;

  --font-display: "SF Pro Display", "Plus Jakarta Sans", sans-serif;
  --font-sans: "Inter", "Plus Jakarta Sans", sans-serif;

  --radius-btn: 18px;
  --radius-card: 24px;
  --radius-popup: 28px;
  --radius-input: 16px;

  --animate-aurora: aurora-spin 20s linear infinite;
  --animate-float: float 6s ease-in-out infinite;
  --animate-pulse-slow: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes aurora-spin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.2); }
    100% { transform: rotate(360deg) scale(1); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
  }
}

/* Glassmorphism utility classes */
.glass-panel {
  background: var(--color-glass);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid var(--color-glass-border);
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.35);
}

.glass-card-interactive {
  composes: glass-panel;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass-card-interactive:hover {
  transform: translateY(-4px) scale(1.01);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 24px 85px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(0, 229, 255, 0.08);
}

.glass-btn {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-btn);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.4);
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.15);
}

/* Noise overlay */
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0%200%20200%20200'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter%20id='noiseFilter'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.65'%20numOctaves='3'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.02;
  z-index: 999;
}
```

---

## 3. Visual Quality Constraints & Strict Guardrails
To prevent AI engines and web development builders from falling back to generic, over-saturated layouts:

1. **Enterprise Layout Proportions:** 
   - Never use tight margins. Keep padding on cards at `24px` (`p-6`) and modal padding at `32px` (`p-8`).
   - Use clean, linear layout structures. Elements should align perfectly on a grid.
2. **Restrained Glows:** 
   - Never apply glows globally to all panels. Limit glows exclusively to interactive active-states, selected navigation indicators, and action success overlays.
3. **No Cartoon/Flat UI Elements:**
   - Icons should be clean vector outline structures (Lucide, HugeIcons) with subtle, translucent gradient fills rather than blocky flat fills.
   - 3D elements must use realistic metallic, glass, or gold textures.
4. **Cinematic Depth Background:**
   - The background must always have depth. Use a fixed dark background (`#050816`) overlayed with a circular mesh gradient (`radial-gradient(circle at top, #0E1225 0%, #050816 70%)`) and an organic animate-slow glowing aurora (`#12182D` or `#4D8CFF` at 5% opacity).

---

## 4. Copy-Paste Prompts for AI Builders (Lovable, Bolt, Claude, Cursor)

When using an AI coding assistant to create pages, copy and paste the system instructions below to enforce visual alignment:

```markdown
### SYSTEM ROLE & INSTRUCTIONS FOR UI GENERATION
You are an expert frontend engineer tasked with building pages for "Elite Force (EFC)" - a Telegram Mini App.
You must adhere strictly to the following visual design principles:

1. THEME & COLORS:
   - Primary dark background: #050816 (Deep Space).
   - Card surfaces: Dark Glassmorphic with rgba(255,255,255,0.05) and 1px border of rgba(255,255,255,0.08). Backdrop blur 30px.
   - Text colors: White/Off-white for headings, soft gray (#94A3B8) for secondary text.
   - Accents (ONLY use to denote state/actions, never for general decor):
     * Cyan (#00E5FF) for primary highlights/links/interactive status.
     * Soft Blue (#4D8CFF) for info.
     * Premium Purple (#B388FF) for rewards and VIP states.
     * Success Green (#00FF88) for completed items.
     * Danger Red (#FF4D6D) for high-risk warnings or bans.

2. AESTHETICS TO AVOID (CRITICAL):
   - NO bright, oversaturated full-gradient backgrounds. No rainbow color palettes.
   - NO thick, cartoon-style border strokes. Keep borders at thin 1px glass overlays.
   - NO generic flat crypto button styles. Keep them glassmorphic, responsive on hover/scale.
   - Do NOT invent colors outside of this token set.

3. LAYOUT & SPACING:
   - App width is locked to mobile viewports (390px - 430px) to simulate a high-end Telegram Mini App experience, centered on desktop.
   - Floating navigation bar at the bottom with a frosted glass backdrop filter.
   - Smooth entry animations using Framer Motion (opacity, slide-up, scale-in, spring easing).
```

---

## 5. UI View Specs

### A. Home Dashboard
- **Hero Element:** Rotatable 3D Coin (representing EFC) positioned at the center, spinning slowly with reflections.
- **Wallet Cards:** Stacked grid with clean digital-style font representing EFC and USDT balances.
- **Interactive Check-In:** Premium Daily Rewards grid showing progress with custom checkmarks.

### B. Interactive Tasks
- **Categories:** Grouped by Social, Premium, and Engagement.
- **Interactive States:** Verification triggers a circular progress spinner, followed by a green glowing success badge and a count-up for EFC points.

### C. Luxury Wallet Popup
- **Safety Vault Mockup:** Dynamic interactive PIN entry popup representing withdrawal authorization.
- **Visuals:** Green glow, particle success explosions, and safe door lock animations.
