// ========================================================================
// vexflow import/setup
// ========================================================================
const {
  Renderer,
  Stave,
  StaveNote,
  Beam,
  Formatter,
  StaveConnector,
  Modifier,
  Fraction,
} = Vex.Flow;

// ========================================================================
// use a font that looks handwritten
// ========================================================================
Vex.Flow.setMusicFont("Petaluma");

// ========================================================================
// opera data constants
// ========================================================================
const DATA_OVERALL_TIMESPAN = 59; // 59 years between 1775 and 1833
const DATA_NUM_COMPOSERS = 10;

// ========================================================================
// option bools (config)
// ========================================================================
const GRANDSTAFF = false;
const FITTIMELINE = true;
const SHOWFULLTIMELINE = true; // only effective when FITTIMELINE = false;
const INVERSECOLORS = false;

// ========================================================================
// constants
// ========================================================================
const SHEETWIDTH = 8000;
const STARTX = 180;
const STARTY = 50;
const STAVEWIDTH = SHEETWIDTH - 1.5 * STARTX;
const STAVEDISTANCE = 100;
const FIRSTBARWIDTH = 135;
const BARWIDTH = (STAVEWIDTH - FIRSTBARWIDTH) / DATA_OVERALL_TIMESPAN;

const SHEETHEIGHT = GRANDSTAFF
  ? 2 * (DATA_NUM_COMPOSERS * STAVEDISTANCE + STARTY)
  : DATA_NUM_COMPOSERS * STAVEDISTANCE + 2 * STARTY;

let stave = null;
let stave2 = null;

// ========================================================================
// aesthetic maps
// ========================================================================
// there are at max 4 librettists for one componist
let librettistDurationMap = [4, 2, 8, 1];

// there are at max 6 different countries for one composer
let countryNoteMap = ["d/4", "f/4", "a/4", "c/5", "e/5", "g/5"]; // ["g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5"];

// ========================================================================
// save input file data in these variables
// ========================================================================
// getting the variable "dataset" from the sheet.php, then parse it to JSON
dataset = JSON.parse(dataset);

// ========================================================================
// Create an SVG renderer and attach it to the DIV element named "output".
// ========================================================================
const output = document.getElementById("output");
let datjson = 0;
const renderer = new Renderer(output, Renderer.Backends.SVG);
renderer.resize(SHEETWIDTH, SHEETHEIGHT);

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
  for (let [key, value] of Object.entries(dataset[0])) {
    sets[key] = [value];
  }
  for (let i = 1; i < dataset.length; i++) {
    for (let [key, value] of Object.entries(dataset[i])) {
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
// Draw the partiture
// ========================================================================
function drawPartiture() {
  context.clear();

  // ==============================================================
  // Draw a stave for each composer
  // ==============================================================
  for (let c = 0; c < data["numComposers"]; c++) {
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
    // TODO: sorting the composer has to be done in preprocessing
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
  let setFirstStaveAtX;
  if (FITTIMELINE) {
    setFirstStaveAtX = years[0] - 1775;
  } else {
    setFirstStaveAtX = 0;
  }
  if (GRANDSTAFF) {
    var stave = new Stave(
      STARTX + setFirstStaveAtX * BARWIDTH,
      STARTY + 2 * c * STAVEDISTANCE,
      FIRSTBARWIDTH
    );
    var stave2 = new Stave(
      STARTX + setFirstStaveAtX * BARWIDTH,
      STARTY + (2 * c + 1) * STAVEDISTANCE,
      FIRSTBARWIDTH
    );
  } else {
    var stave = new Stave(
      STARTX + setFirstStaveAtX * BARWIDTH,
      STARTY + c * STAVEDISTANCE,
      FIRSTBARWIDTH
    );
    stave.setText(getLastName(composerName), Modifier.Position.LEFT);
  }

  stave
    // TODO: put in legend: operas in ... years over a timespan of ... years
    .addTimeSignature(years.length + "/" + time)
    .addClef("treble")
    .setContext(context);

  if (INVERSECOLORS) {
    stave.context.setStrokeStyle("white");
    stave.context.setFillStyle("white");
    output.className = "output-inverse";
  } else {
    // stave.context.setStrokeStyle("red");
    // stave.context.setFillStyle("black");
    output.className = "output";
  }

  stave.draw();

  let conn_double;
  let conn_single_left;

  if (GRANDSTAFF) {
    stave2
      .addTimeSignature(`${time}/4`)
      .addClef("bass")
      .setContext(context)
      .draw();

    // draw left-side connectors and name
    conn_single_left = new StaveConnector(stave, stave2);
    conn_single_left
      .setType(StaveConnector.type.SINGLE_LEFT)
      .setContext(context)
      .draw();
  } else {
    stave2 = stave;
  }

  conn_double = new StaveConnector(stave, stave2);
  conn_double
    .setType(StaveConnector.type.DOUBLE)
    .setText(getLastName(composerName), Modifier.Position.LEFT)
    .setContext(context)
    .draw();

  // ==============================================================
  // Draw a bar for each year
  // ==============================================================
  for (let y = 0; y < time; y++) {
    drawYear(c, y, years, time, shows, librettists, operas);
  }

  if (GRANDSTAFF) {
    // draw the right-side connector
    let conn_single_right = new StaveConnector(stave, stave2);
    conn_single_right
      .setType(StaveConnector.type.SINGLE_RIGHT)
      .setContext(context)
      .draw();
  }

  // draw the flags
  let countries = getInformation(shows, "country", true);
  for (let i = 0; i < countries.length; i++) {
    let country = countries[i];

    let lflag = document.createElement("img");
    lflag.setAttribute("src", "img/flags/" + country + "-flag.jpg");
    lflag.setAttribute(
      "style",
      "left: " +
        (stave.getX() + 90) +
        "px; top: " +
        (stave.getY() + 80 - i * 10) +
        "px; height: 9px"
    );
    document.body.appendChild(lflag);

    let rflag = document.createElement("img");
    rflag.setAttribute("src", "img/flags/" + country + "-flag.jpg");
    rflag.setAttribute(
      "style",
      "left: " +
        (stave.getX() + 135 + BARWIDTH * time) +
        "px; top: " +
        (stave.getY() + 80 - i * 10) +
        "px; height: 9px"
    );
    document.body.appendChild(rflag);
  }
}

function drawYear(c, y, years, time, shows, librettists, operas) {
  // get all shows in that year
  // TODO put that where the staves are created!!!
  let timeperiod;
  if (SHOWFULLTIMELINE) {
    timeperiod = DATA_OVERALL_TIMESPAN;
  } else {
    timeperiod = time;
  }
  let fullYearList = Array.from(new Array(timeperiod), (x, i) => i + years[0]);
  let showsInYear = shows
    .map((show) => {
      if (parseInt(show["performance_year"]) == fullYearList[y]) {
        return show;
      }
    })
    .filter((show) => show !== undefined);

  // draw the bar of the current year
  let startXAfterFirst;
  if (FITTIMELINE) {
    startXAfterFirst =
      STARTX + FIRSTBARWIDTH + (Math.min(...years) - 1775) * BARWIDTH;
  } else {
    startXAfterFirst = STARTX + FIRSTBARWIDTH;
  }

  let barX =
    startXAfterFirst +
    (y * (STAVEWIDTH - FIRSTBARWIDTH)) / DATA_OVERALL_TIMESPAN;
  if (GRANDSTAFF) {
    let barY = STARTY + 2 * c * STAVEDISTANCE;
    var stave = new Stave(barX, barY, BARWIDTH);
    var stave2 = new Stave(barX, barY + STAVEDISTANCE, BARWIDTH);
    stave2.setContext(context).draw();
  } else {
    let barY = STARTY + c * STAVEDISTANCE;
    var stave = new Stave(barX, barY, BARWIDTH);
  }

  // write the years below the stave
  if (y == 0 || y == time - 1 || fullYearList[y] % 5 == 0) {
    // maybe in if condition: fullYearList[y] % 5 == 0 ||
    stave.setText(fullYearList[y], Modifier.Position.BELOW);
  }
  stave.setContext(context).draw();

  // ==============================================================
  // Draw information as notes for each composer
  // ==============================================================
  // represent each show as a note
  // note by country/place TODO: which one
  // note length by librettist
  countries = getInformation(shows, "country", true);
  librettists = getInformation(shows, "librettist", true);
  operas = getInformation(shows, "title", true);
  // [pairs, histogram,,] = createPairs(countries, librettists);

  // only draw notes, when there are notes to draw... else draw pause
  if (showsInYear.length > 0) {
    // note specifics
    let keys = showsInYear.map(
      (show) =>
        countryNoteMap[
          countries.findIndex((element) => element === show["country"])
        ]
    );
    let durations = showsInYear.map(
      (show) =>
        librettistDurationMap[
          librettists.findIndex((element) => element === show["librettist"])
        ]
    );

    // get all the notes
    // number of notes per composer is all their operas
    notes = [];
    for (let s = 0; s < showsInYear.length; s++) {
      notes.push(
        new StaveNote({
          keys: [keys[s]],
          duration: [durations[s]],
        })
      );
    }

    // TODO sort and connect the librettists with beams
    // var beams = Beam.generateBeams(notes, { stem_direction: 1 });
    var beams = Beam.generateBeams(notes, {
      groups: [new Fraction(time, 4)],
    });
    Formatter.FormatAndDraw(context, stave, notes, false);
    beams.forEach(function (beam) {
      beam.setContext(context).draw();
    });
  }
}

function main() {
  if (typeof dataset != "undefined" && dataset.length != 0) {
    data = prepareData(dataset);
    drawPartiture();
  }
}

main();
