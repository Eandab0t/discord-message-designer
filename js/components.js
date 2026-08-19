"use strict";
/* ================= components canvas ================= */

function renderComponents(){
  const list = $("compList");
  list.innerHTML = "";
  if (!state.components.length){
    list.innerHTML = `<div class="canvas-empty">
      <div class="canvas-empty-icon">\u25A2</div>
      <div>No components yet.</div>
      <div class="hint">Add a Container or Action Row from the palette above.</div>
      <button class="btn sm primary" data-empty-add="container" style="margin-top:12px">+ Container</button>
      <button class="btn sm" data-empty-add="action-row" style="margin-top:8px">+ Action Row</button>
    </div>`;
    list.querySelectorAll("[data-empty-add]").forEach(btn => {
      btn.onclick = () => {
        beforeEdit();
        const def = COMPONENT_TYPES[btn.dataset.emptyAdd];
        if (def) { const n = def.create(); state.components.push(n); selectTarget({kind:"comp",id:n.id}); renderAll(); }
      };
    });
    renderInspector();
    return;
  }
  state.components.forEach((node, i) => {
    renderInlineAdd(list, i === 0 ? null : state.components[i-1].id);
    renderNode(list, node, 0);
  });
  renderInlineAdd(list, state.components[state.components.length-1].id);
  renderInspector();
}

function renderInlineAdd(parent, afterId){
  const btn = document.createElement("button");
  btn.className = "inline-add";
  btn.innerHTML = `<span class="inline-add-plus">+</span>`;
  btn.title = "Add component";
  btn.onclick = (e) => {
    e.stopPropagation();
    showInlinePopover(btn, afterId);
  };
  parent.appendChild(btn);
}

function showInlinePopover(anchorBtn, afterId){
  closeInlinePopover();
  const pop = document.createElement("div");
  pop.className = "inline-popover";
  pop.id = "inlinePopover";
  const groups = [
    { title:"Content", types:["markdown","accessory-image","media-gallery","file"] },
    { title:"Layout", types:["container","section","separator","action-row"] },
    { title:"Interactive", types:["button","select","select-user","select-role","select-mentionable","select-channel"] }
  ];
  let html = `<div class="pop-title">Add Component</div>`;
  groups.forEach(g => {
    html += `<div class="pop-group-title">${g.title}</div><div class="pop-items">`;
    g.types.forEach(t => {
      const d = COMPONENT_TYPES[t];
      if (d) html += `<button class="pop-item" data-addtype="${t}">${d.icon} ${d.label}</button>`;
    });
    html += `</div>`;
  });
  pop.innerHTML = html;
  document.body.appendChild(pop);

  /* position near the anchor */
  const r = anchorBtn.getBoundingClientRect();
  pop.style.position = "fixed";
  pop.style.left = Math.min(r.left, window.innerWidth - 240) + "px";
  pop.style.top = (r.bottom + 6) + "px";
  pop.style.zIndex = 9999;

  pop.querySelectorAll("[data-addtype]").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      beforeEdit();
      const def = COMPONENT_TYPES[btn.dataset.addtype];
      if (!def) return;
      const node = def.create();
      if (!afterId) {
        state.components.unshift(node);
      } else {
        const info = findNodeParent(afterId);
        if (info) info.arr.splice(info.idx + 1, 0, node);
        else state.components.push(node);
      }
      closeInlinePopover();
      selectTarget({ kind:"comp", id: node.id });
      renderAll();
    };
  });

  setTimeout(() => {
    document.addEventListener("click", closeInlinePopover, { once: true });
  }, 10);
}
function closeInlinePopover(){
  const existing = document.getElementById("inlinePopover");
  if (existing) existing.remove();
}

function renderNode(parent, node, depth){
  const def = COMPONENT_TYPES[node.type];
  if (!def) return;
  const el = document.createElement("div");
  el.className = "canvas-node" + (node.hidden ? " node-hidden" : "") + (node.collapsed ? " node-collapsed" : "");
  el.dataset.nid = node.id;
  el.style.marginLeft = (depth * 16) + "px";

  const hasKids = typeHasChildren(node.type);
  const childCount = hasKids ? (node.children||[]).length : 0;
  const preview = compHasContent(node) && def.preview ? def.preview(node) : "";
  const isSelected = selected && selected.kind === "comp" && selected.id === node.id;
  if (isSelected) el.classList.add("selected");

  el.innerHTML = `
    <div class="node-head">
      <span class="node-type-badge">${def.icon || "?"} ${def.label}</span>
      ${node.type === "container" && node.accentColor ? `<span class="node-accent" style="background:${escAttr(node.accentColor)}"></span>` : ""}
      <span class="spacer" style="flex:1"></span>
      ${childCount ? `<span class="node-count">${childCount}</span>` : ""}
      <button class="node-ctrl" data-nact="moveup" title="Move up">\u2191</button>
      <button class="node-ctrl" data-nact="movedown" title="Move down">\u2193</button>
      <button class="node-ctrl" data-nact="dup" title="Duplicate">\u29C9</button>
      <button class="node-ctrl" data-nact="eye" title="Show/Hide">${node.hidden?"&#x25CC;":"&#x25CF;"}</button>
      ${hasKids ? `<button class="node-ctrl" data-nact="collapse" title="Collapse/expand">${node.collapsed?"&#x25B8;":"&#x25BE;"}</button>` : ""}
      <button class="node-ctrl node-del" data-nact="delete" title="Delete">&#x2715;</button>
    </div>
    ${preview ? `<div class="node-preview">${preview}</div>` : ""}
    ${hasKids ? `<div class="node-children" data-nchildren></div>` : ""}
    ${hasKids && !node.collapsed ? `<button class="node-add-child btn sm ghost" data-nact="addchild">+ Add child</button>` : ""}`;

  parent.appendChild(el);
  wireNode(el, node);

  if (hasKids && !node.collapsed){
    const childrenBox = el.querySelector("[data-nchildren]");
    (node.children||[]).forEach(child => renderNode(childrenBox, child, depth + 1));
  }
}

function wireNode(el, node){
  el.querySelector(".node-head").addEventListener("click", (e) => {
    if (e.target.closest(".node-ctrl")) return;
    selectTarget({ kind:"comp", id: node.id });
  });

  el.querySelectorAll("[data-nact]").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const act = btn.dataset.nact;
      if (act === "delete"){
        beforeEdit();
        removeNode(node.id);
        if (selected && selected.id === node.id) selected = null;
        renderAll();
      } else if (act === "moveup"){
        beforeEdit();
        moveNode(node.id, -1);
        renderAll();
      } else if (act === "movedown"){
        beforeEdit();
        moveNode(node.id, 1);
        renderAll();
      } else if (act === "dup"){
        beforeEdit();
        const copy = JSON.parse(JSON.stringify(node));
        assignNewIds(copy);
        const info = findNodeParent(node.id);
        if (info) info.arr.splice(info.idx + 1, 0, copy);
        renderAll();
      } else if (act === "eye"){
        beforeEdit();
        node.hidden = !node.hidden;
        renderAll();
      } else if (act === "collapse"){
        beforeEdit();
        node.collapsed = !node.collapsed;
        renderAll();
      } else if (act === "addchild"){
        beforeEdit();
        const types = getChildTypes(node.type);
        if (!types.length) return;
        if (!node.children) node.children = [];
        const child = COMPONENT_TYPES[types[0]] ? COMPONENT_TYPES[types[0]].create() : newMarkdown();
        node.children.push(child);
        selectTarget({ kind:"comp", id: child.id });
        renderAll();
      }
    };
  });

  const childrenBox = el.querySelector("[data-nchildren]");
  if (childrenBox){
    childrenBox.addEventListener("click", (e) => {
      if (e.target === childrenBox && !childrenBox.children.length){
        e.stopPropagation();
        beforeEdit();
        const types = getChildTypes(node.type);
        if (!types.length) return;
        if (!node.children) node.children = [];
        const child = COMPONENT_TYPES[types[0]] ? COMPONENT_TYPES[types[0]].create() : newMarkdown();
        node.children.push(child);
        selectTarget({ kind:"comp", id: child.id });
        renderAll();
      }
    });
  }
}

function assignNewIds(node){
  node.id = uid();
  if (node.children) node.children.forEach(c => assignNewIds(c));
  if (node.accessory) node.accessory.id = uid();
}

/* ================= contextual inspector (renders into right panel) ================= */
function renderInspector(){
  const container = $("rightInspector");
  if (!container) return;
  if (!selected || selected.kind !== "comp" || !selected.id){
    container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">
      Select a component on the canvas or in the layers tree to edit its properties.
    </div>`;
    /* also hide old inspector if present */
    const oldInsp = $("inspector");
    if (oldInsp) oldInsp.classList.add("hidden");
    const adv = $("inspAdv");
    if (adv) adv.classList.add("hidden");
    return;
  }
  const node = findNode(selected.id);
  if (!node){ container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Component not found.</div>`; return; }
  const def = COMPONENT_TYPES[node.type];
  if (!def){ container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Unknown type.</div>`; return; }

  const typeNum = ({button:2,select:3,"select-user":5,"select-role":6,"select-mentionable":7,"select-channel":8,section:9,markdown:10,"accessory-image":11,"media-gallery":12,file:13,separator:14,container:17,"action-row":1}[node.type] || "?");

  let html = `
    <div class="inspector">
      <div class="inspector-head">
        <span class="t">${def.label}</span>
        <span class="hint" style="text-transform:none;font-weight:400">type ${typeNum}</span>
        <span class="spacer" style="flex:1"></span>
        <button id="btnInspClose" class="btn sm ghost" title="Close inspector">&#x2715;</button>
      </div>
      <div id="inspBody">${def.editor(node)}</div>
      <details id="inspAdv" class="adv hidden">
        <summary>Advanced</summary>
        <div id="inspAdvBody"></div>
      </details>
    </div>`;

  container.innerHTML = html;

  const body = container.querySelector("#inspBody");
  wireInspectorFields(body, node);

  /* move .adv elements to advanced section */
  const advBody = container.querySelector("#inspAdvBody");
  const advDetails = container.querySelector("#inspAdv");
  if (advBody && advDetails) {
    body.querySelectorAll(".adv").forEach(el => advBody.appendChild(el));
    advDetails.classList.toggle("hidden", advBody.childElementCount === 0);
  }

  container.querySelector("#btnInspClose").onclick = () => {
    selected = null;
    renderComponents();
    applySelection();
    renderInspector();
    switchTab("preview");
  };

  updateCounters();
  renderValidation();
}

function wireInspectorFields(root, node){
  root.querySelectorAll("[data-cf]").forEach(inp => {
    inp.oninput = () => {
      beforeEdit("cf"+inp.dataset.cf);
      const f = inp.dataset.cf;
      if (f === "disabled") node.disabled = inp.checked;
      else if (f === "divider") node.divider = inp.checked;
      else if (f === "spoiler") node.spoiler = inp.checked;
      else if (f === "min") node.min = +inp.value || 0;
      else if (f === "max") node.max = +inp.value || 1;
      else if (f === "spacing") node.spacing = +inp.value || 1;
      else if (f === "style") { node.style = +inp.value; renderAll(); return; }
      else node[f] = inp.value;
      renderPreview(); renderJson(); saveDraft(); renderValidation(); updateCounters();
      commitHistory("cf"+inp.dataset.cf);
    };
    if (inp.type === "checkbox") inp.onchange = inp.oninput;
  });

  const optsBox = root.querySelector("[data-selopts]");
  if (optsBox && node.options){
    node.options.forEach((o, oi) => {
      const orow = document.createElement("div");
      orow.className = "field-row";
      orow.innerHTML = `
        <div class="cnt-wrap">
          <input type="text" placeholder="Label" data-on="${oi}" data-limit="${LIMITS.selectOptionLabel}" value="${escAttr(o.label)}" />
          <span data-cnt></span>
        </div>
        <div class="cnt-wrap">
          <input type="text" placeholder="Value" data-ov="${oi}" data-limit="${LIMITS.selectOptionValue}" value="${escAttr(o.value)}" />
          <span data-cnt></span>
        </div>
        <button class="btn sm danger" data-opdel="${oi}" title="Remove option">&#x2715;</button>`;
      optsBox.appendChild(orow);
      orow.querySelectorAll("input[data-on]").forEach(i => i.oninput = e => { beforeEdit("on"+e.target.dataset.on); node.options[+e.target.dataset.on].label = e.target.value; renderPreview(); renderJson(); renderValidation(); commitHistory("on"+e.target.dataset.on); });
      orow.querySelectorAll("input[data-ov]").forEach(i => i.oninput = e => { beforeEdit("ov"+e.target.dataset.ov); node.options[+e.target.dataset.ov].value = e.target.value; renderPreview(); renderJson(); renderValidation(); commitHistory("ov"+e.target.dataset.ov); });
      orow.querySelectorAll("[data-opdel]").forEach(b => b.onclick = () => { beforeEdit(); node.options.splice(oi,1); renderAll(); });
    });
    const addBtn = root.querySelector('[data-act="addopt"]');
    if (addBtn) addBtn.onclick = () => { beforeEdit(); node.options.push({label:"",value:"",description:"",emoji:""}); renderAll(); };
  }

  const galBox = root.querySelector("[data-galleryitems]");
  if (galBox && node.items){
    node.items.forEach((item, mi) => {
      const row = document.createElement("div");
      row.className = "gallery-item-row";
      row.innerHTML = `
        <div class="cnt-wrap">
          <input type="text" placeholder="https://image.png" data-murl="${mi}" value="${escAttr(item.media)}" />
          <span data-cnt></span>
        </div>
        <div class="cnt-wrap" style="margin-top:4px">
          <input type="text" placeholder="Alt text (optional)" data-malt="${mi}" value="${escAttr(item.alt || "")}" />
        </div>
        <div class="inline-check" style="justify-content:flex-start;margin-top:2px">
          <input type="checkbox" data-mspoil="${mi}" ${item.spoiler ? "checked" : ""} /> Spoiler
        </div>
        <button class="btn sm danger" data-mdel="${mi}" title="Remove">&#x2715;</button>`;
      galBox.appendChild(row);
      row.querySelectorAll("input[data-murl]").forEach(i => i.oninput = e => { beforeEdit("murl"+e.target.dataset.murl); node.items[+e.target.dataset.murl].media = e.target.value; renderPreview(); renderJson(); commitHistory("murl"+e.target.dataset.murl); });
      row.querySelectorAll("input[data-malt]").forEach(i => i.oninput = e => { beforeEdit("malt"+e.target.dataset.malt); node.items[+e.target.dataset.malt].alt = e.target.value; renderPreview(); renderJson(); commitHistory("malt"+e.target.dataset.malt); });
      row.querySelectorAll("input[data-mspoil]").forEach(i => i.onchange = e => { beforeEdit("mspoil"+e.target.dataset.mspoil); node.items[+e.target.dataset.mspoil].spoiler = e.target.checked; renderPreview(); renderJson(); commitHistory("mspoil"+e.target.dataset.mspoil); });
      row.querySelectorAll("[data-mdel]").forEach(b => b.onclick = () => { beforeEdit(); node.items.splice(mi,1); renderAll(); });
    });
    const addBtn = root.querySelector('[data-act="addmedia"]');
    if (addBtn) addBtn.onclick = () => { beforeEdit(); node.items.push({media:"",alt:"",spoiler:false}); renderAll(); };
  }

  const kidsBox = root.querySelector("[data-cchildren]");
  if (kidsBox){
    (node.children||[]).forEach(child => {
      const childDiv = document.createElement("div");
      childDiv.className = "canvas-child-editor";
      childDiv.dataset.nid = child.id;
      const childDef = COMPONENT_TYPES[child.type];
      childDiv.innerHTML = `
        <div class="child-head">
          <span class="nested-tag">${childDef ? childDef.label : child.type}</span>
          <span class="spacer" style="flex:1"></span>
          <button class="btn sm ghost" data-ndup="${child.id}" title="Duplicate">\u29C9</button>
          <button class="btn sm danger" data-ndel="${child.id}" title="Delete">&#x2715;</button>
        </div>
        <div class="child-editor-body">${childDef ? childDef.editor(child) : ""}</div>`;
      kidsBox.appendChild(childDiv);
      wireInspectorFields(childDiv, child);
      childDiv.querySelectorAll("[data-ndel]").forEach(b => b.onclick = () => { beforeEdit(); removeNode(child.id); renderAll(); });
      childDiv.querySelectorAll("[data-ndup]").forEach(b => b.onclick = () => {
        beforeEdit();
        const copy = JSON.parse(JSON.stringify(child));
        assignNewIds(copy);
        const info = findNodeParent(child.id);
        if (info) info.arr.splice(info.idx + 1, 0, copy);
        renderAll();
      });
    });
    const addSel = root.querySelector("[data-cadd]");
    if (addSel) addSel.onchange = (e) => {
      const t = e.target.value;
      if (!t) return;
      beforeEdit();
      if (!node.children) node.children = [];
      const def = COMPONENT_TYPES[t];
      node.children.push(def ? def.create() : newMarkdown());
      renderAll();
    };
  }

  const accBox = root.querySelector("[data-cacc]");
  if (accBox){
    if (node.accessory){
      const accDef = COMPONENT_TYPES[node.accessory.type];
      const accDiv = document.createElement("div");
      accDiv.className = "canvas-child-editor";
      accDiv.innerHTML = `
        <div class="child-head">
          <span class="nested-tag">${accDef ? accDef.label : node.accessory.type}</span>
          <span class="spacer" style="flex:1"></span>
          <button class="btn sm danger" data-accdel title="Delete">&#x2715;</button>
        </div>
        <div class="child-editor-body">${accDef ? accDef.editor(node.accessory) : ""}</div>`;
      accBox.appendChild(accDiv);
      wireInspectorFields(accDiv, node.accessory);
      accDiv.querySelectorAll("[data-accdel]").forEach(b => b.onclick = () => { beforeEdit(); node.accessory = null; renderAll(); });
    }
    const accSel = root.querySelector("[data-caccset]");
    if (accSel) accSel.onchange = (e) => {
      const t = e.target.value;
      beforeEdit();
      node.accessory = t ? (COMPONENT_TYPES[t] ? COMPONENT_TYPES[t].create() : null) : null;
      renderAll();
    };
  }
}
