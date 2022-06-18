// setup ====================
let canvas = document.getElementById("sheet");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
w = canvas.width;
h = canvas.height;

// meta variables ====================
// position
let fromTop = 0.1 * h;
let lineStart = 0.1 * w;
let lineEnd = w - lineStart;
// line
let lineSpacing = 0.01 * h;
let betweenLineSpacing = 3 * lineSpacing;
let lineWidth = 1;
let lineWidthStartEnd = 3;
// bar
let numberBars = 5;
let barSpacing = (w - 2 * lineStart) / numberBars;
// staff
let numberStaffs = 3;
let staffSpacing = 8 * lineSpacing;

// helper variables
let last = 0;
let y = fromTop;

// draw partiture lines ===================
ctx.strokeStyle = "#000000";

for (j = 0; j < numberStaffs; j++) {
  // horizontal lines
  ctx.lineWidth = lineWidth;
  let currentTop = y;

  for (i = 0; i < 10; i++) {
    if (i == 5) {
      y += betweenLineSpacing;
    }
    ctx.beginPath();
    ctx.moveTo(lineStart, y);
    ctx.lineTo(lineEnd, y);
    ctx.stroke();

    last = y;
    y += lineSpacing;
  }

  // vertical lines
  // bars
  for (i = 1; i <= numberBars; i++) {
    x = lineStart + i * barSpacing;
    ctx.beginPath();
    ctx.moveTo(x, currentTop);
    ctx.lineTo(x, last);
    ctx.stroke();
  }

  // beginning and end
  ctx.lineWidth = lineWidthStartEnd;

  for (i = 0; i < 2; i++) {
    x = i ? lineStart : lineEnd;
    ctx.beginPath();
    ctx.moveTo(x, currentTop);
    ctx.lineTo(x, last);
    ctx.stroke();
  }

  // prepare next staff
  // ctx.closePath();
  y += staffSpacing;
}

// draw notes ====================
