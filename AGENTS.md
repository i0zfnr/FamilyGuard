# FamilyGuard development rules

Preserve informed device-owner consent and visible OS indicators. Never bypass platform protections or implement covert monitoring. Do not expose services publicly or enroll devices without authorization. Do not claim unverified functionality. Keep secrets out of version control, enforce authorization server-side, and update DEVELOPMENT_PROGRESS.md with tested results and limitations. Work incrementally and run relevant tests.

## UI, Design & Autonomous Resolution Directives

### 1. Autonomous Design Leadership ("Choose the Best One")
- When asked to find, recommend, or create a design suitable for a project, do NOT present multiple generic options or ask indecisive questions.
- Autonomously analyze the project domain, audience, content hierarchy, and tech stack, then select and apply the single best design system, palette, typography, and layout.
- Explain the selection in one concise rationale statement, then proceed immediately with implementation.

### 2. Proactive Issue Resolution ("Always Fix Issues")
- Always audit and proactively fix frontend, UX, and accessibility bugs without waiting for explicit prompting:
  - Check and fix color contrast ratios to meet WCAG AA standards (≥ 4.5:1 for body text, ≥ 3:1 for icons and boundaries).
  - Ensure all responsive breakpoints are clean: no horizontal overflow, mobile-first layouts, and `min-h-[100dvh]` on mobile to prevent iOS Safari address-bar jumping.
  - Ensure complete interaction state coverage: `loading`, `empty`, `error`, `success`, `disabled`, `hover`, and visible `:focus-visible` rings.
  - Fix form flaws: visible labels, inline field error associations (`aria-describedby`), and accessible validation.

### 3. Strict Zero-Emoji Policy
- Never use emojis anywhere in the user interface (no emojis in headings, buttons, navigation, status indicators, badges, cards, or copy).
- Exclusively use professional vector icons (Phosphor Icons `@phosphor-icons/react`, Lucide, or inline clean SVGs) with consistent stroke widths (e.g. 1.5px or 2.0px) and semantic accessibility attributes (`aria-hidden="true"` or accessible button labels).

### 4. Anti-Slop & High-Taste Standards
- Actively reject generic AI design templates: no dark purple mesh gradients, no identical 3-column feature cards, no decorative unsemantic status dots, and no gratuitous glassmorphism.
- Use intentional typography (e.g. Geist, Plus Jakarta Sans, Outfit, Switzer, or editorial serif headers) with disciplined letter-spacing and line-heights.
