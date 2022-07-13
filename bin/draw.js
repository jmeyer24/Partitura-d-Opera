// ========================================================================
// Import helper functions
// ========================================================================

import {
  getSortIndices,
  getLastName,
  createPairs,
  getInformation,
} from "./functions.js";

// ========================================================================
// Vexflow import/setup
// ========================================================================

const {
  Beam,
  Dot,
  Formatter,
  Fraction,
  KeySignature,
  Modifier,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  TextNote,
  TextJustification,
} = Vex.Flow;

// ========================================================================
// Use a font that looks handwritten
// ========================================================================

Vex.Flow.setMusicFont("Petaluma");

// ========================================================================
// Opera data constants
// ========================================================================

const STARTYEAR = 1775;
const DATAOVERALLTIMESPAN = 59; // 59 years between 1775 and 1833
const DATANUMCOMPOSERS = 10;

// ========================================================================
// Flag constants
// ========================================================================

const FLAGWIDTH = 30;
const FLAGHEIGHT = 3 / 4 * FLAGWIDTH;
const FLAGLEFTOFFSET = 93;
const FLAGTOPOFFSET = 39;
const FLAGBETWEEN = 25;
const LINEBETWEEN = 5;
// const FLAGTOPOFFSET = 74;

// ========================================================================
// Option bools (config)
// ========================================================================

const ASCENDINGDURATIONS = false;
const PARTITURE = false;
let FITTIMELINE = true;
let SHOWFULLTIMELINE = true;

FITTIMELINE = PARTITURE ? false : FITTIMELINE; // only effective when PARTITURE = false;
SHOWFULLTIMELINE = PARTITURE ? true : SHOWFULLTIMELINE; // only effective when FITTIMELINE = false;
SHOWFULLTIMELINE = FITTIMELINE ? false : SHOWFULLTIMELINE; // only effective when FITTIMELINE = false;

const GRANDSTAFF = true;
const INVERSECOLORS = false;

// ========================================================================
// Constants
// ========================================================================

const SHEETWIDTH = 15000;
const STARTX = 180;
const STARTY = 50;
const STAVEWIDTH = SHEETWIDTH - 1.5 * STARTX;
const STAVEDISTANCE = 100;
const FIRSTBARWIDTH = 10 * FLAGBETWEEN + 100; // 380;
const BARWIDTH = (STAVEWIDTH - FIRSTBARWIDTH) / DATAOVERALLTIMESPAN;

const SHEETHEIGHT = GRANDSTAFF
  ? 2 * (DATANUMCOMPOSERS * STAVEDISTANCE + STARTY)
  : DATANUMCOMPOSERS * STAVEDISTANCE + 2 * STARTY;

const IMAGESIZE = 50;
const BIRTHDEATHFONTSIZE = 12;

// ========================================================================
// Aesthetics
// ========================================================================

// there are at max 4 librettists for one componist
// there are 8 librettists total
// make dotted notes to show all
// first elements are used as note durations for most frequent librettist
// -> reverse, such that shortest duration for most frequent
let librettistDurationMap = [2, 4, 8, 16].reverse(); // [8, 16, 32, 64].reverse();

// there are at max 6 different countries for one composer
// such that more frequent countries are in the middle of the stave
let noteList = ["f/5", "e/5", "d/5", "c/5", "b/4", "a/4", "g/4", "f/4", "e/4", "d/4"].reverse();
let countryNoteOrder = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
let countryNoteMap = countryNoteOrder.map((note) => noteList[note]);

let birthYears = {
  Anfossi: 1727,
  Cimarosa: 1749,
  Martín: 1754,
  Mayr: 1763,
  Meyerbeer: 1791,
  Mozart: 1756,
  Piccinni: 1728,
  Paisiello: 1740,
  Rossini: 1792,
  Salieri: 1750,
};

let deathYears = {
  Anfossi: 1797,
  Cimarosa: 1801,
  Martín: 1806,
  Mayr: 1845,
  Meyerbeer: 1864,
  Mozart: 1791,
  Piccinni: 1800,
  Paisiello: 1816,
  Rossini: 1868,
  Salieri: 1825,
};

// marking the bars with notes
const MARKCOLOR = "black";
const NONMARKCOLOR = "black";
const RESTCOLOR = "silver";

// ========================================================================
// Variables
// ========================================================================

var stave = null;
var stave2 = null;
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
// Create an SVG renderer and attach it to the DIV element named "output".
// ========================================================================

const renderer = new Renderer($("#output")[0], Renderer.Backends.SVG);
renderer.resize(SHEETWIDTH, SHEETHEIGHT);

// ========================================================================
// Configure the rendering context.
// ========================================================================

const context = renderer.getContext();

// ========================================================================
// Draw the partiture
// ========================================================================

function drawPartiture() {
  context.clear();

  // Draw a stave for each composer
  for (let c = 0; c < DATANUMCOMPOSERS; c++) {
    drawComposer(c);
  }
}

function drawComposer(c) {

  // ========================================================================
  // Datafiltering
  // ========================================================================

  // get all librettist a composer worked with, his operas, countries and years his shows were performed in
  var allCountries = getInformation(dataset, "country", true, true);
  var allLibrettists = getInformation(dataset, "librettist", true, true);
  var shows = dataset.filter(
    (singleData) => singleData["composerMap"] == c + 1
  );
  var lastName = getLastName(shows[0]["composer"]);
  var years = getInformation(shows, "performance_year", true);
  years = years.map(Number).sort();
  let timespan = Math.max(...years) - Math.min(...years) + 1;
  var countries = getInformation(shows, "country", true, true, dataset);
  var librettists = getInformation(shows, "librettist", true);
  var operas = getInformation(shows, "title", true);
  let conn_single;
  let conn_double;
  let conn_brace;

  // ==============================================================
  // Create the first bars of the stave
  // ==============================================================

  let setFirstStaveAtX;
  if (FITTIMELINE) {
    setFirstStaveAtX = years[0] - STARTYEAR;
  } else {
    setFirstStaveAtX = 0;
  }
  if (GRANDSTAFF) {
    stave = new Stave(
      STARTX + setFirstStaveAtX * BARWIDTH,
      STARTY + 2 * c * STAVEDISTANCE,
      FIRSTBARWIDTH
    );
    stave2 = new Stave(
      STARTX + setFirstStaveAtX * BARWIDTH,
      STARTY + (2 * c + 1) * STAVEDISTANCE,
      FIRSTBARWIDTH
    );
  } else {
    stave = new Stave(
      STARTX + setFirstStaveAtX * BARWIDTH,
      STARTY + c * STAVEDISTANCE,
      FIRSTBARWIDTH
    );
  }

  stave
    .addTimeSignature(operas.length + "/" + librettists.length)
    .addClef("treble")
    .setContext(context);

  // ==============================================================
  // Enable color inversion
  // ==============================================================

  if (INVERSECOLORS) {
    stave.context.setStrokeStyle("white");
    stave.context.setFillStyle("white");
    output.className = "output-inverse";
  } else {
    stave.context.setStrokeStyle(NONMARKCOLOR);
    stave.context.setFillStyle(NONMARKCOLOR);
    output.className = "output";
  }

  // ==============================================================
  // Draw left-side brace and name
  // ==============================================================

  if (GRANDSTAFF) {
    stave2
      .addTimeSignature(years.length + "/" + timespan)
      .addClef("bass")
      .setContext(context)

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

  // ==============================================================
  // Refine stave annotation with image and years
  // ==============================================================

  // get text element with composer name
  let el = $(document)
    .find("text:contains('" + lastName + "')")
  // TODO: why isnt this working?
  // el.wrap("<g class='stave-annotation' id='annotation-" + lastName + "'></g>");

  // write birth and death year
  let birthDeath = el
    .clone()
    .html(birthYears[lastName] + " - " + deathYears[lastName])
    .css("font-size", BIRTHDEATHFONTSIZE)
    .appendTo(el.parent());
  birthDeath
    .attr({
      "x": + el.attr("x") + (el[0].textLength.baseVal.value - birthDeath[0].textLength.baseVal.value) / 2,
      "y": + el.attr("y") + BIRTHDEATHFONTSIZE
    });

  // draw composer image
  $(document.createElementNS('http://www.w3.org/2000/svg', 'image'))
    .addClass("composer")
    .attr({
      'href': "img/composers/" + lastName + ".png",
      "x": + el.attr("x") + (el[0].textLength.baseVal.value - IMAGESIZE) / 2,
      "y": + el.attr("y") - parseInt(el.attr("font-size")) - IMAGESIZE
    })
    .appendTo(el.parent());

  // ==============================================================
  // Draw the country flags in the order given by countryNoteOrder
  // ==============================================================

  const drawFlag = (boolInclude, className) => {
    let flag;
    for (let i = 0; i < allCountries.length; i++) {
      // create one empty flag element
      if (boolInclude == countries.includes(allCountries[i])) {
        let j = 9 - countryNoteOrder[i];
        flag = $(document.createElement("img"));
        flag
          .addClass(className)
          .css({
            "left": stave.getX() + FLAGLEFTOFFSET + i * FLAGBETWEEN - FLAGWIDTH / 2,
            "top": stave.getY() + FLAGTOPOFFSET + j * LINEBETWEEN - FLAGHEIGHT / 2,
            "height": FLAGHEIGHT,
            "width": FLAGWIDTH
          })
          .appendTo("body");
        if (boolInclude) {
          flag
            .attr({
              "src": "./img/flags/" + allCountries[i] + "-flag.jpg",
            });
        }
      }
    }
  }
  drawFlag(false, "no-flag");
  drawFlag(true, "flag");

  // // TODO: make this work so the images are in relation to the stave in the DOM?
  //   $(document.createElementNS("http://www.w3.org/2000/svg", "image"))
  //     .addClass("flag")
  //     .attr({
  //       "href": "./img/flags/" + allCountries[i] + "-flag.jpg",
  //       "x": stave.getX() + FLAGLEFTOFFSET + i * FLAGBETWEEN - FLAGWIDTH / 2,
  //       "y": stave.getY() + FLAGTOPOFFSET + i * 5 - FLAGHEIGHT / 2,
  //     })
  //     .css({
  //       "height": FLAGHEIGHT,
  //       "width": FLAGWIDTH
  //     })
  //     .appendTo(el.parent());
  // }

  // ==============================================================
  // Draw the connectors
  // ==============================================================

  if (PARTITURE) {
    if (c == 0) {
      firstStave = stave;
    } else if (c == DATANUMCOMPOSERS - 1) {
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

  // ==============================================================
  // Finally: Draw the first stave
  // ==============================================================
  stave.draw();
  stave2.draw();

  // ==============================================================
  // Draw a bar for each year
  // ==============================================================
  const drawYearFilled = y => drawYear(c, y, years, timespan, shows, operas, allCountries, allLibrettists);
  if (SHOWFULLTIMELINE) {
    for (let y = 0; y < DATAOVERALLTIMESPAN; y++) {
      drawYearFilled(y);
    }
  } else {
    for (let y = 0; y < timespan; y++) {
      drawYearFilled(y);
    }
  }
}

function drawYear(
  c,
  y,
  years,
  timespan,
  shows,
  operas,
  allCountries,
  allLibrettists
) {

  // ========================================================================
  // Datafiltering
  // ========================================================================

  let conn_single;
  var notes = [];
  var notes2 = [];
  // TODO put that where the staves are created!!!
  let fullYearList;
  if (SHOWFULLTIMELINE) {
    fullYearList = Array.from(
      new Array(DATAOVERALLTIMESPAN),
      (x, i) => i + STARTYEAR
    );
  } else {
    fullYearList = Array.from(new Array(timespan), (x, i) => i + years[0]);
  }
  let showsInYear = shows
    // filter the shows in the current year
    .filter(
      (show) =>
        show !== undefined &&
        parseInt(show["performance_year"]) == fullYearList[y]
    )
    // sort the shows by the frequency of the librettists
    .sort((a, b) => {
      var helper = (x) =>
        librettistDurationMap[
        Math.floor(
          allLibrettists.findIndex((element) => element === x["librettist"]) /
          2
        )
        ];
      var al = helper(a);
      var bl = helper(b);
      if (ASCENDINGDURATIONS) {
        return al === bl ? 0 : al < bl ? 1 : -1;
      } else {
        return al === bl ? 0 : al < bl ? -1 : 1;
      }
    });

  // ========================================================================
  // Create the bar of the current year
  // ========================================================================

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
    stave = new Stave(barX, barY, BARWIDTH);
    stave2 = new Stave(barX, barY + STAVEDISTANCE, BARWIDTH);
    stave2.setContext(context).draw();
  } else {
    let barY = STARTY + c * STAVEDISTANCE;
    stave = new Stave(barX, barY, BARWIDTH);
    stave2 = stave;
  }

  // ========================================================================
  // Write the years as the bar measure
  // ========================================================================

  if (y == 0 || y == timespan - 1 || fullYearList[y] % 5 == 0) {
    stave.setMeasure(fullYearList[y]);
  }

  // ==============================================================
  // Draw the connectors
  // ==============================================================

  if (PARTITURE) {
    if (c == 0) {
      firstStaves.push(stave);
    } else if (c == DATANUMCOMPOSERS - 1) {
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

  // TODO use createPairs()

  // ========================================================================
  // Create all notes of a year
  // ========================================================================

  // represent each show as a note
  // note height by country with flags
  // note length by librettist

  // note specifics
  let keys = showsInYear.map(
    (show) =>
      countryNoteMap[
      allCountries.findIndex((element) => element === show["country"])
      ]
  );
  // librettists sorted by frequency
  let durations = showsInYear.map(
    (show) =>
      librettistDurationMap[
      Math.floor(
        allLibrettists.findIndex(
          (element) => element === show["librettist"]
        ) / 2
      )
      ]
  );
  // every 2nd librettist has a dotted note
  let dots = showsInYear.map(
    (show) =>
      [false, true][
      allLibrettists.findIndex((element) => element === show["librettist"]) %
      2
      ]
  );

  // number of notes per composer is all their operas
  for (let s = 0; s < showsInYear.length; s++) {
    var note = new StaveNote({
      keys: [keys[s]],
      duration: [durations[s]],
    }).setStyle({ fillStyle: MARKCOLOR, strokeStyle: MARKCOLOR });
    if (dots[s]) {
      Dot.buildAndAttach([note], { all: true });
    }

    notes.push(note);
  }

  // ========================================================================
  // Fill the bar with a rests
  // ========================================================================

  if (notes.length == 0) {
    notes.push(REST);
  }
  if (notes2.length == 0) {
    notes2.push(REST);
  }

  // ========================================================================
  // Create beams
  // ========================================================================

  // TODO sort and connect the librettists with beams
  // var beams = Beam.generateBeams(notes, { stem_direction: 1 });
  // var beams2 = Beam.generateBeams(notes2, { stem_direction: -1 });
  var beams = Beam.generateBeams(notes, {
    groups: [new Fraction(2, 4)],
  });

  // ========================================================================
  // Finally: Draw the stave and format stave with notes
  // ========================================================================

  // draw the stave
  stave.setContext(context);
  stave.context.setStrokeStyle(MARKCOLOR);
  stave.context.setFillStyle(MARKCOLOR);
  stave.draw();

  // format stave with notes
  Formatter.FormatAndDraw(context, stave, notes, false);
  Formatter.FormatAndDraw(context, stave2, notes2, false);
  beams.forEach(function (beam) {
    beam.setContext(context).draw();
  });
  // beams2.forEach(function (beam) {
  //   beam.setContext(context).draw();
  // });

  // ========================================================================
  // Add tooltips for each note
  // ========================================================================

  for (let s = 0; s < showsInYear.length; s++) {
    let show = showsInYear[s];
    // set text of tooltip for the current node
    $(document.createElementNS("http://www.w3.org/2000/svg", "title"))
      .html(
        "Titel: " + show["title"] +
        "\nLibrettist: " + show["librettist"] +
        "\nOrt: " + show["placename"]
      )
      .appendTo(notes[s].attrs.el);
  }
}

export { drawPartiture };