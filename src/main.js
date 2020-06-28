const el = (string) => document.querySelector(string);

const section = el("section");
const main = el("main");
const canvas = el("#canvas");
const currentColor = el(".currentColor");
const thickness = el(".thickness");
const brushColor = el(".brushColor");

// 优化移动端浏览器工具栏高度包含于100vh的问题，将浏览器真正视口高度作为 section 样式高度
let vh = window.innerHeight * 0.01;
section.style.setProperty("--vh", `${vh}px`);
// 设置画布宽高及样式宽高（不设置样式宽高会被 flex-grow 拉长）
const mainWidth = parseInt(main.clientWidth * 0.8);
const mainHeight = parseInt(main.clientHeight * 0.9);
canvas.width = `${mainWidth}`;
canvas.height = `${mainHeight}`;
canvas.style.width = `${mainWidth}px`;
canvas.style.height = `${mainHeight}px`;

const ctx = canvas.getContext("2d");
ctx.strokeStyle = currentColor.value;
ctx.lineWidth = thickness.value;
ctx.lineJoin = "round";
let painting = false;
// 上一个绘画路径点的坐标
let lastX = 0;
let lastY = 0;

// 鼠标绘图
canvas.addEventListener("mousedown", (e) => {
  painting = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
});
canvas.addEventListener("mousemove", (e) => {
  if (painting) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.closePath();
    ctx.stroke();
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});
canvas.addEventListener("mouseup", (e) => {
  painting = false;
});
// 鼠标移出画布停止绘画，防止再次进入产生连线
canvas.addEventListener("mouseout", (e) => {
  painting = false;
});
// 触摸绘图
canvas.addEventListener("touchstart", (e) => {
  painting = true;
  lastX = e.touches[0].pageX - e.touches[0].target.offsetLeft;
  lastY = e.touches[0].pageY - e.touches[0].target.offsetTop;
});
// 使用事件委托优化移动端绘图，在画布上触摸移动时阻止body默认事件（阻止浏览器的滑动）
document.body.addEventListener(
  "touchmove",
  (e) => {
    if (painting && e.target.matches(`canvas`)) {
      e.preventDefault();
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(
        e.touches[0].pageX - e.touches[0].target.offsetLeft,
        e.touches[0].pageY - e.touches[0].target.offsetTop
      );
      ctx.closePath();
      ctx.stroke();
      lastX = e.touches[0].pageX - e.touches[0].target.offsetLeft;
      lastY = e.touches[0].pageY - e.touches[0].target.offsetTop;
    }
  },
  { passive: false }
);
canvas.addEventListener("touchend", (e) => {
  painting = false;
});
// 触摸移出画布停止绘画，防止再次进入产生连线
canvas.addEventListener("touchcancel", (e) => {
  painting = false;
});

currentColor.addEventListener("input", (e) => {
  ctx.strokeStyle = e.target.value;
});
thickness.addEventListener("input", (e) => {
  ctx.lineWidth = e.target.value;
});
// 点击色块改变画笔颜色，将色块背景色赋值给 currentColor.value （RGB 转为 HEX ）
brushColor.addEventListener("click", (e) => {
  if (e.target.matches("li")) {
    let color16 = "#";
    const color = getComputedStyle(e.target).backgroundColor;
    color.split(",").forEach((item) => {
      const str = parseInt(item.match(/\d{1,3}/)).toString(16);
      str.length === 2 ? (color16 += str) : (color16 += "0" + str); // 确保六位数 HEX 颜色值
    });
    ctx.strokeStyle = color16;
    currentColor.value = color16;
  }
});
