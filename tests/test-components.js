const { loadApp } = require("./harness");
const { JSDOM } = require("C:/Users/eacam/AppData/Local/Temp/opencode/node_modules/jsdom");
const html = loadApp();

const testScript = `
  <script>
    (function(){
      var log = [];

      // Simulate user: click "+ Add Action Row"
      document.getElementById("btnAddRow").click();
      log.push("EXPORT fresh row (user added nothing): " + JSON.stringify(buildPayload().components));

      // User edits the button label
      var labelInput = document.querySelector('input[data-cf="label"]');
      labelInput.value = "My Real Button";
      labelInput.oninput({ target: labelInput });
      var styleSel = document.querySelector('select[data-cf="style"]');
      styleSel.value = "4";
      styleSel.oninput({ target: styleSel });
      log.push("EXPORT edited button: " + JSON.stringify(buildPayload().components));

      // Switch row type to select
      var typeSel = document.querySelector('select[data-rowtype]');
      typeSel.value = "select";
      typeSel.onchange({ target: typeSel });
      log.push("EXPORT select fresh (user typed nothing): " + JSON.stringify(buildPayload().components));

      // user adds option + edits placeholder
      var placeInp = document.querySelector('input[data-cf="placeholder"]');
      placeInp.value = "Pick one";
      placeInp.oninput({ target: placeInp });
      var addOpt = document.querySelector('[data-act="addopt"]');
      addOpt.click();
      log.push("options after addopt: " + JSON.stringify(state.components[0].comps[0].options));
      var onInputs = document.querySelectorAll('input[data-on]');
      onInputs[0].value = "First";
      onInputs[0].oninput({ target: onInputs[0] });
      var ovInputs = document.querySelectorAll('input[data-ov]');
      ovInputs[0].value = "1";
      ovInputs[0].oninput({ target: ovInputs[0] });
      log.push("EXPORT edited select: " + JSON.stringify(buildPayload().components));

      // Export button flow
      document.getElementById("btnExport").click();
      log.push("export button did not throw");

      console.log(log.join(String.fromCharCode(10)));
    })();
  </script>
`;

new JSDOM(html.replace("</body>", testScript + "</body>"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
});

