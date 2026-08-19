"use strict";
/* ================= send ================= */
async function sendWebhook(){
  const url = $("webhook").value.trim();
  if (!url) { showStatus("err", "Paste a Discord webhook URL first."); return; }
  const payload = buildPayload();
  const hasEmbeds = payload.embeds && payload.embeds.length;
  const hasComps = payload.components && payload.components.length;
  if (!payload.content && !hasEmbeds && !hasComps) { showStatus("err", "Nothing to send — add content, an embed, or a component."); return; }

  showStatus("", "Sending...", true);
  try {
    let res;
    if (state.files.length) {
      const fd = new FormData();
      fd.append("payload_json", JSON.stringify(payload));
      state.files.forEach((f, idx) => fd.append("files[" + idx + "]", f.file, f.name));
      res = await fetch(url, { method: "POST", body: fd });
    } else {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    if (!res.ok) {
      let detail = "";
      try { const j = await res.json(); detail = j.message || JSON.stringify(j); } catch(_){ try { detail = await res.text(); } catch(_){} }
      showStatus("err", "Discord error " + res.status + ": " + detail);
      return;
    }
    showStatus("ok", "Message sent to Discord.");
    saveDraft();
  } catch(e){
    showStatus("err", "Failed to send: " + e.message);
  }
}

function showStatus(kind, text, loading){
  const s = $("status");
  s.className = "status show" + (kind ? " " + kind : "");
  s.textContent = text || "";
  if (loading) s.style.opacity = ".7";
  else s.style.opacity = "1";
  setTimeout(() => { if (!loading) s.classList.remove("show"); }, 6000);
}
