const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
<script>
(function(){
  var ok = true;
  function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
  function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

  /* ========== COMPONENT EXPORT FIXES ========== */

  /* 1. Button only exports when user fills label or emoji or url */
  var b = newButton(); b.label = "Hello";
  state.components = [b];
  var p = buildPayload();
  assert(p.components && p.components[0].label==='Hello', 'labelled button exports');

  /* 2. Button with emoji only exports */
  b.label = ""; b.emoji = "<:pepe:123>";
  var p2 = buildPayload();
  assert(p2.components && p2.components[0].emoji.name==='pepe', 'emoji-only button exports');
  b.emoji = "";

  /* 3. Select with all-empty options must NOT export */
  state.components = [newStringSelect()];
  var p3 = buildPayload();
  assert(p3.components===null || p3.components.length===0, 'empty select not exported');

  /* 4. Select exports when option has a label */
  var s = state.components[0];
  s.options[0].label = "Real Option"; s.options[0].value = "real";
  var p4 = buildPayload();
  assert(p4.components && p4.components[0].type===3 && p4.components[0].options.length===1, 'labelled select option exports');

  /* 5. Mixed empty + filled: only filled exports */
  var emptyBtn = newButton();
  var filledBtn = newButton(); filledBtn.label = "Fill Me";
  state.components = [emptyBtn, filledBtn];
  var p5 = buildPayload();
  assert(p5.components.length===1 && p5.components[0].label==='Fill Me', 'mixed components exports only filled');

  /* 6. Link button (style 5) with url exports correctly */
  var l = newButton(); l.style=5; l.label="Visit"; l.url="https://x.com";
  state.components = [l];
  var p6 = buildPayload();
  assert(p6.components[0].style===5 && p6.components[0].url==='https://x.com' && !p6.components[0].custom_id, 'link button exports');

  /* 7. Empty link button filtered */
  var l2 = newButton(); l2.style=5; l2.label=""; l2.url="";
  state.components = [l2];
  var p7 = buildPayload();
  assert(p7.components===null || p7.components.length===0, 'empty link button filtered');

  /* 8. Round-trip: export -> apply -> export identical */
  var cont = newContainer();
  cont.accentColor = '#ff0000';
  var rb = newButton(); rb.label="Hi"; rb.style=2; rb.customId="cid"; rb.emoji="<a:wave:999>";
  var rs = newStringSelect(); rs.placeholder="Pick"; rs.min=1; rs.max=3;
  rs.options=[{label:"A",value:"a",description:"",emoji:""},{label:"B",value:"b",description:"",emoji:""}];
  cont.children=[rb, rs];
  state.components=[cont];
  var orig = JSON.stringify(buildPayload().components);
  applyPayload(JSON.parse(JSON.stringify(buildPayload())));
  var rebuilt = JSON.stringify(buildPayload().components);
  assert(orig===rebuilt, 'roundtrip identical');

  state.embeds = [newEmbed()];
  state.components = [];
  suite('component export fixes');

  /* ========== full regression ========== */
  var em = state.embeds[0];
  em.title='Hello World'; em.description='Test **description**'; em.color='#ff0000';
  em.fields=[{name:'A',value:'1',inline:true},{name:'B',value:'2',inline:false}];
  em.footerText='Footer here'; em.thumb='https://example.com/t.png';
  em.image='https://example.com/i.png'; em.timestamp=true; em.authorName='Author Name';
  var sec = newSection();
  var btn = newButton(); btn.label='Click'; btn.style=3; btn.emoji='<:pepe:123456>';
  var sel = newStringSelect(); sel.placeholder='Choose';
  sel.options=[{label:'Opt 1', value:'o1', description:'', emoji:''}];
  sec.children = [btn, sel];
  state.components=[sec];
  state.content='Test content';
  var payload = buildPayload();
  assert(payload.embeds[0].color===0xff0000 && payload.embeds[0].title==='Hello World', 'embed basics');
  assert(payload.embeds[0].author.name==='Author Name', 'author');
  assert(payload.embeds[0].fields.length===2 && payload.embeds[0].fields[0].inline===true, 'fields');
  assert(payload.embeds[0].footer.text==='Footer here', 'footer');
  assert(payload.embeds[0].thumbnail.url==='https://example.com/t.png', 'thumb');
  assert(payload.embeds[0].image.url==='https://example.com/i.png' && !!payload.embeds[0].timestamp, 'image+ts');
  assert(payload.components[0].type===9, 'section type');
  assert(payload.components[0].components[0].type===2 && payload.components[0].components[0].style===3, 'button');
  assert(payload.components[0].components[0].emoji.name==='pepe' && payload.components[0].components[0].emoji.id==='123456', 'emoji');
  assert(payload.components[0].components[1].type===3 && payload.components[0].components[1].min_values===1, 'select');
  assert(payload.content==='Test content', 'content');
  suite('payload regression');

  /* ========== import regression ========== */
  var json = JSON.stringify({ content: 'Imported', embeds: [{ title:'T', description:'D', color:16711680,
    author:{name:'A',url:'https://a',icon_url:'https://a.png'}, footer:{text:'F',icon_url:'https://f.png'},
    thumbnail:{url:'https://t.png'}, image:{url:'https://i.png'}, timestamp:'2024-01-01T00:00:00.000Z',
    fields:[{name:'N',value:'V',inline:true}]}],
    components:[{type:1, components:[{type:2,style:1,label:'B',custom_id:'cid',emoji:{name:'pepe',id:'123',animated:false},disabled:true},{type:2,style:5,label:'L',url:'https://l'}]}] });
  assert(applyPayload(JSON.parse(json))===true, 'apply returns true');
  var em2=state.embeds[0];
  assert(em2.title==='T' && em2.color==='#ff0000' && em2.thumb==='https://t.png' && em2.image==='https://i.png', 'embed import');
  assert(em2.fields.length===1 && em2.fields[0].inline===true && em2.timestamp===true, 'field+ts import');
  assert(em2.authorName==='A' && em2.authorUrl==='https://a' && em2.footerText==='F', 'author+footer import');
  var importedRow = state.components[0];
  assert(importedRow.type==='action-row', 'imported row is action-row');
  assert(importedRow.children[0].label==='B' && importedRow.children[0].customId==='cid' && importedRow.children[0].disabled===true, 'button import');
  assert(importedRow.children[1].style===5 && importedRow.children[1].url==='https://l', 'link import');
  assert(applyPayload(null)===false && applyPayload('s')===false && applyPayload([1])===false, 'reject invalid');
  suite('import regression');

  /* ========== focus preservation ========== */
  var editorsDiv = document.getElementById('embedList');
  var fieldNameInputs = editorsDiv.querySelectorAll('input[data-fn]');
  var inp = fieldNameInputs[0];
  inp.value = 'Hello';
  inp.oninput({ target: inp });
  assert(document.querySelector('input[data-fn="0"]') === inp, 'editor not rebuilt on field input');
  var titleInput = editorsDiv.querySelector('input[data-f="title"]');
  titleInput.value = 'New Title';
  titleInput.oninput({ target: titleInput });
  assert(document.querySelector('input[data-f="title"]') === titleInput, 'editor not rebuilt on title input');
  assert(state.embeds[0].title === 'New Title', 'title state updated');
  suite('focus preservation');

  /* ========== live counters ========== */
  assert(typeof LIMITS==='object' && LIMITS.embedTitle===256, 'LIMITS exists');
  state.embeds = [newEmbed()]; state.components = []; state.content = '';
  var emC = state.embeds[0];
  emC.title='Counter Title'; emC.description='12345';
  renderAll();
  var tWrap = document.querySelector('input[data-f="title"]').parentElement;
  var tCnt = tWrap.querySelector('[data-cnt]');
  assert(tCnt && tCnt.textContent==='13/256', 'title counter, got "'+ (tCnt?tCnt.textContent:'none') +'"');
  var dWrap = document.querySelector('textarea[data-f="description"]').parentElement;
  var dCnt = dWrap.querySelector('[data-cnt]');
  assert(dCnt && dCnt.textContent==='5/4096', 'description counter, got "'+ (dCnt?dCnt.textContent:'none') +'"');
  var msgEl = document.getElementById('msgContent');
  msgEl.value='abc'; msgEl.oninput({target:msgEl});
  var expTotal = messageTotalChars() + '/6000';
  assert(document.getElementById('msgTotal').textContent===expTotal, 'message total counter');
  var cCnt = msgEl.parentElement.querySelector('[data-cnt]');
  assert(cCnt.textContent==='3/2000', 'content field counter');
  var fWrap = document.querySelector('input[data-fn]').parentElement;
  var fCnt = fWrap.querySelector('[data-cnt]');
  assert(fCnt && fCnt.textContent==='0/256', 'fresh field name counter');
  suite('live counters');

  console.log(ok ? 'FINAL: ALL PASSED' : 'FINAL: FAILURES PRESENT');
})();
</script>
`;

new JSDOM(html.replace("</body>", testScript + "</body>"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
});
