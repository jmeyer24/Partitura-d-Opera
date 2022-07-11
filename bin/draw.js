// ========================================================================
// import helper functions
// ========================================================================
import {
  getSortIndices,
  getLastName,
  createPairs,
  getInformation,
} from "./functions.js";

// ========================================================================
// vexflow import/setup
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

const FLAGWIDTH = 30;
const FLAGHEIGHT = 3/4 * FLAGWIDTH;
const FLAGLEFTOFFSET = 93;
const FLAGTOPOFFSET = 39;
const FLAGBETWEEN = 25;
// const FLAGTOPOFFSET = 74;

// ========================================================================
// option bools (config)
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
// constants
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
// aesthetics
// ========================================================================
// there are at max 4 librettists for one componist
// there are 8 librettists total
// make dotted notes to show all
// first elements are used as note durations for most frequent librettist
// -> reverse, such that shortest duration for most frequent
let librettistDurationMap = [2, 4, 8, 16].reverse(); // [8, 16, 32, 64].reverse();

// there are at max 6 different countries for one composer
// such that more frequent countries are in the middle of the stave
// let countryNoteMap = ["b/4", "d/5", "g/4", "f/5", "e/4"];
let countryNoteMap = ["f/5", "e/5", "d/5", "c/5", "b/4", "a/4", "g/4", "f/4", "e/4", "d/4"];
// order seen from ascending order e,g,b,d,f or notes
let countryNoteMapIndices = [2, 3, 1, 4, 0];

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
// Create an SVG renderer and attach it to the DIV element named "output".
// ========================================================================
const output = document.getElementById("output");
const renderer = new Renderer(output, Renderer.Backends.SVG);
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
    .addTimeSignature(operas.length + "/" + librettists.length)
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

  let conn_single;
  let conn_double;
  let conn_brace;

  if (GRANDSTAFF) {
    stave2
      .addTimeSignature(years.length + "/" + timespan)
      .addClef("bass")
      .setContext(context)

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

  // // draw key signature
  // const MAJOR_KEYS = [
  //   'C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
  // ];
  // const MINOR_KEYS = [
  //   'Am', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m',
  // ];
  // // let i = countries.length;
  // stave.addKeySignature(MAJOR_KEYS[5 + 7]);
  // stave.addKeySignature(MAJOR_KEYS[5 + 7]);
  // stave2.addKeySignature(MAJOR_KEYS[5 + 7]);
  // stave2.addKeySignature(MAJOR_KEYS[5 + 7]);

  // get name element
  let els = Array.from(
    document.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text")
  );
  let el = els.find((e) => e.innerHTML == lastName);

  // write birth and death year
  let birthDeath = el.cloneNode(false);
  el.parentElement.appendChild(birthDeath);
  birthDeath.innerHTML = birthYears[lastName] + " - " + deathYears[lastName];
  birthDeath.setAttribute("font-size", BIRTHDEATHFONTSIZE + "px");
  birthDeath.setAttribute("x", +el.getAttribute("x") + (el.textLength.baseVal.value - birthDeath.textLength.baseVal.value) / 2);
  birthDeath.setAttribute("y", +el.getAttribute("y") + BIRTHDEATHFONTSIZE);

  // draw composer image
  var composerImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  el.parentElement.append(composerImage);
  composerImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "img/composers/" + lastName + ".png");
  composerImage.setAttribute("class", "composer");
  composerImage.setAttribute("x", +el.getAttribute("x") + (el.textLength.baseVal.value - IMAGESIZE) / 2);
  composerImage.setAttribute("y", +el.getAttribute("y") - parseInt(el.getAttribute("font-size")) - IMAGESIZE);

  // draw the connectors
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

  // draw the country flags in descending order
  for (let i = 0; i < allCountries.length; i++) {
    if (countries.includes(allCountries[i])) {
      var flagImage = document.createElement('img');
      document.body.appendChild(flagImage);
      let style = "left: " + (stave.getX() + FLAGLEFTOFFSET + i * FLAGBETWEEN - FLAGWIDTH / 2) + "px; top: ";
      style += stave.getY() + FLAGTOPOFFSET + i * 5 - FLAGHEIGHT / 2;
      style += "px; height: " + FLAGHEIGHT + "px; width: " + FLAGWIDTH + "px;";
      flagImage.setAttribute("style", style);
      flagImage.setAttribute("class", "flag");
      flagImage.setAttribute("src", "./img/flags/" + allCountries[i] + "-flag.jpg");
    }
  }

  // draw the first stave now
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
  // get all shows in that year
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
  if (y == 0 || y == timespan - 1 || fullYearList[y] % 5 == 0) {
    stave.setMeasure(fullYearList[y]);
  }
  stave.setContext(context);
  stave.context.setStrokeStyle(MARKCOLOR);
  stave.context.setFillStyle(MARKCOLOR);
  stave.draw();

  let conn_single;

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

  // ==============================================================
  // Draw information as notes and flags for each composer
  // ==============================================================
  // represent each show as a note
  // note height by country with flags
  // note length by librettist
  var notes = [];
  var notes2 = [];
  var isTop = (i) => !(i % 2);

  // TODO: delete when correctly done
  // // draw flags onto the staves 
  // var countries = getInformation(shows, "country", true);
  // if (y == 0 || y == timespan - 1 || fullYearList[y] % 5 == 0) {
  //   for (let i = 0; i < allCountries.length; i++) {
  //     let country = allCountries[i];
  //     if (countries.includes(country)) {
  //       let flag = document.createElement("img");
  //       flag.setAttribute("src", "img/flags/" + country + "-flag.jpg");
  //       let style = "left: " + (stave.getX() - FLAGWIDTH / 2) + "px; top: ";
  //       if (isTop(i)) {
  //         style +=
  //           stave.getY() +
  //           FLAGTOPOFFSET -
  //           countryNoteMapIndices[i / 2] * FLAGHEIGHT;
  //       } else {
  //         style +=
  //           stave2.getY() +
  //           FLAGTOPOFFSET -
  //           countryNoteMapIndices[(i - 1) / 2] * FLAGHEIGHT;
  //       }
  //       style +=
  //         "px; height: " + FLAGHEIGHT + "px; width: " + FLAGWIDTH + "px;";
  //       flag.setAttribute("style", style);
  //       flag.setAttribute("class", "flag");
  //       document.body.appendChild(flag);
  //     }
  //   }
  // }

  // TODO use createPairs()

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

  // get all the notes
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

  // fill the bar with a full rest
  if (notes.length == 0) {
    notes.push(REST);
  }
  if (notes2.length == 0) {
    notes2.push(REST);
  }

  // TODO sort and connect the librettists with beams
  var beams = Beam.generateBeams(notes, { stem_direction: 1 });
  var beams2 = Beam.generateBeams(notes2, { stem_direction: -1 });
  // var beams = Beam.generateBeams(notes, {
  //   groups: [new Fraction(2, 4)],
  // });

  Formatter.FormatAndDraw(context, stave, notes, false);
  Formatter.FormatAndDraw(context, stave2, notes2, false);
  beams.forEach(function (beam) {
    beam.setContext(context).draw();
  });
  beams2.forEach(function (beam) {
    beam.setContext(context).draw();
  });

  // Add tooltips
  for (let s = 0; s < showsInYear.length; s++) {
    let show = showsInYear[s];
    let note = notes[s];
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

export { drawPartiture };
