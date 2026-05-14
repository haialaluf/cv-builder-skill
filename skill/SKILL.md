---
name: cv-builder
description: Generate job-tailored, print-ready CV PDFs from a rich experience file. Use this when a user wants help writing, updating, or tailoring a CV/resume. Walks them from raw life experience → polished cv.json → HTML → PDF.
---

# CV Builder

A reusable workflow for building job-tailored CVs.

## How it's organised

The skill has three durable artifacts:

| File              | Built in   | Reused for         |
|-------------------|------------|--------------------|
| `experience.txt`  | Phase 1    | every future CV    |
| `cv.json`         | Phase 3    | a single CV        |
| `cv-{slug}.pdf`   | Phase 4    | a single CV        |

`experience.txt` is the master file. Build it once, generate many CVs from it. Never re-do the interview just because the user wants a new CV — open the existing `experience.txt` and proceed straight to Phase 3.

## On invocation — route by state

Look in the current working directory for `experience.txt`:

- **Exists** → ask: *"I found an existing `experience.txt`. Want to (a) generate a new CV from it, (b) add new roles or info, or (c) start over?"*
  - (a) → jump to Phase 3
  - (b) → resume Phase 1 in update mode (see below)
  - (c) → confirm destructive intent, then start Phase 1 fresh
- **Does not exist** → start Phase 1.

---

## Phase 1 — Build `experience.txt`

**Goal:** produce a markdown file with 5–10× more detail than any single CV would use. The richer this file, the better every future CV.

### Output format

`experience.txt` is markdown with these top-level sections, always in this order:

```
# Personal
# Roles
# Education
# Certifications
# Awards
# Public work
# Skills
# Languages
# Goals & character
```

A role entry looks like:

```
## 2023–Present · Senior Product Engineer · Lumen Health
**Company:** <one-sentence description, sourced from company site>
**URL:** <company website if known — keep so Phase 3 can re-verify context>
**Team:** <size, what the team owned>
**My role:** <day-to-day, what they personally owned — 2-4 sentences>
**Stack:** <tech actually used day-to-day>
**Achievements:**
- <headline achievement with a number if possible>
- <secondary>
- <secondary>
**Challenges / growth:** <what was hard, what they learned>
```

### Interview rules (non-negotiable)

1. **One question at a time.** Never batch. Wait for the user's answer before deciding the next question.
2. **Write as you go.** After each substantive answer, update `experience.txt`. Never hold answers only in conversation memory — if the chat restarts, we must not lose progress.
3. **Use sources first, ask second.** If the user provides a CV, LinkedIn export, GitHub URL, or company URL, process it before asking questions it could answer.
4. **Never invent facts.** Only write what the user said or what a source explicitly states. If you're guessing, ask instead.
5. **Probe vague answers once.** "I led the rewrite" → ask one follow-up for a number, a name, or a concrete change. Don't interrogate.
6. **Don't re-ask.** Before any question, scan what's already in `experience.txt` and the conversation.

### Source ingestion

For any link the user mentions: **always try to fetch it first** (WebFetch in Claude Code). Summarize what you learned, then ask the user to confirm or correct.

If a fetch fails or you don't have web access (Claude.ai), ask for one of:
- A paste of the page text (LinkedIn has an Export feature — recommend it)
- A screenshot
- A saved/printed PDF

**Verify, don't assume — especially URLs.** Company names rarely map cleanly to domains. `panax` could be `panax.com`, `panax.io`, `panax.ai`, or `getpanax.com` — guessing wrong poisons every fetch that follows. If a CV doesn't state the URL explicitly:
1. State your best guess: *"I'm guessing the company site is `panax.com` — is that right, or a different domain?"*
2. Wait for confirmation before fetching.

The same applies to dates, titles, team sizes, and any other detail that *looks* obvious from context but isn't actually stated. Ask, don't infer.

**Multiple CVs are common and welcome.** If the user shares more than one, ingest all of them, then reconcile. When they conflict (different titles, dates, or wording for the same role), surface the diff and ask the user which is correct — don't silently pick one.

**For every role, mine the company site for projects the user might have touched.** Once the URL is confirmed and fetched, pick the 2–3 products, launches, or technical initiatives most likely to overlap with the user's role and ask: *"Were you involved in any of these? What was your part?"* Keep the list short — too many options dilutes the prompt and the user just skims past. This question usually surfaces achievements the user forgot to mention because they felt "obvious" or "just part of the job".

### Pass 1 — Warm intro (always first)

Open by getting to know the person, not by asking for files. The goal is 3–6 short exchanges that anchor every later question in who this person actually is. Ask one at a time, never batched:

1. **Who are you?** Name. Optionally age (caveat that it's only useful in some markets — they can skip). Where they live.
2. **What do you love doing?** Inside work and out. Hobbies, side projects, what energises them.

Write each answer straight into `# Personal` and `# Goals & character` as it comes in. Don't compress these into one mega-question; the slower opening is the point.

When this feels grounded, transition to Pass 2.

### Pass 2 — Source triage

Now bridge from the warm intro into pulling in any data the user already has. Ask once:

> Now I want to pull in everything you've already written down so we're not re-typing your life story. Share as much as you can — more is always better, and the richer the input the better every future CV. Any of these would help:
> - **One or more existing CVs** — *you can share multiple, and you should if you have them. Older versions are gold for catching achievements you've since forgotten.*
> - **LinkedIn** (URL, export, or screenshot — Export is best)
> - **GitHub username**
> - **Personal website or blog**
> - **Stack Overflow / X / other public profiles**
>
> Drop in whatever you've got. If you have nothing, just say "none" and we'll cover it through the interview.

For each source provided, ingest and extract:
- Name, location, contact info → write `# Personal`
- Role list (company, title, dates) → write `# Roles` as **headers only**, no detail yet
- Education → write `# Education`
- Public projects, talks, writing → write `# Public work` — **capture the traction signal alongside each entry**, because Phase 3 needs it to decide what's worth surfacing on the CV. For GitHub repos: stars, forks, and year of last commit (fetch the repo page; if no traction data is visible, write `traction: none visible`). For talks: venue and rough audience size. For posts/papers: publication and reach if shown. A bare repo name with no context is not enough — without signal data, Phase 3 has to either drop the project or come back and ask.
- Skills they claim → write `# Skills` (mark as "claimed", confirm during Pass 2)

Summarize what you learned and ask: "Did I get this right? Anything to add or correct before we deep-dive into each role?"

### Pass 3 — Roles deep-dive

Process roles most-recent first. **Tier the depth per role** — not every role earns the same interview time, because not every role earns the same CV space. Older short stints cap at 1 bullet on the final CV anyway (see Phase 3 content budget), so a full deep-dive on them doesn't pay off.

**Set expectations up front, once:** *"I'll spend more time on your recent and longest roles — that's where the CV gets its signal. For older short stints I'll just confirm the basics."*

**Classify each role before asking anything:**

- **Heavyweight** — current role, OR duration ≥3 years, OR ended within the last 5 years. → **Full dive** (all 8 questions below).
- **Lightweight** — duration ≤2 years AND ended >5 years ago. → **Short dive**: questions 1 (company — skip the site-mining sub-bullet), 4 (headline achievement), 6 (stack). Skip the rest.
- **Tail-drop candidate** — pre-career roles eligible for dropping per Phase 3's tail-drop rule (waitress, retail, summer jobs, unrelated internships). → **Confirm only**: title, company, dates. Don't mine for bullets on a role we're about to ask permission to drop.

Skip any question already answered by sources, regardless of tier.

1. **Company.** First confirm the URL. If a source stated it, fetch it. If not, state your best guess and ask before fetching — *"I'm guessing the company site is `panax.com` — correct domain?"* Once fetched:
   - Summarise back in one line — *"I read panax.com — they do X. Sound right?"*
   - *(Heavyweight only)* Pick the 2–3 products, launches, or technical initiatives from the site most likely to overlap with the user's role and ask: *"Were you involved in any of these? What was your part?"* Keep it short — this is the highest-leverage question for surfacing forgotten achievements, but only if the user actually engages with the options.
2. **Team.** "How big was the team you were on, and what did the team specifically own?"
3. **Your role.** "What was your day-to-day? What did *you* personally own?"
4. **Headline achievement.** "What's the single thing you're most proud of from this role?" Follow up once for a number if missing ("how much did it improve? how many users?").
5. **Other achievements.** "Anything else worth calling out — 2 or 3 more?"
6. **Stack.** "What tech did you actually use day-to-day?" (Not the company's full stack — what *you* touched.)

After each role, write its block to `experience.txt` and move on.

**Do not ask why the user left a role, or why they're still there.** This is interview/coaching territory, not CV content — it doesn't appear on the CV and makes the interview feel like a fit-screening rather than a CV build.

### Pass 4 — Credentials & recognition

Ask one at a time. Skip any already covered by sources.

1. **Certifications / licenses.** "Any professional certifications or licenses — AWS, GCP, PMP, Scrum, security clearances, regulated-industry licenses?" → `# Certifications` as `<name> · <issuer> · <year>`.
2. **Awards / recognition.** "Any awards or recognition — company-level, industry, academic? 'Engineer of the Year', published rankings, fellowships, scholarships?" → `# Awards`.
3. **Publications / talks / open source.** "Anything public — talks, blog posts, papers, OSS projects?" → `# Public work` (if not already captured during source ingestion).

### Pass 5 — Languages & extras

Ask one at a time. **Skip anything already covered in the warm intro or by sources.** Don't re-ask; scan `experience.txt` first.

1. What languages do you speak, and at what level?
2. Anything else you want every CV to communicate about you? (e.g. "I mentor", "I write a blog", "I care about accessibility")

Facts → `# Personal`. Values → `# Goals & character`.

**Do not ask about relocation, what teams/environments the user avoids, or what their ideal next role is.** These are career-coaching / fit-screening questions, not CV content. Relocation is only worth capturing if the user volunteers it. "Ideal next role" is redundant with the warm intro and overridden by JD tailoring in Phase 3 anyway.

### Pass 6 — Review

Summarize:
- Roles captured (count + bullets per role)
- Personal, Public work, Skills counts
- Anything that felt thin

Ask: "Is anything missing? Side projects, certifications, courses, talks I didn't pick up?"

Iterate until the user says it's done. **End of Phase 1.**

### Update mode (resuming an existing file)

If the user is updating an existing `experience.txt`:
1. Read it fully first.
2. Ask one question: "What's changed since we last talked? New role, new project, updated skills, something else?"
3. Process the delta only. Do not re-walk passes the user didn't ask for.
4. Preserve existing content — append/edit, never overwrite blindly.

---

## Phase 2 — CV JSON schema

Defined in `cv.schema.json`. Every CV produces a `cv.json` matching this schema. Already complete — do not modify in normal use.

## Phase 3 — JD tailoring → `cv.json`

**Goal:** Produce a `cv.json` (validates against `cv.schema.json`) that maximises fit to a specific JD while staying 100% truthful to `experience.txt`.

### Truth rules (non-negotiable, top priority)

**A CV that lies is worse than no CV.** A great-sounding bullet the candidate cannot defend in an interview disqualifies them; a boring true bullet does not. Every single claim — bullet, skill, title, number, outcome, headline — must trace to something the user has told you in `experience.txt`. When in doubt, ask the user or cut the claim. Never extrapolate, never round up, never fill a gap with plausible-sounding detail.

1. **Never invent facts.** Every bullet, skill, project, and headline must trace to something in `experience.txt`. If the JD wants X and X isn't there, ask the user — don't extrapolate.
2. **Never invent outcomes.** Distinct from inventing numbers. Don't add durations ("four-week soak"), comparisons ("first in the company"), absence claims ("zero incidents", "no regressions"), or durability claims ("still in use", "never broke") unless `experience.txt` explicitly states them. If experience.txt only says "shipped X", the bullet can only say "shipped X" — not "shipped X without regressions".
3. **Never inflate verbs.** "Contributed to" doesn't become "developed". "Helped with" doesn't become "led". "Was on the team that shipped X" doesn't become "shipped X".
4. **Job titles, companies, dates are exact.** The headline and summary can emphasise an aspect of what the user did; the role block cannot rename their actual title.
5. **Numbers stay as reported.** Don't round up, don't extrapolate, don't say "millions" when the user said "hundreds of thousands".
6. **Skills must appear in `# Skills`** of experience.txt. If JD demands a skill the user doesn't have, flag the gap — don't quietly add it to the skills list.

### Framing vs fabrication

**Strong framing is the whole point of this phase — it is not lying.** You *should* pick the angle that flatters the user, mirror the JD's exact wording when truthful, lead with the most relevant achievement, bold the keyword that should jump out, and reframe a real experience as adjacent to the JD when it genuinely is. What you must *not* do is invent details, durations, outcomes, scale, or skills to make the framing land.

Examples:
- ✅ `"Owned the Stripe metered-billing integration end-to-end — proration, idempotent webhooks, dunning, Stripe Tax."` — strong framing of facts the user reported.
- ❌ `"Owned the Stripe metered-billing integration end-to-end — survived four-week soak with zero incidents."` — the four-week soak and zero-incidents claim aren't in `experience.txt`. Fabrication.
- ✅ `"Led the rewrite from Rails to Next.js + tRPC — cut median completion time by 38%."` — exact number from `experience.txt`.
- ❌ `"Spearheaded a high-impact transformation that streamlined operations."` — corporate filler, no fact, banned verbs.

When tempted to write something that "sounds right" but isn't in `experience.txt`: either ask the user to confirm a real fact you can use instead, or cut the embellishment. Every time.

### Priority hierarchy (when truth rules aren't the deciding factor)

**Relevance > Impact > ATS keywords > Brevity.** Never trade relevance for a punchier number. Never trade brevity for a flashier verb.

### Role inclusion & ordering (non-negotiable)

**Every role from `experience.txt` appears on the CV.** Do not drop roles for relevance, age, or to save space. The work history must read as a continuous timeline — recruiters scan dates first, and a missing year reads as a gap (unemployment, hidden firing, omitted job) which is a much stronger negative signal than including a less-relevant role briefly.

**Compress, don't cut (with one carve-out for tail roles).** Older or weaker-fit roles inside the career window get fewer bullets, shorter taglines, or no tech tags — never zero presence. The schema requires at least 1 bullet per role; that's also the realistic floor. A role can shrink to: title · company · dates · one short bullet. That's enough to fill the timeline. The one exception is *pre-career tail roles* (covered below): with user permission, the oldest contiguous block of pre-career jobs can be dropped entirely, so the visible timeline simply starts at the first real career role.

**Never drop a role in the middle.** Tail drops only — the *oldest* role, or a *contiguous block* of oldest roles, can be dropped together so the visible timeline still has no internal gap. Dropping anything that would leave a hole between two kept roles is forbidden, even with user permission.

**Tail-drop decision (always ask first).** Pre-career tail roles — waitress, retail, summer jobs, internships unrelated to the target field — are legitimate candidates for dropping once the candidate has enough career experience above them that the timeline doesn't look thin. The recommendation depends on seniority:

- **Senior+ (≈ 8+ years in the target field) with clearly pre-career tail roles** — recommend dropping. *"Your 2014–2016 waitressing job and 2012–2014 retail job sit before your engineering career began. With 9 years of engineering above them, I'd drop both — the timeline starts cleanly at your first engineering role. OK to drop?"* You can propose dropping a block of two or three contiguous tail roles together.
- **Mid-career (≈ 4–7 years) with a single pre-career tail role** — call it a judgement call, default to dropping. *"Your 2017 retail job is the only non-engineering role and sits before your tech career. I'd lean toward dropping it. Keep or drop?"*
- **Early-career (≤ 3 years in the field) or thin experience overall** — recommend keeping. *"You only have ~2 years of engineering, so the 2019 retail role earns its place — it shows continuous work. Keep it?"*
- **Any role in the middle of the timeline** — don't ask, don't drop. Compress its content instead.

Default to asking with a clear recommendation, not a silent decision. If the user doesn't reply, keep the role.

**Ordering.** Strict reverse chronological by **end date** (Present > most recent end date > older), tie-broken by **start date descending**. The end date alone determines position — start date is only consulted to break ties on identical end dates. Do not reorder by JD relevance, and do not let an earlier-starting role float to the top just because it began first.
End-date-wins example (the case to watch for):

| Role  | Start | End  | Position                                            |
|-------|-------|------|-----------------------------------------------------|
| A     | 2020  | 2026 | **Above** — end 2026 wins                           |
| B     | 2022  | 2024 | **Below** — even though B started later, end 2024 < 2026 |

Role A goes on top because it ended more recently, even though Role B started two years after. Never invert this because B "feels more recent" by its start date.

### One-page target (default, near-absolute)

**The output is a single A4 page at scale ≥ 0.90 in 99% of cases.** This is a hard default, not a stretch goal. Recruiters spend ~7 seconds on a first scan; a second page often goes unread, and content pushed there loses leverage. **Going to two pages is a content-selection failure** — except in the narrow legitimate cases listed below — so treat the page boundary as a real constraint during Steps 3.3–3.5, not a problem to discover at render time.

**Legitimate 2-page cases (rare):**
- 12+ years across 6+ roles where every role still earns bullets relevant to the JD
- Heavy publication / talk record (10+ named venues) that's load-bearing for the role
- Staff+ / leadership where compressing scope into a sentence would misrepresent it
- Academic / research / medical CVs where 2+ pages is the convention

For everyone else — including senior engineers with 8–12 years of experience — **one page is the right answer**. Don't pad to fill space, but don't spill to a second page just because the candidate has more they *could* say.

### Content budget for 1 page

Use this as the working budget while you draft. If you blow past it, cut before you render — don't rely on the renderer's auto-scale as content strategy.

| Field          | Budget                                                                    |
|----------------|---------------------------------------------------------------------------|
| Summary        | 2–3 sentences (~50 words / ~350 chars)                                    |
| Skills         | 8–12 entries, JD-overlap first                                            |
| Top role       | 3–5 bullets, ~2 lines each                                                |
| Mid roles      | 2–3 bullets                                                               |
| Older / weaker-fit roles | 1 bullet (schema minimum); drop the tagline and tech tags first |
| Projects       | 0–2 entries (most candidates: zero — see Step 3.5 projects bar)            |
| Education      | 1 entry unless a second is genuinely relevant                             |
| Certifications / awards / languages | Only what's relevant or universally strong         |

Older / tangential roles are the first place to compress: drop the tagline, drop the tech tags, cut to a single bullet that names the company's domain and the candidate's main responsibility. **The role line itself always stays** — see the "Role inclusion & ordering" rule above.

### Inputs

- `experience.txt` (route to Phase 1 if missing).
- A job description: paste, file path, or URL. If URL, try `WebFetch` first; ask for paste/screenshot on failure (same as Phase 1 source ingestion).

### Step 3.1 — Parse the JD → write the sidecar

Read the JD and extract the items below. **Write them immediately to `cv-{slug}.notes.md`** (the JD-context sidecar — see Step 3.5 for slug rules). The sidecar is the durable scratchpad for the whole phase; it grows through Steps 3.1 → 3.6 and is delivered alongside `cv-{slug}.json`.

Required sidecar sections after this step:

1. **Title** — exact, verbatim.
2. **Company** — what they do. If a URL was given, fetch the site for context.
3. **Seniority** — junior / mid / senior / staff / principal / etc.
4. **Archetype** — IC technical / people manager / cross-functional / research / etc.
5. **Must-haves** — explicit required skills, tools, years of experience.
6. **Nice-to-haves** — preferred or "bonus".
7. **Keywords (15–25, as a checklist)** — specific terms/tools to mirror, **using the JD's exact wording**. ATS systems often don't recognise synonyms ("GCP" ≠ "Google Cloud", "Adobe Creative Suite" ≠ "Adobe Creative Cloud"). Write each as `- [ ] keyword` — Step 3.6 ticks them by grepping the rendered `cv.json`.
8. **Cultural signals** — what they value (speed, autonomy, scale, craft, customer obsession, etc.).
9. **Risks** — overqualification, domain mismatch, hard requirements the user lacks.

### Step 3.2 — Propose a tailoring strategy (CHECKPOINT)

Before drafting JSON, present a one-page plan and **wait for user approval**:

```
JD: <title> at <company> · <seniority>

ALL ROLES (reverse-chronological, with bullet density):
- <role> · <dates> · <N bullets> · <one-line role framing>
- <role> · <dates> · <N bullets> · ...
- <role> · <dates> · <N bullets> · ...
(Every role from experience.txt is listed here, oldest last. Older /
 less-relevant roles get fewer bullets, not removal — with one carve-out:
 pre-career tail roles can be proposed for dropping in this checkpoint
 (waitress, retail, summer jobs before the candidate's actual field).
 Ask the user with a recommendation; never pre-decide. Middle-role drops
 are forbidden — they create a visible time gap.)

ASK BEFORE DROPPING (if applicable):
- <pre-career tail role> — <recommendation: drop|keep> · <reason tied to seniority>

HEADLINE (mirror or compound — see Step 3.5 for the rule):
"<headline>"

SUMMARY ANGLE (2–3 sentences):
"<positioning that mirrors JD language using only facts from experience.txt>"

PER-ROLE TAGLINES (one bold italic line under each role title, JD-customised — single strongest tailoring lever):
- <role>: "<tagline>"
- <role>: "<tagline>"

SKILLS TO LEAD WITH (8–12, JD-overlap first, all from experience.txt):
<list>

KEYWORDS I'M TARGETING (from JD, will weave in where truthful):
<list>

GAPS:
- <missing requirement> — not in experience.txt. Options:
  (a) leave as a known gap
  (b) you tell me about a past experience I missed
  (c) address in cover letter, not the CV

EDUCATION / LANGUAGES / PROJECTS:
<include all / cut X / keep brief>
```

Ask: *"Does this work? Adjust anything before I draft the cv.json?"*

### Step 3.3 — Score and select bullets (write the table to the sidecar)

For **every** role in `experience.txt` (no role is "cut" at this stage — see the role-inclusion rule), score every achievement against the JD using four signals:

| Signal           | Weight | What it asks                                                          |
|------------------|--------|-----------------------------------------------------------------------|
| Direct match     | 40%    | Same skill, tool, domain, or outcome named in the JD                   |
| Transferable     | 30%    | Same capability in a different context                                 |
| Adjacent         | 20%    | Related tools, related problem space, supporting role in the area      |
| Impact alignment | 10%    | Achievement type matches what the JD values (scale / revenue / craft / team size) |

**Confidence bands:**
- **90–100% Direct** — lead with it.
- **75–89% Transferable** — strong; light reframing to mirror JD terminology is fine (preserve facts).
- **60–74% Adjacent** — include only if no stronger option exists for that slot; reframe carefully.
- **<60% Weak** — drop, or flag the role as a poor fit overall.

**Write the scoring table to the sidecar before drafting any bullet prose.** This forces the strongest candidates to surface explicitly rather than emerging mid-draft. Format:

```
### Bullet selection — <role>
| # | Candidate (source quote / paraphrase) | Confidence | Decision   |
|---|---------------------------------------|------------|------------|
| 1 | Stripe metered-billing integration    | Direct 95% | KEEP (top) |
| 2 | Webhook idempotency layer             | Direct 90% | KEEP       |
| 3 | Incident playbook + 12 post-mortems   | Trans 80%  | KEEP       |
| 4 | Public GraphQL analytics              | Adj 65%    | CUT (weak) |
| 5 | Cloudflare Workers edge debugging     | Adj <60%   | CUT (weak) |
```

For each role, pick the bullets that survive per the content budget (3–5 for the top role, fewer for older / weaker-fit roles, **at least 1 for every role** — schema minimum and timeline-continuity floor), **ordered high-to-low confidence** so the strongest match is the first bullet under the role. If every candidate scores weak for a role, still keep the single best one — the role line is what closes the timeline gap, not the bullet quality.

### Step 3.4 — Write the bullets (style rules)

1. **One achievement per bullet.** No conjoined claims with semicolons.
2. **Start with a strong, plain action verb.** *Built, shipped, led, owned, migrated, designed, cut, doubled, grew, hired, debugged, fixed.* Vary across the resume.
3. **Quantify when the number is real.** If experience.txt has the metric, use it. If not, describe scope (team size, # users, surface area) — never invent metrics.
4. **Mirror JD terminology when truthful.** "GCP" vs "Google Cloud", "RAG" vs "retrieval-augmented generation" — match the JD's exact form.
5. **Bold what matters.** Use `<strong>…</strong>` inline for the keyword or number that should jump out on a skim. One or two per bullet, max.
6. **Cap at ~2 lines** (~200 characters).
7. **Banned words** (AI tells / corporate filler — avoid unless they are literal JD terms): *leverage, utilize, harness, delve, streamline, robust, pivotal, multifaceted, tapestry, foster, facilitate, spearheaded, synergy, "it's worth noting", "in today's digital age", "track record of", "passionate about", "results-driven", "proven ability", "deep dive", "hit the ground running".* Replace with plain English ("use", "make", "improve", "dig into").
8. **No first person.** "Owned the migration", not "I owned the migration".

### Step 3.5 — Assemble `cv.json`

Map straight to `cv.schema.json`:

- `name` — from `# Personal`.
- `headline` — the highest-leverage tailoring move on the whole CV. Two valid patterns, pick the most honest one:
  - **Mirror** — if the candidate's *current* title already matches the JD title (or differs only by seniority adjective), use the JD title verbatim. *Senior Product Engineer applying for Senior Product Engineer → "Senior Product Engineer".*
  - **Compound** — if mirroring would rename the candidate's actual title, compound the real title with the JD-mirror term: `<real title> / <JD-mirror term>`. *Senior Product Engineer applying for a Stripe backend role → "Senior Backend / Product Engineer".* This mirrors the JD surface without falsely renaming the candidate.
  - **Never** invent a title the candidate has never held. "Staff Engineer" doesn't appear here unless `# Roles` shows a Staff title.
- `summary` — 2–3 sentences. Mirrors JD seniority and language. Built only from facts in experience.txt.
- `contact` — copy from `# Personal`, dropping anything not appropriate for this role (e.g. personal X handle for a banking role).
- `experience` — **every role from `experience.txt`**, in strict reverse-chronological order (by end date desc, then start date desc — see "Role inclusion & ordering"). Do not re-order by relevance and do not omit any role. Bullets within a role are ordered per Step 3.3 (highest confidence first). `tech` arrays prefer JD's terminology where truthful.
  - **`tagline`** — set per role to the JD-customised one-liner from Step 3.2. This is the **single strongest tailoring lever**: same person, same role, different tagline depending on JD. One short sentence; mirror JD terminology where truthful. Drop it for roles where no honest reframing helps.
- `skills` — flat list of 8–12. JD-overlap first. **All entries must appear in `# Skills`.**
- `education`, `languages` — include unless deliberately cut.
- `certifications` — include any from `# Certifications` relevant to the JD. Drop unrelated ones (e.g. a PMP cert on a backend engineering CV).
- `awards` — include from `# Awards` only when relevant or universally strong (e.g. company-wide recognition).
- `projects` — **high bar; omit by default.** A project earns a spot only when it adds signal the work history doesn't already carry: meaningful public traction (stars, forks, downloads, real users), a named venue (conference talk, published paper, widely-read post), or a JD-critical skill that no role in `experience` demonstrates. **For experienced candidates with a strong work history, no projects section is better than a weak one.** An old GitHub repo with zero stars, zero forks, and no commits in the last couple of years is a *negative* signal — it suggests the candidate had to scrape the barrel to fill space, and pulls attention away from the strong roles above. Cut it. The only candidates for whom weak projects can still earn a spot are early-career (student, intern, first job) where projects are the strongest evidence of capability available. If a project sits between "clearly above the bar" and "clearly below", ask the user before including it — phrase it as a recommendation to omit unless they push back. Older or off-topic *roles* can still be condensed into a one-bullet "Earlier experience" project entry; that's a different use of this field and isn't subject to the traction bar.

**File naming.** Write to `cv-{slug}.json` where `{slug}` is lowercase, hyphenated, built from `{company}-{role-tokens}` — **drop filler words** like "senior", "software", "engineer", "platform" unless they're load-bearing for distinguishing CVs. Examples:
- ✅ `cv-stripe-billing.json`, `cv-linear-fullstack.json`, `cv-vercel-platform.json`
- ❌ `cv-stripe-senior-software-engineer-backend-billing-platform.json`

This naming is critical — `cv.json` as a filename will silently overwrite a previous CV. Rendered PDFs follow the same pattern: `cv-{slug}.pdf`.

**JD-context sidecar.** The `cv-{slug}.notes.md` was born in Step 3.1. By this point it contains: JD analysis (3.1), strategy decisions (3.2), bullet-scoring tables (3.3). Step 3.6 adds the per-bullet provenance table and ticks the keyword checklist. The sidecar travels alongside the JSON so any future session — yours or another model's — can iterate without re-deriving context.

Mentally validate every field against the schema before saving.

### Step 3.6 — Self-critique pass

Before handing back, run these checks **in order**:

1. **Provenance audit (mandatory, write to sidecar).** For *every* bullet, the headline, the summary, and every skill: copy the verbatim `experience.txt` span it traces to, into a per-bullet table in the sidecar. If any phrase in the bullet isn't covered by the cited span — including durations ("four-week soak"), comparisons ("first in the company"), absence claims ("zero incidents"), or durability claims ("still in use") — **cut that phrase**, don't soften it. Repeat until every word in every bullet is backed by a quote. *Accuracy wins all ties.* Sidecar format:

   ```
   | Bullet | Verbatim source in experience.txt | Confidence |
   |--------|-----------------------------------|------------|
   | "Owned the Stripe metered billing..." | "Owned the Stripe billing integration including metered usage..." | Direct 95% |
   ```

2. **ATS keyword count (verifiable, not estimated).** Go through the keyword checklist in the sidecar (from Step 3.1) and **literally search the rendered `cv.json`** for each entry — tick `[x]` if present, leave `[ ]` if absent. **Target ≥80% ticked.** For each unchecked keyword, write a one-line reason on the same line (gap / intentional omission / truthful skill the user lacks). Don't estimate the count from memory — count from the file. The exact job title should also appear verbatim in the headline (or first role context) when truthful.
3. **10-second recruiter scan.** Read only: headline → summary → first bullet of each role. Does the fit jump out? If not, the wrong bullets are on top.
4. **AI-tell scan.** Search the JSON for the banned-words list above. Replace any that slipped in.
5. **Verb diversity scan.** List the first word of every bullet (across all roles). If any verb is repeated more than twice across the whole CV — *especially* the high-status ones ("Led", "Owned", "Built", "Designed") — rewrite the weaker instances to a different true verb (*shipped, drove, ran, migrated, hired, debugged, cut, doubled, mentored, rewrote, reduced, scaled, …*). A CV that opens four bullets with "Led" reads thin even when every claim is true.
6. **Projects bar.** For every entry in `projects`, check that it clears the bar from Step 3.5: visible traction (stars, forks, downloads, real users), a named venue, or a JD-critical skill the roles don't cover. If the candidate has 5+ years of solid work history and a project clears none of these, **remove it** — weak projects pull the eye away from strong roles and read as filler. If the projects section ends up empty after this pass, omit it entirely; don't pad it back. The bar relaxes only for early-career candidates.
7. **Specificity check.** Pick 3 bullets at random. Does each one say something a generic candidate couldn't equally claim? If not, rewrite for specificity using experience.txt facts.
8. **Length sanity.** Rough character count against the 1-page budget above. If well under budget, add a 4th–5th bullet to the highest-relevance role. If over, trim *bullets* (and taglines, tech tags) from older roles first — never the top role, and **never the role itself**. Every role from `experience.txt` must still appear; only its content density shrinks.

9. **One-page render check (mandatory before handoff).** Render `template.html` to HTML, then run `python3 html_to_pdf.py out.html cv-{slug}.pdf` (use the slug from Step 3.5; never write to bare `cv.pdf` — it overwrites prior CVs).

   Read the renderer's output line:
   - **`1 page at scale 1.00`** — ideal.
   - **`1 page at scale 0.95` or `0.90`** — fine; the auto-scaler did light work.
   - **`1 page at scale 0.85`** — tight but acceptable for a senior CV. **Only trim if there is an easy win** (a weak bullet, a duplicate-keyword skill, a redundant tech tag).
   - **`1 page at scale 0.80`** — at the readability floor (`0.80` is the minimum the auto-scaler will go). **Iterate** using the 2-page order below, re-rendering after each pass.
   - **`2 pages`** — over-budget. **Iterate**, re-rendering after each pass: (1) drop the weakest project, (2) drop tech tags from older roles, (3) drop taglines from older roles, (4) trim bullets from older roles down to 1 each (the floor — never zero), (5) shorten the top-role bullets in place, (6) cut a less-relevant skill. **Do not silently drop a role and do not reorder roles to fit** — every role from `experience.txt` stays unless step (7) authorizes a drop. (7) **Last resort — ask the user.** If the CV still won't fit at 1 page after all of the above, ask with a clear recommendation: *"I've trimmed everything I can without dropping a role. I can either drop the least recent role (or a contiguous block of the oldest), or keep them all and ship a 2-page CV. [If the candidate matches a legitimate 2-page case: I'd lean toward 2 pages — your content justifies it.] [Otherwise: I'd lean toward dropping the oldest — a tight 1-pager beats a half-empty second page.] Your call."* Any drop must still be tail-only (oldest contiguous block) — never a middle role, which creates a visible time gap. If the user picks 2 pages, render with `--pages 2` so the auto-scaler doesn't fight you.

   This check is not optional and not "for later" — a CV that's 2 pages because we didn't trim is a failed deliverable. A CV that drops a middle role to fit is a worse failure — better to ship 2 pages than to create a visible time gap.

Report a 5-line summary back:

```
Keyword match:    <N>/<total> of JD keywords (<pct>%)
Strongest role:   <name> · <bullet count> bullets
Gaps flagged:     <comma list, or "none">
AI-tells removed: <count>
Page fit:         <1|2> page(s) at scale <X.XX>
```

### Step 3.7 — Handoff

Tell the user:

1. Path to `cv-{slug}.json` and `cv-{slug}.notes.md`.
2. The 3.6 report.
3. **Cover-letter cues** — the sidecar's `Gaps` section already lists each JD requirement the CV doesn't fully cover (e.g. *"Ruby/Go absent; closest adjacency is the Rails→Next.js rewrite"*). Surface these to the user as the specific gaps the cover letter should address — don't make them re-derive the list. Two or three sentences naming the gap and the closest truthful adjacency is what the user needs from us, not a full draft.
4. Next: render the PDF (Phase 4). One template — `template.html` (two-column with center divider, accent-blue links, social icons under the name). Just confirm the user is ready and run the render commands.

If the user comes back with edits ("summary feels generic", "lead with the migration bullet"), apply them and re-run 3.6 on the changed sections only — don't re-do the whole pass.

## Phase 4 — Rendering

One template: `template.html` — two-column with a center divider, accent-blue links, social icons under the name. Space-efficient layout that fits dense senior CVs at high scale.

Optional links in `cv.json`:
- Each `contact[*]` row is clickable when `link` is set (icon + label both become part of the same anchor — use `mailto:` for email, `tel:` for phone, full URL for everything else).
- Each `experience[*]` role's company name renders as an underlined link when `url` is set on the role.
- Social icons (`linkedin`, `github`, `x`, `stackoverflow`) appear as an icon-only row directly under the name.

**Paths.** `render.js`, `template.html`, and `html_to_pdf.py` live in the skill's own directory — not the user's working directory. Always invoke them with the **absolute path to the skill directory** (let `$SKILL_DIR` stand in for it below), and write the output PDF next to `cv-{slug}.json` in the user's CWD.

Render with:

```bash
# Render HTML (substitute $SKILL_DIR with the absolute path to the skill folder)
node -e "const {render}=require('$SKILL_DIR/render.js'),fs=require('fs');\
fs.writeFileSync('out.html', render(fs.readFileSync('$SKILL_DIR/template.html','utf8'), require('./cv-{slug}.json')))"

# Convert to PDF (auto-scales to fit one page, down to 0.80x)
python3 $SKILL_DIR/html_to_pdf.py out.html cv-{slug}.pdf
```

**Character normalization is automatic.** `render.js` runs every string value in `cv.json` through a typographic-cleanup pass before templating — em/en-dashes become spaced hyphens, smart quotes become straight quotes, ellipsis characters become `...`, no-break/zero-width spaces are flattened. This keeps the CV in plain keyboard punctuation regardless of what slipped into `cv.json`. It only touches `cv.json` content, never `template.html`'s own separators.

**Default is 1 page.** The renderer auto-scales between 1.00 and 0.80 to fit (0.80 is the floor — it won't go lower). The detailed scale bands and trim iteration order live in Step 3.6 step 9 — refer there rather than re-deciding here. Quick gut check: `0.90–1.00` is fine, `0.85` is tight but acceptable for senior CVs, `0.80` means the auto-scaler hit the floor (trim, then ask the user if trims still don't fit it), and `2 pages` means iterate then ask the user.

For genuinely 2-page CVs (12+ years across 6+ relevant roles, dense publication record, staff+ leadership where compression would misrepresent scope): `python3 $SKILL_DIR/html_to_pdf.py out.html cv-{slug}.pdf --pages 2`.

Requirements: Node, Python 3, and Playwright + Chromium for PDF (`pip install playwright && playwright install chromium`).

## Phase 5 — Packaging

This SKILL.md plus the renderer, templates, and schema form an installable skill,
distributed as an open-source repository: https://github.com/haialaluf/cv-builder

Installation, usage, and contribution guidance (including how to add new
templates) live in that repo's `README.md` and `CONTRIBUTING.md`.
