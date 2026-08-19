"use strict";
/* ================= layers tree ================= */
let dragLayerId = null;
let dragLayerOverId = null;

function layerEmbedLabel(em){
  const t = em.title || em.description || em.authorName || em.footerText || (em.fields.some(f=>f.name||f.value) ? "fields" : "");
  return "Embed" + (t ? " \u2014 " + String(t).slice(0, 40) : "");
}
function layerAdd(tree, indent, html, cls){
  const d = document.createElement("div");
  d.className = "layer-item" + (cls ? " " + cls : "");
  d.style.paddingLeft = (6 + indent * 14) + "px";
  d.innerHTML = html;
  tree.appendChild(d);
  return d;
}

function renderLayers(){
  const tree = $("layerTree");
  tree.innerHTML = "";

  const msg = layerAdd(tree, 0, `<span class="ch">\u25C8</span> Message${state.content ? ` \u2014 "${esc(state.content.slice(0,30))}"` : ""}`);
  msg.onclick = () => selectTarget({ kind:"content" });

  if (!state.embeds.length && !state.components.length) {
    layerAdd(tree, 1, `<span class="ch">\u00B7</span> Empty message`);
  }

  state.embeds.forEach((em, i) => {
    const d = layerAdd(tree, 1, `<span class="ch">\u25A2</span> <span>${esc(layerEmbedLabel(em))}</span><span class="spacer2"></span><span class="eye" title="Show/Hide">${em.hidden?"&#x25CC;":"&#x25CF;"}</span>`, em.hidden ? "layer-row-hidden" : "");
    if (selected && selected.kind === "embed" && selected.idx === i) d.classList.add("selected");
    d.onclick = (e) => {
      if (e.target.classList.contains("eye")) { em.hidden = !em.hidden; renderLayers(); return; }
      selectTarget({ kind:"embed", idx:i });
    };
    const fc = em.fields.filter(f => f.name || f.value).length;
    if (fc) layerAdd(tree, 2, `<span class="ch">\u21B3</span> ${fc} field${fc>1?"s":""}`);
  });

  state.components.forEach(node => {
    renderLayerNode(tree, node, 1);
  });
}

function renderLayerNode(tree, node, depth){
  const def = COMPONENT_TYPES[node.type];
  const label = def ? def.label : node.type;
  const content = compHasContent(node) ? " \u2014 " + String(layerNodeLabel(node)).slice(0,30) : "";
  const d = layerAdd(tree, depth,
    `<span class="ch">${def ? def.icon : "?"}</span> <span>${esc(label + content)}</span>` +
    `<span class="spacer2"></span><span class="eye" title="Show/Hide">${node.hidden?"&#x25CC;":"&#x25CF;"}</span>`,
    node.hidden ? "layer-row-hidden" : "");
  d.draggable = true;
  d.dataset.dragNid = node.id;
  if (selected && selected.kind === "comp" && selected.id === node.id) d.classList.add("selected");
  if (dragLayerOverId === node.id) d.classList.add("drag-over");

  /* drag handlers */
  d.ondragstart = (e) => {
    dragLayerId = node.id;
    e.dataTransfer.effectAllowed = "move";
    d.classList.add("dragging");
    setTimeout(() => renderLayers(), 0);
  };
  d.ondragend = () => {
    dragLayerId = null;
    dragLayerOverId = null;
    renderLayers();
  };
  d.ondragover = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragLayerOverId = node.id;
  };
  d.ondrop = (e) => {
    e.preventDefault();
    if (!dragLayerId || dragLayerId === node.id) return;
    beforeEdit("layermove");
    const src = findNode(dragLayerId);
    if (!src) return;
    const srcInfo = findNodeParent(dragLayerId);
    if (!srcInfo) return;
    srcInfo.arr.splice(srcInfo.idx, 1);
    const tgtInfo = findNodeParent(node.id);
    if (!tgtInfo) { state.components.push(src); }
    else { tgtInfo.arr.splice(tgtInfo.idx, 0, src); }
    dragLayerId = null;
    dragLayerOverId = null;
    renderAll();
  };

  d.onclick = (e) => {
    if (e.target.classList.contains("eye")) { node.hidden = !node.hidden; renderAll(); return; }
    selectTarget({ kind:"comp", id: node.id });
  };
  if (node.children) node.children.forEach(c => renderLayerNode(tree, c, depth + 1));
  if (node.accessory) {
    const aDef = COMPONENT_TYPES[node.accessory.type];
    const ad = layerAdd(tree, depth + 1, `<span class="ch">${aDef ? aDef.icon : "?"}</span> <span>Accessory: ${aDef ? aDef.label : "?"}</span>`);
    if (selected && selected.kind === "comp" && selected.id === node.accessory.id) ad.classList.add("selected");
    ad.onclick = () => selectTarget({ kind:"comp", id: node.accessory.id });
  }
}

function layerNodeLabel(node){
  switch (node.type){
    case "button": return node.label || node.emoji || "button";
    case "select": return node.placeholder || "select";
    case "markdown": return (node.content||"").slice(0,30) || "text";
    case "accessory-image": return node.src ? "has image" : "no image";
    case "separator": return node.spacing === 2 ? "large" : "small";
    case "media-gallery": return (node.items||[]).length + " items";
    case "file": return node.name || "file";
    case "section": case "container": case "action-row": return (node.children||[]).length + " children";
    default: return "";
  }
}
