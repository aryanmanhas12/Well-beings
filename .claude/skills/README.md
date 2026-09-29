# Skills in this repo

Claude Code loads every folder here as a skill in any session opened on this
repository (Codex reads the same folders through `AGENTS.md`). The same set
lives in Ronak (aryanmanhas12/Psych), so both sister apps are built with the
same tools; keep them in step. They are
committed so they are always there: nothing to install per machine.

| Skill | Source | Licence | Use it for |
|---|---|---|---|
| design-taste-frontend | Leonxlnx/taste-skill `skills/taste-skill` (v2) | MIT | any new page or visual change: brief first, then the three dials |
| image-to-code | Leonxlnx/taste-skill `skills/image-to-code-skill` | MIT | building from a picture: reference, analyse, then code |
| redesign-existing-projects | Leonxlnx/taste-skill `skills/redesign-skill` | MIT | improving what exists: audit first, fix without breaking |
| high-end-visual-design | Leonxlnx/taste-skill `skills/soft-skill` | MIT | the calm, soft, premium direction Ronak uses |
| full-output-enforcement | Leonxlnx/taste-skill `skills/output-skill` | MIT | long files: no placeholders, no truncation |
| web-design-guidelines | vercel-labs/agent-skills; rules from vercel-labs/web-interface-guidelines | MIT | reviewing UI: fetch the live rules, report `file:line` findings |
| playwright-cli | microsoft/playwright-cli (npm `@playwright/cli` 0.1.21) | Apache-2.0 | opening, driving, snapshotting and recording the site |
| animated-ui-libraries | written for Ronak and Arun (aryanmanhas12/Psych) | same as repo | Aceternity UI, Cult UI, Componentry: install in Arun, port to Ronak |
| design-md | written for Ronak and Arun (aryanmanhas12/Psych) | same as repo | keeping `DESIGN.md` true; borrowing from VoltAgent/awesome-design-md |
| arun-ship-check | written for Arun (aryanmanhas12/Well-beings) | same as repo | before every Arun commit: verify, the e2e suites, speed on a slowed phone, publish the export, confirm the deploy |
| ronak-ship-check | written for Ronak (aryanmanhas12/Psych) | same as repo | before every Ronak commit: release number, suite, layout shift, idle cost, screenshots, safety invariants |

Vendored skills are copied unchanged, each with its licence beside it. To
update one, re-fetch its `SKILL.md` from the source above.

`web-design-guidelines/references/web-interface-guidelines.snapshot.md` is a
copy of the rules as of 2026-09-28, for when the live URL cannot be fetched;
always try the live URL first, as the skill says.
