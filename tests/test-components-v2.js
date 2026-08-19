const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
<script>
(function(){
  var ok = true;
  function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
  function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

  /* ========== registry has V2 types ========== */
  assert(COMPONENT_TYPES.markdown && COMPONENT_TYPES.section && COMPONENT_TYPES.container, 'V2 types registered');
  assert(COMPONENT_TYPES_BY_DISCORD_TYPE[10]==='markdown', 'discord type map markdown=10');
  assert(COMPONENT_TYPES_BY_DISCORD_TYPE[11]==='accessory-image', 'discord type map accessory-image=11');
  assert(COMPONENT_TYPES_BY_DISCORD_TYPE[9]==='section', 'discord type map section=9');
  assert(COMPONENT_TYPES_BY_DISCORD_TYPE[17]==='container', 'discord type map container=17');
  assert(!COMPONENT_TYPES_BY_DISCORD_TYPE[999], 'unknown type not in map');
  suite('registry v2');

  /* ========== member selects ========== */
  var us = newSelectVariant('select-user'); us.placeholder = 'Pick a user';
  var ch = newSelectVariant('select-channel'); ch.placeholder = 'Pick a channel'; ch.channelTypes = '0,1,2';
  state.components = [us, ch];
  var p2 = buildPayload();
  assert(p2.components[0].type===5 && p2.components[0].placeholder==='Pick a user', 'user select serializes as type 5');
  assert(p2.components[1].type===8 && JSON.stringify(p2.components[1].channel_types)==='[0,1,2]', 'channel select with channel_types');
  var u2 = newSelectVariant('select-user');
  assert(compHasContent(u2)===false && compHasContent(us)===true, 'member select content rule');
  suite('member selects');

  /* ========== markdown + accessory image ========== */
  var md = newMarkdown(); md.content = '**bold** text';
  var img = newAccessoryImage(); img.src = 'https://x.com/i.png'; img.alt = 'hi';
  state.components = [md, img];
  var p3 = buildPayload();
  assert(p3.components[0].type===10 && p3.components[0].content==='**bold** text', 'markdown serialize');
  assert(p3.components[1].type===11 && p3.components[1].media.url==='https://x.com/i.png' && p3.components[1].description==='hi', 'accessory image serialize');
  suite('markdown + accessory image');

  /* ========== section with children + accessory ========== */
  var sec = newSection();
  var b1 = newButton(); b1.label='Go'; b1.style=3;
  var ms = newSelectVariant('select-mentionable'); ms.placeholder='Mention';
  sec.children = [b1, ms];
  var acc = newMarkdown(); acc.content = 'note';
  sec.accessory = acc;
  state.components = [sec];
  var p5 = buildPayload();
  assert(p5.components[0].type===9 && p5.components[0].components.length===2 && p5.components[0].components[0].type===2 && p5.components[0].components[0].label==='Go', 'section children serialized');
  assert(p5.components[0].components[1].type===7, 'mentionable select nested type');
  assert(p5.components[0].accessory && p5.components[0].accessory.type===10 && p5.components[0].accessory.content==='note', 'section accessory serialized');
  suite('section children + accessory');

  /* ========== container nesting ========== */
  var cont = newContainer();
  var inner = newContainer();
  var innerB = newButton(); innerB.label='Deep';
  inner.children = [innerB];
  var outerB = newButton(); outerB.label='Outer';
  cont.children = [outerB, inner];
  state.components = [cont];
  var p6 = buildPayload();
  assert(p6.components[0].type===17 && p6.components[0].components.length===2, 'container children serialized');
  assert(p6.components[0].components[1].type===17 && p6.components[0].components[1].components[0].label==='Deep', 'nested container recursed');
  suite('container nesting');

  /* ========== round-trip via applyPayload ========== */
  var secRt = newSection();
  var bb = newButton(); bb.label='Click'; bb.customId='cid1';
  secRt.children = [bb];
  var mdRt = newMarkdown(); mdRt.content='hello **world**';
  secRt.accessory = mdRt;
  var contRt = newContainer();
  var roleSel = newSelectVariant('select-role'); roleSel.placeholder = 'Role';
  contRt.children = [roleSel];
  state.components = [secRt, contRt];
  var orig = JSON.stringify(buildPayload().components);
  applyPayload(JSON.parse(JSON.stringify(buildPayload())));
  var rebuilt = JSON.stringify(buildPayload().components);
  assert(orig===rebuilt, 'V2 roundtrip identical, got: ' + rebuilt);
  assert(state.components[0].type==='section' && state.components[0].children.length===1 && state.components[0].accessory.type==='markdown', 'section deserialized shape');
  assert(state.components[1].type==='container' && state.components[1].children[0].type==='select-role', 'container deserialized shape');
  suite('V2 roundtrip');

  /* ========== previews render without throwing ========== */
  var previewOk = true;
  try {
    renderPreview();
    var ph = document.getElementById('preview').innerHTML;
    if (ph.indexOf('c-section') < 0) previewOk = false;
    if (ph.indexOf('md-text') < 0) previewOk = false;
  } catch(e) { previewOk = false; }
  assert(previewOk, 'preview renders nested types');
  suite('preview v2');

  console.log(ok ? 'FINAL: ALL PASSED' : 'FINAL: FAILURES PRESENT');
})();
</script>
`;

new JSDOM(html.replace("</body>", testScript + "</body>"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
});
