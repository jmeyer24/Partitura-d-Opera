import { drawPartiture } from "./draw.js";
import { drawLegend } from "./draw.js";
// import { html2canvas }from "../node_modules/html2canvas/dist/html2canvas.js";
// import html2canvas from 'html2canvas';
import "./html2canvas.js"

// save input file data in variable 'dataset'
// getting the variable from the sheet.php
// then parse it to JSON
dataset = JSON.parse(dataset);

// draw the svg
if (typeof dataset != "undefined" && dataset.length != 0) {
  drawPartiture();
  drawLegend();
}

// html2canvas(document.querySelector("#output")).then(canvas => {
//     document.body.appendChild(canvas);
// });