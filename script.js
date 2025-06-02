const baseInput = document.getElementById("baseImageInput");
const overlayInput = document.getElementById("overlayImageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const filenameInput = document.getElementById("filenameInput");
const downloadBtn = document.getElementById("downloadBtn");
const toggleMoveBtn = document.getElementById("toggleMoveBtn");
const toggleRangeBtn = document.getElementById("toggleRangeBtn");
const rangeControls = document.querySelector(".range-controls");
// Range input elements
const overlayWidthInput = document.getElementById("overlayWidth");
const overlayHeightInput = document.getElementById("overlayHeight");
const overlayWidthValue = document.getElementById("overlayWidthValue");
const overlayHeightValue = document.getElementById("overlayHeightValue");

// Default overlay dimensions
let overlayDimensions = {
  width: 500,
  height: 270,
};

// Load saved dimensions from Chrome storage
function loadSavedDimensions() {
  const savedWidth = localStorage.getItem("overlayWidth");
  const savedHeight = localStorage.getItem("overlayHeight");

  if (savedWidth) {
    overlayDimensions.width = parseInt(savedWidth);
    overlayWidthInput.value = savedWidth;
    overlayWidthValue.textContent = savedWidth;
  }

  if (savedHeight) {
    overlayDimensions.height = parseInt(savedHeight);
    overlayHeightInput.value = savedHeight;
    overlayHeightValue.textContent = savedHeight;
  }
}

// Save dimensions to Chrome storage
function saveDimensions() {
  localStorage.setItem("overlayWidth", overlayDimensions.width);
  localStorage.setItem("overlayHeight", overlayDimensions.height);
}

// Range input event handlers
overlayWidthInput.addEventListener("input", (e) => {
  overlayDimensions.width = parseInt(e.target.value);
  overlayWidthValue.textContent = e.target.value;
  saveDimensions();
  if (overlayImage) drawImages();
});

overlayHeightInput.addEventListener("input", (e) => {
  overlayDimensions.height = parseInt(e.target.value);
  overlayHeightValue.textContent = e.target.value;
  saveDimensions();
  if (overlayImage) drawImages();
});

// Load saved dimensions when page loads
loadSavedDimensions();

let allowVerticalMove = false;

// Toggle button event handler
toggleMoveBtn.addEventListener("click", () => {
  allowVerticalMove = !allowVerticalMove;
  toggleMoveBtn.innerHTML = allowVerticalMove
    ? '<i class="fas fa-unlock"></i> Unlock Y-Movement'
    : '<i class="fas fa-lock"></i> Lock Y-Movement';
  canvas.style.cursor = allowVerticalMove ? "move" : "ew-resize";
});

let baseImage = null;
let overlayImage = null;

// Dữ liệu vị trí vẽ base image
let baseDraw = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

let isDraggingBase = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

baseInput.addEventListener("change", (e) => loadImage(e, true));
overlayInput.addEventListener("change", (e) => loadImage(e, false));

// Cho phép paste từ clipboard
document.addEventListener("paste", (event) => {
  const items = event.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      const img = new Image();
      img.onload = () => {
        if (!baseImage) {
          baseImage = img;
          setBaseDrawDimensions();
        } else {
          overlayImage = img;
        }
        drawImages();
      };
      img.src = URL.createObjectURL(file);
    }
  }
});

function loadImage(e, isBase) {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    if (isBase) {
      baseImage = img;
      setBaseDrawDimensions();
    } else {
      overlayImage = img;
    }
    drawImages();
  };
  img.src = URL.createObjectURL(file);
}

function setBaseDrawDimensions() {
  if (!baseImage) return;

  const imgAspectRatio = baseImage.width / baseImage.height;
  const canvasAspectRatio = canvas.width / canvas.height;

  if (imgAspectRatio > canvasAspectRatio) {
    baseDraw.height = canvas.height;
    baseDraw.width = canvas.height * imgAspectRatio;
    baseDraw.x = (canvas.width - baseDraw.width) / 2;
    baseDraw.y = 0;
  } else {
    baseDraw.width = canvas.width;
    baseDraw.height = canvas.width / imgAspectRatio;
    baseDraw.x = 0;
    baseDraw.y = (canvas.height - baseDraw.height) / 2;
  }
}

function drawImages() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (baseImage) {
    ctx.drawImage(
      baseImage,
      baseDraw.x,
      baseDraw.y,
      baseDraw.width,
      baseDraw.height
    );
  }

  if (overlayImage) {
    const x = (canvas.width - overlayDimensions.width) / 2;
    const y = canvas.height - overlayDimensions.height - 40;
    ctx.fillStyle = "yellow";
    ctx.fillRect(
      x - 5,
      y - 5,
      overlayDimensions.width + 10,
      overlayDimensions.height + 10
    );
    ctx.drawImage(
      overlayImage,
      x,
      y,
      overlayDimensions.width,
      overlayDimensions.height
    );
  }
}

// Sự kiện kéo base image
canvas.addEventListener("mousedown", (e) => {
  const mx = e.offsetX;
  const my = e.offsetY;

  if (
    mx >= baseDraw.x &&
    mx <= baseDraw.x + baseDraw.width &&
    my >= baseDraw.y &&
    my <= baseDraw.y + baseDraw.height
  ) {
    isDraggingBase = true;
    dragOffsetX = mx - baseDraw.x;
    dragOffsetY = my - baseDraw.y;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isDraggingBase) {
    if (allowVerticalMove) {
      baseDraw.y = e.offsetY - dragOffsetY;
    } else {
      baseDraw.x = e.offsetX - dragOffsetX;
    }
    drawImages();
  }
});

canvas.addEventListener("mouseup", () => {
  isDraggingBase = false;
});

canvas.addEventListener("mouseleave", () => {
  isDraggingBase = false;
});

// Tải ảnh
downloadBtn.addEventListener("click", () => {
  let filename = filenameInput.value.trim();
  if (!filename) filename = "canvas_output";
  const link = document.createElement("a");
  link.download = filename + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// Alt + S để tải ảnh
document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key === "S") {
    event.preventDefault();
    let filename = filenameInput.value.trim();
    if (!filename) filename = "canvas_output";
    const link = document.createElement("a");
    link.download = filename + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
});

toggleRangeBtn.addEventListener("click", () => {
  const isHidden = rangeControls.style.display === "none";
  rangeControls.style.display = isHidden ? "block" : "none";
  toggleRangeBtn.innerHTML = isHidden
    ? '<i class="fas fa-sliders"></i> Hide Change Size Overlay'
    : '<i class="fas fa-sliders"></i> Show Change Size Overlay';
});

// Initialize controls as hidden
rangeControls.style.display = "none";
toggleRangeBtn.innerHTML =
  '<i class="fas fa-sliders"></i> Show Change Size Overlay';
