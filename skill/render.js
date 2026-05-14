/**
 * Tiny CV template renderer.
 *
 * Supports five constructs (Mustache-flavored):
 *   {{path.to.value}}             escape-safe variable substitution
 *   {{{path.to.value}}}           raw (unescaped) HTML — used for bullets that contain <strong>
 *   {{#each arr}} ... {{/each}}   loop; inside, "this" is current item, fields resolve directly
 *   {{#if val}} ... {{/if}}       conditional; truthy strings, non-empty arrays, non-zero numbers
 *   {{#unless val}} ... {{/unless}}  inverse of #if
 *
 * Before rendering, render() also auto-resolves contact icons: each entry in
 * `data.contact` gets an `_iconSvg` field containing the raw SVG string for its
 * `icon` key (templates render it with {{{_iconSvg}}}). It also derives two
 * convenience arrays from `data.contact` for templates that want to split
 * primary contacts (email/phone/location/website) from social profiles
 * (linkedin/github/x/stackoverflow):
 *   data._primaryContact  — non-social entries
 *   data._socialContact   — social entries
 * Templates may iterate `contact` (everything) or the split arrays.
 *
 * Usage:
 *   const html = render(templateString, dataObject);
 */

// Inline icon library. Add new icons here; reference by key in cv.json.
// Each value is a raw SVG string (currentColor for theming).
const ICONS = {
  email:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  phone:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>',
  location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  website:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43c-1.14 0-2.07-.93-2.07-2.07s.93-2.07 2.07-2.07c1.14 0 2.07.93 2.07 2.07s-.93 2.07-2.07 2.07zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
  github:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.57v-2.05c-3.34.72-4.05-1.6-4.05-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.1-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.08 1.84 2.81 1.3 3.5 1 .1-.78.42-1.3.77-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.21.69.82.57A12 12 0 0 0 12 .3"/></svg>',
  x:        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  stackoverflow: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.36 20.2v-5.38h1.79V22H3v-7.18h1.79v5.38h12.57zM6.77 14.32l8.77 1.83.37-1.76-8.77-1.83-.37 1.76zm1.16-4.21l8.12 3.78.76-1.62-8.12-3.8-.76 1.64zm2.25-4l6.88 5.73 1.14-1.38L11.32 4.7l-1.14 1.41zM14.61 1l-1.44 1.07 5.32 7.16 1.44-1.07L14.61 1zM6.59 18.41h8.93v-1.79H6.59v1.79z"/></svg>',
  link:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
};

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolvePath(ctx, path) {
  if (path === "this" || path === ".") return ctx[0];
  const parts = path.split(".");
  // Walk the context stack from innermost outward, so {{name}} inside an #each
  // resolves to the current item's name first.
  for (const frame of ctx) {
    let cur = frame;
    let ok = true;
    for (const p of parts) {
      if (cur != null && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        ok = false;
        break;
      }
    }
    if (ok) return cur;
  }
  return undefined;
}

function isTruthy(v) {
  if (v == null || v === false || v === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

const SOCIAL_ICONS = new Set(["linkedin", "github", "x", "stackoverflow"]);

// Typographic characters LLMs tend to emit, mapped to plain keyboard
// equivalents. Applied to every string value in the CV data before templating
// so the rendered CV stays in plain ASCII punctuation. This only runs over
// cv.json *content* — the template's own typography (role separators, date
// joiners) is never touched.
const TYPO_REPLACEMENTS = [
  [/[—–―‒]/g, " - "],  // em / en / horizontal / figure dash
  [/−/g, "-"],                        // minus sign
  [/—/g, "-"],                        // figure sign
  [/[“”„‟]/g, '"'],    // smart double quotes
  [/[‘’‚‛]/g, "'"],    // smart single quotes / apostrophes
  [/″/g, '"'],                        // double prime
  [/′/g, "'"],                        // prime
  [/…/g, "..."],                      // horizontal ellipsis
  [/×/g, "x"],                        // multiplication sign
  [/[        ]/g, " "], // no-break / fixed-width spaces
  [/[​‌‍⁠﻿]/g, ""] // zero-width characters
];

function normalizeText(str) {
  let out = String(str);
  for (const [re, rep] of TYPO_REPLACEMENTS) out = out.replace(re, rep);
  return out.replace(/ {2,}/g, " "); // collapse runs of spaces (spaced hyphens can create them)
}

function normalizeData(value) {
  if (typeof value === "string") return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizeData);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = normalizeData(value[k]);
    return out;
  }
  return value;
}

function render(template, data) {
  // Normalize typographic characters across all CV content first, so every
  // downstream step (icon resolution, templating) sees plain-ASCII strings.
  data = normalizeData(data);

  // Resolve contact icons: each contact entry gets a raw _iconSvg string.
  // Also split into primary/social for templates that want a two-zone header.
  // Non-mutating — we shallow-clone data and the contact array.
  if (Array.isArray(data && data.contact)) {
    const contact = data.contact.map(item => ({
      ...item,
      _iconSvg: ICONS[item.icon] || ICONS.link
    }));
    data = {
      ...data,
      contact,
      _primaryContact: contact.filter(c => !SOCIAL_ICONS.has(c.icon)),
      _socialContact: contact.filter(c => SOCIAL_ICONS.has(c.icon))
    };
  }

  // Tokenize: walk through the string and find {{...}} blocks.
  // Tokens are plain text, variable, raw variable, #if, /if, #each, /each.
  const tokens = [];
  const re = /\{\{\{(.+?)\}\}\}|\{\{([#\/]?)\s*(.+?)\s*\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(template)) !== null) {
    if (m.index > last) tokens.push({ t: "text", v: template.slice(last, m.index) });
    if (m[1] !== undefined) {
      tokens.push({ t: "raw", v: m[1].trim() });
    } else {
      const sigil = m[2];
      const body = m[3];
      if (sigil === "#") {
        const [kw, ...rest] = body.split(/\s+/);
        if (kw === "each" || kw === "if" || kw === "unless") {
          tokens.push({ t: kw, v: rest.join(" ") });
        } else {
          // Unknown block — treat as variable
          tokens.push({ t: "var", v: body });
        }
      } else if (sigil === "/") {
        tokens.push({ t: "end", v: body.trim() });
      } else {
        tokens.push({ t: "var", v: body });
      }
    }
    last = m.index + m[0].length;
  }
  if (last < template.length) tokens.push({ t: "text", v: template.slice(last) });

  // Recursive walker over tokens.
  function walk(start, end, ctx) {
    let out = "";
    let i = start;
    while (i < end) {
      const tok = tokens[i];
      if (tok.t === "text") {
        out += tok.v;
        i++;
      } else if (tok.t === "var") {
        out += escapeHtml(resolvePath(ctx, tok.v));
        i++;
      } else if (tok.t === "raw") {
        const val = resolvePath(ctx, tok.v);
        out += val == null ? "" : String(val);
        i++;
      } else if (tok.t === "each" || tok.t === "if" || tok.t === "unless") {
        // Find matching {{/each}}, {{/if}}, or {{/unless}}, respecting nesting.
        const opener = tok.t;
        let depth = 1;
        let j = i + 1;
        while (j < end && depth > 0) {
          if (tokens[j].t === "each" || tokens[j].t === "if" || tokens[j].t === "unless") depth++;
          else if (tokens[j].t === "end") depth--;
          if (depth === 0) break;
          j++;
        }
        const innerStart = i + 1;
        const innerEnd = j;
        const val = resolvePath(ctx, tok.v);
        if (opener === "each") {
          if (Array.isArray(val)) {
            for (const item of val) {
              out += walk(innerStart, innerEnd, [item, ...ctx]);
            }
          }
        } else if (opener === "if") {
          if (isTruthy(val)) out += walk(innerStart, innerEnd, ctx);
        } else { // unless
          if (!isTruthy(val)) out += walk(innerStart, innerEnd, ctx);
        }
        i = j + 1; // skip past the {{/...}}
      } else {
        // {{/...}} encountered at top level — skip
        i++;
      }
    }
    return out;
  }

  return walk(0, tokens.length, [data]);
}

// Export for both Node.js and browser global usage.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { render };
}
if (typeof window !== "undefined") {
  window.cvRender = render;
}
