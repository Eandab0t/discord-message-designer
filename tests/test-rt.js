const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();
const test = `
<script>
(function(){
  var r9 = newRow();
  var b9 = newButton(); b9.label='Hi'; b9.style=2; b9.customId='cid'; b9.emoji='<a:wave:999>';
  var s9 = newSelect(); s9.placeholder='Pick'; s9.min=1; s9.max=3; s9.options=[{label:'A',value:'a',description:'',emoji:''},{label:'B',value:'b',description:'',emoji:''}];
  r9.comps=[b9, s9];
  state.components=[r9];
  var before = buildPayload();
  console.log('BEFORE:', JSON.stringify(before, null, 1));
  var rt = applyPayload(JSON.parse(JSON.stringify(before)));
  console.log('rt:', rt);
  var after = buildPayload();
  console.log('AFTER: ', JSON.stringify(after, null, 1));
  console.log('equal:', JSON.stringify(before.components)===JSON.stringify(after.components));
})();
</script>
`;
new JSDOM(html.replace("</body>", test + "</body>"), { runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/" });

