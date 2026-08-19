"use strict";
/* ================= tabs & misc ================= */
function switchTab(name){
  document.querySelectorAll(".tabbtn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tabpane").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
  if (name === "json" || name === "split") renderJson();
  if (name === "split") renderPreview();
  /* auto-switch to properties when selecting a component */
  if (name === "properties") renderInspector();
}
document.querySelectorAll(".tabbtn").forEach(b => b.onclick = () => switchTab(b.dataset.tab));

function renderAll(){
  renderEmbeds();
  renderComponents();
  renderLayers();
  renderValidation();
  renderPreview();
  renderJson();
  applySelection();
  saveDraft();
  commitHistory(null);
}

$("msgContent").oninput = (e) => { beforeEdit(); state.content = e.target.value; renderPreview(); renderJson(); renderValidation(); saveDraft(); commitHistory("content"); };
$("btnAddEmbed").onclick = () => { beforeEdit(); state.embeds.push(newEmbed()); renderAll(); };
$("btnClearComps").onclick = () => { if(!confirm("Remove all components?")) return; beforeEdit(); state.components = []; selected = null; renderAll(); };
$("btnSend").onclick = sendWebhook;
$("btnExport").onclick = exportJson;
$("btnImport").onclick = importJson;
$("btnCopy").onclick = () => {
  renderJson();
  const text = $("jsonBox").value;
  navigator.clipboard.writeText(text).then(() => {
    showToast("JSON copied to clipboard", "ok");
    showStatus("ok", "JSON copied.");
  }).catch(() => {
    /* fallback: select text */
    $("jsonBox").select();
    document.execCommand("copy");
    showToast("JSON copied to clipboard", "ok");
  });
};
$("btnReset").onclick = () => {
  if (!confirm("Clear all embeds, components and content?")) return;
  beforeEdit();
  state.content = ""; state.embeds = []; state.components = []; state.files = [];
  $("msgContent").value = "";
  selected = null;
  renderAll();
};

/* keyboard shortcuts */
document.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
  else if (mod && e.key.toLowerCase() === "d" && selected && selected.kind === "comp" && selected.id) {
    e.preventDefault();
    beforeEdit();
    const copy = JSON.parse(JSON.stringify(findNode(selected.id)));
    assignNewIds(copy);
    const info = findNodeParent(selected.id);
    if (info) info.arr.splice(info.idx + 1, 0, copy);
    renderAll();
  }
  else if (mod && e.key.toLowerCase() === "c" && selected && selected.kind === "comp" && selected.id) {
    copyNode(selected.id);
  }
  else if (mod && e.key.toLowerCase() === "v" && clipBoard) {
    e.preventDefault();
    beforeEdit();
    pasteNode(selected && selected.kind === "comp" ? selected.id : null);
    renderAll();
  }
  else if (e.key === "Delete" && selected) {
    e.preventDefault();
    if (selected.kind === "embed") {
      beforeEdit();
      state.embeds.splice(selected.idx,1);
      cleanupFiles(selected.idx);
      selected=null;
      renderAll();
    } else if (selected.kind === "comp" && selected.id) {
      beforeEdit();
      removeNode(selected.id);
      selected = null;
      renderAll();
    }
  } else if (e.key === "Escape") {
    if (cmdPaletteOpen) { closeCmdPalette(); return; }
    selected = null;
    renderComponents();
    applySelection();
    renderInspector();
    switchTab("preview");
  }
});

if (!state.embeds.length) state.embeds.push(newEmbed());
pendingEdit = true;
renderAll();
updateHistoryButtons();
