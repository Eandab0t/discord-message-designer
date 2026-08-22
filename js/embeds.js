"use strict";
/* ================= embeds render ================= */
function renderEmbeds(){
  const list = $("embedList");
  list.innerHTML = "";
  state.embeds.forEach((em, i) => {
    const div = document.createElement("div");
    div.className = "embed-item" + (em.hidden ? " row-hidden" : "");
    div.dataset.eidx = i;
    div.innerHTML = `
      <div class="head" data-selembed>
        <span class="grab" title="Drag to reorder">&#x2801;&#x2801;</span>
        <strong>Embed ${i+1}</strong>
        <span class="spacer" style="flex:1"></span>
        <button class="btn sm ghost" data-act="eyetoggle" title="Show/Hide">${em.hidden ? "&#x25CC;" : "&#x25CF;"}</button>
        <button class="btn sm ghost" data-act="dup">Duplicate</button>
        <button class="btn sm danger" data-act="del">Delete</button>
      </div>
      <div class="body">
        <label>Title</label>
        <div class="cnt-wrap">
          <input type="text" data-f="title" data-limit="${LIMITS.embedTitle}" value="${escAttr(em.title)}" placeholder="Embed title" />
          <span data-cnt></span>
        </div>
        <input type="text" data-f="url" value="${escAttr(em.url)}" placeholder="Title link URL" style="margin-top:6px" />
        <label>Description</label>
        <div class="cnt-wrap">
          <textarea data-f="description" data-limit="${LIMITS.embedDescription}" placeholder="Embed description">${esc(em.description)}</textarea>
          <span data-cnt></span>
        </div>
        <label>Color</label>
        <div class="color-wrap">
          <input type="color" data-f="color" value="${escAttr(em.color)}" />
          <input type="text" data-f="colorText" value="${escAttr(em.color)}" placeholder="#5865f2" />
        </div>
        <div class="col-section" data-collapse="author-${i}">
          <div class="col-header" data-collapse-btn="author-${i}">
            <span>Author</span>
            <span class="col-arrow">\u25BE</span>
          </div>
          <div class="col-body"></div>
        </div>
        <label>Fields</label>
        <div data-fields></div>
        <button class="btn sm" data-act="addfield">+ Add Field</button>
        <div class="col-section" data-collapse="images-${i}">
          <div class="col-header" data-collapse-btn="images-${i}">
            <span>Thumbnail &amp; Image</span>
            <span class="col-arrow">\u25BE</span>
          </div>
          <div class="col-body"></div>
        </div>
        <div class="col-section" data-collapse="footer-${i}">
          <div class="col-header" data-collapse-btn="footer-${i}">
            <span>Footer &amp; Timestamp</span>
            <span class="col-arrow">\u25BE</span>
          </div>
          <div class="col-body"></div>
        </div>
      </div>`;
    list.appendChild(div);

    div.querySelectorAll("[data-selembed]").forEach(h => {
      h.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        selectTarget({ kind:"embed", idx: i });
      });
    });
    div.querySelector('[data-act="eyetoggle"]').onclick = () => { beforeEdit("embeye"+i); em.hidden = !em.hidden; renderAll(); };

    const fieldsBox = div.querySelector("[data-fields]");
    em.fields.forEach((f, fi) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.innerHTML = `
        <div class="cnt-wrap">
          <input type="text" placeholder="Field name" data-fn="${fi}" data-limit="${LIMITS.fieldName}" value="${escAttr(f.name)}" />
          <span data-cnt></span>
        </div>
        <div class="cnt-wrap">
          <input type="text" placeholder="Field value" data-fv="${fi}" data-limit="${LIMITS.fieldValue}" value="${escAttr(f.value)}" />
          <span data-cnt></span>
        </div>
        <div class="inline-check" title="Inline">
          <input type="checkbox" data-fil="${fi}" ${f.inline?"checked":""} />
        </div>`;
      fieldsBox.appendChild(row);
    });

  div.querySelectorAll("input[data-fn]").forEach(inp => inp.oninput = (e) => { beforeEdit("fn"+e.target.dataset.fn); em.fields[+e.target.dataset.fn].name = e.target.value; renderPreview(); renderJson(); renderValidation(); commitHistory("fn"+e.target.dataset.fn); });
  div.querySelectorAll("input[data-fv]").forEach(inp => inp.oninput = (e) => { beforeEdit("fv"+e.target.dataset.fv); em.fields[+e.target.dataset.fv].value = e.target.value; renderPreview(); renderJson(); renderValidation(); commitHistory("fv"+e.target.dataset.fv); });
  div.querySelectorAll("input[data-fil]").forEach(inp => inp.onchange = (e) => { beforeEdit("fil"+e.target.dataset.fil); em.fields[+e.target.dataset.fil].inline = e.target.checked; renderPreview(); renderJson(); renderValidation(); commitHistory("fil"+e.target.dataset.fil); });

    div.querySelector('[data-act="addfield"]').onclick = () => { beforeEdit(); em.fields.push({name:"",value:"",inline:false}); renderAll(); };
    div.querySelector('[data-act="del"]').onclick = () => { beforeEdit(); state.embeds.splice(i,1); cleanupFiles(i); selected=null; renderAll(); };
    div.querySelector('[data-act="dup"]').onclick = () => {
      beforeEdit();
      const copy = JSON.parse(JSON.stringify(em)); copy.id = "e" + (embedSeq++);
      state.embeds.splice(i+1, 0, copy);
      renderAll();
    };

    /* populate collapsible sections */
    const authorCol = div.querySelector(`[data-collapse="author-${i}"] .col-body`);
    if (authorCol) authorCol.innerHTML = `
      <div class="cnt-wrap">
        <input type="text" data-f="authorName" data-limit="${LIMITS.authorName}" value="${escAttr(em.authorName)}" placeholder="Author name" />
        <span data-cnt></span>
      </div>
      <div class="row2" style="margin-top:6px">
        <input type="text" data-f="authorUrl" value="${escAttr(em.authorUrl)}" placeholder="Author URL" />
        <input type="text" data-f="authorIcon" value="${escAttr(em.authorIcon)}" placeholder="Author icon URL" />
      </div>`;
    const imagesCol = div.querySelector(`[data-collapse="images-${i}"] .col-body`);
    if (imagesCol) imagesCol.innerHTML = `
      <label>Thumbnail</label>
      <div class="img-upload">
        <img class="thumb" src="${escAttr(thumbSrc(em))}" />
        <div style="flex:1">
          <input type="text" data-f="thumb" value="${escAttr(thumbUrlText(em))}" placeholder="Thumbnail URL" />
          <input type="file" data-file="thumb" accept="image/*" style="margin-top:4px;font-size:12px" />
        </div>
      </div>
      <label>Image</label>
      <div class="img-upload">
        <img class="thumb" src="${escAttr(imageSrc(em))}" />
        <div style="flex:1">
          <input type="text" data-f="image" value="${escAttr(imageUrlText(em))}" placeholder="Image URL" />
          <input type="file" data-file="image" accept="image/*" style="margin-top:4px;font-size:12px" />
        </div>
      </div>`;
    const footerCol = div.querySelector(`[data-collapse="footer-${i}"] .col-body`);
    if (footerCol) footerCol.innerHTML = `
      <label>Footer</label>
      <div class="cnt-wrap">
        <input type="text" data-f="footerText" data-limit="${LIMITS.footerText}" value="${escAttr(em.footerText)}" placeholder="Footer text" />
        <span data-cnt></span>
      </div>
      <input type="text" data-f="footerIcon" value="${escAttr(em.footerIcon)}" placeholder="Footer icon URL" style="margin-top:6px" />
      <div class="inline-check" style="margin-top:8px;justify-content:flex-start">
        <input type="checkbox" data-f="timestamp" ${em.timestamp?"checked":""} /> Show timestamp
      </div>`;

    /* collapse toggles */
    div.querySelectorAll("[data-collapse-btn]").forEach(btn => {
      btn.addEventListener("click", () => {
        const section = btn.closest(".col-section");
        if (section) section.classList.toggle("collapsed");
      });
    });

    /* data-f bindings (must be AFTER collapsible section population) */
    div.querySelectorAll("[data-f]").forEach(inp => {
      inp.oninput = () => {
        beforeEdit("em"+i+"-"+inp.dataset.f);
        const f = inp.dataset.f;
        if (f === "timestamp") { em.timestamp = inp.checked; }
        else em[f] = inp.value;
        if (f === "color") { const t = div.querySelector('[data-f="colorText"]'); if (t && t.value !== inp.value) t.value = inp.value; }
        if (f === "colorText") { const c = div.querySelector('[data-f="color"]'); if (c && c.value !== inp.value) c.value = inp.value; }
        renderPreview(); renderJson(); saveDraft(); renderValidation();
        commitHistory("em"+i+"-"+f);
      };
    });

    div.querySelectorAll("input[data-file]").forEach(inp => {
      inp.onchange = () => {
        const file = inp.files && inp.files[0];
        if (!file) return;
        beforeEdit("file"+i+"-"+inp.dataset.file);
        const usage = inp.dataset.file;
        const attName = "embed" + (i+1) + "-" + usage + "-" + (nextFileId++) + "." + (file.name.split(".").pop() || "png");
        state.files = state.files.filter(f => !(f.embedIndex === i && f.usage === usage));
        state.files.push({ name: attName, file, usage, embedIndex: i });
        em[usage] = "attachment://" + attName;
        renderAll();
        saveDraft();
      };
    });
    div.draggable = true;
    div.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", String(i)); div.style.opacity = ".5"; });
    div.addEventListener("dragend", () => div.style.opacity = "1");
    div.addEventListener("dragover", (e) => e.preventDefault());
    div.addEventListener("drop", (e) => {
      e.preventDefault();
      const from = +e.dataTransfer.getData("text/plain");
      if (isNaN(from) || from === i) return;
      beforeEdit();
      moveEmbed(from, i);
      renderAll();
    });
  });
}

function cleanupFiles(embedIndex){
  state.files = state.files.filter(f => f.embedIndex !== embedIndex);
}

function moveEmbed(from, to){
  if (from === to) return;
  const [m] = state.embeds.splice(from, 1);
  state.embeds.splice(to, 0, m);
  state.files.forEach(f => {
    if (f.embedIndex === from) f.embedIndex = to;
    else if (from < to && f.embedIndex > from && f.embedIndex <= to) f.embedIndex--;
    else if (from > to && f.embedIndex >= to && f.embedIndex < from) f.embedIndex++;
  });
}

function thumbSrc(em){ return em.thumb ? em.thumb : ""; }
function imageSrc(em){ return em.image ? em.image : ""; }
function thumbUrlText(em){ return em.thumb ? em.thumb : ""; }
function imageUrlText(em){ return em.image ? em.image : ""; }
