"use strict";
/* ================= state ================= */
const state = {
  content: "",
  embeds: [],
  components: [], /* top-level nodes: container() or actionRow() */
  files: [],      /* { name, file, usage: "thumbnail"|"image", embedIndex } */
  settings: {     /* message-level settings */
    name: "New Message",
    channelId: "",
    authorId: "",
    accentColor: "#5865f2",
    flags: "32768"
  }
};

let embedSeq = 1;
let nextFileId = 1;

/* ================= helpers ================= */
const $ = (id) => document.getElementById(id);
function uid(){ return Math.random().toString(36).slice(2,9); }
function esc(s){
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escAttr(s){ return esc(s).replace(/\n/g," "); }
function hexToInt(hex){
  let h = String(hex||"").replace(/^#/,"").trim();
  if(/^[0-9a-fA-F]{6}$/.test(h)) return parseInt(h,16);
  return 0x5865f2;
}
function intToHex(n){ return "#" + ("000000" + Number(n).toString(16)).slice(-6); }
function newEmbed(){
  return {
    id: "e" + (embedSeq++),
    hidden: false,
    authorName:"", authorUrl:"", authorIcon:"",
    title:"", url:"", description:"", color:"#5865f2",
    fields:[{name:"",value:"",inline:false}],
    thumb:"", image:"",
    footerText:"", footerIcon:"", timestamp:false
  };
}
function _node(extra){ return Object.assign({ id:uid(), type:"markdown", hidden:false, collapsed:false }, extra); }
function newButton(){ return _node({ type:"button", label:"", emoji:"", style:1, customId:"btn_"+uid(), url:"", disabled:false }); }
function newStringSelect(){ return _node({ type:"select", customId:"sel_"+uid(), placeholder:"", min:1, max:1, options:[{label:"",value:"",description:"",emoji:""}] }); }
function newSelectVariant(kind){ return _node({ type:kind, customId:"sel_"+uid(), placeholder:"", min:0, max:1, channelTypes:"" }); }
function newMarkdown(){ return _node({ type:"markdown", content:"" }); }
function newThumbnail(){ return _node({ type:"accessory-image", src:"", alt:"" }); }
function newSeparator(){ return _node({ type:"separator", spacing:1, divider:true }); }
function newMediaGallery(){ return _node({ type:"media-gallery", items:[] }); }
function newFile(){ return _node({ type:"file", name:"", spoiler:false }); }
function newSection(){ return _node({ type:"section", children:[], accessory:null }); }
function newContainer(){ return _node({ type:"container", children:[], accentColor:"", spoiler:false }); }
function newActionRow(){ return _node({ type:"action-row", children:[] }); }
/* backward-compat aliases */
function newSelect(){ return newStringSelect(); }
function newSelectVariantUser(){ return newSelectVariant("select-user"); }
function newAccessoryImage(){ return newThumbnail(); }

/* ================= tree helpers ================= */
function findNode(id, nodes){
  nodes = nodes || state.components;
  for (let i = 0; i < nodes.length; i++){
    if (nodes[i].id === id) return nodes[i];
    if (nodes[i].children){
      const found = findNode(id, nodes[i].children);
      if (found) return found;
    }
    if (nodes[i].accessory && nodes[i].accessory.id === id) return nodes[i].accessory;
  }
  return null;
}
function findNodeParent(id, nodes, parentArr){
  nodes = nodes || state.components;
  parentArr = parentArr || state.components;
  for (let i = 0; i < nodes.length; i++){
    if (nodes[i].id === id) return { arr: parentArr, idx: i, node: nodes[i] };
    if (nodes[i].children){
      const found = findNodeParent(id, nodes[i].children, nodes[i].children);
      if (found) return found;
    }
  }
  return null;
}
function removeNode(id){
  const info = findNodeParent(id);
  if (info) info.arr.splice(info.idx, 1);
  return info;
}
function insertNode(node, afterId, arr){
  arr = arr || state.components;
  if (!afterId) { arr.push(node); return; }
  const idx = arr.findIndex(n => n.id === afterId);
  if (idx >= 0) arr.splice(idx + 1, 0, node);
  else arr.push(node);
}
function moveNode(id, dir){
  const info = findNodeParent(id);
  if (!info) return;
  const newIdx = info.idx + dir;
  if (newIdx < 0 || newIdx >= info.arr.length) return;
  const [m] = info.arr.splice(info.idx, 1);
  info.arr.splice(newIdx, 0, m);
}
function getChildTypes(parentType){
  if (parentType === "container") return ["markdown","section","separator","media-gallery","file","action-row"];
  if (parentType === "section") return ["markdown"];
  if (parentType === "action-row") return ["button","select","select-user","select-role","select-mentionable","select-channel"];
  return [];
}
function typeHasChildren(type){
  return type === "container" || type === "section" || type === "action-row";
}

/* ================= emoji / url / content helpers ================= */
function emojiHtml(s){
  const m = String(s||"").match(/^(<a?)?:(.+?):(\d+)>?$/);
  if (m) return `<img class="eimg" src="https://cdn.discordapp.com/emojis/${m[3]}.png" alt=":${m[2]}:" />`;
  return "";
}
function parseEmoji(emoji){
  const m = String(emoji).match(/^(<a?)?:(.+?):(\d+)>?$/);
  if (m) {
    return { name: m[2], id: m[3], animated: m[1] === "<a" };
  }
  return { name: emoji };
}
function urlVal(s){ return (typeof s === "string" ? s.trim() : "") || undefined; }
function normalizeHex(h){ const x = String(h||"").trim(); if(/^#[0-9a-fA-F]{6}$/.test(x)) return x; if(/^[0-9a-fA-F]{6}$/.test(x)) return "#"+x; return "#5865f2"; }
function authorInitial(){ return (state.content.trim().split(/\s+/)[0] || "Y").slice(0,1).toUpperCase(); }
function embedHasContent(em){ return em.title || em.description || em.authorName || em.footerText || em.image || em.thumb || em.fields.some(f=>f.name||f.value); }

/* A component only "has content" when the user actually filled it in */
function compHasContent(c){
  if (!c) return false;
  switch (c.type) {
    case "button": return !!(c.label || c.emoji || c.url);
    case "markdown": return !!(c.content || "").trim();
    case "accessory-image": return !!(c.src || "").trim();
    case "separator": return true;
    case "media-gallery": return (c.items||[]).some(m => m.media);
    case "file": return !!(c.name || "").trim();
    case "select": return c.options.some(o => o.label);
    case "select-user": case "select-role": case "select-mentionable": case "select-channel":
      return !!(c.placeholder || "").trim();
    case "section": return (c.children||[]).some(compHasContent) || (c.accessory && compHasContent(c.accessory));
    case "container": return (c.children||[]).some(compHasContent);
    case "action-row": return (c.children||[]).some(compHasContent);
    default: return false;
  }
}

/* ================= clipboard ================= */
let clipBoard = null;
function copyNode(id){
  const node = findNode(id);
  if (node) clipBoard = JSON.parse(JSON.stringify(node));
}
function pasteNode(afterId){
  if (!clipBoard) return;
  const copy = JSON.parse(JSON.stringify(clipBoard));
  assignNewIds(copy);
  insertNode(copy, afterId);
}
