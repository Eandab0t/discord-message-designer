const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
  <script>
    (function(){
      var ok = true;
      function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
      function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

      // ========== registry has V2 types ==========
      assert(COMPONENT_TYPES['markdown'] && COMPONENT_TYPES['section'] && COMPONENT_TYPES['container'], 'V2 types registered');
      assert(COMPONENT_TYPES_BY_DISCORD_TYPE[9]==='markdown' && COMPONENT_TYPES_BY_DISCORD_TYPE[11]==='section' && COMPONENT_TYPES_BY_DISCORD_TYPE[12]==='container' && COMPONENT_TYPES_BY_DISCORD_TYPE[13]==='checkbox-group', 'discord type map v2');
      suite('registry v2');

      // ========== empty by default (never exported) ==========
      var row = newRow(); row.comps = [newSection(), newContainer(), newMarkdown(), newAccessoryImage(), newSelectVariant('select-user')];
      state.components = [row];
      var p = buildPayload();
      assert(p.components===null || p.components.length===0, 'empty V2 comps not exported');
      suite('empty V2 comps not exported');

      // ========== member selects ==========
      row.comps = [];
      var us = newSelectVariant('select-user'); us.placeholder = 'Pick a user';
      var ch = newSelectVariant('select-channel'); ch.placeholder = 'Pick a channel'; ch.channelTypes = '0,1,2';
      row.comps = [us, ch];
      var p2 = buildPayload();
      assert(p2.components[0].components[0].type===5 && p2.components[0].components[0].placeholder==='Pick a user', 'user select serializes as type 5');
      assert(p2.components[0].components[1].type===8 && JSON.stringify(p2.components[0].components[1].channel_types)==='[0,1,2]', 'channel select with channel_types');
      var u2 = newSelectVariant('select-user');
      assert(compHasContent(u2)===false && compHasContent(us)===true, 'member select content rule');
      suite('member selects');

      // ========== markdown + accessory image ==========
      row.comps = [];
      var md = newMarkdown(); md.content = '**bold** text';
      var img = newAccessoryImage(); img.src = 'https://x.com/i.png'; img.alt = 'hi';
      row.comps = [md, img];
      var p3 = buildPayload();
      assert(p3.components[0].components[0].type===9 && p3.components[0].components[0].content==='**bold** text', 'markdown serialize');
      assert(p3.components[0].components[1].type===10 && p3.components[0].components[1].src==='https://x.com/i.png' && p3.components[0].components[1].alt==='hi', 'accessory image serialize');
      suite('markdown + accessory image');

      // ========== checkbox / radio groups ==========
      row.comps = [];
      var cb = newCheckboxGroup(); cb.customId='cb1'; cb.min=0; cb.max=2; cb.options=[{label:'A',value:'a',description:'',emoji:''},{label:'B',value:'b',description:'',emoji:''}];
      var rb = newRadioGroup(); rb.customId='rb1'; rb.options=[{label:'X',value:'x',description:'',emoji:''}];
      row.comps = [cb, rb];
      var p4 = buildPayload();
      assert(p4.components[0].components[0].type===13 && p4.components[0].components[0].max_values===2 && p4.components[0].components[0].min_values===undefined, 'checkbox group serialize');
      assert(p4.components[0].components[1].type===14, 'radio group serialize');
      suite('checkbox/radio groups');

      // ========== section with children + accessory ==========
      var sec = newSection();
      var b1 = newButton(); b1.label='Go'; b1.style=3;
      var ms = newSelectVariant('select-mentionable'); ms.placeholder='Mention';
      sec.children = [b1, ms];
      var acc = newMarkdown(); acc.content = 'note';
      sec.accessory = acc;
      row.comps = [sec];
      var p5 = buildPayload();
      var s5 = p5.components[0].components[0];
      assert(s5.type===11 && s5.components.length===2 && s5.components[0].type===2 && s5.components[0].label==='Go', 'section children serialized');
      assert(s5.components[1].type===7, 'mentionable select nested type');
      assert(s5.accessory && s5.accessory.type===9 && s5.accessory.content==='note', 'section accessory serialized');
      suite('section children + accessory');

      // ========== container nesting ==========
      var cont = newContainer();
      var inner = newContainer();
      var innerB = newButton(); innerB.label='Deep';
      inner.children = [innerB];
      var outerB = newButton(); outerB.label='Outer';
      cont.children = [outerB, inner];
      row.comps = [cont];
      var p6 = buildPayload();
      var c6 = p6.components[0].components[0];
      assert(c6.type===12 && c6.components.length===2, 'container children serialized');
      assert(c6.components[1].type===12 && c6.components[1].components[0].label==='Deep', 'nested container recursed');
      suite('container nesting');

      // ========== round-trip via applyPayload ==========
      var secRt = newSection();
      var bb = newButton(); bb.label='Click'; bb.customId='cid1';
      var cbg = newCheckboxGroup(); cbg.customId='cb2'; cbg.options=[{label:'Opt',value:'o',description:'',emoji:''}];
      secRt.children = [bb, cbg];
      var mdRt = newMarkdown(); mdRt.content='hello **world**';
      secRt.accessory = mdRt;
      var contRt = newContainer();
      contRt.children = [newSelectVariant('select-role')];
      contRt.children[0].placeholder = 'Role';
      row.comps = [secRt, contRt];
      var orig = JSON.stringify(buildPayload().components);
      applyPayload(JSON.parse(JSON.stringify(buildPayload())));
      var rebuilt = JSON.stringify(buildPayload().components);
      assert(orig===rebuilt, 'V2 roundtrip identical, got: ' + rebuilt);
      var st = state.components[0].comps[0];
      assert(st.type==='section' && st.children.length===2 && st.accessory.type==='markdown', 'section deserialized shape');
      var ct2 = state.components[0].comps[1];
      assert(ct2.type==='container' && ct2.children[0].type==='select-role', 'container deserialized shape');
      suite('V2 roundtrip');

      // ========== previews render without throwing ==========
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
