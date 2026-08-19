"use strict";
/* ================= import/export ================= */
function exportJson(){
  renderJson();
  const data = $("jsonBox").value;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = "embed-payload.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast("JSON downloaded", "ok");
  showStatus("ok", "JSON downloaded as embed-payload.json");
}

function importJson(){
  /* try file input first */
  const fi = $("importFile");
  if (fi) { fi.click(); return; }
  /* fallback to prompt */
  const raw = prompt("Paste embed JSON (Discord webhook payload or {embeds:[...]}):");
  if (!raw) return;
  try { applyPayload(JSON.parse(raw)); }
  catch(e){ showStatus("err", "Invalid JSON: " + e.message); }
}

function importFromText(raw){
  if (!raw) return;
  try { applyPayload(JSON.parse(raw)); }
  catch(e){ showStatus("err", "Invalid JSON: " + e.message); }
}

function applyPayload(p){
  if (!p || typeof p !== "object" || Array.isArray(p)) return false;
  if (p.messages && Array.isArray(p.messages)) p = p.messages[0] || {};
  beforeEdit("import");
  state.content = p.content || "";
  state.embeds = Array.isArray(p.embeds) ? p.embeds.map(em => {
    const e = newEmbed();
    e.hidden = false;
    e.title = em.title || "";
    e.url = em.url || "";
    e.description = em.description || "";
    if (em.color != null) e.color = intToHex(em.color);
    e.authorName = em.author?.name || "";
    e.authorUrl = em.author?.url || "";
    e.authorIcon = em.author?.icon_url || em.author?.iconURL || "";
    e.footerText = em.footer?.text || "";
    e.footerIcon = em.footer?.icon_url || em.footer?.iconURL || "";
    e.thumb = em.thumbnail?.url || "";
    e.image = em.image?.url || "";
    e.timestamp = !!em.timestamp;
    e.fields = (em.fields||[]).map(f => ({ name:f.name||"", value:f.value||"", inline:!!f.inline }));
    if (!e.fields.length) e.fields = [{name:"",value:"",inline:false}];
    return e;
  }) : [];

  state.components = [];
  if (Array.isArray(p.components)){
    p.components.forEach(c => {
      const node = deserializeComp(c);
      if (node) state.components.push(node);
    });
  }

  state.files = [];
  $("msgContent").value = state.content;
  selected = null;
  renderAll();
  showToast("JSON imported successfully", "ok");
  showStatus("ok", "JSON imported.");
  return true;
}

/* ---- file input ---- */
(function(){
  const fi = $("importFile");
  const area = $("importArea");
  if (!fi) return;

  fi.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { importFromText(reader.result); fi.value = ""; };
    reader.readAsText(file);
  };

  if (area){
    area.onclick = () => fi.click();
    area.ondragover = (e) => { e.preventDefault(); area.classList.add("dragover"); };
    area.ondragleave = () => area.classList.remove("dragover");
    area.ondrop = (e) => {
      e.preventDefault();
      area.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => importFromText(reader.result);
      reader.readAsText(file);
    };
  }
})();

/* ---- toast ---- */
function showToast(msg, kind){
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show" + (kind ? " " + kind : "");
  setTimeout(() => { t.classList.remove("show"); }, 2500);
}

$("btnApply").onclick = () => {
  const raw = $("jsonBox").value.trim();
  if (!raw) return;
  try { applyPayload(JSON.parse(raw)); }
  catch(e){ showStatus("err", "Invalid JSON in box: " + e.message); }
};
