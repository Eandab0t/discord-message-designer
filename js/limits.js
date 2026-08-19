"use strict";
/* ================= Discord limits ================= */
const LIMITS = {
  content: 2000,
  embedTitle: 256,
  embedDescription: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  buttonLabel: 80,
  customId: 100,
  selectOptionLabel: 100,
  selectOptionValue: 100,
  selectPlaceholder: 150,
  sectionText: 2000,
  separatorLabel: 200,
  mediaGalleryItems: 10,
  mediaGalleryItemUrl: 500,
  mediaGalleryItemDesc: 256,
  containerText: 4096,
  components: 10,
  children: 10,
  embeds: 10,
  fields: 25,
  rows: 5,
  compsPerRow: 5,
  selectOptions: 25,
  totalChars: 6000
};

function updateCounters(){
  document.querySelectorAll("[data-cnt]").forEach(span => {
    const wrap = span.closest(".cnt-wrap");
    if (!wrap) return;
    const inp = wrap.querySelector("input,textarea");
    if (!inp) return;
    const max = +inp.dataset.limit;
    const len = (inp.value || "").length;
    const pct = len / (max || 1);
    span.textContent = len + "/" + max;
    span.style.color = len > max ? "var(--danger)" : pct >= 0.9 ? "#f0b232" : "var(--muted)";
  });
  const msgTotal = messageTotalChars();
  const total = document.getElementById("msgTotal");
  if (total) {
    total.textContent = msgTotal + "/" + LIMITS.totalChars;
    total.style.color = msgTotal > LIMITS.totalChars ? "var(--danger)" : msgTotal / LIMITS.totalChars >= 0.9 ? "#f0b232" : "var(--muted)";
  }
  /* update status bar */
  renderStatusBar();
}

function messageTotalChars(){
  let n = state.content.length;
  state.embeds.forEach(em => {
    n += (em.title||"").length + (em.description||"").length + (em.authorName||"").length + (em.footerText||"").length;
    em.fields.forEach(f => n += (f.name||"").length + (f.value||"").length);
  });
  state.components.forEach(node => { n += componentTextLen(node); });
  return n;
}
function componentTextLen(node){
  let n = 0;
  if (node.type === "markdown") n += (node.content||"").length;
  else if (node.type === "button") n += (node.label||"").length;
  else if (node.type === "select" || node.type === "select-user" || node.type === "select-role" || node.type === "select-mentionable" || node.type === "select-channel") n += (node.placeholder||"").length;
  else if (node.type === "accessory-image") n += (node.alt||"").length;
  else if (node.type === "file") n += (node.name||"").length;
  if (node.children) node.children.forEach(c => { n += componentTextLen(c); });
  return n;
}

function renderStatusBar(){
  const bar = $("statusBar");
  if (!bar) return;
  const issues = validate();
  const errors = issues.filter(i => i.kind === "error").length;
  const warns = issues.filter(i => i.kind === "warn").length;
  const total = messageTotalChars();
  const embedCount = state.embeds.filter(e => !e.hidden).length;
  const compCount = countComponents(state.components);
  const totalPct = total / LIMITS.totalChars;

  bar.innerHTML = `
    <span class="status-item ${errors ? "err" : "ok"}">
      <span class="status-dot"></span> ${errors ? errors + " error" + (errors>1?"s":"") : "Valid"}
    </span>
    <span class="status-sep">|</span>
    <span class="status-item">Embeds: ${embedCount}/10</span>
    <span class="status-sep">|</span>
    <span class="status-item ${totalPct > 0.9 ? "warn" : ""}">Chars: ${total.toLocaleString()}/6,000</span>
    <span class="status-sep">|</span>
    <span class="status-item">Components: ${compCount}</span>
  `;
}
function countComponents(nodes){
  let n = 0;
  nodes.forEach(c => { n++; if (c.children) n += countComponents(c.children); });
  return n;
}
