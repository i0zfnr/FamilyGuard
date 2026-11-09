---
name: design-quality-testing
description: >-
  Checklists for testing design, UX flows, and accessibility before shipping.
  Use this skill when reviewing a feature before release, writing test plans,
  or doing design/UX QA. Covers flow checks, visual consistency, accessibility
  checks, content checks, and skill authoring checklists.
---

# Design Quality Testing

Rules curated by **Spencer Goldade (spencergoldade.ca)**.

Use this when reviewing a feature before release, writing test plans, or doing design/UX QA. This skill is a checklist only; principles and implementation live in the root `AGENTS.md` and frontend skills. When `design/*` docs exist (`design/tokens/*`, `design/ia/navigation.*`, `design/content/voice-and-tone.*`), verify consistency against them.

## Flow and UX Checks

- Can users **complete key tasks** without confusion?
- Are steps in multi-step flows:
  - Clearly labeled and ordered logically?
  - Providing feedback at each step?
- Are destructive or irreversible actions clearly differentiated and confirmed?

## Visual and IA Consistency

- Does the layout follow the project's **spacing, typography, and visual language** tokens?
- Are navigation labels, headings, and actions **consistent** across screens?
- Does the IA (sections, groupings, and labels) match `design/ia/navigation.*` if it exists?

IA principles and implementation rules live in the root `AGENTS.md` and the `ia-navigation-and-structure` skill; this skill only checks consistency against your `design/ia/navigation.*` and the above.

## Accessibility Checks

Use the principles in the root `AGENTS.md` and the implementation rules in the `accessibility-frontend` skill; this section is a short checklist only.

- Keyboard: Can the flow be completed with keyboard only? Is focus visible and returning to sensible locations? (See `accessibility-frontend` skill for focus and keyboard patterns.)
- Screen readers: Are headings, landmarks, and labels present and meaningful? Are important updates announced where applicable?
- Contrast: Do text and key interactive elements meet AA contrast standards?

## Content Checks

- Are messages, labels, and instructions clear, concise, and consistent with `design/content/voice-and-tone.*`?
- Are error and success messages actionable and tied to specific contexts?

## Skill Authoring Checklist

Use this when adding or updating skill files.

- **Purpose and scope**
  - Does the skill have a clear, single purpose?
  - Is it obvious when this skill should apply?
- **Integration with docs**
  - Does it reference existing design docs or tokens where relevant (for example, `design/tokens/*`, `design/ia/navigation.*`, `design/research/*`)?
  - If you suggest new docs, do you point to the `.example` files under `design/` as a starting point?
- **Structure and metadata**
  - Does the SKILL.md frontmatter include `name` and `description`?
  - Is the `description` clear enough for the agent to decide when to activate this skill?
- **Examples and anti-patterns**
  - Does the skill include at least one concrete example or scenario where it applies?
  - Does it include at least one **anti-pattern** to avoid?
- **Neutrality**
  - Does the skill avoid hard-coding project-specific details unless explicitly labeled as such?
  - Could another team reasonably adopt this skill with minimal changes?

## Anti-patterns

- Do **not** ship flows that pass functional tests but clearly violate basic UX or accessibility standards.
- Do **not** treat design QA as optional; it is part of the definition of done for user-facing work.
