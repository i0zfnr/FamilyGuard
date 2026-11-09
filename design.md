# XennGuard Design System & Optical Material Architecture

**Specification Version**: 1.0.0  
**Status**: Approved Specification  
**Conformance**: Apple HIG Liquid Glass (iOS 26/27 Aesthetics), WCAG 2.1 AA/AAA, Anti-Slop Directive, Zero-Emoji Standard

---

## 1. Executive Design Philosophy

XennGuard is an enterprise-grade family and device protection platform engineered around cryptographic device identity, mutual consent, transparent active indicators, and high-performance cross-platform agents.

The visual interface reflects these core engineering values:
1. **Calm Authority & Focus**: Grounded in Atmospheric Obsidian (`#0B0F19`), the interface creates a disciplined visual environment devoid of visual noise, garish neon gradients, or artificial AI decorations.
2. **Apple HIG Liquid Glass Optics**: Employs authentic Liquid Glass physics—directional light refraction, Snell's law edge distortion, specular rim reflections, and backdrop saturation boost—strictly reserved for floating chrome and navigation platters.
3. **Platters, Not Wrappers**: Liquid Glass hovers above content. Data cards, telemetry charts, tables, and settings sit on **solid, high-contrast surfaces** (`#111827`) to guarantee optical clarity and zero reading fatigue.
4. **Never Glass on Glass**: Refractive glass components are never nested inside refractive glass containers. Controls on platters use solid fills, flat opacity, or clean vibrancy overlays.
5. **Strict Zero-Emoji Policy**: Zero emojis anywhere in the user interface, alerts, buttons, or documentation. 100% professional vector icons with consistent 1.5px/2.0px stroke geometry.
6. **Accessibility First**: Every color pairing is mathematically certified for WCAG AA compliance (body text ≥ 4.5:1, graphics ≥ 3:1), supported by robust fallbacks for `prefers-reduced-transparency` and `prefers-reduced-motion`.

---

## 2. Complete Design Token Tables

### 2.1 Palette Tokens

#### Canvas & Atmospheric Depth
| Token Name | CSS Custom Property | Value | Role & Description |
| :--- | :--- | :--- | :--- |
| `canvas-bg` | `--color-canvas-bg` | `#0B0F19` | Root page canvas (Atmospheric Twilight Obsidian) |
| `canvas-subtle` | `--color-canvas-subtle` | `#0D1322` | Alternate section background |
| `ambient-slate` | `--color-ambient-slate` | `rgba(30, 41, 59, 0.45)` | Depth orb top-left (Atmospheric ambient diffuse) |
| `ambient-indigo` | `--color-ambient-indigo` | `rgba(30, 27, 75, 0.35)` | Depth orb bottom-right (Atmospheric subtle glow) |

#### Content Surfaces (Solid Non-Glass Layer)
| Token Name | CSS Custom Property | Value | Role & Description |
| :--- | :--- | :--- | :--- |
| `surface-card` | `--color-surface-card` | `#111827` | Primary content cards, device modules (never glass) |
| `surface-card-hover` | `--color-surface-card-hover` | `#151E30` | Hover state for interactive cards |
| `surface-card-elevated`| `--color-surface-card-elevated`| `#1A2234` | Sub-sections, telemetry stat containers |
| `surface-card-border` | `--color-surface-card-border` | `#1F293D` | 1px border on solid content cards |
| `surface-card-border-subtle`| `--color-surface-card-border-subtle`| `#162032`| Internal divider lines inside cards |

#### Form Controls & Inputs
| Token Name | CSS Custom Property | Value | Role & Description |
| :--- | :--- | :--- | :--- |
| `surface-input` | `--color-surface-input` | `#0A0E17` | Input field background |
| `surface-input-border` | `--color-surface-input-border`| `#334155` | Input default border (1px solid) |
| `surface-input-focus` | `--color-surface-input-focus` | `#2563EB` | Active focused input border |
| `surface-input-ring` | `--color-surface-input-ring` | `rgba(37, 99, 235, 0.35)` | Accessible focus outline ring |
| `surface-input-placeholder`| `--color-surface-input-placeholder`| `#64748B` | Input placeholder text |

#### Brand Actions & Accents
| Token Name | CSS Custom Property | Value | Role & Description |
| :--- | :--- | :--- | :--- |
| `brand-primary` | `--color-brand-primary` | `#2563EB` | Cobalt 600 primary CTA buttons & active highlights |
| `brand-primary-hover`| `--color-brand-primary-hover`| `#1D4ED8` | Cobalt 700 button hover state |
| `brand-primary-active`| `--color-brand-primary-active`| `#1E40AF` | Cobalt 800 button active/press state |
| `brand-primary-subtle`| `--color-brand-primary-subtle`| `rgba(37, 99, 235, 0.15)`| Primary tinted icon platter / soft badge |
| `brand-primary-border`| `--color-brand-primary-border`| `rgba(37, 99, 235, 0.35)`| Border for primary tinted containers |
| `accent-sky` | `--color-accent-sky` | `#38BDF8` | Sky 400 secondary accent, telemetry links |
| `accent-sky-subtle` | `--color-accent-sky-subtle` | `rgba(56, 189, 248, 0.12)` | Secondary badge background |

#### Semantic Status Indicators
| Token Name | CSS Custom Property | Value | Role & Description |
| :--- | :--- | :--- | :--- |
| `status-online` | `--color-status-online` | `#10B981` | Emerald 500: Device connected, active heartbeat |
| `status-online-bg` | `--color-status-online-bg` | `rgba(16, 185, 129, 0.12)` | Online status badge background |
| `status-online-border`| `--color-status-online-border`| `rgba(16, 185, 129, 0.30)`| Online status badge border |
| `status-online-glow` | `--color-status-online-glow` | `rgba(16, 185, 129, 0.40)` | Active pulse indicator shadow |
| `status-warning` | `--color-status-warning` | `#F59E0B` | Amber 500: Low battery, challenge expiring soon |
| `status-warning-bg`| `--color-status-warning-bg`| `rgba(245, 158, 11, 0.12)` | Warning status badge background |
| `status-warning-border`| `--color-status-warning-border`| `rgba(245, 158, 11, 0.30)`| Warning status badge border |
| `status-critical` | `--color-status-critical` | `#EF4444` | Red 500: Device revoked, offline alert, auth error |
| `status-critical-bg`| `--color-status-critical-bg`| `rgba(239, 68, 68, 0.12)` | Critical status badge background |
| `status-critical-border`| `--color-status-critical-border`| `rgba(239, 68, 68, 0.30)`| Critical status badge border |
| `status-neutral` | `--color-status-neutral` | `#94A3B8` | Slate 400: Paused, unconfigured, idle |
| `status-neutral-bg`| `--color-status-neutral-bg`| `rgba(148, 163, 184, 0.10)`| Neutral status badge background |
| `status-neutral-border`| `--color-status-neutral-border`| `rgba(148, 163, 184, 0.25)`| Neutral status badge border |

#### Typography Colors
| Token Name | CSS Custom Property | Value | Role & Description |
| :--- | :--- | :--- | :--- |
| `text-primary` | `--color-text-primary` | `#F8FAFC` | Slate 50: Headings, primary data, high emphasis |
| `text-secondary` | `--color-text-secondary` | `#94A3B8` | Slate 400: Subtitles, field labels, descriptions |
| `text-muted` | `--color-text-muted` | `#64748B` | Slate 500: Timestamps, hints, inactive labels |
| `text-inverse` | `--color-text-inverse` | `#FFFFFF` | Pure white: Text inside Cobalt primary buttons |

---

### 2.3 Dashboard Layout Architecture: Linear + Vercel High-Density Pattern

Based on developer-grade workflows (Linear, Vercel, Raycast), XennGuard rejects generic AI dashboard tropes (giant space-wasting greetings, bulbous 3-column cards, decorative gradients) in favor of high-density clarity:

1. **Structured Left Sidebar (240px)**:
   - Header with compact logo platter (`#1E293B`, 32×32px), "XennGuard" title, search trigger, and user avatar pill ("IH").
   - `WORKSPACE` section label (11px uppercase, tracking `0.05em`, `#71717A`).
   - Compact navigation items (`Devices`, `Activity`, `Security`, `Settings`) with subtle active highlights (`#18181B`).

2. **High-Density Metric Bar**:
   - Replaces decorative cards with 3 compact stat blocks (`Total 03`, `Online 00`, `Alerts 03`) with subtle 1px border (`#1E293B`) and clear typography.

3. **Compact Device Table Rows**:
   - Replaces giant cards with structured table rows separated by 1px hairline dividers (`#18181B`).
   - Clear columns: `DEVICE` (hardware icon + name + platform/model) and `STATUS` (8px status dot + semantic label: `Revoked`, `Warning`, `Online`).

4. **Floating Chrome Isolation**:
   - Liquid Glass is strictly reserved for the floating Raycast-inspired command bar (`⌘K` search palette) and modal confirmation platters. Content surfaces remain solid `#0C0E14` / `#111827`.

Liquid Glass is strictly reserved for floating chrome: `HeaderPlatter`, floating action buttons, floating segmented controls, and modal platter containers.

```css
:root {
  /* Liquid Glass Core Parameters */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-bg-hover: rgba(255, 255, 255, 0.12);
  --glass-bg-active: rgba(255, 255, 255, 0.16);
  --glass-border: 1px solid rgba(255, 255, 255, 0.20);
  --glass-border-hover: 1px solid rgba(255, 255, 255, 0.30);
  --glass-blur: 28px;
  --glass-saturate: 180%;

  /* Liquid Glass Specular & Refraction Optics */
  --glass-inner-rim: inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.45);
  --glass-inner-shadow: inset 0 -1px 2px 0 rgba(0, 0, 0, 0.20);
  --glass-drop-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.40);

  /* Modal Platter Spec (Dark Frosted Glass Platter) */
  --glass-modal-bg: rgba(17, 24, 39, 0.88);
  --glass-modal-border: 1px solid rgba(255, 255, 255, 0.15);
  --glass-modal-blur: 32px;
  --glass-modal-saturate: 190%;
  --glass-modal-shadow: inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.35), 0 24px 64px -8px rgba(0, 0, 0, 0.65);
}
```

#### CSS Implementation Class
```css
.liquid-glass-platter {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: var(--glass-border);
  box-shadow: var(--glass-inner-rim), var(--glass-inner-shadow), var(--glass-drop-shadow);
  border-radius: var(--radius-pill);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.liquid-glass-platter:hover {
  background: var(--glass-bg-hover);
  border: var(--glass-border-hover);
}
```

---

### 2.3 Typography Scale & Hierarchy

- **Primary Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif`
- **Monospace Font Family**: `'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace`

| Scale Name | CSS Class | Size / Rem | Line Height | Tracking | Weight | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display` | `.type-display` | 48px / 3.0rem | 1.15 | -0.03em | 700 Bold | Hero display headlines |
| `h1` | `.type-h1` | 32px / 2.0rem | 1.20 | -0.025em | 700 Bold | Top-level dashboard page titles |
| `h2` | `.type-h2` | 24px / 1.5rem | 1.25 | -0.02em | 600 SemiBold| Section titles, card modal headers |
| `h3` | `.type-h3` | 18px / 1.125rem | 1.30 | -0.015em | 600 SemiBold| Device name, chart module title |
| `body-lg` | `.type-body-lg` | 16px / 1.0rem | 1.50 | -0.01em | 400 Regular | Lead paragraphs, intro descriptions |
| `body-base`| `.type-body-base`| 14px / 0.875rem | 1.50 | -0.006em| 400 Regular | Standard body text, form labels |
| `body-sm` | `.type-body-sm` | 13px / 0.8125rem| 1.45 | 0 | 400 Regular | Secondary notes, telemetry metrics |
| `caption` | `.type-caption` | 12px / 0.75rem | 1.40 | +0.01em | 500 Medium | Timestamps, hardware specs, hints |
| `micro` | `.type-micro` | 11px / 0.6875rem| 1.35 | +0.04em | 600 SemiBold| Status badge labels, pill text |

> **Anti-Slop Rule**: Never use arbitrary tracked-out all-caps headings (`YOUR SPACE`, `GET CONNECTED`). Use natural sentence case or title case.

---

### 2.4 Spacing Scale

Built on a strict 4px baseline grid:

| Token Name | Pixels | Rem | Canonical Usage |
| :--- | :--- | :--- | :--- |
| `--space-1` | 4px | 0.25rem | Icon gaps, tight padding inside micro pills |
| `--space-2` | 8px | 0.50rem | Gap between badge icon and text, compact gutters |
| `--space-3` | 12px | 0.75rem | Space between form label and input |
| `--space-4` | 16px | 1.00rem | Standard container internal padding, button X padding |
| `--space-5` | 20px | 1.25rem | Card internal padding (compact) |
| `--space-6` | 24px | 1.50rem | Standard device card padding, grid gap |
| `--space-8` | 32px | 2.00rem | Section margin, header platter padding |
| `--space-10` | 40px | 2.50rem | Large section spacing |
| `--space-12` | 48px | 3.00rem | Hero section margin |
| `--space-16` | 64px | 4.00rem | Major layout blocks |
| `--space-20` | 80px | 5.00rem | Top viewport clearance for floating header |

---

### 2.5 Border Radii & Concentricity

Apple HIG concentric curvature formula:  
$$\text{Radius}_{\text{outer}} = \text{Radius}_{\text{inner}} + \text{Padding}$$

| Token Name | Value | Usage |
| :--- | :--- | :--- |
| `--radius-sm` | 6px | Micro pills, tooltips |
| `--radius-md` | 10px | Form inputs, secondary buttons |
| `--radius-lg` | 14px | Primary CTA buttons, icon containers |
| `--radius-xl` | 18px | Telemetry chart containers, sub-panels |
| `--radius-2xl`| 24px | Solid device cards, authentication card |
| `--radius-pill`| 9999px | Floating header platter, status chips, segmented controls |

---

### 2.6 Shadows & Elevation

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--shadow-card` | `0 4px 20px -2px rgba(0, 0, 0, 0.40)` | Resting elevation for solid `#111827` cards |
| `--shadow-card-hover` | `0 8px 30px -4px rgba(0, 0, 0, 0.55)` | Hover elevation for interactive device cards |
| `--shadow-glass-platter`| `0 16px 36px -4px rgba(0, 0, 0, 0.40)` | Floating header platter drop shadow |
| `--shadow-modal` | `0 24px 64px -8px rgba(0, 0, 0, 0.65)` | Enrollment modal elevation over dark backdrop |
| `--focus-ring` | `0 0 0 3px rgba(37, 99, 235, 0.45)` | High-contrast accessible focus ring |

---

## 3. WCAG AA Contrast Validation Matrix

All values calculated mathematically against solid card `#111827` and canvas `#0B0F19`:

| Element | Foreground Hex | Background Hex | Contrast Ratio | WCAG Standard | Compliance Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Text (Canvas)** | `#F8FAFC` | `#0B0F19` | **18.30:1** | $\ge 7.0:1$ (AAA) | **PASS (AAA)** |
| **Primary Text (Card)** | `#F8FAFC` | `#111827` | **16.96:1** | $\ge 7.0:1$ (AAA) | **PASS (AAA)** |
| **Secondary Text (Canvas)**| `#94A3B8` | `#0B0F19` | **7.47:1** | $\ge 4.5:1$ (AA) | **PASS (AAA)** |
| **Secondary Text (Card)** | `#94A3B8` | `#111827` | **6.92:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |
| **White Text on Cobalt CTA**| `#FFFFFF` | `#2563EB` | **5.17:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |
| **Primary Text on Cobalt** | `#F8FAFC` | `#2563EB` | **4.94:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |
| **Online Indicator** | `#10B981` | `#111827` | **6.99:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |
| **Warning Indicator** | `#F59E0B` | `#111827` | **8.26:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |
| **Critical Indicator** | `#EF4444` | `#111827` | **4.71:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |
| **Sky Accent on Card** | `#38BDF8` | `#111827` | **8.28:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |
| **Muted Text / UI Hint** | `#64748B` | `#111827` | **3.73:1** | $\ge 3.0:1$ (UI AA)| **PASS (AA)** |
| **Platter Text Primary** | `#F8FAFC` | `#1F222B` (comp)| **15.18:1** | $\ge 7.0:1$ (AAA) | **PASS (AAA)** |
| **Platter Text Secondary** | `#94A3B8` | `#1F222B` (comp)| **6.20:1** | $\ge 4.5:1$ (AA) | **PASS (AA)** |

---

## 4. Accessibility Fallbacks & Media Queries

### 4.1 Reduced Transparency Fallback (`prefers-reduced-transparency: reduce`)
For users with vision sensitivity, motion sickness, or cognitive load needs:
```css
@media (prefers-reduced-transparency: reduce) {
  :root {
    --glass-bg: #0F172A; /* Solid opaque high-contrast navy */
    --glass-bg-hover: #1E293B;
    --glass-blur: 0px;
    --glass-saturate: 100%;
    --glass-border: 1px solid #334155;
    --glass-inner-rim: none;
    --glass-inner-shadow: none;
    --glass-drop-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

    --glass-modal-bg: #0F172A;
    --glass-modal-blur: 0px;
    --glass-modal-border: 1px solid #475569;
  }
}
```

### 4.2 Reduced Motion Fallback (`prefers-reduced-motion: reduce`)
Disables fluid morphing, spring inertia, and multi-axis transitions:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 4.3 Light Theme Alternative Tokens
When light theme is enabled:
```css
[data-theme="light"] {
  --color-canvas-bg: #F8FAFC;
  --color-canvas-subtle: #F1F5F9;
  --color-surface-card: #FFFFFF;
  --color-surface-card-hover: #F8FAFC;
  --color-surface-card-border: #E2E8F0;
  --color-surface-input: #FFFFFF;
  --color-surface-input-border: #CBD5E1;
  --color-text-primary: #0F172A;    /* Contrast 16.9:1 */
  --color-text-secondary: #475569;  /* Contrast 5.9:1 */
  --color-text-muted: #64748B;      /* Contrast 4.5:1 */
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: 1px solid rgba(0, 0, 0, 0.10);
  --glass-inner-rim: inset 0 1px 1px rgba(255, 255, 255, 0.90);
  --glass-drop-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}
```

---

## 5. Strict Zero-Emoji Policy & Vector Icon Registry

### 5.1 Enforcement Mandate
- **Zero Emojis**: Emojis are strictly prohibited in user-facing UI, alerts, buttons, navigation, headings, cards, and automated notifications.
- **Icon Library**: Exclusively use **Phosphor Icons** (`@phosphor-icons/react`) or Lucide vector icons.
- **Stroke Uniformity**: Consistent `1.5px` or `2.0px` stroke weight across the application.
- **Accessibility**: All icons must have `aria-hidden="true"` when accompanied by text, or an explicit `aria-label` when serving as standalone buttons.

### 5.2 Canonical Vector Icon Registry

| Semantic Category | Concept / Action | Phosphor Icon Component | SVG Element Reference |
| :--- | :--- | :--- | :--- |
| **Brand & Security** | Brand Shield | `<ShieldCheck weight="duotone" />` | Security shield with checkmark |
| | Cryptographic Key | `<Key weight="regular" />` | RSA identity key proof |
| | Security Lock | `<LockSimple weight="regular" />` | Device credential protection |
| | QR Enrollment | `<QrCode weight="regular" />` | Pairing challenge QR code |
| | Audit Trail | `<ClipboardText weight="regular" />` | Security audit logging |
| **Device Platforms** | Android Device | `<AndroidLogo weight="regular" />` | Android platform icon |
| | Windows Device | `<WindowsLogo weight="regular" />` | Windows platform icon |
| | Web / Browser | `<Globe weight="regular" />` | Web dashboard |
| **Device Status** | Device Online | `<CheckCircle weight="fill" />` | Connected / healthy status |
| | Device Warning | `<Warning weight="fill" />` | Expiring challenge / warning |
| | Device Revoked | `<XCircle weight="fill" />` | Revoked or blocked device |
| | Active Heartbeat | `<Pulse weight="bold" />` | Live heartbeat ping |
| **Telemetry History**| Battery Charging | `<BatteryCharging weight="regular" />` | Charging status |
| | Battery Level | `<BatteryHigh weight="regular" />` | Battery percentage indicator |
| | Storage Drive | `<HardDrive weight="regular" />` | Total / available storage |
| | WiFi Network | `<WifiHigh weight="regular" />` | Wireless connectivity |
| | Cellular Network | `<CellSignalFull weight="regular" />` | Cellular data connectivity |
| | Wired Network | `<Ethernet weight="regular" />` | Ethernet wired connection |
| **User & Actions** | Add Device | `<Plus weight="bold" />` | Pair new device CTA |
| | Revoke / Delete | `<Trash weight="regular" />` | Revoke device credentials |
| | Account Settings | `<Gear weight="regular" />` | User preferences |
| | Sign Out | `<SignOut weight="regular" />` | Authentication sign out |
| | Refresh / Sync | `<ArrowClockwise weight="regular" />`| Force telemetry refresh |
| | Navigation Next | `<CaretRight weight="bold" />` | Chevron forward |

### 5.3 Automated Zero-Emoji Verification Regex
Continuous test suites and code linters must execute the following AST/regex rule to verify zero unicode emojis exist in source code or UI mockups:
```regex
[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]
```
Any match flags a blocking test failure.

---

## 6. Core Component Architecture

### 6.1 `HeaderPlatter` (Floating Navigation Chrome)
- **Role**: Hovers centered at the top of the viewport (`top: 24px`, `z-index: 50`).
- **Dimensions**: `height: 56px`, max-width `1280px`, `width: calc(100% - 48px)`.
- **Styling**: `border-radius: 9999px`, `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-saturate`, `--glass-inner-rim`.
- **Internal Structure**:
  - Left: Brand icon platter (Cobalt `#2563EB`, radius 8px) + Brand typography "XennGuard".
  - Center: Segmented navigation pills (`Devices`, `Audit Log`, `Settings`).
  - Right: Server Health indicator dot (`#10B981`) + User Profile pill + Sign Out icon button.

### 6.2 `DeviceCard` (Solid Content Surface)
- **Role**: Displays individual enrolled device status and telemetry summary.
- **Styling**: Solid surface (`background: #111827`), `border: 1px solid #1F293D`, `border-radius: 20px`, `padding: 24px`.
- **No Glass Antipattern**: Does NOT use backdrop blur. Card interior is solid to maintain crisp typography.
- **Internal Elements**:
  - Header: Platform vector icon box (Android / Windows), Device Name (`text-primary`), Platform badge.
  - Status Row: Status badge (`Online`, `Warning`, `Revoked`) with glowing active pulse dot.
  - Telemetry Bar: Visual battery percentage bar, storage consumption indicator, last heartbeat timestamp.
  - Action Footer: "View History" link (`#38BDF8`) and "Revoke" button with destructive confirmation dialog.

### 6.3 `TelemetryVisualizer` (Time-Series Charts)
- **Role**: Renders battery drain curve, storage breakdown, and network history.
- **Styling**: Solid container (`#111827`) with dark gridlines (`#1F293D`).
- **Graph Colors**:
  - Battery discharge polyline: Cobalt `#2563EB` with subtle gradient fill (`rgba(37, 99, 235, 0.15)` to transparent).
  - Charging state overlay: Emerald `#10B981` markers.
  - Storage visual bar: Two-tone solid bar (Used: `#38BDF8`, Free: `#1E293B`).

### 6.4 `EnrollmentModal` (Floating Modal Sheet Platter)
- **Role**: Secure transactional device pairing challenge with 5-minute expiration timer.
- **Styling**: Floating modal platter (`--glass-modal-bg: rgba(17, 24, 39, 0.88)`), `border: 1px solid rgba(255, 255, 255, 0.15)`, `border-radius: 24px`, `box-shadow: var(--glass-modal-shadow)`.
- **Internal Elements**:
  - Title: "Enroll New Device" with Shield vector icon.
  - Dynamic QR Code placeholder and 64-character copyable challenge token.
  - Countdown timer: `5:00` with warning color trigger below `1:00`.
  - Informed Consent Agreement checkbox (mutual consent requirement).

---

## 7. Interaction States & Motion Architecture

### 7.1 State Coverage Requirements
Every interactive element must explicitly specify styles for all 7 states:
1. **`idle`**: Default resting state as defined in token tables.
2. **`hover`**: Slight brightness elevation (`--glass-bg-hover`, `--color-surface-card-hover`), elevation shadow increase.
3. **`active`**: Pressed state (`transform: scale(0.98)`), immediate tactile response.
4. **`focus-visible`**: High-contrast outline `0 0 0 3px rgba(37, 99, 235, 0.45)`, `outline-offset: 2px`.
5. **`loading`**: Shimmer skeleton with gentle gradient or spinning vector indicator; disabled cursor.
6. **`error`**: 1px solid `#EF4444` border with semantic error text and vector warning icon.
7. **`disabled`**: `opacity: 0.45`, `pointer-events: none`, `cursor: not-allowed`.

### 7.2 Motion Curves & Timing
- **Deceleration Curve (Default)**: `cubic-bezier(0.16, 1, 0.3, 1)` (Apple fluid deceleration)
- **Fast Duration**: `150ms` (hover, button clicks, focus rings)
- **Normal Duration**: `250ms` (card expansion, tab switching, toast presentation)
- **Slow Duration**: `400ms` (modal sheet entrance, drawer reveal)
