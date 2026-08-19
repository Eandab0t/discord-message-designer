"use strict";
/* ================= persistence ================= */
try {
  const wh = localStorage.getItem("wh_url");
  if (wh) $("webhook").value = wh;
  const draft = localStorage.getItem("embed_builder_draft");
  if (draft) {
    const d = JSON.parse(draft);
    if (d && Array.isArray(d.embeds)) {
      state.content = d.content||"";
      state.embeds = d.embeds;
      state.components = d.components||[];
    }
  }
} catch(e){}

function saveDraft(){
  try {
    localStorage.setItem("wh_url", $("webhook").value);
    localStorage.setItem("embed_builder_draft", JSON.stringify({ content:state.content, embeds:state.embeds, components:state.components }));
  } catch(e){}
}
