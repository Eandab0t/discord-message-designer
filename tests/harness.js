const fs = require("fs");
const path = require("path");

/* Inlines every <script src="js/*.js"> from the HTML so tests can run under
   jsdom's runScripts:"dangerously" without a real server or resource loading. */
function loadApp(){
  const root = path.join(__dirname, "..");
  let html = fs.readFileSync(path.join(root, "embed-builder.html"), "utf8");
  html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (m, src) => {
    const code = fs.readFileSync(path.join(root, src), "utf8");
    return "<script>\n" + code + "\n</script>";
  });
  return html;
}

module.exports = { loadApp };
