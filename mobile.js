const MOBILE_BREAKPOINT = 900;

function isMobileView() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
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

window.addEventListener("load", () => {
  disableMobileDragResize();
  fitAboutWindowMobile();
  watchAboutOpen();
});

window.addEventListener("resize", () => {
  disableMobileDragResize();
  fitAboutWindowMobile();
});