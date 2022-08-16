// ========================================================================
// Import helper functions
// ========================================================================

import {
  getLastName,
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
  Modifier,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
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
// const NUMFIRSTPAGE = ;
// const NUMSECONDPAGE = ;

// ========================================================================
// Flag constants
// ========================================================================

const FLAGWIDTH = 30;
const FLAGHEIGHT = 3 / 4 * FLAGWIDTH;
const FLAGLEFTOFFSET = 93;
const FLAGTOPOFFSET = 39;
const FLAGBETWEEN = 25;
const LINEBETWEEN = 5;

// ========================================================================
// Map constants
// ========================================================================

const latitudeMap = [15, 100, 157, 161, 177, 210, 248, 256, 287, 435];
let latitudeMapBeginning = [];
for (let i = 0; i < 10; i++) {
  latitudeMapBeginning[i] = 205.5 + i * LINEBETWEEN;
}
const lengthMap = [557, 88, 353, 196, 253, 309, 297, 158, 250, 298];
const lineBeg = 75;

// ========================================================================
// Option bools (config)
// ========================================================================

// TODO
const ASCENDINGDURATIONS = false;

// ========================================================================
// Layout constants
// ========================================================================

const SHEETWIDTH = 7000; // TODO: set to 10000
const STARTX = 180;
const STARTY = 50; // TODO: 250

const SHEETHEIGHT = parseInt((5 / 7) * SHEETWIDTH); // is then 5000 with 7000 width
// const SHEETHEIGHT = 2 * (DATANUMCOMPOSERS * INTERSTAVEDISTANCE + STARTY)

const STAVEWIDTH = SHEETWIDTH - 1.5 * STARTX;

const PAGES = 2;
const BARSPERPAGE = Math.ceil(DATAOVERALLTIMESPAN / PAGES); // 30
const FIRSTBARWIDTH = 10 * FLAGBETWEEN + 100; // 380;
const BARWIDTH = (STAVEWIDTH - FIRSTBARWIDTH) / BARSPERPAGE;

const INTERSTAVEDISTANCE = (SHEETHEIGHT - STARTY) / (DATANUMCOMPOSERS * PAGES + 1); // 200;
const INTERPAGEDISTANCE = INTERSTAVEDISTANCE;
const INTRASTAVEDISTANCE = INTERSTAVEDISTANCE / 2 - 25;

const IMAGESIZE = 50;
const COMPOSERFONTSIZE = 18; // is x-large
const BIRTHDEATHFONTSIZE = 15;
const YEARFONTSIZE = 12;

// ========================================================================
// Aesthetics
// ========================================================================

// there are at max 4 librettists for one componist
// there are 8 librettists total
// make dotted notes to show all
// first elements are used as note durations for most frequent librettist
// -> reverse, such that shortest duration for most frequent
const librettistDurationMap = [2, 4, 8, 16].reverse(); // [8, 16, 32, 64].reverse();

// there are at max 6 different countries for one composer
// such that more frequent countries are in the middle of the stave

// by frequency from middle to rural lines
// let DESCENDINGFLAGS = true;
// let noteList = ["f/5", "e/5", "d/5", "c/5", "b/4", "a/4", "g/4", "f/4", "e/4", "d/4"].reverse();
// let countryNoteOrder = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9]; 

// by latitude of country (when sorted by frequency in allCountries)
const DESCENDINGFLAGS = false;
const noteList = ["f/5", "e/5", "d/5", "c/5", "b/4", "a/4", "g/4", "f/4", "e/4", "d/4"];
const countryNoteOrder = [8, 4, 6, 0, 7, 2, 5, 1, 3, 9]; // not anymore!!! xxx ['Italien', 'Deutschland', 'Oesterreich', 'Russland', 'Frankreich', 'Polen', 'Tschechien', 'England', 'Niederlande', 'Malta'] 
const countryNoteMap = countryNoteOrder.map((note) => noteList[note]);
const birthYears = {
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
const deathYears = {
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

// ========================================================================
// Note and rest variables
// ========================================================================

var stave = null;
var stave2 = null;

const RESTCOLOR = "silver";
const REST = new StaveNote({
  keys: ["d/5"],
  duration: ["1r"],
  align_center: true,
}).setStyle({ fillStyle: RESTCOLOR });

// ========================================================================
// Create an SVG renderer and attach it to the DIV element named "output"
// and configure the rendering context.
// ========================================================================

const renderer = new Renderer($("#partiture")[0], Renderer.Backends.SVG)
  .resize(SHEETWIDTH, SHEETHEIGHT);
const context = renderer.getContext();
// context.setFont("Monotype Corsiva", 12);

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
  var shows = dataset.filter(
    (singleData) => singleData["composerMap"] == c + 1
  );
  var years = getInformation(shows, "performance_year", true);
  years = years.map(Number).sort();
  let timespan = Math.max(...years) - Math.min(...years) + 1;
  var lastName = getLastName(shows[0]["composer"]);

  // ========================================================================
  // First Bar Positioning (respective to timeline indented and page)
  // ========================================================================

  let relativeStartYear = (years[0] - STARTYEAR);
  let currentPage = Math.floor(relativeStartYear / BARSPERPAGE);

  // let firstBarX = STARTX + (relativeStartYear % BARSPERPAGE) * BARWIDTH;
  let firstBarX = STARTX;
  // let firstBarY = STARTY + ((DATANUMCOMPOSERS - 2) * currentPage + c) * INTERSTAVEDISTANCE;
  let firstBarY = STARTY + c * INTERSTAVEDISTANCE;

  // ==============================================================
  // Draw first bar and a bar for each year
  // ==============================================================

  for (let i = 0; i < PAGES; i++) {
    drawFirstStave(i, years, timespan, shows, allCountries, lastName, firstBarX, firstBarY);
  }
  const drawYearFilled = y => drawYear(y, years, timespan, shows, allCountries, lastName, firstBarX, firstBarY);
  for (let y = 0; y < timespan; y++) {
    drawYearFilled(y);
  }
}

function drawFirstStave(
  pageNum,
  years,
  timespan,
  shows,
  allCountries,
  lastName,
  firstBarX,
  firstBarY
) {
  let countries = getInformation(shows, "country", true, true, dataset);
  let librettists = getInformation(shows, "librettist", true);
  let operas = getInformation(shows, "title", true);

  // ==============================================================
  // Create the first bars of the stave
  // ==============================================================

  let currBarY = firstBarY + pageNum * (DATANUMCOMPOSERS * INTERSTAVEDISTANCE + INTERPAGEDISTANCE);

  stave = new Stave(
    firstBarX,
    currBarY,
    FIRSTBARWIDTH
  )
    .addTimeSignature(operas.length + "/" + librettists.length)
    .addClef("treble")
    .setContext(context);
  stave2 = new Stave(
    firstBarX,
    currBarY + INTRASTAVEDISTANCE,
    FIRSTBARWIDTH
  );

  // ==============================================================
  // Draw left-side brace and name
  // ==============================================================

  stave2
    .addTimeSignature(years.length + "/" + timespan)
    .addClef("bass")
    .setContext(context)

  new StaveConnector(stave, stave2)
    .setType(StaveConnector.type.BRACE)
    .setText(lastName, Modifier.Position.LEFT)
    // .setFontSize("18pt")
    .setFontSize(COMPOSERFONTSIZE)
    .setContext(context)
    .draw();

  // ==============================================================
  // Refine stave annotation with image and years
  // ==============================================================

  // get text element with composer name
  let el = $(document)
    .find("text:contains('" + lastName + "')")
  // .find("text:contains('" + lastName + "'):nth-child(" + pageNum + ")")

  // write birth and death year
  let birthDeath = el
    .clone()
    .html(birthYears[lastName] + " - " + deathYears[lastName])
    .css("font-size", BIRTHDEATHFONTSIZE)
    .appendTo(el.parent());
  birthDeath
    .attr({
      "x": + el.attr("x") + (el[0].textLength.baseVal.value - birthDeath[0].textLength.baseVal.value) / 2,
      "y": + el.attr("y") + BIRTHDEATHFONTSIZE + pageNum * (DATANUMCOMPOSERS * INTERSTAVEDISTANCE + INTERPAGEDISTANCE)
    });

  // draw composer image
  $(document.createElementNS('http://www.w3.org/2000/svg', 'image'))
    .addClass("composer")
    .attr({
      'href': "img/composers/" + lastName + ".png",
      "x": + el.attr("x") + (el[0].textLength.baseVal.value - IMAGESIZE) / 2,
      "y": + el.attr("y") - parseInt(el.attr("font-size")) - IMAGESIZE + pageNum * (DATANUMCOMPOSERS * INTERSTAVEDISTANCE + INTERPAGEDISTANCE)
    })
    .appendTo(el.parent());

  // ==============================================================
  // Draw the country flags in the order given by countryNoteOrder
  // ==============================================================

  const drawFlag = (className, parentToBe) => {
    let flag;
    let boolInclude = (className == "flag") ? true : false;
    for (let i = 0; i < allCountries.length; i++) {
      // create one empty flag element
      if (boolInclude == countries.includes(allCountries[i])) {
        let j;
        if (DESCENDINGFLAGS) {
          j = 9 - countryNoteOrder[i];
        } else {
          j = countryNoteOrder[i];
        }
        flag = $(document.createElement("img"))
          .addClass(className)
          .css({
            "left": stave.getX() + FLAGLEFTOFFSET + i * FLAGBETWEEN - FLAGWIDTH / 2,
            "top": stave.getY() + FLAGTOPOFFSET + j * LINEBETWEEN - FLAGHEIGHT / 2,
            "height": FLAGHEIGHT,
            "width": FLAGWIDTH
          })
          .appendTo(parentToBe);
        if (boolInclude) {
          flag
            .attr({
              "src": "./img/flags/" + allCountries[i] + "-flag.jpg",
            });
        }
      }
    }
  }
  let parentToBe = $(document.createElement("div"))
    .attr('id', lastName + "-flags")
    .appendTo("#partiture");
  drawFlag("no-flag", parentToBe);
  drawFlag("flag", parentToBe);

  // ==============================================================
  // Draw the connectors
  // ==============================================================

  let conn = new StaveConnector(stave, stave2);
  conn
    .setType(StaveConnector.type.SINGLE_RIGHT)
    .setContext(context)
    .draw();
  conn
    .setType(StaveConnector.type.SINGLE_LEFT)
    .setContext(context)
    .draw();
  conn
    .setType(StaveConnector.type.DOUBLE)
    .setContext(context)
    .draw();

  // ==============================================================
  // Finally: Draw the first stave
  // ==============================================================

  stave.draw();
  stave2.draw();
}

function drawYear(
  y,
  years,
  timespan,
  shows,
  allCountries,
  lastName,
  firstBarX,
  firstBarY
) {
  var allLibrettists = getInformation(dataset, "librettist", true, true);

  // ========================================================================
  // Datafiltering
  // ========================================================================

  var notes = [];
  var notes2 = [];
  let fullYearList = Array.from(new Array(timespan), (x, i) => i + years[0]);

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
  // Create the bar of the current year, depends on page
  // ========================================================================

  let relativeY = (years[0] - STARTYEAR) + y;
  let currentPage = Math.floor(relativeY / BARSPERPAGE);

  let barX = 0;
  let barY = firstBarY; //(STARTY + 2 * DATANUMCOMPOSERS * INTERSTAVEDISTANCE);
  if (currentPage == 0) {
    barX += (y % BARSPERPAGE) * BARWIDTH;
    barX += firstBarX + FIRSTBARWIDTH + (years[0] - STARTYEAR) % BARSPERPAGE * BARWIDTH;
  } else {
    // barX += STARTX;
    barX += firstBarX + FIRSTBARWIDTH + relativeY % BARSPERPAGE * BARWIDTH;
    barY += (DATANUMCOMPOSERS * INTERSTAVEDISTANCE + INTERPAGEDISTANCE) * currentPage;
  }

  stave = new Stave(barX, barY, BARWIDTH);
  stave2 = new Stave(barX, barY + INTRASTAVEDISTANCE, BARWIDTH)
    .setContext(context)
    .draw();

  // ========================================================================
  // Write the years as the bar measure
  // ========================================================================

  if (y == 0 || y == timespan - 1 || fullYearList[y] % 5 == 0) {
    stave
      .setFontSize(YEARFONTSIZE)
      .setMeasure(fullYearList[y]);
  }

  // ========================================================================
  // Write the births and deaths of composer as bar measure
  // ========================================================================

  // nobody dies during their showtime
  if (fullYearList[y] == birthYears[lastName]) {
    let sectionBarline = new StaveConnector(stave, stave2);
    sectionBarline
      .setType(StaveConnector.type.DOUBLE)
      .setContext(context)
      .draw()
    stave.setSection("Birth", 0, 0, BIRTHDEATHFONTSIZE, true);
  }
  if (fullYearList[y] == deathYears[lastName]) {
    let sectionBarline = new StaveConnector(stave, stave2);
    sectionBarline
      .setType(StaveConnector.type.DOUBLE)
      .setContext(context)
      .draw()
    stave.setSection("Death of composer", 0, 0, BIRTHDEATHFONTSIZE, true);
  }

  // ==============================================================
  // Draw the connectors
  // ==============================================================

  new StaveConnector(stave, stave2)
    .setType(StaveConnector.type.SINGLE_RIGHT)
    .setContext(context)
    .draw();

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
    });
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
  stave
    .setContext(context)
    .draw();

  // format stave with notes
  Formatter.FormatAndDraw(context, stave, notes, false);
  Formatter.FormatAndDraw(context, stave2, notes2, false);
  beams.forEach(function (beam) {
    beam
      .setContext(context)
      .draw();
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

// ========================================================================
// Draw the legend of the staves
// ========================================================================

const LEGENDHEIGHT = 750;
// const LEGENDWIDTHPART = 650;

const LEGENDWIDTHSTAVES = 900;
// const LEGENDHEIGHTSTAVES = 750;
const LEGENDWIDTHFLAGS = 450;
// const LEGENDHEIGHTFLAGS = LEGENDHEIGHTSTAVES;
const LEGENDWIDTHMAP = 650;
const LEGENDHEIGHTMAP = 450;
const LEGENDWIDTHTIME = 650;

// ========================================================================
// Setup each renderer for legend parts
// ========================================================================

const legendRenderer = new Renderer($("#legend-staves")[0], Renderer.Backends.SVG);
legendRenderer.resize(LEGENDWIDTHSTAVES, LEGENDHEIGHT);
const ctx = legendRenderer.getContext();

const flagsRenderer = new Renderer($("#legend-flags")[0], Renderer.Backends.SVG);
flagsRenderer.resize(LEGENDWIDTHFLAGS, LEGENDHEIGHT);
const flagsctx = flagsRenderer.getContext();

const mapRenderer = new Renderer($("#legend-map")[0], Renderer.Backends.SVG);
mapRenderer.resize(LEGENDWIDTHMAP, LEGENDHEIGHTMAP);
const mapctx = mapRenderer.getContext();

$(".timeline").each(function(index) {
  new Renderer($(this)[0], Renderer.Backends.SVG)
    .resize(LEGENDWIDTHTIME, LEGENDHEIGHT);
})
// const timeFirstctx = timeFirstRenderer.getContext();

// const timeSecondRenderer = new Renderer($("#legend-time-second")[0], Renderer.Backends.SVG);
// timeSecondRenderer.resize(LEGENDWIDTHTIME, LEGENDHEIGHT);
// const timeSecondctx = timeFirstRenderer.getContext();

function drawLegend() {
  ctx.clear();

  // draw the stave
  let stave = new Stave(
    LEGENDWIDTHSTAVES / 2 - BARWIDTH, -FLAGTOPOFFSET + LEGENDHEIGHT / 2 - 100, BARWIDTH
  );
  stave
    .addTimeSignature("3/4")
    .addClef("treble")
    .setContext(ctx)
    .draw();
  let stave2 = new Stave(
    LEGENDWIDTHSTAVES / 2 - BARWIDTH, -FLAGTOPOFFSET + LEGENDHEIGHT / 2 + 100, BARWIDTH
  );
  stave2
    .addTimeSignature("5/6")
    .addClef("bass")
    .setContext(ctx)
  stave2.setContext(ctx).draw();
  new StaveConnector(stave, stave2)
    .setType(StaveConnector.type.BRACE)
    .setText("composer name", Modifier.Position.LEFT)
    .setFontSize(COMPOSERFONTSIZE)
    .setContext(ctx)
    .draw();

  // draw birthdeath
  let el = $(document)
    .find("text:contains('composer name')")
  let birthDeath = el
    .clone()
    .html("year of birth - year of death")
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
      'href': "img/composers/Mozart.png",
      "x": + el.attr("x") + (el[0].textLength.baseVal.value - IMAGESIZE) / 2,
      "y": + el.attr("y") - parseInt(el.attr("font-size")) - IMAGESIZE
    })
    .appendTo(el.parent());

  // write the legend texts
  function write(text, x, y) {
    let txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.innerHTML = text;
    txt.setAttribute("class", "legend-description");
    txt.setAttribute("x", x);
    txt.setAttribute("y", y);
    ctx.svg.appendChild(txt);
  }

  function drawLine(x, y, boolBelow = true) {
    let length = 17;
    var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    newLine.setAttribute('class', 'line');
    if (boolBelow) {
      newLine.setAttribute('x1', x - length);
      newLine.setAttribute('y1', y - length);
      newLine.setAttribute('x2', x);
      newLine.setAttribute('y2', y - 10);
    } else {
      newLine.setAttribute('x1', x - length);
      newLine.setAttribute('y1', y + length);
      newLine.setAttribute('x2', x);
      newLine.setAttribute('y2', y);
    }
    newLine.setAttribute("stroke", "black")
    ctx.svg.append(newLine);
  }

  let staves = $("#legend svg").children();
  let box1 = staves[0].getBBox();
  let box2 = staves[1].getBBox();

  let leftoff = 80;
  let offset = 20;
  write("# different operas this composer did create", box1.x + leftoff, box1.y - offset);
  drawLine(box1.x + leftoff, box1.y - offset, false)
  write("# librettists this composer worked with", box1.x + leftoff, box1.y + box1.height + offset);
  drawLine(box1.x + leftoff, box1.y + box1.height + offset - 5, true)
  write("# years in which at least one show was performed", box2.x + leftoff, box2.y - offset);
  drawLine(box2.x + leftoff, box2.y - offset, false)
  write("during a timespan of # years", box2.x + leftoff, box2.y + box2.height + offset * 1.5);
  drawLine(box2.x + leftoff, box2.y + box2.height + offset * 1.25, true)

  // ========================================================================
  // Draw the legend of the flags
  // ========================================================================

  flagsctx.clear();

  function drawLineFlags(x, y) {
    let length = 1000;
    var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    newLine.setAttribute('class', 'line');
    newLine.setAttribute('x1', x);
    newLine.setAttribute('y1', y);
    newLine.setAttribute('x2', x + length);
    newLine.setAttribute('y2', y);
    newLine.setAttribute("stroke", "black")
    flagsctx.svg.append(newLine);
  }

  const allCountries = ["Italien", "Deutschland", "Oesterreich", "Russland", "Frankreich", "Polen", "Tschechien", "England", "Niederlande", "Malta"];
  const drawFlag = (className, parentToBe) => {
    let flag;
    for (let i = 0; i < allCountries.length; i++) {
      // create one empty flag element
      let j;
      if (DESCENDINGFLAGS) {
        j = 9 - countryNoteOrder[i];
      } else {
        j = countryNoteOrder[i];
      }
      flag = $(document.createElement("img"));
      let pos = $("#legend-flags div").position();
      let flagX = FLAGLEFTOFFSET + i * (FLAGBETWEEN + 10) - FLAGWIDTH / 2;
      let flagY = FLAGTOPOFFSET + j * LINEBETWEEN - FLAGHEIGHT / 2 + LEGENDHEIGHT / 2 - FLAGTOPOFFSET * 1.5;
      flag
        .addClass(className)
        .css({
          "left": pos.left + flagX,
          "top": pos.top + flagY,
          "height": FLAGHEIGHT,
          "width": FLAGWIDTH,
          "position": "absolute"
        })
        .appendTo(parentToBe)
        .attr({
          "src": "./img/flags/" + allCountries[i] + "-flag.jpg",
        });
      drawLineFlags(flagX + 10, flagY + FLAGHEIGHT / 2);
    }
  }
  drawFlag("flag", $("#flags"));

  // ========================================================================
  // Draw the legend of the map
  // ========================================================================

  function drawMapLine(x, y, x2 = 1000, y2 = y) {
    var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    newLine.setAttribute('class', 'line');
    newLine.setAttribute('x1', x);
    newLine.setAttribute('y1', y);
    newLine.setAttribute('x2', x2);
    newLine.setAttribute('y2', y2);
    newLine.setAttribute("stroke", "black")
    mapctx.svg.append(newLine);
  }
  for (let l in latitudeMap) {
    drawMapLine(0, latitudeMapBeginning[l], lineBeg, latitudeMap[l]);
    drawMapLine(lineBeg, latitudeMap[l], lengthMap[l]);
  }
}

export { drawPartiture, drawLegend };