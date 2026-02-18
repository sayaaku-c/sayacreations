/* =====================================
   GLOBAL SETTINGS
===================================== */

document.addEventListener("dragstart", e => e.preventDefault());

let highestZ = 10;
const windowState = {};
const scrollState = {};
let activeDrag = null;
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;

/* =====================================
   WINDOW OPEN / CLOSE
===================================== */

function bringToFront(win) {
  highestZ++;
  win.style.zIndex = highestZ;
}

window.openModal = id => openWindow(id);

window.openWindow = function (id) {
  const win = document.getElementById(id);
  const overlay = document.getElementById("overlay");
  if (!win) return;

  overlay.classList.add("active");
  win.style.display = "block";

  const width = win.offsetWidth;
  const height = win.offsetHeight;

  if (!windowState[id]) {
    win.style.left = (window.innerWidth - width) / 2 + "px";
    win.style.top = (window.innerHeight - height) / 2 + "px";
  } else {
    win.style.left = windowState[id].left;
    win.style.top = windowState[id].top;
  }

  if (scrollState[id] !== undefined) {
    win.scrollTop = scrollState[id];
  }

  bringToFront(win);

  win.classList.add("opening");
  requestAnimationFrame(() => win.classList.remove("opening"));
};

window.closeWindow = function (id) {
  const win = document.getElementById(id);
  const overlay = document.getElementById("overlay");
  if (!win) return;

  scrollState[id] = win.scrollTop;
  windowState[id] = {
    left: win.style.left,
    top: win.style.top
  };

  win.classList.add("closing");

  setTimeout(() => {
    win.style.display = "none";
    win.classList.remove("closing");

    const anyOpen = [...document.querySelectorAll(".window")]
      .some(w => w.style.display === "block");

    if (!anyOpen) overlay.classList.remove("active");
  }, 200);
};

/* =====================================
   DRAGGING
===================================== */

function initDragging(win) {
  const bar = win.querySelector(".window-bar");
  if (!bar) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  bar.addEventListener("mousedown", e => {
    isDragging = true;
    bringToFront(win);

    const rect = win.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    currentX = win.offsetLeft;
    currentY = win.offsetTop;
    targetX = currentX;
    targetY = currentY;
    activeDrag = win;

    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;

    const padding = 8;
    targetX = Math.max(
      padding,
      Math.min(window.innerWidth - win.offsetWidth - padding, e.clientX - offsetX)
    );

    targetY = Math.max(
      padding,
      Math.min(window.innerHeight - 60, e.clientY - offsetY)
    );
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    activeDrag = null;
    document.body.style.userSelect = "";
  });
}

/* =====================================
   RESIZING
===================================== */

function initResizing(win) {
  if (win.querySelector(".resize-handle")) return;

  win.insertAdjacentHTML("beforeend", `
    <div class="resize-handle right"></div>
    <div class="resize-handle bottom"></div>
    <div class="resize-handle corner"></div>
  `);

  const right = win.querySelector(".right");
  const bottom = win.querySelector(".bottom");
  const corner = win.querySelector(".corner");

  let resizing = false;
  let mode = null;
  let startX, startY, startW, startH;

  function startResize(e, type) {
    e.stopPropagation();
    resizing = true;
    mode = type;

    startX = e.clientX;
    startY = e.clientY;
    startW = win.offsetWidth;
    startH = win.offsetHeight;

    bringToFront(win);
    document.body.style.userSelect = "none";
  }

  right?.addEventListener("mousedown", e => startResize(e, "right"));
  bottom?.addEventListener("mousedown", e => startResize(e, "bottom"));
  corner?.addEventListener("mousedown", e => startResize(e, "corner"));

  document.addEventListener("mousemove", e => {
    if (!resizing) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (mode === "right" || mode === "corner") {
      win.style.width = Math.max(320, startW + dx) + "px";
    }

    if (mode === "bottom" || mode === "corner") {
      win.style.height = Math.max(220, startH + dy) + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    resizing = false;
    mode = null;
    document.body.style.userSelect = "";
  });
}

/* =====================================
   DRAG LOOP (SMOOTHING)
===================================== */

function dragLoop() {
  if (activeDrag) {
    currentX += (targetX - currentX) * 0.32;
    currentY += (targetY - currentY) * 0.32;
    activeDrag.style.left = currentX + "px";
    activeDrag.style.top = currentY + "px";
  }
  requestAnimationFrame(dragLoop);
}
dragLoop();

/* =====================================
   TABS
===================================== */

function switchTab(windowId, tabName, clickedBtn) {
  const windowEl = document.getElementById(windowId);
  if (!windowEl) return;

  windowEl.querySelectorAll(".browser-tab")
    .forEach(btn => btn.classList.remove("active"));

  clickedBtn.classList.add("active");

  windowEl.querySelectorAll(".tab-content")
    .forEach(content => content.classList.remove("active"));

  const target = windowEl.querySelector(`[data-tab="${tabName}"]`);
  if (target) target.classList.add("active");
}

/* =====================================
   THEME
===================================== */

function toggleTheme() {
  const body = document.body;
  const toggle = document.querySelector(".theme-toggle");

  body.classList.toggle("dark");
  body.classList.toggle("light");

  toggle.textContent = body.classList.contains("dark") ? "Light" : "Dark";
}

/* =====================================
   INIT
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".window").forEach(win => {
    initDragging(win);
    initResizing(win);
  });
});
