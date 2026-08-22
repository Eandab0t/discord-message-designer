const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();
const test = `
<script>
(function(){
  var ok = true;
  function assert(c, m){ if(!c){ ok=false; console.log('FAIL:', m); } }

  var em = state.embeds[0];
  em.title = "Test Title"; em.description = "Test desc"; em.color = "#ff0000";
  em.fields = [{name:"A", value:"1", inline:true}];

  var b = newButton(); b.label = "Click"; b.style = 3; b.emoji = "<:pepe:123456>";
  var s = newStringSelect(); s.placeholder = "Pick an option"; s.options = [{label:"X", value:"x", description:"", emoji:""}];
  state.components = [b, s];
  state.content = "Hello **world**";

  renderPreview();
  var p = document.getElementById("preview");

  /* discord-chat wrapper present */
  assert(!!document.querySelector(".discord-chat"), "discord-chat wrapper");
  assert(!!document.querySelector(".dc-channel"), "channel header");
  assert(!!document.querySelector(".dm-avatar"), "avatar");
  assert(document.querySelector(".dm-username").textContent === "You", "username");
  assert(document.querySelector(".dm-bot").textContent === "BOT", "bot badge");
  assert(document.querySelector(".dm-time").textContent.indexOf("Today") === 0, "timestamp");
  assert(document.querySelector(".dm-content").textContent === "Hello world", "content rendered with markdown");

  /* embed preview */
  var e = document.querySelector(".embed");
  assert(!!e, "embed preview rendered");
  assert(e.style.borderLeftColor === "rgb(255, 0, 0)", "embed border color, got "+e.style.borderLeftColor);
  assert(e.querySelector(".e-title").textContent === "Test Title", "embed title");
  assert(e.querySelector(".e-field.inline"), "inline field class");

  /* button */
  var btn = document.querySelector(".actbtn.suc");
  assert(!!btn, "success button preview");
  assert(btn.innerHTML.indexOf("cdn.discordapp.com/emojis/123456.png") !== -1, "emoji img rendered");

  /* select */
  assert(!!document.querySelector(".select-fake"), "select preview");
  assert(document.querySelector(".select-fake").textContent === "Pick an option", "select placeholder");

  console.log(ok ? "PREVIEW RENDER PASSED" : "PREVIEW RENDER FAILED");
})();
</script>
`;
new JSDOM(html.replace("</body>", test + "</body>"), { runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/" });
