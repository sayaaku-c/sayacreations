/* =====================================
   GLOBAL SETTINGS
===================================== */

document.addEventListener("dragstart", (e) => e.preventDefault());

let highestZ = 2000;
const windowState = {};
const scrollState = {};
const fullscreenState = {};
let activeFullscreenWindow = null;

let activeDrag = null;
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;

function triggerEdgeShake(win) {
  if (win.classList.contains("edge-shake")) return;

  win.classList.add("edge-shake");

  setTimeout(() => {
    win.classList.remove("edge-shake");
  }, 220);
}

/* =====================================
   INTRO SYSTEM
===================================== */

function runIntro() {
  document.body.classList.remove("intro-active");
  document.body.classList.add("intro-show");
}

window.addEventListener("load", () => {
  setTimeout(() => {
    runIntro();
  }, 650);
});

/* =====================================
   SOUND SYSTEM
===================================== */

const sounds = {
  tap: new Howl({
    src: ["sounds/tap.mp3"],
    volume: 0.4,
  }),

  open: new Howl({
    src: ["sounds/open.mp3"],
    volume: 0.4,
  }),

  close: new Howl({
    src: ["sounds/close.mp3"],
    volume: 0.35,
  }),

  light: new Howl({
    src: ["sounds/light.mp3"],
    volume: 0.45,
  }),

  dark: new Howl({
    src: ["sounds/dark.mp3"],
    volume: 0.45,
  }),

  sticky: new Howl({
    src: ["sounds/sticky.mp3"],
    volume: 0.45,
  }),

  copy: new Howl({
    src: ["sounds/copy.mp3"],
    volume: 0.5,
  }),

  fullscreenOn: new Howl({
    src: ["sounds/fullscreen-on.mp3"],
    volume: 0.4,
  }),

  fullscreenOff: new Howl({
    src: ["sounds/fullscreen-off.mp3"],
    volume: 0.45,
  }),

  intro: new Howl({
    src: ["sounds/intro.mp3"],
    volume: 0.35,
  }),
};

let soundUnlocked = false;

function unlockSound() {
  if (soundUnlocked) return;

  Howler.ctx.resume();
  soundUnlocked = true;
}

let introPlayed = false;

function playIntroSound() {
  if (introPlayed) return;
  introPlayed = true;

  sounds.intro.volume(0);
  sounds.intro.play();

  setTimeout(() => {
    sounds.intro.volume(0.35);
  }, 40);
}

["click", "mousemove", "touchstart"].forEach((event) => {
  document.addEventListener(
    event,
    () => {
      unlockSound();
      playIntroSound();
    },
    { once: true },
  );
});

document.querySelectorAll(".bar-tab, .theme-toggle").forEach((el) => {
  el.addEventListener("click", () => {
    playSound(sounds.tap);
  });
});

function playSound(sound) {
  if (!soundUnlocked) return;

  if (sound.playing()) {
    sound.stop();
  }

  sound.play();
}


/* =====================================
   SPACE KEY STATE
===================================== */

let spaceHeld = false;

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    spaceHeld = true;
    console.log("SPACE ON");
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    spaceHeld = false;
    console.log("SPACE OFF");
  }
});

window.addEventListener("blur", () => {
  spaceHeld = false;
});

/* =====================================
   WINDOW OPEN / CLOSE
===================================== */

function bringToFront(win) {
  highestZ++;
  win.style.zIndex = highestZ;
}

window.openWindow = function (id) {
  if (activeFullscreenWindow && id !== activeFullscreenWindow) return;

  const win = document.getElementById(id);
  const overlay = document.getElementById("overlay");
  if (!win) return;

  const alreadyOpen = win.style.display === "block";

  overlay.classList.add("active");
  win.style.display = "block";

  playSound(sounds.open);

  if (!alreadyOpen) {
    const width = win.offsetWidth;
    const height = win.offsetHeight;

    if (!windowState[id]) {
      win.style.left = (window.innerWidth - width) / 2 + "px";
      win.style.top = (window.innerHeight - height) / 2 + "px";
    } else {
      win.style.left = windowState[id].left;
      win.style.top = windowState[id].top;
    }
  }

  const scroll = win.querySelector(".window-scroll");
  if (scrollState[id] !== undefined && scroll) {
    scroll.scrollTop = scrollState[id];
  }

  bringToFront(win);

  if (id === "projects" && !projectsWindow.hasAttribute("data-active-tab")) {
    projectsWindow.setAttribute("data-active-tab", "overview");

    const defaultBtn = document.querySelector(
      '#projects .bar-tab[data-tab="overview"]',
    );
    if (defaultBtn) {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      defaultBtn.classList.add("active");
    }
  }

  if (window.innerWidth <= 900) {
    win.classList.remove("opening");
    void win.offsetWidth;
    win.classList.add("opening");

    const handleOpenAnimationEnd = () => {
      win.classList.remove("opening");
      win.removeEventListener("animationend", handleOpenAnimationEnd);
    };

    win.addEventListener("animationend", handleOpenAnimationEnd);
  } else {
    win.classList.add("opening");
    requestAnimationFrame(() => win.classList.remove("opening"));
  }
};

window.openModal = openWindow;

window.closeWindow = function (id) {
  const fullscreenWin = document.getElementById(id);
  if (fullscreenWin?.classList.contains("is-fullscreen")) {
    toggleWindowFullscreen(id);
    return;
  }

  playSound(sounds.close);

  const win = document.getElementById(id);
  const overlay = document.getElementById("overlay");
  if (!win) return;

  const scroll = win.querySelector(".window-scroll");
  scrollState[id] = scroll ? scroll.scrollTop : 0;
  windowState[id] = {
    left: win.style.left,
    top: win.style.top,
  };

  win.classList.add("closing");

  setTimeout(() => {
    win.style.display = "none";
    win.classList.remove("closing");

    const anyOpen = [...document.querySelectorAll(".window")].some(
      (w) => w.style.display === "block",
    );

    if (!anyOpen) overlay.classList.remove("active");
  }, 280);
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

  bar.addEventListener("mousedown", (e) => {
    if (e.target.closest(".bar-tab")) return;
    if (win.classList.contains("is-fullscreen")) return;
    if (activeFullscreenWindow && activeFullscreenWindow !== win.id) return;

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

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const padding = 8;
    const attemptedX = e.clientX - offsetX;
    const maxX = window.innerWidth - win.offsetWidth - padding;

    targetX = Math.max(padding, Math.min(maxX, attemptedX));

    if (attemptedX <= padding || attemptedX >= maxX) {
      triggerEdgeShake(win);
    }

    if (win.id === "projects") {
      targetY = Math.max(20, e.clientY - offsetY);
    } else {
      targetY = e.clientY - offsetY;
    }
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

  win.insertAdjacentHTML(
    "beforeend",
    `
    <div class="resize-handle right"></div>
    <div class="resize-handle bottom"></div>
    <div class="resize-handle corner"></div>
  `,
  );

  const right = win.querySelector(".right");
  const bottom = win.querySelector(".bottom");
  const corner = win.querySelector(".corner");

  let resizing = false;
  let mode = null;
  let startX, startY, startW, startH;

  function startResize(e, type) {
    if (win.classList.contains("is-fullscreen")) return;
    if (activeFullscreenWindow && activeFullscreenWindow !== win.id) return;

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

  right?.addEventListener("mousedown", (e) => startResize(e, "right"));
  bottom?.addEventListener("mousedown", (e) => startResize(e, "bottom"));
  corner?.addEventListener("mousedown", (e) => startResize(e, "corner"));

  document.addEventListener("mousemove", (e) => {
    if (!resizing) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (mode === "right" || mode === "corner") {
      win.style.width = Math.max(600, startW + dx) + "px";
    }

    if (mode === "bottom" || mode === "corner") {
      const newHeight = startH + dy;
      win.style.height =
        Math.max(400, Math.min(newHeight, window.innerHeight - 40)) + "px";
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
    currentX += (targetX - currentX) * 0.65;
    currentY += (targetY - currentY) * 0.65;
    activeDrag.style.left = currentX + "px";
    activeDrag.style.top = currentY + "px";

    const sticky = activeDrag.querySelector(".about-sticky");
    if (sticky && activeDrag.id === "about") {
      const tilt = (targetX - currentX) * 0.025;
      sticky.style.setProperty("--drag-tilt", `${-4 + tilt}deg`);
    }
  }
  requestAnimationFrame(dragLoop);
}

dragLoop();

/* =====================================
   PROJECT TAB SYSTEM
===================================== */

const tabButtons = document.querySelectorAll("#projects .bar-tab");
const tabContents = document.querySelectorAll("#projects .tab-content");
const projectsWindow = document.getElementById("projects");

const tabThemes = {
  overview: {
    main: "#f4b942",
    light: "#f9d98a",
  },
  gallery: {
    main: "#e66b6b",
    light: "#f2a3a3",
  },
  process: {
    main: "#5c9ead",
    light: "#8ec0cb",
  },
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    tabContents.forEach((content) => {
      content.classList.toggle("active", content.dataset.tab === target);
    });

    projectsWindow.setAttribute("data-active-tab", target);

    const theme = tabThemes[target];
    projectsWindow.style.setProperty("--tab-color", theme.main);
    projectsWindow.style.setProperty("--tab-light", theme.light);
  });
});

/* =====================================
   WINDOW FULLSCREEN
===================================== */

window.toggleWindowFullscreen = function (id) {
  const win = document.getElementById(id);
  if (!win) return;

  const isFullscreen = win.classList.contains("is-fullscreen");

  if (!isFullscreen) {
    playSound(sounds.fullscreenOn);

    fullscreenState[id] = {
      left: win.style.left,
      top: win.style.top,
      width: win.style.width,
      height: win.style.height,
      zIndex: win.style.zIndex,
    };

    activeFullscreenWindow = id;
    win.classList.add("is-fullscreen");
    bringToFront(win);
  } else {
    playSound(sounds.fullscreenOff);

    win.classList.remove("is-fullscreen");

    const saved = fullscreenState[id];
    if (saved) {
      win.style.left = saved.left || "";
      win.style.top = saved.top || "";
      win.style.width = saved.width || "";
      win.style.height = saved.height || "";
      win.style.zIndex = saved.zIndex || "";
    }

    activeFullscreenWindow = null;

    if (id === "projects") {
    }
  }
};

/* =====================================
   THEME
===================================== */

function toggleTheme() {
  const body = document.body;
  const toggle = document.querySelector(".theme-toggle");

  const goingDark = body.classList.contains("light");

  body.classList.toggle("dark");
  body.classList.toggle("light");

  toggle.textContent = body.classList.contains("dark") ? "Light" : "Dark";

  if (goingDark) {
    playSound(sounds.dark);
  } else {
    playSound(sounds.light);
  }
}

/* =====================================
   INIT
===================================== */

document.querySelectorAll(".window").forEach((win) => {
  initDragging(win);

  // Only allow resizing on specific windows
  if (["projects", "designs", "misc"].includes(win.id)) {
    initResizing(win);
  }
});

/* =====================================
   Overview and Gallery Tab
===================================== */

const projectData = {
  project1: {
    images: ["images/02-Projects/p1/talabarteriataly-visual.webp"],
    processImages: [
      "images/02-Projects/p1/talabarteriataly-visualprocess.webp",
    ],
  },

  project2: {
    images: ["images/02-Projects/p2/elforastero-visual.webp"],
    processImages: ["images/02-Projects/p2/elforastero-visualprocess.webp"],
  },
};

let currentProject = null;
let currentImageIndex = 0;

function openProject(projectId, clickedCard) {
  openWindow("projects");

  const galleryContainer = document.getElementById("gallery-content");
  const projectsWindow = document.getElementById("projects");
  const processContainer = projectsWindow.querySelector(
    '.tab-content[data-tab="process"]',
  );

  if (projectsWindow && !projectsWindow.hasAttribute("data-active-tab")) {
    projectsWindow.setAttribute("data-active-tab", "overview");
  }

  currentProject = projectId;
  currentImageIndex = 0;

  const project = projectData[projectId];
  if (!project) return;

  // Switch to Gallery tab
  const galleryTabButton = document.querySelector(
    '#projects .bar-tab[data-tab="gallery"]',
  );

  tabButtons.forEach((btn) => btn.classList.remove("active"));
  galleryTabButton?.classList.add("active");

  bringToFront(projectsWindow);

  tabContents.forEach((content) => {
    content.classList.toggle("active", content.dataset.tab === "gallery");
  });

  projectsWindow.setAttribute("data-active-tab", "gallery");

  const theme = tabThemes.gallery;
  projectsWindow.style.setProperty("--tab-color", theme.main);
  projectsWindow.style.setProperty("--tab-light", theme.light);

  galleryContainer.innerHTML = `
    <div class="gallery-layout">
      ${project.images
        .map(
          (img) => `
            <div class="gallery-block">
              <img src="${img}" />
            </div>
          `,
        )
        .join("")}
    </div>
  `;

  if (processContainer) {
    processContainer.innerHTML = `
      <div class="gallery-layout">
        ${project.processImages
          .map(
            (img) => `
              <div class="gallery-block">
                <img src="${img}" />
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  const projectsScroll = projectsWindow.querySelector(".window-scroll");
  if (projectsScroll) {
    projectsScroll.scrollTop = 0;
  }
}

function nextImage() {
  const project = projectData[currentProject];
  currentImageIndex++;

  if (currentImageIndex >= project.images.length) {
    currentImageIndex = 0;
  }

  document.getElementById("gallery-image").src =
    project.images[currentImageIndex];
}

function prevImage() {
  const project = projectData[currentProject];
  currentImageIndex--;

  if (currentImageIndex < 0) {
    currentImageIndex = project.images.length - 1;
  }

  document.getElementById("gallery-image").src =
    project.images[currentImageIndex];
}
/* =====================================
   DRAGGABLE MISC PHOTOS
===================================== */

const photos = document.querySelectorAll(".draggable-photo");
const miscScatter = document.querySelector("#misc .misc-scatter");
const polaroidBackdrop = document.getElementById("polaroidBackdrop");

photos.forEach((photo) => {
  photo.style.left = Math.random() * 500 + "px";
  photo.style.top = Math.random() * 400 + "px";

  const baseRotation = Math.random() * 10 - 5;
  photo.dataset.baseRotation = baseRotation;
  photo.style.transform = `rotate(${baseRotation}deg)`;

  let dragging = false;
  let hasMoved = false;
  let velocityX = 0;
  let velocityY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let momentumFrame = null;
  let offsetX = 0;
  let offsetY = 0;
  let startX = 0;
  let startY = 0;

  photo.addEventListener("mousedown", (e) => {
    console.log("photo down, spaceHeld =", spaceHeld);

    if (spaceHeld) {
      e.preventDefault();
      e.stopPropagation();

      spawnPolaroid(photo.src, photo.dataset.caption);
      return;
    }

    e.preventDefault();

    dragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (momentumFrame) {
      cancelAnimationFrame(momentumFrame);
      momentumFrame = null;
    }

    const photoRect = photo.getBoundingClientRect();
    offsetX = e.clientX - photoRect.left;
    offsetY = e.clientY - photoRect.top;

    highestZ++;
    photo.style.zIndex = highestZ;
    photo.classList.add("dragging");

    const liftRotation = baseRotation + (Math.random() * 4 - 2);
    photo.style.transform = `scale(1.05) rotate(${liftRotation}deg)`;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const moveX = Math.abs(e.clientX - startX);
    const moveY = Math.abs(e.clientY - startY);

    if (moveX > 6 || moveY > 6) {
      hasMoved = true;
    }

    if (!hasMoved) return;

    const containerRect = miscScatter.getBoundingClientRect();

    let x = e.clientX - containerRect.left - offsetX + miscScatter.scrollLeft;
    let y = e.clientY - containerRect.top - offsetY + miscScatter.scrollTop;

    const photoWidth = photo.offsetWidth;
    const photoHeight = photo.offsetHeight;

    const minX = -(photoWidth * 2) / 3;
    const maxX = miscScatter.scrollWidth - photoWidth / 3;

    const minY = -(photoHeight * 2) / 3;
    const maxY = miscScatter.scrollHeight - photoHeight / 3;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    velocityX = e.clientX - lastMouseX;
    velocityY = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    photo.style.left = x + "px";
    photo.style.top = y + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;

    dragging = false;
    photo.classList.remove("dragging");

    const dropRotation = baseRotation + (Math.random() * 6 - 3);
    photo.style.transform = `rotate(${dropRotation}deg)`;
    photo.dataset.baseRotation = dropRotation;

    let currentX = parseFloat(photo.style.left) || 0;
    let currentY = parseFloat(photo.style.top) || 0;

    function applyMomentum() {
      velocityX *= 0.92;
      velocityY *= 0.92;

      currentX += velocityX;
      currentY += velocityY;

      const photoWidth = photo.offsetWidth;
      const photoHeight = photo.offsetHeight;

      const minX = -(photoWidth * 2) / 3;
      const maxX = miscScatter.scrollWidth - photoWidth / 3;

      const minY = -(photoHeight * 2) / 3;
      const maxY = miscScatter.scrollHeight - photoHeight / 3;

      currentX = Math.max(minX, Math.min(maxX, currentX));
      currentY = Math.max(minY, Math.min(maxY, currentY));

      photo.style.left = currentX + "px";
      photo.style.top = currentY + "px";

      if (Math.abs(velocityX) > 0.4 || Math.abs(velocityY) > 0.4) {
        momentumFrame = requestAnimationFrame(applyMomentum);
      } else {
        momentumFrame = null;
      }
    }

    momentumFrame = requestAnimationFrame(applyMomentum);
  });

  photo.addEventListener("dblclick", () => {
    openImageViewer(photo.src);
  });
});

/* =====================================
   IMAGE VIEWER (DESIGNS + MISC ONLY)
===================================== */

const imageViewer = document.getElementById("imageViewer");
const viewerImage = document.getElementById("viewerImage");
const viewerZoom = document.getElementById("viewerZoom");
const viewerHint = document.getElementById("viewerHint");

let zoomed = false;
let panX = 0;
let panY = 0;
let isPanning = false;
let isTouchPanning = false;
let panStartX = 0;
let panStartY = 0;

function updateViewerTransform() {
  if (!viewerImage || !imageViewer) return;

  const scale = zoomed ? 1.8 : 1;

  if (zoomed) {
    const viewerRect = imageViewer.getBoundingClientRect();
    const imageRect = viewerImage.getBoundingClientRect();

    const baseWidth = imageRect.width / (zoomed ? 1.8 : 1);
    const baseHeight = imageRect.height / (zoomed ? 1.8 : 1);

    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;

    const minVisibleX = scaledWidth / 3;
    const minVisibleY = scaledHeight / 3;

    const maxPanX = viewerRect.width / 2 + scaledWidth / 2 - minVisibleX;
    const maxPanY = viewerRect.height / 2 + scaledHeight / 2 - minVisibleY;

    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  } else {
    panX = 0;
    panY = 0;
  }

  viewerImage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function resetViewerState() {
  zoomed = false;
  panX = 0;
  panY = 0;
  isPanning = false;
  updateViewerTransform();

  if (viewerImage) {
    viewerImage.classList.remove("zoomed");
  }

  if (viewerZoom) {
    viewerZoom.textContent = "Zoom";
  }

  if (viewerHint) {
    viewerHint.textContent = "Click outside image to close";
  }
}

function openImageViewer(src) {
  if (!imageViewer || !viewerImage) return;

  viewerImage.src = src;
  resetViewerState();

  imageViewer.classList.add("active");

  requestAnimationFrame(() => {
    panX = 0;
    panY = 0;
    updateViewerTransform();
  });

  if (viewerHint) {
    viewerHint.classList.add("active");
  }
}

function closeImageViewer() {
  if (!imageViewer || !viewerImage) return;

  imageViewer.classList.remove("active");
  viewerImage.src = "";
  resetViewerState();

  if (viewerHint) {
    viewerHint.classList.remove("active");
  }
}

viewerZoom?.addEventListener("click", (e) => {
  e.stopPropagation();

  zoomed = !zoomed;

  if (zoomed) {
    viewerImage.classList.add("zoomed");
    if (viewerZoom) viewerZoom.textContent = "Zoom Out";
    if (viewerHint) viewerHint.textContent = "Drag image to look around";
  } else {
    viewerImage.classList.remove("zoomed");
    panX = 0;
    panY = 0;
    if (viewerZoom) viewerZoom.textContent = "Zoom";
    if (viewerHint) viewerHint.textContent = "Click outside image to close";
  }

  updateViewerTransform();
});

viewerImage?.addEventListener("click", (e) => {
  e.stopPropagation();
});

imageViewer?.addEventListener("click", (e) => {
  if (e.target === imageViewer) {
    closeImageViewer();
  }
});

viewerImage?.addEventListener("mousedown", (e) => {
  if (!zoomed) return;

  e.preventDefault();
  e.stopPropagation();

  isPanning = true;
  panStartX = e.clientX - panX;
  panStartY = e.clientY - panY;

  viewerImage.classList.add("panning");
});

viewerImage?.addEventListener(
  "touchstart",
  (e) => {
    if (!zoomed || e.touches.length !== 1) return;

    e.preventDefault();
    isTouchPanning = true;

    const touch = e.touches[0];
    panStartX = touch.clientX - panX;
    panStartY = touch.clientY - panY;
  },
  { passive: false },
);

viewerImage?.addEventListener(
  "touchmove",
  (e) => {
    if (!zoomed || !isTouchPanning || e.touches.length !== 1) return;

    e.preventDefault();

    const touch = e.touches[0];
    panX = touch.clientX - panStartX;
    panY = touch.clientY - panStartY;
    updateViewerTransform();
  },
  { passive: false },
);

viewerImage?.addEventListener("touchend", () => {
  isTouchPanning = false;
});

document.addEventListener("mousemove", (e) => {
  if (!isPanning || !zoomed) return;

  panX = e.clientX - panStartX;
  panY = e.clientY - panStartY;
  updateViewerTransform();
});

document.addEventListener("mouseup", () => {
  if (!isPanning) return;

  isPanning = false;
  viewerImage?.classList.remove("panning");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeImageViewer();

    if (activeFullscreenWindow) {
      toggleWindowFullscreen(activeFullscreenWindow);
    }
  }
});

/* =====================================
   DESIGNS IMAGE CLICKS
===================================== */

document.querySelectorAll("#designs img").forEach((img) => {
  img.addEventListener("click", () => {
    openImageViewer(img.src);
  });
});

/* =====================================
   ABOUT STICKY EASTER EGG
===================================== */

const aboutWindow = document.getElementById("about");
const aboutSticky = document.querySelector(".about-sticky");
const aboutSecretPolaroid = document.querySelector(".about-polaroid-secret");

let stickyClickCount = 0;
let stickyClickTimer = null;

aboutSticky?.addEventListener("click", () => {
  stickyClickCount++;

  if (stickyClickCount === 1) {
    stickyClickTimer = setTimeout(() => {
      stickyClickCount = 0;
    }, 420);
  }

  if (stickyClickCount === 3) {
    clearTimeout(stickyClickTimer);
    stickyClickCount = 0;

    playSound(sounds.sticky);

    aboutWindow?.classList.add("sticky-falling");

    setTimeout(() => {
      aboutWindow?.classList.add("show-secret");
    }, 980);

    setTimeout(() => {
      aboutWindow?.classList.remove("sticky-falling");
    }, 1180);
  }
});

aboutSecretPolaroid?.addEventListener("dblclick", () => {
  aboutWindow?.classList.remove("show-secret");
});

/* =====================================
   POLAROID POPUP
===================================== */

function spawnPolaroid(src, caption) {
  const polaroid = document.createElement("div");
  polaroid.className = "polaroid-popup";

  const rotation = Math.random() * 4 - 2;

  polaroid.innerHTML = `
    <img src="${src}">
    <div class="polaroid-caption">${caption || ""}</div>
  `;

  document.body.appendChild(polaroid);

  if (polaroidBackdrop) {
    polaroidBackdrop.classList.add("active");
  }

  polaroid.style.left = "50%";
  polaroid.style.top = "50%";
  polaroid.style.setProperty("--pop-rot", `${rotation}deg`);
  polaroid.style.zIndex = 20000;

  requestAnimationFrame(() => {
    polaroid.classList.add("show");
  });

  polaroid.addEventListener("click", () => {
    polaroid.remove();
    if (polaroidBackdrop) {
      polaroidBackdrop.classList.remove("active");
    }
  });
}

polaroidBackdrop?.addEventListener("click", () => {
  document.querySelectorAll(".polaroid-popup").forEach((card) => card.remove());
  polaroidBackdrop.classList.remove("active");
});

const contactEmail = document.getElementById("contactEmail");

contactEmail?.addEventListener("click", () => {
  const email = contactEmail.textContent.trim();

  navigator.clipboard.writeText(email).then(() => {
    playSound(sounds.copy);

    const original = contactEmail.textContent;

    contactEmail.textContent = "Copied!";

    setTimeout(() => {
      contactEmail.textContent = original;
    }, 1200);
  });
});
