const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();
const test = `
<script>
(function(){
  var ok = true;
  function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
  function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

  /* ========== round-trip: build -> apply -> build ========== */
  var cont = newContainer();
  cont.accentColor = '#ff5500';
  var b9 = newButton(); b9.label='Hi'; b9.style=2; b9.customId='cid'; b9.emoji='<a:wave:999>';
  var s9 = newStringSelect(); s9.placeholder='Pick'; s9.min=1; s9.max=3;
  s9.options=[{label:'A',value:'a',description:'',emoji:''},{label:'B',value:'b',description:'',emoji:''}];
  cont.children=[b9, s9];
  state.components=[cont];
  var before = buildPayload();
  assert(before.components && before.components.length===1, 'container exported');
  var rt = applyPayload(JSON.parse(JSON.stringify(before)));
  assert(rt===true, 'applyPayload returns true');
  var after = buildPayload();
  assert(JSON.stringify(before.components)===JSON.stringify(after.components), 'roundtrip identical');
  suite('round-trip');

  /* ========== tree structure ========== */
  var node = state.components[0];
  assert(node.type==='container' && node.children.length===2, 'container has 2 children');
  assert(node.children[0].type==='button' && node.children[0].label==='Hi', 'button child');
  assert(node.children[1].type==='select' && node.children[1].options.length===2, 'select child with options');
  suite('tree structure');

  console.log(ok ? 'FINAL: ALL PASSED' : 'FINAL: FAILURES PRESENT');
})();
</script>
`;
new JSDOM(html.replace("</body>", test + "</body>"), { runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/" });
