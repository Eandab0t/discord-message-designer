const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
<script>
(function(){
  var ok = true;
  function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
  function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

  /* ========== component creation ========== */
  var btn = COMPONENT_TYPES.button.create();
  btn.label = "My Button"; btn.style = 4; btn.customId = "cid";
  state.components.push(btn);
  var p = buildPayload();
  assert(p.components && p.components[0].type===2, 'button exports as type 2');
  assert(p.components[0].label==='My Button' && p.components[0].style===4, 'button label+style');
  suite('button creation');

  /* ========== select creation ========== */
  state.components = [];
  var sel = COMPONENT_TYPES.select.create();
  sel.placeholder = "Pick one";
  sel.options.push({label:"First",value:"1",description:"",emoji:""});
  state.components.push(sel);
  var p2 = buildPayload();
  assert(p2.components && p2.components[0].type===3, 'select exports as type 3');
  assert(p2.components[0].placeholder==='Pick one' && p2.components[0].options.length===1, 'select placeholder+options');
  suite('select creation');

  /* ========== container with children ========== */
  state.components = [];
  var cont = COMPONENT_TYPES.container.create();
  var md = COMPONENT_TYPES.markdown.create(); md.content = "Hello";
  cont.children.push(md);
  var btn2 = COMPONENT_TYPES.button.create(); btn2.label = "Inside";
  var ar = COMPONENT_TYPES['action-row'].create(); ar.children.push(btn2);
  cont.children.push(ar);
  state.components.push(cont);
  var p3 = buildPayload();
  assert(p3.components[0].type===17, 'container exports as type 17');
  assert(p3.components[0].components.length===2, 'container has 2 children');
  assert(p3.components[0].components[0].type===10, 'markdown child is type 10');
  assert(p3.components[0].components[1].type===1, 'action-row child is type 1');
  assert(p3.components[0].components[1].components[0].label==='Inside', 'button inside action-row inside container');
  suite('container nesting');

  /* ========== compHasContent ========== */
  var emptyBtn = COMPONENT_TYPES.button.create();
  assert(compHasContent(emptyBtn)===false, 'empty button has no content');
  emptyBtn.label = "X";
  assert(compHasContent(emptyBtn)===true, 'button with label has content');
  var emptyMd = COMPONENT_TYPES.markdown.create();
  assert(compHasContent(emptyMd)===false, 'empty markdown has no content');
  emptyMd.content = "text";
  assert(compHasContent(emptyMd)===true, 'markdown with content has content');
  suite('compHasContent');

  /* ========== empty component not exported ========== */
  state.components = [];
  var emptyBtn2 = COMPONENT_TYPES.button.create();
  state.components.push(emptyBtn2);
  var p4 = buildPayload();
  assert(p4.components===null || p4.components.length===0, 'empty button not exported');
  suite('empty component filtering');

  /* ========== select with empty options not exported ========== */
  state.components = [];
  var emptySel = COMPONENT_TYPES.select.create();
  emptySel.options = [];
  state.components.push(emptySel);
  var p5 = buildPayload();
  assert(p5.components===null || p5.components.length===0, 'select with no options not exported');
  suite('empty select filtering');

  console.log(ok ? 'FINAL: ALL PASSED' : 'FINAL: FAILURES PRESENT');
})();
</script>
`;

new JSDOM(html.replace("</body>", testScript + "</body>"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
});
