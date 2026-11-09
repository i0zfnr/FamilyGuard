# FigCraft Prototyping & Visual Gate Workflow (Local Skill Copy)
Original path: C:\Users\ipan\.gemini\config\plugins\pro-design-rules\skills\figcraft-workflow\SKILL.md

Core Methodology:
1. FigCraft CLI is at `C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe`.
2. Headless scripting executes: `figcraft-cli run script.json --out prototype.figcraft`.
3. High-resolution rendering executes: `figcraft-cli render prototype.figcraft -o proof.png --scale 2`.
4. Approval gate: Visual PNG proofs presented to user before production code implementation.
