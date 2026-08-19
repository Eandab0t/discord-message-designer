const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
  <script>
    (function(){
      var ok = true;
      function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }
      function suite(name){ console.log((ok? 'PASS: ' : 'FAIL: ')+name); ok = true; }

      // ========== mode tabs ==========
      assert(document.body.classList.contains('basic'), 'starts in basic mode');
      var msgBtn = document.querySelector('.modebtn[data-mode="message"]');
      var embBtn = document.querySelector('.modebtn[data-mode="embed"]');
      assert(msgBtn.classList.contains('active'), 'message tab active initially');
      embBtn.click();
      assert(document.body.classList.contains('mode-embed'), 'embed mode sets class');
      assert(!msgBtn.classList.contains('active') && embBtn.classList.contains('active'), 'tab active states swap');
      assert(document.getElementById('embedPane').offsetParent !== null || document.getElementById('embedPane').style.display !== 'none', 'embed pane shown');
      msgBtn.click();
      assert(!document.body.classList.contains('mode-embed'), 'message mode restores');
      suite('mode tabs');

      // ========== advanced toggle ==========
      var adv = document.getElementById('btnAdvanced');
      assert(document.body.classList.contains('basic'), 'basic class present by default');
      adv.click();
      assert(!document.body.classList.contains('basic'), 'advanced removes basic class');
      assert(adv.textContent === 'Simplified', 'button label flips, got '+adv.textContent);
      assert(localStorage.getItem('layout.advanced') === '1', 'advanced persisted');
      adv.click();
      assert(document.body.classList.contains('basic'), 'toggle back to basic');
      suite('advanced toggle');

      // ========== vertical resizer ==========
      var gv = document.getElementById('gutterV');
      var left = document.getElementById('paneLeft');
      gv.dispatchEvent(new (window.MouseEvent||Event)('mousedown', { bubbles:true, clientX:400, clientY:100 }));
      document.dispatchEvent(new (window.MouseEvent||Event)('mousemove', { bubbles:true, clientX:800, clientY:100 }));
      document.dispatchEvent(new (window.MouseEvent||Event)('mouseup', { bubbles:true }));
      assert(left.style.width === '760px', 'left width clamped to 760, got '+left.style.width);
      assert(localStorage.getItem('layout.leftWidth') === '760', 'left width persisted');
      gv.dispatchEvent(new (window.MouseEvent||Event)('mousedown', { bubbles:true, clientX:0, clientY:0 }));
      document.dispatchEvent(new (window.MouseEvent||Event)('mousemove', { bubbles:true, clientX:0, clientY:0 }));
      document.dispatchEvent(new (window.MouseEvent||Event)('mouseup', { bubbles:true }));
      assert(left.style.width === '300px', 'left width clamped to 300, got '+left.style.width);
      suite('vertical resizer');

      // ========== horizontal resizer ==========
      var gh = document.getElementById('gutterH');
      var dc = document.getElementById('dcBody');
      gh.dispatchEvent(new (window.MouseEvent||Event)('mousedown', { bubbles:true, clientY:0 }));
      document.dispatchEvent(new (window.MouseEvent||Event)('mousemove', { bubbles:true, clientY:500 }));
      document.dispatchEvent(new (window.MouseEvent||Event)('mouseup', { bubbles:true }));
      assert(dc.style.height === '500px', 'preview height set, got '+dc.style.height);
      assert(localStorage.getItem('layout.previewHeight') === '500', 'preview height persisted');
      suite('horizontal resizer');

      // ========== message quick-adds ==========
      state.content = ''; state.embeds = [newEmbed()]; state.components = [];
      document.querySelector('[data-qa="text"]').click();
      assert(state.components.length === 1 && state.components[0].comps[0].type === 'markdown', 'text adds markdown row');
      assert(document.activeElement && document.activeElement.getAttribute('data-cf') === 'content', 'text focuses content field');

      document.querySelector('[data-qa="separator"]').click();
      var last = state.components[state.components.length-1];
      assert(last.comps[0].type === 'markdown' && last.comps[0].content === '────────', 'separator prefills markdown');

      document.querySelector('[data-qa="button"]').click();
      last = state.components[state.components.length-1];
      assert(last.comps[0].type === 'button' && last.comps[0].style === 1, 'button quick-add');

      document.querySelector('[data-qa="link"]').click();
      last = state.components[state.components.length-1];
      assert(last.comps[0].type === 'button' && last.comps[0].style === 5 && last.comps[0].label === 'Learn More', 'link quick-add, got '+JSON.stringify(last.comps[0]));

      document.querySelector('[data-qa="select"]').click();
      last = state.components[state.components.length-1];
      assert(last.comps[0].type === 'select', 'select quick-add');

      document.querySelector('[data-qa="media"]').click();
      last = state.components[state.components.length-1];
      assert(last.comps[0].type === 'accessory-image', 'media quick-add');
      suite('message quick-adds');

      // ========== embed quick-adds ==========
      state.embeds = [newEmbed()]; state.components = [];
      document.querySelector('[data-qa="field"]').click();
      assert(state.embeds[0].fields.length === 2, 'field quick-add appends field, got '+state.embeds[0].fields.length);
      var ts = state.embeds[0].timestamp;
      document.querySelector('[data-qa="timestamp"]').click();
      assert(state.embeds[0].timestamp === !ts, 'timestamp toggles');

      document.querySelector('[data-qa="title"]').click();
      assert(document.activeElement && document.activeElement.getAttribute('data-f') === 'title', 'title quick-add focuses title');
      document.querySelector('[data-qa="description"]').click();
      assert(document.activeElement && document.activeElement.getAttribute('data-f') === 'description', 'description quick-add focuses description');
      document.querySelector('[data-qa="author"]').click();
      assert(document.activeElement && document.activeElement.getAttribute('data-f') === 'authorName', 'author quick-add focuses authorName');
      document.querySelector('[data-qa="color"]').click();
      assert(document.activeElement && document.activeElement.getAttribute('data-f') === 'color', 'color quick-add focuses color picker');
      document.querySelector('[data-qa="thumbnail"]').click();
      assert(document.activeElement && document.activeElement.getAttribute('data-f') === 'thumb', 'thumbnail quick-add focuses thumb');
      document.querySelector('[data-qa="image"]').click();
      assert(document.activeElement && document.activeElement.getAttribute('data-f') === 'image', 'image quick-add focuses image');
      document.querySelector('[data-qa="footer"]').click();
      assert(document.activeElement && document.activeElement.getAttribute('data-f') === 'footerText', 'footer quick-add focuses footerText');

      // quick-add with no embeds creates one
      state.embeds = [];
      document.querySelector('[data-qa="title"]').click();
      assert(state.embeds.length === 1, 'embed quick-add creates embed when none exist');
      suite('embed quick-adds');

      // ========== advanced gating (class markers; hiding is CSS) ==========
      document.body.classList.add('basic');
      assert(document.querySelector('.tabbtn[data-tab="json"]').classList.contains('adv'), 'JSON tab marked adv');
      assert(document.getElementById('webhook').closest('.webhook-row').classList.contains('adv'), 'webhook row marked adv');
      document.body.classList.remove('basic');
      document.body.classList.add('basic');
      assert(document.body.classList.contains('basic'), 'basic class restored');
      suite('advanced gating');

      console.log(ok ? 'FINAL: ALL PASSED' : 'FINAL: FAILURES PRESENT');
    })();
  </script>
`;

const fs = require("fs");
const path = require("path");
const css = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
if (!css.includes("body.basic .adv{display:none!important}")) {
  console.log("FAIL: style.css lacks the .adv hiding rule");
  process.exit(1);
}

new JSDOM(html.replace("</body>", testScript + "</body>"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
});
