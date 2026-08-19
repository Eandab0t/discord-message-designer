"use strict";
/* ================= undo / redo =================
   Every mutation marks a pending edit via beforeEdit(). Structural ops finish
   in renderAll() which commits the post-mutation snapshot; typing ops commit
   in their handler with coalescing so a burst of keystrokes = one undo step. */
const history = { stack: [], index: -1, max: 60 };
let pendingEdit = false;
let lastSrc = null, lastTime = 0;
function beforeEdit(){ pendingEdit = true; }
function commitHistory(src){
  if (!pendingEdit) return;
  pendingEdit = false;
  const now = Date.now();
  const snap = JSON.stringify({ content: state.content, embeds: state.embeds, components: state.components });
  if (history.stack[history.index] === snap) { lastSrc = src || null; lastTime = now; return; }
  const coalesce = !!src && src === lastSrc && now - lastTime < 600 && history.index >= 0;
  if (coalesce) {
    history.stack[history.index] = snap; // replace top = one step for the typing burst
  } else {
    history.stack = history.stack.slice(0, history.index + 1);
    history.stack.push(snap);
    if (history.stack.length > history.max) history.stack.shift();
    history.index = history.stack.length - 1;
  }
  lastSrc = src || null;
  lastTime = now;
  updateHistoryButtons();
}
function undo(){
  if (history.index <= 0) return;
  history.index--;
  restoreSnapshot();
}
function redo(){
  if (history.index >= history.stack.length - 1) return;
  history.index++;
  restoreSnapshot();
}
function restoreSnapshot(){
  pendingEdit = false;
  const snap = history.stack[history.index];
  const d = JSON.parse(snap);
  state.content = d.content; state.embeds = d.embeds; state.components = d.components;
  state.files = []; // File objects aren't serializable; clear attachment state
  $("msgContent").value = state.content;
  selected = null;
  renderAll();
  updateHistoryButtons();
}
function updateHistoryButtons(){
  const u = $("btnUndo"), r = $("btnRedo");
  if (u) u.disabled = history.index <= 0;
  if (r) r.disabled = history.index >= history.stack.length - 1;
}
$("btnUndo").onclick = () => undo();
$("btnRedo").onclick = () => redo();
