const MOBILE_BREAKPOINT = 900;

function isMobileView() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function updateMobileViewportOffset() {
  if (!isMobileView()) {
    document.documentElement.style.setProperty("--mobile-top-offset", "0px");
    return;
  }

  let offset = 0;

  if (window.visualViewport) {
    offset = Math.max(0, window.visualViewport.offsetTop);
  }

  document.documentElement.style.setProperty(
    "--mobile-top-offset",
    `${Math.round(offset)}px`,
  );
}

function disableMobileDragResize() {
  if (!isMobileView()) return;

  document.querySelectorAll(".window").forEach((win) => {
    win.classList.remove("is-fullscreen", "dragging");
    win.style.left = "";
    win.style.top = "";
    win.style.width = "";
    win.style.height = "";
  });

  if (typeof activeDrag !== "undefined") {
    activeDrag = null;
  }

  if (typeof activeFullscreenWindow !== "undefined") {
    activeFullscreenWindow = null;
  }
}

function fitAboutWindowMobile() {
  if (!isMobileView()) return;

  const about = document.getElementById("about");
  if (!about) return;

  const frame = about.querySelector(".about-mobile-frame");
  const scaleBox = about.querySelector(".about-mobile-scale");
  if (!frame || !scaleBox) return;

  const designWidth = 720;
  const designHeight = 640;

  const availableWidth = frame.clientWidth;
  const availableHeight = frame.clientHeight;

  if (!availableWidth || !availableHeight) return;

  const scaleX = availableWidth / designWidth;
  const scaleY = availableHeight / designHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  scaleBox.style.width = `${designWidth}px`;
  scaleBox.style.height = `${designHeight}px`;
  scaleBox.style.transform = `scale(${scale})`;
}

function watchAboutOpen() {
  const about = document.getElementById("about");
  if (!about) return;

  const observer = new MutationObserver(() => {
    if (isMobileView() && about.style.display === "block") {
      requestAnimationFrame(() => {
        fitAboutWindowMobile();
      });
    }
  });

  observer.observe(about, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });
}

function runMobileLayoutPass() {
  updateMobileViewportOffset();
  disableMobileDragResize();
  fitAboutWindowMobile();
}

window.addEventListener("load", () => {
  runMobileLayoutPass();
  watchAboutOpen();

  setTimeout(runMobileLayoutPass, 60);
  setTimeout(runMobileLayoutPass, 180);
  setTimeout(runMobileLayoutPass, 400);
});

window.addEventListener("resize", runMobileLayoutPass);
window.addEventListener("orientationchange", runMobileLayoutPass);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", runMobileLayoutPass);
  window.visualViewport.addEventListener("scroll", runMobileLayoutPass);
}

function closeWindow(id) {
  const win = document.getElementById(id);

  win.classList.remove("opening");

  // force reflow (good)
  win.offsetHeight;

  win.classList.add("closing");

  setTimeout(() => {
    win.classList.remove("closing");
    win.style.display = "none";
  }, 420);
}
