# Embed Builder — Handoff / Developer Guide

**Root:** `E:\Ean server assests\Ean Applications\DiscordEmbeder`
**Type:** Multi-file static web app. No build step, no dependencies, no server. Open `embed-builder.html` directly (double-click), or serve the folder statically.

---

## 1. What this app is

A browser-only Discord webhook message builder, styled like Discohook. It composes a Discord message (text + embeds + action rows with buttons/selects/Components V2), shows a live Discord-style preview, and can:

- **Send** the message directly to a webhook URL (browser `fetch`, no server).
- **Attach files** to a send via multipart `FormData` (`files[0]`, `files[1]`...).
- **Export JSON** (downloads `embed-payload.json` via Blob) and **Import JSON** (`prompt()` paste).
- **Copy JSON** to clipboard.
- **Auto-save draft** + webhook URL to `localStorage`.
- **Reset** ("New Message").

The JSON output is a valid Discord webhook payload:
`{ content, embeds: [...], components: [...] }`

---

## 2. File layout & module load order

```
DiscordEmbeder/
  embed-builder.html   # shell: markup + <link>/<script> tags only
  css/style.css        # all styles
  js/
    state.js           # state object + helpers + all new* factories
    limits.js          # LIMITS table + updateCounters() + messageTotalChars()
    registry.js        # COMPONENT_TYPES registry (editors/serializers/deserializers/previews/validators)
    persistence.js     # localStorage draft + webhook URL
    embeds.js          # renderEmbeds + moveEmbed + cleanupFiles
    components.js      # renderComponents + makeCompCell + wireComponent (incl. nested children)
    preview.js         # renderPreview
    payload.js         # buildPayload + renderJson
    send.js            # sendWebhook + showStatus
    io.js              # exportJson / importJson / applyPayload
    selection.js       # selected state + selectTarget/applySelection
    history.js         # undo/redo
    layers.js          # renderLayers (tree, drag-reorder, nested comps)
    validation.js      # validate + renderValidation + autoFix
    layout.js          # mode tabs, advanced toggle, resizers, quick-adds
    app.js             # renderAll + init + wiring
  tests/
    harness.js         # inlines all js/* into the HTML for jsdom
    test-embed.js      # component export, payload, import, focus, live counters
    test-preview.js    # preview rendering
    test-components.js # button/select export from the editor UI
    test-rt.js         # round-trip export -> apply -> export
    test-newfeatures.js# registry, undo/redo, validation, hidden, layers, drag, autofix, keyboard
    test-components-v2.js # Components V2 types + nesting + round-trip
```

**Module load order (must stay):** `state → limits → registry → persistence → embeds → components → preview → payload → send → io → selection → history → layers → validation → layout → app`. The HTML shell lists them in this order. `COMPONENT_TYPES` captures function references at load time, so every `render*`/`serialize*`/`preview*`/`validate*` helper must be defined **above** the `const` in `registry.js`. `layout.js` must load after `selection.js`/`history.js` (uses `selectTarget`/`beforeEdit`) and before `app.js`; it never calls `renderAll()` at load time.

---

## 3. State model (the single source of truth)

`state` is a global `const` object. Every render function reads from it; every input handler mutates it, then calls a render.

```js
const state = {
  content: "",
  embeds: [],         // array of embed objects (newEmbed())
  components: [],     // array of action rows { comps: [component...] }
  files: []           // { name, file, usage:"thumbnail"|"image", embedIndex }
};
```

### Embed object shape (from `newEmbed()`)
```js
{
  id: "e1",
  authorName:"", authorUrl:"", authorIcon:"",
  title:"", url:"",
  description:"",
  color:"#5865f2",
  fields:[ {name:"", value:"", inline:false} ],
  thumb:"",   // URL or "attachment://name.png" when a file is uploaded
  image:"",   // URL or "attachment://name.png"
  footerText:"", footerIcon:"",
  timestamp:false,
  hidden:false
}
```

### Component shapes
```js
// button (newButton()) — styles 1=pri 2=sec 3=suc 4=dan 5=link
{ id, type:"button", style:1, label:"", emoji:"", customId:"btn_xxx", url:"", disabled:false }

// string select (newSelect())
{ id, type:"select", customId:"sel_xxx", placeholder:"", min:1, max:1,
  options:[ {label:"", value:"", description:"", emoji:""} ] }

// member selects (newSelectVariant(kind)) — kind: select-user/role/mentionable/channel
{ id, type:kind, customId:"sel_xxx", placeholder:"", min:0, max:1, channelTypes:"" }

// markdown (newMarkdown())            → { id, type:"markdown", content:"" }
// accessory image (newAccessoryImage())→ { id, type:"accessory-image", src:"", alt:"" }
// checkbox/radio group (newCheckboxGroup()/newRadioGroup())
{ id, type:"checkbox-group"|"radio-group", customId:"grp_xxx", min:0, max:1,
  options:[ {label:"", value:"", description:"", emoji:""} ] }

// section (newSection())  → { id, type:"section", children:[component...], accessory:component|null }
// container (newContainer()) → { id, type:"container", children:[component...] }

// action row (newRow())   → { id, comps:[component...], hidden:false }   // max 5 comps/row
```

**IMPORTANT convention:** new components start **empty**. This is deliberate so that rows the user never configures are filtered out of the export (`compHasContent` decides). A fresh section/container exports nothing until it holds a configured child; member selects export only once a placeholder is set.

---

## 4. Key functions (index)

| Function | Purpose |
|---|---|
| `renderAll()` | Re-renders editor + preview + JSON + counters. Use for **structural** changes (add/delete/duplicate/move/upload/import/reset). |
| `renderPreview()` + `renderJson()` | Light refresh for **typing** (preserves input focus). Do NOT re-render the editor on keystrokes. |
| `buildPayload()` | Builds the Discord payload from `state`. **The critical export function.** |
| `applyPayload(p)` | Imports JSON into `state` (handles `{messages:[...]}` wrapper, `thumbnail.url`, `color` int→hex, emoji objects→strings). Returns `true`/`false`. |
| `compHasContent(c)` | Filters empty components (see §3 convention). |
| `embedHasContent(em)` | Filters empty embeds from export. |
| `moveEmbed(from, to)` | Reorders `state.embeds` and remaps `state.files[].embedIndex`. |
| `sendWebhook()` | Posts `buildPayload()` to `#webhook` (JSON or multipart if `state.files`). |
| `showStatus(kind,text)` | Status banner (ok/err). |
| `esc(s)` / `escAttr(s)` | HTML-escape helpers. |
| `hexToInt` / `intToHex` / `normalizeHex` | Color conversions. |
| `urlVal(s)` | Trims URL strings; returns `undefined` if empty. |
| `saveDraft()` | `localStorage` keys: `wh_url`, `embed_builder_draft`. |
| `updateCounters()` | Refreshes every `[data-cnt]` counter + the `#msgTotal` message budget (6000). |
| `messageTotalChars()` | Sum of content + all embed text (Discord's 6000-char cap). |
| `beforeEdit()` / `commitHistory(src)` / `undo()` / `redo()` | Undo/redo system (see §4b). |
| `selectTarget(t)` / `applySelection()` | Click-to-select model (content/embed/row/comp). |
| `renderLayers()` / `renderCompTree()` | Layers tree (nested comps, drag-reorder). |
| `validate()` / `renderValidation()` / `autoFix()` | Discord limit validation + one-click clean. |

Wire-up / event binding happens at module load (each module self-wires via `$("id").onclick` etc.).

---

## 4b. Component registry, undo/redo, layers, validation, counters

### Component registry (add a type = add one definition)
`COMPONENT_TYPES` maps `type → { label, create(), editor(c), preview(c), serialize(c), deserialize(c), validate(c), childTypes? }`. The renderer, export, import, preview, and validation all go through this map — adding a type means adding one entry plus an `editor` snippet.

Registered types and their Discord `type` ints (`COMPONENT_TYPES_BY_DISCORD_TYPE`):
`button(2)`, `select(3)`, `select-user(5)`, `select-role(6)`, `select-mentionable(7)`, `select-channel(8)`, `markdown(9)`, `accessory-image(10)`, `section(11)`, `container(12)`, `checkbox-group(13)`, `radio-group(14)`. `text-input(4)` is intentionally **not** registered (modal-only; import skips it).

- `serialize` returns `null` when empty; `deserialize` rebuilds the internal shape.
- **Nesting:** `section`/`container` hold `children` (and sections a single `accessory`). Their `serialize`/`deserialize` recurse via `serializeComp()`/`deserializeComp()` (defined in `registry.js`). `childTypes` controls which types the editor's "+ add" menu offers.
- `renderComponents` builds the row dropdown from `Object.entries(COMPONENT_TYPES)`, so new types appear automatically.
- Keep legacy names `newButton`/`newSelect`/`newRow` (tests depend on them).

### Undo / redo (post-mutation snapshots)
- `history = { stack, index:-1, max:60 }`. Snapshots taken **after** a mutation.
- `beforeEdit()` only sets `pendingEdit = true`. Structural ops end in `renderAll()`, which calls `commitHistory(null)` (never coalesces).
- Typing ops call `commitHistory(src)`; commits with the **same `src` within 600ms** coalesce into one undo step. Srcs: `"content"`, `"fnN"`, `"fvN"`, `"filN"`, `"em{i}-{field}"`, `"cf{field}"`, `"onN"`, `"ovN"`.
- `undo()`/`redo()` swap `state` from the stack and call `restoreSnapshot()`.
- **Known limitation:** `state.files` (File objects) aren't serializable, so undo clears attachments.
- Keyboard: `Ctrl+Z` undo, `Ctrl+Y`/`Ctrl+Shift+Z` redo, `Delete` removes the selected embed/row/top-level comp.

### Selection model
`selected = { kind:"content"|"embed"|"row"|"comp", idx?, ri?, ci? }`. Nested children are edited inline and aren't individually selectable (selecting a section/container selects the whole subtree).

### Layers tree (`#layerTree`)
`renderLayers()` renders `Message → Embeds → Rows → comps → nested comps`. Embed and row items are **draggable** (reorder via drag-drop; embed drops call `moveEmbed` so file bindings stay correct). Each row/embed has an `.eye` toggle; clicking a layer selects and scrolls to it.

### Validation (`#validationPanel`, `#btnAutoFix`)
- `validate()` returns `[{kind:"error"|"warn", what, msg}]` and delegates to per-type validators in the registry (recursing into sections/containers, checking nesting depth ≤ 5). Hidden embeds/rows are skipped.
- `renderValidation()` shows a count badge + issue list (`.error`/`.warn`), capped at 12, and calls `updateCounters()`.
- `autoFix()` removes empty/hidden embeds, empty fields, empty/hidden rows, empty comps and options; re-renders.

### Live character counters (`js/limits.js`)
- `LIMITS` holds all Discord limits (content 2000, title 256, description 4096, field 256/1024, footer 2048, button label 80, custom_id 100, option label/value 100, 6000 message budget, etc.).
- Any input with `data-limit` sitting in a `.cnt-wrap` next to an empty `<span data-cnt>` gets a live `n/limit` counter (red when over, amber ≥ 90%). `#msgTotal` shows the whole-message 6000 budget.
- `updateCounters()` mutates only counter text/color — never rebuilds the editor — so it is safe inside the focus-preservation typing path (it is invoked from `renderValidation()`).

---

## 5. UI layout (Discohook-style)

- **Top bar:** logo + webhook URL input + green **Send** button + Export JSON / Import / New Message.
- **Left pane (editor):** Message Content card → Embeds section (`+ Add Embed`) → Message Components section (`+ Add Action Row`). Each action row's dropdown lists every registered component type; sections/containers render their children as dashed nested sheets with an inline "+ add" picker and up/down/delete buttons.
- **Right pane:** Preview/JSON tabs. Preview renders embeds plus component previews, including nested section/container boxes, markdown text, choice groups, and media images.

CSS palette (Discord): `--bg:#1e1f22`, `--panel:#2b2d31`, `--panel2:#313338`, `--blurple:#5865f2`, `--link:#00a8fc`, `--danger:#da373c`, `--ok:#23a55a`, text `#dbdee1`, muted `#949ba4`.

Button style classes: `.actbtn.pri/.sec/.suc/.dan/.link` (via `STYLES = {1:"pri",2:"sec",3:"suc",4:"dan",5:"link"}`).

---

## 6. Testing (how we verify)

jsdom (installed once in `C:\Users\eacam\AppData\Local\Temp\opencode`), no server needed: `tests/harness.js` reads `embed-builder.html` and **inlines every `<script src="js/...">`** so `runScripts:"dangerously"` works; each suite injects its own `<script>` before `</body>` and asserts against `state`, `buildPayload()`, and the DOM.

Run from `tests\`:

```
node test-embed.js
node test-preview.js
node test-components.js
node test-rt.js
node test-newfeatures.js
node test-components-v2.js
```

Covered suites:
1. **test-embed** — empty components not exported; labelled/emoji/url-only buttons; empty selects dropped; mixed rows export only filled comps; link buttons; full payload regression (embeds/author/fields/color/thumb/image/timestamp/components/content); import regression (Discord format, `{messages}` wrapper, invalid inputs rejected); **focus preservation** (typing must not rebuild the editor); **live counters** (LIMITS, per-field `n/max`, `#msgTotal`).
2. **test-preview** — Discord-like card, avatar, BOT badge, timestamp, embed border color, inline fields, emoji CDN image, select placeholder.
3. **test-components** — button/select editor → export through the actual UI (fresh rows not exported).
4. **test-rt** — round-trip `export → apply → export` identical.
5. **test-newfeatures** — registry create/map, undo/redo (typing coalescing, undo restores input), validation, hidden embeds/rows, layers tree (render/click-select/eye toggle), **layers drag-reorder**, auto-fix, keyboard Delete, import resets hidden.
6. **test-components-v2** — V2 registry + type map, empty V2 comps not exported, member selects (types 5/7/8 + channel_types), markdown/image (9/10), checkbox/radio groups (13/14), section children + accessory, container nesting, V2 round-trip, previews render.

**Syntax check:** `node -e "new Function(require('fs').readFileSync(process.argv[1],'utf8'))" <file.js>` on each module.

All suites currently pass (exit 0).

---

## 7. Known limitations / TODO

- **No markdown rendering in preview** — content/descriptions show raw text (`**bold**` shows literally). A tiny inline markdown renderer would match Discohook.
- **No modal-based editors** — embeds and components use inline cards; a Discohook clone uses modals.
- **Attachment URLs can't persist** — uploaded files attach only to the immediate send (no server by design).
- **Preview always shows "You"/"BOT"** and channel `# preview` — no webhook lookup (requires CORS-friendly GET).
- **Emoji preview** uses Discord's CDN — requires internet; harmless offline.
- **`sendWebhook` relies on browser CORS** — Discord webhooks work from `file://`; blocked servers show the Discord error.
- Limits are validated and counters shown, but not **hard-enforced** (typing past a limit is allowed; validation flags it).
- `state.files` are cleared on undo (File objects aren't serializable).

---

## 8. How to make changes safely

1. Keep `state` as the single source of truth.
2. **Keep the module load order** (see §2). If you add a module, add its `<script>` tag in the HTML shell at the right position — the harness picks it up automatically.
3. Follow the **focus-preservation rule**: on `input` events call `renderPreview(); renderJson();` (typing path also triggers `renderValidation()` → counters) — never `renderAll()` (that rebuilds the editor and kills the caret). End the handler with `commitHistory(src)`.
4. Use `renderAll()` only for structural actions (add/remove/duplicate/move/upload/import/reset).
5. **Adding a component type = one `COMPONENT_TYPES` entry** in `registry.js` (above the `const`!) plus the state factory in `state.js`. If it nests, implement children in `makeCompCell`/`wireComponent` (`components.js`), recursion in `serializeComp`/`deserializeComp`/preview/`renderCompTree`, and give it a `childTypes` list.
6. After editing: syntax-check each module + run the 6 jsdom suites + a browser smoke test (double-click `embed-builder.html`).

---

## 9. Suggested next steps (Discohook parity)

- Markdown rendering in the preview (bold/italic/links/code) via a tiny inline renderer.
- Modal-based embed + component editors.
- Webhook lookup (`fetch(webhookUrl)` GET) to show real channel name + avatar in preview.
- Hard client-side limit enforcement (block adds past max; currently validation-only).
- Property-editor panel for the layers tree (all types already have inline editors, so this is optional polish).
- "Send to multiple webhooks" / message library.
