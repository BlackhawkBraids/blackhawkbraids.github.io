# NEON COMMAND GRID — Design Language Specification

Design system for the BlackhawkBraids AI Admin Dashboard.  
Referenced by: [`docs/architecture/admin-global-layout.md`](../architecture/admin-global-layout.md)

---

## Table of Contents

1. [Core Theme](#core-theme)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Grid Background](#grid-background)
5. [Starfield Particle Layer](#starfield-particle-layer)
6. [Glassmorphism Panels](#glassmorphism-panels)
7. [Glow & Border Tokens](#glow--border-tokens)
8. [Animation Tokens](#animation-tokens)
9. [Status Indicator System](#status-indicator-system)
10. [Neon Progress Bars](#neon-progress-bars)
11. [Animated Counters](#animated-counters)
12. [Corner Accent Components](#corner-accent-components)
13. [Sparkline Graphs](#sparkline-graphs)
14. [Responsive Breakpoints](#responsive-breakpoints)
15. [Tailwind CSS Design Tokens](#tailwind-css-design-tokens)
16. [CSS Custom Properties](#css-custom-properties)

---

## Core Theme

| Property | Value |
|----------|-------|
| **Theme name** | Neon Command Grid |
| **Background** | `#050510` — deep tactical black |
| **Primary accent** | `#ff003c` — neon red (critical / destructive alerts) |
| **Secondary accent** | `#00c3ff` — neon blue (system active / interactive) |
| **Highlight** | `#ffffff` with `0.9` opacity + glow — neon white accents |
| **Surface** | `rgba(255,255,255,0.04)` — glassmorphism panel base |
| **Border** | `rgba(0,195,255,0.25)` — default panel border |
| **Text primary** | `#e8f4ff` — near-white with cool tint |
| **Text secondary** | `rgba(232,244,255,0.55)` — dimmed labels |
| **Font family** | `Orbitron` (headings) · `Exo 2` (body) |

---

## Color Palette

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#050510` | Page / app background |
| `--color-surface` | `#0a0a1e` | Panel elevated surface |
| `--color-surface-2` | `#0f0f28` | Nested surface / input background |
| `--color-neon-red` | `#ff003c` | Critical alerts, destructive actions |
| `--color-neon-red-glow` | `rgba(255,0,60,0.35)` | Red glow shadow |
| `--color-neon-blue` | `#00c3ff` | Active state, interactive elements |
| `--color-neon-blue-glow` | `rgba(0,195,255,0.35)` | Blue glow shadow |
| `--color-neon-white` | `#e8f4ff` | Primary text, bright accents |
| `--color-neon-white-glow` | `rgba(232,244,255,0.15)` | Subtle white glow |
| `--color-neon-green` | `#00ff88` | Operational / success indicators |
| `--color-neon-green-glow` | `rgba(0,255,136,0.30)` | Green glow shadow |
| `--color-neon-orange` | `#ff8c00` | Warning indicators |
| `--color-neon-orange-glow` | `rgba(255,140,0,0.30)` | Orange glow shadow |
| `--color-grid-line` | `rgba(0,195,255,0.07)` | Background grid lines |

### Status Color Mapping

| State | Color | Glow | Usage |
|-------|-------|------|-------|
| Operational | `#00ff88` | `--color-neon-green-glow` | All systems green |
| Active | `#00c3ff` | `--color-neon-blue-glow` | System running / processing |
| Warning | `#ff8c00` | `--color-neon-orange-glow` | Degraded performance |
| Critical | `#ff003c` | `--color-neon-red-glow` | Failure or security event |
| Offline | `rgba(232,244,255,0.20)` | none | Inactive / disabled |

---

## Typography

### Font Families

```css
/* Load in global CSS or next/font */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap');
```

### Type Scale

| Level | Element | Font | Weight | Size | Letter Spacing | Color |
|-------|---------|------|--------|------|----------------|-------|
| Display | Hero titles | Orbitron | 900 | `2.5rem` | `0.12em` | `--color-neon-blue` |
| H1 | Page titles | Orbitron | 700 | `1.75rem` | `0.08em` | `--color-neon-white` |
| H2 | Panel titles | Orbitron | 600 | `1.125rem` | `0.06em` | `--color-neon-white` |
| H3 | Section labels | Orbitron | 500 | `0.875rem` | `0.08em` | `--color-neon-blue` |
| Body | Content | Exo 2 | 400 | `0.9375rem` | `0.01em` | `--color-neon-white` |
| Small | Supporting | Exo 2 | 300 | `0.8125rem` | `0.01em` | `rgba(232,244,255,0.55)` |
| Mono | Code / IDs | monospace | 400 | `0.8125rem` | `0.04em` | `--color-neon-blue` |
| Alert | Critical labels | Orbitron | 700 | `0.75rem` | `0.14em` | `--color-neon-red` |

### Typography Rules

- All headings are `uppercase`.
- Tracking on headings and labels is intentionally wide (`0.06em`–`0.14em`) for a tactical readout feel.
- Body text stays in `Exo 2` at readable sizes — **never below `0.8125rem` (13 px)**.
- Metric values (counters, percentages) use `Orbitron` at display weight for emphasis.

---

## Grid Background

A subtle animated tactical grid spans the full viewport behind all content.

### Implementation

```css
/* globals.css */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(var(--color-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid-line) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: grid-scroll 60s linear infinite;
  pointer-events: none;
}

@keyframes grid-scroll {
  0%   { background-position: 0 0; }
  100% { background-position: 0 48px; }
}
```

### Design Rules

- Grid cell size: `48 × 48 px`.
- Line color: `rgba(0,195,255,0.07)` — visible but never distracting.
- Scroll speed: 60 s for one full cell — imperceptibly slow.
- Grid sits at `z-index: 0`; all content sits at `z-index: 1` or above.

---

## Starfield Particle Layer

A micro-particle layer simulates a deep-space environment under the grid.

### Implementation (React component)

```tsx
// components/admin/effects/Starfield.tsx
'use client';
import { useEffect, useRef } from 'react';

interface Star { x: number; y: number; r: number; speed: number; opacity: number; }

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const STAR_COUNT = 160;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      speed: Math.random() * 0.15 + 0.03,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,244,255,${s.opacity})`;
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
```

### Design Rules

- `160` stars — enough for atmosphere, not enough to cause visual noise.
- Star radius: `0.2–1.4 px`.
- Drift speed: `0.03–0.18 px/frame` — nearly motionless.
- Opacity: `0.1–0.6` — subtle.
- Layer sits at `z-index: 0`, behind the grid and all panels.

---

## Glassmorphism Panels

Every dashboard panel uses a consistent glass treatment.

### Specification

| Property | Value |
|----------|-------|
| Background | `rgba(10,10,30,0.72)` |
| Backdrop filter | `blur(12px) saturate(1.4)` |
| Border | `1px solid rgba(0,195,255,0.18)` |
| Border radius | `12px` |
| Box shadow | `0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)` |
| Padding | `20px 24px` |
| Transition | `border-color 200ms ease, box-shadow 200ms ease` |

### Hover / Active State

```css
.panel-glass:hover {
  border-color: rgba(0, 195, 255, 0.40);
  box-shadow:
    0 4px 32px rgba(0, 0, 0, 0.55),
    0 0 24px rgba(0, 195, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

### Expanded / Fullscreen State

When a panel is expanded to fullscreen:

```css
.panel-glass--expanded {
  border-color: rgba(0, 195, 255, 0.60);
  box-shadow:
    0 0 48px rgba(0, 195, 255, 0.20),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
```

---

## Glow & Border Tokens

### Box Shadow Presets

| Token | Value | Usage |
|-------|-------|-------|
| `--glow-blue-sm` | `0 0 8px rgba(0,195,255,0.40)` | Small icon glow |
| `--glow-blue-md` | `0 0 20px rgba(0,195,255,0.35)` | Button / badge glow |
| `--glow-blue-lg` | `0 0 40px rgba(0,195,255,0.25)` | Panel active border |
| `--glow-red-sm` | `0 0 8px rgba(255,0,60,0.50)` | Alert icon glow |
| `--glow-red-md` | `0 0 20px rgba(255,0,60,0.45)` | Critical badge glow |
| `--glow-red-pulse` | *(keyframe — see animation)* | Strobe on critical |
| `--glow-green-sm` | `0 0 8px rgba(0,255,136,0.40)` | Status dot: operational |
| `--glow-green-md` | `0 0 20px rgba(0,255,136,0.30)` | Success badge glow |
| `--glow-orange-sm` | `0 0 8px rgba(255,140,0,0.40)` | Warning icon glow |

### Text Glow Presets

```css
.text-glow-blue  { text-shadow: 0 0 12px rgba(0, 195, 255, 0.80); }
.text-glow-red   { text-shadow: 0 0 12px rgba(255, 0, 60, 0.80); }
.text-glow-green { text-shadow: 0 0 12px rgba(0, 255, 136, 0.70); }
.text-glow-white { text-shadow: 0 0 10px rgba(232, 244, 255, 0.60); }
```

---

## Animation Tokens

### Duration & Easing

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `80ms` | Micro-interactions |
| `--duration-fast` | `150ms` | Button hover, badge flash |
| `--duration-normal` | `280ms` | Panel fade in / out |
| `--duration-slow` | `500ms` | Drawer slide, panel expand |
| `--duration-very-slow` | `800ms` | Counter roll-up |
| `--ease-neon` | `cubic-bezier(0.16,1,0.3,1)` | Spring-like snap feel |
| `--ease-linear` | `linear` | Continuous animations |

### Keyframes

```css
/* Status pulse — operational (green) */
@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 4px rgba(0,255,136,0.60); }
  50%       { box-shadow: 0 0 14px rgba(0,255,136,1.0), 0 0 28px rgba(0,255,136,0.40); }
}

/* Status pulse — active (blue) */
@keyframes pulse-blue {
  0%, 100% { box-shadow: 0 0 4px rgba(0,195,255,0.60); }
  50%       { box-shadow: 0 0 14px rgba(0,195,255,1.0), 0 0 28px rgba(0,195,255,0.40); }
}

/* Critical strobe — red */
@keyframes strobe-red {
  0%, 100% { box-shadow: 0 0 6px rgba(255,0,60,0.70); opacity: 1; }
  50%       { box-shadow: 0 0 22px rgba(255,0,60,1.0), 0 0 44px rgba(255,0,60,0.50); opacity: 0.85; }
}

/* Notification bell shake */
@keyframes bell-shake {
  0%, 100% { transform: rotate(0deg); }
  15%       { transform: rotate(-18deg); }
  30%       { transform: rotate(14deg); }
  45%       { transform: rotate(-10deg); }
  60%       { transform: rotate(6deg); }
  75%       { transform: rotate(-4deg); }
}

/* Panel corner accent scan */
@keyframes corner-scan {
  0%   { opacity: 0.4; }
  50%  { opacity: 1.0; }
  100% { opacity: 0.4; }
}

/* Active sidebar item border pulse */
@keyframes sidebar-active-pulse {
  0%, 100% { border-left-color: rgba(0,195,255,0.60); }
  50%       { border-left-color: rgba(0,195,255,1.0); }
}

/* Counter roll-up */
@keyframes count-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Animation Assignments

| Component | Animation | Duration | Iteration |
|-----------|-----------|----------|-----------|
| Green status dot | `pulse-green` | `2.4s` | `infinite` |
| Blue status dot | `pulse-blue` | `2s` | `infinite` |
| Red / critical dot | `strobe-red` | `0.8s` | `infinite` |
| Notification bell (alert pending) | `bell-shake` | `1s` | `3` then pause `5s` |
| Panel corner accents | `corner-scan` | `3s` | `infinite` |
| Active sidebar item | `sidebar-active-pulse` | `2s` | `infinite` |
| Metric counter on data update | `count-up` | `800ms` | `1` |

---

## Status Indicator System

Every agent, service, or metric uses a unified `StatusIndicator` dot.

### Dot Sizes

| Size | Diameter | Usage |
|------|----------|-------|
| `xs` | `6 px` | Sidebar nav dot |
| `sm` | `10 px` | Top bar agent dot |
| `md` | `14 px` | Panel card top-right |
| `lg` | `20 px` | Agent card primary indicator |

### Component Spec

```tsx
// components/admin/shared/StatusIndicator.tsx
type StatusLevel = 'operational' | 'active' | 'warning' | 'critical' | 'offline';

interface StatusIndicatorProps {
  status: StatusLevel;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
}
```

| `status` | Dot color | Animation |
|----------|-----------|-----------|
| `operational` | `#00ff88` | `pulse-green 2.4s infinite` |
| `active` | `#00c3ff` | `pulse-blue 2s infinite` |
| `warning` | `#ff8c00` | static (no animation) |
| `critical` | `#ff003c` | `strobe-red 0.8s infinite` |
| `offline` | `rgba(232,244,255,0.20)` | none |

---

## Neon Progress Bars

Used in the Production Flow panel and capacity indicators.

### Spec

```css
.progress-track {
  height: 6px;
  background: rgba(232, 244, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 600ms var(--ease-neon);
  position: relative;
}

/* Blue fill (normal) */
.progress-fill--blue {
  background: linear-gradient(90deg, rgba(0,195,255,0.6), #00c3ff);
  box-shadow: 0 0 10px rgba(0, 195, 255, 0.50);
}

/* Red fill (critical) — > 90 % capacity */
.progress-fill--red {
  background: linear-gradient(90deg, rgba(255,0,60,0.6), #ff003c);
  box-shadow: 0 0 10px rgba(255, 0, 60, 0.50);
}

/* Shimmer overlay */
.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(200%); }
}
```

### Threshold Colors

| Capacity | Fill class | Meaning |
|----------|-----------|---------|
| 0–69 % | `progress-fill--blue` | Normal |
| 70–89 % | `progress-fill--orange` | Elevated |
| ≥ 90 % | `progress-fill--red` | Critical |

---

## Animated Counters

Metric values animate when they change via WebSocket updates.

### Behavior

1. On data update, the old value fades down (`translateY(−6px) opacity → 0`).
2. The new value enters from below (`translateY(+6px) → 0, opacity 0 → 1`).
3. Duration: `400ms` with `--ease-neon`.
4. Currency values use `Intl.NumberFormat` for locale formatting.
5. Percentage values animate from old `%` to new `%` over `800ms` using a frame-by-frame interpolation.

### Implementation Reference

```tsx
// Framer Motion variant used in MetricCard.tsx
const counterVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2 } },
};
```

---

## Corner Accent Components

Every `PanelCard` renders four decorative corner accents — a thin L-shaped bracket in neon blue.

### CSS

```css
.panel-corner {
  position: absolute;
  width: 14px;
  height: 14px;
}
.panel-corner::before,
.panel-corner::after {
  content: '';
  position: absolute;
  background: #00c3ff;
  animation: corner-scan 3s ease-in-out infinite;
}
.panel-corner::before { width: 100%; height: 1.5px; top: 0; }
.panel-corner::after  { width: 1.5px; height: 100%; }

.panel-corner--tl { top: 8px;  left: 8px;  }
.panel-corner--tr { top: 8px;  right: 8px; transform: scaleX(-1); }
.panel-corner--bl { bottom: 8px; left: 8px;  transform: scaleY(-1); }
.panel-corner--br { bottom: 8px; right: 8px; transform: scale(-1); }
```

---

## Sparkline Graphs

Each panel card header includes a mini activity sparkline — `64 × 24 px`.

### Spec

| Property | Value |
|----------|-------|
| Library | `recharts` `<AreaChart>` (or SVG hand-drawn) |
| Size | `64 × 24 px` |
| Line color | `#00c3ff` |
| Fill gradient | `rgba(0,195,255,0.2) → transparent` |
| Stroke width | `1.5 px` |
| No axes | ✓ (axes hidden) |
| No tooltip | ✓ (no tooltip on mini) |
| Update animation | Smooth re-render with Recharts built-in transition |

---

## Responsive Breakpoints

| Breakpoint | Min width | Layout change |
|------------|-----------|---------------|
| `sm` | `640 px` | — |
| `md` | `768 px` | Sidebar collapses to icon-only rail |
| `lg` | `1024 px` | Full sidebar + 2-column panel grid |
| `xl` | `1280 px` | 3-column panel grid |
| `2xl` | `1536 px` | 4-column panel grid |

### Mobile Admin Mode (< 768 px)

- Sidebar collapses to a bottom navigation bar (icon-only, 5 most critical links).
- Panels stack vertically in a single column.
- Notification center opens as a full-screen sheet (swipeable down to dismiss).
- Top command bar shows only: Revenue Today, System Health %, Notification bell.
- Non-critical metric cards are hidden by default; revealed via "Show All" toggle.
- Alert-first: critical alerts always rendered at top of viewport with a persistent banner.

---

## Tailwind CSS Design Tokens

Extend `tailwind.config.ts`:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#050510',
        surface:  '#0a0a1e',
        surface2: '#0f0f28',
        'neon-red':    '#ff003c',
        'neon-blue':   '#00c3ff',
        'neon-green':  '#00ff88',
        'neon-orange': '#ff8c00',
        'neon-white':  '#e8f4ff',
      },
      fontFamily: {
        tactical: ['Orbitron', 'sans-serif'],
        body:     ['Exo 2', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue-sm':  '0 0 8px rgba(0,195,255,0.40)',
        'glow-blue-md':  '0 0 20px rgba(0,195,255,0.35)',
        'glow-blue-lg':  '0 0 40px rgba(0,195,255,0.25)',
        'glow-red-sm':   '0 0 8px rgba(255,0,60,0.50)',
        'glow-red-md':   '0 0 20px rgba(255,0,60,0.45)',
        'glow-green-sm': '0 0 8px rgba(0,255,136,0.40)',
        'glow-green-md': '0 0 20px rgba(0,255,136,0.30)',
        'glow-orange-sm':'0 0 8px rgba(255,140,0,0.40)',
        'panel':         '0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'grid-tactical':
          'linear-gradient(rgba(0,195,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,195,255,0.07) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-tactical': '48px 48px',
      },
      animation: {
        'pulse-green':        'pulse-green 2.4s ease-in-out infinite',
        'pulse-blue':         'pulse-blue 2s ease-in-out infinite',
        'strobe-red':         'strobe-red 0.8s ease-in-out infinite',
        'bell-shake':         'bell-shake 1s ease-in-out',
        'corner-scan':        'corner-scan 3s ease-in-out infinite',
        'sidebar-pulse':      'sidebar-active-pulse 2s ease-in-out infinite',
        'shimmer':            'shimmer 2s linear infinite',
        'grid-scroll':        'grid-scroll 60s linear infinite',
      },
      keyframes: {
        'pulse-green':  {
          '0%,100%': { boxShadow: '0 0 4px rgba(0,255,136,0.60)' },
          '50%':      { boxShadow: '0 0 14px rgba(0,255,136,1.0), 0 0 28px rgba(0,255,136,0.40)' },
        },
        'pulse-blue': {
          '0%,100%': { boxShadow: '0 0 4px rgba(0,195,255,0.60)' },
          '50%':      { boxShadow: '0 0 14px rgba(0,195,255,1.0), 0 0 28px rgba(0,195,255,0.40)' },
        },
        'strobe-red': {
          '0%,100%': { boxShadow: '0 0 6px rgba(255,0,60,0.70)', opacity: '1' },
          '50%':      { boxShadow: '0 0 22px rgba(255,0,60,1.0), 0 0 44px rgba(255,0,60,0.50)', opacity: '0.85' },
        },
        'bell-shake': {
          '0%,100%': { transform: 'rotate(0deg)' },
          '15%':     { transform: 'rotate(-18deg)' },
          '30%':     { transform: 'rotate(14deg)' },
          '45%':     { transform: 'rotate(-10deg)' },
          '60%':     { transform: 'rotate(6deg)' },
          '75%':     { transform: 'rotate(-4deg)' },
        },
        'corner-scan':       { '0%,100%': { opacity: '0.4' }, '50%': { opacity: '1.0' } },
        'sidebar-active-pulse': {
          '0%,100%': { borderLeftColor: 'rgba(0,195,255,0.60)' },
          '50%':     { borderLeftColor: 'rgba(0,195,255,1.0)' },
        },
        'shimmer': {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(200%)' },
        },
        'grid-scroll': {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 48px' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## CSS Custom Properties

Define all design tokens in `globals.css`:

```css
/* app/globals.css */
:root {
  /* Colors */
  --color-bg:              #050510;
  --color-surface:         #0a0a1e;
  --color-surface-2:       #0f0f28;
  --color-neon-red:        #ff003c;
  --color-neon-red-glow:   rgba(255, 0, 60, 0.35);
  --color-neon-blue:       #00c3ff;
  --color-neon-blue-glow:  rgba(0, 195, 255, 0.35);
  --color-neon-white:      #e8f4ff;
  --color-neon-white-glow: rgba(232, 244, 255, 0.15);
  --color-neon-green:      #00ff88;
  --color-neon-green-glow: rgba(0, 255, 136, 0.30);
  --color-neon-orange:     #ff8c00;
  --color-neon-orange-glow:rgba(255, 140, 0, 0.30);
  --color-grid-line:       rgba(0, 195, 255, 0.07);

  /* Glow shadows */
  --glow-blue-sm:  0 0 8px  rgba(0, 195, 255, 0.40);
  --glow-blue-md:  0 0 20px rgba(0, 195, 255, 0.35);
  --glow-blue-lg:  0 0 40px rgba(0, 195, 255, 0.25);
  --glow-red-sm:   0 0 8px  rgba(255, 0, 60, 0.50);
  --glow-red-md:   0 0 20px rgba(255, 0, 60, 0.45);
  --glow-green-sm: 0 0 8px  rgba(0, 255, 136, 0.40);
  --glow-green-md: 0 0 20px rgba(0, 255, 136, 0.30);
  --glow-orange-sm:0 0 8px  rgba(255, 140, 0, 0.40);

  /* Typography */
  --font-tactical: 'Orbitron', sans-serif;
  --font-body:     'Exo 2', sans-serif;

  /* Animation */
  --duration-instant:   80ms;
  --duration-fast:      150ms;
  --duration-normal:    280ms;
  --duration-slow:      500ms;
  --duration-very-slow: 800ms;
  --ease-neon:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-linear: linear;
}
```
