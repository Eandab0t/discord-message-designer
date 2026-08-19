const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
<script>
(function(){
  var ok = true;
  function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
  function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

  /* ========== component registry ========== */
  assert(COMPONENT_TYPES && COMPONENT_TYPES.button && COMPONENT_TYPES.select, 'registry has button+select');
  assert(COMPONENT_TYPES_BY_DISCORD_TYPE[2]==='button' && COMPONENT_TYPES_BY_DISCORD_TYPE[3]==='select', 'discord type map');
  var b = COMPONENT_TYPES.button.create();
  assert(b.type==='button' && b.label==='', 'registry create()');
  var s = COMPONENT_TYPES.select.create();
  assert(s.type==='select', 'registry create() select');
  suite('component registry');

  /* ========== undo / redo ========== */
  var baseCount = state.embeds.length;
  document.getElementById("btnAddEmbed").click();
  assert(state.embeds.length===baseCount+1, 'added embed');
  undo();
  assert(state.embeds.length===baseCount, 'undo removes embed');
  redo();
  assert(state.embeds.length===baseCount+1, 'redo re-adds embed');
  /* typing coalesce */
  var t = document.getElementById('msgContent');
  var histBefore = history.index;
  t.value = 'a'; t.oninput({target:t});
  t.value = 'ab'; t.oninput({target:t});
  t.value = 'abc'; t.oninput({target:t});
  assert(state.content==='abc', 'content set');
  assert(history.index===histBefore+1, 'coalesced typing adds exactly one history step');
  undo();
  assert(state.content!=='abc', 'undo reverts typing');
  assert(document.getElementById('msgContent').value!=='abc', 'input value restored on undo');
  redo();
  assert(state.content==='abc', 'redo restores typing');
  suite('undo/redo');

  /* ========== validation ========== */
  state.content = '';
  var em = state.embeds[0];
  em.hidden = false;
  em.title = 'x'.repeat(300);
  em.description = '';
  em.fields = [{name:'',value:'',inline:false}];
  var issues = validate();
  assert(issues.some(function(i){return i.kind==='error' && /title/i.test(i.msg)}), 'title length flagged');
  em.title = 'ok';
  state.content = 'z'.repeat(2001);
  issues = validate();
  assert(issues.some(function(i){return i.kind==='error' && /content/i.test(i.msg)}), 'content length flagged');
  state.content = '';
  em.fields = [];
  issues = validate();
  assert(!issues.some(function(i){return i.kind==='error' && /fields/i.test(i.msg)}), 'no false field error');
  suite('validation');

  /* ========== hidden embeds excluded from payload + preview ========== */
  state.embeds = [newEmbed()];
  state.components = [];
  var e1 = newEmbed(); e1.title='Visible'; e1.hidden=false;
  var e2 = newEmbed(); e2.title='Hidden one'; e2.hidden=true;
  state.embeds = [e1, e2];
  var p = buildPayload();
  assert(p.embeds.length===1 && p.embeds[0].title==='Visible', 'hidden embed excluded from payload');
  renderPreview();
  var pre = document.getElementById('preview');
  assert(pre.querySelector('.e-title').textContent==='Visible', 'hidden embed excluded from preview');

  /* hidden component excluded from payload */
  var hBtn = newButton(); hBtn.label='X'; hBtn.hidden=true;
  state.components = [hBtn];
  var p2 = buildPayload();
  assert(p2.components===null || p2.components.length===0, 'hidden component excluded from payload');

  /* visible component exports */
  hBtn.hidden = false;
  var p3 = buildPayload();
  assert(p3.components.length===1 && p3.components[0].label==='X', 'visible component exports');
  suite('hidden toggles');

  /* ========== layers tree ========== */
  state.embeds = [newEmbed(), newEmbed()];
  state.components = [newButton()];
  renderLayers();
  var tree = document.getElementById('layerTree');
  assert(tree.querySelectorAll('.layer-item').length>=3, 'layers rendered');
  var targets = tree.querySelectorAll('.layer-item');
  /* click second item (first embed) */
  if (targets[1]) targets[1].click();
  assert(selected && selected.kind==='embed', 'clicking layer selects embed');
  /* eye toggle */
  var eye = tree.querySelector('.layer-item .eye');
  if (eye) eye.closest('.layer-item').click();
  suite('layers tree');

  /* ========== auto-fix removes empty items ========== */
  state.embeds = [newEmbed(), newEmbed(), newEmbed()];
  state.embeds[0].title='Keep';
  state.components = [newButton()]; /* empty button */
  autoFix();
  assert(state.embeds.length===1 && state.embeds[0].title==='Keep', 'autofix removed empty embeds');
  assert(state.components.length===0, 'autofix removed empty button');
  suite('auto-fix');

  /* ========== keyboard: Delete removes selected ========== */
  state.embeds = [newEmbed()];
  var k = newEmbed(); k.title='Sel'; state.embeds.push(k);
  selectTarget({kind:'embed', idx:1});
  var ev = new window.KeyboardEvent('keydown', {key:'Delete', cancelable:true, bubbles:true});
  document.dispatchEvent(ev);
  assert(state.embeds.length===1, 'delete removes selected embed');
  suite('keyboard delete');

  /* ========== import roundtrip with hidden ========== */
  applyPayload(JSON.parse(JSON.stringify(buildPayload())));
  assert(state.embeds.every(function(e){return e.hidden===false}), 'import resets hidden');

  console.log(ok ? 'FINAL: ALL PASSED' : 'FINAL: FAILURES PRESENT');
})();
</script>
`;

new JSDOM(html.replace("</body>", testScript + "</body>"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
});
