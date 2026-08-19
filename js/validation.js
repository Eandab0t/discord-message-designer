"use strict";
/* ================= validation ================= */
function validate(){
  const issues = [];
  const push = (kind, what, msg) => issues.push({ kind, what, msg });
  if (state.content.length > 2000) push("error", "message", "Content exceeds 2000 chars (" + state.content.length + ").");
  if (state.embeds.length > 10) push("error", "message", "Max 10 embeds (have " + state.embeds.length + ").");
  state.embeds.forEach((em, i) => {
    if (em.hidden) return;
    const e = (m) => push("error", "Embed " + (i+1), m);
    const w = (m) => push("warn", "Embed " + (i+1), m);
    if (em.title.length > 256) e("Title exceeds 256 chars.");
    if (em.description.length > 4096) e("Description exceeds 4096 chars.");
    if (em.fields.length > 25) e("Max 25 fields (have " + em.fields.length + ").");
    if (em.footerText.length > 2048) e("Footer exceeds 2048 chars.");
    if (em.authorName.length > 256) e("Author name exceeds 256 chars.");
    em.fields.forEach((f, fi) => {
      if (f.name.length > 256) e("Field " + (fi+1) + " name exceeds 256 chars.");
      if (f.value.length > 1024) e("Field " + (fi+1) + " value exceeds 1024 chars.");
      if (f.name && !f.value) w("Field " + (fi+1) + " has a name but no value.");
      if (!f.name && f.value) w("Field " + (fi+1) + " has a value but no name.");
    });
  });
  state.components.forEach(node => validateTreeNode(node, issues));
  return issues;
}

function validateTreeNode(node, issues){
  if (node.hidden) return;
  const def = COMPONENT_TYPES[node.type];
  if (def && def.validate) def.validate(node, issues);
  if (node.children) node.children.forEach(c => validateTreeNode(c, issues));
  if (node.accessory) {
    const aDef = COMPONENT_TYPES[node.accessory.type];
    if (aDef && aDef.validate) aDef.validate(node.accessory, issues);
  }
}

function renderValidation(){
  const panel = $("validationPanel");
  const issues = validate();
  const errors = issues.filter(i => i.kind === "error").length;
  const warns = issues.filter(i => i.kind === "warn").length;
  panel.innerHTML = "";
  const h = document.createElement("h4");
  h.innerHTML = "Issues ";
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = errors ? (errors + " error" + (errors>1?"s":"") + (warns ? ", " + warns + " warn" + (warns>1?"s":"") : "")) : (warns ? warns + " warning" + (warns>1?"s":"") : "\u2713 OK");
  badge.style.color = errors ? "var(--danger)" : warns ? "#f0b232" : "var(--ok)";
  h.appendChild(badge);
  panel.appendChild(h);
  updateCounters();
  if (!issues.length) {
    panel.insertAdjacentHTML("beforeend", `<div class="empty">No issues \u2014 ready to send.</div>`);
    return;
  }
  issues.slice(0, 12).forEach(i => {
    const d = document.createElement("div");
    d.className = "issue " + i.kind;
    d.textContent = (i.what ? i.what + ": " : "") + i.msg;
    panel.appendChild(d);
  });
  if (issues.length > 12) panel.insertAdjacentHTML("beforeend", `<div class="issue warn">+ ${issues.length-12} more issues</div>`);
}

function autoFix(){
  beforeEdit();
  state.embeds = state.embeds.filter(em => !em.hidden && embedHasContent(em));
  state.embeds.forEach(em => {
    em.fields = em.fields.filter(f => f.name && f.value);
    if (!em.fields.length) em.fields = [{name:"",value:"",inline:false}];
  });
  state.components = state.components.filter(n => !n.hidden && compHasContent(n));
  if (!state.embeds.length) state.embeds.push(newEmbed());
  renderAll();
  showStatus("ok", "Cleaned empty embeds and components.");
}
$("btnAutoFix").onclick = autoFix;
