# Design Directive: Decisive Selection, Zero Emojis & Proactive Bug Fixing

## 1. Autonomous Design Selection
- When the user asks to find, design, or create a UI for any feature or project, do not present a list of choices or ask the user to pick between styles unless explicitly requested.
- Evaluate the product domain, user persona, device form factor, and technical stack.
- Decisively pick the single best aesthetic archetype (e.g. Minimalist Editorial, Quiet Enterprise, Precision Security, Soft Structuralism).
- State the design rationale in one clear sentence and proceed directly with implementation.

## 2. Proactive Issue Resolution
- Always scan for and resolve UI/UX issues proactively before considering any UI complete:
  - Contrast: Verify all text has at least 4.5:1 contrast against its background and icons/borders have at least 3:1 contrast.
  - Mobile Responsiveness: Eliminate horizontal scrolling, ensure touch targets are at least 44x44px, and use `min-h-[100dvh]`.
  - Interaction States: Implement every state (`loading`, `empty`, `disabled`, `focus-visible`, `error`, `success`).
  - Forms: Associate error messages with form inputs using `aria-describedby` and maintain visible input labels.

## 3. Strict Zero Emoji Policy
- Never use emojis in the interface (no emojis in headings, badges, navbars, cards, buttons, or copy).
- Always use professional vector icons (Phosphor Icons, Lucide, or clean inline SVG) with consistent stroke widths and proper accessibility markup (`aria-hidden="true"` or accessible button names).

## 4. Anti-Slop Discipline
- Reject boilerplate AI aesthetics: no generic dark purple gradients, no identical 3-box feature grids, no gratuitous glassmorphism, and no fake placeholder data.
