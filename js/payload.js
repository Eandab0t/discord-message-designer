"use strict";
/* ================= JSON payload ================= */
function buildPayload(){
  const embeds = state.embeds
    .filter(em => !em.hidden && embedHasContent(em))
    .map(em => {
      const e = {};
      if (em.authorName) e.author = { name: em.authorName, url: urlVal(em.authorUrl), icon_url: urlVal(em.authorIcon) };
      if (em.title) { e.title = em.title; const u = urlVal(em.url); if (u) e.url = u; }
      if (em.description) e.description = em.description;
      e.color = hexToInt(em.color);
      const fields = em.fields.filter(f => f.name && f.value).map(f => ({ name:f.name, value:f.value, inline:!!f.inline }));
      if (fields.length) e.fields = fields;
      const tu = urlVal(em.thumb); if (tu) e.thumbnail = { url: tu };
      const iu = urlVal(em.image); if (iu) e.image = { url: iu };
      if (em.footerText || em.footerIcon) { e.footer = {}; if (em.footerText) e.footer.text = em.footerText; const fi = urlVal(em.footerIcon); if (fi) e.footer.icon_url = fi; }
      if (em.timestamp) e.timestamp = new Date().toISOString();
      return e;
    });

  const components = state.components
    .filter(node => !node.hidden && compHasContent(node))
    .map(node => serializeComp(node))
    .filter(Boolean);

  return { content: state.content || null, embeds, components: components.length ? components : null };
}

function renderJson(){
  const txt = JSON.stringify(buildPayload(), null, 2);
  $("jsonBox").value = txt;
  const sj = $("splitJson");
  if (sj) sj.value = txt;
}
