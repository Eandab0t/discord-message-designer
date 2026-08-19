const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
  <script>
    (function(){
      var ok = true;
      function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
      function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

      // ========== component registry ==========
      assert(COMPONENT_TYPES && COMPONENT_TYPES.button && COMPONENT_TYPES.select, 'registry has button+select');
      assert(COMPONENT_TYPES_BY_DISCORD_TYPE[2]==='button' && COMPONENT_TYPES_BY_DISCORD_TYPE[3]==='select', 'discord type map');
      var b = COMPONENT_TYPES.button.create();
      assert(b.type==='button' && b.label==='', 'registry create()');
      var s = COMPONENT_TYPES.select.create();
      assert(s.type==='select', 'registry create() select');
      suite('component registry');

      // ========== undo / redo ==========
      var baseCount = state.embeds.length;
      document.getElementById("btnAddEmbed").click();
      assert(state.embeds.length===baseCount+1, 'added embed');
      undo();
      assert(state.embeds.length===baseCount, 'undo removes embed');
      redo();
      assert(state.embeds.length===baseCount+1, 'redo re-adds embed');
      // typing coalesce: multiple keystrokes = one undo step
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

      // ========== validation ==========
      state.content = '';
      var em = state.embeds[0];
      em.hidden = false;
      em.title = 'x'.repeat(300);
      em.description = '';
      em.fields = [{name:'',value:'',inline:false}];
      var issues = validate();
      assert(issues.some(i=>i.kind==='error' && /title/i.test(i.msg)), 'title length flagged');
      em.title = 'ok';
      state.content = 'z'.repeat(2001);
      issues = validate();
      assert(issues.some(i=>i.kind==='error' && /content/i.test(i.msg)), 'content length flagged');
      state.content = '';
      em.fields = [];
      issues = validate();
      assert(!issues.some(i=>i.kind==='error' && /fields/i.test(i.msg)), 'no false field error');
      suite('validation');

      // ========== hidden embeds/rows excluded from payload + preview ==========
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
      var row = newRow(); row.hidden=true;
      var bb = newButton(); bb.label='X'; row.comps=[bb];
      state.components=[row];
      var p2 = buildPayload();
      assert(p2.components===null || p2.components.length===0, 'hidden row excluded from payload');
      // visible row with content exports
      row.hidden=false;
      var p3 = buildPayload();
      assert(p3.components.length===1 && p3.components[0].components.length===1, 'visible row exports');
      suite('hidden toggles');

      // ========== layers tree ==========
      renderLayers();
      var tree = document.getElementById('layerTree');
      assert(tree.querySelectorAll('.layer-item').length>=3, 'layers rendered (message+2 embeds+row+comp)');
      var embedLayer = tree.querySelector('.layer-item.selected') || null;
      // click an embed layer selects it
      var targets = tree.querySelectorAll('.layer-item');
      targets[1].onclick({target: targets[1]});
      assert(selected && selected.kind==='embed', 'clicking layer selects embed');
      // eye toggle on embed (handler is on the parent layer-item, target = eye)
      var eye = tree.querySelector('.layer-item .eye');
      if (eye) { var li = eye.closest('.layer-item'); li.onclick({target: eye}); }
      suite('layers tree');

      // ========== layers drag reorder ==========
      state.embeds = [newEmbed(), newEmbed()];
      state.embeds[0].title='First'; state.embeds[1].title='Second';
      renderLayers();
      var allItems = Array.prototype.slice.call(tree.querySelectorAll('.layer-item'));
      var embeds = allItems.filter(el => el.textContent.indexOf('▢') >= 0);
      assert(embeds.length===2, 'found 2 embed layer items');
      var dt = { _d:{}, setData(k,v){ this._d[k]=v; }, getData(k){ return this._d[k]; } };
      var evStart = new window.Event('dragstart', {bubbles:true, cancelable:true}); evStart.dataTransfer = dt;
      embeds[0].dispatchEvent(evStart);
      var evDrop = new window.Event('drop', {bubbles:true, cancelable:true}); evDrop.dataTransfer = dt;
      embeds[1].dispatchEvent(evDrop);
      assert(state.embeds[0].title==='Second' && state.embeds[1].title==='First', 'layers drag reorders embeds');
      suite('layers drag reorder');

      // ========== auto-fix removes empty items ==========
      state.embeds = [newEmbed(), newEmbed(), newEmbed()];
      state.embeds[0].title='Keep';
      state.components = [newRow()]; // empty button row
      autoFix();
      assert(state.embeds.length===1 && state.embeds[0].title==='Keep', 'autofix removed empty embeds');
      assert(state.components.length===0, 'autofix removed empty row');
      suite('auto-fix');

      // ========== keyboard: Delete removes selected ==========
      state.embeds = [newEmbed()];
      var k = newEmbed(); k.title='Sel'; state.embeds.push(k);
      selectTarget({kind:'embed', idx:1});
      var ev = new window.KeyboardEvent('keydown', {key:'Delete', cancelable:true, bubbles:true});
      document.dispatchEvent(ev);
      assert(state.embeds.length===1, 'delete removes selected embed');
      suite('keyboard delete');

      // ========== import roundtrip with hidden ==========
      applyPayload(JSON.parse(JSON.stringify(buildPayload())));
      assert(state.embeds.every(e=>e.hidden===false), 'import resets hidden');

      console.log(ok ? 'FINAL: ALL PASSED' : 'FINAL: FAILURES PRESENT');
    })();
  </script>
`;

new JSDOM(html.replace("</body>", testScript + "</body>"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
});

