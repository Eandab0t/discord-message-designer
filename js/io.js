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
  showStatus("ok", "JSON downloaded as embed-payload.json");
}

function importJson(){
  const raw = prompt("Paste embed JSON (Discord webhook payload or {embeds:[...]}):");
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
  renderAll();
  showStatus("ok", "JSON imported.");
  return true;
}

$("btnApply").onclick = () => {
  const raw = $("jsonBox").value.trim();
  if (!raw) return;
  try { applyPayload(JSON.parse(raw)); }
  catch(e){ showStatus("err", "Invalid JSON in box: " + e.message); }
};
