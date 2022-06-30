// ========================================================================
// vexflow import/setup
// ========================================================================
const {
  Renderer,
  Stave,
  StaveNote,
  GhostNote,
  Voice,
  Beam,
  Formatter,
  TextNote,
  StaveConnector,
  Modifier,
  Factory,
  Tuplet,
  Fraction,
  Annotation,
  Font,
} = Vex.Flow;

// ========================================================================
// opera data constants
// ========================================================================
const data_overall_timespan = 58;
const data_num_composers = 10;

// ========================================================================
// meta-variables
// ========================================================================
const sheetWidth = 4000;
const startX = 180;
const startY = 50;
const staveWidth = sheetWidth - 1.5 * startX;
const staveDistance = 100;
const sheetHeight = data_num_composers * staveDistance + 2 * startY;
const firstBarWidth = 90;
const textPosition = 3;

// ========================================================================
// aesthetic maps
// ========================================================================
const countryNoteMap = ["g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5"];
// TODO: get 7 good colors (ordinal or linear?)
const operaColorMap = d3
  .scaleOrdinal()
  .domain([0, 6])
  .range(["gold", "blue", "green", "darkgreen", "pink", "slateblue", "orange"]);
// const operaColorMap = d3.scaleOrdinal().domain([0, 6]).range(d3.schemeSet1);
// const operaColorMap = d3.scaleLinear().domain([0, 6]).range(["lime", "blue"]);
// there are at max 4 librettists for one componist
const librettistDurationMap = [4, 8, 16, 32];

// ========================================================================
// save input file data in these variables
// ========================================================================
// TODO: we got the variable "dataset" from the sheet.php
// let dataset = [];
// console.log("this is dataset (.js): ", dataset);
dataset = JSON.parse(dataset);
// let data = [];
// TODO: get a bass stave as well
// TODO: search for stave2 and comment in all occurences
let stave = null;
// let stave2 = null;

// ========================================================================
// Create an SVG renderer and attach it to the DIV element named "output".
// ========================================================================
const div = document.getElementById("output");
let datjson = 0;
const renderer = new Renderer(div, Renderer.Backends.SVG);
renderer.resize(sheetWidth, sheetHeight);

// ========================================================================
// Configure the rendering context.
// ========================================================================
const context = renderer.getContext();

// ========================================================================
// grab the necessary information from the variable dataset
// ========================================================================
function prepareData() {
  // get all entries by the same key in an array (collect all composers etc)
  let sets = {};
  for (const [key, value] of Object.entries(dataset[0])) {
    sets[key] = [value];
  }
  for (let i = 1; i < dataset.length; i++) {
    for (const [key, value] of Object.entries(dataset[i])) {
      sets[key].push(value);
    }
  }
  // make em sets of unique instances
  Object.keys(sets).forEach(function (key) {
    sets[key] = new Set(sets[key]);
  });

  // from that, grab necessary information
  let dat = {
    numComposers: sets["composer"].size,
    numLibrettists: sets["librettist"].size,
    numPlaces: sets["placename"].size,
    numYears:
      Math.max(...sets["performance_year"]) -
      Math.min(...sets["performance_year"]),
  };
  return dat;
}

// ========================================================================
// Helper function to sort arrays by indices
// ========================================================================
function getSortIndices(input) {
  toSort = [...input];
  for (var i = 0; i < toSort.length; i++) {
    toSort[i] = [toSort[i], i];
  }
  toSort.sort(function (left, right) {
    return left[0] < right[0] ? -1 : 1;
  });
  let sortIndices = [];
  for (var j = 0; j < toSort.length; j++) {
    sortIndices.push(toSort[j][1]);
    toSort[j] = toSort[j][0];
  }
  return sortIndices;
}

// ========================================================================
// Helper function to compare two arrays
// ========================================================================
// Warn if overriding existing method
if (Array.prototype.equals)
  console.warn(
    "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
  );
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array) return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length) return false;

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i])) return false;
    } else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });

// ==============================================================
// Helper function to draw annotations below note heads
// ==============================================================
const annotation = (text, hJustification, vJustification) =>
  new Annotation(text)
    .setFont(Font.SANS_SERIF, 10)
    .setJustification(hJustification)
    .setVerticalJustification(vJustification);

// ==============================================================
// Helper function to get the last name of the composer
// ==============================================================
function getLastName(composerName) {
  return (composerName = composerName.slice(
    0,
    composerName.indexOf(",") < composerName.indexOf(" ")
      ? composerName.indexOf(",")
      : composerName.indexOf(" ")
  ));
}

// ==============================================================
// Helper function to get pairs from lists of composer info
// ==============================================================
function createPairs(list1, list2) {
  pairs = [];
  histogram = [];
  list1.forEach(function (value, idx) {
    // new pair
    pair = [value, list2[idx]];
    // if none of the current pairs matches the new pair
    if (!pairs.some((p) => p.equals(pair))) {
      // add new pair
      pairs.push(pair);
      histogram.push(1);
    } else {
      histogram[histogram.length - 1]++;
    }
  });
  let descendingOrderPermutation = getSortIndices(histogram).reverse();
  pairs = descendingOrderPermutation.map((i) => pairs[i]);
  histogram = descendingOrderPermutation.map((i) => histogram[i]);

  // get unique lists in sorted fashion
  return [
    pairs,
    histogram,
    [...new Set(list1)].sort(),
    [...new Set(list2)].sort(),
  ];
}

// ==============================================================
// Helper function to get information list from shows
// ==============================================================
function getInformation(data, dataKey, unique) {
  list = [];
  if ((string = "")) {
    return data;
  } else {
    data.forEach(function (singleData) {
      list.push(singleData[dataKey]);
    });
  }

  if (unique) {
    list = [...new Set(list)].sort();
  }

  return list;
}

// ========================================================================
// Draw the partiture by some data
// ========================================================================
function drawPartiture(dat) {
  context.clear();
  // let librettistColorMap = d3
  //   .scaleSequential()
  //   .domain([0, 7])
  //   .interpolator(d3.interpolateViridis);
  // let librettistColorMap = d3
  //   .scaleOrdinal()
  //   .domain(librettistNoteMap)
  //   .range([
  //     "brown",
  //     "blue",
  //     "green",
  //     "purple",
  //     "slateblue",
  //     "darkgreen",
  //     "red",
  //     "orange",
  //   ]);

  // ==============================================================
  // Draw a stave for each composer
  // ==============================================================
  for (let c = 0; c < dat["numComposers"]; c++) {
    drawComposer(c);
  }
}

function drawComposer(c) {
  // get all the years the composer performed in
  // get all librettist a composer worked with
  // get all operas of a single composer
  let composerName = "";
  let shows = [];
  let years = [];
  let librettists = [];
  let operas = [];
  dataset.forEach(function (show) {
    if (show["composerMap"] == c + 1) {
      composerName = show["composer"];
      shows.push(show);
      years.push(show["performance_year"]);
      librettists.push(show["librettistMap"]);
      operas.push(show["operaMap"]);
    }
  });
  years = [...new Set(years)].map(Number).sort();
  let time = Math.max(...years) - Math.min(...years) + 1;

  // draw the first bars of the stave
  stave = new Stave(startX, startY + c * staveDistance, firstBarWidth);
  // stave = new Stave(startX, startY + 2 * c * staveDistance, firstBarWidth);
  // stave2 = new Stave(
  //   startX,
  //   startY + (2 * c + 1) * staveDistance,
  //   firstBarWidth
  // );
  startXAfterFirst = startX + firstBarWidth;
  stave
    .addTimeSignature(`${time}/4`)
    .addClef("treble")
    .setText(getLastName(composerName), Modifier.Position.LEFT)
    .setContext(context)
    .draw();
  // stave2
  //   .addTimeSignature(`${time}/4`)
  //   .addClef("bass")
  //   .setContext(context)
  //   .draw();

  // // draw left-side connectors and name
  // const conn_single_left = new StaveConnector(stave, stave2);
  // const conn_double = new StaveConnector(stave, stave);
  // const conn_double = new StaveConnector(stave, stave2);
  // conn_single_left
  //   .setType(StaveConnector.type.SINGLE_LEFT)
  //   .setContext(context)
  //   .draw();
  // conn_double
  //   .setType(StaveConnector.type.DOUBLE)
  // .setText(getLastName(composerName), Modifier.Position.LEFT)
  // .setContext(context)
  // .draw();

  // ==============================================================
  // Draw a bar for each year
  // ==============================================================
  for (let y = 0; y < time; y++) {
    drawYear(c, y, years, time, shows, librettists, operas);
  }

  // // draw the right-side connector
  // const conn_single_right = new StaveConnector(stave, stave2);
  // conn_single_right
  //   .setType(StaveConnector.type.SINGLE_RIGHT)
  //   .setContext(context)
  //   .draw();
}

function drawYear(c, y, years, time, shows, librettists, operas) {
  // draw the bar of the current year
  let barX =
    startXAfterFirst +
    (y * (staveWidth - firstBarWidth)) / data_overall_timespan;
  let barY = startY + c * staveDistance;
  // let barY = startY + 2 * c * staveDistance;
  let barWidth = (staveWidth - firstBarWidth) / data_overall_timespan;
  stave = new Stave(barX, barY, barWidth);
  // stave2 = new Stave(barX, barY + staveDistance, barWidth);
  stave.setContext(context).draw();
  // stave2.setContext(context).draw();

  // get all shows in that year
  let fullYearList = Array.from(new Array(time), (x, i) => i + years[0]);
  let showsInYear = shows
    .map((show) => {
      if (parseInt(show["performance_year"]) == fullYearList[y]) {
        return show;
      }
    })
    .filter((show) => show !== undefined);

  // only draw notes, when there are notes to draw... error else
  if (showsInYear.length > 0) {
    // ==============================================================
    // Draw information as notes for each composer
    // ==============================================================
    // represent each show as a colored note
    // note by country/place TODO: which one
    // note length by librettist
    // color by opera
    countries = getInformation(shows, "country", true);
    librettists = getInformation(shows, "librettist", true);
    operas = getInformation(shows, "title", true);
    // [pairs, histogram,,] = createPairs(countries, librettists);

    // note specifics
    const keys = showsInYear.map(
      (show) =>
        countryNoteMap[
          countries.findIndex((element) => element === show["country"])
        ]
    );
    const durations = showsInYear.map(
      (show) =>
        librettistDurationMap[
          librettists.findIndex((element) => element === show["librettist"])
        ]
    );
    const fillStyles = showsInYear.map((show) =>
      operaColorMap(operas.findIndex((element) => element === show["title"]))
    );
    const strokeStyles = "#000000";

    // get all the notes
    // number of notes per composer is all their operas
    notes = [];
    for (let s = 0; s < showsInYear.length; s++) {
      notes.push(
        new StaveNote({
          keys: [keys[s]],
          duration: durations,
        }).setStyle({
          fillStyle: fillStyles[s],
          strokeStyle: fillStyles[s],
        })
        // TODO: add first and last year as bar numbers
        // .addModifier(annotation(histogram[s], s + 1, textPosition), 0)
      );
    }

    // TODO sort and connect the librettists with beams
    var beams = Beam.generateBeams(notes, { stem_direction: 1 });
    // var beams = Beam.generateBeams(notes, {
    //   groups: [new Fraction(time, 4)],
    // });
    Formatter.FormatAndDraw(context, stave, notes, false);
    beams.forEach(function (beam) {
      beam.setStyle({ fillStyle: fillStyles[0] }).setContext(context).draw();
    });
  }
}

function main() {
  if (typeof dataset != "undefined" && dataset.length != 0) {
    data = prepareData(dataset);
    drawPartiture(data);
  }
}

main();
