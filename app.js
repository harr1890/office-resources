/* Renders content and powers the on-page "Edit page" panel.
   Non-technical users edit through the panel — no need to read this file. */

(function () {
  "use strict";

  var STORAGE_KEY = "officeResourcesData";
  var PASS_KEY = "officeResourcesPasscode";

  // ---- Data load / save --------------------------------------------

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Remove the old, unused starter calendar from browser data created by
  // earlier versions. The placeholder may have been moved into another section.
  function removeDefaultSchedule(savedData) {
    if (!savedData || !Array.isArray(savedData.sections)) return savedData;
    savedData.sections.forEach(function (section) {
      if (!section || !Array.isArray(section.items)) return;
      section.items = section.items.filter(function (item) {
        return item.url !== "#REPLACE-WITH-CALENDAR-EMBED-LINK";
      });
    });
    savedData.sections = savedData.sections.filter(function (section) {
      return section && (
        section.title !== "Schedule" ||
        (Array.isArray(section.items) && section.items.length > 0)
      );
    });
    return savedData;
  }

  // Working copy of the data. Comes from this browser's saved edits if
  // present, otherwise from the defaults in data.js.
  var data = loadData();

  function loadData() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return removeDefaultSchedule(JSON.parse(saved));
    } catch (e) {
      /* ignore corrupted storage */
    }
    if (typeof SITE !== "undefined") return deepClone(SITE);
    return { title: "Office Resources", subtitle: "", sections: [] };
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      alert("Could not save changes in this browser (storage may be full or blocked).");
    }
  }

  // ---- Passcode gate (light deterrent, not real security) ----------

  function getPasscode() {
    var override = null;
    try {
      override = localStorage.getItem(PASS_KEY);
    } catch (e) {
      /* ignore */
    }
    if (override != null) return override;
    if (typeof CONFIG !== "undefined" && CONFIG.editPasscode != null)
      return String(CONFIG.editPasscode);
    return "";
  }

  function setPasscode(v) {
    try {
      localStorage.setItem(PASS_KEY, v);
    } catch (e) {
      alert("Could not save the passcode in this browser.");
    }
  }

  // Returns true if the editor may open. Remembers success for the session.
  function passOk() {
    var code = getPasscode();
    if (!code) return true; // no passcode set -> open freely
    try {
      if (sessionStorage.getItem("editUnlocked") === "1") return true;
    } catch (e) {
      /* ignore */
    }
    var entry = prompt("Enter the edit passcode:");
    if (entry === null) return false; // cancelled
    if (entry === code) {
      try {
        sessionStorage.setItem("editUnlocked", "1");
      } catch (e) {
        /* ignore */
      }
      return true;
    }
    alert("Incorrect passcode.");
    return false;
  }

  function openEditor() {
    if (!passOk()) return;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("adminModal")).show();
  }

  function changePasscode() {
    var current = getPasscode();
    var next = prompt(
      "Set a new edit passcode (leave blank to remove the passcode):",
      current
    );
    if (next === null) return;
    setPasscode(next);
    try {
      sessionStorage.setItem("editUnlocked", "1");
    } catch (e) {
      /* ignore */
    }
    alert(
      next
        ? "Passcode updated on this computer. Use Export to publish it to a hosted site."
        : "Passcode removed on this computer."
    );
  }

  // ---- Small helpers -----------------------------------------------

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function youTubeId(url) {
    var m = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
    );
    return m ? m[1] : null;
  }
  function vimeoId(url) {
    var m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  }
  function isFileVideo(url) {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  }

  function colClass(item) {
    switch (item.size) {
      case "full":
        return "col-12";
      case "large":
        return "col-12 col-lg-6";
      default:
        return "col-12 col-sm-6 col-lg-4";
    }
  }

  // ---- Card renderers ----------------------------------------------

  function descHtml(item) {
    if (!item.description) return "";
    return '<p class="card-text">' + esc(item.description) + "</p>";
  }

  function renderLinkCard(item, label, icon) {
    var safeUrl = esc(item.url);
    return (
      '<a class="card-link-wrap" href="' + safeUrl + '" target="_blank" rel="noopener">' +
      '<div class="resource-card"><div class="card-body">' +
      '<div class="type-tag mb-1"><i class="bi ' + icon + '"></i> ' + label + "</div>" +
      '<h3 class="card-title">' + esc(item.title) + "</h3>" +
      descHtml(item) +
      '<span class="btn btn-primary btn-resource">' + label +
      ' <i class="bi bi-box-arrow-up-right"></i></span>' +
      "</div></div></a>"
    );
  }

  function renderImageCard(item) {
    return (
      '<div class="resource-card">' +
      '<img class="resource-thumb js-zoom" src="' + esc(item.url) +
      '" alt="' + esc(item.title) + '" loading="lazy" />' +
      '<div class="card-body"><h3 class="card-title">' + esc(item.title) + "</h3>" +
      descHtml(item) + "</div></div>"
    );
  }

  function renderVideoCard(item) {
    var inner;
    var yt = youTubeId(item.url);
    var vm = vimeoId(item.url);

    if (yt) {
      inner =
        '<div class="media-frame"><iframe src="https://www.youtube.com/embed/' + yt +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    } else if (vm) {
      inner =
        '<div class="media-frame"><iframe src="https://player.vimeo.com/video/' + vm +
        '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
    } else if (isFileVideo(item.url)) {
      inner =
        '<div class="media-frame"><video controls preload="metadata" src="' +
        esc(item.url) + '"></video></div>';
    } else {
      return renderLinkCard(item, "Open Video", "bi-play-circle");
    }

    return (
      '<div class="resource-card">' + inner +
      '<div class="card-body"><h3 class="card-title">' + esc(item.title) + "</h3>" +
      descHtml(item) + "</div></div>"
    );
  }

  function renderPdfCard(item) {
    var safeUrl = esc(item.url);
    return (
      '<div class="resource-card">' +
      '<div class="pdf-thumb" aria-hidden="true">' +
      '<i class="bi bi-file-earmark-pdf-fill"></i><span>PDF</span>' +
      "</div>" +
      '<div class="card-body">' +
      '<div class="type-tag mb-1"><i class="bi bi-file-earmark-pdf"></i> PDF</div>' +
      '<h3 class="card-title">' + esc(item.title) + "</h3>" +
      descHtml(item) +
      '<div class="d-flex flex-wrap gap-2">' +
      '<a class="btn btn-primary btn-resource" href="' + safeUrl +
      '">Open PDF <i class="bi bi-file-earmark-pdf"></i></a>' +
      '<a class="btn btn-outline-secondary btn-resource" href="' + safeUrl +
      '" target="_blank" rel="noopener">Open in new tab <i class="bi bi-box-arrow-up-right"></i></a>' +
      "</div>" +
      "</div></div>"
    );
  }

  function renderEmbedCard(item) {
    // Older saved items may still have this type. Keep them usable, but never
    // nest a page inside this page again.
    return renderLinkCard(item, "Open Page", "bi-box-arrow-up-right");
  }

  function renderItem(item) {
    switch ((item.type || "link").toLowerCase()) {
      case "form":
        return renderLinkCard(item, "Open Form", "bi-file-earmark-text");
      case "pdf":
        return renderPdfCard(item);
      case "image":
        return renderImageCard(item);
      case "video":
        return renderVideoCard(item);
      case "embed":
        return renderEmbedCard(item);
      default:
        return renderLinkCard(item, "Open Link", "bi-link-45deg");
    }
  }

  // ---- Render the public page --------------------------------------

  function render() {
    document.getElementById("site-title").textContent = data.title || "";
    document.getElementById("site-subtitle").textContent = data.subtitle || "";
    if (data.title) document.title = data.title;

    var content = document.getElementById("content");
    var anyItems = (data.sections || []).some(function (s) {
      return s.items && s.items.length;
    });

    if (!anyItems) {
      content.innerHTML =
        '<div class="text-center text-secondary py-5">' +
        "<p class=\"mb-2\">Nothing here yet.</p>" +
        '<button class="btn btn-primary js-open-editor">' +
        '<i class="bi bi-plus-lg"></i> Add your first item</button></div>';
      return;
    }

    var html = "";
    (data.sections || []).forEach(function (section) {
      if (!section.items || !section.items.length) return;
      html += '<h2 class="section-title">' + esc(section.title) + "</h2>";
      html += '<div class="row g-4">';
      section.items.forEach(function (item) {
        html += '<div class="' + colClass(item) + '">' + renderItem(item) + "</div>";
      });
      html += "</div>";
    });
    content.innerHTML = html;
    wireImageZoom();
  }

  function wireImageZoom() {
    var modalEl = document.getElementById("imageModal");
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    var modalImg = document.getElementById("imageModalImg");
    document.querySelectorAll(".js-zoom").forEach(function (img) {
      img.addEventListener("click", function () {
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modal.show();
      });
    });
  }

  // ==================================================================
  //  EDIT PANEL
  // ==================================================================

  var editing = null; // {si, ii} when editing an existing item, else null

  function $(id) {
    return document.getElementById(id);
  }

  function refreshSectionSelect() {
    var sel = $("f-section");
    var current = sel.value;
    sel.innerHTML = "";
    (data.sections || []).forEach(function (s, i) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = s.title;
      sel.appendChild(opt);
    });
    if (!data.sections || !data.sections.length) {
      var opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "(no sections yet — add one on the right)";
      sel.appendChild(opt);
    }
    if (current && sel.querySelector('option[value="' + current + '"]')) {
      sel.value = current;
    }
  }

  function renderAdminList() {
    var wrap = $("adminList");
    if (!data.sections || !data.sections.length) {
      wrap.innerHTML = '<p class="text-secondary">No items yet.</p>';
      return;
    }
    var html = "";
    data.sections.forEach(function (section, si) {
      html +=
        '<div class="admin-section border rounded-3 mb-3">' +
        '<div class="admin-section-head d-flex align-items-center gap-2 p-2">' +
        '<strong class="me-auto">' + esc(section.title) + "</strong>" +
        btn("sec-up", si, null, "bi-arrow-up", "Move section up") +
        btn("sec-down", si, null, "bi-arrow-down", "Move section down") +
        btn("sec-rename", si, null, "bi-pencil", "Rename section") +
        btn("sec-del", si, null, "bi-trash text-danger", "Delete section") +
        "</div>";

      if (section.items && section.items.length) {
        html += '<ul class="list-group list-group-flush">';
        section.items.forEach(function (item, ii) {
          html +=
            '<li class="list-group-item d-flex align-items-center gap-2">' +
            '<span class="type-tag badge bg-light text-secondary border">' +
            esc(item.type || "link") + "</span>" +
            '<span class="me-auto text-truncate">' + esc(item.title) + "</span>" +
            btn("it-up", si, ii, "bi-arrow-up", "Move up") +
            btn("it-down", si, ii, "bi-arrow-down", "Move down") +
            btn("it-edit", si, ii, "bi-pencil", "Edit") +
            btn("it-del", si, ii, "bi-trash text-danger", "Delete") +
            "</li>";
        });
        html += "</ul>";
      } else {
        html += '<div class="p-2 text-secondary small">No items in this section.</div>';
      }
      html += "</div>";
    });
    wrap.innerHTML = html;
  }

  function btn(action, si, ii, icon, title) {
    return (
      '<button type="button" class="btn btn-sm btn-light border" ' +
      'data-action="' + action + '" data-si="' + si + '"' +
      (ii == null ? "" : ' data-ii="' + ii + '"') +
      ' title="' + title + '" aria-label="' + title + '">' +
      '<i class="bi ' + icon + '"></i></button>'
    );
  }

  function refreshAdmin() {
    refreshSectionSelect();
    renderAdminList();
  }

  function resetForm() {
    editing = null;
    $("itemForm").reset();
    $("f-newsection").value = "";
    $("formHeading").textContent = "Add an item";
    $("f-submit").textContent = "Add item";
    $("f-cancel").classList.add("d-none");
    $("f-file-note").classList.add("d-none");
    updateUrlHint();
  }

  // When a file is picked: fill the URL with files/<name>, guess the type,
  // and remind the user to drop that file into the site's files folder.
  function onFileChosen() {
    var input = $("f-file");
    if (!input.files || !input.files[0]) return;
    var name = input.files[0].name;
    var safeName = name.replace(/\s+/g, "-");
    $("f-url").value = "files/" + safeName;

    var lower = name.toLowerCase();
    if (/\.pdf$/.test(lower)) $("f-type").value = "pdf";
    else if (/\.(png|jpe?g|gif|webp|svg|bmp)$/.test(lower)) $("f-type").value = "image";
    else if (/\.(mp4|webm|ogg|mov)$/.test(lower)) $("f-type").value = "video";
    updateUrlHint();

    if (!$("f-title").value.trim()) {
      $("f-title").value = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    }

    var note = $("f-file-note");
    note.innerHTML =
      '<i class="bi bi-info-circle"></i> Now copy <strong>' + esc(name) +
      "</strong> into the site's <code>files/</code> folder so it shows up.";
    note.classList.remove("d-none");
    input.value = "";
  }

  function updateUrlHint() {
    var type = $("f-type").value;
    var hints = {
      form: "Paste the form's web link. It opens in a new tab and won't auto-download.",
      link: "Paste any web address.",
      pdf: "A web PDF link, or use “Choose file” to point at a PDF in the site's files folder. Visitors can open it here or in a new tab — never auto-downloads.",
      image: "A web image URL, or use “Choose file” for an image in the site's files/images folder.",
      video: "A YouTube or Vimeo link, or a video file (e.g. files/clip.mp4).",
    };
    $("f-url-hint").textContent = hints[type] || "";
  }

  function ensureSection(name) {
    name = name.trim();
    for (var i = 0; i < data.sections.length; i++) {
      if (data.sections[i].title.toLowerCase() === name.toLowerCase()) return i;
    }
    data.sections.push({ title: name, items: [] });
    return data.sections.length - 1;
  }

  function onSubmit(e) {
    e.preventDefault();
    var newSec = $("f-newsection").value.trim();
    var si;
    if (newSec) {
      si = ensureSection(newSec);
    } else if ($("f-section").value !== "") {
      si = parseInt($("f-section").value, 10);
    } else {
      alert("Pick a section or type a new section name.");
      return;
    }

    var item = {
      type: $("f-type").value,
      title: $("f-title").value.trim(),
      description: $("f-desc").value.trim(),
      url: $("f-url").value.trim(),
      size: $("f-size").value,
    };
    if (!item.description) delete item.description;

    if (editing) {
      // Remove from old spot, then add to chosen section.
      var old = data.sections[editing.si].items.splice(editing.ii, 1)[0];
      // If section index shifted because we may have created one, recompute is unneeded
      data.sections[si].items.push(item);
      void old;
    } else {
      data.sections[si].items.push(item);
    }

    persist();
    render();
    refreshAdmin();
    resetForm();
  }

  function startEdit(si, ii) {
    var item = data.sections[si].items[ii];
    editing = { si: si, ii: ii };
    refreshSectionSelect();
    $("f-section").value = String(si);
    $("f-newsection").value = "";
    // Saving an older Embed item turns it into a standard link card.
    $("f-type").value = item.type === "embed" ? "link" : (item.type || "link");
    $("f-size").value = item.size || "normal";
    $("f-title").value = item.title || "";
    $("f-url").value = item.url || "";
    $("f-desc").value = item.description || "";
    $("formHeading").textContent = "Edit item";
    $("f-submit").textContent = "Update item";
    $("f-cancel").classList.remove("d-none");
    updateUrlHint();
    $("itemForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function move(arr, i, dir) {
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }

  function onListClick(e) {
    var b = e.target.closest("button[data-action]");
    if (!b) return;
    var action = b.dataset.action;
    var si = parseInt(b.dataset.si, 10);
    var ii = b.dataset.ii != null ? parseInt(b.dataset.ii, 10) : null;
    var sections = data.sections;

    switch (action) {
      case "sec-up":
        move(sections, si, -1);
        break;
      case "sec-down":
        move(sections, si, 1);
        break;
      case "sec-rename":
        var nn = prompt("Rename section:", sections[si].title);
        if (nn && nn.trim()) sections[si].title = nn.trim();
        break;
      case "sec-del":
        if (confirm('Delete the section "' + sections[si].title + '" and all its items?'))
          sections.splice(si, 1);
        break;
      case "it-up":
        move(sections[si].items, ii, -1);
        break;
      case "it-down":
        move(sections[si].items, ii, 1);
        break;
      case "it-edit":
        startEdit(si, ii);
        return; // don't re-render list yet (keeps form populated)
      case "it-del":
        if (confirm('Delete "' + sections[si].items[ii].title + '"?'))
          sections[si].items.splice(ii, 1);
        break;
      default:
        return;
    }
    persist();
    render();
    refreshAdmin();
  }

  // ---- Export / Import / Reset -------------------------------------

  function doExport() {
    var header =
      "/* Office Resources content. Generated by the Edit panel.\n" +
      "   Replace your site's data.js with this file to publish changes. */\n\n";
    var configBlock =
      "/* Passcode for the Edit panel (light deterrent, not strong security). */\n" +
      "const CONFIG = " +
      JSON.stringify({ editPasscode: getPasscode() }, null, 2) +
      ";\n\n";
    var body = configBlock + "const SITE = " + JSON.stringify(data, null, 2) + ";\n";
    var blob = new Blob([header + body], { type: "text/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  function parseSiteFile(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      /* not plain JSON, try the data.js form */
    }
    var m = text.match(/=\s*({[\s\S]*})\s*;?\s*$/);
    if (m) return JSON.parse(m[1]);
    throw new Error("Unrecognized file");
  }

  function doImport(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = parseSiteFile(String(reader.result));
        if (!parsed || !Array.isArray(parsed.sections))
          throw new Error("Missing sections");
        data = parsed;
        persist();
        render();
        refreshAdmin();
        resetForm();
        alert("Imported successfully.");
      } catch (err) {
        alert("Could not read that file. Use a data.js exported from this site.");
      }
    };
    reader.readAsText(file);
  }

  function doReset() {
    if (!confirm("Discard this computer's changes and go back to the default content?"))
      return;
    localStorage.removeItem(STORAGE_KEY);
    data = typeof SITE !== "undefined" ? deepClone(SITE) : { sections: [] };
    render();
    refreshAdmin();
    resetForm();
  }

  // ---- Wire it all up ----------------------------------------------

  function init() {
    render();
    refreshAdmin();
    updateUrlHint();

    // Any "open editor" button goes through the passcode gate.
    document.addEventListener("click", function (e) {
      if (e.target.closest(".js-open-editor")) {
        e.preventDefault();
        openEditor();
      }
    });
    $("btn-passcode").addEventListener("click", changePasscode);

    $("itemForm").addEventListener("submit", onSubmit);
    $("f-cancel").addEventListener("click", resetForm);
    $("f-type").addEventListener("change", updateUrlHint);
    $("f-choose").addEventListener("click", function () {
      $("f-file").click();
    });
    $("f-file").addEventListener("change", onFileChosen);
    $("adminList").addEventListener("click", onListClick);
    $("btn-export").addEventListener("click", doExport);
    $("btn-reset").addEventListener("click", doReset);
    $("btn-import").addEventListener("click", function () {
      $("import-file").click();
    });
    $("import-file").addEventListener("change", function () {
      if (this.files && this.files[0]) doImport(this.files[0]);
      this.value = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
