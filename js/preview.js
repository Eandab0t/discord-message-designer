"use strict";
/* ================= preview ================= */

function formatMentions(text){
  if (!text) return "";
  let h = esc(text);
  /* channel mentions: <#123> */
  h = h.replace(/&lt;#(\d+)&gt;/g, '<span class="mention">#$1</span>');
  /* role mentions: <@&123> */
  h = h.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="role-mention">@&amp;$1</span>');
  /* user mentions: <@123> or <@!123> */
  h = h.replace(/&lt;@!?(\d+)&gt;/g, '<span class="mention">@$1</span>');
  return h;
}

function renderPreview(){
  const p = $("preview");
  if (!p) return;
  p.innerHTML = "";
  const msg = document.createElement("div");
  msg.className = "discord-message";
  msg.innerHTML = `
    <div class="dm-avatar">${esc(authorInitial())}</div>
    <div class="dm-main">
      <div class="dm-header">
        <span class="dm-username">You</span><span class="dm-bot">BOT</span>
        <span class="dm-time">Today at ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
      </div>
      ${state.content ? `<div class="dm-content">${formatMentions(state.content)}</div>` : ""}
      <div data-embeds></div>
      <div data-comps></div>
    </div>`;
  p.appendChild(msg);

  const embedsBox = msg.querySelector("[data-embeds]");
  state.embeds.forEach((em) => {
    if (em.hidden || !embedHasContent(em)) return;
    const e = document.createElement("div");
    e.className = "embed";
    e.style.borderLeftColor = normalizeHex(em.color);
    let fields = "";
    em.fields.forEach(f => {
      if (!f.name && !f.value) return;
      fields += `<div class="e-field ${f.inline?"inline":""}">
        <div class="n">${esc(f.name)}</div><div class="v">${esc(f.value)}</div></div>`;
    });
    e.innerHTML = `
      ${em.thumb ? `<img class="e-thumb" src="${escAttr(em.thumb)}" />` : ""}
      ${em.authorName ? `<div class="e-author">${em.authorIcon?`<img src="${escAttr(em.authorIcon)}" style="width:20px;height:20px;vertical-align:middle;margin-right:6px">`:""}<span class="a-name">${esc(em.authorName)}</span></div>` : ""}
      ${em.title ? `<div class="e-title"><a href="${escAttr(em.url)}" target="_blank" style="color:inherit;text-decoration:none">${esc(em.title)}</a></div>` : ""}
      ${em.description ? `<div class="e-desc">${esc(em.description)}</div>` : ""}
      ${fields ? `<div class="e-fields">${fields}</div>` : ""}
      ${em.image ? `<img class="e-image" src="${escAttr(em.image)}" />` : ""}
      ${em.footerText || em.footerIcon || em.timestamp ? `<div class="e-footer">${em.footerIcon?`<img src="${escAttr(em.footerIcon)}" />`:""}<span>${esc(em.footerText)}</span>${em.timestamp?`<span>\u2022 ${new Date().toLocaleDateString()}</span>`:""}</div>` : ""}`;
    embedsBox.appendChild(e);
  });
  if (!state.embeds.length) embedsBox.innerHTML = `<div class="hint">Add an embed to see a preview.</div>`;

  const compsBox = msg.querySelector("[data-comps]");
  renderComponentPreview(compsBox, state.components);

  const sp = $("splitPreview");
  if (sp) sp.innerHTML = p.innerHTML;
}

function renderComponentPreview(box, nodes){
  nodes.forEach(node => {
    if (node.hidden) return;
    const def = COMPONENT_TYPES[node.type];
    if (!def || !def.preview) return;
    if (compHasContent(node)){
      box.insertAdjacentHTML("beforeend", def.preview(node));
    }
  });
}
