# Contributing to CV Builder

Thanks for helping make this better. The most valuable contributions are **new
templates**, but bug fixes, workflow improvements, and schema suggestions are all
welcome.

## Getting set up

```bash
git clone https://github.com/haialaluf/cv-builder.git
cd cv-builder
ln -s "$(pwd)/skill" ~/.claude/skills/cv-builder   # symlink so edits go live
pip install playwright && playwright install chromium
```

Render the bundled example to check your toolchain works:

```bash
node -e "const {render}=require('./skill/render.js'),fs=require('fs');\
fs.writeFileSync('examples/cv.example.html', render(fs.readFileSync('./skill/template.html','utf8'), require('./skill/cv.example.json')))"
python3 skill/html_to_pdf.py examples/cv.example.html /tmp/example.pdf
```

You should see `1 page at scale 0.90`.

---

## Adding a new template

A template is a single self-contained HTML file. The renderer
([`skill/render.js`](skill/render.js)) is template-agnostic — it just substitutes
data into whatever HTML you give it — so a new template is purely additive: no JS
changes needed.

### 1. Know the data shape

Your template renders one **CV object**, defined by
[`skill/cv.schema.json`](skill/cv.schema.json). Top-level fields:

`name`, `headline`, `summary`, `contact[]`, `experience[]`, `education[]`,
`skills[]`, `languages[]`, `projects[]`, `certifications[]`, `awards[]`.

[`skill/cv.example.json`](skill/cv.example.json) is a complete, valid example —
develop against it.

### 2. Template syntax

`render.js` supports a small Mustache-flavored language:

| Construct | Meaning |
|-----------|---------|
| `{{path.to.value}}` | HTML-escaped variable substitution |
| `{{{path.to.value}}}` | **Raw** (unescaped) — use for bullets, which may contain `<strong>` |
| `{{#each arr}} … {{/each}}` | Loop; inside, `{{this}}` is the item and its fields resolve directly |
| `{{#if val}} … {{/if}}` | Truthy check (non-empty string / non-empty array / non-zero number) |
| `{{#unless val}} … {{/unless}}` | Inverse of `#if` |

### 3. Helpers the renderer injects

Before rendering, `render.js` enriches the data:

- Every `contact[]` entry gets `_iconSvg` — a raw SVG string for its `icon` key.
  Render it with `{{{_iconSvg}}}`.
- `data._primaryContact` — contact entries that aren't social (email, phone,
  location, website).
- `data._socialContact` — social entries (linkedin, github, x, stackoverflow).

Iterate `contact` for everything, or the split arrays for a two-zone header.

Need a new icon? Add an SVG string to the `ICONS` map in `render.js` and the
corresponding enum value in `cv.schema.json`'s `contact.items.icon`.

### 4. Print-readiness

CVs are printed. Your template should:

- Define an `@page { size: A4; margin: 0; }` rule.
- Use `@media print` to drop shadows / screen-only chrome.
- Keep roles together with `page-break-inside: avoid` (or `break-inside: avoid`).
- Survive the auto-scaler in `html_to_pdf.py`, which shrinks the page from
  `1.00` down to `0.80` to fit one page. Design for `1.00`; let the scaler
  handle overflow.

[`skill/template.html`](skill/template.html) is the reference — read it before
writing your own.

### 5. Test it

```bash
node -e "const {render}=require('./skill/render.js'),fs=require('fs');\
fs.writeFileSync('/tmp/out.html', render(fs.readFileSync('./skill/YOUR-TEMPLATE.html','utf8'), require('./skill/cv.example.json')))"
python3 skill/html_to_pdf.py /tmp/out.html /tmp/out.pdf
```

Check it renders the example cleanly at scale ≥ 0.90 on one page.

### 6. Wire it up

Right now `SKILL.md` references a single `template.html`. If you're adding a
template, also:

- Add your file as `skill/template-{name}.html`.
- Update the **Phase 4 — Rendering** section of `SKILL.md` so Claude knows the
  template exists and when to offer it.
- Add a screenshot to `examples/` so reviewers can see it.

If you'd rather just propose the template and let a maintainer wire it into
`SKILL.md`, that's fine too — open the PR and say so.

---

## Other contributions

- **Workflow / prompt improvements** — `SKILL.md` is the brain. If the interview
  or tailoring logic can be sharper, edit it. Keep the truth rules intact.
- **Schema changes** — these ripple into every template. Open an issue first to
  discuss.
- **Renderer bugs** — `render.js` and `html_to_pdf.py` are intentionally small
  and dependency-light. Keep them that way.

## Pull request checklist

- [ ] The example still renders: `1 page at scale 0.90` (or better).
- [ ] No new runtime dependencies in `render.js` (it must stay zero-dep).
- [ ] New templates include a screenshot in `examples/`.
- [ ] If you changed behavior, `SKILL.md` reflects it.
