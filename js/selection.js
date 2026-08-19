"use strict";
/* ================= selection ================= */
let selected = null; /* { kind:"content"|"embed"|"comp", id? , idx? } */

function selectTarget(t){
  selected = t;
  applySelection();
  scrollToSelected();
  renderLayers();
  renderInspector();
}
function applySelection(){
  document.querySelectorAll(".embed-item.selected, .canvas-node.selected, .layer-item.selected").forEach(el => el.classList.remove("selected"));
  if (!selected) return;
  let el = null;
  if (selected.kind === "embed") el = document.querySelector('.embed-item[data-eidx="'+selected.idx+'"]');
  else if (selected.kind === "comp" && selected.id) el = document.querySelector('.canvas-node[data-nid="'+selected.id+'"]');
  if (el) el.classList.add("selected");
}
function scrollToSelected(){
  const el = document.querySelector(".embed-item.selected, .canvas-node.selected");
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior:"smooth", block:"center" });
}
