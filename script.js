const baseInput = document.getElementById("baseImageInput");
const overlayInput = document.getElementById("overlayImageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const filenameInput = document.getElementById("filenameInput");
const downloadBtn = document.getElementById("downloadBtn");

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
    const overlayWidth = 500;
    const overlayHeight = 270;
    const x = (canvas.width - overlayWidth) / 2;
    const y = canvas.height - overlayHeight - 40;

    ctx.fillStyle = "yellow";
    ctx.fillRect(x - 5, y - 5, overlayWidth + 10, overlayHeight + 10);
    ctx.drawImage(overlayImage, x, y, overlayWidth, overlayHeight);
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
    baseDraw.x = e.offsetX - dragOffsetX;
    /*  baseDraw.y = e.offsetY - dragOffsetY; */
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
