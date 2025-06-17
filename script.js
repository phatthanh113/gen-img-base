const baseInput = document.getElementById("baseImageInput");
const overlayInput = document.getElementById("overlayImageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const filenameInput = document.getElementById("filenameInput");
const downloadBtn = document.getElementById("downloadBtn");
const toggleMoveBtn = document.getElementById("toggleMoveBtn");
const toggleRangeBtn = document.getElementById("toggleRangeBtn");
const rangeControls = document.querySelector(".range-controls");
const layoutSelect = document.getElementById("layoutSelect");
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

  if (currentLayout === "1:1") {
    // Layout 4:6: Chia canvas thành 2 phần - trên 40% và dưới 60%
    const topHeight = canvas.height * 0.45; // 40% cho phần trên
    const bottomHeight = canvas.height * 0.55; // 60% cho phần dưới

    // Vẽ baseImage ở nửa dưới (60% canvas)
    if (baseImage) {
      const canvasWidth = canvas.width;
      const canvasBottomHeight = bottomHeight;

      // Tính toán tỷ lệ scale để ảnh vừa với canvas hoặc lớn hơn
      const scaleX = canvasWidth / baseImage.naturalWidth;
      const scaleY = canvasBottomHeight / baseImage.naturalHeight;
      const scale = Math.max(scaleX, scaleY); // Chọn scale lớn hơn để ảnh không bị nhỏ hơn canvas

      // Kích thước ảnh sau khi scale
      const baseWidth = baseImage.naturalWidth * scale;
      const baseHeight = baseImage.naturalHeight * scale;

      // Vị trí ảnh (có thể được điều chỉnh khi di chuyển)
      const baseX = 0; // Sử dụng baseImageX từ logic di chuyển, mặc định là 0
      const baseY = topHeight; // Sử dụng baseImageY từ logic di chuyển, mặc định là 0

      ctx.drawImage(baseImage, baseX, baseY, baseWidth, baseHeight);
    }

    // Vẽ overlayImage ở nửa trên (40% canvas)
    if (overlayImage) {
      const overlayWidth = canvas.width;
      const overlayHeight = topHeight; // Sử dụng 40% height
      const overlayX = 0;
      const overlayY = 0; // Bắt đầu từ đầu canvas

      // Vẽ border màu vàng
      ctx.fillStyle = "yellow";
      ctx.fillRect(
        overlayX - 5,
        overlayY - 5,
        overlayWidth + 10,
        overlayHeight + 10
      );

      ctx.drawImage(
        overlayImage,
        overlayX,
        overlayY,
        overlayWidth,
        overlayHeight
      );
    }
  } else {
    // Layout 16:3: Giữ nguyên logic cũ
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

// Load saved layout and set initial canvas height
function setCanvasHeight() {
  if (currentLayout === "1:1") {
    canvas.height = 1200;
    canvas.width = 1000;
  } else {
    canvas.height = 800;
    canvas.width = 800;
  }
  if (baseImage) {
    setBaseDrawDimensions();
  }
}

// Layout state
let currentLayout = "16:3";

// Load saved layout from storage
const savedLayout = localStorage.getItem("selectedLayout");
if (savedLayout) {
  currentLayout = savedLayout;
  layoutSelect.value = savedLayout;
}
setCanvasHeight();

// Layout select handler
layoutSelect.addEventListener("change", (e) => {
  currentLayout = e.target.value;
  localStorage.setItem("selectedLayout", currentLayout);
  setCanvasHeight();

  if (currentLayout === "1:1" && baseImage) {
    // Set overlay dimensions to match base image dimensions
    const baseWidth = baseDraw.width;
    const baseHeight = baseDraw.height;
    overlayDimensions.width = baseWidth;
    overlayDimensions.height = baseHeight;

    // Update range inputs
    overlayWidthInput.value = baseWidth;
    overlayHeightInput.value = baseHeight;
    overlayWidthValue.textContent = baseWidth;
    overlayHeightValue.textContent = baseHeight;

    // Save new dimensions
    saveDimensions();
  } else {
    // Reset to default 16:3 dimensions
    overlayDimensions.width = 500;
    overlayDimensions.height = 270;

    // Update range inputs
    overlayWidthInput.value = 500;
    overlayHeightInput.value = 270;
    overlayWidthValue.textContent = "500";
    overlayHeightValue.textContent = "270";

    // Save new dimensions
    saveDimensions();
  }
  if (overlayImage) drawImages();
});
