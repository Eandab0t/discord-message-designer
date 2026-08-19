"use strict";
/* ================= command palette (Ctrl+K) ================= */
const CMD_LIST = [
  { label:"Add Text",          group:"Add",    action:() => paletteAdd("markdown") },
  { label:"Add Button",        group:"Add",    action:() => paletteAdd("button") },
  { label:"Add Container",     group:"Add",    action:() => paletteAdd("container") },
  { label:"Add Section",       group:"Add",    action:() => paletteAdd("section") },
  { label:"Add Separator",     group:"Add",    action:() => paletteAdd("separator") },
  { label:"Add Thumbnail",     group:"Add",    action:() => paletteAdd("accessory-image") },
  { label:"Add Gallery",       group:"Add",    action:() => paletteAdd("media-gallery") },
  { label:"Add File",          group:"Add",    action:() => paletteAdd("file") },
  { label:"Add Select",        group:"Add",    action:() => paletteAdd("select") },
  { label:"Add Action Row",    group:"Add",    action:() => paletteAdd("action-row") },
  { label:"Add Embed",         group:"Add",    action:() => { beforeEdit(); state.embeds.push(newEmbed()); renderAll(); } },
  { label:"Add Embed Field",   group:"Add",    action:() => { const i=ensureEmbedIdx(); beforeEdit(); state.embeds[i].fields.push({name:"",value:"",inline:false}); renderAll(); } },
  { label:"Switch to Embed Mode", group:"View", action:() => setMode("embed") },
  { label:"Switch to Components Mode", group:"View", action:() => setMode("components") },
  { label:"Toggle Simple/Advanced", group:"View", action:() => setAdvanced(!document.body.classList.contains("advanced")) },
  { label:"Toggle Sidebar",    group:"View",   action:() => document.body.classList.toggle("sidebar-collapsed") },
  { label:"Duplicate Selected",group:"Edit",   action:() => { if(selected&&selected.kind==="comp"&&selected.id){beforeEdit();const c=JSON.parse(JSON.stringify(findNode(selected.id)));assignNewIds(c);const info=findNodeParent(selected.id);if(info)info.arr.splice(info.idx+1,0,c);renderAll();} } },
  { label:"Delete Selected",   group:"Edit",   action:() => { if(selected&&selected.kind==="comp"&&selected.id){beforeEdit();removeNode(selected.id);selected=null;renderAll();} else if(selected&&selected.kind==="embed"){beforeEdit();state.embeds.splice(selected.idx,1);selected=null;renderAll();} } },
  { label:"Clear All Components", group:"Edit", action:() => { if(confirm("Remove all components?")){beforeEdit();state.components=[];selected=null;renderAll();} } },
  { label:"Export JSON",       group:"File",   action:() => exportJson() },
  { label:"Import JSON",       group:"File",   action:() => importJson() },
  { label:"Copy JSON",         group:"File",   action:() => { renderJson(); navigator.clipboard.writeText($("jsonBox").value).catch(()=>{}); } },
  { label:"Undo",              group:"History", action:() => undo() },
  { label:"Redo",              group:"History", action:() => redo() },
  { label:"Auto-fix Issues",   group:"Tools",  action:() => { if(typeof autoFix==="function") autoFix(); } },
];

let cmdPaletteOpen = false;

function openCmdPalette(){
  const overlay = $("cmdOverlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  cmdPaletteOpen = true;
  const input = overlay.querySelector(".cmd-input");
  if (input) { input.value = ""; input.focus(); renderCmdResults(""); }
}

function closeCmdPalette(){
  const overlay = $("cmdOverlay");
  if (overlay) overlay.classList.add("hidden");
  cmdPaletteOpen = false;
}

function renderCmdResults(query){
  const list = $("cmdList");
  if (!list) return;
  list.innerHTML = "";
  const q = query.toLowerCase().trim();
  const filtered = q ? CMD_LIST.filter(c => c.label.toLowerCase().includes(q)) : CMD_LIST;
  let lastGroup = "";
  filtered.forEach(cmd => {
    if (cmd.group !== lastGroup) {
      lastGroup = cmd.group;
      const gh = document.createElement("div");
      gh.className = "cmd-group-title";
      gh.textContent = cmd.group;
      list.appendChild(gh);
    }
    const item = document.createElement("button");
    item.className = "cmd-item";
    item.textContent = cmd.label;
    item.onclick = () => { closeCmdPalette(); cmd.action(); };
    list.appendChild(item);
  });
  if (!filtered.length){
    const empty = document.createElement("div");
    empty.className = "cmd-empty";
    empty.textContent = "No matching commands";
    list.appendChild(empty);
  }
}

/* keyboard shortcut */
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (cmdPaletteOpen) closeCmdPalette();
    else openCmdPalette();
  }
  if (e.key === "Escape" && cmdPaletteOpen) {
    closeCmdPalette();
  }
});

$("btnCmdPalette").onclick = () => { if (cmdPaletteOpen) closeCmdPalette(); else openCmdPalette(); };
