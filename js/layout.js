"use strict";
/* ================= layout: mode tabs, simple/advanced toggle, resizers, palette ================= */
function store(key, val){
  try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, String(val)); } catch (e) {}
}
function load(key){
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

/* ---- mode tabs ---- */
function setMode(mode){
  document.body.classList.toggle("mode-embed", mode === "embed");
  document.body.classList.toggle("mode-components", mode === "components");
  document.querySelectorAll(".modebtn").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  store("layout.mode", mode);
}
document.querySelectorAll(".modebtn").forEach(b => b.onclick = () => setMode(b.dataset.mode));

/* ---- simple/advanced toggle ---- */
function setAdvanced(on){
  document.body.classList.toggle("advanced", on);
  document.body.classList.toggle("simple", !on);
  const btn = $("btnAdvanced");
  if (btn) btn.textContent = on ? "Advanced" : "Simple";
  store("layout.advanced", on ? "1" : "0");
}
$("btnAdvanced").onclick = () => setAdvanced(!document.body.classList.contains("advanced"));

/* ---- vertical resizer (left panel width) ---- */
(function(){
  const gutter = $("gutterV");
  if (!gutter) return;
  const left = $("paneLeft");
  const toggle = $("btnToggleSidebar");
  let dragging = false;
  gutter.addEventListener("mousedown", (e) => {
    dragging = true;
    gutter.classList.add("dragging");
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const w = Math.min(760, Math.max(300, e.clientX - left.offsetLeft));
    left.style.width = w + "px";
    if (toggle) toggle.style.left = w + "px";
    store("layout.leftWidth", w);
  });
  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    gutter.classList.remove("dragging");
  });
  /* init toggle position */
  const saved = load("layout.leftWidth");
  if (toggle && saved) toggle.style.left = Math.min(760, Math.max(300, +saved)) + "px";
  else if (toggle) toggle.style.left = "480px";
})();

/* ---- horizontal resizer (preview height) ---- */
(function(){
  const gutter = $("gutterH");
  const body = $("dcBody");
  if (!gutter || !body) return;
  let dragging = false;
  let startY = 0, startH = 0;
  gutter.addEventListener("mousedown", (e) => {
    dragging = true;
    gutter.classList.add("dragging");
    startY = e.clientY;
    startH = body.getBoundingClientRect().height;
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const h = Math.min(900, Math.max(120, startH + (e.clientY - startY)));
    body.style.height = h + "px";
    store("layout.previewHeight", h);
  });
  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    gutter.classList.remove("dragging");
  });
})();

/* ---- embed quick-add helpers ---- */
function ensureEmbedIdx(){
  if (selected && selected.kind === "embed" && state.embeds[selected.idx]) return selected.idx;
  if (!state.embeds.length) { beforeEdit(); state.embeds.push(newEmbed()); }
  return 0;
}
function qaEmbedFocus(selector, scrollSelector){
  const idx = ensureEmbedIdx();
  beforeEdit();
  renderAll();
  const box = document.querySelector('.embed-item[data-eidx="' + idx + '"]');
  const el = box ? box.querySelector(scrollSelector || selector) : null;
  selectTarget({ kind: "embed", idx });
  if (el) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const target = el.querySelector ? el.querySelector(selector) || el : el;
    if (target && target.focus) target.focus();
  }
}

/* ---- component palette ---- */
function paletteAdd(typeKey){
  const def = COMPONENT_TYPES[typeKey];
  if (!def) return;
  beforeEdit();
  const node = def.create();
  if (selected && selected.kind === "comp" && selected.id){
    const parent = findNode(selected.id);
    if (parent && typeHasChildren(parent.type)){
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      state.components.push(node);
    }
  } else {
    state.components.push(node);
  }
  selectTarget({ kind:"comp", id: node.id });
  renderAll();
  if (document.body.classList.contains("mode-embed")) setMode("components");
}

document.querySelectorAll("[data-palette]").forEach(btn => {
  btn.onclick = () => paletteAdd(btn.dataset.palette);
});

/* ---- embed quick-add wiring ---- */
const EMBED_QA = {
  author:    ['[data-f="authorName"]', '[data-f="authorName"]'],
  title:     ['[data-f="title"]', '[data-f="title"]'],
  description:['[data-f="description"]', '[data-f="description"]'],
  image:     ['[data-f="image"]', '[data-f="image"]'],
  thumbnail: ['[data-f="thumb"]', '[data-f="thumb"]'],
  footer:    ['[data-f="footerText"]', '[data-f="footerText"]'],
  color:     ['[data-f="colorText"]', '[data-f="color"]']
};
document.querySelectorAll("[data-qa]").forEach(btn => {
  btn.onclick = () => {
    const qa = btn.dataset.qa;
    if (EMBED_QA[qa]) { qaEmbedFocus(EMBED_QA[qa][0], EMBED_QA[qa][1]); return; }
    const idx = ensureEmbedIdx();
    const em = state.embeds[idx];
    switch (qa) {
      case "field":
        beforeEdit();
        em.fields.push({ name: "", value: "", inline: false });
        renderAll();
        qaEmbedFocus('[data-fn="' + (em.fields.length - 1) + '"]');
        break;
      case "timestamp":
        beforeEdit();
        em.timestamp = !em.timestamp;
        renderAll();
        qaEmbedFocus('[data-f="timestamp"]');
        break;
    }
  };
});

/* ---- sidebar collapse ---- */
$("btnToggleSidebar").onclick = () => {
  document.body.classList.toggle("sidebar-collapsed");
  store("layout.sidebarCollapsed", document.body.classList.contains("sidebar-collapsed") ? "1" : "0");
};

/* ---- init: restore persisted layout ---- */
(function(){
  const mode = load("layout.mode");
  if (mode === "embed" || mode === "components") setMode(mode); else setMode("embed");
  const adv = load("layout.advanced");
  if (adv !== null) setAdvanced(adv === "1"); else setAdvanced(false);
  const lw = load("layout.leftWidth");
  if (lw && $("paneLeft")) $("paneLeft").style.width = Math.min(760, Math.max(300, +lw)) + "px";
  const ph = load("layout.previewHeight");
  if (ph && $("dcBody")) $("dcBody").style.height = Math.min(900, Math.max(120, +ph)) + "px";
  const sc = load("layout.sidebarCollapsed");
  if (sc === "1") document.body.classList.add("sidebar-collapsed");
})();
