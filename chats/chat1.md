# Productivity and wellness app

_Started 2026-07-24 17:07 UTC_

---

## User

Build an app for maxising productivty and mental well beings of the user, by asking questions about topics like sleep, mental helath and goals use reserach backed evidencne based questions only, next we will build systems personalised for each user to maximsie workflow and keep them safe from burn out. target audince will be teens to early adults but this app is open for all, data privacy is taken care of, no sharing of data or 3rd party is incvolved the treatments and practsies should be all backed by latest health reserach use pubmed and consensus connnectors

## Assistant

Found the Consensus connector (covers PubMed + peer-reviewed literature). Before I research and build, a few questions:

_[tool: questions_v2]_

_[tool: tool_search_tool_bm25]_

_[tool: tool_search_tool_bm25]_

## User

Questions answered:
- platform: Responsive web (works both)
- scope: Onboarding questionnaire (sleep, mental health, goals), Personalized daily plan & routines, Burnout early-warning dashboard, Evidence library (why each practice works), Daily check-in (mood, sleep, energy), Results / personal profile after assessment, Explore a few options, Crisis / safety resources screen, Decide for me, also helpline for serious mental illness if we find the appropretiate symptoms, the local helpline no. of the user region can be mentiaoned and brainstorm other helpful options and scetions of the app as well
- app_name: Well-Beings
- assessment_style: Adaptive: short first, deeper only if flagged
- question_flow: Chat-like interface
- personalization_output: Structured daily schedule (time blocks), Intervention cards (do X because research Y), Weekly focus + recovery plan, Habit stack (small routines, streaks)
- tone: Direct & practical (like a smart friend)
- safety: Both: discreet link always, prominent card when flagged
- data_privacy: Both
- interactivity: Fully interactive: answer questions → real scoring → personalized plan
- research_depth: Decide for me

## Assistant

Research first — pulling evidence from Consensus (covers PubMed) across the core topics, then I'll build.

_[tool: update_todos]_

_[tool: consensus__search]_

_[tool: consensus__search]_

_[tool: consensus__search]_

_[tool: consensus__search]_

_[tool: consensus__search]_

_[tool: consensus__search]_

_[tool: consensus__search]_

_[tool: consensus__search]_

Strong evidence base collected. Quick look at the design system bundle, then I'll build.

_[tool: list_files]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_write]_

_[tool: dc_js_str_replace]_

_[tool: dc_set_props]_

_[tool: ready_for_verification]_

Well-Beings is out for review — full flow: privacy-first chat check-in (adaptive PHQ-2→9 / GAD-2→7, sleep, burnout), crisis card with region-local helplines (triggered instantly on the self-harm item), scored read-out, then a personalised system: time-blocked day, evidence-cited intervention cards, habit stack, recovery quota, burnout radar fed by daily check-ins, and a 16-study evidence library sourced from Consensus/PubMed.

Three tweaks (panel on the right):
- **Persona** — preview a filled dashboard ("running hot" vs "steady") without redoing the chat
- **Plan intensity** — gentle / balanced / driven reshapes the whole schedule
- **Calm mode** — numbers become words for anxiety-sensitive users

Caveats: helpline numbers are current as of mid-2026 but worth re-verifying before any real release; screeners signal, they don't diagnose (the app says so throughout). Next steps could be a worry-postponement tool, weekly review screen, or exporting the read-out as a PDF to bring to a GP.

