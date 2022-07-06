// ========================================================================
// vexflow import/setup
// ========================================================================
const {
  Beam,
  Formatter,
  Fraction,
  Modifier,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  TextNote,
  TextJustification,
} = Vex.Flow;

// ========================================================================
// use a font that looks handwritten
// ========================================================================
Vex.Flow.setMusicFont("Petaluma");

// ========================================================================
// opera data constants
// ========================================================================
const STARTYEAR = 1775;
const DATAOVERALLTIMESPAN = 59; // 59 years between 1775 and 1833
const DATANUMCOMPOSERS = 10;

// ========================================================================
// flag constants
// ========================================================================

const FLAGHEIGHT = 10;
const FLAGWIDTH = 35;
const FLAGTOPOFFSET = 74;

// ========================================================================
// option bools (config)
// ========================================================================
const PARTITURE = false;
let FITTIMELINE = true;
let SHOWFULLTIMELINE = true;

FITTIMELINE = PARTITURE ? false : FITTIMELINE; // only effective when PARTITURE = false;
SHOWFULLTIMELINE = PARTITURE ? true : SHOWFULLTIMELINE; // only effective when FITTIMELINE = false;
SHOWFULLTIMELINE = FITTIMELINE ? false : SHOWFULLTIMELINE; // only effective when FITTIMELINE = false;

const GRANDSTAFF = true;
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
const BARWIDTH = (STAVEWIDTH - FIRSTBARWIDTH) / DATAOVERALLTIMESPAN;

const SHEETHEIGHT = GRANDSTAFF
  ? 2 * (DATANUMCOMPOSERS * STAVEDISTANCE + STARTY)
  : DATANUMCOMPOSERS * STAVEDISTANCE + 2 * STARTY;

// ========================================================================
// aesthetics
// ========================================================================
// there are at max 4 librettists for one componist
let librettistDurationMap = [2, 4, 8, 16]; //[4, 2, 8, 1];

// there are at max 6 different countries for one composer
// such that more frequent countries are in the middle of the stave
let countryNoteMap = ["b/4", "d/5", "g/4", "f/5", "e/4"];
// order seen from ascending order e,g,b,d,f or notes
let countryNoteMapIndices = [2, 3, 1, 4, 0];

let birthYears = {
  "Anfossi" : 1727,
  "Cimarosa" : 1749,
  "Martín" : 1754,
  "Mayr" : 1763,
  "Meyerbeer" : 1791,
  "Mozart" : 1756,
  "Piccinni" : 1728,
  "Paisiello" : 1740,
  "Rossini" : 1792,
  "Salieri" : 1750
}

let deathYears = {
  "Anfossi" : 1797,
  "Cimarosa" : 1801,
  "Martín" : 1806,
  "Mayr" : 1845,
  "Meyerbeer" : 1864,
  "Mozart" : 1791 ,
  "Piccinni" : 1800,
  "Paisiello" : 1816,
  "Rossini" : 1868,
  "Salieri" : 1825
}

// marking the bars with notes
const MARKCOLOR = "black";
const NONMARKCOLOR = "black";
const RESTCOLOR = "silver";

// ========================================================================
// variables
// ========================================================================

let stave = null;
let stave2 = null;
let firstStave = null;
let lastStave = null;
let firstStaves = [];
let lastStaves = [];

const REST = new StaveNote({
  keys: ["d/5"],
  duration: ["1r"],
  align_center: true,
}).setStyle({ fillStyle: RESTCOLOR });

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

  let lastName = getLastName(composerName);

  // draw the first bars of the stave
  let setFirstStaveAtX;
  if (FITTIMELINE) {
    setFirstStaveAtX = years[0] - STARTYEAR;
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
    stave.setText(lastName, Modifier.Position.LEFT);
  }

  stave
    .addTimeSignature(operas.length + "/" + [...new Set(librettists)].length)
    .addClef("treble")
    .setContext(context);

  if (INVERSECOLORS) {
    stave.context.setStrokeStyle("white");
    stave.context.setFillStyle("white");
    output.className = "output-inverse";
  } else {
    stave.context.setStrokeStyle(NONMARKCOLOR);
    stave.context.setFillStyle(NONMARKCOLOR);
    output.className = "output";
  }

  stave.draw();

  let conn_single;
  let conn_double;
  let conn_brace;

  if (GRANDSTAFF) {
    stave2
      .addTimeSignature(years.length + "/" + time)
      .addClef("bass")
      .setContext(context)
      .draw();

    // draw left-side brace and name
    conn_brace = new StaveConnector(stave, stave2);
    conn_brace
      .setType(StaveConnector.type.BRACE)
      .setText(lastName, Modifier.Position.LEFT)
      .setContext(context)
      .draw();
  } else {
    stave.setText(lastName, Modifier.Position.LEFT);
    stave2 = stave;
  }

  if (PARTITURE) {
    if (c == 0) {
      firstStave = stave;
    } else if (c == data["numComposers"] - 1) {
      lastStave = stave2;
      conn_single = new StaveConnector(firstStave, lastStave);
      conn_single
        .setType(StaveConnector.type.SINGLE_RIGHT)
        .setContext(context)
        .draw();
      conn_single
        .setType(StaveConnector.type.SINGLE_LEFT)
        .setContext(context)
        .draw();
      conn_double = new StaveConnector(firstStave, lastStave);
      conn_double
        .setType(StaveConnector.type.DOUBLE)
        .setContext(context)
        .draw();
    }
  } else {
    conn_single = new StaveConnector(stave, stave2);
    conn_single
      .setType(StaveConnector.type.SINGLE_RIGHT)
      .setContext(context)
      .draw();
    conn_single
      .setType(StaveConnector.type.SINGLE_LEFT)
      .setContext(context)
      .draw();
    conn_double = new StaveConnector(stave, stave2);
    conn_double.setType(StaveConnector.type.DOUBLE).setContext(context).draw();
  }

  // get name element
  let els = Array.from(document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text"));
  let el = els.find((e) => e.innerHTML == lastName);

  // write birth and death year
  let birthDeath = el.cloneNode(false);
  birthDeath.innerHTML = birthYears[lastName] + " - " + deathYears[lastName];
  birthDeath.setAttribute("y", +el.getAttribute("y") + 20);
  birthDeath.setAttribute("font-size", "12px");
  el.parentElement.appendChild(birthDeath);
  
  // draw composer image
  let img = document.createElement("img");
  img.setAttribute("src", "img/composers/" + lastName + ".jpg");
  let style = "top: " + (stave.getY() + 30) + "px; "
            + "left: " + (stave.getX() - 80) + "px;";
  img.setAttribute("style", style);
  img.setAttribute("class", "composer");
  document.body.appendChild(img);

  // order the countries by number of shows
  allCountries = getInformation(dataset, "country", true);
  allCountries = allCountries.sort((a, b) => {
    return (
      dataset.filter((show) => show["country"] === b).length -
      dataset.filter((show) => show["country"] === a).length
    );
  });

  // ==============================================================
  // Draw a bar for each year
  // ==============================================================
  if (SHOWFULLTIMELINE) {
    for (let y = 0; y < DATAOVERALLTIMESPAN; y++) {
      drawYear(c, y, years, time, shows, operas, allCountries);
    }
  } else {
    for (let y = 0; y < time; y++) {
      drawYear(c, y, years, time, shows, operas, allCountries);
    }
  }
}

function drawYear(c, y, years, time, shows, operas, allCountries) {
  // get all shows in that year
  // TODO put that where the staves are created!!!
  let fullYearList;
  if (SHOWFULLTIMELINE) {
    fullYearList = Array.from(
      new Array(DATAOVERALLTIMESPAN),
      (x, i) => i + STARTYEAR
    );
  } else {
    fullYearList = Array.from(new Array(time), (x, i) => i + years[0]);
  }

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
      STARTX + FIRSTBARWIDTH + (Math.min(...years) - STARTYEAR) * BARWIDTH;
  } else {
    startXAfterFirst = STARTX + FIRSTBARWIDTH;
  }

  let barX =
    startXAfterFirst + (y * (STAVEWIDTH - FIRSTBARWIDTH)) / DATAOVERALLTIMESPAN;
  if (GRANDSTAFF) {
    let barY = STARTY + 2 * c * STAVEDISTANCE;
    var stave = new Stave(barX, barY, BARWIDTH);
    var stave2 = new Stave(barX, barY + STAVEDISTANCE, BARWIDTH);
    stave2.setContext(context).draw();
  } else {
    let barY = STARTY + c * STAVEDISTANCE;
    var stave = new Stave(barX, barY, BARWIDTH);
    stave2 = stave;
  }

  // write the years below the stave
  if (y == 0 || y == time - 1 || fullYearList[y] % 5 == 0) {
    stave.setMeasure(fullYearList[y]);
  }
  stave.setContext(context);
  stave.context.setStrokeStyle(MARKCOLOR);
  stave.context.setFillStyle(MARKCOLOR);
  stave.draw();

  if (PARTITURE) {
    if (c == 0) {
      firstStaves.push(stave);
    } else if (c == data["numComposers"] - 1) {
      lastStaves.push(stave2);
      conn_single = new StaveConnector(firstStaves[y], lastStaves[y]);
      conn_single
        .setType(StaveConnector.type.SINGLE_RIGHT)
        .setContext(context)
        .draw();
    }
  } else {
    conn_single = new StaveConnector(stave, stave2);
    conn_single
      .setType(StaveConnector.type.SINGLE_RIGHT)
      .setContext(context)
      .draw();
  }

  // ==============================================================
  // Draw information as notes and flags for each composer
  // ==============================================================
  // represent each show as a note
  // note height by country with flags
  // note length by librettist
  countries = getInformation(shows, "country", true);
  librettists = getInformation(shows, "librettist", true);
  operas = getInformation(shows, "title", true);
  var notes = [];
  var notes2 = [];
  let isTop = (i) => !(i % 2);

  // draw the country flags
  if (y == 0 || y == time - 1 || fullYearList[y] % 5 == 0) {
    for (let i = 0; i < allCountries.length; i++) {
      let country = allCountries[i];
      if (countries.includes(country)) {
        let flag = document.createElement("img");
        flag.setAttribute("src", "img/flags/" + country + "-flag.jpg");
        let style = "left: " + (stave.getX() - FLAGWIDTH / 2) + "px; top: ";
        if (isTop(i)) {
          style +=
            stave.getY() +
            FLAGTOPOFFSET -
            countryNoteMapIndices[i / 2] * FLAGHEIGHT;
        } else {
          style +=
            stave2.getY() +
            FLAGTOPOFFSET -
            countryNoteMapIndices[(i - 1) / 2] * FLAGHEIGHT;
        }
        style +=
          "px; height: " + FLAGHEIGHT + "px; width: " + FLAGWIDTH + "px;";
        flag.setAttribute("style", style);
        flag.setAttribute("class", "flag");
        document.body.appendChild(flag);
      }
    }
  }

  // TODO use createPairs()

  // note specifics
  let keys = showsInYear.map(
    (show) =>
      countryNoteMap[
        Math.floor(
          allCountries.findIndex((element) => element === show["country"]) / 2
        )
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
  let order = [];
  let countStave = 0;
  let countStave2 = 0;
  for (let s = 0; s < showsInYear.length; s++) {
    let countryIndex = allCountries.findIndex(
      (element) => element === showsInYear[s]["country"]
    );

    note = new StaveNote({
      keys: [keys[s]],
      duration: [durations[s]],
    }).setStyle({ fillStyle: MARKCOLOR, strokeStyle: MARKCOLOR });

    if (isTop(countryIndex)) {
      notes.push(note);
      order.push([0, countStave++]);
    } else {
      notes2.push(note);
      order.push([1, countStave2++]);
    }
  }

  // fill the bar with a full rest
  if (notes.length == 0) {
    notes.push(REST);
  }
  if (notes2.length == 0) {
    notes2.push(REST);
  }

  // TODO sort and connect the librettists with beams
  // var beams = Beam.generateBeams(notes, { stem_direction: 1 });
  var beams = Beam.generateBeams(notes, {
    groups: [new Fraction(time, 4)],
  });
  Formatter.FormatAndDraw(context, stave, notes, false);
  Formatter.FormatAndDraw(context, stave2, notes2, false);
  beams.forEach(function (beam) {
    beam.setContext(context).draw();
  });

  // Add tooltips
  for (let s = 0; s < showsInYear.length; s++) {
    let show = showsInYear[s];
    let note = !order[s][0] ? notes[order[s][1]] : notes2[order[s][1]];
    let title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.innerHTML =
      "Titel: " +
      show["title"] +
      "\nLibrettist: " +
      show["librettist"] +
      "\nOrt: " +
      show["placename"];
    note.attrs.el.appendChild(title);
  }
}

function main() {
  if (typeof dataset != "undefined" && dataset.length != 0) {
    data = prepareData(dataset);
    drawPartiture();
  }
}

main();
