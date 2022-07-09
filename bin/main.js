import { drawPartiture } from "./draw.js";

// save input file data in variable 'dataset'
// getting the variable from the sheet.php
// then parse it to JSON
dataset = JSON.parse(dataset);

// draw the svg
if (typeof dataset != "undefined" && dataset.length != 0) {
  drawPartiture();
}
