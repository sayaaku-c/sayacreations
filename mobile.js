const MOBILE_BREAKPOINT = 900;

function isMobileView() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function closeAllWindowsExcept(activeId) {
  document.querySelectorAll(".window").forEach((win) => {
    if (win.id !== activeId) {
      win.style.display = "none";
      win.classList.remove("opening", "closing", "is-fullscreen");
    }
  });

  const overlay = document.getElementById("overlay");
  if (activeId) {
    overlay?.classList.add("active");
  } else {
    overlay?.classList.remove("active");
  }
}

function applyMobileWindowState(win) {
  if (!win) return;

  win.style.left = "";
  win.style.top = "";
  win.style.width = "";
  win.style.height = "";
}

function patchMobileOpenClose() {
  const originalOpenWindow = window.openWindow;
  const originalCloseWindow = window.closeWindow;

  window.openWindow = function (id) {
    if (!isMobileView()) {
      return originalOpenWindow(id);
    }

    closeAllWindowsExcept(id);

    const win = document.getElementById(id);
    if (!win) return;

    win.style.display = "block";
    applyMobileWindowState(win);

    const scroll = win.querySelector(".window-scroll");
    if (scrollState[id] !== undefined && scroll) {
      scroll.scrollTop = scrollState[id];
    }

    win.classList.add("opening");
    requestAnimationFrame(() => win.classList.remove("opening"));
  };

  window.closeWindow = function (id) {
    if (!isMobileView()) {
      return originalCloseWindow(id);
    }

    const win = document.getElementById(id);
    if (!win) return;

    const scroll = win.querySelector(".window-scroll");
    scrollState[id] = scroll ? scroll.scrollTop : 0;

    win.style.display = "none";

    const anyOpen = [...document.querySelectorAll(".window")].some(
      (w) => w.style.display === "block"
    );

    document.getElementById("overlay")?.classList.toggle("active", anyOpen);
  };
}

function disableMobileDesktopBehaviors() {
  if (!isMobileView()) return;

  document.querySelectorAll(".window").forEach((win) => {
    win.classList.remove("is-fullscreen");
    applyMobileWindowState(win);
  });
}

window.addEventListener("resize", disableMobileDesktopBehaviors);
window.addEventListener("load", () => {
  patchMobileOpenClose();
  disableMobileDesktopBehaviors();
});