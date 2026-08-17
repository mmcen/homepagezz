(function () {
  "use strict";

  var STORAGE_KEY = "glass-home-settings";

  var ENGINES = {
    google: { name: "Google", url: "https://www.google.com/search?q=" },
    bing: { name: "Bing", url: "https://www.bing.com/search?q=" },
    baidu: { name: "百度", url: "https://www.baidu.com/s?wd=" },
    github: { name: "GitHub", url: "https://github.com/search?q=" },
    duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" }
  };

  var DEFAULT_BOOKMARKS = [
    { id: "b1", name: "GitHub", url: "https://github.com", category: "开发" },
    { id: "b2", name: "掘金", url: "https://juejin.cn", category: "开发" },
    { id: "b3", name: "Vite", url: "https://vitejs.dev", category: "开发" },
    { id: "b4", name: "MDN", url: "https://developer.mozilla.org", category: "文档" },
    { id: "b5", name: "TypeScript", url: "https://www.typescriptlang.org", category: "文档" },
    { id: "b6", name: "哔哩哔哩", url: "https://www.bilibili.com", category: "娱乐" },
    { id: "b7", name: "YouTube", url: "https://www.youtube.com", category: "娱乐" },
    { id: "b8", name: "知乎", url: "https://www.zhihu.com", category: "资讯" },
    { id: "b9", name: "Gmail", url: "https://mail.google.com", category: "工具" },
    { id: "b10", name: "Notion", url: "https://www.notion.so", category: "工具" }
  ];

  var PALETTE = [
    ["#6d5df6", "#22d3ee"],
    ["#f43f5e", "#fb923c"],
    ["#10b981", "#22d3ee"],
    ["#8b5cf6", "#ec4899"],
    ["#f59e0b", "#f43f5e"],
    ["#0ea5e9", "#6366f1"],
    ["#14b8a6", "#84cc16"],
    ["#a855f7", "#f43f5e"]
  ];

  var state = {
    theme: "dark",
    engine: "google",
    category: "",
    bookmarks: DEFAULT_BOOKMARKS.slice()
  };

  var els = {};
  var toastTimer = null;
  var apiAvailable = false;
  var API_PATH = "/api/bookmarks";
  var SYNC_FLAG_KEY = "glass-home-synced";

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved.theme) state.theme = saved.theme;
      if (saved.engine && ENGINES[saved.engine]) state.engine = saved.engine;
      if (Array.isArray(saved.bookmarks)) state.bookmarks = saved.bookmarks;
    } catch (e) {
      state.bookmarks = DEFAULT_BOOKMARKS.slice();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function categoriesOf(bookmarks) {
    var seen = {};
    var list = [];
    bookmarks.forEach(function (bm) {
      var cat = bm.category && bm.category.trim() ? bm.category.trim() : "其他";
      if (!seen[cat]) {
        seen[cat] = 1;
        list.push(cat);
      }
    });
    return list;
  }

  function bookmarksInCategory(bookmarks, category) {
    if (!category) return bookmarks;
    return bookmarks.filter(function (bm) {
      var cat = bm.category && bm.category.trim() ? bm.category.trim() : "其他";
      return cat === category;
    });
  }

  function saveToApi() {
    if (!apiAvailable) return;
    fetch(API_PATH, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.bookmarks)
    }).catch(function () {});
  }

  function syncFromApi() {
    fetch(API_PATH, { method: "GET", headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (remote) {
        if (!Array.isArray(remote)) return;
        apiAvailable = true;
        var synced = localStorage.getItem(SYNC_FLAG_KEY) === "1";
        if (remote.length) {
          state.bookmarks = remote;
          localStorage.setItem(SYNC_FLAG_KEY, "1");
        } else if (!synced && state.bookmarks.length) {
          localStorage.setItem(SYNC_FLAG_KEY, "1");
          saveToApi();
        } else {
          state.bookmarks = [];
        }
        saveState();
        renderAll();
        toast("书签已从云端同步");
      });
  }

  function $id(id) {
    return document.getElementById(id);
  }

  function domReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function colorForIndex(i) {
    return PALETTE[i % PALETTE.length];
  }

  function domainOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return url;
    }
  }

  function initialOf(name) {
    var c = String(name).trim().charAt(0);
    return c ? c.toUpperCase() : "?";
  }

  function nowParts() {
    var d = new Date();
    return {
      time: pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()),
      dateFull: d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日",
      week: "星期" + "日一二三四五六".charAt(d.getDay()),
      iso: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
    };
  }

  function greetingText() {
    var h = new Date().getHours();
    if (h < 6) return "夜深了，注意休息";
    if (h < 12) return "早上好，欢迎回来";
    if (h < 14) return "中午好";
    if (h < 18) return "下午好";
    return "晚上好，欢迎回来";
  }

  function renderClock() {
    var p = nowParts();
    els.clockTime.textContent = p.time;
    els.clockDate.textContent = p.dateFull + " " + p.week;
    els.dateChip.textContent = p.iso;
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    if (els.themeSwitch) els.themeSwitch.checked = state.theme === "dark";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function bookmarkCard(bm, index) {
    var colors = colorForIndex(index);
    var el = document.createElement("a");
    el.className = "bookmark-card";
    el.href = bm.url;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.innerHTML =
      '<span class="bm-icon" style="background:linear-gradient(135deg,' + colors[0] + ',' + colors[1] + ')">' +
      escapeHtml(initialOf(bm.name)) +
      "</span>" +
      '<span class="bm-name" title="' + escapeHtml(bm.name) + '">' + escapeHtml(bm.name) + "</span>";

    if (document.body.classList.contains("managing")) {
      var btn = document.createElement("button");
      btn.className = "bm-remove";
      btn.textContent = "×";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        removeBookmark(bm.id);
      });
      el.appendChild(btn);
    }
    return el;
  }

  function renderBookmarks(container, bookmarks) {
    container.innerHTML = "";
    if (!bookmarks.length) {
      var hint = document.createElement("div");
      hint.className = "empty-hint";
      hint.textContent = "暂无书签，点击「设置」添加";
      container.appendChild(hint);
      return;
    }

    var groups = {};
    bookmarks.forEach(function (bm, index) {
      var cat = bm.category && bm.category.trim() ? bm.category.trim() : "其他";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ bm: bm, index: index });
    });

    Object.keys(groups).forEach(function (cat) {
      if (groups[cat].length > 1 || bookmarks.length > 6) {
        var title = document.createElement("div");
        title.className = "category-title";
        title.textContent = cat;
        container.appendChild(title);
      }
      groups[cat].forEach(function (item) {
        container.appendChild(bookmarkCard(item.bm, item.index));
      });
    });
  }

  function renderCategories() {
    els.categoryList.innerHTML = "";
    var cats = categoriesOf(state.bookmarks);

    function isActive(cat) {
      return state.category === cat;
    }

    function addItem(cat, count) {
      var colors = colorForIndex(cats.indexOf(cat) + 1);
      var isAll = cat === "全部";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-item" + (isActive(isAll ? "" : cat) ? " active" : "");
      btn.dataset.cat = cat;
      btn.innerHTML =
        '<span class="cat-dot" style="color:' + colors[0] + ';background:' + colors[0] + '"></span>' +
        '<span class="cat-name">' + escapeHtml(cat) + "</span>" +
        '<span class="cat-count">' + count + "</span>";
      btn.addEventListener("click", function () {
        state.category = isAll ? "" : cat;
        renderCategories();
        switchView("home");
        renderBookmarks(els.groupHome, bookmarksInCategory(state.bookmarks, state.category));
      });
      els.categoryList.appendChild(btn);
    }

    addItem("全部", state.bookmarks.length);
    cats.forEach(function (cat) {
      addItem(cat, bookmarksInCategory(state.bookmarks, cat).length);
    });
  }

  function switchView(name) {
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.dataset.view === name);
    });
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("active", v.id === "view-" + name);
    });
  }

  function renderEngineMenus() {
    els.engineLabel.textContent = ENGINES[state.engine].name;
    document.querySelectorAll("#engine-menu .engine-option").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.engine === state.engine);
    });

    els.settingsEngineGrid.innerHTML = "";
    Object.keys(ENGINES).forEach(function (key) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "engine-option" + (key === state.engine ? " active" : "");
      btn.dataset.engine = key;
      btn.textContent = ENGINES[key].name;
      btn.addEventListener("click", function () {
        state.engine = key;
        saveState();
        renderEngineMenus();
        toast("默认搜索引擎已切换为 " + ENGINES[key].name);
      });
      els.settingsEngineGrid.appendChild(btn);
    });
  }

  function renderManageList() {
    els.manageList.innerHTML = "";
    state.bookmarks.forEach(function (bm, index) {
      var colors = colorForIndex(index);
      var li = document.createElement("li");
      li.className = "bm-manage-item";
      li.innerHTML =
        '<span class="bm-icon" style="background:linear-gradient(135deg,' + colors[0] + ',' + colors[1] + ')">' +
        escapeHtml(initialOf(bm.name)) +
        "</span>" +
        '<div class="bm-info">' +
        '<div class="bm-name">' + escapeHtml(bm.name) + "</div>" +
        '<div class="bm-url">' + escapeHtml(domainOf(bm.url)) + "</div>" +
        "</div>" +
        '<div class="bm-actions">' +
        '<button class="icon-btn" data-act="edit" title="编辑">✎</button>' +
        '<button class="icon-btn" data-act="del" title="删除">×</button>' +
        "</div>";

      var editBtn = li.querySelector('[data-act="edit"]');
      var delBtn = li.querySelector('[data-act="del"]');
      editBtn.addEventListener("click", function () { openEditModal(bm); });
      delBtn.addEventListener("click", function () { removeBookmark(bm.id); });
      els.manageList.appendChild(li);
    });
  }

  function renderAll() {
    renderClock();
    applyTheme();
    renderEngineMenus();
    renderCategories();
    renderBookmarks(els.groupHome, bookmarksInCategory(state.bookmarks, state.category));
    renderBookmarks(els.groupAll, state.bookmarks);
    renderManageList();
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.hidden = true; }, 2200);
  }

  function openModal(modal) {
    modal.hidden = false;
  }

  function closeModal(modal) {
    modal.hidden = true;
  }

  function openEditModal(bm) {
    els.bmId.value = bm ? bm.id : "";
    els.bmName.value = bm ? bm.name : "";
    els.bmUrl.value = bm ? bm.url : "";
    els.bmCategory.value = bm && bm.category ? bm.category : "";
    els.editTitle.textContent = bm ? "编辑书签" : "添加书签";
    openModal(els.editModal);
    els.bmName.focus();
  }

  function closeEditModal() {
    closeModal(els.editModal);
  }

  function addBookmark(data) {
    state.bookmarks.push({ id: "b" + Date.now(), name: data.name, url: data.url, category: data.category || "" });
    saveState();
    saveToApi();
    renderAll();
    toast("书签已添加");
  }

  function updateBookmark(id, data) {
    var bm = state.bookmarks.find(function (b) { return b.id === id; });
    if (!bm) return;
    bm.name = data.name;
    bm.url = data.url;
    bm.category = data.category || "";
    saveState();
    saveToApi();
    renderAll();
    toast("书签已更新");
  }

  function removeBookmark(id) {
    state.bookmarks = state.bookmarks.filter(function (b) { return b.id !== id; });
    saveState();
    saveToApi();
    renderAll();
    toast("书签已删除");
  }

  function resetAll() {
    state.bookmarks = DEFAULT_BOOKMARKS.slice();
    state.engine = "google";
    state.category = "";
    saveState();
    saveToApi();
    renderAll();
    toast("已恢复默认设置");
  }

  function isUrlLike(input) {
    return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#].*)?$/i.test(input.trim());
  }

  function doSearch(query) {
    var q = query.trim();
    if (!q) return;
    if (isUrlLike(q)) {
      window.open(q.indexOf("://") === -1 ? "https://" + q : q, "_blank", "noopener");
      return;
    }
    window.open(ENGINES[state.engine].url + encodeURIComponent(q), "_blank", "noopener");
  }

  function bindEvents() {
    els.searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      doSearch(els.searchInput.value);
      els.searchInput.value = "";
    });

    els.engineSelect.addEventListener("click", function (e) {
      var opt = e.target.closest(".engine-option");
      if (opt) {
        state.engine = opt.dataset.engine;
        saveState();
        renderEngineMenus();
        els.engineSelect.classList.remove("open");
        return;
      }
      els.engineSelect.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".engine-select")) {
        els.engineSelect.classList.remove("open");
      }
      var backdrop = e.target.closest(".modal-backdrop");
      if (backdrop && e.target === backdrop) {
        closeModal(backdrop);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-backdrop").forEach(function (m) { m.hidden = true; });
        els.engineSelect.classList.remove("open");
      }
    });

    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var view = btn.dataset.view;
        if (!view) return;
        switchView(view);
      });
    });

    els.btnSettings.addEventListener("click", function () { openModal(els.settingsModal); });
    els.modalClose.addEventListener("click", function () { closeModal(els.settingsModal); });
    els.editClose.addEventListener("click", closeEditModal);
    els.editCancel.addEventListener("click", closeEditModal);

    els.btnAddBookmark.addEventListener("click", function () { openEditModal(null); });

    els.btnTheme.addEventListener("click", function () {
      state.theme = state.theme === "dark" ? "light" : "dark";
      saveState();
      applyTheme();
    });

    els.themeSwitch.addEventListener("change", function () {
      state.theme = els.themeSwitch.checked ? "dark" : "light";
      saveState();
      applyTheme();
    });

    els.btnReset.addEventListener("click", function () { resetAll(); });

    els.bookmarkForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {
        name: els.bmName.value.trim(),
        url: els.bmUrl.value.trim(),
        category: els.bmCategory.value.trim()
      };
      if (!data.name || !data.url) return;
      var id = els.bmId.value;
      if (id && state.bookmarks.some(function (b) { return b.id === id; })) {
        updateBookmark(id, data);
      } else {
        addBookmark(data);
      }
      closeEditModal();
    });

    els.btnManage.addEventListener("click", function () {
      document.body.classList.add("managing");
      renderAll();
      openModal(els.settingsModal);
      document.querySelector("#settings-modal .modal-body").scrollTop = 0;
      document.querySelector("#bookmark-manage-list").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function init() {
    els = {
      clockTime: $id("clock-time"),
      clockDate: $id("clock-date"),
      dateChip: $id("date-chip"),
      greeting: $id("greeting"),
      categoryList: $id("category-list"),
      engineSelect: $id("engine-select"),
      engineLabel: $id("engine-label"),
      searchForm: $id("search-form"),
      searchInput: $id("search-input"),
      groupHome: $id("bookmark-group-home"),
      groupAll: $id("bookmark-group-all"),
      btnSettings: $id("btn-settings"),
      btnTheme: $id("btn-theme"),
      btnManage: $id("btn-manage"),
      btnAddBookmark: $id("btn-add-bookmark"),
      btnReset: $id("btn-reset"),
      settingsModal: $id("settings-modal"),
      modalClose: $id("modal-close"),
      settingsEngineGrid: $id("settings-engine-grid"),
      manageList: $id("bookmark-manage-list"),
      editModal: $id("edit-modal"),
      editTitle: $id("edit-title"),
      editClose: $id("edit-close"),
      editCancel: $id("edit-cancel"),
      bookmarkForm: $id("bookmark-form"),
      bmId: $id("bm-id"),
      bmName: $id("bm-name"),
      bmUrl: $id("bm-url"),
      bmCategory: $id("bm-category"),
      themeSwitch: $id("theme-switch"),
      toast: $id("toast")
    };

    els.greeting.textContent = greetingText();
    loadState();
    bindEvents();
    renderAll();
    setInterval(renderClock, 1000);
    syncFromApi();
  }

  domReady(init);
})();
