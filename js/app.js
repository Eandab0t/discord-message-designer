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
  else if (mod && e.shiftKey && e.key.toLowerCase() === "e") { e.preventDefault(); exportJson(); }
  else if (mod && e.shiftKey && e.key.toLowerCase() === "i") { e.preventDefault(); importJson(); }
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

/* ---- message name sync ---- */
(function(){
  const nameInput = $("msgNameInput");
  if (!nameInput) return;
  nameInput.value = state.settings.name;
  nameInput.oninput = () => { state.settings.name = nameInput.value || "New Message"; saveDraft(); };
})();

/* ---- settings sync ---- */
(function(){
  const channelIdEl = $("settingChannelId");
  const authorIdEl = $("settingAuthorId");
  const accentPickerEl = $("settingAccentColorPicker");
  const accentTextEl = $("settingAccentColor");
  const flagsEl = $("settingFlags");
  if (channelIdEl) { channelIdEl.value = state.settings.channelId; channelIdEl.oninput = () => { state.settings.channelId = channelIdEl.value; saveDraft(); }; }
  if (authorIdEl) { authorIdEl.value = state.settings.authorId; authorIdEl.oninput = () => { state.settings.authorId = authorIdEl.value; saveDraft(); }; }
  if (accentTextEl) {
    accentTextEl.value = state.settings.accentColor;
    accentTextEl.oninput = () => {
      state.settings.accentColor = accentTextEl.value || "#5865f2";
      if (accentPickerEl) accentPickerEl.value = state.settings.accentColor;
      saveDraft();
    };
  }
  if (accentPickerEl) {
    accentPickerEl.value = state.settings.accentColor;
    accentPickerEl.oninput = () => {
      state.settings.accentColor = accentPickerEl.value;
      if (accentTextEl) accentTextEl.value = accentPickerEl.value;
      saveDraft();
    };
  }
  if (flagsEl) { flagsEl.value = state.settings.flags; flagsEl.oninput = () => { state.settings.flags = flagsEl.value; saveDraft(); }; }
})();

function syncSettingsUI(){
  const channelIdEl = $("settingChannelId");
  const authorIdEl = $("settingAuthorId");
  const accentPickerEl = $("settingAccentColorPicker");
  const accentTextEl = $("settingAccentColor");
  const flagsEl = $("settingFlags");
  const nameInput = $("msgNameInput");
  if (channelIdEl) channelIdEl.value = state.settings.channelId || "";
  if (authorIdEl) authorIdEl.value = state.settings.authorId || "";
  if (accentTextEl) accentTextEl.value = state.settings.accentColor || "#5865f2";
  if (accentPickerEl) accentPickerEl.value = state.settings.accentColor || "#5865f2";
  if (flagsEl) flagsEl.value = state.settings.flags || "32768";
  if (nameInput) nameInput.value = state.settings.name || "New Message";
}

/* ================= format toolbar ================= */
function insertAtCursor(el, text){
  if (!el) return;
  const s = el.selectionStart, e = el.selectionEnd;
  el.value = el.value.substring(0, s) + text + el.value.substring(e);
  el.selectionStart = el.selectionEnd = s + text.length;
  el.focus();
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
function wrapSelection(el, before, after){
  if (!el) return;
  const s = el.selectionStart, e = el.selectionEnd;
  const sel = el.value.substring(s, e);
  const bLen = before.length, aLen = after.length;
  const hasWrap = s >= bLen && el.value.substring(s - bLen, s) === before && el.value.substring(e, e + aLen) === after;
  if (hasWrap) {
    el.value = el.value.substring(0, s - bLen) + sel + el.value.substring(e + aLen);
    el.selectionStart = s - bLen;
    el.selectionEnd = e - bLen;
  } else {
    const inner = sel || "text";
    el.value = el.value.substring(0, s) + before + inner + after + el.value.substring(e);
    el.selectionStart = s + bLen;
    el.selectionEnd = s + bLen + inner.length;
  }
  el.focus();
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

(function buildFmtToolbar(){
  const bar = $("contentFmtToolbar");
  if (!bar) return;
  const getEl = () => $("msgContent");
  const btns = [
    { label:"B", title:"Bold", action:()=>wrapSelection(getEl(),"**","**") },
    { label:"I", title:"Italic", action:()=>wrapSelection(getEl(),"*","*"), style:"font-style:italic" },
    { label:"S̶", title:"Strikethrough", action:()=>wrapSelection(getEl(),"~~","~~") },
    { label:"<>", title:"Inline Code", action:()=>wrapSelection(getEl(),"`","`") },
    { label:"||", title:"Spoiler", action:()=>wrapSelection(getEl(),"||","||") },
    { label:"```", title:"Code Block", action:()=>wrapSelection(getEl(),"```\n","\n```") },
  ];
  btns.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "fmt-btn";
    btn.title = b.title;
    btn.textContent = b.label;
    if (b.style) btn.style.cssText = b.style;
    btn.addEventListener("click", (e) => { e.preventDefault(); b.action(); });
    bar.appendChild(btn);
  });
  const sep = document.createElement("div");
  sep.className = "fmt-sep";
  bar.appendChild(sep);
  const insertBtns = [
    { label:"\uD83D\uDE0A", title:"Insert Emoji", action:()=>openEmojiPicker(getEl()) },
    { label:"@role", title:"Mention Role", action:()=>openMentionModal("role", getEl()) },
    { label:"@user", title:"Mention User", action:()=>openMentionModal("user", getEl()) },
    { label:"#ch", title:"Mention Channel", action:()=>openMentionModal("channel", getEl()) },
  ];
  insertBtns.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "fmt-btn";
    btn.title = b.title;
    btn.textContent = b.label;
    btn.addEventListener("click", (e) => { e.preventDefault(); b.action(); });
    bar.appendChild(btn);
  });
})();

/* ================= markdown hints ================= */
document.querySelectorAll(".md-hint").forEach(el => {
  el.addEventListener("click", () => {
    const ta = $("msgContent");
    const map = {
      bold: "**text**", italic: "*text*", code: "`text`", codeblock: "```\ntext\n```",
      spoiler: "||text||", strikethrough: "~~text~~", everyone: "@everyone", here: "@here"
    };
    const ins = map[el.dataset.md] || el.textContent;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.substring(s, e) || "text";
    let final;
    if (el.dataset.md === "everyone" || el.dataset.md === "here") { final = ins; }
    else { final = ins.replace("text", sel); }
    ta.value = ta.value.substring(0, s) + final + ta.value.substring(e);
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
});

/* ================= emoji picker ================= */
const EMOJI_CATS = {
  "Smileys": ["\uD83D\uDE00","\uD83D\uDE03","\uD83D\uDE04","\uD83D\uDE01","\uD83D\uDE06","\uD83D\uDE05","\uD83E\uDD23","\uD83D\uDE02","\uD83D\uDE42","\uD83E\uDD21","\uD83D\uDE09","\uD83D\uDE0A","\uD83D\uDE07","\uD83E\uDD70","\uD83D\uDE18","\uD83D\uDE17","\uD83D\uDE19","\uD83D\uDE0B","\uD83D\uDE1C","\uD83E\uDD2A","\uD83D\uDE1D","\uD83E\uDD11","\uD83D\uDE10","\uD83E\uDD13","\uD83D\uDE0C","\uD83D\uDE14","\uD83E\uDD29","\uD83E\uDD27","\uD83E\uDD75","\uD83E\uDD76","\uD83E\uDD2C","\uD83E\uDD25","\uD83D\uDE10","\uD83D\uDE11","\uD83D\uDE36","\uD83D\uDE0F","\uD83D\uDE23","\uD83D\uDE2E","\uD83D\uDE35","\uD83E\uDD2F","\uD83D\uDE13","\uD83E\uDD7A","\uD83D\uDE0D","\uD83E\uDD26","\uD83D\uDE0E","\uD83E\uDD1D","\uD83E\uDDD0","\uD83E\uDD28","\uD83D\uDE34","\uD83E\uDD73","\uD83D\uDE20","\uD83D\uDE21","\uD83E\uDD2C","\uD83E\uDD11","\uD83D\uDE08","\uD83D\uDC80","\uD83D\uDCA9"],
  "People": ["\uD83D\uDC4B","\uD83E\uDD1A","\uD83D\uDD90","\uD83D\uDD9A","\uD83D\uDC4C","\uD83E\uDD0C","\uD83E\uDD0F","\u270C","\uD83E\uDD1E","\uD83E\uDD1F","\uD83E\uDD18","\uD83D\uDC48","\uD83D\uDC49","\uD83D\uDC46","\uD83D\uDC47","\u261D","\uD83D\uDC4D","\uD83D\uDC4E","\u270A","\uD83D\uDC4A","\uD83E\uDD1B","\uD83E\uDD1C","\uD83D\uDC4F","\uD83D\uDE4C","\uD83D\uDC50","\uD83E\uDD32","\uD83E\uDD1D","\u270B","\uD83D\uDC4C","\uD83E\uDD1F"],
  "Animals": ["\uD83D\uDC36","\uD83D\uDC31","\uD83D\uDC2D","\uD83D\uDC39","\uD83D\uDC30","\uD83E\uDD8A","\uD83D\uDC3B","\uD83D\uDC3C","\uD83E\uDDA8","\uD83D\uDC2F","\uD83E\uDD81","\uD83E\uDD82","\uD83D\uDC2E","\uD83D\uDC37","\uD83D\uDC38","\uD83D\uDC35","\uD83D\uDE48","\uD83D\uDE49","\uD83D\uDE4A","\uD83D\uDC14","\uD83D\uDC27","\uD83D\uDC26","\uD83D\uDC24","\uD83D\uDC22","\uD83E\uDD86","\uD83E\uDD85","\uD83E\uDD89","\uD83D\uDC0A","\uD83D\uDC06","\uD83D\uDC05","\uD83D\uDC04"],
  "Food": ["\uD83C\uDF4E","\uD83C\uDF50","\uD83C\uDF4A","\uD83C\uDF4B","\uD83C\uDF4C","\uD83C\uDF49","\uD83C\uDF47","\uD83C\uDF53","\uD83E\uDED0","\uD83C\uDF51","\uD83C\uDF52","\uD83C\uDF4D","\uD83C\uDF45","\uD83C\uDF46","\uD83E\uDD51","\uD83C\uDF44","\uD83C\uDF4F","\uD83C\uDF54","\uD83C\uDF55","\uD83C\uDF56","\uD83C\uDF57","\uD83C\uDF59","\uD83C\uDF5A","\uD83C\uDF5B","\uD83C\uDF5C","\uD83C\uDF5D","\uD83C\uDF5E","\uD83C\uDF5F","\uD83C\uDF60","\uD83C\uDF61","\uD83C\uDF62","\uD83C\uDF63","\uD83C\uDF64","\uD83C\uDF65","\uD83C\uDF66","\uD83C\uDF67","\uD83C\uDF68","\uD83C\uDF69","\uD83C\uDF6A","\uD83C\uDF6B","\uD83C\uDF6C","\uD83C\uDF6D","\uD83C\uDF6E","\uD83C\uDF6F","\uD83C\uDF70","\uD83C\uDF72","\uD83C\uDF73","\uD83C\uDF75","\uD83C\uDF76","\uD83C\uDF77","\uD83C\uDF78","\uD83C\uDF79","\uD83C\uDF7A","\uD83C\uDF7B","\uD83C\uDF7C","\uD83C\uDF84","\uD83C\uDF85"],
  "Objects": ["\u231A","\uD83D\uDCF1","\uD83D\uDCF2","\uD83D\uDCBB","\u2328","\uD83D\uDDA5","\uD83D\uDCBF","\uD83D\uDCBD","\uD83D\uDCFC","\uD83D\uDD79","\uD83C\uDFA5","\uD83C\uDFAC","\uD83C\uDFA8","\uD83D\uDCF7","\uD83D\uDCF8","\uD83D\uDCFA","\uD83D\uDCFB","\uD83D\uDCF0","\u23F0","\u23F1","\u231B","\u29D7","\u231A"],
  "Symbols": ["\u2764","\uD83E\uDDE1","\uD83D\uDC9B","\uD83D\uDC9A","\uD83D\uDC99","\uD83D\uDC9C","\uD83D\uDC94","\u2763","\uD83D\uDC95","\uD83D\uDC9E","\uD83D\uDC93","\uD83E\uDD17","\uD83D\uDC98","\uD83D\uDC96","\uD83D\uDC97","\uD83D\uDC9D","\u2B50","\u2728","\uD83D\uDD25","\uD83C\uDF1F","\uD83C\uDF08","\u2600","\u2B55","\u274C","\u274E","\u2753","\u2754","\u2755","\u2757","\u203C","\u2049","\u26A0","\u2705","\u2714","\u2716","\u270A","\u270B","\uD83D\uDC4A"]
};
let _emojiTarget = null;
function openEmojiPicker(targetEl){
  _emojiTarget = targetEl;
  const cats = $("emojiCats");
  const grid = $("emojiGrid");
  const search = $("emojiSearch");
  cats.innerHTML = ""; grid.innerHTML = "";
  const catNames = Object.keys(EMOJI_CATS);
  let activeCat = catNames[0];
  function renderCat(cat){
    grid.innerHTML = "";
    EMOJI_CATS[cat].forEach(emoji => {
      const btn = document.createElement("div");
      btn.className = "emoji-item";
      btn.textContent = emoji;
      btn.addEventListener("click", () => {
        insertAtCursor(_emojiTarget, emoji);
        $("emojiModal").classList.add("hidden");
      });
      grid.appendChild(btn);
    });
  }
  catNames.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "emoji-cat-btn" + (cat === activeCat ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      activeCat = cat;
      cats.querySelectorAll(".emoji-cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCat(cat);
    });
    cats.appendChild(btn);
  });
  renderCat(activeCat);
  search.value = "";
  search.oninput = (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { renderCat(activeCat); return; }
    grid.innerHTML = "";
    const all = [].concat(...Object.values(EMOJI_CATS));
    all.forEach(emoji => {
      const btn = document.createElement("div");
      btn.className = "emoji-item";
      btn.textContent = emoji;
      btn.addEventListener("click", () => {
        insertAtCursor(_emojiTarget, emoji);
        $("emojiModal").classList.add("hidden");
      });
      grid.appendChild(btn);
    });
  };
  $("emojiModal").classList.remove("hidden");
  setTimeout(() => search.focus(), 50);
}
$("emojiModal").addEventListener("click", (e) => { if (e.target === $("emojiModal")) $("emojiModal").classList.add("hidden"); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("emojiModal").classList.add("hidden"); });

/* ================= mention inserter ================= */
let _mentionType = null;
let _mentionTarget = null;
function openMentionModal(type, targetEl){
  _mentionType = type;
  _mentionTarget = targetEl;
  const title = $("mentionModalTitle");
  const label = $("mentionInputLabel");
  const input = $("mentionIdInput");
  if (type === "role") { title.textContent = "Mention Role"; label.textContent = "Role ID"; input.placeholder = "Enter Role ID..."; }
  else if (type === "user") { title.textContent = "Mention User"; label.textContent = "User ID"; input.placeholder = "Enter User ID..."; }
  else { title.textContent = "Mention Channel"; label.textContent = "Channel ID"; input.placeholder = "Enter Channel ID..."; }
  input.value = "";
  $("mentionModal").classList.remove("hidden");
  setTimeout(() => input.focus(), 50);
}
function closeMentionModal(){ $("mentionModal").classList.add("hidden"); }
$("confirmMentionModal").onclick = () => {
  const id = $("mentionIdInput").value.trim();
  if (!id) { showToast("Enter an ID", "warn"); return; }
  let text = "";
  if (_mentionType === "role") text = "<@&" + id + ">";
  else if (_mentionType === "user") text = "<@" + id + ">";
  else text = "<#" + id + ">";
  insertAtCursor(_mentionTarget, text);
  closeMentionModal();
};
$("cancelMentionModal").onclick = closeMentionModal;
$("mentionModal").addEventListener("click", (e) => { if (e.target === $("mentionModal")) closeMentionModal(); });
$("mentionIdInput").addEventListener("keydown", (e) => { if (e.key === "Enter") $("confirmMentionModal").click(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMentionModal(); });
