const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
  <script>
    (function(){
      var ok = true;
      function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
      function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

      // ========== COMPONENT EXPORT FIXES ==========

      // 1. A fresh empty row (user added but configured nothing) must NOT export
      document.getElementById("btnAddRow").click();
      assert(state.components.length===1, 'one row after add');
      var p = buildPayload();
      assert(p.components===null || p.components.length===0, 'empty row not exported, got '+JSON.stringify(p.components));

      // 2. Button only exports when user fills label or emoji or url
      var b = state.components[0].comps[0];
      b.label = "Hello";
      var p2 = buildPayload();
      assert(p2.components && p2.components[0].components[0].label==='Hello', 'labelled button exports');
      b.label = ""; b.emoji = "<:pepe:123>";
      var p3 = buildPayload();
      assert(p3.components && p3.components[0].components[0].emoji.name==='pepe', 'emoji-only button exports');
      b.emoji = "";

      // 3. Select with all-empty options must NOT export (Discord rejects options:[])
      state.components[0].comps = [newSelect()];
      var p4 = buildPayload();
      assert(p4.components===null || p4.components.length===0, 'empty select not exported, got '+JSON.stringify(p4.components));

      // 4. Select exports only when an option has a label
      var s = state.components[0].comps[0];
      s.options[0].label = "Real Option"; s.options[0].value = "real";
      var p5 = buildPayload();
      assert(p5.components && p5.components[0].components[0].type===3 && p5.components[0].components[0].options.length===1, 'labelled select option exports');

      // 5. Row that mixes empty + filled exports only the filled one
      var r = newRow(); r.comps = [newButton(), newButton()];
      r.comps[0].label = "Fill Me"; // comp[1] stays empty
      state.components = [r];
      var p6 = buildPayload();
      assert(p6.components[0].components.length===1 && p6.components[0].components[0].label==='Fill Me', 'mixed row exports 1 comp, got '+JSON.stringify(p6.components[0].components));

      // 6. Link button (style 5) with url exports correctly; without url -> filtered (compHasContent requires label/emoji/url)
      var r7 = newRow(); var l = newButton(); l.style=5; l.label="Visit"; l.url="https://x.com"; r7.comps=[l];
      state.components=[r7];
      var p7 = buildPayload();
      assert(p7.components[0].components[0].style===5 && p7.components[0].components[0].url==='https://x.com' && !p7.components[0].components[0].custom_id, 'link button exports');
      var r8 = newRow(); var l2 = newButton(); l2.style=5; l2.label=""; l2.url=""; r8.comps=[l2];
      state.components=[r8];
      var p8 = buildPayload();
      assert(p8.components===null || p8.components.length===0, 'empty link button filtered');

      // 7. Round-trip: export -> apply -> export identical
      var r9 = newRow();
      var b9 = newButton(); b9.label="Hi"; b9.style=2; b9.customId="cid"; b9.emoji="<a:wave:999>";
      var s9 = newSelect(); s9.placeholder="Pick"; s9.min=1; s9.max=3; s9.options=[{label:"A",value:"a",description:"",emoji:""},{label:"B",value:"b",description:"",emoji:""}];
      r9.comps=[b9, s9];
      state.components=[r9];
      var orig = JSON.stringify(buildPayload().components);
      applyPayload(JSON.parse(JSON.stringify(buildPayload())));
      var rebuilt = JSON.stringify(buildPayload().components);
      assert(orig===rebuilt, 'roundtrip identical');
      state.embeds = [newEmbed()];
      state.components = [];

      suite('component export fixes');

      // ========== full regression ==========
      var em = state.embeds[0];
      em.title='Hello World'; em.description='Test **description**'; em.color='#ff0000';
      em.fields=[{name:'A',value:'1',inline:true},{name:'B',value:'2',inline:false}];
      em.footerText='Footer here'; em.thumb='https://example.com/t.png';
      em.image='https://example.com/i.png'; em.timestamp=true; em.authorName='Author Name';
      var row = newRow();
      var b = newButton(); b.label='Click'; b.style=3; b.emoji='<:pepe:123456>';
      var s = newSelect(); s.placeholder='Choose'; s.options=[{label:'Opt 1', value:'o1', description:'', emoji:''}];
      row.comps=[b,s];
      state.components=[row];
      state.content='Test content';
      var payload = buildPayload();
      assert(payload.embeds[0].color===0xff0000 && payload.embeds[0].title==='Hello World', 'embed basics');
      assert(payload.embeds[0].author.name==='Author Name', 'author');
      assert(payload.embeds[0].fields.length===2 && payload.embeds[0].fields[0].inline===true, 'fields');
      assert(payload.embeds[0].footer.text==='Footer here', 'footer');
      assert(payload.embeds[0].thumbnail.url==='https://example.com/t.png', 'thumb');
      assert(payload.embeds[0].image.url==='https://example.com/i.png' && !!payload.embeds[0].timestamp, 'image+ts');
      assert(payload.components[0].type===1, 'row type');
      assert(payload.components[0].components[0].type===2 && payload.components[0].components[0].style===3, 'button');
      assert(payload.components[0].components[0].emoji.name==='pepe' && payload.components[0].components[0].emoji.id==='123456', 'emoji');
      assert(payload.components[0].components[1].type===3 && payload.components[0].components[1].min_values===1, 'select');
      assert(payload.content==='Test content', 'content');
      suite('payload regression');

      // ========== import regression ==========
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
      var rowX=state.components[0];
      assert(rowX.comps[0].label==='B' && rowX.comps[0].customId==='cid' && rowX.comps[0].disabled===true && rowX.comps[0].emoji==='<:pepe:123>', 'button import');
      assert(rowX.comps[1].style===5 && rowX.comps[1].url==='https://l', 'link import');
      assert(applyPayload(null)===false && applyPayload('s')===false && applyPayload([1])===false, 'reject invalid');
      suite('import regression');

      // ========== focus preservation ==========
      // Typing must NOT rebuild the editor (that would drop focus). Counter spans
      // in the card may update text, but the input elements themselves must be
      // the same DOM nodes before/after typing.
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

      // ========== live counters ==========
      assert(typeof LIMITS==='object' && LIMITS.embedTitle===256, 'LIMITS exists');
      state.embeds = [newEmbed()]; state.components = []; state.content = '';
      var emC = state.embeds[0];
      emC.title='Counter Title'; emC.description='12345';
      renderAll();
      var tWrap = document.querySelector('input[data-f="title"]').parentElement;
      var tCnt = tWrap.querySelector('[data-cnt]');
      assert(tCnt && tCnt.textContent==='13/256', 'title counter shows len/limit, got "'+ (tCnt?tCnt.textContent:'none') +'"');
      var dWrap = document.querySelector('textarea[data-f="description"]').parentElement;
      var dCnt = dWrap.querySelector('[data-cnt]');
      assert(dCnt && dCnt.textContent==='5/4096', 'description counter, got "'+ (dCnt?dCnt.textContent:'none') +'"');
      var msgEl = document.getElementById('msgContent');
      msgEl.value='abc'; msgEl.oninput({target:msgEl});
      var expTotal = messageTotalChars() + '/6000';
      assert(document.getElementById('msgTotal').textContent===expTotal, 'message total counter, got "'+ document.getElementById('msgTotal').textContent +'" expected '+expTotal);
      var cCnt = msgEl.parentElement.querySelector('[data-cnt]');
      assert(cCnt.textContent==='3/2000', 'content field counter, got "'+ cCnt.textContent +'"');
      var fWrap = document.querySelector('input[data-fn]').parentElement;
      var fCnt = fWrap.querySelector('[data-cnt]');
      assert(fCnt && fCnt.textContent==='0/256', 'fresh field name counter, got "'+ (fCnt?fCnt.textContent:'none') +'"');
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

