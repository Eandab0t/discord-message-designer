"use strict";
/* ================= component registry ================= */

const STYLES = { 1:"pri", 2:"sec", 3:"suc", 4:"dan", 5:"link" };
const STYLE_NAMES = ["", "Primary", "Secondary", "Success", "Danger", "Link"];

/* ---- editors ---- */
function renderButtonEditor(c){
  const styleSel = [1,2,3,4,5].map(s => `<option value="${s}" ${c.style===s?"selected":""}>${STYLE_NAMES[s]}</option>`).join("");
  return `
    <div class="row2">
      <div class="cnt-wrap">
        <input type="text" data-cf="label" data-limit="${LIMITS.buttonLabel}" value="${escAttr(c.label)}" placeholder="Text" />
        <span data-cnt></span>
      </div>
      <select data-cf="style">${styleSel}</select>
    </div>
    <div class="row2" style="margin-top:6px">
      <input type="text" data-cf="emoji" value="${escAttr(c.emoji)}" placeholder="Emoji" />
      <div class="cnt-wrap adv">
        <input type="text" data-cf="customId" data-limit="${LIMITS.customId}" value="${escAttr(c.customId)}" placeholder="Custom ID" />
        <span data-cnt></span>
      </div>
    </div>
    ${c.style===5 ? `<input type="text" data-cf="url" value="${escAttr(c.url)}" placeholder="https://..." style="margin-top:6px" />` : ""}
    <div class="inline-check adv" style="margin-top:6px;justify-content:flex-start">
      <input type="checkbox" data-cf="disabled" ${c.disabled?"checked":""} /> Disabled
    </div>`;
}

function renderSelectEditor(c){
  return `
    <div class="cnt-wrap">
      <input type="text" data-cf="placeholder" data-limit="${LIMITS.selectPlaceholder}" value="${escAttr(c.placeholder)}" placeholder="Placeholder" />
      <span data-cnt></span>
    </div>
    <div class="row2 adv" style="margin-top:6px">
      <div class="cnt-wrap">
        <input type="text" data-cf="customId" data-limit="${LIMITS.customId}" value="${escAttr(c.customId)}" placeholder="Custom ID" />
        <span data-cnt></span>
      </div>
      <div class="row2" style="gap:4px">
        <input type="number" data-cf="min" value="${c.min}" min="0" title="Min values" />
        <input type="number" data-cf="max" value="${c.max}" min="1" max="25" title="Max values" />
      </div>
    </div>
    <div data-selopts style="margin-top:6px"></div>
    <button class="btn sm" data-act="addopt">+ Add Option</button>`;
}

function renderSelectVariantEditor(c){
  return `
    <div class="cnt-wrap">
      <input type="text" data-cf="placeholder" data-limit="${LIMITS.selectPlaceholder}" value="${escAttr(c.placeholder)}" placeholder="Placeholder" />
      <span data-cnt></span>
    </div>
    <div class="row2 adv" style="margin-top:6px">
      <div class="cnt-wrap">
        <input type="text" data-cf="customId" data-limit="${LIMITS.customId}" value="${escAttr(c.customId)}" placeholder="Custom ID" />
        <span data-cnt></span>
      </div>
      ${c.type === "select-channel"
        ? `<input type="text" data-cf="channelTypes" value="${escAttr(c.channelTypes)}" placeholder="Channel types: 0,1,2" />`
        : `<div class="row2" style="gap:4px">
             <input type="number" data-cf="min" value="${c.min}" min="0" title="Min values" />
             <input type="number" data-cf="max" value="${c.max}" min="1" max="25" title="Max values" />
           </div>`}
    </div>`;
}

function renderMarkdownEditor(c){
  return `
    <div class="cnt-wrap">
      <textarea data-cf="content" data-limit="${LIMITS.sectionText}" placeholder="Markdown text">${esc(c.content)}</textarea>
      <span data-cnt></span>
    </div>`;
}

function renderThumbnailEditor(c){
  return `
    <div class="cnt-wrap">
      <input type="text" data-cf="src" value="${escAttr(c.src)}" placeholder="https://image.png" />
      <span data-cnt></span>
    </div>
    <div class="adv" style="margin-top:6px">
      <input type="text" data-cf="alt" value="${escAttr(c.alt)}" placeholder="Description" style="margin-top:0" />
    </div>`;
}

function renderSeparatorEditor(c){
  return `
    <div class="row2">
      <select data-cf="spacing">
        <option value="1" ${c.spacing===1?"selected":""}>Small</option>
        <option value="2" ${c.spacing===2?"selected":""}>Large</option>
      </select>
      <div class="inline-check" style="justify-content:flex-start">
        <input type="checkbox" data-cf="divider" ${c.divider?"checked":""} /> Divider
      </div>
    </div>`;
}

function renderMediaGalleryEditor(c){
  return `
    <div data-galleryitems style="margin-top:0"></div>
    <button class="btn sm" data-act="addmedia">+ Add Media</button>`;
}

function renderFileEditor(c){
  return `
    <div class="cnt-wrap">
      <input type="text" data-cf="name" value="${escAttr(c.name)}" placeholder="filename.pdf" />
      <span data-cnt></span>
    </div>
    <div class="inline-check" style="margin-top:6px;justify-content:flex-start">
      <input type="checkbox" data-cf="spoiler" ${c.spoiler?"checked":""} /> Spoiler
    </div>`;
}

function renderSelectOption(oi, o){
  return `<div class="field-row">
    <div class="cnt-wrap">
      <input type="text" data-on="${oi}" placeholder="Label" data-limit="${LIMITS.selectOptionLabel}" value="${escAttr(o.label)}" />
      <span data-cnt></span>
    </div>
    <div class="cnt-wrap">
      <input type="text" data-ov="${oi}" placeholder="Value" data-limit="${LIMITS.selectOptionValue}" value="${escAttr(o.value)}" />
      <span data-cnt></span>
    </div>
    <button class="btn sm danger" data-opdel="${oi}" title="Remove option">&#x2715;</button>
  </div>`;
}

function renderSectionEditor(c){
  return `
    <div class="nested-head">
      <span>Text blocks</span>
      <select data-cadd><option value="">+ add</option><option value="markdown">Text</option></select>
    </div>
    <div data-cchildren></div>
    <div class="nested-head" style="margin-top:6px">
      <span>Accessory</span>
      <select data-caccset><option value="">none</option>
        <option value="button">Button</option>
        <option value="accessory-image">Thumbnail</option>
      </select>
    </div>
    <div data-cacc></div>`;
}

function renderContainerEditor(c){
  const opts = getChildTypes("container").map(t => { const d = COMPONENT_TYPES[t]; return d ? `<option value="${t}">${d.label}</option>` : ""; }).join("");
  return `
    <div class="nested-head">
      <span>Children</span>
      <select data-cadd><option value="">+ add</option>${opts}</select>
    </div>
    <div data-cchildren></div>
    <div class="row2 adv" style="margin-top:8px">
      <div class="cnt-wrap">
        <input type="text" data-cf="accentColor" value="${escAttr(c.accentColor)}" placeholder="Accent color (#hex)" />
        <span data-cnt></span>
      </div>
      <div class="inline-check" style="justify-content:flex-start">
        <input type="checkbox" data-cf="spoiler" ${c.spoiler?"checked":""} /> Spoiler
      </div>
    </div>`;
}

function renderActionRowEditor(c){
  const opts = getChildTypes("action-row").map(t => { const d = COMPONENT_TYPES[t]; return d ? `<option value="${t}">${d.label}</option>` : ""; }).join("");
  return `
    <div class="nested-head">
      <span>Components</span>
      <select data-cadd><option value="">+ add</option>${opts}</select>
    </div>
    <div data-cchildren></div>`;
}

/* ---- serializers: internal -> Discord JSON ---- */
function serializeButton(c){
  if (!compHasContent(c)) return null;
  const b = { type: 2, style: c.style, label: c.label };
  if (c.emoji) b.emoji = parseEmoji(c.emoji);
  if (c.style === 5) { const u = urlVal(c.url); if (u) b.url = u; }
  else { b.custom_id = c.customId || ("btn_"+uid()); }
  if (c.disabled) b.disabled = true;
  return b;
}
function serializeSelect(c){
  const opts = c.options.filter(o => o.label).map(o => {
    const op = { label:o.label, value:o.value || o.label };
    if (o.description) op.description = o.description;
    if (o.emoji) op.emoji = parseEmoji(o.emoji);
    return op;
  });
  if (!opts.length) return null;
  const s = { type: 3, custom_id: c.customId || ("sel_"+uid()), options: opts };
  if (c.placeholder) s.placeholder = c.placeholder;
  if (c.min) s.min_values = c.min;
  if (c.max) s.max_values = c.max;
  return s;
}
const MEMBER_SELECT_TYPES = { "select-user":5, "select-role":6, "select-mentionable":7, "select-channel":8 };
function serializeMemberSelect(c){
  if (!(c.placeholder || "").trim()) return null;
  const m = { type: MEMBER_SELECT_TYPES[c.type] || 5, custom_id: c.customId || ("sel_" + uid()) };
  if (c.placeholder) m.placeholder = c.placeholder;
  if (c.min) m.min_values = c.min;
  if (c.max) m.max_values = c.max;
  if (c.type === "select-channel" && c.channelTypes) {
    const ct = String(c.channelTypes).split(",").map(s => +s.trim()).filter(n => !isNaN(n));
    if (ct.length) m.channel_types = ct;
  }
  return m;
}
function serializeMarkdown(c){
  if (!(c.content || "").trim()) return null;
  return { type: 10, content: c.content };
}
function serializeThumbnail(c){
  const src = urlVal(c.src);
  if (!src) return null;
  const t = { type: 11, media: { url: src } };
  if ((c.alt || "").trim()) t.description = c.alt;
  return t;
}
function serializeSeparator(c){
  return { type: 14, spacing: c.spacing || 1, divider: c.divider !== false };
}
function serializeMediaGallery(c){
  const items = (c.items||[]).filter(m => m.media).map(m => {
    const item = { media: { url: m.media } };
    if (m.alt) item.description = m.alt;
    if (m.spoiler) item.spoiler = true;
    return item;
  });
  if (!items.length) return null;
  return { type: 12, items };
}
function serializeFile(c){
  const name = (c.name||"").trim();
  if (!name) return null;
  const f = { type: 13, name };
  if (c.spoiler) f.spoiler = true;
  return f;
}
function serializeSection(c){
  const kids = (c.children||[]).filter(compHasContent).map(serializeComp).filter(Boolean);
  let acc = null;
  if (c.accessory && compHasContent(c.accessory)) acc = serializeComp(c.accessory);
  if (!kids.length && !acc) return null;
  const s = { type: 9, components: kids };
  if (acc) s.accessory = acc;
  return s;
}
function serializeContainer(c){
  const kids = (c.children||[]).filter(compHasContent).map(serializeComp).filter(Boolean);
  if (!kids.length) return null;
  const ct = { type: 17, components: kids };
  if (c.accentColor) ct.accent_color = hexToInt(c.accentColor);
  if (c.spoiler) ct.spoiler = true;
  return ct;
}
function serializeActionRow(c){
  const kids = (c.children||[]).filter(compHasContent).map(serializeComp).filter(Boolean);
  if (!kids.length) return null;
  return { type: 1, components: kids };
}
function serializeComp(c){
  if (!c || !compHasContent(c)) return null;
  const def = COMPONENT_TYPES[c.type];
  return def && def.serialize ? def.serialize(c) : null;
}

/* ---- deserializers: Discord JSON -> internal ---- */
function deserializeButton(d){
  const b = newButton();
  b.style = d.style || 1; b.label = d.label || ""; b.customId = d.custom_id || ("btn_"+uid());
  b.url = d.url || ""; b.disabled = !!d.disabled;
  if (d.emoji) b.emoji = d.emoji.id ? `<${d.emoji.animated?"a":""}:${d.emoji.name}:${d.emoji.id}>` : (d.emoji.name || "");
  return b;
}
function deserializeSelect(d){
  const s = newStringSelect();
  s.placeholder = d.placeholder || ""; s.customId = d.custom_id || ("sel_"+uid());
  s.min = d.min_values || 1; s.max = d.max_values || 1;
  s.options = (d.options||[]).map(o => ({ label:o.label||"", value:o.value||"", description:o.description||"", emoji: o.emoji? (o.emoji.id?`<${o.emoji.animated?"a":""}:${o.emoji.name}:${o.emoji.id}>`:o.emoji.name||"") : "" }));
  if (!s.options.length) s.options = [{label:"",value:"",description:"",emoji:""}];
  return s;
}
function deserializeMemberSelect(d, kind){
  const s = newSelectVariant(kind);
  s.placeholder = d.placeholder || ""; s.customId = d.custom_id || ("sel_" + uid());
  s.min = d.min_values || 0; s.max = d.max_values || 1;
  if (kind === "select-channel") s.channelTypes = Array.isArray(d.channel_types) ? d.channel_types.join(",") : "";
  return s;
}
function deserializeMarkdown(d){
  const m = newMarkdown();
  m.content = d.content || "";
  return m;
}
function deserializeThumbnail(d){
  const t = newThumbnail();
  t.src = d.media?.url || d.src || "";
  t.alt = d.description || d.alt || "";
  return t;
}
function deserializeSeparator(d){
  const s = newSeparator();
  s.spacing = d.spacing || 1;
  s.divider = d.divider !== false;
  return s;
}
function deserializeMediaGallery(d){
  const g = newMediaGallery();
  g.items = (d.items||[]).map(m => ({ media: m.media?.url || "", alt: m.description || "", spoiler: !!m.spoiler }));
  return g;
}
function deserializeFile(d){
  const f = newFile();
  f.name = d.name || "";
  f.spoiler = !!d.spoiler;
  return f;
}
function deserializeSection(d){
  const s = newSection();
  s.children = (d.components||[]).map(deserializeComp).filter(Boolean);
  if (d.accessory) { const a = deserializeComp(d.accessory); if (a) s.accessory = a; }
  return s;
}
function deserializeContainer(d){
  const c = newContainer();
  c.children = (d.components||[]).map(deserializeComp).filter(Boolean);
  if (d.accent_color != null) c.accentColor = intToHex(d.accent_color);
  if (d.spoiler) c.spoiler = true;
  return c;
}
function deserializeActionRow(d){
  const r = newActionRow();
  r.children = (d.components||[]).map(deserializeComp).filter(Boolean);
  return r;
}
function deserializeComp(d){
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  const key = COMPONENT_TYPES_BY_DISCORD_TYPE[d.type];
  const def = key ? COMPONENT_TYPES[key] : null;
  return def && def.deserialize ? def.deserialize(d) : null;
}

/* ---- preview renderers ---- */
function previewButtonHtml(c){
  const emoji = emojiHtml(c.emoji);
  const content = emoji + esc(c.label);
  if (c.style === 5) return `<a class="actbtn link" href="${escAttr(c.url)}" target="_blank" style="color:var(--link);text-decoration:none">${content || "&nbsp;"}</a>`;
  return `<button class="actbtn ${STYLES[c.style] || "sec"}"${c.disabled?" disabled":""}>${content || "&nbsp;"}</button>`;
}
function previewSelectHtml(c){
  return `<div class="select-fake">${esc(c.placeholder || "Select an option...")}</div>`;
}
function previewMemberSelectHtml(c){
  return `<div class="select-fake">${esc(c.placeholder || "Select...")}</div>`;
}
function previewMarkdownHtml(c){
  return `<div class="md-text">${esc(c.content)}</div>`;
}
function previewThumbnailHtml(c){
  if (!c.src) return `<div class="acc-img-placeholder">No image</div>`;
  return `<img class="acc-img" src="${escAttr(c.src)}" alt="${escAttr(c.alt)}" />`;
}
function previewSeparatorHtml(c){
  const cls = "sep-preview" + (c.divider === false ? " no-divider" : "");
  return `<hr class="${cls}" style="border:none;${c.spacing===2?"margin:10px 0;":''}" />`;
}
function previewMediaGalleryHtml(c){
  const items = (c.items||[]).filter(m => m.media);
  if (!items.length) return `<div class="md-text" style="font-style:italic;color:var(--muted)">Empty media gallery</div>`;
  return `<div class="mg-preview">${items.map(m => `<img class="acc-img" src="${escAttr(m.media)}" alt="${escAttr(m.alt)}" />`).join("")}</div>`;
}
function previewFileHtml(c){
  return `<div class="file-preview">&#x1F4C4; ${esc(c.name || "file")}</div>`;
}
function previewSectionHtml(c){
  const hasAcc = c.accessory && compHasContent(c.accessory);
  let html = `<div class="c-section${hasAcc ? " has-acc" : ""}">`;
  (c.children||[]).forEach(k => {
    const d = COMPONENT_TYPES[k.type];
    if (compHasContent(k) && d && d.preview) html += d.preview(k);
  });
  if (hasAcc) {
    const d = COMPONENT_TYPES[c.accessory.type];
    html += `<div class="c-acc">${d && d.preview ? d.preview(c.accessory) : ""}</div>`;
  }
  html += `</div>`;
  return html;
}
function previewContainerHtml(c){
  const accentStyle = c.accentColor ? `border-left-color:${escAttr(c.accentColor)};` : "";
  let html = `<div class="c-section c-container" style="${accentStyle}">`;
  (c.children||[]).forEach(k => {
    const d = COMPONENT_TYPES[k.type];
    if (compHasContent(k) && d && d.preview) html += d.preview(k);
  });
  html += `</div>`;
  return html;
}
function previewActionRowHtml(c){
  let html = `<div class="actions-row">`;
  (c.children||[]).forEach(k => {
    const d = COMPONENT_TYPES[k.type];
    if (compHasContent(k) && d && d.preview) html += d.preview(k);
  });
  html += `</div>`;
  return html;
}

/* ---- validation ---- */
function validateButton(c, issues){
  const t = (i, m) => i && issues.push({ kind: "error", what: "button", msg: m });
  const w = (i, m) => i && issues.push({ kind: "warn", what: "button", msg: m });
  w(c.label.length > 80, "Label exceeds 80 chars (" + c.label.length + ").");
  t(c.customId.length > 100, "Custom ID exceeds 100 chars.");
  t(c.style === 5 && !urlVal(c.url), "Link buttons need a URL.");
  t(c.style !== 5 && !c.customId, "Buttons need a custom ID.");
  w(!c.label && !c.emoji && c.style !== 5, "Button has no label or emoji.");
  return issues;
}
function validateSelect(c, issues){
  const t = (i, m) => i && issues.push({ kind: "error", what: "select", msg: m });
  const w = (i, m) => i && issues.push({ kind: "warn", what: "select", msg: m });
  t(c.options.length > 25, "Max 25 options (have " + c.options.length + ").");
  t(c.min > c.max, "Min cannot exceed max.");
  t(c.min < 0, "Min cannot be negative.");
  t(c.max > 25, "Max cannot exceed 25.");
  c.options.forEach((o, oi) => {
    t(o.label.length > 100, "Option " + (oi+1) + " label exceeds 100 chars.");
    t(o.value.length > 100, "Option " + (oi+1) + " value exceeds 100 chars.");
  });
  w(!c.options.some(o => o.label), "No labelled options.");
  return issues;
}
function validateMemberSelect(c, issues){
  const t = (i, m) => i && issues.push({ kind: "error", what: c.type, msg: m });
  const w = (i, m) => i && issues.push({ kind: "warn", what: c.type, msg: m });
  t(c.customId.length > 100, "Custom ID exceeds 100 chars.");
  w(!(c.placeholder || "").trim(), "No placeholder set.");
  if (c.type === "select-channel") {
    const ct = String(c.channelTypes||"").split(",").map(s => +s.trim()).filter(n => !isNaN(n));
    t(ct.length && ct.some(n => n < 0 || n > 16), "Channel types must be 0-16.");
  }
  return issues;
}
function validateMarkdown(c, issues){
  if (c.content.length > 2000) issues.push({ kind: "error", what: "text", msg: "Text exceeds 2000 chars." });
  return issues;
}
function validateThumbnail(c, issues){
  const t = (i, m) => i && issues.push({ kind: "error", what: "thumbnail", msg: m });
  t(!urlVal(c.src), "Needs a media URL.");
  return issues;
}
function validateMediaGallery(c, issues){
  const t = (i, m) => i && issues.push({ kind: "error", what: "media gallery", msg: m });
  t((c.items||[]).length > 10, "Max 10 items.");
  return issues;
}
function validateNested(c, issues, what){
  const t = (i, m) => i && issues.push({ kind: "error", what, msg: m });
  (c.children||[]).forEach(k => { const d = COMPONENT_TYPES[k.type]; if (d && d.validate) d.validate(k, issues); });
  if (c.accessory) { const d = COMPONENT_TYPES[c.accessory.type]; if (d && d.validate) d.validate(c.accessory, issues); }
  if (what === "section") t((c.children||[]).length > 3, "Max 3 text blocks.");
  else if (what === "container") t((c.children||[]).length > 10, "Max 10 children.");
  else if (what === "action-row") t((c.children||[]).length > 5, "Max 5 components.");
  if (what === "container" && nestDepth(c) > 5) t("Nesting exceeds 5 levels.");
  return issues;
}
function nestDepth(c, d){
  d = d || 1;
  if (!c.children || !c.children.length) return d;
  return Math.max.apply(null, c.children.map(k => nestDepth(k, d + 1)));
}
function validateSection(c, issues){ return validateNested(c, issues, "section"); }
function validateContainer(c, issues){ return validateNested(c, issues, "container"); }
function validateActionRow(c, issues){ return validateNested(c, issues, "action-row"); }

/* ================= registry ================= */
const COMPONENT_TYPES = {
  button: {
    label: "Button", icon: "\u25FB", paletteGroup: "interactive",
    create: () => newButton(), editor: renderButtonEditor, preview: previewButtonHtml,
    serialize: serializeButton, deserialize: deserializeButton, validate: validateButton
  },
  select: {
    label: "Select", icon: "\u25BE", paletteGroup: "interactive",
    create: () => newStringSelect(), editor: renderSelectEditor, preview: previewSelectHtml,
    serialize: serializeSelect, deserialize: deserializeSelect, validate: validateSelect
  },
  "select-user": {
    label: "User Select", icon: "\u25BE", paletteGroup: "interactive",
    create: () => newSelectVariant("select-user"), editor: renderSelectVariantEditor, preview: previewMemberSelectHtml,
    serialize: serializeMemberSelect, deserialize: (d) => deserializeMemberSelect(d, "select-user"), validate: validateMemberSelect
  },
  "select-role": {
    label: "Role Select", icon: "\u25BE", paletteGroup: "interactive",
    create: () => newSelectVariant("select-role"), editor: renderSelectVariantEditor, preview: previewMemberSelectHtml,
    serialize: serializeMemberSelect, deserialize: (d) => deserializeMemberSelect(d, "select-role"), validate: validateMemberSelect
  },
  "select-mentionable": {
    label: "Mentionable Select", icon: "\u25BE", paletteGroup: "interactive",
    create: () => newSelectVariant("select-mentionable"), editor: renderSelectVariantEditor, preview: previewMemberSelectHtml,
    serialize: serializeMemberSelect, deserialize: (d) => deserializeMemberSelect(d, "select-mentionable"), validate: validateMemberSelect
  },
  "select-channel": {
    label: "Channel Select", icon: "\u25BE", paletteGroup: "interactive",
    create: () => newSelectVariant("select-channel"), editor: renderSelectVariantEditor, preview: previewMemberSelectHtml,
    serialize: serializeMemberSelect, deserialize: (d) => deserializeMemberSelect(d, "select-channel"), validate: validateMemberSelect
  },
  markdown: {
    label: "Text", icon: "T", paletteGroup: "content",
    create: () => newMarkdown(), editor: renderMarkdownEditor, preview: previewMarkdownHtml,
    serialize: serializeMarkdown, deserialize: deserializeMarkdown, validate: validateMarkdown
  },
  "accessory-image": {
    label: "Thumbnail", icon: "\u25EB", paletteGroup: "content",
    create: () => newThumbnail(), editor: renderThumbnailEditor, preview: previewThumbnailHtml,
    serialize: serializeThumbnail, deserialize: deserializeThumbnail, validate: validateThumbnail
  },
  separator: {
    label: "Separator", icon: "\u2014", paletteGroup: "layout",
    create: () => newSeparator(), editor: renderSeparatorEditor, preview: previewSeparatorHtml,
    serialize: serializeSeparator, deserialize: deserializeSeparator, validate: () => []
  },
  "media-gallery": {
    label: "Gallery", icon: "\u25A6", paletteGroup: "content",
    create: () => newMediaGallery(), editor: renderMediaGalleryEditor, preview: previewMediaGalleryHtml,
    serialize: serializeMediaGallery, deserialize: deserializeMediaGallery, validate: validateMediaGallery
  },
  file: {
    label: "File", icon: "\uD83D\uDCC4", paletteGroup: "content",
    create: () => newFile(), editor: renderFileEditor, preview: previewFileHtml,
    serialize: serializeFile, deserialize: deserializeFile, validate: () => []
  },
  section: {
    label: "Section", icon: "\u25A3", paletteGroup: "layout",
    create: () => newSection(), editor: renderSectionEditor, preview: previewSectionHtml,
    serialize: serializeSection, deserialize: deserializeSection, validate: validateSection
  },
  container: {
    label: "Container", icon: "\u25A2", paletteGroup: "layout",
    create: () => newContainer(), editor: renderContainerEditor, preview: previewContainerHtml,
    serialize: serializeContainer, deserialize: deserializeContainer, validate: validateContainer
  },
  "action-row": {
    label: "Action Row", icon: "\u2261", paletteGroup: "layout",
    create: () => newActionRow(), editor: renderActionRowEditor, preview: previewActionRowHtml,
    serialize: serializeActionRow, deserialize: deserializeActionRow, validate: validateActionRow
  }
};

const COMPONENT_TYPES_BY_DISCORD_TYPE = {
  1: "action-row", 2: "button", 3: "select", 5: "select-user",
  6: "select-role", 7: "select-mentionable", 8: "select-channel",
  9: "section", 10: "markdown", 11: "accessory-image",
  12: "media-gallery", 13: "file", 14: "separator", 17: "container"
};
