const el = (selector) => document.querySelector(selector);

const section = el("section");
const mainArea = el("main");
const canvas = el("#canvas");
const currentColor = el(".currentColor");
const thickness = el(".thickness");
const brushColor = el(".brushColor");
const type = el(".type");
const text = el(".text");
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Canvas 2D context is not available in this browser.");
}

let painting = false;
let lastX = 0;
let lastY = 0;
let pixelRatio = Math.max(1, window.devicePixelRatio || 1);

function updateViewportHeight() {
  section.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
}

function resizeCanvas() {
  const width = Math.max(1, Math.floor(mainArea.clientWidth * 0.8));
  const height = Math.max(1, Math.floor(mainArea.clientHeight * 0.9));
  const nextRatio = Math.max(1, window.devicePixelRatio || 1);
  if (
    canvas.width === Math.round(width * nextRatio) &&
    canvas.height === Math.round(height * nextRatio)
  ) {
    return;
  }

  const snapshot = document.createElement("canvas");
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  snapshot.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = Math.round(width * nextRatio);
  canvas.height = Math.round(height * nextRatio);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  pixelRatio = nextRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  if (snapshot.width && snapshot.height) {
    ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, width, height);
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = currentColor.value;
  ctx.fillStyle = currentColor.value;
  ctx.lineWidth = getBrushSize();
}

function getBrushSize() {
  const value = Number(thickness.value);
  return Number.isFinite(value) ? Math.min(100, Math.max(1, value)) : 10;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.clientWidth / rect.width),
    y: (event.clientY - rect.top) * (canvas.clientHeight / rect.height),
  };
}

function startDrawing(event) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  painting = true;
  canvas.setPointerCapture(event.pointerId);
  const point = getCanvasPoint(event);
  lastX = point.x;
  lastY = point.y;
  ctx.beginPath();
  ctx.arc(lastX, lastY, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fill();
}

function draw(event) {
  if (!painting) return;
  event.preventDefault();
  const point = getCanvasPoint(event);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastX = point.x;
  lastY = point.y;
}

function stopDrawing(event) {
  if (!painting) return;
  painting = false;
  if (event && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

ctx.strokeStyle = currentColor.value;
ctx.fillStyle = currentColor.value;
ctx.lineWidth = getBrushSize();
ctx.lineJoin = "round";
ctx.lineCap = "round";
ctx.globalCompositeOperation = "source-over";

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", () => {
  painting = false;
});

currentColor.addEventListener("input", (event) => {
  ctx.strokeStyle = event.target.value;
  ctx.fillStyle = event.target.value;
});

thickness.addEventListener("input", () => {
  ctx.lineWidth = getBrushSize();
});

brushColor.addEventListener("click", (event) => {
  if (!event.target.matches("li")) return;
  const color = getComputedStyle(event.target).backgroundColor;
  const channels = color.match(/\d{1,3}/g);
  if (!channels || channels.length < 3) return;
  const hex = "#" + channels.slice(0, 3).map((channel) =>
    Number(channel).toString(16).padStart(2, "0")
  ).join("");
  ctx.strokeStyle = hex;
  ctx.fillStyle = hex;
  currentColor.value = hex;
});

type.addEventListener("click", (event) => {
  const image = event.target.closest("img");
  if (!image) return;
  const item = image.parentNode;
  type.querySelectorAll("li").forEach((node) => node.classList.remove("selected"));
  item.classList.add("selected");
  const isEraser = item.classList.contains("eraser");
  text.textContent = isEraser ? "橡皮" : "铅笔";
  ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
});

updateViewportHeight();
resizeCanvas();

if (typeof ResizeObserver !== "undefined") {
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(mainArea);
} else {
  window.addEventListener("resize", resizeCanvas);
}
window.addEventListener("resize", updateViewportHeight);
window.addEventListener("orientationchange", () => {
  updateViewportHeight();
  resizeCanvas();
});
